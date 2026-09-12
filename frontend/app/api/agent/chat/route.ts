import { NextRequest, NextResponse } from "next/server";
import {
  getPolicyTiersData,
  getSessionPolicyTier,
  getOrCreateServerCart,
  addItemToServerCart,
  updateServerCartQuantity,
  removeItemFromServerCart,
  clearServerCart,
  recalculateCartTotals,
  ServerCart,
} from "@/lib/server-cart";
import { runProductDiscovery, ShoppingRequirements } from "@/lib/discovery-engine";
import { CURATED_MARKETPLACE_PRODUCTS, getCuratedProductById } from "@/lib/curated-catalog";

export const dynamic = "force-dynamic";

interface ChatRequest {
  message: string;
  session_id?: string;
  previous_requirements?: ShoppingRequirements | null;
  cart_items?: any[];
}

function parseQty(text: string): number {
  // Strip model SKU patterns like DK-LP-15, DK-KB-02 before extracting quantity
  const stripped = text.replace(/dk-[a-z0-9_\-]+/gi, "");
  const wordMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  for (const [w, val] of Object.entries(wordMap)) {
    const r = new RegExp(`\\b${w}\\b`, "i");
    if (r.test(stripped)) return val;
  }
  const m = stripped.match(/\b(\d+)\b/);
  if (m) {
    const val = parseInt(m[1], 10);
    if (val >= 1 && val <= 10) return val;
  }
  return 1;
}

