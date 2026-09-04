/**
 * Kharridlo Merchant & Operations Telemetry Adapter
 * 
 * Provides typed models and telemetry streams for Stitch Merchant & Intelligence screens:
 * - Merchant Dashboard Overview & Pulse
 * - AI Commerce Command Center
 * - Live Activity Feed & Simulator
 * - Active Buyer Sessions & Trace
 * - Policy Center & Investigation
 * - AI Revenue Advisor & Inventory Recovery Log
 * - System Connectivity Map
 * 
 * NOTE: As per architecture rules ("AI proposes. Deterministic systems verify and authorize"),
 * simulated telemetry streams are explicitly marked with `isSimulated: true` so that
 * synthetic operational data is never presented as fabricated production records.
 */

export interface MerchantKpiSummary {
  isSimulated: boolean;
  grossProcessedVolumePaise: number;
  grossProcessedVolumeInr: number;
  volumeGrowthPct: number;
  activeBuyerSessionsCount: number;
  activeSessionsGrowthPct: number;
  policyInterceptionsCount: number;
  policyInterceptionsGrowthPct: number;
  aiConversionRatePct: number;
  aiConversionGrowthPct: number;
  averageTransactionInr: number;
  policyPassRatePct: number;
  systemUptimePct: number;
}

export interface LiveActivityEvent {
  id: string;
  isSimulated: boolean;
  timestamp: string;
  actor: "AI_AGENT" | "BUYER" | "POLICY_ENGINE" | "RAZORPAY_GATEWAY" | "SYSTEM";
  action: string;
  correlationId: string;
  sessionId: string;
  status: "SUCCESS" | "BLOCKED" | "EVALUATING" | "AUTHORIZED" | "PENDING";
  description: string;
  details?: Record<string, any>;
}

export interface ActiveBuyerSession {
  id: string;
  isSimulated: boolean;
  sessionId: string;
  studentTier: "TIER_1" | "TIER_2" | "TIER_3";
  intentPrompt: string;
  cartItemCount: number;
  cartTotalInr: number;
  riskScore: number; // 0 to 100
  durationSeconds: number;
  lastActive: string;
  currentStep: "BROWSING" | "AI_ASSIST" | "CART_REVIEW" | "POLICY_CHECK" | "AUTHORIZED";
}

export interface TraceStep {
  stepNumber: number;
  toolName: string;
  timestamp: string;
  durationMs: number;
  tokenCount: number;
  status: "COMPLETED" | "BLOCKED" | "FAILED";
  inputSummary: string;
  outputSummary: string;
}

export interface SessionTrace {
  sessionId: string;
  isSimulated: boolean;
  agentModel: string;
  totalTokens: number;
  totalSteps: number;
  policyEnforcementTriggered: boolean;
  policyRuleEvaluated?: string;
  steps: TraceStep[];
}

export interface PolicyRuleDefinition {
  id: string;
  tier: "TIER_1" | "TIER_2" | "TIER_3";
  tierName: string;
  maxSingleTxInr: number;
  maxDailyTxInr: number;
  requireBuyerAuth: boolean;
  restrictedCategories: string[];
  activeStatus: "ACTIVE" | "PAUSED" | "AUDIT_ONLY";
  enforcedCountLast24h: number;
}

export interface RevenueOpportunity {
  id: string;
  isSimulated: boolean;
  title: string;
  category: string;
  projectedLiftInr: number;
  confidenceScore: number;
  rationale: string;
  suggestedAction: string;
  opportunityType: "BUNDLE" | "INVENTORY_SUBSTITUTION" | "PRICING" | "CART_ABANDONMENT";
}

export interface InventoryRecoveryItem {
  id: string;
  isSimulated: boolean;
  originalProductSku: string;
  originalProductName: string;
  originalPriceInr: number;
  stockoutTimestamp: string;
  substituteProductSku: string;
  substituteProductName: string;
  substitutePriceInr: number;
  preservedGmvInr: number;
  buyerAccepted: boolean;
  recoveryLatencyMs: number;
}

