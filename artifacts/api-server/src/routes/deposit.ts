import { Router } from "express";
import { db, depositsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { getSetting } from "../lib/settings";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const deposits = await db.select().from(depositsTable)
      .where(eq(depositsTable.userId, user.id))
      .orderBy(desc(depositsTable.createdAt));
    res.json(deposits.map(d => ({
      ...d,
      amount: parseFloat(d.amount),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get deposits" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { amount, proofUrl, notes } = req.body;
    if (!amount || amount < 1000) {
      res.status(400).json({ error: "Minimum deposit is ₦1,000" });
      return;
    }

    const accountName = await getSetting("depositAccountName");
    const accountNumber = await getSetting("depositAccountNumber");
    const bankName = await getSetting("depositBankName");

    const [deposit] = await db.insert(depositsTable).values({
      userId: user.id,
      amount: amount.toString(),
      status: "pending",
      accountName,
      accountNumber,
      bankName,
      proofUrl: proofUrl || null,
      notes: notes || null,
    }).returning();

    res.status(201).json({
      ...deposit,
      amount: parseFloat(deposit.amount),
      createdAt: deposit.createdAt.toISOString(),
      updatedAt: deposit.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create deposit" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [deposit] = await db.select().from(depositsTable)
      .where(eq(depositsTable.id, Number(req.params.id))).limit(1);
    if (!deposit || deposit.userId !== user.id) {
      res.status(404).json({ error: "Deposit not found" });
      return;
    }
    res.json({ ...deposit, amount: parseFloat(deposit.amount), createdAt: deposit.createdAt.toISOString(), updatedAt: deposit.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get deposit" });
  }
});

export default router;
