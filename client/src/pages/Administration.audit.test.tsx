/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ access: vi.fn(), administration: vi.fn(), retentionReview: vi.fn(), notificationInbox: vi.fn(), googleGroups: vi.fn(), googleMembers: vi.fn(), audit: vi.fn(), auditExport: vi.fn(), mutation: vi.fn(), refetch: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/PortfolioChrome", () => ({ SiteShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ controlAssurance: { administration: { invalidate: hooks.invalidate }, roleAssignmentAudit: { invalidate: hooks.invalidate }, retentionReviewNotificationInbox: { invalidate: hooks.invalidate }, myAccess: { invalidate: hooks.invalidate } } }), controlAssurance: { myAccess: { useQuery: hooks.access }, administration: { useQuery: hooks.administration }, retentionReviewDashboard: { useQuery: hooks.retentionReview }, retentionReviewNotificationInbox: { useQuery: hooks.notificationInbox }, googleWorkspaceGroups: { useQuery: hooks.googleGroups }, googleWorkspaceGroupMembers: { useQuery: hooks.googleMembers }, markRetentionReviewNotificationRead: { useMutation: hooks.mutation }, roleAssignmentAudit: { useQuery: hooks.audit }, roleAssignmentAuditExport: { useQuery: hooks.auditExport }, assignWorkspaceRole: { useMutation: hooks.mutation }, bulkAssignWorkspaceRole: { useMutation: hooks.mutation }, setAttachmentRetention: { useMutation: hooks.mutation }, upsertRetentionTemplate: { useMutation: hooks.mutation }, applyRetentionTemplate: { useMutation: hooks.mutation }, configureRetentionReview: { useMutation: hooks.mutation } } } }));

import Administration from "./Administration";

describe("Administration audit review", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    hooks.access.mockReturnValue({ isLoading: false, data: { isAdministrator: true } });
    hooks.administration.mockReturnValue({ isLoading: false, data: { users: [{ id: 7, name: "Reviewer", email: "reviewer@example.com", openId: "u-7", role: "user" }], roleAssignments: [], attachments: [], roleEvents: [{ assignedBy: "Admin" }], retentionTemplates: [], webhookConfigs: [] } });
    hooks.retentionReview.mockReturnValue({ data: { schedule: { active: false }, dueCount: 0, overdueCount: 0 } });
    hooks.notificationInbox.mockReturnValue({ data: [] });
    hooks.googleGroups.mockReturnValue({ data: { configured: false, groups: [], note: "OAuth pending" } });
    hooks.googleMembers.mockReturnValue({ data: { configured: false, members: [] } });
    hooks.audit.mockReturnValue({ data: { items: [{ eventId: "RAE-01", batchId: null, occurredAt: new Date("2026-08-22"), userId: 7, workspaceRole: "grc_analyst", previousActive: false, resultingActive: true, assignedBy: "Admin" }], page: 1, pageSize: 12, total: 13 }, isFetching: false });
    hooks.refetch.mockResolvedValue({ data: [{ eventId: "RAE-01", batchId: null, occurredAt: new Date("2026-08-22"), userId: 7, workspaceRole: "grc_analyst", previousActive: false, resultingActive: true, assignedBy: "Admin" }] });
    hooks.auditExport.mockReturnValue({ refetch: hooks.refetch, isFetching: false });
    hooks.mutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:csv"), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  it("paginates the role-event ledger and creates a CSV download on demand", async () => {
    render(<Administration />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(hooks.audit).toHaveBeenLastCalledWith({ page: 2, pageSize: 12 }, expect.anything());
    fireEvent.click(screen.getByRole("button", { name: /Export.*CSV/i }));
    expect(hooks.refetch).toHaveBeenCalled();
    await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
  });

  it("filters the role-event ledger by duty and administrator actor", () => {
    render(<Administration />);
    fireEvent.change(screen.getByLabelText("Duty"), { target: { value: "grc_analyst" } });
    expect(hooks.audit).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, workspaceRole: "grc_analyst" }, expect.anything());
    fireEvent.change(screen.getByLabelText("Actor"), { target: { value: "Admin" } });
    expect(hooks.audit).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, workspaceRole: "grc_analyst", assignedBy: "Admin" }, expect.anything());
  });

  it("adds authenticated local matches from an authorized Google Workspace group to the bulk selection", () => {
    hooks.googleGroups.mockReturnValue({ data: { configured: true, groups: [{ id: "group-1", email: "grc@example.com", name: "GRC reviewers" }], note: "Read-only directory discovery is active." } });
    hooks.googleMembers.mockReturnValue({ data: { configured: true, members: [{ id: "member-1", email: "reviewer@example.com", role: "MEMBER", type: "USER" }] } });
    render(<Administration />);
    fireEvent.change(screen.getByLabelText("Select Google Workspace group"), { target: { value: "grc@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Add 1 workspace members" }));
    expect(screen.getByRole("button", { name: "Assign control owner to 1" })).toBeTruthy();
  });
});
