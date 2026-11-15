---
$schema: "https://raw.githubusercontent.com/google-labs-code/stitch-skills/main/skills/design-md/schema.json"
name: "SatsStack Design System Specification"
version: "1.0.0"
tokens:
  color:
    background:
      canvas: "#0E1116"
      surface: "#181D24"
      overlay: "#1F2630"
      elevated: "#262E3B"
      elevatedActive: "#323B4A"
    foreground:
      default: "#F0F4F8"
      muted: "#8B95A5"
      dim: "#5A6474"
      inverse: "#0E1116"
    brand:
      bitcoin: "#F7931A"
      amber: "#F59E0B"
      amberLight: "#FBBF24"
      amberDark: "#B45309"
      amberGlow: "rgba(245, 158, 11, 0.15)"
    state:
      success: "#10B981"
      successMuted: "rgba(16, 185, 129, 0.12)"
      warning: "#F59E0B"
      warningMuted: "rgba(245, 158, 11, 0.12)"
      danger: "#EF4444"
      dangerMuted: "rgba(239, 68, 68, 0.12)"
      info: "#3B82F6"
      infoMuted: "rgba(59, 130, 246, 0.12)"
    border:
      subtle: "#1F2630"
      default: "#262E3B"
      strong: "#3B4556"
      accent: "#F59E0B"
      success: "#10B981"
      danger: "#EF4444"
  typography:
    family:
      heading: "Space Grotesk, -apple-system, BlinkMacSystemFont, sans-serif"
      body: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
      mono: "JetBrains Mono, Menlo, monospace"
    size:
      display: "2.25rem"
      h1: "1.75rem"
      h2: "1.375rem"
      h3: "1.125rem"
      body: "0.9375rem"
      bodySm: "0.8125rem"
      caption: "0.75rem"
      micro: "0.6875rem"
    weight:
      regular: 400
      medium: 500
      semibold: 600
      bold: 700
    lineHeight:
      tight: 1.15
      snug: 1.3
      normal: 1.5
      relaxed: 1.65
    letterSpacing:
      tighter: "-0.03em"
      tight: "-0.015em"
      normal: "0em"
      wide: "0.025em"
      wider: "0.05em"
  spacing:
    xs: "4px"
    sm: "8px"
    md: "12px"
    lg: "16px"
    xl: "24px"
    xxl: "32px"
    xxxl: "48px"
    section: "64px"
  radius:
    none: "0px"
    sm: "4px"
    md: "8px"
    lg: "12px"
    xl: "16px"
    pill: "9999px"
  elevation:
    flat: "none"
    raised: "0 1px 2px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
    floating: "0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)"
    modal: "0 12px 32px rgba(0, 0, 0, 0.7), 0 2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
    accentGlow: "0 0 16px rgba(245, 158, 11, 0.25)"
  transition:
    durationFast: "120ms"
    durationNormal: "200ms"
    durationSlow: "300ms"
    easingStandard: "cubic-bezier(0.23, 1, 0.32, 1)"
    easingIn: "cubic-bezier(0.4, 0, 1, 1)"
    easingOut: "cubic-bezier(0, 0, 0.2, 1)"
---

# SatsStack Design System Specification & Phased Build Plan

Date: 2026-11-14
Project: SatsStack
Target Platform: Mezo Testnet (Chain ID 31611) & Mezo Mainnet (Chain ID 31612)
Governing Skill Files: 01-ui-ux-design.md, 08-anti-slop-filter.md, 09-ledger.md, 02-frontend-build.md, 04-stop-slop.md, 05-quality-verification.md

---

## 1. Visual Theme & Atmosphere

### 1.1 Surface Mode & Design Read
- Surface Mode: Operate (DeFi Asset Accumulator, Scheduled Tranche Execution Desk, Collateral Safety System).
- Design Read: Reading this as: Operate surface for Mezo Bitcoiners and MUSD stablecoin savers, with an authoritative, precision-engineered DeFi accumulator aesthetic, leaning toward Data-Dense Precision.
- Target Users: Mezo MUSD borrowers, Bitcoin stackers, and yield earners seeking automated Bitcoin dollar-cost averaging on Tigris AMM with built-in Trove collateral safety circuits.
- Atmosphere: Utilitarian, cryptographic, institutional. No marketing fluff, no speculative token hype, no distracting ambient particles. The screen serves as an active trading and debt-risk operations cockpit where every pixel displays reliable on-chain status.

### 1.2 Surface Background Treatment
- Background Formula: Multi-layered CSS composition:
  - Base Layer: `#0E1116` solid deep matte void.
  - Structure Layer: Subtle technical hairline grid (`background-size: 32px 32px; background-image: linear-gradient(to right, rgba(38, 46, 59, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(38, 46, 59, 0.35) 1px, transparent 1px)`).
  - Depth Layer: Top-centered radial gradient simulating hardware illumination (`radial-gradient(circle 800px at 50% -10%, rgba(245, 158, 11, 0.05), transparent 70%)`).
