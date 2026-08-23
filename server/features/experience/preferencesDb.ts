import { eq } from "drizzle-orm";
import { userExperiencePreferences } from "../../../drizzle/schema";
import { getDb } from "../../db";

export type AdminExperiencePreferences = {
  userId: number;
  adminDarkMode: boolean;
  onboardingSteps: string[];
  updatedAt: Date | null;
};

export async function getAdminExperiencePreferences(userId: number): Promise<AdminExperiencePreferences> {
  const db = await getDb();
  if (!db) throw new Error("The administrator experience datastore is unavailable.");
  const [preferences] = await db.select().from(userExperiencePreferences).where(eq(userExperiencePreferences.userId, userId)).limit(1);
  return preferences ?? { userId, adminDarkMode: false, onboardingSteps: [], updatedAt: null };
}

export async function saveAdminExperiencePreferences(input: Pick<AdminExperiencePreferences, "userId" | "adminDarkMode" | "onboardingSteps">) {
  const db = await getDb();
  if (!db) throw new Error("The administrator experience datastore is unavailable.");
  const values = { ...input, updatedAt: new Date() };
  await db.insert(userExperiencePreferences).values(values).onDuplicateKeyUpdate({
    set: { adminDarkMode: values.adminDarkMode, onboardingSteps: values.onboardingSteps, updatedAt: values.updatedAt },
  });
  return values;
}
