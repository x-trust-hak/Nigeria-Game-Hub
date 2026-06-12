import { Router } from "express";
import { db, notificationsTable, activityMessagesTable } from "@workspace/db";
import { eq, or, and, desc, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const notifications = await db.select().from(notificationsTable)
      .where(or(
        eq(notificationsTable.userId, user.id),
        and(eq(notificationsTable.isBroadcast, true), isNull(notificationsTable.userId))
      ))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    res.json(notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to mark all notifications read" });
  }
});

router.get("/activity-live", async (req, res) => {
  try {
    const messages = await db.select().from(activityMessagesTable)
      .where(eq(activityMessagesTable.isActive, true))
      .orderBy(desc(activityMessagesTable.createdAt));
    res.json(messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get live activity" });
  }
});

export default router;
