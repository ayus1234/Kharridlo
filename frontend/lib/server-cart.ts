import { getCuratedProductById, CURATED_MARKETPLACE_PRODUCTS } from "./curated-catalog";

export interface ServerCartItem {
  id: string;
  cart_id: string;
  product_id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string | null;
  provider: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  availability_status: string;
}

export interface ServerCart {
  id: string;
  session_id: string;
  status: string;
  currency: string;
  subtotal_paise: number;
  total_paise: number;
  total_items_count: number;
  items: ServerCartItem[];
  expires_at: string;
  is_expired: boolean;
}

// In-memory cart store keyed by sessionId
const globalCartStore: Map<string, ServerCart> = new Map();
const sessionTierMap: Map<string, string> = new Map();

export function getOrCreateServerCart(sessionId: string): ServerCart {
  const existing = globalCartStore.get(sessionId);
  if (existing) {
    return existing;
  }

  const newCart: ServerCart = {
    id: `cart_${sessionId}`,
    session_id: sessionId,
    status: "active",
    currency: "INR",
    subtotal_paise: 0,
    total_paise: 0,
    total_items_count: 0,
    items: [],
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    is_expired: false,
  };

  globalCartStore.set(sessionId, newCart);
  return newCart;
}

function recalculateCartTotals(cart: ServerCart): ServerCart {
  let subtotal = 0;
  let count = 0;
  for (const item of cart.items) {
    item.line_total_paise = item.unit_price_paise * item.quantity;
    subtotal += item.line_total_paise;
    count += item.quantity;
  }
  cart.subtotal_paise = subtotal;
  cart.total_paise = subtotal;
  cart.total_items_count = count;
  return cart;
}

export function addItemToServerCart(sessionId: string, productId: string, quantity: number = 1): ServerCart {
  const cart = getOrCreateServerCart(sessionId);

  // Resolve product
  const product = getCuratedProductById(productId) ||
    CURATED_MARKETPLACE_PRODUCTS.find(p => p.id === productId || p.provider_product_id === productId);

  const unitPricePaise = product?.source_price_minor || 
    (product?.source_price_inr ? Math.round(product.source_price_inr * 100) : 49900);

  const existingItem = cart.items.find(i => i.product_id === productId || (product && i.product_id === product.id));

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.line_total_paise = existingItem.unit_price_paise * existingItem.quantity;
  } else {
    const newItem: ServerCartItem = {
      id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cart_id: cart.id,
      product_id: product?.id || productId,
      sku: product?.provider_product_id || productId,
      name: product?.title || "Curated Developer Hardware",
      brand: product?.brand || "Verified",
      category: product?.category || "gear",
      image_url: product?.primary_image_url || product?.images?.[0]?.source_url || "/assets/laptop-product.png",
      provider: product?.provider || "kharridlo_verified",
      quantity,
      unit_price_paise: unitPricePaise,
      line_total_paise: unitPricePaise * quantity,
      availability_status: "in_stock",
    };
    cart.items.push(newItem);
  }

  return recalculateCartTotals(cart);
}

export function updateServerCartQuantity(sessionId: string, productId: string, quantity: number): ServerCart {
  const cart = getOrCreateServerCart(sessionId);
  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.product_id !== productId && i.sku !== productId);
  } else {
    const item = cart.items.find(i => i.product_id === productId || i.sku === productId);
    if (item) {
      item.quantity = quantity;
    }
  }
  return recalculateCartTotals(cart);
}

export function removeItemFromServerCart(sessionId: string, productId: string): ServerCart {
  const cart = getOrCreateServerCart(sessionId);
  cart.items = cart.items.filter(i => i.product_id !== productId && i.sku !== productId);
  return recalculateCartTotals(cart);
}

export function clearServerCart(sessionId: string): ServerCart {
  const cart = getOrCreateServerCart(sessionId);
  cart.items = [];
  return recalculateCartTotals(cart);
}

export function setSessionPolicyTier(sessionId: string, tier: string) {
  sessionTierMap.set(sessionId, tier);
}

export function getSessionPolicyTier(sessionId: string): string {
  return sessionTierMap.get(sessionId) || "STANDARD";
}

export function getPolicyTiersData() {
  return [
    {
      code: "STARTER",
      display_name: "Starter Student Tier",
      max_single_transaction_paise: 500000,
      daily_spending_limit_paise: 1000000,
      requires_approval_above_paise: 250000,
      description: "Basic student tier for accessories and peripherals (up to ₹5,000)",
    },
    {
      code: "STANDARD",
      display_name: "Verified Developer Tier",
      max_single_transaction_paise: 15000000,
      daily_spending_limit_paise: 25000000,
      requires_approval_above_paise: 8000000,
      description: "Standard tier for mid-range laptops and workstation monitors (up to ₹1,50,000)",
    },
    {
      code: "PREMIUM",
      display_name: "Hardware Lab Grant Tier",
      max_single_transaction_paise: 35000000,
      daily_spending_limit_paise: 50000000,
      requires_approval_above_paise: 20000000,
      description: "High-spec workstations, MacBooks, and research gear (up to ₹3,50,000)",
    },
  ];
}

export function evaluateSessionPolicy(sessionId: string) {
  const cart = getOrCreateServerCart(sessionId);
  const tierCode = getSessionPolicyTier(sessionId);
  const tiers = getPolicyTiersData();
  const currentTier = tiers.find(t => t.code === tierCode) || tiers[1];

  const cartTotal = cart.total_paise;
  const maxLimit = currentTier.max_single_transaction_paise;
  const isPassed = cartTotal <= maxLimit;
  const buffer = maxLimit - cartTotal;

  return {
    status: isPassed ? "PASSED" : "VIOLATED",
    reason: isPassed
      ? "Commerce policy bounds satisfied. Transaction verified for authoritative checkout."
      : `Cart total exceeds ${currentTier.display_name} limit of ₹${(maxLimit / 100).toLocaleString("en-IN")}. Switch to a higher tier or adjust cart quantity.`,
    cart_total_paise: cartTotal,
    max_single_transaction_paise: maxLimit,
    remaining_buffer_paise: buffer > 0 ? buffer : 0,
    policy_tier: currentTier.code,
    tier_display_name: currentTier.display_name,
    violations: isPassed ? [] : ["TRANSACTION_EXCEEDS_TIER_LIMIT"],
    evaluated_at: new Date().toISOString(),
  };
}
