'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface TroveCircuitBadgeProps {
  currentIcr: number;
  safetyFloorIcr: number;
  isPaused?: boolean;
}

export default function TroveCircuitBadge({
  currentIcr,
  safetyFloorIcr,
  isPaused = false,
}: TroveCircuitBadgeProps) {
  const isDanger = currentIcr <= 120;
  const isAutoPaused = currentIcr < safetyFloorIcr || isPaused;

  let statusText = 'HEALTHY READY';
  let badgeClasses = 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
  let Icon = ShieldCheck;

  if (isDanger) {
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold ${badgeClasses}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="tracking-wide">{statusText}</span>
      <span className="text-muted text-[11px] font-normal tabular-nums">
        ICR: {currentIcr.toFixed(1)}% (Floor: {safetyFloorIcr}%)
      </span>
    </div>
  );
}
