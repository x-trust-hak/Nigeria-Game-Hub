import { Router } from "express";
import { db, gamesTable, gamePlaysTable, usersTable, transactionsTable, membershipPurchasesTable } from "@workspace/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

const MIN_BET = 100;
const MAX_BET = 50000;

// Win multiplier tiers — higher multiplier = rarer
const MULTIPLIERS = [
  { mult: 1.5, weight: 40 },
  { mult: 2.0, weight: 30 },
  { mult: 3.0, weight: 18 },
  { mult: 5.0, weight: 8 },
  { mult: 8.0, weight: 3 },
  { mult: 10.0, weight: 1 },
];

function pickMultiplier(): number {
  const total = MULTIPLIERS.reduce((s, m) => s + m.weight, 0);
  let r = Math.random() * total;
  for (const m of MULTIPLIERS) {
    r -= m.weight;
    if (r <= 0) return m.mult;
  }
  return 1.5;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const games = await db.select().from(gamesTable);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPlays = await db.select().from(gamePlaysTable)
      .where(and(eq(gamePlaysTable.userId, user.id), gte(gamePlaysTable.createdAt, today)));

    res.json(games.map(g => {
      const playsToday = todayPlays.filter(p => p.gameId === g.id).length;
      return {
        ...g,
        minReward: parseFloat(g.minReward),
        maxReward: parseFloat(g.maxReward),
        premiumMultiplier: parseFloat(g.premiumMultiplier),
        playsToday,
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get games" });
  }
});

router.post("/:id/play", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const gameId = Number(req.params.id);
    const betAmount = Number(req.body?.bet ?? 100);

    // Validate bet
    if (isNaN(betAmount) || betAmount < MIN_BET) {
      res.status(400).json({ error: `Minimum bet is ₦${MIN_BET.toLocaleString()}` });
      return;
    }
    if (betAmount > MAX_BET) {
      res.status(400).json({ error: `Maximum bet is ₦${MAX_BET.toLocaleString()}` });
      return;
    }

    // Fresh user record
    const [freshUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    if (!freshUser) { res.status(404).json({ error: "User not found" }); return; }

    const walletBalance = parseFloat(freshUser.walletBalance);
    if (walletBalance < betAmount) {
      res.status(400).json({ error: `Insufficient balance. You have ₦${walletBalance.toLocaleString()} but need ₦${betAmount.toLocaleString()}` });
      return;
    }

    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
    if (!game || !game.isEnabled) {
      res.status(404).json({ error: "Game not found or disabled" });
      return;
    }

    // Daily limit check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlays = await db.select().from(gamePlaysTable)
      .where(and(eq(gamePlaysTable.userId, user.id), eq(gamePlaysTable.gameId, gameId), gte(gamePlaysTable.createdAt, today)));

    if (todayPlays.length >= game.dailyLimit) {
      res.status(403).json({ error: `Daily limit of ${game.dailyLimit} plays reached for this game` });
      return;
    }

    // Premium check
    if (game.isPremium) {
      const now = new Date();
      const memberships = await db.select().from(membershipPurchasesTable)
        .where(eq(membershipPurchasesTable.userId, user.id));
      const hasActive = memberships.some(m =>
        m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
      );
      if (!hasActive) {
        res.status(403).json({ error: "Premium membership required for this game" });
        return;
      }
    }

    // Membership bonus multiplier
    const now = new Date();
    const memberships = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id));
    const hasActiveMembership = memberships.some(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );
    const memberMultiplier = hasActiveMembership ? parseFloat(game.premiumMultiplier) : 1;

    // --- BET-BASED ECONOMY ---
    // 1. Deduct bet from walletBalance immediately
    const balanceAfterBet = walletBalance - betAmount;
    await db.update(usersTable)
      .set({ walletBalance: balanceAfterBet.toString() })
      .where(eq(usersTable.id, freshUser.id));

    // Record bet debit transaction
    await db.insert(transactionsTable).values({
      userId: freshUser.id,
      type: "game",
      amount: (-betAmount).toString(),
      status: "completed",
      description: `Bet ₦${betAmount.toLocaleString()} on ${game.name}`,
    });

    // 2. Determine win/lose (35% base win chance)
    const winChance = 0.35;
    const won = Math.random() < winChance;

    let reward = 0;
    let winMultiplier = 0;

    if (won) {
      winMultiplier = pickMultiplier() * memberMultiplier;
      reward = Math.round(betAmount * winMultiplier);

      // Credit winnings to walletBalance
      const newBalance = balanceAfterBet + reward;
      await db.update(usersTable)
        .set({ walletBalance: newBalance.toString() })
        .where(eq(usersTable.id, freshUser.id));

      // Record win credit transaction
      await db.insert(transactionsTable).values({
        userId: freshUser.id,
        type: "game",
        amount: reward.toString(),
        status: "completed",
        description: `Won ₦${reward.toLocaleString()} (${winMultiplier.toFixed(1)}×) on ${game.name}`,
      });
    }

    // Record game play
    const [play] = await db.insert(gamePlaysTable).values({
      userId: freshUser.id,
      gameId: game.id,
      gameName: game.name,
      won,
      reward: reward.toString(),
    }).returning();

    // Update counters
    await db.update(gamesTable).set({ totalPlays: game.totalPlays + 1 }).where(eq(gamesTable.id, gameId));
    await db.update(usersTable).set({ gamesPlayed: (freshUser.gamesPlayed ?? 0) + 1 }).where(eq(usersTable.id, freshUser.id));

    const netGain = won ? reward - betAmount : -betAmount;

    const messages = won
      ? [
          `🎉 You won ₦${reward.toLocaleString()}! (${winMultiplier.toFixed(1)}×)`,
          `🏆 Lucky! +₦${reward.toLocaleString()} added to your wallet!`,
          `💰 ${winMultiplier.toFixed(1)}× win! ₦${reward.toLocaleString()} is yours!`,
        ]
      : [
          "😔 Better luck next time!",
          "Try again — the next spin could be yours!",
          "Keep playing to win big! 💪",
        ];

    const message = messages[Math.floor(Math.random() * messages.length)];

    res.json({
      won,
      reward,
      netGain,
      multiplier: winMultiplier,
      betAmount,
      message,
      gamePlayId: play.id,
      newBalance: won ? balanceAfterBet + reward : balanceAfterBet,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to play game" });
  }
});

router.get("/:id/history", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const gameId = Number(req.params.id);
    const plays = await db.select().from(gamePlaysTable)
      .where(and(eq(gamePlaysTable.userId, user.id), eq(gamePlaysTable.gameId, gameId)))
      .orderBy(desc(gamePlaysTable.createdAt)).limit(20);
    res.json(plays.map(p => ({
      ...p,
      reward: parseFloat(p.reward),
      createdAt: p.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get game history" });
  }
});

export default router;
