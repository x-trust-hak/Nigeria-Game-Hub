import { Router } from "express";
import { db, usersTable, transactionsTable, gamePlaysTable, membershipPurchasesTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const memberships = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id))
      .orderBy(desc(membershipPurchasesTable.createdAt)).limit(10);

    const activeMem = memberships.find(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );
    const pendingMem = memberships.find(m => m.status === "pending");

    let membershipStatus: any = { isActive: false, isPending: false, planName: null, expiresAt: null, daysRemaining: null, hoursRemaining: null };
    if (activeMem) {
      const exp = new Date(activeMem.expiresAt!);
      const diffMs = exp.getTime() - now.getTime();
      const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      membershipStatus = {
        isActive: true, isPending: false,
        planName: activeMem.planName,
        expiresAt: activeMem.expiresAt?.toISOString(),
        daysRemaining, hoursRemaining,
      };
    } else if (pendingMem) {
      membershipStatus = { isActive: false, isPending: true, planName: pendingMem.planName, expiresAt: null, daysRemaining: null, hoursRemaining: null };
    }

    const recentTransactions = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id))
      .orderBy(desc(transactionsTable.createdAt)).limit(5);

    const recentWins = await db.select().from(gamePlaysTable)
      .where(eq(gamePlaysTable.won, true))
      .orderBy(desc(gamePlaysTable.createdAt)).limit(5);

    const latestWinners = recentWins.map(w => ({
      userId: w.userId,
      username: "Player" + w.userId,
      avatarUrl: null,
      amount: parseFloat(w.reward),
      gameName: w.gameName,
      wonAt: w.createdAt.toISOString(),
    }));

    const dailyMissions = [
      { id: 1, title: "Play 3 Games", description: "Play any 3 games today", reward: 500, type: "daily", target: 3, progress: Math.min(user.gamesPlayed, 3), isCompleted: user.gamesPlayed >= 3 },
      { id: 2, title: "Daily Login", description: "Login to earn your daily bonus", reward: 100, type: "daily", target: 1, progress: 1, isCompleted: true },
      { id: 3, title: "Refer a Friend", description: "Invite one friend to join Play9ja", reward: 7500, type: "daily", target: 1, progress: Math.min(user.totalReferrals, 1), isCompleted: user.totalReferrals >= 1 },
    ];

    const announcements = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.isBroadcast, true), eq(notificationsTable.isRead, false)))
      .orderBy(desc(notificationsTable.createdAt)).limit(3);

    const wallet = {
      total: parseFloat(user.walletBalance) + parseFloat(user.referralBalance) + parseFloat(user.gameBalance),
      withdrawable: parseFloat(user.walletBalance),
      referral: parseFloat(user.referralBalance),
      game: parseFloat(user.gameBalance),
      pending: parseFloat(user.pendingBalance),
    };

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      user: {
        ...safeUser,
        walletBalance: parseFloat(user.walletBalance),
        referralBalance: parseFloat(user.referralBalance),
        gameBalance: parseFloat(user.gameBalance),
        pendingBalance: parseFloat(user.pendingBalance),
        membershipStatus: membershipStatus.isActive ? "active" : membershipStatus.isPending ? "pending" : null,
        membershipExpiresAt: membershipStatus.expiresAt ?? null,
      },
      wallet,
      membership: membershipStatus,
      recentTransactions: recentTransactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        createdAt: t.createdAt.toISOString(),
      })),
      latestWinners,
      dailyMissions,
      announcements: announcements.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
