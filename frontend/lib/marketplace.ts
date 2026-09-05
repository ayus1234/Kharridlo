export interface MarketplaceProductImage {
  id?: string | null;
  source_url: string;
  image_type: string;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface MarketplaceOffer {
  id?: string | null;
  provider_offer_id?: string | null;
  seller_name?: string | null;
  offer_title: string;
  offer_description?: string | null;
  price_minor?: number | null;
  price_inr?: number | null;
  currency: string;
  discount_minor?: number | null;
  discount_inr?: number | null;
  discount_percentage?: number | null;
  availability?: string | null;
  source_url?: string | null;
}

export interface MarketplaceFieldAvailability {
  has_original_description: boolean;
  has_images: boolean;
  has_offers: boolean;
  has_reviews: boolean;
  has_emi: boolean;
  has_seller_info: boolean;
  has_mrp: boolean;
  has_specifications: boolean;
}

export interface MarketplaceInternalMapping {
  mapping_status: "UNMAPPED" | "CANDIDATE" | "VERIFIED" | "DISABLED" | "PRICE_MISMATCH" | "UNAVAILABLE";
  mapping_confidence: number;
  internal_product_id?: string | null;
  internal_sku?: string | null;
  can_authoritative_checkout: boolean;
}

export interface MarketplaceProduct {
  id: string;
  provider: "amazon" | "flipkart" | "kharridlo_verified" | string;
  provider_product_id: string;
  canonical_url: string;
  title: string;
  brand: string;
  category: string;
  subcategory?: string | null;
  original_description?: string | null;
  normalized_description?: string | null;
  ai_summary?: string | null;
  specifications: Record<string, any>;
  source_currency: string;
  source_price_minor?: number | null;
  source_price_inr?: number | null;
  source_mrp_minor?: number | null;
  source_mrp_inr?: number | null;
  savings_inr?: number | null;
  availability_status: string;
  source_rating?: number | null;
  source_review_count?: number | null;
  seller_name?: string | null;
  images: MarketplaceProductImage[];
  primary_image_url?: string | null;
  offers: MarketplaceOffer[];
  review_summary?: any | null;
  finance_info?: any | null;
  field_availability: MarketplaceFieldAvailability;
  mapping?: MarketplaceInternalMapping | null;
  fetched_at: string;
}

export interface MarketplaceSearchResponse {
  items: MarketplaceProduct[];
  total: number;
  page: number;
  page_size: number;
  query?: string;
  providers_queried: string[];
  warnings: string[];
}

export interface MarketplaceProviderStatus {
  code: string;
  display_name: string;
  enabled: boolean;
  status: string;
  live_access_verified: boolean;
  notes?: string;
}

export function getProviderBadge(provider: string) {
  switch (provider) {
    case "amazon":
      return {
        label: "Amazon.in",
        provenance: "Provided by Amazon Creators API",
        badgeClass: "bg-amber-50 text-amber-900 border-amber-300 font-medium",
        dotClass: "bg-amber-500",
        isInternal: false,
      };
    case "flipkart":
      return {
        label: "Flipkart",
        provenance: "Provided by Flipkart Affiliate Feed",
        badgeClass: "bg-blue-50 text-blue-900 border-blue-300 font-medium",
        dotClass: "bg-blue-500",
        isInternal: false,
      };
    case "kharridlo_verified":
    default:
      return {
        label: "Kharridlo Verified",
        provenance: "Authoritative Kharridlo Escrow Catalog",
        badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold",
        dotClass: "bg-emerald-500",
        isInternal: true,
      };
  }
}
