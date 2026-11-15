# SatsStack Dual-Track E2E Test Infrastructure Specification

Date: 2026-11-15
Project: SatsStack
Target Surface: Mezo Testnet (Chain ID 31611) & Local / Preview Environment
Test Framework: Playwright Test (@playwright/test) with TypeScript

---

## 1. Dual-Track Testing Methodology

SatsStack employs a strict Dual-Track E2E testing architecture designed for financial-grade precision, zero-compromise UX craft, and resilient on-chain protocol safety.

- **Track A (Protocol & Engine Verification)**: Opaque-box verification of state transitions, Mezo smart contract integrations (SatsStackVault, sMUSD, Tigris Router, TroveManager, BorrowerOperations), balance deductions, tranche execution schedules, and collateral safety circuit behaviors.
- **Track B (Interface Craft & Anti-Slop Verification)**: Multi-viewport responsive reflow, WCAG AA accessibility, keyboard navigation, focus indicator fidelity, strict tabular numerical data alignment, 8 component state verifications, and zero em dash copy enforcement.

---

## 2. The 4-Tier Test Architecture

The E2E suite is systematically partitioned into 4 distinct testing tiers:

### Tier 1: Feature Coverage (Core Functional Inventory)
Exhaustive verification of the primary behavior (happy path) for all 10 features in the SatsStack Feature Inventory:
1. **Feature 1 (Scaffolding & Spec Initialization)**: Presence of DESIGN.md, design tokens, and project-local LEDGER.md.
2. **Feature 2 (SatsStackVault.sol Smart Contract)**: Core accumulation vault methods (createPlan, executeTranche, claimBtc, routeBtcToTrove, topUp, pause, resume, cancelAndWithdraw).
3. **Feature 3 (Zero-Gas Simulation & Keygen)**: Simulation script execution and deterministic deployer artifact presence.
4. **Feature 4 (App Foundation & Mezo Client)**: Navigation shell, live Mezo Testnet client status, Multicall3 reading capabilities, wallet state indicator.
5. **Feature 5 (Strategy Studio Route `/create`)**: Interactive DCA budget inputs, tranche slider calculation, interval cadence selector, Trove ICR preview, plan creation trigger.
6. **Feature 6 (Active Plans Desk Route `/dashboard`)**: Portfolio telemetry cards (Active MUSD in sMUSD, Stacked BTC, Weighted Entry, Yield Offset), Trove ICR status shield, active plan list, manual "Execute Due Tranche" action.
7. **Feature 7 (Plan Ledger & Collateral Router Route `/plan/[id]`)**: Granular fill history, on-chain transaction hash links, cost basis comparison vs oracle, parameter management (topUp, pause, cancel), 1-click "Route Stacked BTC to My Trove" action.
8. **Feature 8 (8 Behavior-Relevant Component States & Judge Access)**: Full state verification (Default, Hover, Focus-Visible, Active tactile press, Disabled, Loading skeleton, Error, Empty) plus immediate judge inspection of pre-populated sample plans without requiring a funded wallet.
9. **Feature 9 (E2E Playwright Suite & Quality Gate)**: 4 viewport reflows, WCAG AA contrast (minimum 4.5:1), visible focus rings, tabular-nums enforcement, zero em dashes.
10. **Feature 10 (Git Cleanliness & Secret Safety)**: Absence of tracked secrets (.env, private keys) and production artifact readiness.

### Tier 2: Boundary & Corner Cases (Stress & Limit Verification)
Testing precision limits, zero boundaries, and extreme parameter configurations (minimum 5 test cases per functional boundary):
- Zero budget creation attempt (0 MUSD rejected with proper validation message).
- Minimum allowable tranche (e.g. 10 MUSD minimum deposit threshold).
- Maximum slippage boundaries (0.1% strict to 5.0% maximum tolerance).
- Trove ICR critical thresholds: exactly 150% ICR floor boundary, 149.9% auto-pause trigger, 110% Mezo liquidation threshold alert.
- Interval cadence boundaries (60-second demo cadence up to 7-day institutional cadence).
- Balance overflow and insufficient balance handling during plan topUp.
- Non-numeric or negative input values rejected with descriptive inline error feedback.

