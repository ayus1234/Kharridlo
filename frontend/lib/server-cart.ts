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

export interface StoredItem {
  id: string;
  q: number;
}

export interface PolicyRuleReason {
  code: string;
  message: string;
  threshold_paise?: number | null;
  observed_paise?: number | null;
}

// In-memory cart store keyed by sessionId
const globalCartStore: Map<string, ServerCart> = new Map();
const sessionTierMap: Map<string, string> = new Map();

export function parseCartCookie(cookieHeader: string | null | undefined): StoredItem[] {
  if (!cookieHeader) return [];
  try {
    const match = cookieHeader.split(";").map(c => c.trim()).find(c => c.startsWith("kharridlo_cart="));
    if (!match) return [];
    const val = decodeURIComponent(match.substring("kharridlo_cart=".length));
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function serializeCartCookie(items: ServerCartItem[]): string {
  const compact = items.map(i => ({ id: i.product_id, q: i.quantity }));
  return encodeURIComponent(JSON.stringify(compact));
}

export function buildCartFromStoredItems(sessionId: string, storedItems: StoredItem[]): ServerCart {
  const cart: ServerCart = {
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

  for (const s of storedItems) {
    const product = getCuratedProductById(s.id) ||
      CURATED_MARKETPLACE_PRODUCTS.find(p => p.id === s.id || p.provider_product_id === s.id);
    const unitPricePaise = product?.source_price_minor || 
      (product?.source_price_inr ? Math.round(product.source_price_inr * 100) : 49900);

    cart.items.push({
      id: `ci_${s.id}_${s.q}`,
      cart_id: cart.id,
      product_id: product?.id || s.id,
      sku: product?.provider_product_id || s.id,
      name: product?.title || "Curated Developer Hardware",
      brand: product?.brand || "Verified",
      category: product?.category || "gear",
      image_url: product?.primary_image_url || product?.images?.[0]?.source_url || "/assets/laptop-product.png",
      provider: product?.provider || "kharridlo_verified",
      quantity: s.q,
      unit_price_paise: unitPricePaise,
      line_total_paise: unitPricePaise * s.q,
      availability_status: "in_stock",
    });
  }

  return recalculateCartTotals(cart);
}

export function getOrCreateServerCart(sessionId: string, cookieHeader?: string | null): ServerCart {
  let cart = globalCartStore.get(sessionId);
  if (!cart) {
    cart = {
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
    globalCartStore.set(sessionId, cart);
  }

  if (cart.items.length === 0 && cookieHeader) {
    const stored = parseCartCookie(cookieHeader);
    if (stored.length > 0) {
      const restored = buildCartFromStoredItems(sessionId, stored);
      cart.items = restored.items;
      recalculateCartTotals(cart);
    }
  }

  return cart;
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

export function addItemToServerCart(sessionId: string, productId: string, quantity: number = 1, cookieHeader?: string | null): ServerCart {
  const cart = getOrCreateServerCart(sessionId, cookieHeader);

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

export function updateServerCartQuantity(sessionId: string, productId: string, quantity: number, cookieHeader?: string | null): ServerCart {
  const cart = getOrCreateServerCart(sessionId, cookieHeader);
  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.product_id !== productId && i.sku !== productId);
  } else {
    const item = cart.items.find(i => i.product_id === productId || i.sku === productId);
    if (item) {
      item.quantity = quantity;
      item.line_total_paise = item.unit_price_paise * quantity;
    }
  }
  return recalculateCartTotals(cart);
}

export function removeItemFromServerCart(sessionId: string, productId: string, cookieHeader?: string | null): ServerCart {
  const cart = getOrCreateServerCart(sessionId, cookieHeader);
  cart.items = cart.items.filter(i => i.product_id !== productId && i.sku !== productId);
  return recalculateCartTotals(cart);
}

export function clearServerCart(sessionId: string): ServerCart {
  const cart = getOrCreateServerCart(sessionId);
  cart.items = [];
  return recalculateCartTotals(cart);
}

export function setSessionPolicyTier(sessionId: string, tier: string): void {
  sessionTierMap.set(sessionId, tier.toUpperCase());
}

export function getSessionPolicyTier(sessionId: string): string {
  return sessionTierMap.get(sessionId) || "STANDARD";
}

export function getPolicyTiersData() {
  return [
    {
      tier: "RESTRICTED",
      name: "Restricted Trial Tier",
      description: "Strict low-risk policy with ₹25,000 limit.",
      max_single_transaction_paise: 2500000,
      max_single_transaction_inr: 25000,
      max_cart_total_paise: 2500000,
      max_cart_total_inr: 25000,
      authorization_required: true,
    },
    {
      tier: "STANDARD",
      name: "Standard Commerce Tier",
      description: "Standard buyer policy with ₹70,000 single-transaction and cart spending limits.",
      max_single_transaction_paise: 7000000,
      max_single_transaction_inr: 70000,
      max_cart_total_paise: 7000000,
      max_cart_total_inr: 70000,
      authorization_required: true,
    },
    {
      tier: "ELEVATED",
      name: "Elevated Autonomy Tier",
      description: "High-value developer policy with ₹1,50,000 single-transaction limit.",
      max_single_transaction_paise: 15000000,
      max_single_transaction_inr: 150000,
      max_cart_total_paise: 15000000,
      max_cart_total_inr: 150000,
      authorization_required: true,
    },
  ];
}

export function evaluateSessionPolicy(sessionId: string, cookieHeader?: string | null) {
  const cart = getOrCreateServerCart(sessionId, cookieHeader);
  const tierCode = getSessionPolicyTier(sessionId);
  const tiers = getPolicyTiersData();
  const currentTier = tiers.find(t => t.tier === tierCode) || tiers[1];

  const cartTotal = cart.total_paise;
  const maxLimit = currentTier.max_single_transaction_paise;
  const isBlocked = cartTotal > maxLimit;
  const remainingBuffer = Math.max(0, maxLimit - cartTotal);

  if (cart.items.length === 0 || cartTotal === 0) {
    return {
      decision: "BLOCK" as const,
      policy_tier: currentTier.tier,
      session_id: sessionId,
      cart_id: cart.id,
      cart_total_paise: 0,
      cart_total_inr: 0,
      max_single_transaction_paise: maxLimit,
      max_single_transaction_inr: Math.round(maxLimit / 100),
      max_cart_total_paise: currentTier.max_cart_total_paise,
      max_cart_total_inr: Math.round(currentTier.max_cart_total_paise / 100),
      remaining_buffer_paise: maxLimit,
      remaining_buffer_inr: Math.round(maxLimit / 100),
      authorization_required: true,
      payment_initiated: false,
      reasons: [
        {
          code: "EMPTY_CART",
          message: "Cart contains no items. Add products to evaluate commerce policy.",
          threshold_paise: null,
          observed_paise: 0,
        },
      ],
    };
  }

  if (isBlocked) {
    return {
      decision: "BLOCK" as const,
      policy_tier: currentTier.tier,
      session_id: sessionId,
      cart_id: cart.id,
      cart_total_paise: cartTotal,
      cart_total_inr: Math.round(cartTotal / 100),
      max_single_transaction_paise: maxLimit,
      max_single_transaction_inr: Math.round(maxLimit / 100),
      max_cart_total_paise: currentTier.max_cart_total_paise,
      max_cart_total_inr: Math.round(currentTier.max_cart_total_paise / 100),
      remaining_buffer_paise: 0,
      remaining_buffer_inr: 0,
      authorization_required: true,
      payment_initiated: false,
      reasons: [
        {
          code: "SINGLE_TRANSACTION_LIMIT_EXCEEDED",
          message: `Cart total ₹${(cartTotal / 100).toLocaleString("en-IN")} exceeds single-transaction limit of ₹${(maxLimit / 100).toLocaleString("en-IN")}. Switch to a higher tier or adjust cart quantity.`,
          threshold_paise: maxLimit,
          observed_paise: cartTotal,
        },
      ],
    };
  }

  return {
    decision: "AUTHORIZATION_REQUIRED" as const,
    policy_tier: currentTier.tier,
    session_id: sessionId,
    cart_id: cart.id,
    cart_total_paise: cartTotal,
    cart_total_inr: Math.round(cartTotal / 100),
    max_single_transaction_paise: maxLimit,
    max_single_transaction_inr: Math.round(maxLimit / 100),
    max_cart_total_paise: currentTier.max_cart_total_paise,
    max_cart_total_inr: Math.round(currentTier.max_cart_total_paise / 100),
    remaining_buffer_paise: remainingBuffer,
    remaining_buffer_inr: Math.round(remainingBuffer / 100),
    authorization_required: true,
    payment_initiated: false,
    reasons: [
      {
        code: "WITHIN_SINGLE_TRANSACTION_LIMIT",
        message: `Cart total ₹${(cartTotal / 100).toLocaleString("en-IN")} is within the single-transaction limit of ₹${(maxLimit / 100).toLocaleString("en-IN")}.`,
        threshold_paise: maxLimit,
        observed_paise: cartTotal,
      },
      {
        code: "BUYER_AUTHORIZATION_REQUIRED",
        message: "Commerce policy approved this transaction. Explicit buyer review and approval is required before payment initiation.",
        threshold_paise: null,
        observed_paise: null,
      },
    ],
  };
}
