'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OnChainPlan } from '@/lib/types';
import {
  formatCurrency,
  formatBtc,
  formatSats,
  formatDuration,
  truncateAddress,
} from '@/lib/utils';
import ActionExecuteButton from './ActionExecuteButton';
import { Clock, ChevronRight, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PlanRowCardProps {
  plan: OnChainPlan;
  isOwner: boolean;
  yieldOffsetMusd?: number;
  onExecuteTranche: (planId: number) => Promise<void>;
  onClaimBtc: (planId: number) => Promise<void>;
  isExecuting?: boolean;
  isClaiming?: boolean;
}

export default function PlanRowCard({
  plan,
  isOwner,
  yieldOffsetMusd = 0,
  onExecuteTranche,
  onClaimBtc,
  isExecuting = false,
  isClaiming = false,
}: PlanRowCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    Math.max(0, plan.nextExecutionTime - Math.floor(Date.now() / 1000))
  );

  useEffect(() => {
    const syncRemaining = () => {
      setRemainingSeconds(
        Math.max(0, plan.nextExecutionTime - Math.floor(Date.now() / 1000))
      );
    };
    syncRemaining();

    if (plan.status !== 'ACTIVE') return;
    const interval = setInterval(syncRemaining, 1000);
    return () => clearInterval(interval);
  }, [plan.status, plan.nextExecutionTime]);

  const spentMusd = Math.max(0, plan.totalBudgetMusd - plan.remainingMusd);
  const progressPercent =
    plan.totalBudgetMusd > 0
      ? Math.min(100, Math.round((spentMusd / plan.totalBudgetMusd) * 100))
      : 0;

  const isDue = plan.status === 'ACTIVE' && plan.remainingMusd > 0 && remainingSeconds === 0;
  const troveUnsafe =
    plan.ownerTrove.hasActiveTrove &&
    plan.ownerTrove.icrPercent !== null &&
    plan.ownerTrove.icrPercent < plan.troveSafeFloorIcr;

  return (
    <div
      data-testid={`plan-row-${plan.id}`}
      className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] hover:border-[#374254] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
    >
      {/* Left: On-Chain Info and Progress */}
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-heading font-bold text-base text-[#F0F4F8]">
            Plan #{plan.id}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
              plan.status === 'ACTIVE'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : plan.status === 'PAUSED'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                : 'bg-[#5A6474]/20 text-[#8B95A5] border border-[#5A6474]/30'
            }`}
          >
            {plan.status}
          </span>
          {isOwner ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
              Your Plan
            </span>
          ) : (
            <span className="text-[11px] font-mono text-[#8B95A5]">
              Owner: {truncateAddress(plan.owner)}
            </span>
          )}
          <span className="text-[11px] font-mono text-[#8B95A5]">
            Cadence: {formatDuration(plan.intervalSeconds)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1.5">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-[#8B95A5]">
            <span className="tabular-nums">
              Deployed: ${formatCurrency(spentMusd)} / ${formatCurrency(plan.totalBudgetMusd)} MUSD ({plan.executedTranches}/{plan.totalTranches} tranches)
            </span>
            <span className="font-mono text-[#F0F4F8] tabular-nums">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#0E1116] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Live Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[#8B95A5]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">Stacked:</span>
            <span className="text-[#10B981] font-semibold tabular-nums">
              {formatBtc(plan.stackedBtc)} BTC ({formatSats(plan.stackedBtc)} sats)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">Tranche:</span>
            <span className="text-[#F0F4F8] tabular-nums">
              ${formatCurrency(plan.trancheSizeMusd)} MUSD
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">In sMUSD:</span>
            <span className="text-[#F0F4F8] tabular-nums">
              ${formatCurrency(plan.proRataSmusdShareMusd)}
              {yieldOffsetMusd > 0 ? ` (+$${formatCurrency(yieldOffsetMusd)} yield)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {troveUnsafe ? (
              <ShieldAlert className="w-3.5 h-3.5 text-[#EF4444]" aria-hidden="true" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
            )}
            <span className={troveUnsafe ? 'text-[#EF4444]' : 'text-[#8B95A5]'}>
              Floor: {plan.troveSafeFloorIcr}%
              {plan.ownerTrove.hasActiveTrove && plan.ownerTrove.icrPercent !== null
                ? ` (ICR ${plan.ownerTrove.icrPercent.toFixed(1)}%)`
                : ' (No Trove)'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls and Real Countdown Timer */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#262E3B] shrink-0">
        <div
          data-testid="timer"
          className="min-h-10 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono text-[#F0F4F8] shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
          <span className="tabular-nums">
            {plan.status === 'ACTIVE'
              ? isDue
                ? 'Due Now'
                : `${formatDuration(remainingSeconds)} remaining`
              : plan.status === 'PAUSED'
              ? 'Paused'
              : plan.status === 'CANCELLED'
              ? 'Cancelled'
              : 'Complete'}
          </span>
        </div>

        {plan.status === 'ACTIVE' && plan.remainingMusd > 0 && (
          <ActionExecuteButton
            variant="primary"
            isLoading={isExecuting}
            disabled={!isDue || troveUnsafe}
            loadingText="Signing Tx..."
            onClick={() => onExecuteTranche(plan.id)}
            title={
              troveUnsafe
                ? `Blocked by safety circuit: ICR below ${plan.troveSafeFloorIcr}% floor`
                : !isDue
                ? `Next tranche unlocks in ${formatDuration(remainingSeconds)}`
                : 'Execute due Tigris AMM swap for this plan'
            }
            className="text-xs min-h-11 sm:min-h-10 py-2 px-3 shrink-0"
          >
            Execute Due Tranche
          </ActionExecuteButton>
        )}

        {plan.stackedBtc > 0 && (
          <ActionExecuteButton
            variant="secondary"
            isLoading={isClaiming}
            loadingText="Claiming..."
            onClick={() => onClaimBtc(plan.id)}
            title={
              isOwner
                ? 'Withdraw accumulated BTC to connected wallet'
                : `Owned by ${truncateAddress(plan.owner)}`
            }
            className="text-xs min-h-11 sm:min-h-10 py-2 px-3 shrink-0"
          >
            Claim BTC
          </ActionExecuteButton>
        )}

        <Link
          href={`/plan/${plan.id}`}
          className="min-h-11 min-w-11 sm:min-h-10 sm:min-w-10 inline-flex items-center justify-center p-2 rounded-lg bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8] transition-colors shrink-0"
          title={`Open Plan #${plan.id} Ledger`}
          aria-label={`View Plan #${plan.id}`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
