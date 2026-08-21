import { CheckCircle2, CircleHelp, ExternalLink, Network, ShieldAlert } from "lucide-react";
import React, { KeyboardEvent, useMemo, useState } from "react";
import { connectedFlowIds, paymentFlowById, paymentSecurityFlows, paymentSecurityNodes, type PaymentSecurityNode } from "@shared/paymentSecurityModel";
import { ProvenanceBadge } from "./PortfolioChrome";

const nodeById = Object.fromEntries(paymentSecurityNodes.map((node) => [node.id, node]));

function nodeCenter(node: PaymentSecurityNode) {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

function flowLine(flowId: string) {
  const flow = paymentSecurityFlows.find((item) => item.id === flowId);
  if (!flow) return null;
  const from = nodeById[flow.from];
  const to = nodeById[flow.to];
  if (!from || !to) return null;
  const a = nodeCenter(from);
  const b = nodeCenter(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const scale = 1 / Math.max(Math.abs(dx), Math.abs(dy), 1);
  const start = { x: a.x + dx * scale * 96, y: a.y + dy * scale * 44 };
  const end = { x: b.x - dx * scale * 96, y: b.y - dy * scale * 44 };
  return { ...flow, start, end, mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}

function keyboardSelect(event: KeyboardEvent<SVGGElement>, select: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    select();
  }
}

export default function PaymentSecurityDiagram() {
  const [selection, setSelection] = useState<{ type: "node" | "flow"; id: string }>({ type: "node", id: "gateway" });
  const selectedNode = selection.type === "node" ? nodeById[selection.id] ?? paymentSecurityNodes[0] : null;
  const selectedFlow = selection.type === "flow" ? paymentFlowById(selection.id) ?? paymentSecurityFlows[0] : null;
  const connected = useMemo(() => new Set(selectedNode ? connectedFlowIds(selectedNode.id) : selectedFlow ? [selectedFlow.id] : []), [selectedNode, selectedFlow]);
  const inspector = selectedFlow ? {
    title: selectedFlow.label,
    classification: selectedFlow.boundary,
    description: `${selectedFlow.data} travels from ${nodeById[selectedFlow.from]?.label ?? selectedFlow.from} to ${nodeById[selectedFlow.to]?.label ?? selectedFlow.to} in this fictional path.`,
    scopeQuestion: selectedFlow.scopeQuestion,
    controlIntent: selectedFlow.controlIntent,
    evidence: selectedFlow.evidence,
  } : {
    title: selectedNode!.label,
    classification: selectedNode!.classification,
    description: selectedNode!.description,
    scopeQuestion: selectedNode!.scopeQuestion,
    controlIntent: selectedNode!.controlIntent,
    evidence: selectedNode!.evidence,
  };

  return (
    <section className="payment-architecture" aria-labelledby="payment-architecture-heading">
      <div className="architecture-header">
        <div>
          <span className="eyebrow"><Network size={13} /> Interactive payment-security map</span>
          <h2 id="payment-architecture-heading">Trace the payment flow. Test the scope.</h2>
          <p>Select a system or follow a numbered flow to inspect the fictional data path, scoping question, control intent, and evidence that would support the assessment.</p>
        </div>
        <ProvenanceBadge label="Simulated Case Study" />
      </div>
      <div className="architecture-legend" aria-label="Diagram legend"><span><i className="legend-cde" /> CDE component</span><span><i className="legend-external" /> External party</span><span><i className="legend-support" /> Security-supporting system</span><span><i className="legend-assumption" /> Out of CDE by design assumption</span></div>
      <div className="architecture-diagram-wrap">
        <span className="diagram-scroll-hint">Swipe horizontally to inspect the complete map</span>
        <svg className="payment-svg" viewBox="0 0 1110 630" role="img" aria-label="Simulated payment-security architecture and data-flow diagram">
          <defs><marker id="payment-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#86cbb8" /></marker></defs>
          <rect x="488" y="72" width="278" height="540" rx="16" className="cde-boundary" />
          <text x="508" y="101" className="cde-label">SIMULATED CDE BOUNDARY</text>
          {paymentSecurityFlows.map((flow) => {
            const geometry = flowLine(flow.id);
            if (!geometry) return null;
            const emphasized = connected.has(flow.id);
            const isAdmin = flow.id === "f7";
            return <g key={flow.id} role="button" tabIndex={0} aria-label={`Inspect ${flow.label}`} className={emphasized ? "flow-group active" : "flow-group"} onClick={() => setSelection({ type: "flow", id: flow.id })} onKeyDown={(event) => keyboardSelect(event, () => setSelection({ type: "flow", id: flow.id }))}>
              <line x1={geometry.start.x} y1={geometry.start.y} x2={geometry.end.x} y2={geometry.end.y} className="flow-hit-area" />
              <line x1={geometry.start.x} y1={geometry.start.y} x2={geometry.end.x} y2={geometry.end.y} className={isAdmin ? "payment-flow admin" : "payment-flow"} markerEnd="url(#payment-arrow)" />
              <rect x={geometry.mid.x - 53} y={geometry.mid.y - 11} width="106" height="22" rx="5" className="flow-label-bg" />
              <text x={geometry.mid.x} y={geometry.mid.y + 3.5} textAnchor="middle" className="flow-label">{flow.label}</text>
            </g>;
          })}
          {paymentSecurityNodes.map((node) => {
            const active = node.id === selectedNode?.id;
            const kind = node.classification === "CDE component" ? "cde" : node.classification === "External party" ? "external" : node.classification === "Security-supporting system" ? "support" : "assumption";
            return <g key={node.id} role="button" tabIndex={0} aria-label={`Inspect ${node.label}`} className={`architecture-node ${kind} ${active ? "active" : ""}`} onClick={() => setSelection({ type: "node", id: node.id })} onKeyDown={(event) => keyboardSelect(event, () => setSelection({ type: "node", id: node.id }))}>
              <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="9" />
              <text x={node.x + 14} y={node.y + 31} className="node-title">{node.label}</text>
              <text x={node.x + 14} y={node.y + 53} className="node-type">{node.classification}</text>
            </g>;
          })}
        </svg>
      </div>
      <div className="architecture-inspector">
        <article className="inspector-primary"><div className="inspector-kicker"><span>{selectedFlow ? "Selected data flow" : "Selected component"}</span><span className="scope-classification">{inspector.classification}</span></div><h3>{inspector.title}</h3><p>{inspector.description}</p><div className="inspector-prompt"><CircleHelp size={16} /><div><strong>Scoping question</strong><p>{inspector.scopeQuestion}</p></div></div><div className="inspector-prompt"><ShieldAlert size={16} /><div><strong>Control intent</strong><p>{inspector.controlIntent}</p></div></div></article>
        <aside className="inspector-evidence"><span className="eyebrow"><CheckCircle2 size={13} /> Illustrative evidence</span><h3>What I would request</h3><ul>{inspector.evidence.map((item) => <li key={item}>{item}</li>)}</ul><a href="https://blog.pcisecuritystandards.org/new-information-supplement-pci-dss-scoping-and-segmentation-guidance-for-modern-network-architectures" target="_blank" rel="noreferrer">Review PCI SSC scoping guidance <ExternalLink size={13} /></a></aside>
      </div>
      <p className="architecture-disclaimer">This is a fictional, tokenized payment-flow illustration. It does not determine PCI DSS scope, demonstrate compliance, or represent a real payment environment.</p>
    </section>
  );
}

export function PciInterviewReadiness() {
  return <section className="interview-readiness" aria-labelledby="interview-readiness-heading"><div><span className="eyebrow">Interview readiness</span><h2 id="interview-readiness-heading">What this case lets you explain.</h2><p>Use the diagram to narrate a scoped assessment rather than recite framework names: where data moves, what can affect the environment, what evidence validates the design, and where a control owner must act.</p></div><div className="interview-columns"><article><span>Strong discussion prompts</span><ul><li>Why is the checkout treated as out of scope in this simulated design?</li><li>Which supporting systems could still affect payment security?</li><li>What would change your scoping conclusion?</li></ul></article><article><span>Highest-value next evidence</span><ul><li>Audit-room PBC tracker with evidence owners and due dates</li><li>Versioned policy pack for access, change, incident, and vulnerability control</li><li>One-page executive risk briefing with decisions and residual-risk asks</li></ul></article></div></section>;
}
