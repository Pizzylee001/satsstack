'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AccumulationPlan } from '@/lib/sampleData';
import { formatCurrency, formatBtc, formatDuration } from '@/lib/utils';
import ActionExecuteButton from './ActionExecuteButton';
import { Clock, Play, Pause, ChevronRight } from 'lucide-react';

interface PlanRowCardProps {
  plan: AccumulationPlan;
  onExecuteTranche?: (planId: number) => void;
  onClaimBtc?: (planId: number) => void;
}

export default function PlanRowCard({
  plan,
  onExecuteTranche,
  onClaimBtc,
}: PlanRowCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.max(0, plan.nextExecutionTime - Math.floor(Date.now() / 1000))
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (plan.status !== 'ACTIVE' || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [plan.status, remainingSeconds]);

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setRemainingSeconds(plan.intervalSeconds);
      if (onExecuteTranche) onExecuteTranche(plan.id);
    }, 1200);
  };

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      if (onClaimBtc) onClaimBtc(plan.id);
    }, 1200);
  };

  const progressPercent = Math.min(
    100,
    Math.round(((plan.totalBudgetMusd - plan.remainingMusd) / plan.totalBudgetMusd) * 100)
  );

  return (
    <div
      data-testid={`plan-row-${plan.id}`}
      className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] hover:border-[#374254] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
    >
      {/* Left: Info and Progress */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-['Space_Grotesk'] font-bold text-base text-[#F0F4F8]">
            Plan #{plan.id}
          </span>
          <span className="text-sm font-medium text-[#8B95A5]">{plan.name}</span>
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
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-xs text-[#8B95A5]">
            <span>
              Budget: ${formatCurrency(plan.totalBudgetMusd - plan.remainingMusd)} / ${formatCurrency(plan.totalBudgetMusd)} MUSD
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

        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8B95A5]">
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">Stacked:</span>
            <span className="text-[#F0F4F8] font-semibold tabular-nums">
              {formatBtc(plan.stackedBtc)} BTC
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">Tranche:</span>
            <span className="text-[#F0F4F8] tabular-nums">${plan.trancheSizeMusd} MUSD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#5A6474]">sMUSD Yield:</span>
            <span className="text-[#10B981] font-semibold tabular-nums">
              +${formatCurrency(plan.accruedYieldMusd)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Operational Controls and Timer */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#262E3B]">
        {/* Interval Countdown */}
        <div
          data-testid="timer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono text-[#F0F4F8] shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="tabular-nums">
            {plan.status === 'ACTIVE'
              ? remainingSeconds === 0
                ? 'Due Now'
                : `${formatDuration(remainingSeconds)} remaining`
              : plan.status === 'PAUSED'
              ? 'Paused'
              : 'Complete'}
          </span>
        </div>

        {/* Operational Trigger */}
        {plan.status === 'ACTIVE' && (
          <ActionExecuteButton
            variant="primary"
            isLoading={isExecuting}
            loadingText="Executing..."
            onClick={handleExecute}
            className="text-xs py-2 px-3 shrink-0"
          >
            Execute Due Tranche
          </ActionExecuteButton>
        )}

        {plan.stackedBtc > 0 && (
          <ActionExecuteButton
            variant="secondary"
            isLoading={isClaiming}
            loadingText="Claiming..."
            onClick={handleClaim}
            className="text-xs py-2 px-3 shrink-0"
          >
            Claim BTC
          </ActionExecuteButton>
        )}

        {/* Link to detail page */}
        <Link
          href={`/plan/${plan.id}`}
          className="inline-flex items-center justify-center p-2 rounded-lg bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8] transition-colors"
          title="View Plan Ledger"
          aria-label={`View Plan #${plan.id}`}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
