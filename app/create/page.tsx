'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import DcaParameterSlider from '@/components/DcaParameterSlider';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import { INTERVAL_PRESETS, SLIPPAGE_PRESETS, TROVE_SAFETY_DEFAULTS } from '@/lib/constants';
import { formatCurrency, formatBtc } from '@/lib/utils';
import { ArrowRight, Layers, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreatePlanPage() {
  const router = useRouter();

  // DCA State
  const [budgetMusd, setBudgetMusd] = useState<number>(5000);
  const [trancheSizeMusd, setTrancheSizeMusd] = useState<number>(500);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(60);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [troveSafeFloorIcr, setTroveSafeFloorIcr] = useState<number>(150);

  // Workflow State
  const [step, setStep] = useState<'APPROVE' | 'LAUNCH' | 'SUCCESS'>('APPROVE');
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Validation
  const isBudgetValid = budgetMusd > 0;
  const isExtremeBudget = budgetMusd >= 1000000;
  const trancheCount = Math.max(1, Math.ceil(budgetMusd / (trancheSizeMusd || 1)));
  const estimatedBtcOutput = budgetMusd / 95420; // Simulated Tigris oracle spot price
  const isHighSlippage = Number(customSlippage) > 5 || slippageTolerance > 5;
  const isIcrDangerous = troveSafeFloorIcr <= 120;

  const handleApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      setIsApproving(false);
      setIsApproved(true);
      setStep('LAUNCH');
    }, 1200);
  };

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      setStep('SUCCESS');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1116]">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="font-['Space_Grotesk'] text-2xl lg:text-3xl font-bold text-[#F0F4F8]">
            Strategy Studio
          </h1>
          <p className="text-sm text-[#8B95A5]">
            Configure automated Bitcoin accumulation with sMUSD yield and Trove ICR collateral safety circuit.
          </p>
        </div>

        {/* 2-Column Cockpit Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. DCA Budget Input */}
            <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
              <label className="block text-xs font-medium text-[#8B95A5]">
                Total DCA Budget (MUSD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="budget"
                  placeholder="Enter MUSD budget"
                  value={budgetMusd || ''}
                  onChange={(e) => setBudgetMusd(Number(e.target.value))}
                  className="w-full bg-[#0E1116] border border-[#262E3B] rounded-lg px-4 py-3 text-[#F0F4F8] font-mono text-lg tabular-nums placeholder-[#5A6474] focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
                />
                <span className="absolute right-4 top-3.5 font-mono text-xs text-[#8B95A5]">
                  MUSD
                </span>
              </div>
              {!isBudgetValid && (
                <p className="text-xs text-[#EF4444]">
                  Budget must be greater than 0 MUSD.
                </p>
              )}
              {isExtremeBudget && (
                <p className="text-xs text-[#F59E0B]">
                  Notice: High budget amount detected. Tranches will execute across multiple intervals.
                </p>
              )}
            </div>

            {/* 2. Tranche Size Slider */}
            <DcaParameterSlider
              label="Tranche Size (MUSD per Swap)"
              name="tranche"
              value={trancheSizeMusd}
              min={100}
              max={Math.max(500, Math.min(budgetMusd, 5000))}
              step={50}
              unit="MUSD"
              onChange={(val) => setTrancheSizeMusd(val)}
              hint={`Executes ${trancheCount} scheduled tranches across Tigris pool`}
            />

            {/* 3. Cadence Selector */}
            <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
              <label className="block text-xs font-medium text-[#8B95A5]">
                Interval Cadence
              </label>
              <div role="radiogroup" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INTERVAL_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIntervalSeconds(preset.value)}
                    className={`px-3 py-2.5 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer btn-press ${
                      intervalSeconds === preset.value
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]'
                        : 'bg-[#0E1116] border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8]'
                    }`}
                  >
                    <div>{preset.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#8B95A5]">
                Cadence: {INTERVAL_PRESETS.find((p) => p.value === intervalSeconds)?.description}
              </p>
            </div>

            {/* 4. Slippage Tolerance Selector */}
            <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
              <label className="block text-xs font-medium text-[#8B95A5]">
                Max Slippage Tolerance
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {SLIPPAGE_PRESETS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSlippageTolerance(opt.value);
                      setCustomSlippage('');
                    }}
                    className={`px-3.5 py-2 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer btn-press ${
                      slippageTolerance === opt.value && !customSlippage
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]'
                        : 'bg-[#0E1116] border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <input
                  type="number"
                  name="slippage"
                  placeholder="Custom %"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    setSlippageTolerance(Number(e.target.value));
                  }}
                  className="w-32 bg-[#0E1116] border border-[#262E3B] rounded-lg px-3 py-2 text-xs font-mono text-[#F0F4F8] tabular-nums placeholder-[#5A6474] focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
                />
              </div>
              {isHighSlippage && (
                <div className="flex items-center gap-2 text-xs text-[#EF4444]">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Warning: high slippage tolerance can lead to unfavorable execution fills.</span>
                </div>
              )}
            </div>

            {/* 5. Trove ICR Safety Circuit Preview Slider */}
            <div id="trove-circuit">
              <DcaParameterSlider
                label="Trove ICR Safety Circuit Floor"
                name="icr"
                value={troveSafeFloorIcr}
                min={110}
                max={220}
                step={5}
                unit="%"
                onChange={(val) => setTroveSafeFloorIcr(val)}
                hint={
                  isIcrDangerous
                    ? 'Critical Danger: 110% is near liquidation threshold. Auto pause recommended at 150%.'
                    : `Swaps auto-pause if borrower Trove ICR dips below ${troveSafeFloorIcr}% safety floor.`
                }
                isDanger={isIcrDangerous}
              />
            </div>
          </div>

          {/* Right Column: Live Settlement Routing Flow & Launch Desk (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Settlement Routing Flow Diagram */}
            <div className="p-6 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-5">
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#F0F4F8] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F59E0B]" />
                <span>Live Settlement Routing Flow</span>
              </h2>

              {/* Flow Steps */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between gap-2 overflow-hidden">
                  <span className="text-[#8B95A5] shrink-0">1. Input Deposit:</span>
                  <span className="text-[#F0F4F8] font-bold tabular-nums truncate max-w-[200px]">
                    {formatCurrency(budgetMusd)} MUSD
                  </span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between">
                  <div>
                    <span className="text-[#8B95A5]">2. Yield Parking:</span>
                    <p className="text-[10px] text-[#5A6474] font-sans">Idle principal earns in sMUSD</p>
                  </div>
                  <span className="text-[#10B981] font-bold">sMUSD Vault</span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between">
                  <div>
                    <span className="text-[#8B95A5]">3. Swaps via Tigris:</span>
                    <p className="text-[10px] text-[#5A6474] font-sans">Basic MUSD/BTC Pool</p>
                  </div>
                  <span className="text-[#F59E0B] font-bold tabular-nums">
                    ${trancheSizeMusd} / tranche
                  </span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between">
                  <span className="text-[#8B95A5]">4. Est. BTC Output:</span>
                  <span className="text-[#10B981] font-bold tabular-nums">
                    ~{formatBtc(estimatedBtcOutput)} BTC
                  </span>
                </div>
              </div>
            </div>

            {/* Launch Action Desk */}
            <div className="p-6 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-4">
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[#F0F4F8]">
                Execute Strategy
              </h2>

              <div className="space-y-3">
                <ActionExecuteButton
                  variant={isApproved ? 'secondary' : 'primary'}
                  disabled={!isBudgetValid || isApproved}
                  isLoading={isApproving}
                  loadingText="Approving MUSD..."
                  onClick={handleApprove}
                  className="w-full py-3"
                >
                  {isApproved ? 'MUSD Approved' : 'Step 1: Approve MUSD'}
                </ActionExecuteButton>

                <ActionExecuteButton
                  variant="primary"
                  disabled={!isBudgetValid || !isApproved || step === 'SUCCESS'}
                  isLoading={isLaunching}
                  loadingText="Launching Accumulator..."
                  onClick={handleLaunch}
                  className="w-full py-3"
                >
                  Step 2: Launch Accumulator
                </ActionExecuteButton>
              </div>

              {step === 'SUCCESS' && (
                <div className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 flex items-center gap-2 text-xs text-[#10B981] font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Strategy launched! Redirecting to Active Plans Desk...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
