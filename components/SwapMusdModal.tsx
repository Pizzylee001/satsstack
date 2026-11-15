'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, X, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatEther, parseEther } from 'viem';
import { useWallet } from '@/lib/walletContext';
import { MEZO_EXPLORER_URL } from '@/lib/constants';
import { formatBtc, formatCurrency } from '@/lib/utils';
import { formatContractError, getTigrisSwapQuote } from '@/lib/mezoClient';
import ActionExecuteButton from './ActionExecuteButton';

export default function SwapMusdModal() {
  const {
    isConnected,
    isSwapModalOpen,
    closeSwapModal,
    openWalletModal,
    walletBalances,
    sendSwapBtcToMusd,
  } = useWallet();

  const [btcAmountStr, setBtcAmountStr] = useState('0.001');
  const [quotedMusd, setQuotedMusd] = useState<number>(0);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isSwapModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSwapModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSwapModalOpen, closeSwapModal]);

  useEffect(() => {
    if (!isSwapModalOpen) return;
    const num = Number(btcAmountStr);
    if (!Number.isFinite(num) || num <= 0) {
      setQuotedMusd(0);
      return;
    }

    let cancelled = false;
    setIsQuoting(true);
    (async () => {
      try {
        const wei = parseEther(btcAmountStr);
        const out = await getTigrisSwapQuote(wei, 'BTC_TO_MUSD');
        if (!cancelled) setQuotedMusd(Number(formatEther(out)));
      } catch {
        if (!cancelled) setQuotedMusd(0);
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [btcAmountStr, isSwapModalOpen]);

  if (!isSwapModalOpen) return null;

  const btcNum = Number(btcAmountStr);
  const isValid = Number.isFinite(btcNum) && btcNum > 0;
  const hasEnoughBtc = walletBalances ? btcNum <= walletBalances.btcBalance : true;

  const handleSwap = async () => {
    setErrorMsg(null);
    setTxHash(null);

    if (!isConnected) {
      openWalletModal();
      return;
    }

    try {
      setIsSwapping(true);
      const amountIn = parseEther(btcAmountStr);
      const minOut = parseEther((quotedMusd * 0.98).toFixed(6));
      const hash = await sendSwapBtcToMusd(amountIn, minOut);
      setTxHash(hash);
    } catch (err) {
      setErrorMsg(formatContractError(err));
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSwapModal();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#181D24] border border-[#3B4556] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#262E3B] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
              <ArrowRightLeft className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="swap-modal-title"
                className="font-['Space_Grotesk'] text-lg font-bold text-[#F0F4F8]"
              >
                Acquire Testnet MUSD
              </h2>
              <p className="text-xs text-[#8B95A5]">
                Swap Testnet BTC into MUSD via Tigris AMM Pool
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSwapModal}
            aria-label="Close swap dialog"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#262E3B] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <label htmlFor="swap-btc-input">Spend Testnet BTC</label>
            <span className="font-mono tabular-nums">
              Available:{' '}
              {walletBalances ? `${formatBtc(walletBalances.btcBalance)} BTC` : 'Connect wallet'}
            </span>
          </div>
          <input
            id="swap-btc-input"
            type="number"
            step="0.0005"
            min="0"
            value={btcAmountStr}
            onChange={(e) => {
              setBtcAmountStr(e.target.value);
              setErrorMsg(null);
              setTxHash(null);
            }}
            className="w-full bg-[#0E1116] border border-[#262E3B] rounded-lg px-3 py-2.5 text-sm font-mono text-[#F0F4F8] tabular-nums"
          />

          <div className="flex flex-wrap gap-2">
            {['0.0005', '0.001', '0.005'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setBtcAmountStr(preset);
                  setErrorMsg(null);
                  setTxHash(null);
                }}
                className="px-2.5 py-1 rounded-md bg-[#0E1116] border border-[#262E3B] hover:border-[#F59E0B] text-xs font-mono text-[#F0F4F8] cursor-pointer"
              >
                {preset} BTC
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#0E1116] border border-[#262E3B] flex items-center justify-between text-xs font-mono">
            <span className="text-[#8B95A5]">Estimated Output:</span>
            <span className="text-[#10B981] font-bold tabular-nums">
              {isQuoting ? 'Quoting...' : `~${formatCurrency(quotedMusd)} MUSD`}
            </span>
          </div>

          {!hasEnoughBtc && (
            <p className="text-xs text-[#EF4444]">
              Input exceeds connected wallet BTC balance. Claim gas tokens at faucet.test.mezo.org first.
            </p>
          )}
        </div>

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
              MUSD received!
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

        <div className="flex justify-end gap-3 pt-2 border-t border-[#262E3B]">
          <ActionExecuteButton variant="secondary" onClick={closeSwapModal}>
            Close
          </ActionExecuteButton>
          <ActionExecuteButton
            variant="primary"
            disabled={isConnected ? !isValid || !hasEnoughBtc || isQuoting || quotedMusd <= 0 : false}
            isLoading={isSwapping}
            loadingText="Swapping..."
            onClick={handleSwap}
          >
            {isConnected ? 'Swap BTC to MUSD' : 'Connect Wallet to Swap'}
          </ActionExecuteButton>
        </div>
      </div>
    </div>
  );
}
