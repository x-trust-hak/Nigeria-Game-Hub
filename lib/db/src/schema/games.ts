import { pgTable, text, serial, boolean, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gamesTable = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  category: text("category").notNull().default("classic"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  dailyLimit: integer("daily_limit").notNull().default(5),
  minReward: numeric("min_reward", { precision: 10, scale: 2 }).notNull().default("50"),
  maxReward: numeric("max_reward", { precision: 10, scale: 2 }).notNull().default("500"),
  isPremium: boolean("is_premium").notNull().default(false),
  premiumMultiplier: numeric("premium_multiplier", { precision: 5, scale: 2 }).notNull().default("1.5"),
  difficulty: text("difficulty").notNull().default("medium"),
  totalPlays: integer("total_plays").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gamePlaysTable = pgTable("game_plays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  gameName: text("game_name").notNull(),
  won: boolean("won").notNull(),
  reward: numeric("reward", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameSchema = createInsertSchema(gamesTable).omit({ id: true, createdAt: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;

export const insertGamePlaySchema = createInsertSchema(gamePlaysTable).omit({ id: true, createdAt: true });
export type InsertGamePlay = z.infer<typeof insertGamePlaySchema>;
export type GamePlay = typeof gamePlaysTable.$inferSelect;