- Functional Justification: Replaces flat empty canvas with a structured engineering grid that guides eye scanning across data columns while keeping contrast at 14.8:1 for text readability.

---

## 2. Dials & Structural Fingerprint

### 2.1 The Visual Dials
- VARIANCE: 3 / 10 (Predictable, structured, symmetric layout appropriate for high-value financial execution where users must locate balances, buttons, and safety thresholds without disorientation).
- MOTION: 4 / 10 (Restrained micro-interactions, responsive tactile button clicks, and clear state transitions; zero persistent bouncing, rotating, or distracting animations).
- DENSITY: 8 / 10 (Cockpit density with 8-16px component padding, dense financial data tables, and minimal decorative margins to maximize visible on-chain state without scrolling).

### 2.2 The Liveliness Dials (08-anti-slop-filter.md)
- ENERGY: 2 / 3 (Authoritative, confident, institutional DeFi utility).
- RHYTHM: 2 / 3 (Structured horizontal data rows paired with asymmetric 65/35 desk vs sidebar split).
- MOTION: 2 / 3 (Purposeful state transitions, active progress updates, and origin-aware popovers; zero gratuitous motion).

### 2.3 Six Structural Fingerprint Axes (01-ui-ux-design.md & 09-ledger.md)
1. Section-Heading Placement: Inline with body flow. Headings sit directly at the top boundary of each functional module with strict baseline alignment. No floating hero banners or detached headings.
2. Body Composition: Two-column asymmetric. Primary transaction desk and ledger fill 65% width on the left; secondary parameters, Trove safety gauges, and keeper controls occupy 35% on the right.
3. Divider Language: Hairline rule. 1px solid `#262E3B` borders establish crisp boundaries between financial metrics, execution rows, and config panels.
4. Button Voice: Outlined. Secondary actions use 1px hairline borders (`#262E3B`) with hover fill; primary confirmation buttons use solid Bitcoin Amber (`#F59E0B`) with black text (`#0E1116`) for unambiguous call-to-action distinction.
5. Image Treatment: None. Pure typography, cryptographic hashes, SVG technical glyphs, and mathematical tables carry the interface. Zero decorative stock photos, zero 3D doodles.
6. Reveal Pattern: Horizontal sweep. Data updates and state changes transition horizontally across 180ms with subtle opacity fade (`opacity: 0 -> 1, translateX: -6px -> 0px`).

---

## 3. Palette & Typography

### 3.1 Exact 5-Token Core Palette

| Token Name | Hex Value | Semantic Role | Contrast on Base `#0E1116` |
|---|---|---|---|
| Base Dark Void | `#0E1116` | Root application background and deep canvas ground | Base Ground (0:1) |
| Desk Surface | `#181D24` | Primary container surface for cards, desks, and panels | 1.2:1 (Structural separation via border) |
| Hairline Border | `#262E3B` | 1px boundary rules, dividers, and input borders | 2.1:1 (Non-text structural boundary) |
| Bitcoin Amber Accent | `#F59E0B` | Primary interactive buttons, pending tranches, active focus rings | 8.2:1 (Passes WCAG AAA) |
| Emerald Active Signal | `#10B981` | Healthy ICR status (>= 150%), completed tranches, positive yield | 7.5:1 (Passes WCAG AAA) |

### 3.2 Secondary Functional Color Tokens
- Foreground Primary: `#F0F4F8` (14.8:1 contrast, crisp text legibility).
- Foreground Muted: `#8B95A5` (5.6:1 contrast, secondary labels, timestamps, table headers).
- Foreground Dim: `#5A6474` (3.2:1 contrast, inactive icons, placeholder text).
- Crimson Risk Signal: `#EF4444` (5.1:1 contrast, Trove danger alerts, liquidation warnings, transaction reverts).
- Surface Elevated Overlay: `#1F2630` (dropdowns, tooltips, dialogs).

### 3.3 Typography Rules & Hierarchy

Pairing: Web3 Bitcoin DeFi (Space Grotesk + Inter + JetBrains Mono) per 09-ledger.md.

```
Display Metrics: Space Grotesk Bold, 2.25rem (36px), Line Height 1.15, Letter Spacing -0.03em
H1 Route Titles: Space Grotesk Bold, 1.75rem (28px), Line Height 1.2, Letter Spacing -0.025em
H2 Section Headers: Space Grotesk SemiBold, 1.375rem (22px), Line Height 1.25, Letter Spacing -0.02em
H3 Sub-Panels: Space Grotesk Medium, 1.125rem (18px), Line Height 1.3, Letter Spacing -0.015em
Body Text: Inter Regular, 0.9375rem (15px), Line Height 1.5, Letter Spacing 0em
Body Small & Labels: Inter Medium, 0.8125rem (13px), Line Height 1.4, Letter Spacing 0.01em
Captions & Tooltips: Inter Regular, 0.75rem (12px), Line Height 1.35, Letter Spacing 0.02em
Financial Figures & Hashes: JetBrains Mono Medium, 0.875rem (14px), font-variant-numeric: tabular-nums
```

