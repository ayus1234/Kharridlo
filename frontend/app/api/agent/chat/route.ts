import { NextRequest, NextResponse } from "next/server";
import { getPolicyTiersData, getSessionPolicyTier, getOrCreateServerCart, addItemToServerCart } from "@/lib/server-cart";
import { runProductDiscovery, ShoppingRequirements } from "@/lib/discovery-engine";

export const dynamic = "force-dynamic";

interface ChatRequest {
  message: string;
  session_id?: string;
  previous_requirements?: ShoppingRequirements | null;
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
  const cart = getOrCreateServerCart(sessionId);

  // ---------------------------------------------------------------------------
  // 1. Policy Evaluation Intent ("can i buy", "check policy", "within limit")
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
      policyMsg = `Your current cart total of ₹${totalInr} exceeds your **${currentTier.name}** single-transaction limit of ₹${limitInr}. The purchase is blocked by policy. You can remove items or request a policy upgrade before authorizing payment.`;
    } else {
      policyMsg = `Your cart total of ₹${totalInr} complies with your **${currentTier.name}** limit of ₹${limitInr} (₹${bufferInr} remaining buffer). Explicit buyer authorization will be required at checkout before Razorpay payment initiation.`;
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
      },
      cart,
      execution_mode: "deterministic_policy_engine",
    });
  }

  // ---------------------------------------------------------------------------
  // 2. View Cart Intent ("what's in my cart", "view cart", "show cart")
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
      cartMsg = "Your cart is currently empty. Tell me what you're looking for (e.g. *'Laptop under ₹80k for coding'*), and I'll find the best options.";
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
  // 3. Add to Cart Intent ("add the first one", "add ... to cart")
  // ---------------------------------------------------------------------------
  if (lowerMsg.includes("add") && (lowerMsg.includes("cart") || lowerMsg.includes("first") || lowerMsg.includes("to my cart"))) {
    // If adding first recommendation from previous context or query
    const discovery = runProductDiscovery(userMessage, previousReqs);
    const targetProduct = discovery.products[0];

    if (targetProduct) {
      const updatedCart = addItemToServerCart(sessionId, targetProduct.id, 1, undefined, {
        title: targetProduct.name,
        price_paise: targetProduct.price_paise,
        brand: targetProduct.brand,
        category: targetProduct.category,
        image_url: targetProduct.image_url,
      });

      const isPolicyOk = updatedCart.total_paise <= currentTier.max_single_transaction_paise;
      const addMsg = `Added **${targetProduct.name}** (₹${targetProduct.price_inr.toLocaleString("en-IN")}) to your cart.\n\n` +
        `• **Cart Total:** ₹${(updatedCart.total_paise / 100).toLocaleString("en-IN")}\n` +
        `• **Policy Check:** ${isPolicyOk ? `Approved under ${currentTier.name} (Cap: ₹${currentTier.max_single_transaction_inr.toLocaleString("en-IN")})` : `Blocked: Exceeds ${currentTier.name} limit`}\n` +
        `• **Next Step:** You can review your cart, authorize the checkout, and proceed to Razorpay test payment.`;

      return NextResponse.json({
        message: addMsg,
        session_id: sessionId,
        tool_calls: [
          {
            tool_name: "add_to_cart",
            arguments: { product_id: targetProduct.id, quantity: 1 },
            result: { success: true, cart: updatedCart },
          },
          {
            tool_name: "evaluate_policy",
            arguments: { session_id: sessionId },
            result: { decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK" },
          },
        ],
        recommended_products: discovery.products,
        cart: updatedCart,
        policy: {
          decision: isPolicyOk ? "AUTHORIZATION_REQUIRED" : "BLOCK",
          policy_tier: currentTier.tier,
          cart_total_paise: updatedCart.total_paise,
          max_single_transaction_paise: currentTier.max_single_transaction_paise,
        },
        execution_mode: "grounded_commerce_engine",
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Comparison Intent ("compare the first two", "compare ...")
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
  // 5. Intelligent Product Discovery & Recommendation (Core Phase 3 Engine)
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
