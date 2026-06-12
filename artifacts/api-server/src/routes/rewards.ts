import { Router } from "express";
import { db, dailyRewardClaimsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

const DAILY_REWARDS = [
  { day: 1, amount: 150 }, { day: 2, amount: 200 }, { day: 3, amount: 250 },
  { day: 4, amount: 300 }, { day: 5, amount: 400 }, { day: 6, amount: 500 },
  { day: 7, amount: 750, isBonus: true, bonusLabel: "Weekly Bonus" },
  { day: 8, amount: 200 }, { day: 9, amount: 250 }, { day: 10, amount: 300 },
  { day: 11, amount: 350 }, { day: 12, amount: 400 }, { day: 13, amount: 500 },
  { day: 14, amount: 1000, isBonus: true, bonusLabel: "2-Week Bonus" },
  { day: 15, amount: 250 }, { day: 16, amount: 300 }, { day: 17, amount: 350 },
  { day: 18, amount: 400 }, { day: 19, amount: 450 }, { day: 20, amount: 550 },
  { day: 21, amount: 1500, isBonus: true, bonusLabel: "3-Week Bonus" },
  { day: 22, amount: 300 }, { day: 23, amount: 350 }, { day: 24, amount: 400 },
  { day: 25, amount: 450 }, { day: 26, amount: 500 }, { day: 27, amount: 600 },
  { day: 28, amount: 2000, isBonus: true, bonusLabel: "4-Week Bonus" },
  { day: 29, amount: 500 }, { day: 30, amount: 5000, isBonus: true, bonusLabel: "Monthly Jackpot" },
];

router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const allClaims = await db.select().from(dailyRewardClaimsTable)
      .where(eq(dailyRewardClaimsTable.userId, user.id))
      .orderBy(desc(dailyRewardClaimsTable.claimedAt));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const claimedToday = allClaims.find(c => {
      const claimed = new Date(c.claimedAt);
      claimed.setHours(0, 0, 0, 0);
      return claimed.getTime() === today.getTime();
    });

    const canClaim = !claimedToday;
    const currentStreak = user.dailyStreak;
    const nextClaimAt = canClaim ? null : tomorrow.toISOString();

    const claimedDays = new Set(allClaims.map(c => c.day));

    const rewards = DAILY_REWARDS.map(r => ({
      day: r.day,
      amount: r.amount,
      isClaimed: claimedDays.has(r.day),
      isBonus: r.isBonus ?? false,
      bonusLabel: r.bonusLabel ?? null,
    }));

    res.json({
      currentStreak,
      canClaim,
      nextClaimAt,
      rewards,
      lastClaimedAt: allClaims[0]?.claimedAt.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get daily reward status" });
  }
});

router.post("/claim", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allClaims = await db.select().from(dailyRewardClaimsTable)
      .where(eq(dailyRewardClaimsTable.userId, user.id))
      .orderBy(desc(dailyRewardClaimsTable.claimedAt));

    const claimedToday = allClaims.find(c => {
      const claimed = new Date(c.claimedAt);
      claimed.setHours(0, 0, 0, 0);
      return claimed.getTime() === today.getTime();
    });

    if (claimedToday) {
      res.status(400).json({ error: "Daily reward already claimed today" });
      return;
    }

    const newStreak = user.dailyStreak + 1;
    const dayIndex = ((newStreak - 1) % 30);
    const reward = DAILY_REWARDS[dayIndex];
    const day = reward.day;

    await db.insert(dailyRewardClaimsTable).values({
      userId: user.id,
      day,
      amount: reward.amount.toString(),
    });

    await db.update(usersTable).set({
      dailyStreak: newStreak,
      walletBalance: (parseFloat(user.walletBalance) + reward.amount).toString(),
    }).where(eq(usersTable.id, user.id));

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "reward",
      amount: reward.amount.toString(),
      status: "completed",
      description: `Day ${day} Daily Reward${reward.isBonus ? " (Bonus)" : ""}`,
    });

    res.json({
      day,
      amount: reward.amount,
      newStreak,
      isBonus: reward.isBonus ?? false,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to claim daily reward" });
  }
});

export default router;
