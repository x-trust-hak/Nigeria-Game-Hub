import { Router } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/balance", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      total: parseFloat(user.walletBalance) + parseFloat(user.referralBalance) + parseFloat(user.gameBalance),
      withdrawable: parseFloat(user.walletBalance),
      referral: parseFloat(user.referralBalance),
      game: parseFloat(user.gameBalance),
      pending: parseFloat(user.pendingBalance),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get balance" });
  }
});

router.get("/transactions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { type, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id));

    const all = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id))
      .orderBy(desc(transactionsTable.createdAt));

    let filtered = all;
    if (type && type !== "all") {
      filtered = filtered.filter(t => t.type === type);
    }
    if (status && status !== "all") {
      filtered = filtered.filter(t => t.status === status);
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + Number(limit));

    res.json({
      transactions: paginated.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

export default router;