### Tier 3: Cross-Feature Combinations (Pairwise & Concurrency)
Testing complex multi-system interactions across protocol modules:
- DCA tranche execution when Trove ICR drops below safety floor mid-cadence (Vault auto-pause prevents execution).
- Pausing an active plan while an execution tranche is pending (safely prevents execution, retains sMUSD yield).
- Depositing topUp funds into a plan while a tranche execution is in progress.
- Executing `cancelAndWithdraw` with partial remaining unspent sMUSD plus stacked native BTC (atomic dual-asset return).
- Modifying plan parameters (slippage cap, cadence) and observing immediate reflection on `/plan/[id]` and `/dashboard`.

### Tier 4: Real-World Application Scenarios (End-to-End User Journeys)
High-fidelity end-to-end user workflows:
1. **Scenario 1 (Mezo Borrower Collateral Accumulator)**: A borrower creates an automated DCA plan using borrowed MUSD, stack native BTC over time, and executes "Route Stacked BTC to My Trove" (`BorrowerOperations.addColl`) to increase their Trove collateral ratio from 165% to 198%.
2. **Scenario 2 (Emergency Liquidation Protection)**: A market drawdown reduces the user's ICR to 142%; the SatsStack Trove Circuit automatically shifts from READY to AUTO_PAUSED, freezing DCA swaps to protect borrower capital until collateral is restored.
3. **Scenario 3 (Concurrent Multi-Plan Accumulator)**: A power user operates three simultaneous DCA plans with different cadences (1-hour, 1-day, 7-day) and manages execution tranches without cross-state interference.

---

## 3. Viewport Matrix & Device Baselines

Playwright executes all test suites across 4 standardized viewports:
- **Mobile**: `390x844` (iPhone 12 / 13 / 14 / 15 baseline, touch-enabled, minimum 44px touch targets).
- **Tablet**: `768x1024` (iPad portrait baseline, 2-column responsive grid).
- **Laptop**: `1024x768` (Compact desktop baseline, constrained width desktop reflow).
- **Desktop**: `1440x960` (Primary widescreen cockpit, asymmetric 65/35 desk split).

---

## 4. Strict Quality Gates & Anti-Slop Enforcements

The test runner strictly fails any test execution if any of the following occur:
1. **Zero Console Errors**: Any `console.error` or uncaught exception emitted by the browser halts the test.
2. **WCAG AA Contrast**: Text colors tested against background surfaces meet or exceed 4.5:1 (3:1 for large display elements).
3. **Visible Focus Rings**: All interactive controls display `:focus-visible` styling (`outline` or amber focus ring).
4. **Tabular Numbers**: Financial columns, prices, countdown timers, and token amounts must feature `font-variant-numeric: tabular-nums`.
5. **Zero Em Dashes**: Text content across all rendered routes must contain zero em dashes (unicode U+2014) or en dashes (unicode U+2013).

---

## 5. Test Suite File Structure

The test files in `/home/antigravity/satsstack/tests/` comprise:
- `e2e_navigation_and_routes.spec.ts`: Tier 1 navigation, routing, URL query params, navbar active states, 4-viewport responsiveness.
- `e2e_strategy_studio_create.spec.ts`: Tier 1 and Tier 2 Strategy Studio (`/create`), budget sliders, interval selectors, slippage bounds, Trove ICR circuit simulator.
- `e2e_active_plans_dashboard.spec.ts`: Tier 1 and Tier 2 Active Plans Desk (`/dashboard`), portfolio telemetry, countdown timers, tranche execution trigger, batch claim.
- `e2e_plan_ledger_and_router.spec.ts`: Tier 1, Tier 2, and Tier 3 Plan Ledger (`/plan/[id]`), fill table, Trove collateral routing modal, topUp, pause, and withdrawal.
- `e2e_responsive_and_a11y.spec.ts`: Tier 2 and Tier 4 responsive tests across all 4 viewports, keyboard navigation (Tab/Shift+Tab), ARIA accessibility, focus ring verification, touch target size checks.
- `e2e_anti_slop_delivery_gate.spec.ts`: Comprehensive 4-block anti-slop verification: zero em dashes, zero generic gradients, proper button copy, real data fidelity, and 8 component behavior states.
