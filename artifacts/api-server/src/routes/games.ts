import { Router } from "express";
import { db, gamesTable, gamePlaysTable, usersTable, transactionsTable, membershipPurchasesTable } from "@workspace/db";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

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

    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
    if (!game || !game.isEnabled) {
      res.status(404).json({ error: "Game not found or disabled" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlays = await db.select().from(gamePlaysTable)
      .where(and(eq(gamePlaysTable.userId, user.id), eq(gamePlaysTable.gameId, gameId), gte(gamePlaysTable.createdAt, today)));

    if (todayPlays.length >= game.dailyLimit) {
      res.status(403).json({ error: `Daily limit of ${game.dailyLimit} plays reached for this game` });
      return;
    }

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

    const winChance = 0.35;
    const won = Math.random() < winChance;

    const now = new Date();
    const memberships = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id));
    const hasActiveMembership = memberships.some(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );

    const multiplier = hasActiveMembership ? parseFloat(game.premiumMultiplier) : 1;
    const min = parseFloat(game.minReward);
    const max = parseFloat(game.maxReward);
    const baseReward = won ? (Math.random() * (max - min) + min) : 0;
    const reward = Math.round(baseReward * multiplier);

    const [play] = await db.insert(gamePlaysTable).values({
      userId: user.id,
      gameId: game.id,
      gameName: game.name,
      won,
      reward: reward.toString(),
    }).returning();

    await db.update(gamesTable).set({ totalPlays: game.totalPlays + 1 }).where(eq(gamesTable.id, gameId));
    await db.update(usersTable).set({ gamesPlayed: user.gamesPlayed + 1 }).where(eq(usersTable.id, user.id));

    if (won && reward > 0) {
      const newBalance = parseFloat(user.gameBalance) + reward;
      await db.update(usersTable).set({ gameBalance: newBalance.toString() }).where(eq(usersTable.id, user.id));
      await db.insert(transactionsTable).values({
        userId: user.id,
        type: "game",
        amount: reward.toString(),
        status: "completed",
        description: `Won ₦${reward.toLocaleString()} playing ${game.name}`,
      });
    }

    const messages = {
      won: [`You won ₦${reward.toLocaleString()}! 🎉`, `Lucky strike! +₦${reward.toLocaleString()}`, `Amazing win on ${game.name}!`],
      lost: ["Better luck next time!", "Try again, you're close!", "Keep playing to win big!"],
    };

    const msgArr = won ? messages.won : messages.lost;
    const message = msgArr[Math.floor(Math.random() * msgArr.length)];

    res.json({
      won,
      reward,
      message,
      gamePlayId: play.id,
      animation: won ? "confetti" : "shake",
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
