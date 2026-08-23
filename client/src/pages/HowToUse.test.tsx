/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HowToUse from "./HowToUse";

describe("HowToUse", () => {
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
});
