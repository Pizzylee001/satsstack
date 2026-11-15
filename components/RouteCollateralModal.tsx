'use client';

import React, { useEffect, useState } from 'react';
import { zeroAddress } from 'viem';
import {
  ShieldCheck,
  ArrowRight,
  X,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatBtc, formatSats, truncateAddress } from '@/lib/utils';
import { CONTRACT_ADDRESSES, MEZO_EXPLORER_URL } from '@/lib/constants';
import { SATS_STACK_VAULT_ABI } from '@/lib/contracts';
import { formatContractError, mezoPublicClient } from '@/lib/mezoClient';
import { useWallet } from '@/lib/walletContext';
import type { TroveHealthInfo } from '@/lib/types';
import ActionExecuteButton from './ActionExecuteButton';

interface RouteCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: number;
  planOwner: `0x${string}`;
  stackedBtc: number;
  oracleBtcPrice: number;
  ownerTrove: TroveHealthInfo;
}

export default function RouteCollateralModal({
  isOpen,
  onClose,
  planId,
  planOwner,
  stackedBtc,
  oracleBtcPrice,
  ownerTrove,
}: RouteCollateralModalProps) {
  const { account, isConnected, openWalletModal, sendVaultTx } = useWallet();

  const [isCheckingSim, setIsCheckingSim] = useState(false);
  const [simNotice, setSimNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimingFallback, setIsClaimingFallback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const isOwner =
    Boolean(isConnected && account && account.toLowerCase() === planOwner.toLowerCase());

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
      setTxHash(null);
      setSimNotice(null);
      return;
    }

    let cancelled = false;
    setIsCheckingSim(true);
    setSimNotice(null);

    (async () => {
      try {
        await mezoPublicClient.simulateContract({
          address: CONTRACT_ADDRESSES.SatsStackVault,
          abi: SATS_STACK_VAULT_ABI as any,
          functionName: 'routeBtcToTrove',
          args: [BigInt(planId), zeroAddress, zeroAddress],
          account: planOwner,
        });
      } catch (err) {
        if (!cancelled) {
          const reason = formatContractError(err);
          setSimNotice(
            `Mezo BorrowerOperations pre-check reverted (${reason}). BorrowerOperations.addColl credits the caller address (SatsStackVault) rather than an external EOA Trove unless the Vault itself owns a Trove. Use Claim BTC below to withdraw ${formatBtc(stackedBtc)} BTC directly to your wallet and add collateral on app.mezo.org.`
          );
        }
      } finally {
        if (!cancelled) setIsCheckingSim(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, planId, planOwner, stackedBtc]);

  if (!isOpen) return null;

  const hasActiveTrove = ownerTrove.hasActiveTrove && ownerTrove.icrPercent !== null;
  const currentIcr = ownerTrove.icrPercent ?? 0;
  const projectedIcr =
    hasActiveTrove && ownerTrove.debtMusd > 0 && oracleBtcPrice > 0
      ? (((ownerTrove.collBtc + stackedBtc) * oracleBtcPrice) / ownerTrove.debtMusd) * 100
      : null;

  const handleRoute = async () => {
    setErrorMsg(null);
    setTxHash(null);

    if (!isConnected) {
      openWalletModal();
      return;
    }
    if (!isOwner) {
      setErrorMsg(`Connect plan owner wallet (${truncateAddress(planOwner)}) to execute.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const hash = await sendVaultTx(
        'routeBtcToTrove',
        [BigInt(planId), zeroAddress, zeroAddress],
        520000n
      );
      setTxHash(hash);
    } catch (err) {
      setErrorMsg(formatContractError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimInstead = async () => {
    setErrorMsg(null);
    setTxHash(null);

    if (!isConnected || !account) {
      openWalletModal();
      return;
    }
    if (!isOwner) {
      setErrorMsg(`Connect plan owner wallet (${truncateAddress(planOwner)}) to withdraw BTC.`);
      return;
    }

    try {
      setIsClaimingFallback(true);
      const hash = await sendVaultTx('claimBtc', [BigInt(planId), account], 220000n);
      setTxHash(hash);
    } catch (err) {
      setErrorMsg(formatContractError(err));
    } finally {
      setIsClaimingFallback(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl bg-[#181D24] border border-[#3B4556] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#262E3B] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-title" className="font-heading text-lg font-bold text-[#F0F4F8]">
                Route Stacked BTC to My Trove
              </h2>
              <p className="text-xs text-[#8B95A5]">
                Invokes SatsStackVault.routeBtcToTrove -&gt; BorrowerOperations.addColl()
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#262E3B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#0E1116] border border-[#262E3B] space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Stacked BTC in Plan #{planId}:</span>
              <span className="font-mono text-sm font-bold text-[#10B981] tabular-nums">
                {formatBtc(stackedBtc)} BTC ({formatSats(stackedBtc)} sats)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Owner Trove Status:</span>
              <span className="font-mono text-sm font-semibold text-[#F0F4F8] tabular-nums">
                {hasActiveTrove ? `${currentIcr.toFixed(1)}% ICR` : 'No Active Trove'}
              </span>
            </div>
            <div className="border-t border-[#262E3B] pt-2.5 flex justify-between items-center text-xs">
              <span className="text-[#8B95A5]">Projected Trove ICR:</span>
              {hasActiveTrove && projectedIcr !== null ? (
                <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#10B981] tabular-nums">
                  <span>{currentIcr.toFixed(1)}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8B95A5]" aria-hidden="true" />
                  <span className="text-[#F59E0B]">{projectedIcr.toFixed(1)}%</span>
                </div>
              ) : (
                <span className="font-mono text-xs text-[#8B95A5]">
                  Open a Trove on Mezo to measure ICR gain
                </span>
              )}
            </div>
          </div>

          {isCheckingSim && (
            <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono text-[#8B95A5]">
              Simulating BorrowerOperations.addColl() on Mezo Testnet...
            </div>
          )}

          {simNotice && (
            <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-xs text-[#F59E0B] space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{simNotice}</span>
              </div>
              {isOwner && stackedBtc > 0 && (
                <ActionExecuteButton
                  variant="secondary"
                  isLoading={isClaimingFallback}
                  loadingText="Withdrawing BTC..."
                  onClick={handleClaimInstead}
                  className="text-xs py-1.5 px-3"
                >
                  Claim {formatBtc(stackedBtc)} BTC to Wallet Instead
                </ActionExecuteButton>
              )}
            </div>
          )}

          {!isOwner && (
            <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono text-[#8B95A5]">
              Owner-only action: connect {truncateAddress(planOwner)} to sign this route or withdraw BTC.
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {txHash && (
            <div
              role="status"
              className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] font-mono flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                Transaction confirmed!
              </span>
              <a
                href={`${MEZO_EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                <span>View Tx</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#262E3B] pt-4">
          <ActionExecuteButton
            variant="secondary"
            disabled={isSubmitting || isClaimingFallback}
            onClick={onClose}
          >
            Cancel
          </ActionExecuteButton>
          <ActionExecuteButton
            variant="primary"
            disabled={isConnected && !isOwner}
            isLoading={isSubmitting}
            loadingText="Routing to Trove..."
            onClick={handleRoute}
          >
            {isConnected ? 'Confirm Route' : 'Connect Wallet to Route'}
          </ActionExecuteButton>
        </div>
      </div>
    </div>
  );
}
