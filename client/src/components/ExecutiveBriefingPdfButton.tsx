import React, { useState } from "react";
import { Download } from "lucide-react";
import type { ExecutiveBriefingSummary } from "@shared/executiveBriefing";
import { downloadExecutiveBriefingPdf } from "@shared/executiveBriefingPdf";

export default function ExecutiveBriefingPdfButton({ briefing }: { briefing: ExecutiveBriefingSummary }) {
  const [exporting, setExporting] = useState(false);
  const exportPdf = () => {
    setExporting(true);
    window.setTimeout(() => {
      downloadExecutiveBriefingPdf(briefing);
      setExporting(false);
    }, 0);
  };
  return <button className="briefing-pdf-button" onClick={exportPdf} disabled={exporting}><Download size={14} /> {exporting ? "Preparing PDF…" : "Download one-page PDF"}</button>;
}
