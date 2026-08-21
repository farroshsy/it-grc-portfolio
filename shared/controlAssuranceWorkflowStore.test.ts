import { describe, expect, it } from "vitest";
import { createControlAssuranceWorkflowStore } from "./controlAssuranceWorkflowStore";

describe("Control Assurance Hub controlled workflow store", () => {
  it("persists the full evidence-to-retest lifecycle across controlled state transitions", () => {
    const workflow = createControlAssuranceWorkflowStore();
    workflow.submitEvidence("EVD-100", "CAA-AC-01");
    const finding = workflow.decideTest("EVD-100", "Exception");
    expect(workflow.state.evidence.get("EVD-100")?.status).toBe("Rejected");
    expect(workflow.state.controls.get("CAA-AC-01")?.status).toBe("Exception");
    expect(finding?.id).toBe("FND-EVD-100");
    workflow.setTreatment("FND-EVD-100", "Risk acceptance");
    const acceptance = workflow.proposeAcceptance("RA-100", "FND-EVD-100");
    workflow.decideAcceptance(acceptance.id, "Rejected");
    expect(workflow.state.findings.get("FND-EVD-100")?.status).toBe("Open");
    workflow.setTreatment("FND-EVD-100", "Remediation");
    workflow.syncRemediation("FND-EVD-100", "closed");
    expect(workflow.state.findings.get("FND-EVD-100")?.status).toBe("Pending retest");
    expect(workflow.state.remediation.get("FND-EVD-100")?.state).toBe("closed");
  });
});
