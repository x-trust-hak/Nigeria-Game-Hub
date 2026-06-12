import { Router } from "express";
import { db, withdrawalsTable, membershipPurchasesTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const withdrawals = await db.select().from(withdrawalsTable)
      .where(eq(withdrawalsTable.userId, user.id))
      .orderBy(desc(withdrawalsTable.createdAt));
    res.json(withdrawals.map(w => ({
      ...w,
      amount: parseFloat(w.amount),
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get withdrawals" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { amount, bankName, accountNumber, accountName } = req.body;

    const now = new Date();
    const memberships = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id));
    const hasActiveMembership = memberships.some(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );

    if (!hasActiveMembership) {
      res.status(403).json({ error: "Premium membership required to withdraw" });
      return;
    }

    if (!amount || amount < 500) {
      res.status(400).json({ error: "Minimum withdrawal is ₦500" });
      return;
    }

    if (parseFloat(user.walletBalance) < amount) {
      res.status(400).json({ error: "Insufficient wallet balance" });
      return;
    }

    const [withdrawal] = await db.insert(withdrawalsTable).values({
      userId: user.id,
      amount: amount.toString(),
      status: "pending",
      bankName,
      accountNumber,
      accountName,
    }).returning();

    await db.update(usersTable)
      .set({ walletBalance: (parseFloat(user.walletBalance) - amount).toString() })
      .where(eq(usersTable.id, user.id));

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "withdrawal",
      amount: amount.toString(),
      status: "pending",
      description: `Withdrawal to ${bankName}`,
    });

    res.status(201).json({
      ...withdrawal,
      amount: parseFloat(withdrawal.amount),
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create withdrawal" });
  }
});

export default router;
