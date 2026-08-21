# Grafana Webhook Integration Boundary

The selected provider is **Grafana**. Grafana contact points can send JSON webhook notifications, support HMAC-SHA256 signatures, and can optionally include a timestamp in the signature calculation for replay protection. The endpoint therefore remains inactive unless an administrator enables the Grafana provider configuration and the server-side `GRAFANA_WEBHOOK_SECRET` is configured.

The endpoint contract accepts a custom Grafana payload containing a `traceExport` field in one of the existing FlowGuard-supported JSON shapes: OTLP JSON, Jaeger JSON, or generic spans JSON. Only the resulting execution summary, evidence hash, trace identifier, and delivery receipt are retained; raw webhook payloads and raw trace exports are not stored.

Grafana’s standard webhook payload is alert-oriented. A FlowGuard technical-control evaluation occurs only when the contact point is configured with a custom payload that supplies the trace export. Otherwise the endpoint rejects the delivery with a clear contract error, while the manual JSON import remains the fallback.

## Source

- [Grafana: Configure webhook notifications](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier/), accessed 2026-08-21.
