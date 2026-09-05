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
  productId?: string;
}

// 1. Exact hardware model curated photo library
const PRODUCT_SPECIFIC_MAP: Record<string, string> = {
  // Laptops
  "lenovo ideapad": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80",
  "macbook air m1": "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80",
  "macbook air m2": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
  "dell inspiron": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
  "hp pavilion": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80",
  "asus vivobook": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
  "acer nitro": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80",

  // Audio & Headphones
  "sony wh-1000xm5": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
  "boat rockerz 450": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  "airpods pro": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
  "boat airdopes 141": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  "airbuds developer": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
  "bytesound usb": "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&auto=format&fit=crop&q=80",

  // Mice & Pointers
  "logitech pebble": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
  "logitech mx master": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
  "bytemouse simple": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80",
  "aether pebble": "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?w=600&auto=format&fit=crop&q=80",
  "precision wireless mouse": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
  "titan heavyclick": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  "ergovertical": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
  "omnipresenter": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80",

  // Keyboards
  "keychron k2": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "hp 150 wireless": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "bytekeys essential": "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&auto=format&fit=crop&q=80",
  "omnitype dualos": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
  "slimtype wireless": "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80",
  "aether foldkey": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",

  // Displays & Monitors
  "lg 27-inch": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
  "samsung 24-inch": "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&auto=format&fit=crop&q=80",

  // Storage, Hubs, Accessories & Power
  "sandisk 1tb": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80",
  "anker 737": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=80",
  "portronics mport": "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&auto=format&fit=crop&q=80",
  "galaxy tab s9": "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80",
  "realme 20000": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
  "cableorganizer": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
  "cleaning kit": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
  "braided usb-c": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80",
  "kriyamat": "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80",
  "sleeve pro": "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
  "aluminum laptop stand": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
  "gan fast charger": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
  "10-in-1 usb-c hub": "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&auto=format&fit=crop&q=80"
};

// 2. Multi-image diversified category pools (prevents identical photos across same categories)
const CATEGORY_POOLS: Record<string, string[]> = {
  laptop: [
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80"
  ],
  keyboard: [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80"
  ],
  mouse: [
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1613141411244-0e4ac259d217?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"
  ],
  audio: [
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&auto=format&fit=crop&q=80"
  ],
  monitor: [
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&auto=format&fit=crop&q=80"
  ],
  tablet: [
    "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600&auto=format&fit=crop&q=80"
  ],
  accessory: [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&auto=format&fit=crop&q=80"
  ]
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getDistinctProductImage(alt: string, category?: string, productId?: string): string {
  const query = `${productId || ""} ${alt || ""} ${category || ""}`.toLowerCase();

  // Check specific product matches
  for (const [key, url] of Object.entries(PRODUCT_SPECIFIC_MAP)) {
    if (query.includes(key)) {
      return url;
    }
  }

  // Fallback to distinct rotated image within category pool
  const hash = hashString(query);
  if (query.includes("mouse")) {
    const pool = CATEGORY_POOLS.mouse;
    return pool[hash % pool.length];
  }
  if (query.includes("keyboard") || query.includes("keychron")) {
    const pool = CATEGORY_POOLS.keyboard;
    return pool[hash % pool.length];
  }
  if (query.includes("monitor") || query.includes("display") || query.includes("screen")) {
    const pool = CATEGORY_POOLS.monitor;
    return pool[hash % pool.length];
  }
  if (query.includes("headphone") || query.includes("earphone") || query.includes("airpod") || query.includes("audio") || query.includes("headset")) {
    const pool = CATEGORY_POOLS.audio;
    return pool[hash % pool.length];
  }
  if (query.includes("tablet") || query.includes("ipad") || query.includes("galaxy tab")) {
    const pool = CATEGORY_POOLS.tablet;
    return pool[hash % pool.length];
  }
  if (query.includes("cable") || query.includes("charger") || query.includes("hub") || query.includes("stand") || query.includes("sleeve") || query.includes("mat") || query.includes("kit")) {
    const pool = CATEGORY_POOLS.accessory;
    return pool[hash % pool.length];
  }

  const pool = CATEGORY_POOLS.laptop;
  return pool[hash % pool.length];
}

export default function ProductImage({
  src,
  alt,
  className = "",
  width = 300,
  height = 300,
  priority = false,
  category,
  productId,
}: ProductImageProps) {
  const resolvedDistinctUrl = getDistinctProductImage(alt, category, productId);

  // If provided src is a valid remote image URL, prefer it, otherwise use resolved distinct product image
  const primarySrc = (src && src.startsWith("http") && !src.startsWith("/images/products/"))
    ? src
    : resolvedDistinctUrl;

  const [currentSrc, setCurrentSrc] = useState<string>(primarySrc);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentSrc(primarySrc);
    setHasFailed(false);
    setIsLoading(true);
  }, [primarySrc]);

  const handleError = useCallback(() => {
    if (currentSrc !== resolvedDistinctUrl) {
      // Step 1: Fallback to the dedicated distinct photography for this product
      setCurrentSrc(resolvedDistinctUrl);
      setIsLoading(true);
    } else if (currentSrc !== "/assets/laptop-product.png") {
      // Step 2: Local fallback
      setCurrentSrc("/assets/laptop-product.png");
      setIsLoading(true);
    } else {
      // Step 3: Friendly branded indicator
      setHasFailed(true);
      setIsLoading(false);
    }
  }, [currentSrc, resolvedDistinctUrl]);

  useEffect(() => {
    if (!isLoading || hasFailed) return;
    const timeout = window.setTimeout(handleError, 3500);
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
