"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Laptop, Cpu, Monitor, Headphones, Mouse } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  category?: string;
}

// Category-based authentic hardware photography fallbacks
const AUTHENTIC_FALLBACKS: Record<string, string> = {
  laptop: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  mouse: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
  monitor: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
  audio: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  tablet: "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80",
  electronics: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80",
  gear: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
};

const LOCAL_FALLBACK = "/assets/laptop-product.png";

function getFallbackForProduct(nameOrAlt: string, category?: string): string {
  const text = `${nameOrAlt || ""} ${category || ""}`.toLowerCase();
  if (text.includes("mouse")) return AUTHENTIC_FALLBACKS.mouse;
  if (text.includes("keyboard") || text.includes("keychron")) return AUTHENTIC_FALLBACKS.keyboard;
  if (text.includes("monitor") || text.includes("display") || text.includes("screen")) return AUTHENTIC_FALLBACKS.monitor;
  if (text.includes("headphone") || text.includes("earphone") || text.includes("airpod") || text.includes("audio") || text.includes("boat")) return AUTHENTIC_FALLBACKS.audio;
  if (text.includes("tablet") || text.includes("ipad") || text.includes("galaxy tab")) return AUTHENTIC_FALLBACKS.tablet;
  if (text.includes("pi") || text.includes("arduino") || text.includes("dev kit") || text.includes("gpu")) return AUTHENTIC_FALLBACKS.electronics;
  return AUTHENTIC_FALLBACKS.laptop;
}

export default function ProductImage({
  src,
  alt,
  className = "",
  width = 300,
  height = 300,
  priority = false,
  category,
}: ProductImageProps) {
  const fallbackUrl = getFallbackForProduct(alt, category);
  const primarySrc = (src && !src.startsWith("/images/products/")) ? src : fallbackUrl;
  
  // If src is a non-existent local image or empty, start directly with authentic fallback
  const initialSrc = primarySrc;
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentSrc(primarySrc);
    setHasFailed(false);
    setIsLoading(true);
  }, [primarySrc]);

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackUrl && currentSrc !== LOCAL_FALLBACK) {
      // First failure: try authentic category fallback.
      setCurrentSrc(fallbackUrl);
      setIsLoading(true);
    } else if (currentSrc !== LOCAL_FALLBACK) {
      // Remote CDNs can reject automated requests or be temporarily unavailable.
      // A local product image keeps the card useful instead of leaving a blank placeholder.
      setCurrentSrc(LOCAL_FALLBACK);
      setIsLoading(true);
    } else {
      // Fallback also failed: show the product name rather than the old generic hardware label.
      setHasFailed(true);
      setIsLoading(false);
    }
  }, [currentSrc, fallbackUrl]);

  useEffect(() => {
    if (!isLoading || hasFailed) return;
    const timeout = window.setTimeout(handleError, 3000);
    return () => window.clearTimeout(timeout);
  }, [currentSrc, handleError, hasFailed, isLoading]);

  return (
    <div className={`relative overflow-hidden bg-slate-50 flex items-center justify-center ${className}`}>
      {isLoading && !hasFailed && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center z-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      )}

      {hasFailed ? (
        <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
          <Cpu className="h-8 w-8 stroke-1 mb-1 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">{alt || "Kharridlo Gear"}</span>
        </div>
      ) : (
        <Image
          src={currentSrc}
          alt={alt || "Kharridlo Product"}
          width={width}
          height={height}
          priority={priority}
          unoptimized={true}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          className={`h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
    </div>
  );
}
