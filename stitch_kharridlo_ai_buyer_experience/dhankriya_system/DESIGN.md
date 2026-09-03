---
name: DhanKriya System
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
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
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
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
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
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system embodies a "Precision-Luxury" aesthetic for the fintech space, merging the stability of traditional banking with the fluid intelligence of AI-native commerce. The brand personality is grounded, sophisticated, and technologically advanced, focusing on the transition from human intent to machine-verified execution.

The visual style utilizes a **Modern Corporate** foundation elevated by **Glassmorphism** for AI-interfaced layers. It relies on high-density information layouts that remain legible through generous whitespace and a strict mathematical grid. The Indian identity is expressed through "Saffron-Teal" semantic accents and a focus on "Dharma" (order) in the UI structure—clean, rhythmic, and dependable.

## Colors
The palette is architectural, using depth and saturation to signal functional zones.

*   **Primary (Midnight Navy):** Used for core branding, primary actions, and navigational anchors. It represents institutional trust.
*   **Secondary (Emerald Green):** Reserved for "Success" states, financial growth indicators, and "Trusted Transaction" confirmations.
*   **Tertiary (AI Violet):** Specifically designated for AI-driven insights, generative agents, and predictive commerce recommendations.
*   **Neutral (Slate & Cloud):** A range of cool grays used for borders, subtle backgrounds, and secondary metadata to maintain a clean, breathable interface.
*   **Surface:** Pure white (#FFFFFF) is used for active containers to ensure maximum contrast against the neutral background.

## Typography
The typographic system uses a tri-font approach to differentiate between brand expression, reading, and technical data. 

**Hanken Grotesk** provides a sharp, contemporary edge for headlines. **Inter** is the workhorse for all body copy and financial ledgers, ensuring high legibility at small sizes. **Geist** is introduced for labels and transaction IDs to provide a precise, developer-grade feel to the AI-native commerce aspects. Always maintain a minimum 4.5:1 contrast ratio for body text. Use tighter letter-spacing for large display types to maintain a "premium" feel.

## Layout & Spacing
The system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The rhythm is based on a 4px baseline, with most components utilizing 16px (sm) or 24px (md) internal padding.

Large-scale commerce views should use "Safe Zones"—centralizing core transaction data while allowing AI assistant panels to slide in from the right (320px fixed width). Spacing should be "generous by default" to reduce cognitive load during complex financial decision-making.

## Elevation & Depth
This design system uses **Tonal Layers** combined with **Ambient Shadows** to define hierarchy:

1.  **Level 0 (Background):** Slate-50 (#F8FAFC).
2.  **Level 1 (Cards/Surfaces):** White with a 1px border (#E2E8F0) and no shadow.
3.  **Level 2 (Interactive Elements):** White with a soft, diffused shadow (0px 4px 12px rgba(15, 23, 42, 0.05)).
4.  **Level 3 (AI Overlays):** Semi-transparent glass (White 80%) with a backdrop-blur (12px) and a subtle Violet (#7C3AED) outer glow to indicate AI-active states.

Shadows should never be pure black; always tint them with the Primary Navy to maintain color harmony.

## Shapes
The shape language is "Calculated Softness." Standard UI containers use a 0.5rem (8px) radius to feel modern but professional. 

*   **Buttons & Inputs:** 8px (Rounded)
*   **Product/Commerce Cards:** 16px (Rounded-lg)
*   **AI Feature Badges:** Pill-shaped (Full round) to distinguish them from standard functional labels.

## Components

*   **Primary Buttons:** High-contrast Navy background with White text. Hover states should shift to a slightly lighter Indigo. 8px corner radius.
*   **AI-Native Inputs:** Search and intent fields should have a subtle Violet inner-glow when focused, signaling that the system is "listening" or "processing" intent.
*   **Transaction Cards:** Clean white surfaces with a 1px Slate-200 border. The "Status" indicator (Success, Pending, AI-Processing) should be placed in the top right corner using high-contrast pips.
*   **Chips/Tags:** Used for transaction categories. Neutral light-gray backgrounds with Primary Navy text.
*   **AI Insights:** Components containing AI-generated advice or commerce suggestions must feature a subtle linear gradient border (Violet to Teal) to clearly distinguish machine-suggested content from user-initiated data.
*   **Data Lists:** High density, using Inter for values and Geist Mono for reference numbers. Use zebra-striping with Slate-50 on every second row for long ledgers.