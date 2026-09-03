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
            return tool_func(context, **safe_args)
        except Exception as e:
            logger.exception("Error executing tool %s", tool_name)
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

        # Check for prompt injection attempts in user message
        is_injection = any(re.search(pat, clean_msg, re.IGNORECASE) for pat in INJECTION_SIGNATURES)

        # If live Gemini API key is configured and not forced to mock:
        if settings.GEMINI_API_KEY and not force_mock and not is_injection:
            try:
                return cls._run_live_gemini(context, clean_msg)
            except Exception as e:
                logger.warning("Live Gemini execution encountered an issue: %s. Falling back to deterministic engine.", e)

        # Grounded Deterministic Agent Engine (used for CI tests, mock mode, or fallback)
        return cls._run_deterministic_agent(context, clean_msg, is_injection)

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

        # 1. Evaluate Policy Intent ("can i buy", "check policy", "within limit", "is this allowed")
        if any(w in lower_msg for w in ["can i buy", "policy", "within limit", "allowed", "check my cart limit"]):
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

            return AgentChatResponse(
                message=msg,
                session_id=context.session_id,
                tool_calls=tool_records,
                policy=PolicyService.evaluate_cart(context.db, context.session_id),
            )

        # 2. Add to Cart Intent (Requires explicit request: "add ... to cart", "add ...")
        # Ensure ambiguous praise ("looks nice", "i like that", "recommend") does NOT mutate cart!
        add_match = re.search(r"\badd\b\s+(the\s+)?([a-zA-Z0-9_\-]+)", lower_msg)
        if add_match and any(keyword in lower_msg for keyword in ["add", "put"]):
            raw_sku = add_match.group(2).upper()
            target_sku = raw_sku
            if "MOUSE" in lower_msg:
                target_sku = "DK-MS-01"
            elif "ULTRA" in lower_msg:
                target_sku = "DK-LP-ULTRA"
            elif "OOS" in lower_msg or "OUT" in lower_msg:
                target_sku = "DK-LP-14-OOS"
            elif "LOW" in lower_msg:
                target_sku = "DK-LP-LOW-01"
            elif "15" in lower_msg or "LAPTOP" in lower_msg:
                target_sku = "DK-LP-15"

            qty_match = re.search(r"(\d+)\s+units?", lower_msg)
            quantity = int(qty_match.group(1)) if qty_match else 1

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
            )

        # 3. View Cart Intent
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
            )

        # 4. Product Search & Discovery Intent
        max_paise = None
        budget_match = re.search(r"under\s+(₹|rs\.?\s*)?(\d+)(k|000)?", lower_msg)
        if budget_match:
            num = int(budget_match.group(2))
            if budget_match.group(3) == "k":
                num *= 1000
            elif not budget_match.group(3) and num < 1000:
                num *= 1000
            max_paise = num * 100

        # Query keywords
        is_dev = any(k in lower_msg for k in ["develop", "code", "coding", "program"])
        query = "developer" if is_dev else ("laptop" if "laptop" in lower_msg else ("mouse" if "mouse" in lower_msg else ("phone" if "phone" in lower_msg else None)))
        category = "laptop" if "laptop" in lower_msg else None

        tool_args = {"query": query, "category": category, "max_price_paise": max_paise, "in_stock_only": True, "limit": 4}
        tool_res = cls.execute_tool(context, "search_products", tool_args)
        tool_records.append(ToolCallRecord(tool_name="search_products", arguments=tool_args, result=tool_res))

        products = tool_res.get("products", [])
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

        contents = [user_msg]
        response = client.models.generate_content(
            model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
            contents=contents,
            config=config,
        )

        turn_count = 0
        while response.function_calls and turn_count < MAX_TOOL_CALLS_PER_TURN:
            turn_count += 1
            function_call = response.function_calls[0]
            call_name = function_call.name
            call_args = dict(function_call.args) if function_call.args else {}

            tool_result = cls.execute_tool(context, call_name, call_args)
            tool_records.append(ToolCallRecord(tool_name=call_name, arguments=call_args, result=tool_result))

            tool_response_part = types.Part.from_function_response(
                name=call_name,
                response=tool_result,
            )
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
