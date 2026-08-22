/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useQuery = vi.hoisted(() => vi.fn());

vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>, useRoute: () => [true, { slug: "iso-27001-control-assessment" }] }));
vi.mock("@/lib/trpc", () => ({ trpc: { portfolio: { caseStudy: { useQuery } } } }));
vi.mock("@/components/PortfolioChrome", () => ({ SiteShell: ({ children }: { children: React.ReactNode }) => <>{children}</>, FrameworkTags: () => <span>ISO 27001</span>, ProvenanceBadge: ({ label }: { label: string }) => <span>{label}</span> }));
vi.mock("@/components/ArtifactViewer", () => ({ default: () => <div>Artifact workspace</div> }));
vi.mock("@/components/SourcesPanel", () => ({ default: () => <div>Sources</div> }));

import CaseStudy from "./CaseStudy";

describe("ISO technical evidence case", () => {
  it("renders the runnable technical evidence evaluator with an explicit non-certification boundary", () => {
    useQuery.mockReturnValue({ isLoading: false, data: { study: { slug: "iso-27001-control-assessment", title: "ISO 27001 Control Assessment", summary: "Technical evidence", scenario: "Independent Research", provenance: "Independent Research", accent: "#3d5a97", frameworks: ["ISO 27001"], codeLanguage: "typescript", code: "evaluateIsoTechnicalEvidence(manifest)" }, sections: [{ id: 1, sectionTitle: "Controls", body: "MFA-backed privileged access and centralized audit logging." }, { id: 2, sectionTitle: "Artifacts", body: "Results are technical evidence cues for analyst review, not an automated certification determination." }], artifacts: [], sources: [] } });
    render(<CaseStudy />);
    expect(screen.getByText("Runnable typescript code")).toBeTruthy();
    expect(screen.getByText("evaluateIsoTechnicalEvidence(manifest)")).toBeTruthy();
    expect(screen.getByText(/not an automated certification determination/i)).toBeTruthy();
  });
});
