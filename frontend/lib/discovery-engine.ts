/**
 * Kharridlo Intelligent Product Discovery & Recommendation Engine
 * Track 01: Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce
 *
 * Core Principles:
 * 1. "AI proposes. Deterministic systems verify. You authorize."
 * 2. Deterministic & Explainable Multi-Factor Ranking (No random scores, no hallucinations).
 * 3. Trade-off awareness: Presents BEST OVERALL, BEST VALUE, BEST PERFORMANCE, and BUDGET ALTERNATIVES.
 * 4. Transparent budget handling: Never silently exceed budget.
 * 5. Strict negative constraint enforcement (exclusions, price ceilings, brand bans).
 */

import { CURATED_MARKETPLACE_PRODUCTS } from "./curated-catalog";
import { MarketplaceProduct } from "./marketplace";

export type TradeoffType =
  | "BEST OVERALL"
  | "BEST VALUE"
  | "BEST PERFORMANCE"
  | "BUDGET ALTERNATIVE"
  | "BEST BATTERY";

export interface ShoppingRequirements {
  category?: string;
  budgetInr?: number;
  budgetPaise?: number;
  budgetFlexible?: boolean;
  useCases?: string[];
  performance?: string;
  preferredSpecs?: string[];
  mustHave?: string[];
  exclusions?: string[];
  quantity?: number;
  priority?: "Performance" | "Value" | "Battery" | "Display" | "Camera" | "Budget" | "Balanced";
  clarificationNeeded?: string;
  clarificationOptions?: string[];
}

export interface ScoredProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price_paise: number;
  price_inr: number;
  description: string;
  image_url?: string;
  specs: Record<string, any>;
  score: number;
  scoreBreakdown: {
    categoryMatch: number;
    budgetFit: number;
    specFit: number;
    useCaseFit: number;
    stockFit: number;
    exclusionPenalty: number;
  };
  tradeoffType?: TradeoffType;
  tradeoffSummary?: string;
  reasons: string[];
  matchTier: "Strong Match" | "Good Match" | "Alternative";
  inStock: boolean;
}

export interface DiscoveryResult {
  requirements: ShoppingRequirements;
  clarification?: {
    question: string;
    options: string[];
  } | null;
  tradeoffGroups: {
    bestOverall?: ScoredProduct;
    bestValue?: ScoredProduct;
    bestPerformance?: ScoredProduct;
    budgetAlternative?: ScoredProduct;
  };
  products: ScoredProduct[];
  budgetGapNotice?: string | null;
  totalCatalogMatches: number;
  activityEvents: Array<{
    id: string;
    title: string;
    detail: string;
    completed: boolean;
  }>;
}

// -----------------------------------------------------------------------------
// 1. Unified Catalog with Verified Synthetic Hardware
// -----------------------------------------------------------------------------

