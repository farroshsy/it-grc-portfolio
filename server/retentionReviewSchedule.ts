import type { Express, Request, Response } from "express";
import express from "express";
import { sdk } from "./_core/sdk";
import { runRetentionReviewByTaskUid } from "./controlAssuranceDb";

export function registerRetentionReviewSchedule(app: Express) {
  app.post("/api/scheduled/retention-review", express.json(), async (request: Request, response: Response) => {
    try {
      const user = await sdk.authenticateRequest(request);
      if (!user.isCron || !user.taskUid) return response.status(403).json({ error: "cron-only" });
      const result = await runRetentionReviewByTaskUid(user.taskUid);
      return response.json(result);
    } catch (error) {
      return response.status(500).json({ error: error instanceof Error ? error.message : "Retention-review callback failed.", timestamp: new Date().toISOString(), context: { path: request.path } });
    }
  });
}
