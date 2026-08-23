import { eq } from "drizzle-orm";
import { tutorialProgress } from "../drizzle/schema";
import { getDb } from "./db";

export async function getTutorialProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial-progress datastore is unavailable.");
  const [progress] = await db.select().from(tutorialProgress).where(eq(tutorialProgress.userId, userId)).limit(1);
  return progress ?? { userId, activeStep: 0, completed: false, updatedAt: null };
}

export async function saveTutorialProgress(input: { userId: number; activeStep: number; completed: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("The tutorial-progress datastore is unavailable.");
  const values = { ...input, updatedAt: new Date() };
  await db.insert(tutorialProgress).values(values).onDuplicateKeyUpdate({ set: { activeStep: values.activeStep, completed: values.completed, updatedAt: values.updatedAt } });
  return values;
}
