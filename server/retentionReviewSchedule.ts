import type { Express, Request, Response } from "express";
import express from "express";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import { runRetentionReviewByTaskUid } from "./controlAssuranceDb";

export function registerRetentionReviewSchedule(app: Express) {
  app.post("/api/scheduled/retention-review", express.json(), async (request: Request, response: Response) => {
    try {
      const user = await sdk.authenticateRequest(request);
      if (!user.isCron || !user.taskUid) return response.status(403).json({ error: "cron-only" });
      const result = await runRetentionReviewByTaskUid(user.taskUid);
      if (!result.ok || "skipped" in result || (result.dueAttachmentCount === 0 && result.overdueAttachmentCount === 0)) return response.json(result);
      const ownerNotificationDelivered = await notifyOwner({ title: "Evidence retention review requires attention", content: `${result.dueAttachmentCount} evidence records are within the configured review horizon and ${result.overdueAttachmentCount} have expired. Review the administrator retention queue; attachment content and storage links are intentionally not included.` });
      return response.json({ ...result, ownerNotificationDelivered });
    } catch (error) {
      return response.status(500).json({ error: error instanceof Error ? error.message : "Retention-review callback failed.", timestamp: new Date().toISOString(), context: { path: request.path } });
    }
  });
}
