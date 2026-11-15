'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PlanRowCard from '@/components/PlanRowCard';
import TroveCircuitBadge from '@/components/TroveCircuitBadge';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import { SAMPLE_PLANS, AccumulationPlan } from '@/lib/sampleData';
import { formatCurrency, formatBtc } from '@/lib/utils';
import Link from 'next/link';
import {
  Wallet,
  Bitcoin,
  TrendingUp,
  Percent,
  PlusCircle,
  Filter,
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const forceEmpty = searchParams.get('empty') === 'true';

  const [plans, setPlans] = useState<AccumulationPlan[]>(SAMPLE_PLANS);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ALL');
  const [isClaimingAll, setIsClaimingAll] = useState<boolean>(false);
  const [claimAllSuccess, setClaimAllSuccess] = useState<boolean>(false);

  // Filter plans based on state or ?empty=true
  const displayedPlans = forceEmpty
    ? []
    : filter === 'ALL'
    ? plans
    : plans.filter((p) => p.status === filter);

  // Portfolio Telemetry calculations
  const totalActiveMusdInVault = plans.reduce((acc, p) => acc + p.remainingMusd, 0);
  const totalStackedBtc = plans.reduce((acc, p) => acc + p.stackedBtc, 0);
  const totalYieldMusd = plans.reduce((acc, p) => acc + p.accruedYieldMusd, 0);
  const weightedEntryPrice = 94140; // Calculated average cost basis

  const handleExecuteTranche = (planId: number) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === planId) {
          const newRemaining = Math.max(0, p.remainingMusd - p.trancheSizeMusd);
          const newStacked = p.stackedBtc + p.trancheSizeMusd / 95420;
          return {
            ...p,
            remainingMusd: newRemaining,
            stackedBtc: newStacked,
            status: newRemaining === 0 ? 'COMPLETED' : p.status,
          };
        }
        return p;
      })
    );
  };

  const handleClaimBtc = (planId: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, stackedBtc: 0 } : p))
    );
  };

  const handleClaimAll = () => {
    setIsClaimingAll(true);
    setTimeout(() => {
      setIsClaimingAll(false);
      setClaimAllSuccess(true);
      setPlans((prev) => prev.map((p) => ({ ...p, stackedBtc: 0 })));
      setTimeout(() => setClaimAllSuccess(false), 3000);
    }, 1500);
  };

  return (
    <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
      {/* Top Banner: Trove ICR Safety Circuit Status */}
      <div className="p-4 rounded-xl bg-[#181D24] border border-[#262E3B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TroveCircuitBadge currentIcr={174.2} safetyFloorIcr={150} />
          <span className="text-xs text-[#8B95A5]">
            Liquidation buffer: <strong className="text-[#10B981] font-mono tabular-nums">+64.2%</strong> above 110% liquidation floor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0E1116] text-xs font-semibold transition-all cursor-pointer btn-press"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Plan</span>
          </Link>
        </div>
      </div>

      {/* Portfolio Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active MUSD in sMUSD */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Active MUSD in Vault</span>
            <Wallet className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#F0F4F8] tabular-nums" data-testid="metric-musd">
            ${formatCurrency(totalActiveMusdInVault)}
          </div>
          <span className="text-[11px] text-[#8B95A5]">
            Earning continuous sMUSD yield
          </span>
        </div>

        {/* Metric 2: Total Stacked BTC */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Stacked BTC</span>
            <Bitcoin className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#10B981] tabular-nums" data-testid="metric-btc">
            {formatBtc(totalStackedBtc)} BTC
          </div>
          <span className="text-[11px] text-[#8B95A5]">
            Accumulated via Tigris AMM
          </span>
        </div>

        {/* Metric 3: Weighted Avg Entry Price */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Weighted Entry Price</span>
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#F0F4F8] tabular-nums" data-testid="metric-entry">
            ${formatCurrency(weightedEntryPrice, 0)}
          </div>
          <span className="text-[11px] text-[#10B981] font-mono tabular-nums">
            -$1,280 vs live oracle ($95,420)
          </span>
        </div>

        {/* Metric 4: Total sMUSD Yield Offset */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Yield Offset</span>
            <Percent className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#10B981] tabular-nums" data-testid="metric-yield">
            +${formatCurrency(totalYieldMusd)}
          </div>
          <span className="text-[11px] text-[#8B95A5]">
            sMUSD interest earned on idle capital
          </span>
        </div>
      </div>

      {/* Plans Section Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[#F0F4F8]">
              Active Accumulation Plans
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#262E3B] text-xs font-mono text-[#F0F4F8] tabular-nums">
              {displayedPlans.length}
            </span>
          </div>

          {/* Filter Pills and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#181D24] border border-[#262E3B] rounded-lg p-1 text-xs font-mono">
              {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filter === mode
                      ? 'bg-[#262E3B] text-[#F59E0B] font-semibold'
                      : 'text-[#8B95A5] hover:text-[#F0F4F8]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {totalStackedBtc > 0 && (
              <ActionExecuteButton
                variant="secondary"
                isLoading={isClaimingAll}
                loadingText="Claiming All..."
                onClick={handleClaimAll}
                className="text-xs py-1.5 px-3"
              >
                Claim All BTC
              </ActionExecuteButton>
            )}
          </div>
        </div>

        {claimAllSuccess && (
          <div
            role="status"
            className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] font-mono"
          >
            Confirmed: Claimed all accumulated BTC to connected wallet!
          </div>
        )}

        {/* Plans List or Actionable Empty State */}
        {displayedPlans.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#262E3B] flex items-center justify-center text-[#8B95A5]">
              <Filter className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[#F0F4F8]">
                No active plans found
              </h3>
              <p className="text-xs text-[#8B95A5]">
                Configure an accumulation strategy in the Strategy Studio to automate your Bitcoin DCA.
              </p>
            </div>
            <div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#0E1116] text-xs font-bold transition-all cursor-pointer btn-press"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Plan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPlans.map((plan) => (
              <PlanRowCard
                key={plan.id}
                plan={plan}
                onExecuteTranche={handleExecuteTranche}
                onClaimBtc={handleClaimBtc}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0E1116]">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#8B95A5]">Loading Active Plans Desk...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
