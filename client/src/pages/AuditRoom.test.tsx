/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useQuery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/trpc", () => ({ trpc: { portfolio: { auditRoom: { useQuery } } } }));

import AuditRoom from "./AuditRoom";

describe("AuditRoom", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    useQuery.mockReturnValue({
      isLoading: false,
      data: {
        studies: [],
        requests: [
          { id: 1, requestId: "PBC-001", title: "Privileged access review", domain: "Access", owner: "Security", status: "Closed", dueDate: new Date("2026-08-28"), closureEvidence: "Review export", provenance: "Simulated Case Study" },
          { id: 2, requestId: "PBC-002", title: "Production change sample", domain: "Change", owner: "Platform", status: "In review", dueDate: new Date("2026-09-08"), closureEvidence: "Approved change", provenance: "Simulated Case Study" },
        ],
      },
    });
  });

  it("filters the simulated PBC ledger by selected request status", () => {
    render(<AuditRoom />);
    expect(screen.getByText("PBC-001")).toBeTruthy();
    expect(screen.getByText("PBC-002")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Filter audit requests by status"), { target: { value: "Closed" } });

    expect(screen.getByText("PBC-001")).toBeTruthy();
    expect(screen.queryByText("PBC-002")).toBeNull();
  });

  it("explains filtered-empty and query-error states instead of rendering a blank ledger", () => {
    render(<AuditRoom />);
    fireEvent.change(screen.getByLabelText("Filter audit requests by status"), { target: { value: "Overdue" } });
    expect(screen.getByText("No requests match this view")).toBeTruthy();

    useQuery.mockReturnValue({ isLoading: false, error: { message: "Service unavailable" }, data: undefined });
    render(<AuditRoom />);
    expect(screen.getByText("The audit room is unavailable")).toBeTruthy();
    expect(screen.getByText("Service unavailable")).toBeTruthy();
  });
});
