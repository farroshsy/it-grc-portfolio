# Interactive Payment-Security Architecture — Design Record

## Purpose and Boundary

The interactive diagram will be an explicitly **Simulated Case Study** embedded within the existing Fintech Risk Assessment. It will show a fictional card-not-present payment path without displaying real account data, reproducing PCI DSS requirements, or claiming a compliant production architecture.

The diagram is designed to demonstrate how an IT GRC analyst scopes a payment flow: identify where payment-account data could enter, trace systems that store, process, transmit, or can affect the security of that environment, and name the control evidence that substantiates the scope decision. PCI SSC describes a data-flow diagram as showing how and where data moves through applications, systems, networks, and external parties; its glossary defines the cardholder data environment to include systems, people, and processes handling account data plus systems with unrestricted connectivity to them.[1][2]

## Interactive Flow Model

| Element | Simulated classification | Interaction behavior | GRC evidence focus |
|---|---|---|---|
| Customer payment browser | External entry point | Select to reveal protected data-entry assumption | Hosted field integration design and transport-security configuration |
| Merchant checkout | Out of CDE when it receives only a token | Select to reveal no-PAN design assumption | Application configuration and token-only test trace |
| Payment gateway edge | CDE component | Select to reveal transient PAN handling scenario | Service inventory, security configuration, access reviews |
| Token vault | CDE component | Select to reveal token-to-PAN relationship risk | Key-management record, access review, tokenization design |
| Payment orchestrator | CDE component | Select to reveal authorization and routing role | Change records, service account review, transaction integrity test |
| Acquirer / card network | External connected party | Select to show accountability boundary | Third-party due diligence and interface security evidence |
| Telemetry and SIEM | Security-supporting system | Select to show PAN-free logging control | Log configuration, masking tests, review attestations |
| Privileged management plane | Connected security-impacting system | Select to show time-bound administration model | Elevation approvals, session audit trail, periodic access review |

## Flow Controls

Each selectable flow will identify the data category, boundary crossing, design intent, and a minimum evidence set. The simulated design uses a tokenized checkout pattern: account data is modeled as entering the payment gateway, while the checkout receives a token. This is an illustrative scoping decision, not a compliance determination.

## Highest-Value Remaining Portfolio Evidence

The next strongest hiring signals beyond the diagram are a simulated audit room with a PBC/evidence-request tracker, a short policy-and-procedure pack (access management, change management, incident handling, vulnerability management), and a one-page executive briefing that translates the dashboard into decisions and residual-risk asks. These artifacts directly reinforce audit coordination, policy maintenance, stakeholder communication, and remediation ownership in the target role.

## References

[1] [PCI Security Standards Council, *PCI DSS Scoping and Segmentation Guidance for Modern Network Architectures* — information supplement announced 9 September 2024](https://blog.pcisecuritystandards.org/new-information-supplement-pci-dss-scoping-and-segmentation-guidance-for-modern-network-architectures)

[2] [PCI Security Standards Council, *PCI SSC Glossary* — accessed 2026](https://www.pcisecuritystandards.org/glossary/)
