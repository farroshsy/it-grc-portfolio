export type PortfolioStudy = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  scenario: string;
  provenance: "Academic" | "Independent Research" | "Simulated Case Study";
  accent: string;
  frameworks: string[];
  codeLanguage: string | null;
  code: string | null;
};

export type CaseSection = {
  id: number;
  sectionTitle: string;
  body: string;
  displayOrder: number;
};

export type ArtifactRow = {
  id: number;
  sortOrder: number;
  record: Record<string, string | number>;
};

export type PortfolioArtifact = {
  id: number;
  type: "Risk Register" | "Control Matrix" | "Gap Analysis" | "Regulatory Mapping" | "Control Testing" | "Remediation Plan";
  title: string;
  description: string;
  provenance: "Academic" | "Independent Research" | "Simulated Case Study";
  columns: string[];
  rows: ArtifactRow[];
};

export type PortfolioSource = {
  id: number;
  authority: string;
  publication: string;
  versionDate: string;
  url: string;
  note: string;
};
