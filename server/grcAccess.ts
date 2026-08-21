import { and, eq } from "drizzle-orm";
import { grcUserRoles, type User } from "../drizzle/schema";
import { getDb } from "./db";

export const workspaceRoles = ["control_owner", "grc_analyst", "risk_approver"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export function canPerformWorkspaceAction(roles: WorkspaceRole[], allowed: WorkspaceRole[]) {
  return allowed.some((role) => roles.includes(role));
}

export async function getWorkspaceRoles(user: User): Promise<WorkspaceRole[]> {
  if (user.role === "admin") return [...workspaceRoles];
  const db = await getDb();
  if (!db) return [];
  const assignments = await db.select({ workspaceRole: grcUserRoles.workspaceRole }).from(grcUserRoles).where(and(eq(grcUserRoles.userId, user.id), eq(grcUserRoles.active, true)));
  return assignments.map((assignment) => assignment.workspaceRole);
}
