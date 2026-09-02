# DhanKriya — Audit Trail & Observability Architecture

This document defines the event tracking, append-only audit logging, and OpenTelemetry observability architecture for **DhanKriya**, ensuring that every agent action, policy evaluation, and financial execution is explainable, measurable, and tamper-evident.

---

## 1. The Explainability Hierarchy

DhanKriya enforces strict privacy and security boundaries in its logging:

```text
┌───────────────────────────────────────────────────────────┐
│ DISCARDED / EPHEMERAL                                     │
│ • Raw LLM Scratchpads & Chain-of-Thought Reasoning        │
│ • Private API Keys & User Authentication Secrets          │
└───────────────────────────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────┐
│ DEVELOPER & AUDITOR OBSERVABILITY (OpenTelemetry)         │
│ • Trace Spans, Latency (ms), Memory & Cost Metrics        │
│ • Full Tool Call Payloads & Sanitized Input Arguments     │
└───────────────────────────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────┐
│ MERCHANT ACTIVITY STREAM (Control Center)                 │
│ • AI Session Conversions, SKU Trends, Policy Alerts       │
│ • Real-time Protection Feed (e.g., "₹1.49L Blocked")      │
└───────────────────────────────────────────────────────────┘
                             ▼
┌───────────────────────────────────────────────────────────┐
│ PUBLIC BUYER AUDIT TRAIL (Receipt & Verification)         │
│ • Plain-Language Milestones (Intent -> Match -> Auth)     │
│ • Cryptographic Payment Signatures & Timestamps           │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Event Taxonomy & Schema Specification

Every event persisted in the `audit_logs` table adheres to the following unified schema:

```python
class AuditEvent(BaseModel):
    event_id: str = Field(..., description="Unique UUIDv4 with 'ev_' prefix")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_id: str = Field(..., description="Correlated conversational session ID")
    trace_id: Optional[str] = Field(None, description="OpenTelemetry 128-bit trace ID")
    actor: Literal["BUYER", "AGENT", "POLICY_ENGINE", "PAYMENT_GATEWAY", "MERCHANT"]
    action: str = Field(..., description="Standardized event name")
    entity_type: Literal["SESSION", "PRODUCT", "CART", "ORDER", "PAYMENT", "POLICY"]
    entity_id: Optional[str] = None
    decision: Literal["ALLOW", "BLOCK", "REQUIRE_CONFIRMATION", "EXECUTE", "FAIL"]
    metadata: Dict[str, Any] = Field(default_factory=dict)
```

### Standard Event Definitions

| Category | Action Name | Actor | Description | Safe Metadata Captured |
| :--- | :--- | :--- | :--- | :--- |
| **AI** | `INTENT_PARSED` | `AGENT` | Natural language parsed into constraints | Budget limit, category, extracted specs |
| **AI** | `TOOL_INVOCATION` | `AGENT` | Controlled tool call triggered | Tool name, sanitised input parameters |
| **AI** | `TOOL_COMPLETED` | `AGENT` | Tool execution returned data | Candidate count, execution latency (ms) |
| **Policy** | `POLICY_EVALUATED` | `POLICY_ENGINE` | Cart checked against spending rules | Total amount, spending limit, buffer |
| **Policy** | `POLICY_BLOCKED` | `POLICY_ENGINE` | Safety cap exceeded or item out of stock | Excess amount, rule ID, alternatives |
| **Policy** | `AUTH_TOKEN_ISSUED` | `POLICY_ENGINE` | Cryptographic approval token generated | Token hash, expiration timestamp |
| **Commerce**| `ORDER_CREATED` | `BUYER` | Confirmed order generated in DB | Order ID, item count, total paise |
| **Payment** | `PAYMENT_INITIATED` | `PAYMENT_GATEWAY` | Razorpay order generated | Razorpay order ID, amount in paise |
| **Payment** | `SIGNATURE_VERIFIED`| `PAYMENT_GATEWAY` | HMAC-SHA256 signature verified | Payment ID, status, verified timestamp |
| **Security**| `INJECTION_DEFENSE` | `POLICY_ENGINE` | Untrusted description neutralized | Offending SKU ID, blocked token count |

---

## 3. OpenTelemetry Distributed Tracing

DhanKriya backend services are instrumented using the OpenTelemetry Python SDK:

```python
from opentelemetry import trace

tracer = trace.get_tracer("dhankriya.commerce")

async def handle_buyer_checkout(cart_id: str, auth_token: str):
    with tracer.start_as_current_span("policy_gate.evaluate") as policy_span:
        policy_result = evaluate_cart_policy(cart_id)
        policy_span.set_attribute("dhankriya.policy.decision", policy_result.decision)
        policy_span.set_attribute("dhankriya.cart.total", float(policy_result.cart_total))
        
    if policy_result.decision == "PASSED":
        with tracer.start_as_current_span("razorpay.create_order") as rzp_span:
            rzp_order = payment_service.create_razorpay_order(policy_result.cart_total)
            rzp_span.set_attribute("razorpay.order_id", rzp_order["id"])
```

### Export Targets
* In Development / Buildathon Demo: Local OpenTelemetry stdout exporter and in-memory trace buffer for the Merchant Activity view.
* In Production: Google Cloud Trace and Cloud Logging via OpenTelemetry OTLP exporter.

---

## 4. Live Merchant Activity Stream

To drive the real-time **AI Commerce Command Center** in the Merchant Dashboard:
* Endpoint: `GET /api/audit/agent-trace` (supports polling or Server-Sent Events).
* Feed emits sanitized events instantly as buyers interact with the platform:
  * Green cards for successful recommendations and verified payments.
  * Amber cards for high-value authorization gates.
  * Slate/Indigo cards for intercepted over-budget attempts (*"Safety Gate blocked ₹1,49,000 purchase attempt for Session #S-4819"*).