export interface SystemNode {
  id: string;
  name: string;
  category: "FRONTEND" | "GATEWAY" | "AI_ENGINE" | "POLICY" | "DATABASE" | "PAYMENT_GATEWAY";
  status: "HEALTHY" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  detail: string;
  version: string;
}

// Default Telemetry Data
export const DEFAULT_KPI_SUMMARY: MerchantKpiSummary = {
  isSimulated: true,
  grossProcessedVolumePaise: 485200000,
  grossProcessedVolumeInr: 4852000,
  volumeGrowthPct: 14.8,
  activeBuyerSessionsCount: 42,
  activeSessionsGrowthPct: 8.4,
  policyInterceptionsCount: 19,
  policyInterceptionsGrowthPct: -4.2,
  aiConversionRatePct: 28.4,
  aiConversionGrowthPct: 3.6,
  averageTransactionInr: 12450,
  policyPassRatePct: 98.4,
  systemUptimePct: 99.98,
};

export const DEFAULT_ACTIVE_SESSIONS: ActiveBuyerSession[] = [
  {
    id: "sess_sim_01",
    isSimulated: true,
    sessionId: "sess_a8f921_1725450",
    studentTier: "TIER_1",
    intentPrompt: "Best lightweight laptop for CS student under 50k",
    cartItemCount: 1,
    cartTotalInr: 45999,
    riskScore: 12,
    durationSeconds: 142,
    lastActive: "Just now",
    currentStep: "POLICY_CHECK",
  },
  {
    id: "sess_sim_02",
    isSimulated: true,
    sessionId: "sess_c4b102_1725451",
    studentTier: "TIER_2",
    intentPrompt: "Mechanical keyboard with quiet switches and wrist rest",
    cartItemCount: 2,
    cartTotalInr: 8498,
    riskScore: 4,
    durationSeconds: 310,
    lastActive: "1m ago",
    currentStep: "CART_REVIEW",
  },
  {
    id: "sess_sim_03",
    isSimulated: true,
    sessionId: "sess_d7e440_1725452",
    studentTier: "TIER_1",
    intentPrompt: "External 4K developer monitor with USB-C power delivery",
    cartItemCount: 1,
    cartTotalInr: 28999,
    riskScore: 68,
    durationSeconds: 45,
    lastActive: "3m ago",
    currentStep: "AI_ASSIST",
  },
  {
    id: "sess_sim_04",
    isSimulated: true,
    sessionId: "sess_99a803_1725453",
    studentTier: "TIER_3",
    intentPrompt: "Engineering workstation laptop 32GB RAM + noise cancelling headset",
    cartItemCount: 3,
    cartTotalInr: 94500,
    riskScore: 24,
    durationSeconds: 520,
    lastActive: "4m ago",
    currentStep: "AUTHORIZED",
  },
  {
    id: "sess_sim_05",
    isSimulated: true,
    sessionId: "sess_e109ff_1725454",
    studentTier: "TIER_1",
    intentPrompt: "High-spec graphics tablet for digital design student",
    cartItemCount: 1,
    cartTotalInr: 16500,
    riskScore: 82,
    durationSeconds: 215,
    lastActive: "7m ago",
    currentStep: "POLICY_CHECK",
  },
];