Production Load Strategy:
Loaded via `next/font/google` in `app/layout.tsx` with `display: 'swap'` and CSS variable exports:
- `--font-heading: 'Space Grotesk'`
- `--font-body: 'Inter'`
- `--font-mono: 'JetBrains Mono'`

---

## 4. Component Stylings & 8-State Fidelity Matrix

Every interactive component ships with complete behavioral fidelity across all applicable states.

### 4.1 Component 1: ActionExecuteButton
Primary operational trigger used for creating plans, executing due tranches (`executeCycle`), and routing stacked BTC to Trove collateral.

- Default: Background `#F59E0B`, text `#0E1116`, font Space Grotesk SemiBold 14px, height 40px, padding 0 18px, border-radius 8px, shadow raised.
- Hover: Background `#FBBF24`, transform none, transition duration 120ms ease-out.
- Focus-Visible: Outline 2px solid `#F59E0B`, outline-offset 2px.
- Active: Background `#B45309`, transform `scale(0.97)`, transition duration 80ms.
- Disabled: Background `#1F2630`, text `#5A6474`, border 1px solid `#262E3B`, cursor not-allowed.
- Loading: Background `#B45309`, text transparent, SVG spinner `#0E1116` centered, cursor wait.
- Error: Background `#EF4444`, text `#FFFFFF`, border-color `#EF4444`, shake animation 200ms.
- Success: Background `#10B981`, text `#0E1116`, checkmark icon, reverts to default after 2400ms.

### 4.2 Component 2: DcaParameterSlider
Dual input control pairing a continuous range slider with a tabular numerical input field for setting tranche size ($10 to $10,000 MUSD) and execution intervals (60s to 7 days).

- Default: Track height 6px, track background `#1F2630`, active track `#F59E0B`, thumb diameter 18px, thumb background `#F0F4F8`, thumb border 2px solid `#F59E0B`.
- Hover: Thumb scale(1.12), thumb border-color `#FBBF24`.
- Focus-Visible: Thumb box-shadow `0 0 0 3px rgba(245, 158, 11, 0.35)`.
- Active: Thumb scale(0.95), active track `#FBBF24`.
- Disabled: Track background `#181D24`, thumb background `#5A6474`, thumb border-color `#262E3B`.
- Loading: Track displays animated shimmer gradient `#1F2630` to `#262E3B`.
- Error: Active track `#EF4444`, thumb border-color `#EF4444`, error label rendered below track.
- Success: Active track `#10B981`, thumb border-color `#10B981`.

### 4.3 Component 3: IcrSafetyCircuitCard
Status monitor and toggle card governing automated Trove ICR pausing.

- Default: Surface `#181D24`, border 1px solid `#262E3B`, radius 12px, padding 16px.
- Hover: Border-color `#3B4556`, subtle elevation shadow raised.
- Focus-Visible: Ring 2px solid `#F59E0B`, ring-offset 2px `#0E1116`.
- Active: Surface `#1F2630`.
- Disabled: Opacity 0.6, toggle disabled, label indicates "No active Trove detected".
- Loading: Skeleton pulse on live ICR readout (height 24px, width 80px).
- Error (Circuit Triggered / Low ICR): Border 1px solid `#EF4444`, background `rgba(239, 68, 68, 0.05)`, status badge displays "CIRCUIT TRIGGERED: ICR < 150% (SWAPS PAUSED)".
- Success (Healthy ICR): Border 1px solid `#262E3B`, status badge emerald `#10B981` ("CIRCUIT ARMED: ICR SAFE at 218%").

### 4.4 Component 4: PlanRowCard (`/dashboard`)
Interactive row item displaying active DCA accumulator plans.

- Default: Surface `#181D24`, border 1px solid `#262E3B`, radius 8px, padding 16px, layout flex items-center justify-between.
- Hover: Border-color `#3B4556`, background `#1C222B`.
- Focus-Visible: Ring 2px solid `#F59E0B`, ring-offset 2px `#0E1116`.
- Active: Background `#222935`, transform scale(0.995).
- Disabled / Paused: Border 1px dashed `#3B4556`, badge displays "PAUSED BY USER" or "PAUSED LOW ICR".
- Loading: Skeleton row rendering 3 placeholder bars with shimmer.
- Error: Border 1px solid `#EF4444`, toast displays RPC read failure with retry button.
- Empty: Empty desk state rendering detailed instructional card with "Create Your First Accumulation Plan" CTA.

