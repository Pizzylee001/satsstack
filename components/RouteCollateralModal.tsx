'use client';

import React, { useState } from 'react';
import { formatBtc } from '@/lib/utils';
import ActionExecuteButton from './ActionExecuteButton';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

interface RouteCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  stackedBtc: number;
  currentIcr: number;
  onConfirm: () => void;
}

export default function RouteCollateralModal({
  isOpen,
  onClose,
  stackedBtc,
  currentIcr,
  onConfirm,
}: RouteCollateralModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  // Approximate ICR increase: each 0.01 BTC at 95k adds ~$950 collateral
  // On a $96k debt, $950 is ~+0.98% ICR
  const projectedIcr = currentIcr + Number((stackedBtc * 95000 / 96420 * 100).toFixed(1));

  const handleRoute = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsCompleted(true);
      setTimeout(() => {
        onConfirm();
        setIsCompleted(false);
        onClose();
      }, 1000);
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#181D24] border border-[#262E3B] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262E3B] pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="font-['Space_Grotesk'] text-lg font-bold text-[#F0F4F8]">
                Route Stacked BTC to My Trove
              </h2>
              <p className="text-xs text-[#8B95A5]">
                Atomic collateral injection via BorrowerOperations.addColl
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#262E3B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0E1116] border border-[#262E3B] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Stacked BTC to Route:</span>
              <span className="font-mono text-sm font-bold text-[#10B981] tabular-nums">
                {formatBtc(stackedBtc)} BTC
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Current Trove ICR:</span>
              <span className="font-mono text-sm font-semibold text-[#F0F4F8] tabular-nums">
                {currentIcr.toFixed(1)}%
              </span>
            </div>
            <div className="border-t border-[#262E3B] pt-2 flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Projected Trove ICR:</span>
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#10B981] tabular-nums">
                <span>{currentIcr.toFixed(1)}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B95A5]" />
                <span className="text-[#F59E0B]">{projectedIcr.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#8B95A5] leading-relaxed">
            This operation will withdraw {formatBtc(stackedBtc)} BTC from your SatsStackVault position
            and invoke <code className="text-[#F59E0B] bg-[#0E1116] px-1 py-0.5 rounded">BorrowerOperations.addColl()</code>
            to bolster your Mezo Trove collateral ratio.
          </p>

          {isCompleted && (
            <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-mono text-center">
              Collateral successfully routed to Mezo Trove!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#262E3B] pt-4">
          <ActionExecuteButton
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </ActionExecuteButton>
          <ActionExecuteButton
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Routing to Trove..."
            onClick={handleRoute}
          >
            Confirm Route
          </ActionExecuteButton>
        </div>
      </div>
    </div>
  );
}
