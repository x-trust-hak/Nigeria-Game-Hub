import { Router } from "express";
import { db, usersTable, otpCodesTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  hashPassword, comparePassword, signToken, generateReferralCode, generateOtp
} from "../lib/auth";
import { requireAuth } from "../lib/auth";
import { getSetting } from "../lib/settings";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: "Username, email and password are required" });
      return;
    }

    const existing = await db.select().from(usersTable)
      .where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const existingUsername = await db.select().from(usersTable)
      .where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userReferralCode = generateReferralCode(username);
    const welcomeBonus = parseFloat(await getSetting("welcomeBonus"));
    const referralReward = parseFloat(await getSetting("referralReward"));

    let referredById: number | undefined;
    if (referralCode) {
      const referrer = await db.select().from(usersTable)
        .where(eq(usersTable.referralCode, referralCode.toUpperCase())).limit(1);
      if (referrer.length > 0) {
        referredById = referrer[0].id;
      }
    }

    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      referralCode: userReferralCode,
      referredBy: referredById,
      walletBalance: welcomeBonus.toString(),
      isVerified: true,
    }).returning();

    await db.insert(transactionsTable).values({
      userId: user.id,
      type: "bonus",
      amount: welcomeBonus.toString(),
      status: "completed",
      description: "Welcome Bonus",
    });

    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "reward",
      title: "Welcome Bonus Credited!",
      message: `🎉 Welcome Bonus Credited Successfully! ₦${welcomeBonus.toLocaleString()} has been added to your wallet.`,
      isRead: false,
    });

    if (referredById) {
      await db.update(usersTable)
        .set({
          referralBalance: db.$count(usersTable) as any,
          totalReferrals: db.$count(usersTable) as any,
        });

      const [referrer] = await db.select().from(usersTable)
        .where(eq(usersTable.id, referredById)).limit(1);
      if (referrer) {
        const newBalance = (parseFloat(referrer.referralBalance) + referralReward).toString();
        const newTotal = referrer.totalReferrals + 1;
        await db.update(usersTable)
          .set({ referralBalance: newBalance, totalReferrals: newTotal })
          .where(eq(usersTable.id, referredById));

        await db.insert(transactionsTable).values({
          userId: referredById,
          type: "referral",
          amount: referralReward.toString(),
          status: "completed",
          description: `Referral bonus from ${username}`,
        });
      }
    }

    const token = signToken(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, token, isNewUser: true, welcomeBonus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.isSuspended) {
      res.status(401).json({ error: "Account suspended" });
      return;
    }
    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
    const token = signToken(user.id, user.role);
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token, isNewUser: false, welcomeBonus: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.post("/otp/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.insert(otpCodesTable).values({ email, code, expiresAt });
    req.log.info({ email, code }, "OTP generated (demo mode)");
    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/otp/verify", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) { res.status(400).json({ error: "Email and code required" }); return; }
    const [otp] = await db.select().from(otpCodesTable)
      .where(and(
        eq(otpCodesTable.email, email),
        eq(otpCodesTable.code, code),
        eq(otpCodesTable.isUsed, false),
        gt(otpCodesTable.expiresAt, new Date())
      )).limit(1);
    if (!otp) { res.status(400).json({ error: "Invalid or expired OTP" }); return; }
    await db.update(otpCodesTable).set({ isUsed: true }).where(eq(otpCodesTable.id, otp.id));
    await db.update(usersTable).set({ isVerified: true }).where(eq(usersTable.email, email));
    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

router.post("/password/reset-request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: "Email required" }); return; }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db.insert(otpCodesTable).values({ email, code, expiresAt });
    req.log.info({ email, code }, "Password reset OTP (demo mode)");
    res.json({ success: true, message: "Reset instructions sent to email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

router.post("/password/reset", async (req, res) => {
  try {
    const { token: code, password, email } = req.body;
    if (!code || !password || !email) { res.status(400).json({ error: "All fields required" }); return; }
    const [otp] = await db.select().from(otpCodesTable)
      .where(and(
        eq(otpCodesTable.email, email),
        eq(otpCodesTable.code, code),
        eq(otpCodesTable.isUsed, false),
        gt(otpCodesTable.expiresAt, new Date())
      )).limit(1);
    if (!otp) { res.status(400).json({ error: "Invalid or expired reset token" }); return; }
    const passwordHash = await hashPassword(password);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.email, email));
    await db.update(otpCodesTable).set({ isUsed: true }).where(eq(otpCodesTable.id, otp.id));
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
