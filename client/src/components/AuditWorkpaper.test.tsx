/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuditWorkpaper from "./AuditWorkpaper";

describe("AuditWorkpaper", () => {
  it("changes the inspection pane when a simulated test procedure is selected", () => {
    render(<AuditWorkpaper />);
    fireEvent.click(screen.getByRole("button", { name: /Trace the selected elevation/i }));
    expect(screen.getByText(/One simulated sample lacked a retained work-item link/i)).toBeTruthy();
    expect(screen.getByText("Exception")).toBeTruthy();
  });
});
