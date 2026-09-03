---
name: Merchant Intellect
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5efff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d4e4fa'
  on-surface: '#0d1c2d'
  on-surface-variant: '#45464d'
  inverse-surface: '#233143'
  inverse-on-surface: '#e9f1ff'
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
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
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
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0d1c2d'
  surface-variant: '#d4e4fa'
  navy-900: '#0F172A'
  navy-800: '#1E293B'
  emerald-500: '#10B981'
  emerald-50: '#ECFDF5'
  amber-500: '#F59E0B'
  amber-50: '#FFFBEB'
  slate-600: '#475569'
  slate-400: '#94A3B8'
  slate-200: '#E2E8F0'
  slate-50: '#F8FAFC'
  violet-600: '#7C3AED'
  error-red: '#BA1A1A'
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
  gutter: 24px
  container-padding: 32px
  stack-sm: 8px
  stack-md: 16px
  feed-gap: 12px
---

## Brand & Style

The design system is an **Analytic-Modern** framework designed for high-stakes financial environments. It balances institutional-grade reliability with the velocity of real-time fintech. The brand personality is authoritative, precise, and assistive, aiming to evoke a sense of "Dharma" (order) amidst complex global financial flows.

The visual style utilizes **Minimalism** for workspace clarity, supplemented by **Glassmorphism** for auxiliary AI layers and **Tonal Tiering** for structural depth. This version introduces **Live-Activity States**, using rhythmic motion and semantic color pulses to signal real-time system vitality and session security.

## Colors

The color architecture is built on a "Signal and Substance" model. **Merchant Navy** (#0F172A) provides the substance, used for navigation and structural grounding. Signals are delivered through a refined semantic palette:

- **Emerald (Success/Live):** Used for growth trends, active policies, and "Live" pulse indicators.
- **Amber (Attention/Pending):** Indicates items requiring merchant review or sessions nearing timeout.
- **Slate (Blocked/Protected):** A specialized neutral for "vaulted" data, inactive states, or system-protected logs.
- **Violet (Intelligence):** Reserved for AI insights and automated merchant assistance.

Use **Slate-50** for the primary canvas background to reduce eye strain during long-winded data analysis.

## Typography

Typography is used to distinguish between narrative content and technical data. 

**Hanken Grotesk** is the display voice, used for impact and summary. **Inter** is the workhorse for all interface labels, body text, and interactions. **Geist** serves a functional role: it must be used for all monospaced strings such as transaction hashes, IP addresses, and session tokens. This helps merchants visually parse "machine data" from "human content." All labels using Geist should be in uppercase to further distinguish them as metadata.

## Layout & Spacing

This design system utilizes a **Fixed Sidebar + Fluid Canvas** layout. The dashboard canvas uses a 12-column grid with a 24px gutter. 

Activity feeds and event logs utilize a high-density vertical rhythm with 12px gaps (`feed-gap`) between items to allow for more events per viewport. On mobile devices, the 280px sidebar transitions to a bottom-tab bar for key modules (Dashboard, Policies, Activity), and the content area switches to a single-column stack with 16px horizontal margins.

## Elevation & Depth

Hierarchy is established through surface tinting and subtle borders rather than heavy shadows.

- **Level 0 (Canvas):** Slate-50 background.
- **Level 1 (Cards/Tables):** Pure white surface with a 1px Slate-200 border.
- **Level 2 (Active/Feed Items):** White surface with a 1px Slate-200 border and a 4% Navy shadow to indicate a "lifted" interactive state.
- **Overlays (AI/Modals):** Glassmorphism with an 80% white tint and a 12px backdrop-blur, framed by a 1px white border for a "frosted" high-end feel.

## Shapes

The shape language conveys "Calculated Softness."
- **Standard Cards/Containers:** 8px (0.5rem) radius.
- **Bento/Summary Cards:** 12px (1rem) for a more pronounced "module" look.
- **Live Indicators:** 999px (pill-shaped) to represent continuous flow and status.
- **Session Avatars:** 4px (rounded-sm) to maintain a professional, architectural feel.

## Components

- **Pulse Indicators:** Small circular dots (8px) used next to "Live" text. For success/active states, use Emerald-500 with a secondary outer ring that pulses from 0.4 to 0 opacity over 2 seconds.
- **Event Feed Cards:** Compact cards with a 1px left-border accent matching the event status (Emerald, Amber, or Slate). These use `body-sm` for descriptions and `mono-data` for timestamps.
- **Status Chips:** Pill-shaped tags with a 10% opacity background of the semantic color and 100% opacity text.
    - *Live/Active:* Emerald-50 / Emerald-600.
    - *Attention/Review:* Amber-50 / Amber-600.
    - *Protected/Archived:* Slate-200 / Slate-600.
- **Session Trackers:** Cards featuring a progress bar at the bottom. Use Amber for sessions nearing expiration (<5 mins) and Emerald for active, healthy sessions.
- **KPI Modules:** Large numeric displays in `kpi-value`. Use a subtle Slate-50 background fill for the icon container to create a "recessed" look.
- **Data Tables:** Ghost headers in `label-sm` (Geist, All-Caps). Rows use a 1px Slate-200 bottom border. Transaction columns must use `mono-data`.