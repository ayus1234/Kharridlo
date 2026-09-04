export interface MarketplaceProductImage {
  id?: string;
  source_url: string;
  image_type: string;
  width?: number;
  height?: number;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface MarketplaceOffer {
  id?: string;
  provider_offer_id?: string;
  seller_name?: string;
  offer_title: string;
  offer_description?: string;
  price_minor?: number;
  price_inr?: number;
  currency: string;
  discount_minor?: number;
  discount_inr?: number;
  discount_percentage?: number;
  availability?: string;
  source_url?: string;
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
  internal_product_id?: string;
  internal_sku?: string;
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
  subcategory?: string;
  original_description?: string;
  normalized_description?: string;
  ai_summary?: string;
  specifications: Record<string, any>;
  source_currency: string;
  source_price_minor?: number;
  source_price_inr?: number;
  source_mrp_minor?: number;
  source_mrp_inr?: number;
  savings_inr?: number;
  availability_status: string;
  source_rating?: number;
  source_review_count?: number;
  seller_name?: string;
  images: MarketplaceProductImage[];
  primary_image_url?: string;
  offers: MarketplaceOffer[];
  field_availability: MarketplaceFieldAvailability;
  mapping?: MarketplaceInternalMapping;
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
