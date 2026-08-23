import { nanoid } from "nanoid";
import { tutorialFeedback } from "../../../drizzle/schema";
import { getDb } from "../../db";

export async function submitTutorialFeedback(input: { userId: number; category: "Suggestion" | "Issue" | "Question"; message: string; contactEmail?: string }) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial feedback datastore is unavailable.");
  const feedbackId = `TFB-${nanoid(12)}`;
  await db.insert(tutorialFeedback).values({ feedbackId, userId: input.userId, category: input.category, message: input.message, contactEmail: input.contactEmail ?? null });
  return { feedbackId };
}