### 4.5 Component 5: PositionLedgerTable (`/plan/[id]`)
Detailed fill-by-fill ledger showing executed swaps, Tigris AMM tx hashes, effective BTC prices, and sMUSD yield offsets.

- Default: Header background `#181D24`, row background `#0E1116`, alternating row background `#12151B`, border 1px solid `#262E3B`, font JetBrains Mono 13px tabular-nums.
- Hover: Row background `#1C222B`, cursor pointer on Blockscout tx link.
- Focus-Visible: Row outline 1px solid `#F59E0B`.
- Active: Row background `#222935`.
- Disabled: Row text `#5A6474`.
- Loading: 5 skeleton rows with shimmering cells.
- Error: Table displays inline banner: "Unable to index execution events from Mezo RPC. Showing last cached block 16,775,579".
- Empty: Table displays: "No tranches executed yet. Next cycle scheduled in 48m 12s or trigger manual execution above."

### 4.6 Component 6: TroveCollateralRouterModal
Action dialog allowing 1-click injection of stacked BTC into the user's Mezo Trove via `BorrowerOperations.addColl{value: amount}`.

- Default: Backdrop `rgba(14, 17, 22, 0.85)` with 4px backdrop blur, modal surface `#181D24`, border 1px solid `#3B4556`, radius 16px, max-width 480px, elevation modal.
- Hover on confirm: Confirm button background `#FBBF24`.
- Focus-Visible: Focus trapped within modal; first interactive element focused; Escape key triggers dismiss.
- Active: Press scale(0.97) on modal action buttons.
- Disabled: Confirm disabled if user balance is 0 or input exceeds accumulated BTC.
- Loading: Shows step sequence: Step 1 (Redeeming BTC from Vault) -> Step 2 (Injecting Collateral to Trove).
- Error: Displays exact revert reason from `BorrowerOperations` (for example, "ICR cannot drop below MCR").
- Success: Displays green checkmark, updated Trove ICR (+34.2%), and Blockscout transaction link.

---

## 5. Layout Principles & Route Inventory

