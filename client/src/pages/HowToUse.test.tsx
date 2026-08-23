/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ progress: vi.fn(), saveProgress: vi.fn(), refetch: vi.fn() }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { tutorial: { progress: { useQuery: hooks.progress }, saveProgress: { useMutation: hooks.saveProgress } } } }));
import HowToUse from "./HowToUse";

describe("HowToUse", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    window.history.replaceState({}, "", "/how-to-use");
    hooks.progress.mockReturnValue({ data: { activeStep: 0, completed: false }, isLoading: false, refetch: hooks.refetch });
    hooks.saveProgress.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("guides visitors through the Control Ledger operating flow and links each step to its surface", () => {
    render(<HowToUse />);
    expect(screen.getByRole("heading", { name: "Choose the right surface for your task." })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Explore the portfolio/i }).getAttribute("href")).toBe("/");

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByRole("heading", { name: "Submit evidence against a named control." })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open the workspace/i }).getAttribute("href")).toBe("/workspace");

    fireEvent.click(screen.getByRole("tab", { name: /Administrator path/i }));
    expect(screen.getByRole("heading", { name: "Maintain accountable access and review cadence." })).toBeTruthy();
    expect(screen.getByText(/never in the browser/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open administration/i }).getAttribute("href")).toBe("/administration");
  });

  it("persists the signed-in user’s selected tutorial step so the walkthrough can be resumed", () => {
    render(<HowToUse />);
    fireEvent.click(screen.getByRole("tab", { name: /GRC analyst path/i }));
    const mutation = hooks.saveProgress.mock.results[hooks.saveProgress.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    expect(mutation.mutate).toHaveBeenCalledWith({ activeStep: 2, completed: false });
  });

  it("opens and saves the tutorial step requested by a contextual workspace help link", async () => {
    window.history.replaceState({}, "", "/how-to-use?step=4");
    render(<HowToUse />);
    expect(screen.getByRole("heading", { name: "Turn results into an owned risk decision." })).toBeTruthy();
    const mutation = hooks.saveProgress.mock.results[hooks.saveProgress.mock.results.length - 1]?.value as { mutate: ReturnType<typeof vi.fn> };
    await vi.waitFor(() => expect(mutation.mutate).toHaveBeenCalledWith({ activeStep: 3, completed: false }));
  });
});
