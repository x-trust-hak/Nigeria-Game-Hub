import { Router } from "express";
import {
  db, usersTable, membershipPurchasesTable, depositsTable,
  withdrawalsTable, gamesTable, notificationsTable, activityMessagesTable,
  transactionsTable, gamePlaysTable
} from "@workspace/db";
import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { getSetting, getSettings, setSetting } from "../lib/settings";

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// Stats
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const now = new Date();

    const allUsers = await db.select().from(usersTable);
    const allMemberships = await db.select().from(membershipPurchasesTable);
    const allDeposits = await db.select().from(depositsTable);
    const allWithdrawals = await db.select().from(withdrawalsTable);
    const allPlays = await db.select().from(gamePlaysTable);

    const todayUsers = allUsers.filter(u => new Date(u.createdAt) >= today).length;
    const premiumUsers = allMemberships.filter(m =>
      m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
    ).length;
    const pendingMemberships = allMemberships.filter(m => m.status === "pending").length;
    const pendingDeposits = allDeposits.filter(d => d.status === "pending").length;
    const pendingWithdrawals = allWithdrawals.filter(w => w.status === "pending").length;
    const totalRevenue = allMemberships
      .filter(m => m.status === "approved")
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const gamesPlayedToday = allPlays.filter(p => new Date(p.createdAt) >= today).length;
    const totalReferrals = allUsers.reduce((sum, u) => sum + u.totalReferrals, 0);

    const dailyIncome = allMemberships
      .filter(m => m.status === "approved" && new Date(m.createdAt) >= today)
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const monthlyIncome = allMemberships
      .filter(m => m.status === "approved" && new Date(m.createdAt) >= monthStart)
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    res.json({
      totalUsers: allUsers.length,
      todayUsers,
      onlineUsers: Math.floor(allUsers.length * 0.1),
      premiumUsers,
      pendingMemberships,
      pendingDeposits,
      pendingWithdrawals,
      totalRevenue,
      gamesPlayedToday,
      totalReferrals,
      dailyIncome,
      monthlyIncome,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

// Users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let allUsers = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    if (search) {
      const q = String(search).toLowerCase();
      allUsers = allUsers.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const total = allUsers.length;
    const paginated = allUsers.slice(offset, offset + Number(limit));

    const now = new Date();
    const memberships = await db.select().from(membershipPurchasesTable);

    const users = paginated.map(u => {
      const activeMem = memberships.find(m =>
        m.userId === u.id && m.status === "approved" && m.expiresAt && new Date(m.expiresAt) > now
      );
      const pendingMem = memberships.find(m => m.userId === u.id && m.status === "pending");
      return {
        ...u,
        passwordHash: undefined,
        walletBalance: parseFloat(u.walletBalance),
        referralBalance: parseFloat(u.referralBalance),
        gameBalance: parseFloat(u.gameBalance),
        pendingBalance: parseFloat(u.pendingBalance),
        membershipStatus: activeMem ? "active" : pendingMem ? "pending" : null,
        membershipExpiresAt: activeMem?.expiresAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      };
    });

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get users" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { username, isSuspended, walletBalance, referralBalance, gameBalance, role } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (username !== undefined) updates.username = username;
    if (isSuspended !== undefined) updates.isSuspended = isSuspended;
    if (walletBalance !== undefined) updates.walletBalance = walletBalance.toString();
    if (referralBalance !== undefined) updates.referralBalance = referralBalance.toString();
    if (gameBalance !== undefined) updates.gameBalance = gameBalance.toString();
    if (role !== undefined) updates.role = role;

    const [updated] = await db.update(usersTable).set(updates)
      .where(eq(usersTable.id, Number(req.params.id))).returning();
    const { passwordHash: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Memberships
router.get("/memberships", async (req, res) => {
  try {
    const memberships = await db.select().from(membershipPurchasesTable).orderBy(desc(membershipPurchasesTable.createdAt));
    res.json(memberships.map(m => ({
      ...m,
      amount: parseFloat(m.amount),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      expiresAt: m.expiresAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get memberships" });
  }
});

router.patch("/memberships/:id", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [purchase] = await db.select().from(membershipPurchasesTable)
      .where(eq(membershipPurchasesTable.id, Number(req.params.id))).limit(1);
    if (!purchase) { res.status(404).json({ error: "Not found" }); return; }

    let expiresAt: Date | undefined;
    if (status === "approved") {
      const planMap: Record<string, number> = { Weekly: 7, Monthly: 30, Yearly: 365 };
      const days = planMap[purchase.planName] ?? 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const [updated] = await db.update(membershipPurchasesTable)
      .set({ status, notes: notes || null, expiresAt: expiresAt || null, updatedAt: new Date() })
      .where(eq(membershipPurchasesTable.id, Number(req.params.id))).returning();

    if (status === "approved") {
      await db.insert(notificationsTable).values({
        userId: purchase.userId,
        type: "membership",
        title: "Membership Activated!",
        message: `Your ${purchase.planName} membership has been approved and is now active!`,
        isRead: false,
      });
    } else if (status === "declined") {
      await db.insert(notificationsTable).values({
        userId: purchase.userId,
        type: "membership",
        title: "Membership Request Declined",
        message: `Your ${purchase.planName} membership request was declined. ${notes ? "Reason: " + notes : "Please contact support."}`,
        isRead: false,
      });
    }

    res.json({ ...updated, amount: parseFloat(updated.amount), createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(), expiresAt: updated.expiresAt?.toISOString() ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update membership" });
  }
});

// Deposits
router.get("/deposits", async (req, res) => {
  try {
    const deposits = await db.select().from(depositsTable).orderBy(desc(depositsTable.createdAt));
    res.json(deposits.map(d => ({ ...d, amount: parseFloat(d.amount), createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get deposits" });
  }
});

router.patch("/deposits/:id", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [deposit] = await db.select().from(depositsTable)
      .where(eq(depositsTable.id, Number(req.params.id))).limit(1);
    if (!deposit) { res.status(404).json({ error: "Not found" }); return; }

    const [updated] = await db.update(depositsTable)
      .set({ status, notes: notes || null, updatedAt: new Date() })
      .where(eq(depositsTable.id, Number(req.params.id))).returning();

    if (status === "approved") {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId)).limit(1);
      if (user) {
        const newBalance = (parseFloat(user.walletBalance) + parseFloat(deposit.amount)).toString();
        await db.update(usersTable).set({ walletBalance: newBalance }).where(eq(usersTable.id, user.id));
        await db.insert(transactionsTable).values({
          userId: user.id,
          type: "deposit",
          amount: deposit.amount,
          status: "completed",
          description: `Deposit of ₦${parseFloat(deposit.amount).toLocaleString()} approved`,
        });
      }
      await db.insert(notificationsTable).values({
        userId: deposit.userId,
        type: "deposit",
        title: "Deposit Approved!",
        message: `Your deposit of ₦${parseFloat(deposit.amount).toLocaleString()} has been approved and credited to your wallet.`,
        isRead: false,
      });
    }

    res.json({ ...updated, amount: parseFloat(updated.amount), createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update deposit" });
  }
});

// Withdrawals
router.get("/withdrawals", async (req, res) => {
  try {
    const withdrawals = await db.select().from(withdrawalsTable).orderBy(desc(withdrawalsTable.createdAt));
    res.json(withdrawals.map(w => ({ ...w, amount: parseFloat(w.amount), createdAt: w.createdAt.toISOString(), updatedAt: w.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get withdrawals" });
  }
});

router.patch("/withdrawals/:id", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const [withdrawal] = await db.select().from(withdrawalsTable)
      .where(eq(withdrawalsTable.id, Number(req.params.id))).limit(1);
    if (!withdrawal) { res.status(404).json({ error: "Not found" }); return; }

    const [updated] = await db.update(withdrawalsTable)
      .set({ status, notes: notes || null, updatedAt: new Date() })
      .where(eq(withdrawalsTable.id, Number(req.params.id))).returning();

    const notifMsg = status === "approved"
      ? `Your withdrawal of ₦${parseFloat(withdrawal.amount).toLocaleString()} has been approved and sent to your bank.`
      : `Your withdrawal of ₦${parseFloat(withdrawal.amount).toLocaleString()} was declined. ${notes || "Contact support."}`;

    await db.insert(notificationsTable).values({
      userId: withdrawal.userId,
      type: "withdrawal",
      title: status === "approved" ? "Withdrawal Approved!" : "Withdrawal Declined",
      message: notifMsg,
      isRead: false,
    });

    if (status === "declined") {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, withdrawal.userId)).limit(1);
      if (user) {
        const newBalance = (parseFloat(user.walletBalance) + parseFloat(withdrawal.amount)).toString();
        await db.update(usersTable).set({ walletBalance: newBalance }).where(eq(usersTable.id, user.id));
      }
    }

    res.json({ ...updated, amount: parseFloat(updated.amount), createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update withdrawal" });
  }
});

// Activity Messages
router.get("/activity-messages", async (req, res) => {
  try {
    const messages = await db.select().from(activityMessagesTable).orderBy(desc(activityMessagesTable.createdAt));
    res.json(messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get activity messages" });
  }
});

router.post("/activity-messages", async (req, res) => {
  try {
    const { message, isActive = true } = req.body;
    const [created] = await db.insert(activityMessagesTable).values({ message, isActive }).returning();
    res.status(201).json({ ...created, createdAt: created.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create activity message" });
  }
});

router.patch("/activity-messages/:id", async (req, res) => {
  try {
    const { message, isActive } = req.body;
    const updates: Record<string, any> = {};
    if (message !== undefined) updates.message = message;
    if (isActive !== undefined) updates.isActive = isActive;
    const [updated] = await db.update(activityMessagesTable).set(updates)
      .where(eq(activityMessagesTable.id, Number(req.params.id))).returning();
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update activity message" });
  }
});

router.delete("/activity-messages/:id", async (req, res) => {
  try {
    await db.delete(activityMessagesTable).where(eq(activityMessagesTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete activity message" });
  }
});

// Settings
router.get("/settings", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      welcomeBonus: parseFloat(settings.welcomeBonus),
      referralReward: parseFloat(settings.referralReward),
      telegramUrl: settings.telegramUrl,
      supportEmail: settings.supportEmail,
      liveChatUrl: settings.liveChatUrl || null,
      activationKeyRequired: settings.activationKeyRequired === "true",
      depositAccountName: settings.depositAccountName,
      depositAccountNumber: settings.depositAccountNumber,
      depositBankName: settings.depositBankName,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await setSetting(key, String(value));
      }
    }
    const settings = await getSettings();
    res.json({
      welcomeBonus: parseFloat(settings.welcomeBonus),
      referralReward: parseFloat(settings.referralReward),
      telegramUrl: settings.telegramUrl,
      supportEmail: settings.supportEmail,
      liveChatUrl: settings.liveChatUrl || null,
      activationKeyRequired: settings.activationKeyRequired === "true",
      depositAccountName: settings.depositAccountName,
      depositAccountNumber: settings.depositAccountNumber,
      depositBankName: settings.depositBankName,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Broadcast
router.post("/broadcast", async (req, res) => {
  try {
    const { title, message } = req.body;
    await db.insert(notificationsTable).values({
      userId: null,
      type: "broadcast",
      title,
      message,
      isRead: false,
      isBroadcast: true,
    });
    res.json({ success: true, message: "Broadcast sent to all users" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

// Games management
router.get("/games", async (req, res) => {
  try {
    const games = await db.select().from(gamesTable);
    res.json(games.map(g => ({
      ...g,
      minReward: parseFloat(g.minReward),
      maxReward: parseFloat(g.maxReward),
      premiumMultiplier: parseFloat(g.premiumMultiplier),
      playsToday: 0,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get games" });
  }
});

router.patch("/games/:id", async (req, res) => {
  try {
    const { isEnabled, dailyLimit, minReward, maxReward, isPremium, premiumMultiplier } = req.body;
    const updates: Record<string, any> = {};
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;
    if (dailyLimit !== undefined) updates.dailyLimit = dailyLimit;
    if (minReward !== undefined) updates.minReward = minReward.toString();
    if (maxReward !== undefined) updates.maxReward = maxReward.toString();
    if (isPremium !== undefined) updates.isPremium = isPremium;
    if (premiumMultiplier !== undefined) updates.premiumMultiplier = premiumMultiplier.toString();

    const [updated] = await db.update(gamesTable).set(updates)
      .where(eq(gamesTable.id, Number(req.params.id))).returning();
    res.json({
      ...updated,
      minReward: parseFloat(updated.minReward),
      maxReward: parseFloat(updated.maxReward),
      premiumMultiplier: parseFloat(updated.premiumMultiplier),
      playsToday: 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update game" });
  }
});

export default router;
