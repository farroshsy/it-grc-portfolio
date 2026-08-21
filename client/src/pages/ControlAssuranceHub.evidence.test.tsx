/** @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvidenceIntake } from "./ControlAssuranceHub";

afterEach(() => cleanup());

const control = { controlId: "CAA-AC-01", systemId: "SYS-01", title: "Access review", objective: "Confirm access is reviewed.", owner: "Control Owner", frequency: "Quarterly", framework: "ISO 27001", status: "Evidence requested" };
const baseProps = { controls: [control], submissions: [], attachments: [], selectedControl: "CAA-AC-01", setControlId: () => undefined, evidenceSummary: "Illustrative evidence description.", setEvidenceSummary: () => undefined, evidenceFile: null, isAuthenticated: true, canReview: false, busy: false, feedback: "", onSubmit: (event: React.FormEvent) => event.preventDefault(), onReview: () => undefined, onTest: () => undefined };

function evidenceFileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("EvidenceIntake attachment and role affordances", () => {
  it("keeps evidence submission disabled for non-control-owner roles", () => {
    render(<EvidenceIntake {...baseProps} canSubmit={false} onSelectFile={() => undefined} />);
    const submitButton = screen.getByRole("button", { name: "Submit evidence for review" }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(evidenceFileInput().disabled).toBe(true);
    expect(screen.getByText("Your current role can review or decide; it cannot submit control-owner evidence.")).toBeTruthy();
  });

  it("accepts a PDF selection for a permitted control owner", () => {
    const selectFile = vi.fn();
    render(<EvidenceIntake {...baseProps} canSubmit onSelectFile={selectFile} />);
    const attachmentInput = evidenceFileInput();
    fireEvent.change(attachmentInput, { target: { files: [new File(["proof"], "access-review.pdf", { type: "application/pdf" })] } });
    expect(attachmentInput.disabled).toBe(false);
    expect(selectFile).toHaveBeenCalledTimes(1);
    expect(selectFile.mock.calls[0][0]?.name).toBe("access-review.pdf");
  });
});