### 5.1 Grid & Container Rules
- Max Page Width: 1280px (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`).
- Spacing Scale: Strict 4px grid (4, 8, 12, 16, 24, 32, 48, 64px). Padding and gaps must always be multiples of 4px.
- Desktop Division: 12-column grid (`grid grid-cols-12 gap-6`).
  - Left Primary Desk: 8 columns (66.6%) on `/create` and `/plan/[id]`.
  - Right Intelligence Sidebar: 4 columns (33.3%) housing live Trove circuit parameters, Tigris liquidity depth, and sMUSD yield ticker.
- Tablet Division (768px to 1024px): 12-column grid collapses to stacked 12-column blocks with 24px vertical separation.
- Mobile Division (< 768px): Single column fluid layout (`w-full flex flex-col gap-4`), touch targets expanded to >= 44px.

### 5.2 Navigation Architecture
- Primary Header (N1b Canonical Three-Section):
  - Section 1 (Left): SatsStack wordmark with Bitcoin amber diamond mark (`SatsStack [MEZO]`).
  - Section 2 (Center): Segmented route switcher (`/create`, `/dashboard`, `/plan/[id]`) with active indicator pill.
  - Section 3 (Right): Mezo Testnet network badge (`Chain 31611`), live block height indicator, and Wallet Connect Desk (`0x...` with MUSD and BTC balances).
- Footer Architecture (Ft2 Inline Single Line):
  - Minimalist terminal status bar (`Mezo Testnet 31611 | RPC: rpc.test.mezo.org (Healthy) | Tigris AMM Pool: 0xd16A... | Verified Contracts on Blockscout`).

### 5.3 Complete Route Inventory (3 Real Pages)

#### Route 1: `/create` (Strategy Studio)
- Purpose: Configure and deploy a new non-custodial Bitcoin DCA accumulation plan.
- Primary Elements:
  - Total MUSD Budget allocation input with quick-set chips ($100, $500, $1,000, $5,000, Max).
  - Tranche Size slider ($10 to $1,000 MUSD per buy) and Cadence selector (Hourly, Daily, Weekly, Demo 60-second mode for hackathon judges).
  - Tigris AMM live spot price simulation box (fetching quote from `0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9` for 100 MUSD -> ~0.001278 BTC).
  - Trove ICR Safety Circuit configuration: Toggle enabled/disabled, slider for minimum ICR floor (120% to 250%, default 150%).
  - Live projection calculator: Estimated tranches, days to complete, and estimated sMUSD yield earned by idle balance while waiting.
  - Multi-step transaction trigger: Step 1 (Approve MUSD) -> Step 2 (Deposit & Arm Plan).

#### Route 2: `/dashboard` (Active Plans & Execution Desk)
- Purpose: Portfolio monitoring desk displaying active stacking plans, accrued BTC, and execution triggers.
- Primary Elements:
  - High-level summary metrics banner: Total MUSD Deposited, Idle MUSD in `sMUSD`, Total Stacked BTC (`0x7b7C...0000`), Net Yield Subsidies Earned.
  - Active Plans Desk: List of active and paused plans with progress bars, next tranche execution countdown timers, and live Trove ICR indicators (`READY` vs `PAUSED_LOW_ICR`).
  - 1-Click Action Bar: "Execute Due Tranches" (triggers `executeCycle(planId)` for due plans, with estimated gas and fee rebate display).
  - Batch Claim button: Transfers stacked BTC from all completed tranches directly to connected wallet.

#### Route 3: `/plan/[id]` (Position Ledger & Trove Collateral Router)
- Purpose: Deep inspection of a specific DCA position, execution audit log, and 1-click Trove collateral injection.
- Primary Elements:
  - Plan Header: Plan ID, Status (`ACTIVE`, `PAUSED_ICR`, `COMPLETED`, `TERMINATED`), Start Date, Remaining Budget.
  - Cost Basis Comparison Card: User's weighted average execution price vs current Mezo `PriceFeed` oracle price ($67,193.11), displaying percentage gain/loss and net sats stacked.
  - `sMUSD` Yield Accounting Card: Cumulative yield generated by unswapped MUSD in `0x6f461c...`, demonstrating how savings rate subsidies offset Tigris AMM swap fees.
  - Execution Fill Ledger Table: Complete on-chain history of each tranche swap (Timestamp, MUSD Sold, BTC Acquired, Effective Rate, Tigris Tx Hash with Blockscout link).
  - Plan Parameter Controls: Top up MUSD, change cadence, update Trove ICR floor, pause/resume plan, or emergency terminate and withdraw remaining MUSD.
  - Signature Action Card: "Route Stacked BTC to My Trove" (`BorrowerOperations.addColl{value: accumulatedBtc}`). Users can top up their active Trove collateral in one click to push their ICR further into safety.

---

## 6. Depth & Elevation

### 6.1 Shadow & Surface Hierarchy
- Elevation Layer L0 (Canvas Ground): `#0E1116`, zero shadow, no border.
- Elevation Layer L1 (Containers & Panels): `#181D24`, border 1px solid `#262E3B`, shadow raised (`0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`).
- Elevation Layer L2 (Active Cards & Floating Menus): `#1F2630`, border 1px solid `#3B4556`, shadow floating (`0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`).
- Elevation Layer L3 (Modals & Dialogs): `#181D24`, border 1px solid `#3B4556`, shadow modal (`0 12px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)`).

### 6.2 Border Rules & Concentric Radius
- Outer container radius = Inner element radius + padding.
  - Example Card: Outer border-radius 12px, container padding 16px, inner action button radius 8px (`12px ~= 8px + 4px visual optical step`).
  - Example Modal: Outer border-radius 16px, container padding 24px, inner form field radius 8px.
- Borders for Structure, Shadows for Depth:
  - Never use colored neon border glows as default structure. Borders remain strict 1px neutral hairline rules (`#262E3B` or `#3B4556`).
  - Focus and active states apply subtle 1px accent highlight (`#F59E0B`) with 2px offset ring, never thick fuzzy halos.

---

## 7. Do's and Don'ts (Anti-Patterns & Craft Floor)

### 7.1 Absolute Bans (Hard Gate)
- DO NOT use em dash punctuation anywhere in copy, headings, labels, tooltips, toasts, or error text. Use colons, commas, periods, or parentheses instead.
- DO NOT use generic blue-purple, blue-cyan, or pink-violet gradients.
- DO NOT use AI marketing buzzwords ("revolutionary", "seamless", "next-generation", "empower", "delve").
- DO NOT invent fake metrics, fake testimonials, fake trader names, or fake transaction volume numbers. If data does not exist, display zero or a clearly labeled placeholder.
- DO NOT use cards as a default container when tabular data or list structures fit the content.
- DO NOT animate entrances from `scale(0)`; all animated reveals must start from `scale(0.95)` with `opacity: 0`.
- DO NOT use `transition: all`. Animate explicit properties (`transform`, `opacity`, `background-color`, `border-color`) only.

### 7.2 Positive Craft Rules
- DO use `font-variant-numeric: tabular-nums` on all token balances, currency values, countdowns, and timestamps.
- DO format all Bitcoin quantities to 8 decimal places or sats integer representation (e.g., `0.00127810 BTC` or `127,810 sats`).
- DO format all MUSD balances with comma thousand separators and 2 decimal places (`1,500.00 MUSD`).
- DO provide actionable recovery paths for every error state (e.g., "Insufficient MUSD balance: Get testnet MUSD from faucet or approve spending").
- DO provide a direct link to Mezo Blockscout (`https://explorer.test.mezo.org/tx/...`) on every executed cycle receipt.
- DO respect `prefers-reduced-motion` by disabling transitions and rendering the final layout immediately.

---

## 8. Responsive Behavior & Viewport Breakpoints

### 8.1 Breakpoint Standards
- Mobile: 390px to 640px (Strict single-column stack, full-width touch cards, fixed bottom action bar).
- Tablet: 641px to 1024px (Two-column fluid stack, collapsibles for deep transaction details).
- Desktop: 1025px to 1440px (Asymmetric 12-column grid, persistent sidebar intelligence).

### 8.2 Touch Target Discipline
- Minimum touch target for any interactive element on mobile is 44px by 44px (including padding).
- Range slider thumbs have a minimum tap area of 44px via pseudo-element bounds (`::after { content: ''; position: absolute; inset: -12px; }`).
- Segmented route switchers and tabs expand to fill mobile container width (`w-full flex-1`).

### 8.3 Section Collapse Strategy
- Desktop 65/35 desk on `/create` collapses to vertical sequence on mobile:
  1. Budget & Tranche Slider (Top priority operational controls).
  2. Trove ICR Safety Circuit (Critical risk setting).
  3. Projection Summary Matrix (Estimated returns and yield).
  4. Fixed Bottom Confirmation Bar (High-contrast `Create Accumulator Plan` button accessible to thumb reach).
- Tables on `/plan/[id]` collapse on mobile from tabular columns into discrete, structured card records with label-value pairs.

---

## 9. Signature, Motion & Depth Plan

### 9.1 Signature Element: The Trove ICR Safety Circuit & Yield-Offset Ledger Matrix
The signature component of SatsStack is the interactive **Trove ICR Safety Circuit & Yield-Offset Ledger Matrix**.
- Documented Functional Job: Visually bridges two distinct Mezo protocols: Mezo Trove Borrowing (`BorrowerOperations` / `TroveManager`) and Tigris AMM DCA.
- Visual Language: A live risk gauge displaying the user's current Trove collateralization ratio (e.g. 218%) alongside the user-defined safety floor (e.g. 150%). If spot BTC volatility pushes the Trove toward the floor, the circuit illuminates amber/crimson and automatically halts upcoming DCA tranches, protecting the user's MUSD reserves from being spent when their collateral needs debt repayment or liquidation defense.
- Accrued Yield Offset Readout: Displays real-time harvested yield from unswapped MUSD parked in `sMUSD` (`0x6f461c...`), explicitly tracking how many dollars of Tigris AMM swap fees and gas costs were paid for by protocol yield.

### 9.2 Motion Plan & Timings (Subtle Tier)
- Tier: Subtle (Restrained, high-frequency operational utility).
- Duration Fast: 120ms (Hover state changes, button scale feedback).
- Duration Normal: 200ms (Modal transitions, dropdown menus, tab switches).
- Duration Slow: 300ms (Page transitions, circuit breaker warning animations).
- Custom Easing Curves:
  - Standard Ease-Out: `cubic-bezier(0.23, 1, 0.32, 1)` (Punchy, decelerating entrance).
  - Tactile Press: `cubic-bezier(0, 0, 0.2, 1)` (Immediate response on touch).
- Tactile Press Scale: Buttons scale to `0.97` on `:active` with 80ms duration. Never scale below `0.95`.
- Origin-Aware Popovers: Tooltips and dropdown menus calculate trigger coordinates and scale outward from their origin point (`transform-origin: var(--radix-popover-content-transform-origin)`).
- Reduced-Motion Guard:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

## 10. Variety Ledger Record (`design-system/LEDGER.md`)

This record complies with `09-ledger.md` and documents SatsStack in the project-local ledger:

```markdown
### 2026-11-14: SatsStack
- Product type: DeFi Asset Accumulator & Trove Safety Operations, surface mode Operate
- Style: Data-Dense Dashboard (Style ID 69) + Bitcoin DeFi (Mobile/Web3)
- Palette: Bitcoin Amber on Dark Slate Void (base #0E1116, surface #181D24, border #262E3B, accent #F59E0B, signal #10B981) (family: Bitcoin DeFi Dark)
- Fonts: Web3 Bitcoin DeFi (Space Grotesk + Inter + JetBrains Mono)
- Theme: Dark (justified by user persona: Mezo institutional DeFi borrowers and night-shift node operators monitoring on-chain troves, matching Mezo brand portal dark mode)
- Dials: VARIANCE 3 / MOTION 4 / DENSITY 8 | ENERGY 2 / RHYTHM 2 / MOTION 2
- Fingerprint: inline with body heading / two-column asymmetric body / hairline rule divider / outlined button voice / none image / horizontal sweep reveal
- Landing pattern: N/A, task-led (Operate surface)
- Nav / footer: N1b canonical three-section / Ft2 inline single line
- Motion tier: Subtle
- Background & depth: Deep void #0E1116 with 32px technical hairline grid and top amber illumination radial; 3-tier elevation with 1px neutral borders and inset specular highlights
- Signature: Interactive TroveManager ICR Safety Circuit & Yield-Offset Ledger Matrix
- Design read: Reading this as: Operate surface for Mezo Bitcoiners and MUSD stablecoin savers, with an authoritative, precision-engineered DeFi accumulator aesthetic, leaning toward Data-Dense Precision.
- Notes: Rotated cleanly from Signal Lock v2 (Minimalism & Swiss, Cobalt+cream, Light, Fira Code) and Resolution Auditor (Analytics Dashboard, Trust blue, Both, IBM Plex Sans). Avoids all convergence watchlist traps: no cream+terracotta, no purple AI gradients, no generic card grids, no empty-state blanks. Zero em dashes across all copy.
```

---

## 11. Phased Build Plan (02-frontend-build.md)

Ordered strictly from cheapest and most reversible work to riskiest work. Zero stubs, zero mocks. Designed to meet the November 15 AKINDO deadline.

### Phase 1: Smart Contract Core & Verification Probe (Cheap & Reversible)
- Scope:
  - Write `SatsStackVault.sol` (~320 LOC single contract).
  - Interfaces: `IERC20`, `IMUSDSavingsRate` (`deposit`, `withdraw`, `yieldIndex`), `ITigrisRouter` (`swapExactTokensForTokens` with 4-field `Route` struct), `ITroveManager` (`getCurrentICR`, `getTroveStatus`), `IBorrowerOperations` (`addColl`).
  - Core Functions: `createPlan`, `executeCycle`, `pausePlan`, `resumePlan`, `claimStackedBtc`, `routeCollateralToTrove`, `cancelAndWithdraw`.
  - Internal Accounting: `accYieldPerMusd` math to distribute accrued `sMUSD` yield pro-rata to idle deposit balances.
- Toolchain:
  - Compile with `npx --yes solc@0.8.28 --evm-version paris contracts/SatsStackVault.sol --bin --abi -o build/`.
- Validation Sequence:
  - Run zero-gas `eth_call` `stateOverride` simulation on `https://rpc.test.mezo.org` (using standard User-Agent header) validating `sMUSD.deposit` -> `sMUSD.withdraw` -> `TigrisRouter.swapExactTokensForTokens` -> `TroveManager.getCurrentICR`.
- Manual Test Stop 1:
  - Verify simulation returns non-reverting status, receives spot BTC (`0x7b7C000000000000000000000000000000000000`), and preserves remaining MUSD balance in `sMUSD`.
- Commit Point: `git commit -m "feat(contracts): add SatsStackVault contract and testnet validation probe"`

### Phase 2: Next.js Frontend Scaffolding & Token Architecture (Cheap & Reversible)
- Scope:
  - Initialize Next.js 14/15 App Router project with TypeScript and Tailwind CSS v4.
  - Install core dependencies: `viem@2`, `wagmi@2`, `@tanstack/react-query`, `lucide-react`.
  - Configure `app/layout.tsx` with Google Fonts (`Space_Grotesk`, `Inter`, `JetBrains_Mono`).
  - Configure `globals.css` with exact normative tokens from this DESIGN.md specification.
  - Build shared layout shell: Navigation header (N1b), Footer status bar (Ft2), and ErrorBoundary wrappers.
- Validation Sequence:
  - Run `npm run build` and verify 0 TypeScript errors, 0 lint warnings, and correct CSS variable injection.
- Manual Test Stop 2:
  - Inspect root shell in Chromium at 390px, 768px, and 1280px. Confirm dark background grid, header alignment, and wallet button state.
- Commit Point: `git commit -m "feat(ui): configure design tokens, layout shell, and typography"`

### Phase 3: Route 1 Implementation: `/create` Strategy Studio
- Scope:
  - Build `app/create/page.tsx`.
  - Interactive parameter controls: MUSD budget input, tranche size slider, cadence radio pills, slippage tolerance selector.
  - Live Tigris AMM spot price query: Read `TigrisRouter.getAmountsOut` for expected BTC return per tranche.
  - Trove ICR Safety Circuit input: Toggle switch and threshold slider (120% to 250%).
  - Two-step transaction execution modal: Step 1 (MUSD ERC-20 `approve`), Step 2 (`createPlan` transaction).
- Validation Sequence:
  - Test slider inputs with keyboard arrows (accessible increment/decrement).
  - Verify reactive projection math updates without re-render stutter.
- Manual Test Stop 3:
  - Connect funded Testnet wallet, configure a 100 MUSD plan with 25 MUSD tranches, approve MUSD, and submit transaction to Mezo Testnet.
- Commit Point: `git commit -m "feat(create): implement strategy studio and on-chain plan creation flow"`

### Phase 4: Route 2 Implementation: `/dashboard` Active Plans Desk
- Scope:
  - Build `app/dashboard/page.tsx`.
  - Aggregated position metrics: Total MUSD Deposited, Idle Balance in `sMUSD`, Total Stacked BTC, Accrued Yield.
  - Multicall3 batch plan reader: Fetch active plans for connected address using `0xcA11bde05977b3631167028862bE2a173976CA11`.
  - Live Trove ICR circuit check: Query `TroveManager.getCurrentICR` for each plan owner and display badge (`READY` or `CIRCUIT TRIGGERED: PAUSED`).
  - Active Plan Rows: Countdown timer to next tranche, progress bar of filled vs remaining budget.
  - Single-click execution button: `executeCycle(planId)` triggerable by plan owner or keeper.
- Validation Sequence:
  - Inspect populated plan list, loading skeleton state, and zero-plan empty state.
- Manual Test Stop 4:
  - Trigger `executeCycle` on a due plan. Confirm transaction succeeds on Mezo Testnet, MUSD is redeemed from `sMUSD`, Tigris swap executes, and BTC accumulates in vault.
- Commit Point: `git commit -m "feat(dashboard): implement active plans desk, multicall batch reads, and cycle execution"`

### Phase 5: Route 3 Implementation: `/plan/[id]` Position Ledger & Trove Router
- Scope:
  - Build `app/plan/[id]/page.tsx`.
  - Detailed plan status header and parameters card.
  - On-chain fill history ledger: Query `CycleExecuted` contract events to render execution history table with effective rates and tx hashes.
  - Weighted average cost basis calculator vs live `PriceFeed.fetchPrice()`.
  - `sMUSD` accrued yield accounting card showing dollar subsidy against swap fees.
  - Plan management actions: Top-up MUSD budget, update cadence/ICR floor, pause/resume, cancel and withdraw.
  - 1-Click Signature Modal: "Route Stacked BTC to My Trove" (`BorrowerOperations.addColl{value: btcAmount}`).
- Validation Sequence:
  - Test parameter updates and verify event indexing.
- Manual Test Stop 5:
  - Execute "Route Stacked BTC to My Trove". Verify BTC transfers from vault to `BorrowerOperations.addColl` and borrower's Trove ICR increases on Mezo Testnet.
- Commit Point: `git commit -m "feat(ledger): implement position ledger, fill event history, and trove collateral router"`

### Phase 6: Quality Verification, Anti-Slop Audit & Hardening (Risky & Final)
- Scope:
  - Run Playwright automated test suite across all 3 routes at 390px, 768px, and 1280px.
  - Audit against `08-anti-slop-filter.md` 4-block Delivery Gate:
    - Block 1: Hard Gate verification (Zero em dashes verified across all files, WCAG AA contrast checked, touch targets >= 44px).
    - Block 2: Purpose-Gate review (Every visual technique has a documented functional reason).
    - Block 3: Craftsmanship standard (Working keyboard focus rings, no console errors, clean state resilience).
    - Block 4: Code comment hygiene (Zero AI narration or pseudo-code comments).
  - Verify contract bytecode verification on Mezo Testnet Blockscout (`api.explorer.test.mezo.org`).
- Manual Test Stop 6:
  - Perform complete end-to-end walk-through on clean browser profile without wallet pre-conditions:
    1. Land on `/dashboard`, view read-only showcase plan.
    2. Connect wallet, navigate to `/create`, deposit MUSD, arm plan.
    3. Return to `/dashboard`, view active plan, execute cycle.
    4. Open `/plan/[id]`, verify receipt on Blockscout, route 50% stacked sats to Trove.
- Commit Point: `git commit -m "chore(release): complete end-to-end verification, anti-slop audit, and testnet deployment"`

### Definition of Finished (Target: November 15 AKINDO Deadline)
1. Live Solidity vault contract deployed and verified on Mezo Testnet (Chain ID 31611).
2. All 3 routes (`/create`, `/dashboard`, `/plan/[id]`) fully built with Next.js App Router, Tailwind CSS, and Viem/Wagmi.
3. Zero stubs, zero mocks: All reads and writes communicate with real live Mezo Testnet contracts (`sMUSD`, `TigrisRouter`, `TroveManager`, `BorrowerOperations`, `Multicall3`).
4. Full compliance with `08-anti-slop-filter.md` and `04-stop-slop.md`: ZERO em dashes, ZERO marketing slop, verified WCAG AA contrast, complete 8-state component coverage.
5. Passes all tests in `05-quality-verification.md` with rendered screenshots and browser test logs.