export const DEFAULT_ACTIVITY_EVENTS: LiveActivityEvent[] = [
  {
    id: "evt_act_001",
    isSimulated: true,
    timestamp: "12:44:12 PM",
    actor: "POLICY_ENGINE",
    action: "EVALUATE_POLICY_ALLOW",
    correlationId: "corr_0a9b8c7d",
    sessionId: "sess_a8f921_1725450",
    status: "SUCCESS",
    description: "Student Tier 1 spending limit evaluated (Observed ₹45,999 <= Cap ₹50,000). Buyer authorization required.",
  },
  {
    id: "evt_act_002",
    isSimulated: true,
    timestamp: "12:43:50 PM",
    actor: "AI_AGENT",
    action: "SEARCH_CATALOG",
    correlationId: "corr_1b2c3d4e",
    sessionId: "sess_a8f921_1725450",
    status: "SUCCESS",
    description: "Gemini bounded tool query executed for category 'laptop' with filter max_price=5000000.",
  },
  {
    id: "evt_act_003",
    isSimulated: true,
    timestamp: "12:42:19 PM",
    actor: "POLICY_ENGINE",
    action: "INTERCEPT_RESTRICTED_PURCHASE",
    correlationId: "corr_5f6e7d8c",
    sessionId: "sess_e109ff_1725454",
    status: "BLOCKED",
    description: "Tier 1 Daily Cap Exceeded: Transaction value ₹16,500 would breach daily maximum of ₹10,000 for unverified accounts.",
  },
  {
    id: "evt_act_004",
    isSimulated: true,
    timestamp: "12:40:02 PM",
    actor: "RAZORPAY_GATEWAY",
    action: "ORDER_CREATED",
    correlationId: "corr_9a8b7c6d",
    sessionId: "sess_99a803_1725453",
    status: "SUCCESS",
    description: "Server-side Razorpay order generated: order_RzpTest9942 (₹94,500) under Tier 3 mentor authorization.",
  },
  {
    id: "evt_act_005",
    isSimulated: true,
    timestamp: "12:38:25 PM",
    actor: "BUYER",
    action: "EXPLICIT_AUTHORIZATION_GRANTED",
    correlationId: "corr_3e4d5c6b",
    sessionId: "sess_99a803_1725453",
    status: "AUTHORIZED",
    description: "Buyer granted deterministic token authorization with biometric verification.",
  },
];

export const DEFAULT_POLICY_RULES: PolicyRuleDefinition[] = [
  {
    id: "rule_t1_base",
    tier: "TIER_1",
    tierName: "Unverified Student (Tier 1)",
    maxSingleTxInr: 10000,
    maxDailyTxInr: 10000,
    requireBuyerAuth: true,
    restrictedCategories: ["high_end_servers", "crypto_hardware", "commercial_bulk"],
    activeStatus: "ACTIVE",
    enforcedCountLast24h: 12,
  },
  {
    id: "rule_t2_edu",
    tier: "TIER_2",
    tierName: "Verified University Student (Tier 2)",
    maxSingleTxInr: 25000,
    maxDailyTxInr: 40000,
    requireBuyerAuth: true,
    restrictedCategories: ["commercial_bulk"],
    activeStatus: "ACTIVE",
    enforcedCountLast24h: 5,
  },
  {
    id: "rule_t3_research",
    tier: "TIER_3",
    tierName: "Sponsored Researcher / Faculty (Tier 3)",
    maxSingleTxInr: 100000,
    maxDailyTxInr: 150000,
    requireBuyerAuth: true,
    restrictedCategories: [],
    activeStatus: "ACTIVE",
    enforcedCountLast24h: 2,
  },
];

export const DEFAULT_REVENUE_OPPORTUNITIES: RevenueOpportunity[] = [
  {
    id: "opp_01",
    isSimulated: true,
    title: "Essential CS Student Laptop Bundle",
    category: "Bundling",
    projectedLiftInr: 145000,
    confidenceScore: 94,
    rationale: "78% of buyers purchasing TechNova laptops search for USB-C Multiport hubs within 48 hours.",
    suggestedAction: "Present one-click student accessory bundle during cart review saving ₹1,200.",
    opportunityType: "BUNDLE",
  },
  {
    id: "opp_02",
    isSimulated: true,
    title: "Zero-Stockout Substitution Automation",
    category: "Inventory Recovery",
    projectedLiftInr: 89000,
    confidenceScore: 91,
    rationale: "Keychron K2 wireless keyboard is stock-depleted; NuPhy Air75 matches 96% of mechanical specs.",
    suggestedAction: "Enable automated alternative recommendation with 5% discount matching coupon.",
    opportunityType: "INVENTORY_SUBSTITUTION",
  },
  {
    id: "opp_03",
    isSimulated: true,
    title: "Mid-Range Monitor Smart Replenishment",
    category: "Stock Alert",
    projectedLiftInr: 62000,
    confidenceScore: 88,
    rationale: "ViewSonic 27\" IPS monitor velocity indicates stockout in 18 hours based on semester intake.",
    suggestedAction: "Trigger auto-reservation with primary regional distributor.",
    opportunityType: "PRICING",
  },
];