const SYNTHETIC_DISCOVERY_PRODUCTS: MarketplaceProduct[] = [
  // Flagship & Value Smartphones
  {
    id: "prod_ph02_pro",
    provider: "kharridlo_verified",
    provider_product_id: "DK-PH-02",
    canonical_url: "/product/prod_ph02_pro",
    title: "TechNova Pulse Pro 5G (12GB RAM, 256GB Storage, 108MP OIS Camera)",
    brand: "TechNova",
    category: "smartphone",
    subcategory: "5G Smartphone",
    original_description: "Flagship developer smartphone featuring 108MP studio camera with OIS, 12GB LPDDR5 RAM, Snapdragon 8s Gen 3, and 5000mAh battery with 65W fast charging.",
    normalized_description: "Flagship developer smartphone featuring 108MP studio camera with OIS, 12GB LPDDR5 RAM, Snapdragon 8s Gen 3, and 5000mAh battery with 65W fast charging.",
    ai_summary: null,
    specifications: {
      "Processor": "Qualcomm Snapdragon 8s Gen 3",
      "Camera": "108MP Primary Camera with Optical Image Stabilization (OIS) + 12MP Ultra-wide",
      "Memory": "12GB LPDDR5 RAM",
      "Storage": "256GB UFS 4.0 Storage",
      "Display": "6.7-inch 1.5K AMOLED 144Hz HDR10+",
      "Battery": "5000mAh with 65W SuperDart Fast Charging",
      "OS": "NovaOS 4 (Clean Android 15)"
    },
    source_currency: "INR",
    source_price_minor: 3899900,
    source_mrp_minor: 4799900,
    availability_status: "in_stock",
    source_rating: 4.8,
    source_review_count: 1420,
    seller_name: "TechNova Direct",
    primary_image_url: "/images/products/pulse_pro_5g.png",
    images: [{ source_url: "/images/products/pulse_pro_5g.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  },
  {
    id: "prod_ph01_pulse",
    provider: "kharridlo_verified",
    provider_product_id: "DK-PH-01",
    canonical_url: "/product/prod_ph01_pulse",
    title: "TechNova Pulse 5G (8GB RAM, 128GB Storage, 50MP Sony IMX Camera)",
    brand: "TechNova",
    category: "smartphone",
    subcategory: "5G Smartphone",
    original_description: "Balanced daily driver smartphone with 50MP Sony sensor, 5000mAh all-day battery, and 8GB RAM for smooth multitasking.",
    normalized_description: "Balanced daily driver smartphone with 50MP Sony sensor, 5000mAh all-day battery, and 8GB RAM for smooth multitasking.",
    ai_summary: null,
    specifications: {
      "Processor": "MediaTek Dimensity 7200 Ultra",
      "Camera": "50MP Sony IMX sensor with Night Mode",
      "Memory": "8GB RAM",
      "Storage": "128GB Storage",
      "Display": "6.67-inch FHD+ 120Hz AMOLED",
      "Battery": "5000mAh with 45W Fast Charging",
    },
    source_currency: "INR",
    source_price_minor: 2499900,
    source_mrp_minor: 2999900,
    availability_status: "in_stock",
    source_rating: 4.6,
    source_review_count: 890,
    seller_name: "TechNova Direct",
    primary_image_url: "/images/products/pulse_5g.png",
    images: [{ source_url: "/images/products/pulse_5g.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  },
  {
    id: "prod_ph08_prism",
    provider: "kharridlo_verified",
    provider_product_id: "DK-PH-08",
    canonical_url: "/product/prod_ph08_prism",
    title: "Prism Neo 11 5G (8GB RAM, 256GB Storage, 64MP Camera)",
    brand: "Prism",
    category: "smartphone",
    subcategory: "5G Smartphone",
    original_description: "Ultra-slim 5G smartphone with 64MP high resolution camera, 4800mAh battery, and vibrant 120Hz display.",
    normalized_description: "Ultra-slim 5G smartphone with 64MP high resolution camera, 4800mAh battery, and vibrant 120Hz display.",
    ai_summary: null,
    specifications: {
      "Processor": "Qualcomm Snapdragon 7s Gen 2",
      "Camera": "64MP High-Res Portrait Camera",
      "Memory": "8GB RAM",
      "Storage": "256GB Storage",
      "Display": "6.55-inch FHD+ 120Hz OLED",
      "Battery": "4800mAh with 67W Fast Charging",
    },
    source_currency: "INR",
    source_price_minor: 3299900,
    source_mrp_minor: 3999900,
    availability_status: "in_stock",
    source_rating: 4.5,
    source_review_count: 512,
    seller_name: "Prism Official",
    primary_image_url: "/images/products/bytephone_core.png",
    images: [{ source_url: "/images/products/bytephone_core.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  },
  // Developer Laptops from Verified Synthetic Catalog
  {
    id: "prod_lp15_01",
    provider: "kharridlo_verified",
    provider_product_id: "DK-LP-15",
    canonical_url: "/product/prod_lp15_01",
    title: "TechNova Laptop Pro 15 (Intel Core Ultra 7 155H, 16GB LPDDR5X, 512GB NVMe SSD)",
    brand: "TechNova",
    category: "laptop",
    subcategory: "Developer Workstation",
    original_description: "High-performance developer laptop featuring Intel Core Ultra 7 processor and fast LPDDR5X RAM, engineered for concurrent programming environments, containerized testing, and local AI exploration.",
    normalized_description: "High-performance developer laptop featuring Intel Core Ultra 7 processor and fast LPDDR5X RAM, engineered for concurrent programming environments, containerized testing, and local AI exploration.",
    ai_summary: null,
    specifications: {
      "Processor": "Intel Core Ultra 7 155H (16 Cores, up to 4.8 GHz)",
      "Memory and Storage": "16GB LPDDR5X-7467 | 512GB PCIe 4.0 NVMe SSD",
      "Display": "15.6-inch 2.8K OLED 120Hz Anti-Glare",
      "Battery Life": "11.5 Hours All-day Battery",
      "Graphics": "Intel Arc Graphics with Neural Processing Unit (NPU)",
      "Weight": "1.48 kg Thin & Light"
    },
    source_currency: "INR",
    source_price_minor: 6499900,
    source_mrp_minor: 7999900,
    availability_status: "in_stock",
    source_rating: 4.9,
    source_review_count: 2150,
    seller_name: "TechNova Direct",
    primary_image_url: "/images/products/laptop_pro_15.png",
    images: [{ source_url: "/images/products/laptop_pro_15.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  },
  {
    id: "prod_lp_low_01",
    provider: "kharridlo_verified",
    provider_product_id: "DK-LP-LOW-01",
    canonical_url: "/product/prod_lp_low_01",
    title: "TechNova DevBook Air 13 (Intel Core Ultra 5 125H, 16GB RAM, 13-Hour Battery)",
    brand: "TechNova",
    category: "laptop",
    subcategory: "Ultraportable",
    original_description: "Ultra-portable 13.3-inch developer notebook with 13-hour battery endurance, 16GB RAM, and silent fanless operation.",
    normalized_description: "Ultra-portable 13.3-inch developer notebook with 13-hour battery endurance, 16GB RAM, and silent fanless operation.",
    ai_summary: null,
    specifications: {
      "Processor": "Intel Core Ultra 5 125H",
      "Memory and Storage": "16GB RAM | 512GB NVMe SSD",
      "Display": "13.3-inch FHD+ 100% sRGB",
      "Battery Life": "13.0 Hours Extended Longevity",
      "Weight": "1.18 kg"
    },
    source_currency: "INR",
    source_price_minor: 6199900,
    source_mrp_minor: 7499900,
    availability_status: "in_stock",
    source_rating: 4.7,
    source_review_count: 780,
    seller_name: "TechNova Direct",
    primary_image_url: "/images/products/laptop_14_lite.png",
    images: [{ source_url: "/images/products/laptop_14_lite.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  },
  {
    id: "prod_lp08_zenith",
    provider: "kharridlo_verified",
    provider_product_id: "DK-LP-08",
    canonical_url: "/product/prod_lp08_zenith",
    title: "Zenith Studio 14 (AMD Ryzen 9 7940HS, 32GB RAM, 1TB SSD, RTX 4060)",
    brand: "Zenith",
    category: "laptop",
    subcategory: "High Performance Workstation",
    original_description: "Extreme compute developer notebook with Ryzen 9, 32GB DDR5 RAM, 1TB NVMe SSD, and dedicated RTX 4060 graphics.",
    normalized_description: "Extreme compute developer notebook with Ryzen 9, 32GB DDR5 RAM, 1TB NVMe SSD, and dedicated RTX 4060 graphics.",
    ai_summary: null,
    specifications: {
      "Processor": "AMD Ryzen 9 7940HS (8 Cores, 16 Threads, 5.2 GHz)",
      "Memory and Storage": "32GB DDR5 5600MHz | 1TB PCIe 4.0 SSD",
      "Display": "14.5-inch 3K 120Hz PureSight Pro",
      "Graphics": "NVIDIA GeForce RTX 4060 8GB GDDR6",
      "Battery Life": "70Wh (up to 8 hours)"
    },
    source_currency: "INR",
    source_price_minor: 8499900,
    source_mrp_minor: 10999900,
    availability_status: "in_stock",
    source_rating: 4.9,
    source_review_count: 640,
    seller_name: "Zenith Official",
    primary_image_url: "/images/products/laptop_pro_15.png",
    images: [{ source_url: "/images/products/laptop_pro_15.png", image_type: "FRONT_VIEW", is_primary: true, sort_order: 0 }],
    offers: [],
    review_summary: null,
    finance_info: null,
    fetched_at: new Date().toISOString(),
    field_availability: { has_original_description: true, has_images: true, has_offers: false, has_reviews: true, has_emi: false, has_seller_info: true, has_mrp: true, has_specifications: true }
  }
];

export function getUnifiedCatalog(): MarketplaceProduct[] {
  const existingIds = new Set(CURATED_MARKETPLACE_PRODUCTS.map((p) => p.id));
  const combined = [...CURATED_MARKETPLACE_PRODUCTS];
  for (const item of SYNTHETIC_DISCOVERY_PRODUCTS) {
    if (!existingIds.has(item.id)) {
      combined.push(item);
    }
  }
  return combined;
}

// -----------------------------------------------------------------------------
// 2. Strict Category Validation Helper
// -----------------------------------------------------------------------------

export function isProductCategoryMatch(product: MarketplaceProduct, targetCat: string): boolean {
  const pTitle = (product.title || "").toLowerCase();
  const pCat = (product.category || "").toLowerCase();
  const pSubCat = (product.subcategory || "").toLowerCase();

  if (targetCat === "laptop") {
    // Strictly reject accessories, mice, keyboards, monitors, audio, etc.
    if (
      pTitle.includes("stand") ||
      pTitle.includes("sleeve") ||
      pTitle.includes("deskmat") ||
      pTitle.includes("cable") ||
      pTitle.includes("cleaning kit") ||
      pTitle.includes("hub") ||
      pTitle.includes("charger") ||
      pTitle.includes("power bank") ||
      pTitle.includes("mouse") ||
      pTitle.includes("keyboard") ||
      pTitle.includes("monitor") ||
      pTitle.includes("headphone") ||
      pTitle.includes("headset") ||
      pTitle.includes("earbuds") ||
      pTitle.includes("tws") ||
      pTitle.includes("airdopes") ||
      pCat.includes("accessories") ||
      pCat.includes("mouse") ||
      pCat.includes("keyboard") ||
      pCat.includes("audio")
    ) {
      return false;
    }
    return (
      pCat.includes("laptop") ||
      pSubCat.includes("laptop") ||
      pTitle.includes("laptop") ||
      pTitle.includes("macbook") ||
      pTitle.includes("ideapad") ||
      pTitle.includes("vivobook") ||
      pTitle.includes("devbook") ||
      pTitle.includes("notebook") ||
      pTitle.includes("nitro") ||
      pTitle.includes("inspiron") ||
      pTitle.includes("pavilion") ||
      pTitle.includes("zenith studio") ||
      pTitle.includes("thinkpad")
    );
  }

  if (targetCat === "smartphone") {
    // Strictly reject audio, earbuds, airpods, chargers, cables, mice, keyboards, laptops
    if (
      pTitle.includes("headset") ||
      pTitle.includes("headphones") ||
      pTitle.includes("earbuds") ||
      pTitle.includes("airpods") ||
      pTitle.includes("tws") ||
      pTitle.includes("airdopes") ||
      pTitle.includes("power bank") ||
      pTitle.includes("hub") ||
      pTitle.includes("stand") ||
      pTitle.includes("laptop") ||
      pCat.includes("accessories") ||
      pCat.includes("audio") ||
      pCat.includes("laptop")
    ) {
      return false;
    }
    return (
      pCat.includes("smartphone") ||
      pCat.includes("phone") ||
      pSubCat.includes("phone") ||
      pTitle.includes("phone") ||
      pTitle.includes("5g") ||
      pTitle.includes("pulse") ||
      pTitle.includes("prism neo")
    );
  }

  if (targetCat === "headphones") {
    return (
      pCat.includes("audio") ||
      pCat.includes("headphone") ||
      pSubCat.includes("audio") ||
      pTitle.includes("headphone") ||
      pTitle.includes("earbuds") ||
      pTitle.includes("tws") ||
      pTitle.includes("airdopes") ||
      pTitle.includes("wh-1000xm5") ||
      pTitle.includes("airpods")
    );
  }

  if (targetCat === "keyboard") {
    return pCat.includes("keyboard") || pTitle.includes("keyboard") || pTitle.includes("keychron");
  }

  if (targetCat === "mouse") {
    return pCat.includes("mouse") || pTitle.includes("mouse") || pTitle.includes("trackball");
  }

  if (targetCat === "monitor") {
    return pCat.includes("monitor") || pTitle.includes("monitor") || pTitle.includes("display") || pTitle.includes("4k-uhd");
  }

  if (targetCat === "tablet") {
    return pCat.includes("tablet") || pTitle.includes("tablet") || pTitle.includes("ipad") || pTitle.includes("tab");
  }

  return pCat.includes(targetCat) || pTitle.includes(targetCat);
}

// -----------------------------------------------------------------------------
// 3. Natural-Language Requirement Extraction Engine
// -----------------------------------------------------------------------------

export function extractRequirements(
  query: string,
  previous?: ShoppingRequirements | null
): ShoppingRequirements | null {
  if (!query || query.trim().length === 0) return previous || null;
  const q = query.toLowerCase();

  // 1. Category extraction
  let category = previous?.category;
  if (
    q.includes("laptop") ||
    q.includes("notebook") ||
    q.includes("macbook") ||
    q.includes("devbook") ||
    q.includes("ideapad") ||
    q.includes("vivobook") ||
    q.includes("thinkpad")
  ) {
    category = "laptop";
  } else if (
    q.includes("phone") ||
    q.includes("smartphone") ||
    q.includes("mobile") ||
    q.includes("android") ||
    q.includes("iphone")
  ) {
    category = "smartphone";
  } else if (
    q.includes("monitor") ||
    q.includes("screen") ||
    q.includes("display")
  ) {
    category = "monitor";
  } else if (
    q.includes("keyboard") ||
    q.includes("keychron") ||
    q.includes("typing")
  ) {
    category = "keyboard";
  } else if (q.includes("mouse") || q.includes("trackball")) {
    category = "mouse";
  } else if (
    q.includes("headphone") ||
    q.includes("earphone") ||
    q.includes("earbuds") ||
    q.includes("audio") ||
    q.includes("tws")
  ) {
    category = "headphones";
  } else if (q.includes("tablet") || q.includes("ipad") || q.includes("tab")) {
    category = "tablet";
  }

  // 2. Budget extraction
  let budgetInr = previous?.budgetInr;
  const budgetMatch = q.match(
    /(?:under|below|budget|less than|within|max|<=|<|₹|rs\.?)\s*(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{2,3})*|\d+)\s*(k|thousand|lakh|lac)?/i
  );
  if (budgetMatch) {
    const rawNum = parseFloat(budgetMatch[1].replace(/,/g, ""));
    const unit = budgetMatch[2]?.toLowerCase();
    if (unit === "k" || unit === "thousand") {
      budgetInr = rawNum * 1000;
    } else if (unit === "lakh" || unit === "lac") {
      budgetInr = rawNum * 100000;
    } else if (rawNum < 500) {
      budgetInr = rawNum * 1000;
    } else {
      budgetInr = rawNum;
    }
  }

  // Direct budget increase or update (e.g. "what if I increase my budget to 90k?")
  const increaseMatch = q.match(/(?:increase|change|adjust|set)?\s*(?:budget|to)\s*(?:₹|rs\.?)?\s*(\d+)\s*(k|thousand|lakh|lac)?/i);
  if (increaseMatch && !budgetMatch) {
    let num = parseFloat(increaseMatch[1].replace(/,/g, ""));
    const unit = increaseMatch[2]?.toLowerCase();
    if (unit === "k" || unit === "thousand") num *= 1000;
    else if (unit === "lakh" || unit === "lac") num *= 100000;
    else if (num < 500) num *= 1000;
    budgetInr = num;
  }

  // 3. Exclusions & Negative Requirements
  const exclusions: string[] = [...(previous?.exclusions || [])];
  if (
    q.includes("don't show apple") ||
    q.includes("dont show apple") ||
    q.includes("don't show me apple") ||
    q.includes("dont show me apple") ||
    q.includes("no apple") ||
    q.includes("without apple") ||
    q.includes("exclude apple") ||
    q.includes("not apple")
  ) {
    if (!exclusions.includes("Apple")) exclusions.push("Apple");
  }
  if (
    q.includes("no gaming") ||
    q.includes("don't show gaming") ||
    q.includes("dont show gaming") ||
    q.includes("don't show me gaming") ||
    q.includes("not for gaming") ||
    q.includes("without gaming")
  ) {
    if (!exclusions.includes("Gaming")) exclusions.push("Gaming");
  }
  if (q.includes("no refurbished") || q.includes("not refurbished")) {
    if (!exclusions.includes("Refurbished")) exclusions.push("Refurbished");
  }

  // Strict price ceiling exclusion (e.g. "No laptop above ₹70k")
  const maxPriceExclusion = q.match(/no\s+(?:laptop|phone|monitor|product)?\s*(?:above|over|more than)\s*(?:₹|rs\.?)?\s*(\d+)\s*(k|thousand|lakh)?/i);
  if (maxPriceExclusion) {
    let cap = parseFloat(maxPriceExclusion[1]);
    const u = maxPriceExclusion[2]?.toLowerCase();
    if (u === "k" || u === "thousand") cap *= 1000;
    else if (u === "lakh") cap *= 100000;
    else if (cap < 500) cap *= 1000;
    budgetInr = cap;
    const label = `Above ₹${cap.toLocaleString("en-IN")}`;
    if (!exclusions.includes(label)) {
      exclusions.push(label);
    }
  }

  // Removal of exclusions or requirements (e.g. "remove gaming from my requirements")
  if (q.includes("remove gaming") || q.includes("drop gaming") || q.includes("no longer gaming")) {
    const idx = exclusions.indexOf("Gaming");
    if (idx > -1) exclusions.splice(idx, 1);
  }

  // 4. Use Cases
  const useCases: string[] = [...(previous?.useCases || [])];
  const addUseCase = (uc: string) => {
    if (!useCases.includes(uc)) useCases.push(uc);
  };
  const removeUseCase = (uc: string) => {
    const i = useCases.indexOf(uc);
    if (i > -1) useCases.splice(i, 1);
  };

  if (q.includes("coding") || q.includes("programming") || q.includes("developer") || q.includes("cs") || q.includes("software")) {
    addUseCase("Coding & Programming");
  }
  if (q.includes("gaming") && !exclusions.includes("Gaming") && !q.includes("no gaming") && !q.includes("remove gaming")) {
    addUseCase("Gaming");
  }
  if (q.includes("remove gaming") || q.includes("without gaming")) {
    removeUseCase("Gaming");
  }
  if (q.includes("video editing") || q.includes("editing") || q.includes("creative") || q.includes("design")) {
    addUseCase("Video Editing & Media");
  }
  if (q.includes("college") || q.includes("study") || q.includes("student") || q.includes("academic") || q.includes("school")) {
    addUseCase("College & Study");
  }

  // 5. Must-Have & Preferred Specs
  const preferredSpecs: string[] = [...(previous?.preferredSpecs || [])];
  const mustHave: string[] = [...(previous?.mustHave || [])];
  const addSpec = (spec: string, isMust = false) => {
    if (!preferredSpecs.includes(spec)) preferredSpecs.push(spec);
    if (isMust && !mustHave.includes(spec)) mustHave.push(spec);
  };

  if (q.includes("16gb") || q.includes("16 gb") || q.includes("at least 16gb")) {
    addSpec("16GB RAM", true);
  }
  if (q.includes("32gb") || q.includes("32 gb")) {
    addSpec("32GB RAM", true);
  }
  if (q.includes("good camera") || q.includes("best camera") || q.includes("camera")) {
    addSpec("High Resolution Camera", true);
  }
  if (q.includes("good battery") || q.includes("battery life") || q.includes("battery") || q.includes("best battery")) {
    addSpec("All-day Battery Life", false);
  }
  if (q.includes("4k") || q.includes("oled")) {
    addSpec("High Clarity Display", false);
  }
  if (q.includes("anc") || q.includes("noise cancel")) {
    addSpec("Active Noise Cancellation", true);
  }

  // 6. Priority & Performance
  let priority = previous?.priority || "Balanced";
  let performance = previous?.performance || "Balanced";

  if (q.includes("cheapest") || q.includes("cheaper") || q.includes("budget") || q.includes("low price") || q.includes("affordable") || q.includes("best value")) {
    priority = "Value";
  } else if (q.includes("best performance") || q.includes("performance") || q.includes("fastest") || q.includes("speed") || q.includes("power") || q.includes("1 lakh")) {
    priority = "Performance";
    performance = "High Compute";
  } else if (q.includes("battery") || q.includes("best battery") || q.includes("long battery")) {
    priority = "Battery";
    performance = "Battery Saver";
  } else if (q.includes("camera") && category === "smartphone") {
    priority = "Camera";
  }

  if (!category && !budgetInr && useCases.length === 0 && preferredSpecs.length === 0 && exclusions.length === 0) {
    return null;
  }

  return {
    category: category || "technology",
    budgetInr,
    budgetPaise: budgetInr ? budgetInr * 100 : undefined,
    budgetFlexible: q.includes("flexible") || q.includes("around"),
    useCases: useCases.length > 0 ? useCases : ["General Productivity"],
    performance,
    preferredSpecs,
    mustHave,
    exclusions,
    quantity: 1,
    priority,
  };
}

// -----------------------------------------------------------------------------
// 4. Intelligent Clarification Logic (Single Question ONLY If Materially Ambiguous)
// -----------------------------------------------------------------------------

export function checkClarification(
  reqs: ShoppingRequirements | null,
  rawQuery: string
): { question: string; options: string[] } | null {
  if (!reqs) return null;
  const q = rawQuery.toLowerCase().trim();

  // If request is sufficiently specific -> DO NOT ASK. Search immediately!
  // E.g. "Recommend a laptop under 80k for coding"
  const hasBudget = Boolean(reqs.budgetInr);
  const hasSpecificUseCase = reqs.useCases && reqs.useCases.some((u) => u !== "General Productivity");
  const hasSpecs = reqs.preferredSpecs && reqs.preferredSpecs.length > 0;
  const hasExclusions = reqs.exclusions && reqs.exclusions.length > 0;

  if (hasBudget || hasSpecificUseCase || hasSpecs || hasExclusions) {
    return null; // Sufficiently specific!
  }

  // Bare category ambiguity
  if (reqs.category === "laptop" && (q === "recommend a laptop" || q === "laptop" || q === "show laptops" || q === "need a laptop" || q === "recommend a laptop.")) {
    return {
      question: "What matters most for your laptop: coding & engineering, gaming, battery life, or a balanced option?",
      options: ["Coding & Engineering", "Gaming Performance", "All-Day Battery", "Balanced Option (Under ₹60k)"],
    };
  }

  if (reqs.category === "smartphone" && (q === "recommend a phone" || q === "phone" || q === "show phones" || q === "need a phone" || q === "recommend a phone.")) {
    return {
      question: "What is your main priority: studio camera, gaming speed, battery life, or maximum value?",
      options: ["High-Res Camera", "Fast Performance", "Long Battery", "Value under ₹30k"],
    };
  }

  return null;
}

// -----------------------------------------------------------------------------
// 5. Multi-Factor Deterministic Ranking Engine
// -----------------------------------------------------------------------------

export function scoreAndRankProducts(
  catalog: MarketplaceProduct[],
  reqs: ShoppingRequirements
): ScoredProduct[] {
  const scoredList: ScoredProduct[] = [];
  const targetCat = (reqs.category || "").toLowerCase();

  for (const product of catalog) {
    // 1. Strict category gate
    if (targetCat && !isProductCategoryMatch(product, targetCat)) {
      continue;
    }

    const pTitle = (product.title || "").toLowerCase();
    const pBrand = (product.brand || "").toLowerCase();
    const pCat = (product.category || "").toLowerCase();
    const pDesc = (product.normalized_description || product.original_description || "").toLowerCase();
    const pPricePaise = product.source_price_minor || 0;
    const pPriceInr = Math.round(pPricePaise / 100);
    const specs = product.specifications || {};
    const specsStr = Object.values(specs).join(" ").toLowerCase();
    const isOutOfStock = product.availability_status === "out_of_stock";

    let categoryMatch = 30; // Passed category gate
    let budgetFit = 0;
    let specFit = 0;
    let useCaseFit = 0;
    let stockFit = isOutOfStock ? 0 : 5;
    let exclusionPenalty = 0;

    const reasons: string[] = [];

    // --- Exclusion Filtering ---
    if (reqs.exclusions && reqs.exclusions.length > 0) {
      for (const excl of reqs.exclusions) {
        const e = excl.toLowerCase();
        if (e.includes("apple") && (pBrand.includes("apple") || pTitle.includes("apple") || pTitle.includes("macbook") || pTitle.includes("airpods"))) {
          exclusionPenalty = -1000;
        }
        if (e.includes("gaming") && (pCat.includes("gaming") || pTitle.includes("nitro") || pTitle.includes("gaming") || specsStr.includes("rtx"))) {
          exclusionPenalty = -1000;
        }
        if (e.includes("above")) {
          const capDigits = excl.replace(/\D/g, "");
          if (capDigits) {
            const cap = parseInt(capDigits, 10);
            if (pPriceInr > cap) {
              exclusionPenalty = -1000;
            }
          }
        }
      }
    }

    if (exclusionPenalty < 0) {
      continue; // Strictly filtered out!
    }

    // --- Budget Fit (0 to 25) ---
    if (reqs.budgetInr) {
      if (pPriceInr <= reqs.budgetInr) {
        const ratio = pPriceInr / reqs.budgetInr;
        if (reqs.priority === "Value") {
          budgetFit = Math.round(15 + (1 - ratio) * 10);
          reasons.push(`Budget-friendly at ₹${pPriceInr.toLocaleString("en-IN")} (under your ₹${reqs.budgetInr.toLocaleString("en-IN")} target)`);
        } else {
          if (ratio >= 0.7 && ratio <= 1.0) {
            budgetFit = 25;
            reasons.push(`Within your ₹${reqs.budgetInr.toLocaleString("en-IN")} budget`);
          } else if (ratio >= 0.5) {
            budgetFit = 20;
            reasons.push(`Comfortably under your ₹${reqs.budgetInr.toLocaleString("en-IN")} budget`);
          } else {
            budgetFit = 16;
            reasons.push(`Well below ₹${reqs.budgetInr.toLocaleString("en-IN")} cap`);
          }
        }
      } else {
        budgetFit = 0; // Over budget
      }
    } else {
      budgetFit = 20; // Flexible budget
    }

    // --- Specification Fit (0 to 25) ---
    const allText = `${pTitle} ${pDesc} ${specsStr}`;

    // RAM
    if (reqs.mustHave?.some((m) => m.includes("16GB")) || reqs.preferredSpecs?.some((s) => s.includes("16GB"))) {
      if (allText.includes("16gb") || allText.includes("16 gb") || allText.includes("32gb")) {
        specFit += 10;
        reasons.push("16GB high-speed memory for multi-tasking and IDE builds");
      }
    } else if (allText.includes("16gb") || allText.includes("32gb")) {
      specFit += 6;
      reasons.push("Spacious RAM for smooth workflows");
    }

    // Storage
    if (allText.includes("512gb") || allText.includes("1tb")) {
      specFit += 5;
      reasons.push("High-speed NVMe SSD storage");
    }

    // Camera (Smartphone)
    if (targetCat === "smartphone") {
      if (allText.includes("108mp")) {
        specFit += 10;
        reasons.push("108MP high-resolution primary camera with OIS");
      } else if (allText.includes("64mp") || allText.includes("50mp")) {
        specFit += 7;
        reasons.push("50MP+ advanced sensor for crisp photography");
      }
    }

    // Processor & Display
    if (allText.includes("i7") || allText.includes("ultra 7") || allText.includes("ryzen 7") || allText.includes("ryzen 9") || allText.includes("m1") || allText.includes("m2") || allText.includes("snapdragon 8")) {
      specFit += 8;
      reasons.push("High-sustained processor performance");
    } else if (allText.includes("i5") || allText.includes("ryzen 5") || allText.includes("ultra 5") || allText.includes("snapdragon 7")) {
      specFit += 5;
      reasons.push("Reliable multi-core processing");
    }

    specFit = Math.min(25, specFit);

    // --- Use-Case Fit (0 to 15) ---
    if (reqs.useCases?.includes("Coding & Programming")) {
      if (allText.includes("16gb") || allText.includes("core ultra") || allText.includes("i5") || allText.includes("i7") || allText.includes("ryzen") || allText.includes("developer")) {
        useCaseFit += 12;
        reasons.push("Ideal for VS Code, compiling, and containerized dev environments");
      }
    }
    if (reqs.useCases?.includes("Gaming") && !reqs.exclusions?.includes("Gaming")) {
      if (allText.includes("rtx") || allText.includes("graphics") || allText.includes("144hz") || allText.includes("gaming")) {
        useCaseFit += 12;
        reasons.push("Dedicated graphics and high-refresh display for gaming");
      }
    }
    if (reqs.useCases?.includes("College & Study")) {
      if (allText.includes("battery") || allText.includes("thin") || allText.includes("light") || allText.includes("portable")) {
        useCaseFit += 8;
        reasons.push("Portable form factor for college and library use");
      }
    }
    if (reqs.priority === "Battery" || reqs.preferredSpecs?.some((s) => s.includes("Battery"))) {
      if (allText.includes("5000mah") || allText.includes("battery") || allText.includes("hours") || allText.includes("13-hour") || allText.includes("13 hour")) {
        useCaseFit += 10;
        reasons.push("Extended battery longevity for all-day unplugged work");
      }
    }

    useCaseFit = Math.min(15, useCaseFit);

    const totalScore = categoryMatch + budgetFit + specFit + useCaseFit + stockFit;
    const uniqueReasons = Array.from(new Set(reasons)).slice(0, 3);
    if (uniqueReasons.length === 0) {
      uniqueReasons.push("Verified hardware benchmark from authorized distribution");
    }

    const matchTier: "Strong Match" | "Good Match" | "Alternative" =
      totalScore >= 75 ? "Strong Match" : totalScore >= 55 ? "Good Match" : "Alternative";

    scoredList.push({
      id: product.id,
      sku: product.provider_product_id || product.id,
      name: product.title,
      brand: product.brand,
      category: product.category,
      price_paise: pPricePaise,
      price_inr: pPriceInr,
      description: product.normalized_description || product.original_description || "",
      image_url: product.primary_image_url || product.images?.[0]?.source_url,
      specs: product.specifications || {},
      score: totalScore,
      scoreBreakdown: { categoryMatch, budgetFit, specFit, useCaseFit, stockFit, exclusionPenalty },
      reasons: uniqueReasons,
      matchTier,
      inStock: !isOutOfStock,
    });
  }

  // Sort according to priority:
  if (reqs.priority === "Value") {
    // For cheaper/value priority: order by price ascending, then score
    scoredList.sort((a, b) => (a.price_inr !== b.price_inr ? a.price_inr - b.price_inr : b.score - a.score));
  } else if (reqs.priority === "Battery") {
    // For battery priority: order by battery hours if present, then score
    scoredList.sort((a, b) => {
      const aText = `${a.name} ${JSON.stringify(a.specs)}`.toLowerCase();
      const bText = `${b.name} ${JSON.stringify(b.specs)}`.toLowerCase();
      const aBat = aText.includes("13-hour") || aText.includes("13.0 hours") ? 13 : aText.includes("11.5 hours") ? 11.5 : aText.includes("8 hours") ? 8 : aText.includes("6 hours") ? 6 : 5;
      const bBat = bText.includes("13-hour") || bText.includes("13.0 hours") ? 13 : bText.includes("11.5 hours") ? 11.5 : bText.includes("8 hours") ? 8 : bText.includes("6 hours") ? 6 : 5;
      return bBat !== aBat ? bBat - aBat : b.score - a.score;
    });
  } else {
    // Default multi-factor score descending
    scoredList.sort((a, b) => b.score - a.score);
  }
  return scoredList;
}

// -----------------------------------------------------------------------------
// 6. Trade-Off Aware Categorization
// -----------------------------------------------------------------------------

export function categorizeTradeoffs(
  rankedCandidates: ScoredProduct[],
  reqs: ShoppingRequirements
): {
  bestOverall?: ScoredProduct;
  bestValue?: ScoredProduct;
  bestPerformance?: ScoredProduct;
  budgetAlternative?: ScoredProduct;
} {
  if (rankedCandidates.length === 0) return {};

  const withinBudget = reqs.budgetInr
    ? rankedCandidates.filter((p) => p.price_inr <= reqs.budgetInr!)
    : rankedCandidates;

  let bestOverall: ScoredProduct | undefined;
  let bestValue: ScoredProduct | undefined;
  let bestPerformance: ScoredProduct | undefined;
  let budgetAlternative: ScoredProduct | undefined;

  if (withinBudget.length > 0) {
    // 1. BEST OVERALL: Top scoring balanced item
    bestOverall = { ...withinBudget[0] };
    bestOverall.tradeoffType = "BEST OVERALL";
    bestOverall.tradeoffSummary = "Optimal balance of performance, hardware specs, and budget fit";

    // 2. BEST VALUE: Lowest price among strong contenders
    const sortedByPrice = [...withinBudget].sort((a, b) => a.price_inr - b.price_inr);
    const valueCandidate = sortedByPrice.find((p) => p.id !== bestOverall?.id) || sortedByPrice[0];
    if (valueCandidate && valueCandidate.id !== bestOverall.id) {
      bestValue = { ...valueCandidate };
      bestValue.tradeoffType = "BEST VALUE";
      bestValue.tradeoffSummary = `Lowest price at ₹${bestValue.price_inr.toLocaleString("en-IN")} while satisfying core requirements`;
    }

    // 3. BEST PERFORMANCE: Highest hardware specs
    const sortedByCompute = [...withinBudget].sort((a, b) => {
      const aText = `${a.name} ${JSON.stringify(a.specs)}`.toLowerCase();
      const bText = `${b.name} ${JSON.stringify(b.specs)}`.toLowerCase();
      const aCompute = (aText.includes("i7") || aText.includes("ultra 7") || aText.includes("ryzen 7") || aText.includes("ryzen 9") || aText.includes("rtx") || aText.includes("108mp") ? 20 : 0) + (aText.includes("16gb") || aText.includes("32gb") ? 10 : 0);
      const bCompute = (bText.includes("i7") || bText.includes("ultra 7") || bText.includes("ryzen 7") || bText.includes("ryzen 9") || bText.includes("rtx") || bText.includes("108mp") ? 20 : 0) + (bText.includes("16gb") || bText.includes("32gb") ? 10 : 0);
      return bCompute - aCompute;
    });

    const perfCandidate = sortedByCompute.find((p) => p.id !== bestOverall?.id && p.id !== bestValue?.id);
    if (perfCandidate) {
      bestPerformance = { ...perfCandidate };
      bestPerformance.tradeoffType = "BEST PERFORMANCE";
      bestPerformance.tradeoffSummary = "Maximum sustained compute and graphics capabilities within budget";
    }
  } else {
    // If no items exist under budget, find the closest over-budget alternative
    const sortedByPrice = [...rankedCandidates].sort((a, b) => a.price_inr - b.price_inr);
    if (sortedByPrice.length > 0) {
      budgetAlternative = { ...sortedByPrice[0] };
      budgetAlternative.tradeoffType = "BUDGET ALTERNATIVE";
      budgetAlternative.tradeoffSummary = `Closest verified option at ₹${budgetAlternative.price_inr.toLocaleString("en-IN")} (exceeds budget by ₹${(budgetAlternative.price_inr - (reqs.budgetInr || 0)).toLocaleString("en-IN")})`;
    }
  }

  return {
    bestOverall,
    bestValue,
    bestPerformance,
    budgetAlternative,
  };
}

// -----------------------------------------------------------------------------
// 7. Main High-Level Discovery Entry Point
// -----------------------------------------------------------------------------

export function runProductDiscovery(
  userQuery: string,
  previousReqs?: ShoppingRequirements | null
): DiscoveryResult {
  const reqs = extractRequirements(userQuery, previousReqs) || {
    category: "technology",
    useCases: ["General Productivity"],
    priority: "Balanced",
  };

  const activityEvents: DiscoveryResult["activityEvents"] = [
    {
      id: "ev_req",
      title: "Extracted shopping requirements",
      detail: `${reqs.category ? `Category: ${reqs.category}` : "All hardware"}${reqs.budgetInr ? ` • Budget: ≤ ₹${reqs.budgetInr.toLocaleString("en-IN")}` : ""}${reqs.useCases ? ` • Use: ${reqs.useCases.join(", ")}` : ""}`,
      completed: true,
    },
  ];

  if (reqs.exclusions && reqs.exclusions.length > 0) {
    activityEvents.push({
      id: "ev_excl",
      title: "Enforced negative exclusions",
      detail: `Excluded: ${reqs.exclusions.join(", ")}`,
      completed: true,
    });
  }

  // Check clarification
  const clarification = checkClarification(reqs, userQuery);
  if (clarification) {
    return {
      requirements: reqs,
      clarification,
      tradeoffGroups: {},
      products: [],
      budgetGapNotice: null,
      totalCatalogMatches: 0,
      activityEvents: [
        ...activityEvents,
        {
          id: "ev_clarify",
          title: "Clarification requested",
          detail: "Awaiting user priority selection",
          completed: true,
        },
      ],
    };
  }

  // Retrieve unified catalog
  const catalog = getUnifiedCatalog();
  const scoredCandidates = scoreAndRankProducts(catalog, reqs);

  activityEvents.push({
    id: "ev_rank",
    title: "Ranked catalog hardware",
    detail: `Multi-factor evaluated ${scoredCandidates.length} matching products`,
    completed: true,
  });

  const tradeoffGroups = categorizeTradeoffs(scoredCandidates, reqs);

  // Check budget gap notice
  let budgetGapNotice: string | null = null;
  const withinBudget = reqs.budgetInr
    ? scoredCandidates.filter((p) => p.price_inr <= reqs.budgetInr!)
    : scoredCandidates;

  if (reqs.budgetInr && withinBudget.length === 0 && scoredCandidates.length > 0) {
    const closest = scoredCandidates.sort((a, b) => a.price_inr - b.price_inr)[0];
    budgetGapNotice = `I couldn't find a verified ${reqs.category || "item"} under ₹${reqs.budgetInr.toLocaleString("en-IN")}. The closest verified options start at ₹${closest.price_inr.toLocaleString("en-IN")} (${closest.name}).`;
  }

  // Assemble distinct recommendations
  const distinctMap = new Map<string, ScoredProduct>();
  if (tradeoffGroups.bestOverall) distinctMap.set(tradeoffGroups.bestOverall.id, tradeoffGroups.bestOverall);
  if (tradeoffGroups.bestValue) distinctMap.set(tradeoffGroups.bestValue.id, tradeoffGroups.bestValue);
  if (tradeoffGroups.bestPerformance) distinctMap.set(tradeoffGroups.bestPerformance.id, tradeoffGroups.bestPerformance);
  if (tradeoffGroups.budgetAlternative) distinctMap.set(tradeoffGroups.budgetAlternative.id, tradeoffGroups.budgetAlternative);

  // Fill up to 4 products from ranked pool (within budget if possible)
  const candidatePool = withinBudget.length > 0 ? withinBudget : scoredCandidates;
  for (const item of candidatePool) {
    if (distinctMap.size >= 4) break;
    if (!distinctMap.has(item.id)) {
      distinctMap.set(item.id, item);
    }
  }

  const finalProducts = Array.from(distinctMap.values());

  activityEvents.push({
    id: "ev_tradeoffs",
    title: "Categorized trade-off alternatives",
    detail: `Identified ${finalProducts.length} distinct trade-off recommendations`,
    completed: true,
  });

  return {
    requirements: reqs,
    clarification: null,
    tradeoffGroups,
    products: finalProducts,
    budgetGapNotice,
    totalCatalogMatches: scoredCandidates.length,
    activityEvents,
  };
}
