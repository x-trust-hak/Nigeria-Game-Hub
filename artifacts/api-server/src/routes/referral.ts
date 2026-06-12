import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { getSetting } from "../lib/settings";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const rewardPerReferral = parseFloat(await getSetting("referralReward"));

    const milestones = [
      { target: 5, reward: 5000, achieved: user.totalReferrals >= 5 },
      { target: 10, reward: 15000, achieved: user.totalReferrals >= 10 },
      { target: 25, reward: 50000, achieved: user.totalReferrals >= 25 },
      { target: 50, reward: 150000, achieved: user.totalReferrals >= 50 },
    ];

    const referralTxns = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id));
    const referralEarnings = referralTxns
      .filter(t => t.type === "referral" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    res.json({
      referralCode: user.referralCode,
      totalReferrals: user.totalReferrals,
      totalEarnings: referralEarnings,
      pendingEarnings: parseFloat(user.referralBalance),
      rewardPerReferral,
      milestones,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get referral info" });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const referrals = await db.select().from(usersTable)
      .where(eq(usersTable.referredBy, user.id))
      .orderBy(desc(usersTable.createdAt));

    const rewardPerReferral = parseFloat(await getSetting("referralReward"));

    res.json(referrals.map((r, i) => ({
      id: i + 1,
      referredUsername: r.username,
      reward: rewardPerReferral,
      status: "credited",
      createdAt: r.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get referral history" });
  }
});

router.get("/rankings", async (req, res) => {
  try {
    const users = await db.select().from(usersTable)
      .where(eq(usersTable.isSuspended, false))
      .orderBy(desc(usersTable.totalReferrals))
      .limit(20);

    res.json(users.filter(u => u.totalReferrals > 0).map((u, i) => ({
      rank: i + 1,
      username: u.username,
      avatarUrl: u.avatarUrl,
      totalReferrals: u.totalReferrals,
      totalEarnings: parseFloat(u.referralBalance),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get referral rankings" });
  }
});

export default router;
