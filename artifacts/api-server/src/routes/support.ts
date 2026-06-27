import { Router } from "express";
import { getSetting } from "../lib/settings";

const router = Router();

router.get("/links", async (req, res) => {
  try {
    const telegramUrl = await getSetting("telegramUrl");
    const email = await getSetting("supportEmail");
    const liveChatUrl = await getSetting("liveChatUrl");
    res.json({ telegramUrl, email, liveChatUrl: liveChatUrl || null, faqUrl: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get support links" });
  }
});

router.get("/public-settings", async (req, res) => {
  try {
    const depositAccountName = await getSetting("depositAccountName");
    const depositAccountNumber = await getSetting("depositAccountNumber");
    const depositBankName = await getSetting("depositBankName");
    const welcomeBonus = await getSetting("welcomeBonus");
    const referralReward = await getSetting("referralReward");
    res.json({ depositAccountName, depositAccountNumber, depositBankName, welcomeBonus: parseFloat(welcomeBonus), referralReward: parseFloat(referralReward) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

export default router;
