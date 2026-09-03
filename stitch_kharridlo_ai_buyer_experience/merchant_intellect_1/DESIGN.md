---
name: Merchant Intellect
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#25005a'
  on-tertiary-container: '#9863ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  navy-900: '#0f172a'
  navy-800: '#1e293b'
  emerald-500: '#10b981'
  emerald-50: '#ecfdf5'
  slate-200: '#e2e8f0'
  slate-400: '#94a3b8'
  violet-600: '#7c3aed'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  kpi-value:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 280px
  sidebar-collapsed: 80px
  container-gap: 24px
  table-cell-padding: 16px
  section-margin: 40px
  grid-gutter: 24px
---

## Brand & Style

The design system for the merchant dashboard evolves the existing "Precision-Luxury" narrative into a high-performance **Analytic-Modern** aesthetic. It is tailored for high-volume merchants who require institutional-grade reliability combined with the speed of modern fintech. The personality is authoritative yet assistive—designed to evoke a sense of total control over complex financial flows.

The style leverages **Minimalism** for the primary workspace to reduce cognitive fatigue, while employing **Tonal Layers** and **Glassmorphism** for navigational and AI-enhanced elements. The interface prioritizes high-density data visualization without sacrificing the premium, airy feel characteristic of the system. It uses sharp, mathematical precision in its grid and component construction to signal accuracy and "Dharma" (order).

## Colors

The palette is anchored by **Merchant Navy** (#0F172A), providing a stable, professional foundation for the navigation and primary actions. **Growth Emerald** (#10B981) is used strategically for positive financial trends, policy "Active" statuses, and success indicators, ensuring that critical "good" news is immediately recognizable.

A refined neutral scale from **Slate-50** to **Slate-400** handles the structural heavy lifting—borders, secondary text, and background tiers. This ensures the dashboard remains "premium" by avoiding high-contrast black/white fatigue. **AI Violet** remains as a functional accent for predictive analytics and automated insights, distinguishing machine-generated data from raw ledger entries.

## Typography

The dashboard utilizes a disciplined typographic hierarchy to organize complex data. **Hanken Grotesk** is reserved for high-level summaries and KPI values, where its geometric clarity commands attention. **Inter** handles all operational text and table content to ensure maximum readability during prolonged use.

**Geist** is critical for the merchant experience, used for all monospaced data including Transaction IDs, Policy Numbers, and Currency values. This technical font style signals to the merchant that the information is precise and system-generated. Maintain a strict "caps for labels" rule when using Geist to differentiate metadata from actionable content.

## Layout & Spacing

The dashboard employs a **Fixed Sidebar + Fluid Content** model. The sidebar is a 280px anchor that houses the primary navigation, providing immediate access to the "Policy Manager," "Analytics," and "Settlements." 

The content area follows a **12-column grid** with a consistent 24px gutter. For high-density data tables, vertical spacing is reduced to 12px or 16px to maximize information density without clutter. Top-level dashboards should use a "Bento-box" layout for KPI cards, where each card spans 3 or 4 columns depending on the metric's importance. Mobile views collapse the sidebar into a bottom navigation bar or a hamburger menu, switching to a single-column stack with 16px side margins.

## Elevation & Depth

Hierarchy in the dashboard is established through **Tonal Tiering** rather than aggressive shadows. 

1.  **Sidebar:** Uses the Primary Navy (#0F172A) to create a solid vertical anchor. Active states use a subtle tonal shift or a 2px Emerald left-border.
2.  **Dashboard Canvas:** Slate-50 (#F8FAFC) provides a neutral, low-glare background.
3.  **Content Cards & Tables:** Pure white (#FFFFFF) with a 1px Slate-200 border. These "float" over the canvas with an extremely soft shadow (4% opacity) to denote interactivity.
4.  **Policy Indicators:** Use low-contrast color floods (e.g., 10% Emerald green for "Active") to provide status depth without overwhelming the text content.

## Shapes

The shape language reflects "Calculated Softness." A base 8px (0.5rem) radius is applied to all cards and inputs to keep the UI approachable. 

- **KPI Cards & Data Tables:** 12px (rounded-lg) to frame important data blocks.
- **Status Indicators (Pills):** Full-round (999px) to distinguish them from interactive buttons.
- **Chart Elements:** Bar charts should have slight 4px top-radius rounding to maintain the system aesthetic even in abstract data forms.

## Components

- **Sidebar Navigation:** Navy-900 background. Navigation items use Inter 14px text. Active states feature an Emerald-500 vertical accent line and a subtle background highlight.
- **KPI Cards:** Prominent Hanken Grotesk values. Include a small "Trend Indicator" in the corner (Emerald for up, Red for down) using a soft-fill background and a bold icon.
- **Data Tables:** Headers in Geist 12px (all caps, Slate-400). Rows should have a subtle hover effect (Slate-50) and 1px bottom borders. Transaction IDs must be rendered in Geist Mono.
- **Policy Status Indicators:** Pill-shaped tags. "Active" uses Emerald-50 background with Emerald-600 text. "Pending" uses Slate-100 with Navy-800 text. 
- **Analytics Charts:** Line charts use a 2px Emerald stroke with a subtle gradient fill below. Tooltips follow the Glassmorphism style (80% White, 12px blur) with Navy text.
- **Actionable Inputs:** Search bars within tables should have a 1px Slate-200 border and a Geist-based placeholder to match the data-heavy environment.