/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ access: vi.fn(), administration: vi.fn(), retentionReview: vi.fn(), notificationInbox: vi.fn(), notificationPreferences: vi.fn(), emailDeliveryStatus: vi.fn(), adminExperience: vi.fn(), savedViews: vi.fn(), googleGroups: vi.fn(), googleMembers: vi.fn(), audit: vi.fn(), auditExport: vi.fn(), mutation: vi.fn(), savePreferencesMutation: vi.fn(), saveAdminExperienceMutation: vi.fn(), processQueuedEmailsMutation: vi.fn(), createSavedViewMutation: vi.fn(), renameSavedViewMutation: vi.fn(), useSavedViewMutation: vi.fn(), deleteSavedViewMutation: vi.fn(), refetch: vi.fn(), invalidate: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/components/PortfolioChrome", () => ({ SiteShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/features/tutorial/TutorialHelpLink", () => ({ TutorialHelpLink: ({ label }: { label: string }) => <a href="/how-to-use?step=5">{label}</a> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ controlAssurance: { administration: { invalidate: hooks.invalidate }, roleAssignmentAudit: { invalidate: hooks.invalidate }, retentionReviewNotificationInbox: { invalidate: hooks.invalidate }, retentionReviewNotificationPreferences: { invalidate: hooks.invalidate }, retentionReviewEmailDeliveryStatus: { invalidate: hooks.invalidate }, adminExperiencePreferences: { invalidate: hooks.invalidate }, savedAuditViews: { invalidate: hooks.invalidate }, myAccess: { invalidate: hooks.invalidate } } }), controlAssurance: { myAccess: { useQuery: hooks.access }, administration: { useQuery: hooks.administration }, retentionReviewDashboard: { useQuery: hooks.retentionReview }, retentionReviewNotificationInbox: { useQuery: hooks.notificationInbox }, retentionReviewNotificationPreferences: { useQuery: hooks.notificationPreferences }, retentionReviewEmailDeliveryStatus: { useQuery: hooks.emailDeliveryStatus }, adminExperiencePreferences: { useQuery: hooks.adminExperience }, savedAuditViews: { useQuery: hooks.savedViews }, googleWorkspaceGroups: { useQuery: hooks.googleGroups }, googleWorkspaceGroupMembers: { useQuery: hooks.googleMembers }, markRetentionReviewNotificationRead: { useMutation: hooks.mutation }, saveRetentionReviewNotificationPreferences: { useMutation: hooks.savePreferencesMutation }, saveAdminExperiencePreferences: { useMutation: hooks.saveAdminExperienceMutation }, processQueuedRetentionReviewEmails: { useMutation: hooks.processQueuedEmailsMutation }, createSavedAuditView: { useMutation: hooks.createSavedViewMutation }, renameSavedAuditView: { useMutation: hooks.renameSavedViewMutation }, markSavedAuditViewUsed: { useMutation: hooks.useSavedViewMutation }, deleteSavedAuditView: { useMutation: hooks.deleteSavedViewMutation }, roleAssignmentAudit: { useQuery: hooks.audit }, roleAssignmentAuditExport: { useQuery: hooks.auditExport }, assignWorkspaceRole: { useMutation: hooks.mutation }, bulkAssignWorkspaceRole: { useMutation: hooks.mutation }, setAttachmentRetention: { useMutation: hooks.mutation }, upsertRetentionTemplate: { useMutation: hooks.mutation }, applyRetentionTemplate: { useMutation: hooks.mutation }, configureRetentionReview: { useMutation: hooks.mutation } } } }));

import Administration from "./Administration";

