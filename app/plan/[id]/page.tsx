'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PositionLedgerTable from '@/components/PositionLedgerTable';
import RouteCollateralModal from '@/components/RouteCollateralModal';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import { SAMPLE_PLANS, AccumulationPlan } from '@/lib/sampleData';
import { formatCurrency, formatBtc, truncateAddress } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Play,
  Pause,
  AlertOctagon,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idStr = params?.id as string;
  const planId = parseInt(idStr, 10);

  const initialPlan = SAMPLE_PLANS.find((p) => p.id === planId);
  const [plan, setPlan] = useState<AccumulationPlan | undefined>(initialPlan);

  // Modals state
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Top Up & Action states
  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // If plan not found
  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0E1116]">
        <Navbar />
        <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col items-center justify-center space-y-4">
          <div className="p-12 text-center rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4 max-w-md">
            <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[#F0F4F8]">
              Plan #{idStr} Not Found
            </h2>
            <p className="text-xs text-[#8B95A5]">
              No active or historical accumulation plan exists with this identifier.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#0E1116] text-xs font-bold btn-press"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleTogglePause = () => {
    setIsActionLoading(true);
    setTimeout(() => {
      setIsActionLoading(false);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
            }
          : undefined
      );
    }, 1000);
  };

  const handleTopUpConfirm = () => {
    if (topUpAmount <= 0) return;
    setIsActionLoading(true);
    setTimeout(() => {
      setIsActionLoading(false);
      setIsTopUpModalOpen(false);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              totalBudgetMusd: prev.totalBudgetMusd + topUpAmount,
              remainingMusd: prev.remainingMusd + topUpAmount,
            }
          : undefined
      );
    }, 1000);
  };

  const handleCancelAndWithdraw = () => {
    setIsActionLoading(true);
    setTimeout(() => {
      setIsActionLoading(false);
      setIsCancelModalOpen(false);
      router.push('/dashboard');
    }, 1200);
  };

  const handleRouteConfirm = () => {
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            stackedBtc: 0,
            borrowerCurrentIcr: prev.borrowerCurrentIcr + 1.2,
          }
        : undefined
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0E1116]">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8B95A5] hover:text-[#F0F4F8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="font-mono text-xs text-[#5A6474]">
            Created {plan.createdAt}
          </div>
        </div>

        {/* Plan Header */}
        <div className="p-6 rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-[#F0F4F8]">
                  Plan #{plan.id}: Position Ledger
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider ${
                    plan.status === 'ACTIVE'
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      : plan.status === 'PAUSED'
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#5A6474]/20 text-[#8B95A5] border border-[#5A6474]/30'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <p className="text-xs text-[#8B95A5] break-all">
                Owner: <span className="font-mono text-[#F0F4F8]">{plan.owner}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <ActionExecuteButton
                variant="secondary"
                onClick={() => setIsTopUpModalOpen(true)}
                className="text-xs py-2 px-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Top Up MUSD</span>
              </ActionExecuteButton>

              <ActionExecuteButton
                variant="secondary"
                isLoading={isActionLoading}
                onClick={handleTogglePause}
                className="text-xs py-2 px-3"
              >
                {plan.status === 'ACTIVE' ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" />
                    <span>Pause Plan</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
                    <span>Resume Plan</span>
                  </>
                )}
              </ActionExecuteButton>

              <ActionExecuteButton
                variant="danger"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs py-2 px-3"
              >
                <AlertOctagon className="w-3.5 h-3.5 mr-1" />
                <span>Cancel & Withdraw</span>
              </ActionExecuteButton>

              <ActionExecuteButton
                variant="primary"
                onClick={() => setIsRouteModalOpen(true)}
                disabled={plan.stackedBtc <= 0}
                className="text-xs py-2 px-3"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                <span>Route Stacked BTC to My Trove</span>
              </ActionExecuteButton>
            </div>
          </div>

          {/* Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#262E3B] font-mono">
            <div>
              <span className="text-[11px] text-[#8B95A5] block">Total Budget:</span>
              <span className="text-base font-bold text-[#F0F4F8] tabular-nums">
                ${formatCurrency(plan.totalBudgetMusd)} MUSD
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#8B95A5] block">Remaining in sMUSD:</span>
              <span className="text-base font-bold text-[#F0F4F8] tabular-nums">
                ${formatCurrency(plan.remainingMusd)} MUSD
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#8B95A5] block">Stacked BTC:</span>
              <span className="text-base font-bold text-[#10B981] tabular-nums">
                {formatBtc(plan.stackedBtc)} BTC
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#8B95A5] block">Accrued Yield:</span>
              <span className="text-base font-bold text-[#10B981] tabular-nums">
                +${formatCurrency(plan.accruedYieldMusd)} MUSD
              </span>
            </div>
          </div>
        </div>

        {/* Cost Basis & Trove Safety Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Basis vs Live Oracle */}
          <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
            <h2 className="font-['Space_Grotesk'] text-sm font-bold text-[#F0F4F8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Cost Basis Comparison</span>
            </h2>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Weighted Average Entry:</span>
              <span className="text-sm font-bold text-[#F0F4F8] tabular-nums">
                ${formatCurrency(plan.weightedAvgEntryPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Live Oracle BTC Price:</span>
              <span className="text-sm font-bold text-[#F0F4F8] tabular-nums">
                ${formatCurrency(plan.liveOracleBtcPrice)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs font-mono text-[#10B981] flex justify-between items-center">
              <span>Performance Alpha:</span>
              <span className="font-bold tabular-nums">
                +{(
                  ((plan.liveOracleBtcPrice - plan.weightedAvgEntryPrice) /
                    plan.weightedAvgEntryPrice) *
                  100
                ).toFixed(2)}
                % vs Spot
              </span>
            </div>
          </div>

          {/* Trove ICR Safety Circuit Telemetry */}
          <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
            <h2 className="font-['Space_Grotesk'] text-sm font-bold text-[#F0F4F8] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Trove Collateral Safety Circuit</span>
            </h2>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Borrower Current ICR:</span>
              <span className="text-sm font-bold text-[#10B981] tabular-nums">
                {plan.borrowerCurrentIcr.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Auto Pause Floor:</span>
              <span className="text-sm font-bold text-[#F59E0B] tabular-nums">
                {plan.troveSafeFloorIcr}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono text-[#8B95A5] flex justify-between items-center">
              <span>Liquidation Threshold:</span>
              <span className="text-[#EF4444] font-bold tabular-nums">110.0% ICR</span>
            </div>
          </div>
        </div>

        {/* Fill History Ledger Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-[#F0F4F8]">
              Execution Fill History
            </h2>
            <span className="text-xs font-mono text-[#8B95A5]">
              {plan.fills.length} tranches executed via Tigris
            </span>
          </div>
          <PositionLedgerTable fills={plan.fills} />
        </div>
      </main>

      {/* Modal 1: Route Stacked BTC to My Trove */}
      <RouteCollateralModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        stackedBtc={plan.stackedBtc}
        currentIcr={plan.borrowerCurrentIcr}
        onConfirm={handleRouteConfirm}
      />

      {/* Modal 2: Top Up MUSD Modal */}
      {isTopUpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#181D24] border border-[#262E3B] p-6 space-y-4">
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-[#F0F4F8]">
              Top Up MUSD Budget
            </h2>
            <p className="text-xs text-[#8B95A5]">
              Add additional MUSD funds to extend this accumulation strategy.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-[#8B95A5]">Top Up Amount (MUSD)</label>
              <input
                type="number"
                value={topUpAmount || ''}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="Enter MUSD amount"
                className="w-full bg-[#0E1116] border border-[#262E3B] rounded-lg px-3 py-2 text-sm font-mono text-[#F0F4F8] tabular-nums focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <ActionExecuteButton
                variant="secondary"
                onClick={() => setIsTopUpModalOpen(false)}
              >
                Cancel
              </ActionExecuteButton>
              <ActionExecuteButton
                variant="primary"
                isLoading={isActionLoading}
                loadingText="Adding Funds..."
                onClick={handleTopUpConfirm}
              >
                Confirm Top Up
              </ActionExecuteButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Cancel & Withdraw Modal */}
      {isCancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#181D24] border border-[#262E3B] p-6 space-y-4">
            <h2 className="font-['Space_Grotesk'] text-lg font-bold text-[#EF4444] flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              <span>Cancel Plan & Withdraw</span>
            </h2>
            <p className="text-xs text-[#8B95A5]">
              This will atomically unwrap unspent sMUSD back to MUSD and return all accumulated BTC.
            </p>
            <div className="p-3.5 rounded-xl bg-[#0E1116] border border-[#262E3B] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#8B95A5]">Unspent MUSD returned:</span>
                <span className="text-[#F0F4F8] font-bold tabular-nums">
                  ${formatCurrency(plan.remainingMusd)} MUSD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B95A5]">Accumulated BTC returned:</span>
                <span className="text-[#10B981] font-bold tabular-nums">
                  {formatBtc(plan.stackedBtc)} BTC
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <ActionExecuteButton
                variant="secondary"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Cancel
              </ActionExecuteButton>
              <ActionExecuteButton
                variant="danger"
                isLoading={isActionLoading}
                loadingText="Withdrawing..."
                onClick={handleCancelAndWithdraw}
              >
                Confirm Cancel & Withdraw
              </ActionExecuteButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
