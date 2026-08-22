/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ access: vi.fn(), administration: vi.fn(), retentionReview: vi.fn(), audit: vi.fn(), auditExport: vi.fn(), mutation: vi.fn(), refetch: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/PortfolioChrome", () => ({ SiteShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ controlAssurance: { administration: { invalidate: hooks.invalidate }, roleAssignmentAudit: { invalidate: hooks.invalidate }, myAccess: { invalidate: hooks.invalidate } } }), controlAssurance: { myAccess: { useQuery: hooks.access }, administration: { useQuery: hooks.administration }, retentionReviewDashboard: { useQuery: hooks.retentionReview }, roleAssignmentAudit: { useQuery: hooks.audit }, roleAssignmentAuditExport: { useQuery: hooks.auditExport }, assignWorkspaceRole: { useMutation: hooks.mutation }, bulkAssignWorkspaceRole: { useMutation: hooks.mutation }, setAttachmentRetention: { useMutation: hooks.mutation }, upsertRetentionTemplate: { useMutation: hooks.mutation }, applyRetentionTemplate: { useMutation: hooks.mutation }, configureRetentionReview: { useMutation: hooks.mutation } } } }));

import Administration from "./Administration";

describe("Administration audit review", () => {
  beforeEach(() => {
    hooks.access.mockReturnValue({ isLoading: false, data: { isAdministrator: true } });
    hooks.administration.mockReturnValue({ isLoading: false, data: { users: [{ id: 7, name: "Reviewer", email: "reviewer@example.com", openId: "u-7", role: "user" }], roleAssignments: [], attachments: [], retentionTemplates: [], webhookConfigs: [] } });
    hooks.retentionReview.mockReturnValue({ data: { schedule: { active: false }, dueCount: 0, overdueCount: 0 } });
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
    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));
    expect(hooks.refetch).toHaveBeenCalled();
    await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
  });
});
