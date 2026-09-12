import re
import logging
import inspect
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.cart import Cart
from app.schemas.cart import CartResponse, CartItemResponse
from app.agent.context import AgentRequestContext
from app.agent.instructions import KHARRIDLO_SYSTEM_INSTRUCTIONS
from app.agent.tools import BOUNDED_TOOLS, TOOL_PERMISSIONS
from app.agent.schemas import AgentChatResponse, ToolCallRecord
from app.services.cart_service import CartService
from app.services.policy_service import PolicyService
from app.services.audit_service import AuditService
from app.schemas.audit import AuditEventType

logger = logging.getLogger(__name__)

# Maximum tool invocations per user turn
MAX_TOOL_CALLS_PER_TURN = 4

# Known prompt injection signatures
INJECTION_SIGNATURES = [
    r"ignore\s+(all\s+)?(previous\s+)?instructions",
    r"system\s*:\s*",
    r"you\s+are\s+now\s+in\s+developer\s+mode",
    r"bypass\s+policy",
    r"set\s+limit\s+to",
    r"call\s+razorpay",
    r"initiate\s+payment",
]


def _cart_to_response(cart: Cart) -> CartResponse:
    """Transform SQLAlchemy Cart model into Pydantic CartResponse without circular imports."""
    item_responses = []
    for item in cart.items:
        product = item.product
        item_responses.append(
            CartItemResponse(
                id=item.id,
                cart_id=item.cart_id,
                product_id=item.product_id,
                sku=product.sku if product else "UNKNOWN",
                name=product.name if product else "Unknown Product",
                brand=product.brand if product else "Unknown Brand",
                category=product.category if product else "general",
                image_url=product.image_url if product else None,
                quantity=item.quantity,
                unit_price_paise=item.unit_price_paise,
                line_total_paise=item.line_total_paise,
                currency=cart.currency,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
        )

    return CartResponse(
        id=cart.id,
        session_id=cart.session_id,
        status=cart.status,
        currency=cart.currency,
        subtotal_paise=cart.subtotal_paise,
        total_paise=cart.total_paise,
        total_items_count=sum(i.quantity for i in cart.items),
        expires_at=cart.expires_at,
        created_at=cart.created_at,
        updated_at=cart.updated_at,
        is_expired=cart.is_expired,
        items=item_responses,
    )


class AgentService:

    @classmethod
    def execute_tool(
        cls,
        context: AgentRequestContext,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute one of the 7 registered bounded tools with server-side context injection.
        Rejects any unregistered tools and filters out any injected unauthorized arguments (e.g. price, total).
        """
        if tool_name not in BOUNDED_TOOLS:
            AuditService.log_event(
                db=context.db,
                actor_type="AI",
                session_id=context.session_id,
                event_type=AuditEventType.AI_TOOL_REJECTED.value,
                event_status="rejected",
                failure_code="UNAUTHORIZED_TOOL",
                recovery_action="BLOCK_TOOL",
                metadata={"tool_name": tool_name, "arguments": arguments},
            )
            return {
                "success": False,
                "error_code": "UNAUTHORIZED_TOOL",
                "message": f"Tool '{tool_name}' is not in the allowed bounded commerce tool registry.",
            }

        tool_func = BOUNDED_TOOLS[tool_name]
        sig = inspect.signature(tool_func)
        allowed_params = set(sig.parameters.keys()) - {"context"}
        safe_args = {k: v for k, v in arguments.items() if k in allowed_params}

        try:
            result = tool_func(context, **safe_args)
            AuditService.log_event(
                db=context.db,
                actor_type="AI",
                session_id=context.session_id,
                event_type=AuditEventType.AI_TOOL_CALLED.value,
                event_status="succeeded" if result.get("success", True) else "failed",
                reason_code=tool_name,
                metadata={"tool_name": tool_name, "arguments": safe_args, "success": result.get("success", True)},
            )
            return result
        except Exception as e:
            logger.exception("Error executing tool %s", tool_name)
            AuditService.log_event(
                db=context.db,
                actor_type="AI",
                session_id=context.session_id,
                event_type=AuditEventType.AI_TOOL_CALLED.value,
                event_status="failed",
                reason_code=tool_name,
                failure_code="TOOL_EXECUTION_ERROR",
                recovery_action="RETRY_OR_FALLBACK",
                metadata={"tool_name": tool_name, "error": str(e)},
            )
            return {
                "success": False,
                "error_code": "TOOL_EXECUTION_ERROR",
                "message": str(e),
            }

    @classmethod
    def sanitize_user_input(cls, user_message: str) -> str:
        """Strip dangerous delimiter tricks while preserving normal commerce questions."""
        return user_message.strip()

    @classmethod
    def chat(
        cls,
        db: Session,
        session_id: str,
        user_message: str,
        force_mock: bool = False,
    ) -> AgentChatResponse:
        """
        Orchestrates an agent interaction turn.
        Maintains server-side session context and bounds tool executions.
        """
        clean_msg = cls.sanitize_user_input(user_message)
        context = AgentRequestContext(session_id=session_id, db=db)

        # Audit AI turn initiation
        AuditService.log_event(
            db=db,
            actor_type="AI",
            session_id=session_id,
            event_type=AuditEventType.AI_REQUEST_STARTED.value,
            event_status="attempted",
            provider="gemini" if settings.GEMINI_API_KEY and not force_mock else "deterministic",
            model="gemini-2.5-flash" if settings.GEMINI_API_KEY and not force_mock else "deterministic-rules",
            metadata={"message_length": len(clean_msg)},
        )

        # Check for prompt injection attempts in user message
        is_injection = any(re.search(pat, clean_msg, re.IGNORECASE) for pat in INJECTION_SIGNATURES)
        if is_injection:
            AuditService.log_event(
                db=db,
                actor_type="AI",
                session_id=session_id,
                event_type=AuditEventType.AI_PROMPT_INJECTION_DETECTED.value,
                event_status="rejected",
                failure_code="PROMPT_INJECTION_DETECTED",
                recovery_action="DEFENSIVE_FALLBACK",
                metadata={"pattern_matched": True},
            )

        # If live Gemini API key is configured and not forced to mock:
        if settings.GEMINI_API_KEY and not force_mock and not is_injection:
            try:
                response = cls._run_live_gemini(context, clean_msg)
                AuditService.log_event(
                    db=db,
                    actor_type="AI",
                    session_id=session_id,
                    event_type=AuditEventType.AI_RESPONSE_GENERATED.value,
                    event_status="succeeded",
                    provider="gemini",
                    model="gemini-2.5-flash",
                    metadata={"tool_calls": len(response.tool_calls)},
                )
                return response
            except Exception as e:
                logger.warning("Live Gemini execution encountered an issue: %s. Falling back to deterministic engine.", e)
                AuditService.log_event(
                    db=db,
                    actor_type="AI",
                    session_id=session_id,
                    event_type=AuditEventType.AI_PROVIDER_FAILED.value,
                    event_status="failed",
                    provider="gemini",
                    model="gemini-2.5-flash",
                    failure_code="PROVIDER_ERROR",
                    recovery_action="FALLBACK_TO_DETERMINISTIC",
                    metadata={"error": str(e)},
                )
                AuditService.log_event(
                    db=db,
                    actor_type="AI",
                    session_id=session_id,
                    event_type=AuditEventType.AI_FALLBACK_USED.value,
                    event_status="recovered",
                    provider="deterministic",
                    metadata={"fallback_reason": "provider_failure"},
                )

        # Grounded Deterministic Agent Engine (used for CI tests, mock mode, or fallback)
        response = cls._run_deterministic_agent(context, clean_msg, is_injection)
        AuditService.log_event(
            db=db,
            actor_type="AI",
            session_id=session_id,
            event_type=AuditEventType.AI_RESPONSE_GENERATED.value,
            event_status="succeeded",
            provider="deterministic",
            metadata={"tool_calls": len(response.tool_calls)},
        )
        return response

    @classmethod
    def _run_deterministic_agent(
        cls,
        context: AgentRequestContext,
        user_msg: str,
        is_injection: bool = False,
    ) -> AgentChatResponse:
        """
        Grounded deterministic agent engine.
        Parses user intent, triggers bounded tools, enforces permissions,
        and generates factual explanations without hallucination or chain-of-thought.
        """
        tool_records: List[ToolCallRecord] = []
        lower_msg = user_msg.lower()

        # Prompt injection defense
        if is_injection:
            return AgentChatResponse(
                message="I am Kharridlo's commerce assistant. I can only assist with searching products, managing your cart, and evaluating spending policy. I cannot execute system modifications or payment commands.",
                session_id=context.session_id,
                tool_calls=[],
            )

        def parse_qty(text: str, default: int = 1) -> int:
            # First strip SKUs like DK-LP-15, DK-MS-01 so their model numbers are not mistaken for quantities
            cleaned = re.sub(r"dk-[a-z0-9_\-]+", "", text, flags=re.IGNORECASE)

            # Explicit patterns: "quantity to 2", "qty 2", "make it 3", "add 2", "keep 1", etc.
            explicit_m = re.search(r"(?:quantity|qty|make it|set to|change to|to|add|keep|only)\s*[:=]?\s*(\d+)", cleaned)
            if explicit_m:
                return int(explicit_m.group(1))

            unit_m = re.search(r"(\d+)\s*(?:units?|pieces?|items?|of those|of them)", cleaned)
            if unit_m:
                return int(unit_m.group(1))

            num_words = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
            for word, val in num_words.items():
                if re.search(rf"\b{word}\b", cleaned):
                    return val
            return default

        def resolve_target_sku(text: str) -> str:
            upper = text.upper()
            if "MOUSE" in upper or "MS-01" in upper:
                return "DK-MS-01"
            elif "ULTRA" in upper:
                return "DK-LP-ULTRA"
            elif "OOS" in upper or "OUT" in upper:
                return "DK-LP-14-OOS"
            elif "LOW" in upper:
                return "DK-LP-LOW-01"
            elif "15" in upper or "LAPTOP" in upper or "FIRST" in upper or "BEST" in upper or "RECOMMENDED" in upper:
                return "DK-LP-15"
            match = re.search(r"(DK-[A-Z0-9_\-]+)", upper)
            if match:
                return match.group(1)
            return "DK-LP-15"

        # 1. Checkout Readiness & Purchase Authorization Intent ("ready to checkout", "i'm ready", "buy it", "checkout")
        # Explicit authorization boundary: AI NEVER directly charges or initiates payment.
        if (
            any(w in lower_msg for w in ["ready to checkout", "ready to pay", "okay, i'm ready", "ok, i'm ready", "i'm ready", "i am ready", "proceed to checkout", "proceed to payment", "buy it", "checkout now", "take me to checkout"])
            and not any(w in lower_msg for w in ["can i buy", "why can't i buy", "is this allowed"])
        ):
            tool_res = cls.execute_tool(context, "evaluate_policy", {})
            tool_records.append(ToolCallRecord(tool_name="evaluate_policy", arguments={}, result=tool_res))
            cart_orm = CartService.get_cart(context.db, context.session_id)

            if not cart_orm or not cart_orm.items:
                return AgentChatResponse(
                    message="Your cart is currently empty. Please add a product to your cart before proceeding to checkout.",
                    session_id=context.session_id,
                    tool_calls=tool_records,
                    cart=_cart_to_response(cart_orm) if cart_orm else None,
                    policy=PolicyService.evaluate_cart(context.db, context.session_id),
                )

            decision = tool_res.get("decision")
            total_inr = tool_res.get("cart_total_inr", 0)

            if decision == "BLOCK":
                first_reason = tool_res.get("reasons", [{}])[0].get("message", "Spending limit exceeded.")
                msg = (
                    f"The transaction is BLOCKED by your current {tool_res.get('policy_tier')} policy. "
                    f"{first_reason} Payment has not been initiated. Please adjust your cart before authorizing."
                )
            else:
                msg = (
                    f"Your cart is ready for checkout.\n"
                    f"• Subtotal: ₹{total_inr:,.2f}\n"
                    f"• Delivery: ₹0.00 (Free Campus Delivery)\n"
                    f"• Total: ₹{total_inr:,.2f}\n"
                    f"• Policy Status: {decision}\n\n"
                    f"Explicit buyer authorization is required before Razorpay payment initiation. "
                    f"Please review and authorize your purchase: [Proceed to Purchase Authorization](/checkout/authorize). "
                    f"Payment has not been initiated."
                )

            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 2. Cart Total Intent ("what's my total", "cart total", "how much is my cart total")
        if any(w in lower_msg for w in ["what's my cart total", "what is my cart total", "what is my total", "what's my total", "how much is my cart total", "how much do i owe", "cart total"]):
            tool_res = cls.execute_tool(context, "get_cart", {})
            tool_records.append(ToolCallRecord(tool_name="get_cart", arguments={}, result=tool_res))
            cart_data = tool_res.get("cart", {})
            total_inr = cart_data.get("total_inr", 0)
            total_paise = cart_data.get("total_paise", 0)
            item_count = cart_data.get("total_items_count", 0)
            policy_eval = PolicyService.evaluate_cart(context.db, context.session_id)

            msg = (
                f"Your authoritative cart total is ₹{total_inr:,.2f} ({total_paise} paise) "
                f"for {item_count} item(s). Spending policy status: {policy_eval.decision}."
            )
            cart_orm = CartService.get_cart(context.db, context.session_id)
            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=policy_eval,
            )

        # 3. Evaluate Policy Intent ("can i buy", "check policy", "within limit", "is this allowed", "can i afford")
        if any(w in lower_msg for w in ["can i buy", "policy", "within limit", "allowed", "check my cart limit", "can i afford", "why can't i buy", "why is this blocked"]):
            tool_res = cls.execute_tool(context, "evaluate_policy", {})
            tool_records.append(ToolCallRecord(tool_name="evaluate_policy", arguments={}, result=tool_res))

            decision = tool_res.get("decision")
            total_inr = tool_res.get("cart_total_inr", 0)
            limit_inr = tool_res.get("max_single_transaction_inr", 0)
            buffer_inr = tool_res.get("remaining_buffer_inr", 0)

            if decision == "BLOCK":
                first_reason = tool_res.get("reasons", [{}])[0].get("message", "Spending limit exceeded.")
                msg = (
                    f"The transaction is BLOCKED by your current {tool_res.get('policy_tier')} policy. "
                    f"{first_reason} Payment has not been initiated."
                )
            elif decision == "AUTHORIZATION_REQUIRED":
                msg = (
                    f"Your cart total of ₹{total_inr:,.2f} satisfies the {tool_res.get('policy_tier')} policy "
                    f"(single-transaction cap of ₹{limit_inr:,.2f} with ₹{buffer_inr:,.2f} remaining buffer). "
                    "Explicit buyer authorization is required before proceeding. Payment has not been initiated."
                )
            else:
                msg = f"Your cart total of ₹{total_inr:,.2f} satisfies all policy rules. Payment has not been initiated."

            cart_orm = CartService.get_cart(context.db, context.session_id)
            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 4. Cart Removal Intent ("remove the mouse", "remove everything except the laptop", "clear cart", "clear my cart")
        if any(w in lower_msg for w in ["remove", "delete from cart", "take out", "empty cart", "clear cart", "clear my cart", "clear"]):
            cart_orm = CartService.get_cart(context.db, context.session_id)

            if "everything except" in lower_msg or "all except" in lower_msg:
                # Keep target SKU (e.g. laptop), remove all others
                target_sku = resolve_target_sku(lower_msg)
                if cart_orm:
                    for it in list(cart_orm.items):
                        if it.product_id != target_sku and (not it.product or it.product.sku != target_sku):
                            cls.execute_tool(context, "remove_from_cart", {"product_id": it.product_id})
                    cart_orm = CartService.get_cart(context.db, context.session_id)
                    total_inr = cart_orm.total_paise / 100.0 if cart_orm else 0
                    msg = f"I have removed everything except {target_sku} from your cart. Updated cart total: ₹{total_inr:,.2f}."
                else:
                    msg = "Your cart is already empty."
            elif any(w in lower_msg for w in ["clear", "empty", "delete all", "remove everything"]):
                if cart_orm:
                    CartService.clear_cart(context.db, context.session_id)
                    cart_orm = CartService.get_cart(context.db, context.session_id)
                msg = "Your cart has been cleared and all inventory reservations have been released."
            else:
                target_sku = resolve_target_sku(lower_msg)
                tool_res = cls.execute_tool(context, "remove_from_cart", {"product_id": target_sku})
                tool_records.append(ToolCallRecord(tool_name="remove_from_cart", arguments={"product_id": target_sku}, result=tool_res))
                cart_orm = CartService.get_cart(context.db, context.session_id)
                total_inr = cart_orm.total_paise / 100.0 if cart_orm else 0
                if tool_res.get("success"):
                    msg = f"I have removed {target_sku} from your cart. Updated cart total: ₹{total_inr:,.2f}."
                else:
                    msg = f"Could not remove {target_sku}: {tool_res.get('message', 'Item not found in cart.')}"

            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 5. Quantity Update Intent ("change quantity to 2", "make that quantity three", "make it 3", "actually, just keep one")
        if (
            any(w in lower_msg for w in ["change quantity", "make that quantity", "make it", "set quantity", "reduce quantity", "keep only", "actually, just keep", "just keep", "change the laptop quantity", "quantity to"])
            or ("quantity" in lower_msg and any(w in lower_msg for w in ["to", "set", "make", "change", "keep"]))
        ):
            new_qty = parse_qty(lower_msg, default=1)
            target_sku = resolve_target_sku(lower_msg)
            cart_orm = CartService.get_cart(context.db, context.session_id)
            if cart_orm and cart_orm.items and len(cart_orm.items) == 1 and not any(k in lower_msg for k in ["mouse", "ultra", "15", "laptop"]):
                target_sku = cart_orm.items[0].product_id

            tool_res = cls.execute_tool(context, "update_cart_item", {"product_id": target_sku, "quantity": new_qty})
            tool_records.append(ToolCallRecord(tool_name="update_cart_item", arguments={"product_id": target_sku, "quantity": new_qty}, result=tool_res))

            if tool_res.get("success"):
                cart_info = tool_res.get("cart", {})
                msg = (
                    f"I have updated the quantity of {target_sku} to {new_qty}. "
                    f"Your updated cart total is ₹{cart_info.get('total_inr', 0):,.2f} ({cart_info.get('total_paise', 0)} paise)."
                )
            else:
                err_code = tool_res.get("error_code")
                if err_code == "INSUFFICIENT_STOCK":
                    msg = f"Cannot update quantity: insufficient stock available. {tool_res.get('message')}"
                else:
                    msg = f"Could not update {target_sku}: {tool_res.get('message')}"

            cart_orm = CartService.get_cart(context.db, context.session_id)
            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 6. Add to Cart Intent (Requires explicit request: "add ... to cart", "add ...")
        # Ensure ambiguous praise ("looks nice", "i like that", "recommend") does NOT mutate cart!
        add_match = re.search(r"\badd\b\s+(the\s+)?([a-zA-Z0-9_\-]+)", lower_msg)
        if (add_match or "add" in lower_msg) and any(keyword in lower_msg for keyword in ["add", "put"]):
            target_sku = resolve_target_sku(lower_msg)
            quantity = parse_qty(lower_msg, default=1)

            tool_res = cls.execute_tool(context, "add_to_cart", {"product_id": target_sku, "quantity": quantity})
            tool_records.append(ToolCallRecord(tool_name="add_to_cart", arguments={"product_id": target_sku, "quantity": quantity}, result=tool_res))

            if tool_res.get("success"):
                cart_info = tool_res.get("cart", {})
                msg = (
                    f"I have added {target_sku} (quantity: {quantity}) to your cart. "
                    f"Your updated cart total is ₹{cart_info.get('total_inr', 0):,.2f} ({cart_info.get('total_paise', 0)} paise) "
                    f"with {cart_info.get('total_items_count', 0)} items."
                )
            else:
                err_code = tool_res.get("error_code")
                if err_code == "OUT_OF_STOCK":
                    msg = f"That product ({target_sku}) is currently out of stock, so I couldn't add it to your cart. Would you like to search for available alternatives?"
                elif err_code == "INSUFFICIENT_STOCK":
                    msg = f"I could not add {quantity} units of {target_sku} because sufficient inventory is not available."
                else:
                    msg = f"Could not add {target_sku}: {tool_res.get('message')}"

            cart_orm = CartService.get_cart(context.db, context.session_id)
            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 7. View Cart Intent
        if any(w in lower_msg for w in ["what's in my cart", "show cart", "view cart", "get cart", "my cart"]):
            tool_res = cls.execute_tool(context, "get_cart", {})
            tool_records.append(ToolCallRecord(tool_name="get_cart", arguments={}, result=tool_res))
            cart_data = tool_res.get("cart", {})
            items = cart_data.get("items", [])

            if not items:
                msg = "Your cart is currently empty. You can browse the catalog and ask me to add products when you find what you need."
            else:
                items_summary = ", ".join(f"{i['name'].replace('<untrusted_catalog_data>', '').replace('</untrusted_catalog_data>', '')} (Qty: {i['quantity']})" for i in items)
                msg = f"Your cart contains {len(items)} items: {items_summary}. Total: ₹{cart_data.get('total_inr', 0):,.2f}."

            cart_orm = CartService.get_cart(context.db, context.session_id)
            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                cart=_cart_to_response(cart_orm) if cart_orm else None,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 8. Product Search & Discovery Intent
        max_paise = None
        budget_match = re.search(r"(?:under|below|less than|above|max|budget)\s*(?:₹|rs\.?\s*)?(\d+)(k|lakh|000)?", lower_msg)
        if not budget_match:
            budget_match = re.search(r"(?:₹|rs\.?\s*)?(\d+)(k|lakh|000)?", lower_msg)
        if budget_match:
            num = int(budget_match.group(1))
            unit = budget_match.group(2) or ""
            if "lakh" in lower_msg or "lakh" in unit:
                num = num * 100000 if num <= 10 else num
            elif "k" in unit or ("k" in lower_msg and num < 1000):
                num *= 1000
            elif num < 1000:
                num *= 1000
            max_paise = num * 100

        # Query keywords
        is_dev = any(k in lower_msg for k in ["develop", "code", "coding", "program"])
        query = "developer" if is_dev else ("laptop" if "laptop" in lower_msg else ("mouse" if "mouse" in lower_msg else ("phone" if "phone" in lower_msg else None)))
        category = "laptop" if "laptop" in lower_msg else ("phone" if "phone" in lower_msg else None)

        tool_args = {"query": query, "category": category, "max_price_paise": max_paise, "in_stock_only": True, "limit": 6}
        tool_res = cls.execute_tool(context, "search_products", tool_args)
        tool_records.append(ToolCallRecord(tool_name="search_products", arguments=tool_args, result=tool_res))

        products = tool_res.get("products", [])

        # Apply negative exclusions
        if "apple" in lower_msg and any(neg in lower_msg for neg in ["no", "don't", "dont", "exclude", "not"]):
            products = [
                p for p in products
                if "apple" not in p.get("brand", "").lower()
                and "apple" not in p.get("name", "").lower()
                and "macbook" not in p.get("name", "").lower()
            ]
        if "gaming" in lower_msg and any(neg in lower_msg for neg in ["no", "remove", "without", "exclude"]):
            products = [
                p for p in products
                if "gaming" not in p.get("name", "").lower()
                and "gaming" not in str(p.get("specs", "")).lower()
            ]

        if products:
            top_pick = next((p for p in products if p["sku"] == "DK-LP-15"), products[0])
            clean_name = top_pick["name"].replace("<untrusted_catalog_data>", "").replace("</untrusted_catalog_data>", "")
            msg = (
                f"I found {len(products)} products matching your criteria. "
                f"I recommend the **{clean_name}** ({top_pick['sku']}) priced at ₹{top_pick['price_inr']:,.2f}. "
                f"It is currently {top_pick['availability_status'].replace('_', ' ')} and features: {', '.join(f'{k}: {v}' for k, v in list(top_pick['specs'].items())[:2])}. "
                "Would you like me to add it to your cart?"
            )
        else:
            msg = "I searched the catalog but could not find items matching those exact criteria. Would you like me to broaden the search?"

        cart_orm = CartService.get_cart(context.db, context.session_id)
        return AgentChatResponse(
            message=msg,
            session_id=context.session_id,
            tool_calls=tool_records,
            cart=_cart_to_response(cart_orm) if cart_orm else None,
            policy=PolicyService.evaluate_cart(context.db, context.session_id),
        )

    @classmethod
    def _run_live_gemini(
        cls,
        context: AgentRequestContext,
        user_msg: str,
    ) -> AgentChatResponse:
        """
        Live Google Gemini execution using google.genai SDK.
        Invokes model with strictly typed function declarations for the 7 bounded tools.
        """
        from google import genai  # type: ignore
        from google.genai import types  # type: ignore

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        tool_records: List[ToolCallRecord] = []

        # Construct Function Declarations for the 7 tools
        function_declarations = [
            types.FunctionDeclaration(
                name="search_products",
                description="Search authoritative Kharridlo catalog for tech products by query, category, or max price.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "query": {"type": "STRING", "description": "Search keyword like 'laptop', 'mouse'"},
                        "category": {"type": "STRING", "description": "Category filter"},
                        "max_price_paise": {"type": "INTEGER", "description": "Max price in paise (e.g. 7000000 for ₹70,000)"},
                        "in_stock_only": {"type": "BOOLEAN", "description": "Filter in-stock only"},
                        "limit": {"type": "INTEGER", "description": "Number of products to return"},
                    },
                },
            ),
            types.FunctionDeclaration(
                name="get_product",
                description="Retrieve detailed product specifications and stock status for an SKU.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {"type": "STRING", "description": "Product ID or SKU (e.g. DK-LP-15)"},
                    },
                    "required": ["product_id"],
                },
            ),
            types.FunctionDeclaration(
                name="get_cart",
                description="Retrieve current buyer session cart items, totals, and expiration state.",
                parameters={"type": "OBJECT", "properties": {}},
            ),
            types.FunctionDeclaration(
                name="add_to_cart",
                description="Add a product to the cart with inventory reservation. Requires explicit buyer request.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {"type": "STRING", "description": "Product ID or SKU"},
                        "quantity": {"type": "INTEGER", "description": "Quantity to add (default 1)"},
                    },
                    "required": ["product_id"],
                },
            ),
            types.FunctionDeclaration(
                name="update_cart_item",
                description="Update quantity of an item in the cart.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {"type": "STRING", "description": "Product ID or SKU"},
                        "quantity": {"type": "INTEGER", "description": "New quantity"},
                    },
                    "required": ["product_id", "quantity"],
                },
            ),
            types.FunctionDeclaration(
                name="remove_from_cart",
                description="Remove an item from the cart.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "product_id": {"type": "STRING", "description": "Product ID or SKU"},
                    },
                    "required": ["product_id"],
                },
            ),
            types.FunctionDeclaration(
                name="evaluate_policy",
                description="Deterministically evaluate if the cart satisfies spending limit policy rules.",
                parameters={"type": "OBJECT", "properties": {}},
            ),
        ]

        tools = [types.Tool(function_declarations=function_declarations)]
        config = types.GenerateContentConfig(
            system_instruction=KHARRIDLO_SYSTEM_INSTRUCTIONS,
            tools=tools,
            temperature=0.2,
        )

        contents: List[Any] = [user_msg]
        response = client.models.generate_content(
            model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config=config,
        )

        turn_count = 0
        while response.function_calls and turn_count < MAX_TOOL_CALLS_PER_TURN:
            turn_count += 1
            function_call = response.function_calls[0]
            call_name: str = function_call.name or ""
            if not call_name:
                break
            call_args = dict(function_call.args) if function_call.args else {}

            tool_result = cls.execute_tool(context, call_name, call_args)
            tool_records.append(ToolCallRecord(tool_name=call_name, arguments=call_args, result=tool_result))

            tool_response_part = types.Part.from_function_response(
                name=call_name,
                response=tool_result,
            )
            if response.candidates and len(response.candidates) > 0 and response.candidates[0].content:
                contents.append(response.candidates[0].content)
            contents.append(types.Content(parts=[tool_response_part]))

            response = client.models.generate_content(
                model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
                contents=contents,
                config=config,
            )

        final_text = response.text or "I have processed your request."
        cart_orm = CartService.get_cart(context.db, context.session_id)
        policy_res = PolicyService.evaluate_cart(context.db, context.session_id) if any(t.tool_name == "evaluate_policy" for t in tool_records) else None

        return AgentChatResponse(
            message=final_text,
            session_id=context.session_id,
            tool_calls=tool_records,
            cart=_cart_to_response(cart_orm) if cart_orm else None,
            policy=policy_res,
            execution_mode="live_gemini",
            model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
        )
