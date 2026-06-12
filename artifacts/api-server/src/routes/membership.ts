import { Router } from "express";
import { db, membershipPlansTable, membershipPurchasesTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/plans", async (req, res) => {
  try {
    const plans = await db.select().from(membershipPlansTable)
      .where(eq(membershipPlansTable.isActive, true));
    res.json(plans.map(p => ({
      ...p,
      price: parseFloat(p.price),
      benefits: JSON.parse(p.benefits),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get plans" });
  }
});

router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const now = new Date();
    const memberships = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id))
      .orderBy(desc(membershipPurchasesTable.createdAt));

    const activeMem = memberships.find(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );
    const pendingMem = memberships.find(m => m.status === "pending");

    if (activeMem) {
      const exp = new Date(activeMem.expiresAt!);
      const diffMs = exp.getTime() - now.getTime();
      const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      res.json({
        isActive: true, isPending: false,
        planName: activeMem.planName,
        expiresAt: activeMem.expiresAt?.toISOString(),
        daysRemaining, hoursRemaining,
      });
    } else if (pendingMem) {
      res.json({ isActive: false, isPending: true, planName: pendingMem.planName, expiresAt: null, daysRemaining: null, hoursRemaining: null });
    } else {
      res.json({ isActive: false, isPending: false, planName: null, expiresAt: null, daysRemaining: null, hoursRemaining: null });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get membership status" });
  }
});

router.post("/purchase", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { planId, proofUrl } = req.body;

    const [plan] = await db.select().from(membershipPlansTable)
      .where(eq(membershipPlansTable.id, Number(planId))).limit(1);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const [purchase] = await db.insert(membershipPurchasesTable).values({
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      status: "pending",
      proofUrl: proofUrl || null,
    }).returning();

    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "membership",
      title: "Membership Request Submitted",
      message: `Your ${plan.name} membership request is pending approval. We'll notify you once approved.`,
      isRead: false,
    });

    res.status(201).json({
      ...purchase,
      amount: parseFloat(purchase.amount),
      createdAt: purchase.createdAt.toISOString(),
      updatedAt: purchase.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit membership purchase" });
  }
});

export default router;
