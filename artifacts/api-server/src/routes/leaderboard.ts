import { Router } from "express";
import { db, usersTable, gamePlaysTable, membershipPurchasesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const users = await db.select().from(usersTable)
      .where(eq(usersTable.isSuspended, false))
      .orderBy(desc(usersTable.gamesPlayed))
      .limit(50);

    const now = new Date();
    const leaderboard = await Promise.all(users.map(async (u, i) => {
      const plays = await db.select().from(gamePlaysTable)
        .where(eq(gamePlaysTable.userId, u.id));
      const wins = plays.filter(p => p.won).length;
      const totalRewards = plays.reduce((sum, p) => sum + parseFloat(p.reward), 0);

      const memberships = await db.select().from(membershipPurchasesTable)
        .where(eq(membershipPurchasesTable.userId, u.id));
      const isMember = memberships.some(m =>
        m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
      );

      return {
        rank: i + 1,
        userId: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        totalWins: wins,
        totalGames: u.gamesPlayed,
        totalRewards,
        country: "Nigeria",
        isMember,
      };
    }));

    res.json(leaderboard.sort((a, b) => b.totalRewards - a.totalRewards).map((e, i) => ({ ...e, rank: i + 1 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get leaderboard" });
  }
});

router.get("/latest-winners", async (req, res) => {
  try {
    const recentWins = await db.select().from(gamePlaysTable)
      .where(eq(gamePlaysTable.won, true))
      .orderBy(desc(gamePlaysTable.createdAt)).limit(10);

    const winners = await Promise.all(recentWins.map(async w => {
      const [u] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
      return {
        userId: w.userId,
        username: u?.username ?? "Anonymous",
        avatarUrl: u?.avatarUrl ?? null,
        amount: parseFloat(w.reward),
        gameName: w.gameName,
        wonAt: w.createdAt.toISOString(),
      };
    }));

    res.json(winners);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get latest winners" });
  }
});

export default router;
