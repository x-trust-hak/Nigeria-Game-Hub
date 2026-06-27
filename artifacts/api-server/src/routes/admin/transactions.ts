import { Router } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, like, and, or } from "drizzle-orm";
import { requireAdmin } from "../../lib/auth";

const router = Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const all = await db
      .select({
        id: transactionsTable.id,
        userId: transactionsTable.userId,
        username: usersTable.username,
        email: usersTable.email,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        status: transactionsTable.status,
        description: transactionsTable.description,
        createdAt: transactionsTable.createdAt,
      })
      .from(transactionsTable)
      .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .orderBy(desc(transactionsTable.createdAt));

    let filtered = all;

    if (type && type !== "all") {
      filtered = filtered.filter(t => t.type === type);
    }
    if (status && status !== "all") {
      filtered = filtered.filter(t => t.status === status);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(t =>
        t.username?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + Number(limit));

    const totalCredit = filtered.filter(t => parseFloat(t.amount) > 0).reduce((s, t) => s + parseFloat(t.amount), 0);
    const totalDebit = filtered.filter(t => parseFloat(t.amount) < 0).reduce((s, t) => s + parseFloat(t.amount), 0);

    res.json({
      transactions: paginated.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      summary: { totalCredit, totalDebit: Math.abs(totalDebit) },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

export default router;