export const DEFAULT_RECOVERY_ITEMS: InventoryRecoveryItem[] = [
  {
    id: "rec_01",
    isSimulated: true,
    originalProductSku: "SKU-LOGI-MXM3S",
    originalProductName: "Logitech MX Master 3S Wireless Mouse",
    originalPriceInr: 8995,
    stockoutTimestamp: "Today, 10:14 AM",
    substituteProductSku: "SKU-RAZR-PROCLCK",
    substituteProductName: "Razer Pro Click Ergonomic Wireless",
    substitutePriceInr: 7999,
    preservedGmvInr: 7999,
    buyerAccepted: true,
    recoveryLatencyMs: 240,
  },
  {
    id: "rec_02",
    isSimulated: true,
    originalProductSku: "SKU-DELL-U2723QE",
    originalProductName: "Dell UltraSharp 27 4K USB-C Hub Monitor",
    originalPriceInr: 49999,
    stockoutTimestamp: "Today, 09:32 AM",
    substituteProductSku: "SKU-ASUS-PA279CV",
    substituteProductName: "ASUS ProArt Display 27 4K HDR",
    substitutePriceInr: 44990,
    preservedGmvInr: 44990,
    buyerAccepted: true,
    recoveryLatencyMs: 180,
  },
  {
    id: "rec_03",
    isSimulated: true,
    originalProductSku: "SKU-APPL-AIRM2",
    originalProductName: "MacBook Air 13\" M2 16GB / 256GB",
    originalPriceInr: 104900,
    stockoutTimestamp: "Yesterday, 04:15 PM",
    substituteProductSku: "SKU-APPL-AIRM3",
    substituteProductName: "MacBook Air 13\" M3 16GB / 256GB (Edu Promo)",
    substitutePriceInr: 109900,
    preservedGmvInr: 109900,
    buyerAccepted: true,
    recoveryLatencyMs: 310,
  },
];

export const DEFAULT_SYSTEM_NODES: SystemNode[] = [
  {
    id: "node_fe",
    name: "Kharridlo Next.js 14 Frontend",
    category: "FRONTEND",
    status: "HEALTHY",
    latencyMs: 14,
    detail: "Edge SSR & Responsive Precision-Luxury Shell (Port 3000)",
    version: "v0.1.0-m8",
  },
  {
    id: "node_api",
    name: "FastAPI Commerce Gateway",
    category: "GATEWAY",
    status: "HEALTHY",
    latencyMs: 18,
    detail: "Strict Pydantic contracts & Integer Paise arithmetic (Port 8000)",
    version: "FastAPI 0.115.0",
  },
  {
    id: "node_ai",
    name: "Gemini + Google ADK Agent",
    category: "AI_ENGINE",
    status: "HEALTHY",
    latencyMs: 420,
    detail: "7 Bounded Tools • Prompt Injection Isolation • Zero Payment Authority",
    version: "gemini-2.0-flash",
  },
  {
    id: "node_policy",
    name: "Deterministic Policy Engine",
    category: "POLICY",
    status: "HEALTHY",
    latencyMs: 4,
    detail: "Tiered Student Spending Limits & Explicit Buyer Authorization Gate",
    version: "v1.4.0",
  },
  {
    id: "node_db",
    name: "PostgreSQL 16 Engine",
    category: "DATABASE",
    status: "HEALTHY",
    latencyMs: 2,
    detail: "Row-Level Inventory Reservation & Immutable Audit Triggers",
    version: "PostgreSQL 16.3",
  },
  {
    id: "node_rzp",
    name: "Razorpay Test Mode Sandbox",
    category: "PAYMENT_GATEWAY",
    status: "HEALTHY",
    latencyMs: 165,
    detail: "HMAC-SHA256 Signature Verification & Webhook Handling",
    version: "API v1",
  },
];
