# DhanKriya — Razorpay Integration & Payment State Machine

This document details the complete end-to-end integration of **Razorpay Test Mode** within **DhanKriya**, establishing server-side order generation, Standard Checkout orchestration, cryptographic signature verification, idempotency protection, and webhook ingestion.

---

## 1. End-to-End Payment Sequence

```text
[BUYER]                        [FASTAPI BACKEND]                     [RAZORPAY TEST API]
   │                                   │                                      │
   │ 1. Clicks [Authorize & Pay]       │                                      │
   ├──────────────────────────────────►│                                      │
   │    POST /api/payments/create-order│                                      │
   │    (Idempotency-Key: uuid)        │ 2. Policy Check PASSED               │
   │                                   │    Calculates Amount in Paise        │
   │                                   ├─────────────────────────────────────►│
   │                                   │    POST /v1/orders                   │
   │                                   │    (amount: 6649800, receipt: rcpt)  │
   │                                   │                                      │
   │                                   │◄─────────────────────────────────────┤
   │                                   │    Returns: order_test_981249        │
   │ 3. Returns order_id & key_id      │                                      │
   │◄──────────────────────────────────┤                                      │
   │                                   │                                      │
   │ 4. Opens Razorpay Checkout Modal  │                                      │
   │    (Simulates Test Card / UPI)    │                                      │
   ├───────────────────────────────────┼─────────────────────────────────────►│
   │                                   │                                      │
   │ 5. Returns Payment Response       │                                      │
   │    (pay_test_881923, signature)   │                                      │
   │◄──────────────────────────────────┼──────────────────────────────────────┤
   │                                   │                                      │
   │ 6. POST /api/payments/verify      │                                      │
   ├──────────────────────────────────►│                                      │
   │                                   │ 7. Cryptographic HMAC Verification   │
   │                                   │    order_id + "|" + payment_id       │
   │                                   │    Transitions Order: PAID           │
   │ 8. Confirmed (200 OK)             │    Persists Audit Log                │
   │◄──────────────────────────────────┤                                      │
   │                                   │                                      │
   │                                   │◄─────────────────────────────────────┤
   │                                   │ 9. Asynchronous Webhook              │
   │                                   │    (event: payment.captured)         │
```

---

## 2. Order Creation & Paise Transformation

In Indian payment systems, all amounts must be communicated in the smallest currency unit (**paise**, where ₹1 = 100 paise).
* A cart subtotal of `₹66,498.00` is converted strictly server-side:
  $$\text{amount\_paise} = \text{int}(\text{Decimal}("66498.00") \times 100) = 6649800$$
* Backend invokes the official Razorpay Python client:
  ```python
  import razorpay
  
  client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
  
  order_payload = {
      "amount": amount_paise,
      "currency": "INR",
      "receipt": f"rcpt_{order.id}",
      "notes": {
          "buyer_id": order.buyer_id,
          "merchant_id": order.merchant_id,
          "dhan_kriya_session": session_id
      }
  }
  razorpay_order = client.order.create(data=order_payload)
  ```

---

## 3. Client-Side Standard Checkout Launch

The frontend dynamically loads the Razorpay checkout script (`https://checkout.razorpay.com/v1/checkout.js`) and initializes the modal:

```typescript
const options: RazorpayOptions = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, // Public Key ONLY
  amount: orderData.amount_paise,
  currency: "INR",
  name: "TechNova Store by DhanKriya",
  description: "Order #DK-10042 (Bounded AI Commerce)",
  order_id: orderData.razorpay_order_id,
  handler: async function (response: RazorpayPaymentResponse) {
    // 1. Submit tokens for server-side cryptographic verification
    await verifyPayment({
      order_id: orderData.order_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    });
  },
  modal: {
    ondismiss: function () {
      toast.info("Payment session dismissed. Order remains pending in cart.");
    }
  },
  prefill: {
    name: "Ayush Nathani",
    email: "buyer@dhankriya.ai",
    contact: "9999999999"
  },
  theme: {
    color: "#4f46e5" // DhanKriya Indigo
  }
};

const rzp = new window.Razorpay(options);
rzp.open();
```

---

## 4. Server-Side Cryptographic Signature Verification

To prevent client-side spoofing or MITM tampering, payment confirmation occurs **only after cryptographic HMAC-SHA256 signature verification** on the backend:

```python
import hmac
import hashlib

def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    key_secret: str
) -> bool:
    message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
    generated_signature = hmac.new(
        key=key_secret.encode("utf-8"),
        msg=message,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(generated_signature, razorpay_signature)
```

---

## 5. Idempotency & Duplicate-Payment Protection

DhanKriya enforces strict idempotency at the database and state machine layers:

```text
[CREATED] ──► [PENDING_PAYMENT] ──► [PAID] ──► [FULFILLED]
     │                 │
     ▼                 ▼
[CANCELLED]         [FAILED]
```

1. **Idempotency Keys:** Client generates a unique UUIDv4 per checkout session passed in the `Idempotency-Key` HTTP header.
2. **State Locking:** When an order transitions to `PENDING_PAYMENT`, an exclusive row-lock is held in PostgreSQL.
3. **No Double-Capture:** If an order has status `PAID`, subsequent calls to `/api/payments/create-order` or `/api/payments/verify` with the same key immediately return the existing confirmed order without touching the Razorpay API.

---

## 6. Webhook Ingestion Strategy

To handle edge cases where a user closes the browser immediately after payment authorization:
* Endpoint: `POST /api/payments/webhook`
* Subscribed Events: `payment.captured`, `payment.failed`, `order.paid`
* Verification: Validates `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`.
* Reconciliation: If order is still `PENDING_PAYMENT`, webhook automatically marks it `PAID` and emits an audit event (`ACTOR: RAZORPAY_WEBHOOK`).
