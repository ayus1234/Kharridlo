---
name: DhanKriya Mobile
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#ffffff'
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
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#9af1c6'
  on-secondary-container: '#0b714e'
  tertiary: '#000001'
  on-tertiary: '#ffffff'
  tertiary-container: '#25005a'
  on-tertiary-container: '#9175ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fc'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465b'
  secondary-fixed: '#9df4c9'
  secondary-fixed-dim: '#81d8ae'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005237'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#523787'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  ai-violet: '#7c839b'
  growth-emerald: '#82f5c1'
  outline-muted: '#c6c6cd'
typography:
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
  touch-target: 44px
---

## Brand & Style
The design system for mobile focuses on "Precision-Luxury," translating high-trust fintech stability into an agile, one-handed experience. The aesthetic merges **Modern Corporate** reliability with **Glassmorphism** specifically for AI-driven insights. 

The mobile brand personality is grounded and sophisticated, emphasizing "Dharma" (order) through a rigorous mathematical grid and rhythmic spacing. The UI should evoke a sense of calm authority, where complex financial data feels manageable and machine-verified execution feels seamless. Visual density is balanced by strategic whitespace to ensure the interface remains accessible for users making high-stakes decisions on the go.

## Colors
The color strategy employs high-contrast architectural tones to define functional hierarchy.

*   **Primary (Midnight Navy):** Used for core navigation anchors and primary action buttons to establish institutional trust.
*   **Secondary (Emerald Green):** Dedicated to growth indicators, successful transaction states, and confirmations.
*   **Tertiary (AI Deep Purple):** Reserves for the structural containers of AI logic and predictive commerce.
*   **Neutral (Slate & Cloud):** Provides the canvas for the UI, using cool grays to keep the interface breathable. 
*   **Surface:** Use pure white (#FFFFFF) for cards and interactive surfaces to provide maximum separation from the background.

## Typography
The system uses a tri-font hierarchy to differentiate between intent, content, and data:

1.  **Hanken Grotesk:** Used for headlines and display text to provide a sharp, contemporary edge. Mobile display sizes are capped at 32px to ensure readability without excessive wrapping.
2.  **Inter:** The functional workhorse for all body copy and financial ledgers, optimized for legibility at small scales.
3.  **Geist:** Reserved for metadata, transaction IDs, and technical labels to convey a precise, developer-grade feel.

Maintain a minimum contrast ratio of 4.5:1. For large display types, use slightly tighter letter-spacing to preserve the "premium" aesthetic.

## Layout & Spacing
The mobile layout utilizes a **4-column fluid grid** with 16px outer margins. The spacing rhythm is strictly based on a 4px baseline.

- **One-Handed Optimization:** Place primary actions and navigation in the "Natural Zone" (bottom 60% of the screen). 
- **Touch Targets:** All interactive elements (buttons, icons, list items) must maintain a minimum hit area of 44x44px.
- **Safe Zones:** Use 16px horizontal padding for all text containers. Cards should span the full 4 columns with 12px gutters between vertical stacks.

## Elevation & Depth
Hierarchy is conveyed through **Tonal Layers** and **Ambient Shadows** tinted with the Primary Navy:

- **Level 0 (Background):** Surface-neutral (#F7F9FB).
- **Level 1 (Standard Cards):** White surface with a 1px #E0E3E5 border and no shadow. Used for secondary information.
- **Level 2 (Interactive/Floating):** White surface with a soft, diffused shadow: `0px 4px 12px rgba(19, 27, 46, 0.08)`. Use this for primary transaction cards.
- **Level 3 (AI Insights):** Glassmorphic surfaces with 80% opacity, 12px backdrop-blur, and a subtle Violet outer glow to signal active machine processing.

## Shapes
The shape language follows "Calculated Softness," balancing professionalism with modern approachability.

- **Buttons & Inputs:** 8px (Rounded) to maintain a crisp, functional appearance.
- **Feature Cards:** 16px (Rounded-lg) to provide a distinct container for complex data.
- **AI Badges:** Always pill-shaped (Full round) to distinguish machine-suggested tags from user categories.

## Components
- **Primary Buttons:** High-contrast Navy backgrounds. For mobile, use full-width "fixed-to-bottom" buttons for core actions to facilitate thumb access.
- **Transaction Cards:** Utilize a 16px radius. Place the "Status" pip (Success/Pending) in the top right. Use Hanken Grotesk for the amount and Inter for the merchant name.
- **Inputs:** Maintain a 48px height minimum. Focus states should trigger a 1px Emerald or Violet border depending on the context (standard vs. AI-assisted).
- **Bottom Navigation:** Use high-contrast icons with Geist labels. The active state should be indicated by a Navy tint and a subtle 2px top-bar.
- **AI Insights:** Any component containing AI advice must feature a 2px linear gradient border (Violet to Emerald) to signal machine-generated content.
- **Data Lists:** Use zebra-striping with #F2F4F6 for lists exceeding 5 items to improve horizontal scanning on narrow viewports.