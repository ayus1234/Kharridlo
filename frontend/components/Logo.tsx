"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "full" | "compact" | "mobile" | "icon";
export type LogoTheme = "light" | "dark";
export type LogoSize = "sm" | "md" | "lg" | "xl" | "custom";

export interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  asLink?: boolean;
  href?: string;
  className?: string;
  priority?: boolean;
  ariaLabel?: string;
}

const VARIANT_CONFIGS = {
  full: {
    src: "/assets/kharridlo-logo.png",
    width: 1024,
    height: 682,
    defaultAlt: "Kharridlo — From AI intent to trusted transactions.",
    aspectRatio: 1024 / 682,
    sizeClasses: {
      sm: "h-10 w-auto",
      md: "h-14 w-auto",
      lg: "h-20 w-auto",
      xl: "h-28 w-auto",
      custom: "",
    },
  },
  compact: {
    src: "/assets/kharridlo-compact.png",
    width: 890,
    height: 508,
    defaultAlt: "Kharridlo",
    aspectRatio: 890 / 508,
    sizeClasses: {
      sm: "h-8 w-auto",
      md: "h-10 w-auto",
      lg: "h-12 w-auto",
      xl: "h-16 w-auto",
      custom: "",
    },
  },
  mobile: {
    src: "/assets/kharridlo-compact.png",
    width: 890,
    height: 508,
    defaultAlt: "Kharridlo",
    aspectRatio: 890 / 508,
    sizeClasses: {
      sm: "h-7 w-auto",
      md: "h-8 w-auto",
      lg: "h-9 w-auto",
      xl: "h-10 w-auto",
      custom: "",
    },
  },
  icon: {
    src: "/assets/kharridlo-icon.png",
    width: 580,
    height: 350,
    defaultAlt: "Kharridlo home",
    aspectRatio: 580 / 350,
    sizeClasses: {
      sm: "h-7 w-auto",
      md: "h-9 w-auto",
      lg: "h-11 w-auto",
      xl: "h-14 w-auto",
      custom: "",
    },
  },
};

export default function Logo({
  variant = "compact",
  theme = "light",
  size = "md",
  asLink = true,
  href = "/",
  className = "",
  priority = false,
  ariaLabel,
}: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.compact;
  const altText = ariaLabel || config.defaultAlt;
  const sizeClass = config.sizeClasses[size] || config.sizeClasses.md;

  // On dark backgrounds (like Midnight Navy in the merchant sidebar),
  // apply a subtle brightness filter so navy parts of the logo stand out clearly
  const themeFilterClass = theme === "dark" ? "brightness-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]" : "";

  const renderContent = () => {
    if (imageError) {
      // Accessible graceful fallback
      return (
        <span className="inline-flex items-center gap-2 font-display font-extrabold text-navy-900 tracking-tight">
          <span className="h-3 w-3 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-500">
            Kharridlo
          </span>
          {variant === "full" && (
            <span className="text-[10px] text-slate-500 font-normal">
              — From AI intent to trusted transactions.
            </span>
          )}
        </span>
      );
    }

    return (
      <div className={`relative inline-flex items-center justify-center select-none ${themeFilterClass} ${className}`}>
        <Image
          src={config.src}
          alt={altText}
          width={config.width}
          height={config.height}
          priority={priority}
          onError={() => setImageError(true)}
          className={`object-contain transition-transform duration-200 ${sizeClass}`}
          sizes="(max-width: 768px) 160px, 240px"
        />
        {/* Hidden screen-reader label for icon-only variant */}
        {variant === "icon" && <span className="sr-only">{altText}</span>}
      </div>
    );
  };

  if (asLink) {
    return (
      <Link
        href={href}
        className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ai-violet focus-visible:ring-offset-2 rounded-xl transition-opacity hover:opacity-95 active:scale-[0.98]"
        aria-label={altText}
      >
        {renderContent()}
      </Link>
    );
  }

  return renderContent();
}
