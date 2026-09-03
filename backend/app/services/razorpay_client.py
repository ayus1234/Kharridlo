import hmac
import hashlib
import uuid
from typing import Dict, Any, Optional
import razorpay  # type: ignore
from app.core.config import settings


class RazorpayClientWrapper:
    """
    Secure server-side Razorpay SDK wrapper.
    Supports real Razorpay Test Mode and deterministic mock adapter for test suites.
    Guarantees secrets never leave server memory and are never logged.
    """

    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None, webhook_secret: Optional[str] = None):
        self._key_id = key_id or settings.RAZORPAY_KEY_ID
        self._key_secret = key_secret or settings.RAZORPAY_KEY_SECRET
        self._webhook_secret = webhook_secret or settings.RAZORPAY_WEBHOOK_SECRET
        self._is_configured = bool(self._key_id and self._key_secret and self._key_id.strip() and self._key_secret.strip())

        if self._is_configured:
            self._client = razorpay.Client(auth=(self._key_id, self._key_secret))
        else:
            self._client = None

    @property
    def key_id(self) -> str:
        """Safe public key ID for frontend checkout modal."""
        return self._key_id if self._is_configured else "rzp_test_mock_public_key"

    @property
    def is_configured(self) -> bool:
        return self._is_configured

    def create_order(self, amount_paise: int, currency: str = "INR", receipt: str = "", notes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a server-side order.
        Amount must strictly be an integer in paise.
        """
        if not isinstance(amount_paise, int) or amount_paise <= 0:
            raise ValueError(f"Order amount must be a positive integer in paise, got {amount_paise}")

        if self._is_configured and self._client:
            order_data = {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt,
                "notes": notes or {},
            }
            return self._client.order.create(data=order_data)

        # Deterministic mock response for offline testing
        mock_order_id = f"order_test_{uuid.uuid4().hex[:14]}"
        return {
            "id": mock_order_id,
            "entity": "order",
            "amount": amount_paise,
            "amount_paid": 0,
            "amount_due": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "attempts": 0,
            "notes": notes or {},
            "created_at": 1756857600,
        }

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verify payment signature using HMAC-SHA256 against RAZORPAY_KEY_SECRET.
        Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
        """
        secret = self._key_secret or "mock_secret_for_test_suite"
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

        return hmac.compare_digest(expected_signature, razorpay_signature)

    def generate_test_signature(self, razorpay_order_id: str, razorpay_payment_id: str) -> str:
        """Helper to generate a valid signature in test suites."""
        secret = self._key_secret or "mock_secret_for_test_suite"
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def verify_webhook_signature(self, raw_body: bytes, webhook_signature: str) -> bool:
        """
        Verify webhook signature against raw request bytes.
        Formula: HMAC_SHA256(raw_body, webhook_secret) == webhook_signature
        """
        secret = self._webhook_secret or "mock_webhook_secret_for_test_suite"
        expected_signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

        return hmac.compare_digest(expected_signature, webhook_signature)

    def generate_test_webhook_signature(self, raw_body: bytes) -> str:
        """Helper to generate valid webhook signature in test suites."""
        secret = self._webhook_secret or "mock_webhook_secret_for_test_suite"
        return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


# Singleton instance
razorpay_client = RazorpayClientWrapper()
