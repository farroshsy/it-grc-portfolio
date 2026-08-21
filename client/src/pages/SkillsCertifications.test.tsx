/** @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SkillsCertifications from "./SkillsCertifications";

describe("SkillsCertifications", () => {
  it("switches the qualification evidence to the selected application path", () => {
    render(<SkillsCertifications />);
    fireEvent.click(screen.getByRole("button", { name: "Cloud GRC / Security Compliance Analyst" }));
    expect(screen.getByRole("heading", { name: "Cloud GRC / Security Compliance Analyst" })).toBeTruthy();
    expect(screen.getByText("Runnable AWS configuration-checking script")).toBeTruthy();
  });
});
