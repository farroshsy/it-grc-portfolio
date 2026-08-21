/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommandCenter, ConnectionBoundary, EvidenceIntake, FindingsRemediation, PbcWorkpapers, PolicyWorkspace } from "./ControlAssuranceHub";

afterEach(() => cleanup());

describe("Control Assurance Hub empty operational queues", () => {
  it("explains every empty workspace queue instead of rendering a blank operational view", () => {
    render(<><CommandCenter metrics={{ evidenceToReview: 0, exceptions: 0, pendingRetest: 0, readyForEngineering: 0 }} controls={[]} findings={[]} submissions={[]} links={[]} onNavigate={() => undefined} /><EvidenceIntake controls={[]} submissions={[]} attachments={[]} selectedControl="" setControlId={() => undefined} evidenceSummary="" setEvidenceSummary={() => undefined} evidenceFile={null} onSelectFile={() => undefined} isAuthenticated={false} canSubmit={false} canReview={false} busy={false} feedback="" onSubmit={(event) => event.preventDefault()} onReview={() => undefined} onTest={() => undefined} /><FindingsRemediation findings={[]} links={[]} acceptances={[]} canTreat={false} canDecideRisk={false} busy={false} onTreatment={() => undefined} onPrepare={() => undefined} onSync={() => undefined} onProposeAcceptance={() => undefined} onDecideAcceptance={() => undefined} /><PbcWorkpapers requests={[]} /><PolicyWorkspace policies={[]} /><ConnectionBoundary links={[]} /></>);
    expect(screen.getByText("No operational records are in scope")).toBeTruthy();
    expect(screen.getByText("No controls are available for evidence intake")).toBeTruthy();
    expect(screen.getByText("No findings require a treatment decision")).toBeTruthy();
    expect(screen.getByText("No PBC requests are open")).toBeTruthy();
    expect(screen.getByText("No policy references are loaded")).toBeTruthy();
    expect(screen.getByText("No remediation handoffs are queued")).toBeTruthy();
  });
});
