export type PaymentSecurityNode = {
  id: string;
  label: string;
  classification: "CDE component" | "External party" | "Security-supporting system" | "Out of CDE by design assumption";
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  scopeQuestion: string;
  controlIntent: string;
  evidence: string[];
};

export type PaymentSecurityFlow = {
  id: string;
  from: string;
  to: string;
  label: string;
  data: string;
  boundary: string;
  scopeQuestion: string;
  controlIntent: string;
  evidence: string[];
};

export const paymentSecurityNodes: PaymentSecurityNode[] = [
  {
    id: "customer",
    label: "Customer browser",
    classification: "External party",
    x: 54, y: 118, width: 168, height: 76,
    description: "A customer begins a simulated card-not-present payment journey from an external browser session.",
    scopeQuestion: "Does the browser present payment fields directly, or does it route data to a hosted payment experience?",
    controlIntent: "Reduce exposure by keeping payment-account data entry separated from the merchant application where the design supports it.",
    evidence: ["Hosted-field integration design", "Transport-security configuration", "Browser-to-gateway test trace"],
  },
  {
    id: "checkout",
    label: "Merchant checkout",
    classification: "Out of CDE by design assumption",
    x: 282, y: 118, width: 180, height: 76,
    description: "A fictional checkout application receives a payment token and outcome, rather than a full PAN, under the simulated hosted-field pattern.",
    scopeQuestion: "Can the application, its logs, or its support tooling receive or reconstruct payment-account data?",
    controlIntent: "Validate the token-only design and prevent sensitive values from entering application logs, telemetry, or support workflows.",
    evidence: ["Application configuration export", "Token-only test output", "Log masking test result"],
  },
  {
    id: "gateway",
    label: "Payment gateway edge",
    classification: "CDE component",
    x: 530, y: 118, width: 190, height: 76,
    description: "The simulated gateway receives the payment data entry payload and mediates tokenization and authorization routing.",
    scopeQuestion: "What payment-account data is received, how long is it retained, and which services can administratively affect this component?",
    controlIntent: "Constrain administrative access, document the service boundary, and retain evidence of security-relevant configuration.",
    evidence: ["Service inventory", "Gateway configuration baseline", "Privileged-access review"],
  },
  {
    id: "acquirer",
    label: "Acquirer / card network",
    classification: "External party",
    x: 856, y: 118, width: 200, height: 76,
    description: "An external payment ecosystem participant receives the simulated authorization request and returns a decision.",
    scopeQuestion: "What is the accountability boundary for the interface, message protection, and third-party service assurance?",
    controlIntent: "Maintain a documented interface boundary and evidence of applicable third-party due diligence.",
    evidence: ["Third-party assessment record", "Interface security design", "Service responsibility matrix"],
  },
  {
    id: "tokenVault",
    label: "Token vault",
    classification: "CDE component",
    x: 530, y: 310, width: 190, height: 76,
    description: "The simulated token service maintains the controlled relationship between a payment token and the payment account data it represents.",
    scopeQuestion: "Who can access the token relationship and the associated key-management functions?",
    controlIntent: "Protect the tokenization service, its keys, and privileged operations with traceable access and change records.",
    evidence: ["Key-management procedure", "Token-service access review", "Change approval sample"],
  },
  {
    id: "orchestrator",
    label: "Payment orchestrator",
    classification: "CDE component",
    x: 530, y: 492, width: 190, height: 76,
    description: "A fictional orchestration service uses the token and authorization outcome to coordinate a payment transaction without returning account data to the checkout.",
    scopeQuestion: "Can routing, retry, or failure handling alter the protection of the payment flow?",
    controlIntent: "Require controlled change management, service-account governance, and transaction-integrity monitoring.",
    evidence: ["Deployment approval", "Service-account inventory", "Transaction monitoring review"],
  },
  {
    id: "siem",
    label: "Telemetry & SIEM",
    classification: "Security-supporting system",
    x: 856, y: 310, width: 200, height: 76,
    description: "A security-monitoring service receives events from the payment environment and is expected to avoid recording payment-account data.",
    scopeQuestion: "Could logging or alerting receive payment-account data, or could compromised monitoring affect detection capability?",
    controlIntent: "Verify log minimization, access control, retention, and documented review of security-relevant events.",
    evidence: ["Logging configuration", "PAN masking test", "Alert-review attestation"],
  },
  {
    id: "pam",
    label: "Privileged access plane",
    classification: "Security-supporting system",
    x: 282, y: 492, width: 180, height: 76,
    description: "A privileged-access workflow provides time-bound administrative access to selected payment components in the simulated design.",
    scopeQuestion: "Can privileged identities affect the confidentiality, integrity, or availability of the payment environment?",
    controlIntent: "Enforce approval-based elevation, session traceability, and periodic access review.",
    evidence: ["Elevation approval", "Session audit trail", "Quarterly access-review record"],
  },
];

