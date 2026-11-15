'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface TroveCircuitBadgeProps {
  currentIcr: number | null;
  hasActiveTrove?: boolean;
  safetyFloorIcr: number;
  isPaused?: boolean;
}

export default function TroveCircuitBadge({
  currentIcr,
  hasActiveTrove = currentIcr !== null,
  safetyFloorIcr,
  isPaused = false,
}: TroveCircuitBadgeProps) {
  const isDanger = hasActiveTrove && currentIcr !== null && currentIcr <= 120;
  const isAutoPaused =
    isPaused || (hasActiveTrove && currentIcr !== null && currentIcr < safetyFloorIcr);

  let statusText = 'HEALTHY READY';
  let badgeClasses = 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
  let Icon = ShieldCheck;

  if (!hasActiveTrove || currentIcr === null) {
    statusText = 'SAFETY ARMED';
    badgeClasses = 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
    Icon = ShieldCheck;
  } else if (isDanger) {
    statusText = 'CRITICAL DANGER';
    badgeClasses = 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40';
    Icon = ShieldAlert;
  } else if (isAutoPaused) {
    statusText = 'CIRCUIT AUTO_PAUSED';
    badgeClasses = 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40';
    Icon = Shield;
  }

  return (
    <div
      data-testid="trove-circuit-badge"
      className={`inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold ${badgeClasses}`}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="tracking-wide">{statusText}</span>
      <span className="text-[#8B95A5] text-[11px] font-normal tabular-nums">
        {hasActiveTrove && currentIcr !== null
          ? `Trove ICR: ${currentIcr.toFixed(1)}% (Floor: ${safetyFloorIcr}%)`
          : `No Active Trove (Floor: ${safetyFloorIcr}%)`}
      </span>
    </div>
  );
}