export async function POST(request: NextRequest) {
  let body: ChatRequest | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userMessage = body?.message?.trim() || "";
  const sessionId = body?.session_id || request.headers.get("X-Session-ID") || "default_session";
  const previousReqs = body?.previous_requirements || null;
  const lowerMsg = userMessage.toLowerCase();

  const tiers = getPolicyTiersData();
  const currentTierCode = getSessionPolicyTier(sessionId);
  const currentTier = tiers.find((t) => t.tier === currentTierCode) || tiers[1];

  const cookieHeader = request.headers.get("cookie");
  let cart = getOrCreateServerCart(sessionId, cookieHeader);

  // Synchronize cart from client if client provided active cart items
  if (body?.cart_items && Array.isArray(body.cart_items) && body.cart_items.length > 0) {
    cart.items = [];
    for (const ci of body.cart_items) {
      const pid = ci.product_id || ci.id;
      const qty = ci.quantity || 1;
      const pricePaise = ci.unit_price_paise || (ci.unit_price_inr ? Math.round(ci.unit_price_inr * 100) : (ci.price_inr ? Math.round(ci.price_inr * 100) : 49900));
      cart.items.push({
        id: ci.id || `ci_${pid}_${qty}`,
        cart_id: cart.id,
        product_id: pid,
        sku: ci.sku || pid,
        name: ci.name || ci.title || "Curated Product",
        brand: ci.brand || "Verified",
        category: ci.category || "gear",
        image_url: ci.image_url,
        provider: ci.provider || "kharridlo_verified",
        quantity: qty,
        unit_price_paise: pricePaise,
        line_total_paise: pricePaise * qty,
        availability_status: "in_stock",
      });
    }
    recalculateCartTotals(cart);
  }

  // ---------------------------------------------------------------------------
  // 1. Checkout Readiness & Human Authorization Handoff
  // e.g. "ready to checkout", "proceed to checkout", "checkout", "buy it", "let's pay"
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("ready to checkout") ||
    lowerMsg.includes("proceed to checkout") ||
    lowerMsg.includes("go to checkout") ||
    lowerMsg.includes("let's pay") ||
    lowerMsg.includes("buy it") ||
    lowerMsg.includes("buy now") ||
    lowerMsg.includes("place order") ||
    lowerMsg === "checkout"
  ) {
    if (cart.items.length === 0) {
      return NextResponse.json({
        message: "Your cart is currently empty! Please add items to your cart first before proceeding to checkout. Tell me what product or setup you are looking for, and I'll find verified hardware for you.",
        session_id: sessionId,
        cart,
        execution_mode: "cart_advisory",
      });
    }

    const isExceeded = cart.total_paise > currentTier.max_single_transaction_paise;
    const totalInr = (cart.total_paise / 100).toLocaleString("en-IN");
    const limitInr = currentTier.max_single_transaction_inr.toLocaleString("en-IN");

    if (isExceeded) {
      const overageInr = ((cart.total_paise - currentTier.max_single_transaction_paise) / 100).toLocaleString("en-IN");
      return NextResponse.json({
        message: `Your cart total of ₹${totalInr} exceeds your **${currentTier.name}** limit of ₹${limitInr} by ₹${overageInr}. Checkout is **BLOCKED** by policy.\n\n⚠️ **Payment has not been initiated.** To continue, you can remove items or request a policy upgrade before authorizing checkout.`,
        session_id: sessionId,
        policy: {
          decision: "BLOCK",
          policy_tier: currentTier.tier,
          cart_total_paise: cart.total_paise,
          max_single_transaction_paise: currentTier.max_single_transaction_paise,
          overage_paise: cart.total_paise - currentTier.max_single_transaction_paise,
        },
        cart,
        tool_calls: [
          { tool_name: "get_cart", arguments: { session_id: sessionId }, result: cart },
          { tool_name: "evaluate_policy", arguments: { session_id: sessionId }, result: { decision: "BLOCK" } },
        ],
        execution_mode: "deterministic_policy_engine",
      });
    }

    const remainingBufferPaise = Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise);
    const bufferInr = (remainingBufferPaise / 100).toLocaleString("en-IN");

    return NextResponse.json({
      message: `Your cart is ready for checkout! Total: **₹${totalInr}** across ${cart.items.length} item(s).\n\n• **Policy Status:** ✅ Approved under ${currentTier.name} (Limit: ₹${limitInr} • ₹${bufferInr} headroom remaining).\n\n⚠️ **Payment has not been initiated.** As an AI agent, I enforce zero financial authority. Please proceed to the Buyer Authorization Checkpoint to review and authorize your purchase:\n\n👉 [Proceed to Authorization Checkpoint](/checkout/authorize)`,
      session_id: sessionId,
      checkout_url: "/checkout/authorize",
      policy: {
        decision: "AUTHORIZATION_REQUIRED",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
        remaining_buffer_paise: remainingBufferPaise,
        remaining_buffer_inr: Math.round(remainingBufferPaise / 100),
      },
      cart,
      tool_calls: [
        { tool_name: "get_cart", arguments: { session_id: sessionId }, result: cart },
        { tool_name: "evaluate_policy", arguments: { session_id: sessionId }, result: { decision: "AUTHORIZATION_REQUIRED" } },
      ],
      execution_mode: "checkout_handoff",
    });
  }

  // ---------------------------------------------------------------------------
  // 1.5 Cart Optimization & Value Advisory ("make it cheaper", "optimize", "save money")
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("cheaper") ||
    lowerMsg.includes("optimize") ||
    lowerMsg.includes("save money") ||
    lowerMsg.includes("budget alternative") ||
    lowerMsg.includes("lower price") ||
    lowerMsg.includes("reduce cost")
  ) {
    if (cart.items.length === 0) {
      return NextResponse.json({
        message: "Your cart is currently empty! Add products to your cart, and I will analyze cost optimization and value-for-money alternatives for you.",
        session_id: sessionId,
        cart,
        execution_mode: "cart_advisory",
      });
    }

    const sortedByPrice = [...cart.items].sort((a, b) => ((b.unit_price_paise || 0) * (b.quantity || 1)) - ((a.unit_price_paise || 0) * (a.quantity || 1)));
    const mostExpensive = sortedByPrice[0];
    const totalInr = (cart.total_paise / 100).toLocaleString("en-IN");
    const expItemInr = (((mostExpensive.unit_price_paise || 0) * (mostExpensive.quantity || 1)) / 100).toLocaleString("en-IN");

    // Search curated catalog for lower-priced alternatives
    const catAlternatives = CURATED_MARKETPLACE_PRODUCTS.filter((p) => {
      const pricePaise = p.source_price_minor || (p.source_price_inr ? p.source_price_inr * 100 : 0);
      return p.category === mostExpensive.category && 
             pricePaise < (mostExpensive.unit_price_paise || 0) &&
             p.id !== mostExpensive.product_id;
    }).slice(0, 3);

    let optMessage = `Here is an intelligent cost optimization for your current cart (**₹${totalInr}**):\n\n`;
    optMessage += `1. **Highest Cost Driver:** **${mostExpensive.name}** contributes **₹${expItemInr}** (${mostExpensive.quantity > 1 ? `₹${((mostExpensive.unit_price_paise || 0) / 100).toLocaleString("en-IN")} × ${mostExpensive.quantity}` : "single unit"}).\n`;

    if (mostExpensive.quantity > 1) {
      const savedIfReduced = (((mostExpensive.quantity - 1) * mostExpensive.unit_price_paise) / 100).toLocaleString("en-IN");
      optMessage += `2. **Quantity Adjustment:** Reducing quantity to 1 would immediately save **₹${savedIfReduced}**.\n`;
    }

    if (catAlternatives.length > 0) {
      const bestAlt = catAlternatives[0];
      const altPriceInr = (bestAlt.source_price_inr || (bestAlt.source_price_minor ? bestAlt.source_price_minor / 100 : 0)).toLocaleString("en-IN");
      const altPricePaise = bestAlt.source_price_minor || (bestAlt.source_price_inr ? bestAlt.source_price_inr * 100 : 0);
      const savedAmount = Math.max(0, Math.round((mostExpensive.unit_price_paise - altPricePaise) / 100)).toLocaleString("en-IN");
      optMessage += `3. **Verified Value Alternative:** Swap for **${bestAlt.title}** (₹${altPriceInr}), saving **₹${savedAmount}** while meeting essential computing specs.\n`;
    } else {
      optMessage += `2. **Item Removal Option:** You can say *"Remove expensive item"* to remove **${mostExpensive.name}** and lower your cart total.\n`;
    }

    optMessage += `\nWould you like me to remove **${mostExpensive.name}**, swap it with a value alternative, or proceed to authorization?`;

    const remainingBufferPaise = Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise);
    return NextResponse.json({
      message: optMessage,
      session_id: sessionId,
      cart,
      recommended_products: catAlternatives,
      policy: {
        decision: cart.total_paise <= currentTier.max_single_transaction_paise ? "AUTHORIZATION_REQUIRED" : "BLOCK",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
        remaining_buffer_paise: remainingBufferPaise,
        remaining_buffer_inr: Math.round(remainingBufferPaise / 100),
      },
      tool_calls: [
        { tool_name: "get_cart", arguments: { session_id: sessionId }, result: cart },
        { tool_name: "find_budget_alternatives", arguments: { target_item: mostExpensive.name, max_price_paise: mostExpensive.unit_price_paise }, result: { candidates: catAlternatives } },
      ],
      execution_mode: "cart_optimization",
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Policy Evaluation Intent ("can i buy", "check policy", "within limit")
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("can i buy") ||
    lowerMsg.includes("check policy") ||
    lowerMsg.includes("within limit") ||
    lowerMsg.includes("is this allowed")
  ) {
    const isExceeded = cart.total_paise > currentTier.max_single_transaction_paise;
    const remainingBufferPaise = Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise);
    const totalInr = (cart.total_paise / 100).toLocaleString("en-IN");
    const limitInr = currentTier.max_single_transaction_inr.toLocaleString("en-IN");
    const bufferInr = (remainingBufferPaise / 100).toLocaleString("en-IN");

    let policyMsg = "";
    if (isExceeded) {
      policyMsg = `Your current cart total of ₹${totalInr} exceeds your **${currentTier.name}** single-transaction limit of ₹${limitInr}. The purchase is blocked by policy. Payment has not been initiated. You can remove items or request a policy upgrade before authorizing payment.`;
    } else {
      policyMsg = `Your cart total of ₹${totalInr} complies with your **${currentTier.name}** limit of ₹${limitInr} (₹${bufferInr} remaining buffer). Explicit buyer authorization will be required at checkout before Razorpay payment initiation. Payment has not been initiated.`;
    }

    return NextResponse.json({
      message: policyMsg,
      session_id: sessionId,
      tool_calls: [
        {
          tool_name: "evaluate_policy",
          arguments: { session_id: sessionId, cart_total_paise: cart.total_paise },
          result: {
            decision: isExceeded ? "BLOCK" : "AUTHORIZATION_REQUIRED",
            policy_tier: currentTier.tier,
            cart_total_paise: cart.total_paise,
            max_single_transaction_paise: currentTier.max_single_transaction_paise,
            remaining_buffer_paise: remainingBufferPaise,
          },
        },
      ],
      policy: {
        decision: isExceeded ? "BLOCK" : "AUTHORIZATION_REQUIRED",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
        remaining_buffer_paise: remainingBufferPaise,
        remaining_buffer_inr: Math.round(remainingBufferPaise / 100),
      },
      cart,
      execution_mode: "deterministic_policy_engine",
    });
  }

  // ---------------------------------------------------------------------------
  // 3. Cart Total / Calculation Intent ("what's my total", "how much is my cart")
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("what is my total") ||
    lowerMsg.includes("what's my total") ||
    lowerMsg.includes("cart total") ||
    lowerMsg.includes("how much is my cart") ||
    lowerMsg.includes("how much do i owe") ||
    lowerMsg.includes("total price")
  ) {
    if (cart.items.length === 0) {
      return NextResponse.json({
        message: "Your cart is currently empty (Total: ₹0). Tell me what you are looking for and I'll find top-rated hardware for you!",
        session_id: sessionId,
        cart,
        execution_mode: "cart_advisory",
      });
    }

    const itemLines = cart.items
      .map((i) => `• **${i.name}** (x${i.quantity}) — ₹${((i.line_total_paise || i.unit_price_paise * i.quantity) / 100).toLocaleString("en-IN")}`)
      .join("\n");
    const totalInr = (cart.total_paise / 100).toLocaleString("en-IN");
    const isPolicyOk = cart.total_paise <= currentTier.max_single_transaction_paise;

    return NextResponse.json({
      message: `Here is the authoritative total for your session cart:\n\n${itemLines}\n\n• **Total:** **₹${totalInr}** (${cart.total_items_count} items)\n• **Exact Value:** ${cart.total_paise} paise\n• **Policy Status:** ${isPolicyOk ? `✅ Compliant with ${currentTier.name} limit (₹${currentTier.max_single_transaction_inr.toLocaleString("en-IN")})` : `⚠️ Exceeds ${currentTier.name} limit`}`,
      session_id: sessionId,
      cart,
      policy: {
        decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
        remaining_buffer_paise: Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise),
        remaining_buffer_inr: Math.round(Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise) / 100),
      },
      tool_calls: [
        { tool_name: "get_cart", arguments: { session_id: sessionId }, result: cart },
      ],
      execution_mode: "cart_advisory",
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Cart Clearing or Multiple Removals
  // e.g. "clear cart", "empty cart", "remove all"
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("clear cart") ||
    lowerMsg.includes("empty cart") ||
    lowerMsg.includes("clear my cart") ||
    lowerMsg.includes("remove all items")
  ) {
    cart = clearServerCart(sessionId);
    return NextResponse.json({
      message: "I have cleared all items from your cart. Your cart is now empty.",
      session_id: sessionId,
      cart,
      tool_calls: [
        { tool_name: "clear_cart", arguments: { session_id: sessionId }, result: { success: true } },
      ],
      policy: {
        decision: "AUTHORIZATION_REQUIRED",
        policy_tier: currentTier.tier,
        cart_total_paise: 0,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
      },
      execution_mode: "cart_mutation",
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Quantity Modification Intent
  // e.g. "change quantity to 2", "make it 3", "update quantity of laptop to 2"
  // ---------------------------------------------------------------------------
  if (
    (lowerMsg.includes("quantity") && (lowerMsg.includes("to") || lowerMsg.includes("make") || lowerMsg.includes("set") || lowerMsg.includes("change"))) ||
    lowerMsg.startsWith("make it ") ||
    lowerMsg.startsWith("change to ")
  ) {
    if (cart.items.length === 0) {
      return NextResponse.json({
        message: "Your cart is currently empty, so there are no items to update. Search for a product first and add it to your cart!",
        session_id: sessionId,
        cart,
        execution_mode: "cart_advisory",
      });
    }

    const newQty = parseQty(userMessage);

    // Identify target item
    let targetItem = cart.items[cart.items.length - 1]; // Default to most recently added
    for (const item of cart.items) {
      const lowerName = item.name.toLowerCase();
      const lowerSku = item.sku.toLowerCase();
      if (
        lowerMsg.includes(lowerSku) ||
        lowerMsg.includes(lowerName) ||
        (lowerName.includes("laptop") && lowerMsg.includes("laptop")) ||
        (lowerName.includes("mouse") && lowerMsg.includes("mouse")) ||
        (lowerName.includes("keyboard") && lowerMsg.includes("keyboard"))
      ) {
        targetItem = item;
        break;
      }
    }

    cart = updateServerCartQuantity(sessionId, targetItem.product_id, newQty);
    const isPolicyOk = cart.total_paise <= currentTier.max_single_transaction_paise;
    const totalInr = (cart.total_paise / 100).toLocaleString("en-IN");
    const updatedLineInr = ((targetItem.unit_price_paise * newQty) / 100).toLocaleString("en-IN");

    return NextResponse.json({
      message: `Updated quantity for **${targetItem.name}** to **${newQty}** (Item subtotal: ₹${updatedLineInr}).\n\n• **New Cart Total:** ₹${totalInr} (${cart.total_items_count} items)\n• **Policy Status:** ${isPolicyOk ? `✅ Approved under ${currentTier.name} (Limit: ₹${currentTier.max_single_transaction_inr.toLocaleString("en-IN")})` : `⚠️ Exceeds ${currentTier.name} limit — checkout will be blocked until modified`}`,
      session_id: sessionId,
      cart,
      tool_calls: [
        {
          tool_name: "update_cart_item",
          arguments: { product_id: targetItem.product_id, quantity: newQty },
          result: { success: true, updated_item: targetItem, cart },
        },
        {
          tool_name: "evaluate_policy",
          arguments: { session_id: sessionId },
          result: { decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK" },
        },
      ],
      policy: {
        decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
      },
      execution_mode: "cart_mutation",
    });
  }

  // ---------------------------------------------------------------------------
  // 6. Item Removal Intent
  // e.g. "remove the mouse", "delete laptop", "remove everything except..."
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("remove") ||
    lowerMsg.includes("delete") ||
    lowerMsg.includes("take out")
  ) {
    if (cart.items.length === 0) {
      return NextResponse.json({
        message: "Your cart is already empty!",
        session_id: sessionId,
        cart,
        execution_mode: "cart_advisory",
      });
    }

    // Handle "remove everything except..."
    if (lowerMsg.includes("except")) {
      const retainedItems = cart.items.filter((item) => {
        const lowerName = item.name.toLowerCase();
        const lowerSku = item.sku.toLowerCase();
        return (
          lowerMsg.includes(lowerSku) ||
          lowerMsg.includes(lowerName) ||
          (lowerName.includes("laptop") && lowerMsg.includes("laptop")) ||
          (lowerName.includes("mouse") && lowerMsg.includes("mouse"))
        );
      });

      cart.items = retainedItems;
      recalculateCartTotals(cart);
      const isPolicyOk = cart.total_paise <= currentTier.max_single_transaction_paise;

      return NextResponse.json({
        message: `Updated your cart to keep only the requested items. Current items in cart: ${cart.items.map((i) => i.name).join(", ") || "None"}.\n\n• **Cart Total:** ₹${(cart.total_paise / 100).toLocaleString("en-IN")}`,
        session_id: sessionId,
        cart,
        policy: {
          decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
          policy_tier: currentTier.tier,
          cart_total_paise: cart.total_paise,
          max_single_transaction_paise: currentTier.max_single_transaction_paise,
        },
        execution_mode: "cart_mutation",
      });
    }

    // Identify target item to remove
    let itemToRemove = cart.items[cart.items.length - 1];
    const isExpensiveIntent =
      lowerMsg.includes("expensive") ||
      lowerMsg.includes("highest") ||
      lowerMsg.includes("priciest") ||
      lowerMsg.includes("costliest");

    if (isExpensiveIntent) {
      itemToRemove = [...cart.items].sort((a, b) => ((b.unit_price_paise || 0) * (b.quantity || 1)) - ((a.unit_price_paise || 0) * (a.quantity || 1)))[0];
    } else {
      for (const item of cart.items) {
        const lowerName = item.name.toLowerCase();
        const lowerSku = item.sku.toLowerCase();
        if (
          lowerMsg.includes(lowerSku) ||
          lowerMsg.includes(lowerName) ||
          (lowerName.includes("laptop") && lowerMsg.includes("laptop")) ||
          (lowerName.includes("mouse") && lowerMsg.includes("mouse")) ||
          (lowerName.includes("keyboard") && lowerMsg.includes("keyboard"))
        ) {
          itemToRemove = item;
          break;
        }
      }
    }

    cart = removeItemFromServerCart(sessionId, itemToRemove.product_id);
    const isPolicyOk = cart.total_paise <= currentTier.max_single_transaction_paise;
    const remainingBufferPaise = Math.max(0, currentTier.max_single_transaction_paise - cart.total_paise);

    return NextResponse.json({
      message: `Removed ${isExpensiveIntent ? "most expensive item " : ""}**${itemToRemove.name}** (₹${((itemToRemove.unit_price_paise * (itemToRemove.quantity || 1)) / 100).toLocaleString("en-IN")}) from your cart.\n\n• **Updated Cart Total:** ₹${(cart.total_paise / 100).toLocaleString("en-IN")} (${cart.items.length} items remaining)\n• **Policy Status:** ${isPolicyOk ? "✅ Within Limit" : "⚠️ Limit Exceeded"}`,
      session_id: sessionId,
      cart,
      tool_calls: [
        {
          tool_name: "remove_from_cart",
          arguments: { product_id: itemToRemove.product_id },
          result: { success: true, removed_id: itemToRemove.product_id, cart },
        },
        {
          tool_name: "evaluate_policy",
          arguments: { session_id: sessionId },
          result: { decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK" },
        },
      ],
      policy: {
        decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
        policy_tier: currentTier.tier,
        cart_total_paise: cart.total_paise,
        max_single_transaction_paise: currentTier.max_single_transaction_paise,
        remaining_buffer_paise: remainingBufferPaise,
        remaining_buffer_inr: Math.round(remainingBufferPaise / 100),
      },
      execution_mode: "cart_mutation",
    });
  }

  // ---------------------------------------------------------------------------
  // 7. View Cart Intent ("what's in my cart", "view cart", "show cart")
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("what is in my cart") ||
    lowerMsg.includes("what's in my cart") ||
    lowerMsg.includes("view cart") ||
    lowerMsg.includes("show cart") ||
    lowerMsg === "cart"
  ) {
    let cartMsg = "";
    if (cart.items.length === 0) {
      cartMsg = "Your cart is currently empty. Tell me what you're looking for (e.g. *'Laptop under ₹80k for coding'*), and I'll find the best verified options.";
    } else {
      const itemSummary = cart.items
        .map((i) => `• **${i.name}** (Qty: ${i.quantity}) — ₹${((i.line_total_paise || i.unit_price_paise * i.quantity) / 100).toLocaleString("en-IN")}`)
        .join("\n");
      cartMsg = `Here is your current cart (${cart.items.length} items):\n\n${itemSummary}\n\n**Total:** ₹${(cart.total_paise / 100).toLocaleString("en-IN")} • Policy Status: ${cart.total_paise > currentTier.max_single_transaction_paise ? "⚠️ Limit Exceeded" : "✅ Policy Approved"}`;
    }

    return NextResponse.json({
      message: cartMsg,
      session_id: sessionId,
      tool_calls: [
        {
          tool_name: "get_cart",
          arguments: { session_id: sessionId },
          result: cart,
        },
      ],
      cart,
      execution_mode: "grounded_commerce_engine",
    });
  }

  // ---------------------------------------------------------------------------
  // 8. Add to Cart Intent ("add ... to cart", "add the first one", SKU match)
  // ---------------------------------------------------------------------------
  if (
    lowerMsg.includes("add") &&
    (lowerMsg.includes("cart") || lowerMsg.includes("first") || lowerMsg.includes("to my cart"))
  ) {
    const qty = parseQty(userMessage);

    // Check if user specifically requested a SKU or product name from catalog
    let matchedProduct = CURATED_MARKETPLACE_PRODUCTS.find((p) => {
      const skuMatch = p.provider_product_id && lowerMsg.includes(p.provider_product_id.toLowerCase());
      const idMatch = lowerMsg.includes(p.id.toLowerCase());
      return skuMatch || idMatch;
    });

    if (!matchedProduct) {
      const discovery = runProductDiscovery(userMessage, previousReqs);
      matchedProduct = discovery.products[0] as any;
    }

    if (matchedProduct) {
      const pricePaise = (matchedProduct as any).price_paise || matchedProduct.source_price_minor || Math.round((matchedProduct as any).price_inr * 100);
      const name = (matchedProduct as any).name || matchedProduct.title;

      const updatedCart = addItemToServerCart(sessionId, matchedProduct.id, qty, undefined, {
        title: name,
        price_paise: pricePaise,
        brand: matchedProduct.brand,
        category: matchedProduct.category,
        image_url: (matchedProduct as any).image_url || (matchedProduct as any).primary_image_url,
      });

      const isPolicyOk = updatedCart.total_paise <= currentTier.max_single_transaction_paise;
      const addMsg = `Added **${name}** (x${qty} — ₹${((pricePaise * qty) / 100).toLocaleString("en-IN")}) to your cart.\n\n` +
        `• **Cart Total:** ₹${(updatedCart.total_paise / 100).toLocaleString("en-IN")} (${updatedCart.total_items_count} items)\n` +
        `• **Policy Check:** ${isPolicyOk ? `Approved under ${currentTier.name} (Cap: ₹${currentTier.max_single_transaction_inr.toLocaleString("en-IN")})` : `Blocked: Exceeds ${currentTier.name} limit of ₹${currentTier.max_single_transaction_inr.toLocaleString("en-IN")}`}\n` +
        `• **Next Step:** You can modify quantities, ask questions, or proceed to [Authorize Purchase](/checkout/authorize). (Payment has not been initiated).`;

      return NextResponse.json({
        message: addMsg,
        session_id: sessionId,
        tool_calls: [
          {
            tool_name: "add_to_cart",
            arguments: { product_id: matchedProduct.id, quantity: qty },
            result: { success: true, cart: updatedCart },
          },
          {
            tool_name: "evaluate_policy",
            arguments: { session_id: sessionId },
            result: { decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK" },
          },
        ],
        cart: updatedCart,
        policy: {
          decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
          policy_tier: currentTier.tier,
          cart_total_paise: updatedCart.total_paise,
          max_single_transaction_paise: currentTier.max_single_transaction_paise,
        },
        execution_mode: "cart_mutation",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 9. Comparison Intent ("compare the first two", "compare ...")
  // ---------------------------------------------------------------------------
  if (lowerMsg.includes("compare")) {
    const discovery = runProductDiscovery(userMessage, previousReqs);
    const compareProds = discovery.products.slice(0, 2);

    if (compareProds.length >= 2) {
      const [p1, p2] = compareProds;
      const compareMsg = `Here is a direct side-by-side comparison between **${p1.name}** and **${p2.name}**:\n\n` +
        `• **${p1.name}** (₹${p1.price_inr.toLocaleString("en-IN")}): ${p1.tradeoffSummary || p1.reasons.join(", ")}\n` +
        `• **${p2.name}** (₹${p2.price_inr.toLocaleString("en-IN")}): ${p2.tradeoffSummary || p2.reasons.join(", ")}\n\n` +
        `You can also view the full side-by-side hardware specifications on the compare page: [Open Compare Page](/compare?ids=${p1.id},${p2.id}).`;

      return NextResponse.json({
        message: compareMsg,
        session_id: sessionId,
        tool_calls: [
          {
            tool_name: "compare_products",
            arguments: { product_ids: [p1.id, p2.id] },
            result: { products: compareProds },
          },
        ],
        recommended_products: compareProds,
        requirements: discovery.requirements,
        execution_mode: "grounded_commerce_engine",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 10. Intelligent Product Discovery & Recommendation (Phase 3 Engine)
  // ---------------------------------------------------------------------------
  const discovery = runProductDiscovery(userMessage, previousReqs);

  // If clarification is needed
  if (discovery.clarification) {
    return NextResponse.json({
      message: discovery.clarification.question,
      session_id: sessionId,
      clarification_question: discovery.clarification.question,
      clarification_options: discovery.clarification.options,
      requirements: discovery.requirements,
      recommended_products: [],
      tool_calls: [],
      execution_mode: "clarification_dialog",
    });
  }

  // Build trade-off aware conversational message
  let responseText = "";
  const { tradeoffGroups, products, budgetGapNotice, requirements } = discovery;

  if (budgetGapNotice) {
    responseText = `${budgetGapNotice}\n\nHere are the closest verified alternatives available in our catalog:`;
  } else if (products.length > 0) {
    const topPick = tradeoffGroups.bestOverall || products[0];
    const valuePick = tradeoffGroups.bestValue;
    const perfPick = tradeoffGroups.bestPerformance;

    const reqSummary = [
      requirements.category ? requirements.category : "hardware",
      requirements.budgetInr ? `under ₹${requirements.budgetInr.toLocaleString("en-IN")}` : "",
      requirements.useCases && requirements.useCases.length > 0 ? `for ${requirements.useCases.join(" + ")}` : "",
    ].filter(Boolean).join(" ");

    responseText = `I analyzed the verified catalog for **${reqSummary}** and identified ${products.length} strong choices tailored to your needs:\n\n`;

    if (topPick) {
      responseText += `1. **${topPick.name}** (₹${topPick.price_inr.toLocaleString("en-IN")}) — **${topPick.tradeoffType || "BEST OVERALL"}**\n` +
        `   • ${topPick.reasons.join("\n   • ")}\n\n`;
    }

    if (valuePick && valuePick.id !== topPick?.id) {
      responseText += `2. **${valuePick.name}** (₹${valuePick.price_inr.toLocaleString("en-IN")}) — **${valuePick.tradeoffType || "BEST VALUE"}**\n` +
        `   • ${valuePick.reasons.join("\n   • ")}\n\n`;
    }

    if (perfPick && perfPick.id !== topPick?.id && perfPick.id !== valuePick?.id) {
      responseText += `3. **${perfPick.name}** (₹${perfPick.price_inr.toLocaleString("en-IN")}) — **${perfPick.tradeoffType || "BEST PERFORMANCE"}**\n` +
        `   • ${perfPick.reasons.join("\n   • ")}\n\n`;
    }

    responseText += `All options are verified and qualify for deterministic spending policy evaluation. You can add your preferred pick directly to your cart below or compare them.`;
  } else {
    responseText = `I searched the verified catalog but couldn't find hardware matching your exact criteria. Try relaxing your budget cap or clearing brand exclusions.`;
  }

  return NextResponse.json({
    message: responseText,
    session_id: sessionId,
    tool_calls: [
      {
        tool_name: "search_products",
        arguments: {
          query: userMessage,
          category: requirements.category,
          max_price_paise: requirements.budgetPaise,
          exclusions: requirements.exclusions,
        },
        result: { count: products.length, products },
      },
    ],
    recommended_products: products,
    tradeoff_groups: tradeoffGroups,
    requirements,
    budget_gap_notice: budgetGapNotice,
    activity_events: discovery.activityEvents,
    policy: {
      decision: cart.total_paise > currentTier.max_single_transaction_paise ? "BLOCK" : "AUTHORIZATION_REQUIRED",
      policy_tier: currentTier.tier,
      cart_total_paise: cart.total_paise,
      max_single_transaction_paise: currentTier.max_single_transaction_paise,
    },
    execution_mode: "grounded_discovery_engine",
  });
}
