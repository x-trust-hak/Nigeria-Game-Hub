import { Router } from "express";
import { db, usersTable, membershipPurchasesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    const activeMembership = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id))
      .orderBy(membershipPurchasesTable.createdAt)
      .limit(10);

    const now = new Date();
    const activeMem = activeMembership.find(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );
    const pendingMem = activeMembership.find(m => m.status === "pending");

    let membershipStatus: string | null = null;
    let membershipExpiresAt: string | null = null;

    if (activeMem) {
      membershipStatus = "active";
      membershipExpiresAt = activeMem.expiresAt?.toISOString() ?? null;
    } else if (pendingMem) {
      membershipStatus = "pending";
    }

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      ...safeUser,
      walletBalance: parseFloat(user.walletBalance),
      referralBalance: parseFloat(user.referralBalance),
      gameBalance: parseFloat(user.gameBalance),
      pendingBalance: parseFloat(user.pendingBalance),
      membershipStatus,
      membershipExpiresAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { username, avatarUrl } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (username) updates.username = username;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const [updated] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, user.id))
      .returning();

    const { passwordHash: _, ...safeUser } = updated;

    const activeMembership = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.userId, user.id))
      .orderBy(membershipPurchasesTable.createdAt)
      .limit(10);

    const now = new Date();
    const activeMem = activeMembership.find(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    );
    const pendingMem = activeMembership.find(m => m.status === "pending");

    let membershipStatus: string | null = null;
    let membershipExpiresAt: string | null = null;
    if (activeMem) {
      membershipStatus = "active";
      membershipExpiresAt = activeMem.expiresAt?.toISOString() ?? null;
    } else if (pendingMem) {
      membershipStatus = "pending";
    }

    res.json({
      ...safeUser,
      walletBalance: parseFloat(updated.walletBalance),
      referralBalance: parseFloat(updated.referralBalance),
      gameBalance: parseFloat(updated.gameBalance),
      pendingBalance: parseFloat(updated.pendingBalance),
      membershipStatus,
      membershipExpiresAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