describe("Administration audit review", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    hooks.access.mockReturnValue({ isLoading: false, data: { isAdministrator: true } });
    hooks.administration.mockReturnValue({ isLoading: false, data: { users: [{ id: 7, name: "Reviewer", email: "reviewer@example.com", openId: "u-7", role: "user" }], roleAssignments: [], attachments: [], roleEvents: [{ assignedBy: "Admin" }], retentionTemplates: [], webhookConfigs: [] } });
    hooks.retentionReview.mockReturnValue({ data: { schedule: { active: false }, dueCount: 0, overdueCount: 0 } });
    hooks.notificationInbox.mockReturnValue({ data: [] });
    hooks.notificationPreferences.mockReturnValue({ data: { inAppEnabled: true, emailEnabled: false } });
    hooks.emailDeliveryStatus.mockReturnValue({ data: { configured: false, note: "Server-side Gmail delivery is inactive.", missingVariables: ["GOOGLE_WORKSPACE_CLIENT_ID"] } });
    hooks.adminExperience.mockReturnValue({ isLoading: false, data: { adminDarkMode: false, onboardingSteps: [] } });
    hooks.savedViews.mockReturnValue({ data: [] });
    hooks.googleGroups.mockReturnValue({ data: { configured: false, groups: [], note: "OAuth pending" } });
    hooks.googleMembers.mockReturnValue({ data: { configured: false, members: [] } });
    hooks.audit.mockReturnValue({ data: { items: [{ eventId: "RAE-01", batchId: null, occurredAt: new Date("2026-08-22"), userId: 7, workspaceRole: "grc_analyst", previousActive: false, resultingActive: true, assignedBy: "Admin" }], page: 1, pageSize: 12, total: 13 }, isFetching: false });
    hooks.refetch.mockResolvedValue({ data: [{ eventId: "RAE-01", batchId: null, occurredAt: new Date("2026-08-22"), userId: 7, workspaceRole: "grc_analyst", previousActive: false, resultingActive: true, assignedBy: "Admin" }] });
    hooks.auditExport.mockReturnValue({ refetch: hooks.refetch, isFetching: false });
    hooks.mutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.savePreferencesMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.saveAdminExperienceMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.processQueuedEmailsMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.createSavedViewMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.renameSavedViewMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.useSavedViewMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
    hooks.deleteSavedViewMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
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

  it("keeps hook order stable while administrator access resolves", () => {
    hooks.access.mockReset();
    hooks.access.mockReturnValueOnce({ isLoading: true }).mockReturnValue({ isLoading: false, data: { isAdministrator: true } });
    const view = render(<Administration />);
    expect(screen.getByText("Resolving administrator access…")).toBeTruthy();
    view.rerender(<Administration />);
    expect(screen.getByRole("heading", { name: /Assign accountable GRC actions/i })).toBeTruthy();
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

  it("saves the administrator's own retention-review delivery choices", () => {
    render(<Administration />);
    fireEvent.click(screen.getByLabelText(/Email reminder/i));
    fireEvent.click(screen.getByRole("button", { name: "Save notification settings" }));
    const mutation = hooks.savePreferencesMutation.mock.results[hooks.savePreferencesMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(mutation.mutate).toHaveBeenCalledWith({ inAppEnabled: true, emailEnabled: true });
  });

  it("shows first-time administrator guardrails and routes setup help into the administrator tutorial step", () => {
    render(<Administration />);
    expect(screen.getByRole("heading", { name: /Establish the operating guardrails/i })).toBeTruthy();
    expect(screen.getByText("Confirm accountable duties")).toBeTruthy();
    expect(screen.getByText("Leave secrets outside the browser")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Need help with administrator setup?" }).getAttribute("href")).toBe("/how-to-use?step=5");
  });

  it("persists deep-dark mode and completion progress for the administrator checklist", () => {
    const view = render(<Administration />);
    fireEvent.click(screen.getByRole("switch", { name: /Deep dark mode/i }));
    expect(view.container.querySelector(".admin-deep-dark")).toBeTruthy();
    const mutation = hooks.saveAdminExperienceMutation.mock.results[hooks.saveAdminExperienceMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(mutation.mutate).toHaveBeenCalledWith({ adminDarkMode: true, onboardingSteps: [] });
    fireEvent.click(screen.getByLabelText("Mark Confirm accountable duties complete"));
    expect(mutation.mutate).toHaveBeenLastCalledWith({ adminDarkMode: true, onboardingSteps: ["duties"] });
    expect(screen.getByRole("progressbar", { name: "Administrator onboarding progress" }).getAttribute("aria-valuenow")).toBe("20");
  });

  it("creates, applies, renames, orders, and deletes a private saved audit view", () => {
    hooks.savedViews.mockReturnValue({ data: [{ viewId: "SAV-001", title: "Zulu actions", workspaceRole: "grc_analyst", assignedBy: "Admin", createdAt: new Date("2026-08-20"), lastUsedAt: new Date("2026-08-20") }, { viewId: "SAV-002", title: "Alpha actions", workspaceRole: null, assignedBy: null, createdAt: new Date("2026-08-21"), lastUsedAt: null }] });
    const view = render(<Administration />);
    fireEvent.change(screen.getByPlaceholderText("Name this filter view"), { target: { value: "My current filters" } });
    fireEvent.click(screen.getByRole("button", { name: "Save current filters" }));
    const create = hooks.createSavedViewMutation.mock.results[hooks.createSavedViewMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(create.mutate).toHaveBeenCalledWith({ title: "My current filters" }, expect.anything());
    expect(Array.from(view.container.querySelectorAll(".saved-view-list strong")).map((node) => node.textContent)).toEqual(["Alpha actions", "Zulu actions"]);
    fireEvent.change(screen.getByLabelText("Order views"), { target: { value: "newest" } });
    expect(Array.from(view.container.querySelectorAll(".saved-view-list strong")).map((node) => node.textContent)).toEqual(["Alpha actions", "Zulu actions"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Apply" })[1]);
    expect(hooks.audit).toHaveBeenLastCalledWith({ page: 1, pageSize: 12, workspaceRole: "grc_analyst", assignedBy: "Admin" }, expect.anything());
    const useView = hooks.useSavedViewMutation.mock.results[hooks.useSavedViewMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(useView.mutate).toHaveBeenCalledWith({ viewId: "SAV-001" });
    fireEvent.click(screen.getAllByRole("button", { name: "Rename" })[0]);
    fireEvent.change(screen.getByLabelText("Rename Alpha actions"), { target: { value: "Renamed view" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const rename = hooks.renameSavedViewMutation.mock.results[hooks.renameSavedViewMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(rename.mutate).toHaveBeenCalledWith({ viewId: "SAV-002", title: "Renamed view" });
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    const remove = hooks.deleteSavedViewMutation.mock.results[hooks.deleteSavedViewMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(remove.mutate).toHaveBeenCalledWith({ viewId: "SAV-002" });
  });

  it("keeps server-side credential controls out of the browser while enabling manual queue processing only when configured", () => {
    hooks.emailDeliveryStatus.mockReturnValue({ data: { configured: true, note: "Server-side Gmail delivery is configured.", missingVariables: [] } });
    render(<Administration />);
    expect(screen.getByText("Project Settings → Secrets")).toBeTruthy();
    expect(screen.queryByDisplayValue(/GOOGLE_WORKSPACE_CLIENT_SECRET/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Process queued email reminders" }));
    const process = hooks.processQueuedEmailsMutation.mock.results[hooks.processQueuedEmailsMutation.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(process.mutate).toHaveBeenCalledWith();
  });
});
