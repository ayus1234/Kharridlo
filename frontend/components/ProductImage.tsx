"use client";

import { useState } from "react";
import Image from "next/image";
import { Laptop, ShoppingBag } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export default function ProductImage({
  src,
  alt,
  className = "",
  width = 300,
  height = 300,
  priority = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Default fallback local image
  const imageSrc = !hasError && src ? src : "/assets/laptop-product.png";

  return (
    <div className={`relative overflow-hidden bg-slate-100 flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <ShoppingBag className="h-6 w-6 text-slate-400" />
        </div>
      )}

      {hasError ? (
        <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400">
          <Laptop className="h-10 w-10 stroke-1 mb-1" />
          <span className="text-[10px] font-mono-data font-medium">Hardware Spec</span>
        </div>
      ) : (
        <Image
          src={imageSrc}
          alt={alt || "Kharridlo Product"}
          width={width}
          height={height}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
    </div>
  );
}
