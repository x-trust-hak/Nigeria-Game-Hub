import { pgTable, text, serial, boolean, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyRewardClaimsTable = pgTable("daily_reward_claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: integer("day").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
});

export const platformSettingsTable = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const otpCodesTable = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDailyRewardClaimSchema = createInsertSchema(dailyRewardClaimsTable).omit({ id: true, claimedAt: true });
export type InsertDailyRewardClaim = z.infer<typeof insertDailyRewardClaimSchema>;
export type DailyRewardClaim = typeof dailyRewardClaimsTable.$inferSelect;

export const insertPlatformSettingSchema = createInsertSchema(platformSettingsTable).omit({ id: true, updatedAt: true });
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettingsTable.$inferSelect;
