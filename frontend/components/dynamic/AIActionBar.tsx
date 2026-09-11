"use client";

import Link from "next/link";
import { 
  GitCompare, 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles,
  CreditCard
} from "lucide-react";

export interface AIAction {
  id: string;
  label: string;
  icon?: "compare" | "cart" | "checkout" | "catalog" | "product";
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
}

interface AIActionBarProps {
  actions?: AIAction[];
  context?: "recommendation" | "cart_updated" | "comparison" | "checkout_ready";
  productId?: string;
  compareIds?: string[];
  className?: string;
}

export default function AIActionBar({
  actions,
  context,
  productId,
  compareIds,
  className = "",
}: AIActionBarProps) {
  // Derive default contextual actions based on stage
  const resolvedActions: AIAction[] = actions && actions.length > 0 ? actions : (() => {
    if (context === "cart_updated") {
      return [
        { id: "view_cart", label: "Review Cart", icon: "cart", href: "/cart", variant: "primary" },
        { id: "continue", label: "Explore Catalog", icon: "catalog", href: "/catalog", variant: "outline" },
      ];
    }
    if (context === "checkout_ready") {
      return [
        { id: "checkout", label: "Authorize Checkout", icon: "checkout", href: "/checkout/authorize", variant: "primary" },
        { id: "view_cart", label: "View Cart", icon: "cart", href: "/cart", variant: "secondary" },
      ];
    }
    if (context === "comparison" && compareIds && compareIds.length > 0) {
      return [
        { id: "compare_full", label: "Open Comparison Matrix", icon: "compare", href: `/compare?ids=${encodeURIComponent(compareIds.join(","))}`, variant: "primary" },
        { id: "view_cart", label: "View Cart", icon: "cart", href: "/cart", variant: "outline" },
      ];
    }
    if (context === "recommendation" && productId) {
      return [
        { id: "view_prod", label: "View Details", icon: "product", href: `/product/${productId}`, variant: "primary" },
        { id: "compare_prod", label: "Compare Specs", icon: "compare", href: `/compare?ids=${encodeURIComponent(productId)}`, variant: "outline" },
      ];
    }
    return [];
  })();

  if (resolvedActions.length === 0) return null;

  const renderIcon = (iconType?: string) => {
    switch (iconType) {
      case "compare": return <GitCompare className="w-3.5 h-3.5" />;
      case "cart": return <ShoppingBag className="w-3.5 h-3.5" />;
      case "checkout": return <CreditCard className="w-3.5 h-3.5" />;
      case "catalog": return <Layers className="w-3.5 h-3.5" />;
      default: return <ArrowRight className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 pt-2 ${className}`}>
      {resolvedActions.map((action) => {
        const baseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-display transition-all active:scale-95";
        const variantClass = {
          primary: "bg-navy-900 text-white hover:bg-ai-violet shadow-2xs",
          secondary: "bg-purple-50 text-ai-violet border border-purple-200 hover:bg-purple-100",
          outline: "bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:text-ai-violet shadow-2xs",
        }[action.variant || "outline"];

        if (action.href) {
          return (
            <Link
              key={action.id}
              href={action.href}
              className={`${baseClass} ${variantClass}`}
            >
              {renderIcon(action.icon)}
              <span>{action.label}</span>
            </Link>
          );
        }

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={`${baseClass} ${variantClass}`}
          >
            {renderIcon(action.icon)}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