export const paymentSecurityFlows: PaymentSecurityFlow[] = [
  { id: "f1", from: "customer", to: "checkout", label: "1 · Initiate checkout", data: "Order context", boundary: "External → merchant", scopeQuestion: "Does the checkout initiation contain only order context, or can a client-side implementation introduce payment-account data before the hosted flow?", controlIntent: "Document the browser integration and validate that payment fields are not introduced into merchant-controlled application paths.", evidence: ["Browser integration record", "Checkout configuration export", "Token-only regression test"] },
  { id: "f2", from: "checkout", to: "gateway", label: "2 · Hosted payment entry", data: "Simulated payment entry payload", boundary: "Merchant → CDE", scopeQuestion: "At this boundary, which component receives payment-account data and which merchant-controlled systems can affect that protection?", controlIntent: "Validate the hosted-entry pattern, protected transport, and control of code that can alter the payment collection experience.", evidence: ["Hosted-field architecture decision", "Transport security configuration", "Client-side change approval"] },
  { id: "f3", from: "gateway", to: "tokenVault", label: "3 · Tokenize", data: "PAN to payment token relationship", boundary: "Within CDE", scopeQuestion: "Where is the account-to-token relationship controlled, and what operations can access the associated key material?", controlIntent: "Limit access to tokenization functions and retain traceable key-management and administrative evidence.", evidence: ["Token-service design", "Key-management record", "Privileged session audit trail"] },
  { id: "f4", from: "gateway", to: "acquirer", label: "4 · Authorize", data: "Protected authorization request", boundary: "CDE → external party", scopeQuestion: "What protections and responsibilities apply while authorization data crosses into an external payment ecosystem?", controlIntent: "Define interface accountability, protect the transaction path, and retain third-party assurance evidence.", evidence: ["Interface security design", "Third-party responsibility matrix", "Service due-diligence record"] },
  { id: "f5", from: "gateway", to: "orchestrator", label: "5 · Return token & decision", data: "Payment token and authorization outcome", boundary: "Within CDE", scopeQuestion: "Can orchestration logic, retries, or error handling expose data or weaken transaction-integrity safeguards?", controlIntent: "Govern changes, service identities, and exception paths that can affect the payment process.", evidence: ["Deployment approval", "Service-account inventory", "Transaction-integrity monitoring record"] },
  { id: "f6", from: "gateway", to: "siem", label: "6 · Emit security events", data: "PAN-free security telemetry", boundary: "CDE → supporting system", scopeQuestion: "Does telemetry stay free of payment-account data while remaining sufficient for monitoring and investigation?", controlIntent: "Enforce logging minimization and demonstrate reviewed security monitoring without exposing account data.", evidence: ["Log masking test", "SIEM source configuration", "Alert-review attestation"] },
  { id: "f7", from: "pam", to: "gateway", label: "7 · Approved administration", data: "Time-bound privileged session", boundary: "Supporting system → CDE", scopeQuestion: "Which privileged identities can affect the gateway, and can their activity be approved, time-bound, and reconstructed?", controlIntent: "Require controlled elevation and maintain a reviewable audit trail for administrative sessions.", evidence: ["Elevation approval", "Session audit trail", "Periodic privileged-access review"] },
];

export function connectedFlowIds(nodeId: string) {
  return paymentSecurityFlows.filter((flow) => flow.from === nodeId || flow.to === nodeId).map((flow) => flow.id);
}

export function paymentFlowById(flowId: string) {
  return paymentSecurityFlows.find((flow) => flow.id === flowId);
}
