import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import walletRouter from "./wallet";
import depositRouter from "./deposit";
import withdrawalRouter from "./withdrawal";
import membershipRouter from "./membership";
import gamesRouter from "./games";
import leaderboardRouter from "./leaderboard";
import referralRouter from "./referral";
import rewardsRouter from "./rewards";
import notificationsRouter from "./notifications";
import supportRouter from "./support";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/dashboard", dashboardRouter);
router.use("/wallet", walletRouter);
router.use("/deposit", depositRouter);
router.use("/withdrawal", withdrawalRouter);
router.use("/membership", membershipRouter);
router.use("/games", gamesRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/winners", leaderboardRouter);
router.use("/referral", referralRouter);
router.use("/daily-reward", rewardsRouter);
router.use("/notifications", notificationsRouter);
router.use("/activity", notificationsRouter);
router.use("/support", supportRouter);
router.use("/admin", adminRouter);

export default router;
