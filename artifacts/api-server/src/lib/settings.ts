import { db, platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULTS: Record<string, string> = {
  welcomeBonus: "15000",
  referralReward: "8500",
  telegramUrl: "https://t.me/orrbitx",
  supportEmail: "support@play9ja.com",
  liveChatUrl: "",
  activationKeyRequired: "false",
  depositAccountName: "Modal Praise Philip Jacob",
  depositAccountNumber: "7074435901",
  depositBankName: "Moniepoint MFB",
};

export async function getSetting(key: string): Promise<string> {
  const [row] = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, key)).limit(1);
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(platformSettingsTable);
  const result: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(platformSettingsTable).where(eq(platformSettingsTable.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(platformSettingsTable).set({ value, updatedAt: new Date() }).where(eq(platformSettingsTable.key, key));
  } else {
    await db.insert(platformSettingsTable).values({ key, value });
  }
}
