import { nanoid } from "nanoid";
import { and, desc, eq } from "drizzle-orm";
import { tutorialFeedback } from "../../../drizzle/schema";
import { getDb } from "../../db";

export type TutorialFeedbackStatus = "New" | "Reviewed" | "Planned" | "Closed";
export type TutorialFeedbackCategory = "Suggestion" | "Issue" | "Question";

const allowedTransitions: Record<TutorialFeedbackStatus, TutorialFeedbackStatus[]> = {
  New: ["Reviewed", "Planned", "Closed"],
  Reviewed: ["Planned", "Closed"],
  Planned: ["Reviewed", "Closed"],
  Closed: ["Reviewed"],
};

export async function submitTutorialFeedback(input: { userId: number; category: "Suggestion" | "Issue" | "Question"; message: string; contactEmail?: string }) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial feedback datastore is unavailable.");
  const feedbackId = `TFB-${nanoid(12)}`;
  await db.insert(tutorialFeedback).values({ feedbackId, userId: input.userId, category: input.category, message: input.message, contactEmail: input.contactEmail ?? null });
  return { feedbackId };
}

export async function listTutorialFeedback(input: { status?: TutorialFeedbackStatus; category?: TutorialFeedbackCategory }) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial feedback datastore is unavailable.");
  const conditions = [input.status ? eq(tutorialFeedback.status, input.status) : undefined, input.category ? eq(tutorialFeedback.category, input.category) : undefined].filter(Boolean);
  return db.select().from(tutorialFeedback).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tutorialFeedback.createdAt)).limit(100);
}

export async function updateTutorialFeedbackStatus(input: { feedbackId: string; status: TutorialFeedbackStatus; reviewNote?: string; reviewedBy: string }) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial feedback datastore is unavailable.");
  const [current] = await db.select({ status: tutorialFeedback.status }).from(tutorialFeedback).where(eq(tutorialFeedback.feedbackId, input.feedbackId)).limit(1);
  if (!current) return { updated: false as const, reason: "The feedback record no longer exists." };
  if (current.status !== input.status && !allowedTransitions[current.status].includes(input.status)) return { updated: false as const, reason: `A ${current.status} feedback item cannot move directly to ${input.status}.` };
  const reviewedAt = new Date();
  await db.update(tutorialFeedback).set({ status: input.status, reviewNote: input.reviewNote?.trim() || null, reviewedBy: input.reviewedBy, reviewedAt }).where(eq(tutorialFeedback.feedbackId, input.feedbackId));
  return { updated: true as const, feedbackId: input.feedbackId, status: input.status, reviewedAt };
}
