'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { decodeEventLog, formatEther, parseEther } from 'viem';
import Navbar from '@/components/Navbar';
import DcaParameterSlider from '@/components/DcaParameterSlider';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import {
  CONTRACT_ADDRESSES,
  INTERVAL_PRESETS,
  MEZO_EXPLORER_URL,
  MEZO_FAUCET_URL,
  SLIPPAGE_PRESETS,
} from '@/lib/constants';
import { SATS_STACK_VAULT_ABI } from '@/lib/contracts';
import {
  formatContractError,
  getTigrisSwapQuote,
  mezoPublicClient,
} from '@/lib/mezoClient';
import { formatCurrency, formatBtc, truncateAddress } from '@/lib/utils';
import { useWallet } from '@/lib/walletContext';
import {
  ArrowRight,
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowRightLeft,
  Droplets,
  Wallet,
} from 'lucide-react';

export default function CreatePlanPage() {
  const {
    account,
    isConnected,
    walletBalances,
    telemetry,
    openWalletModal,
    openSwapModal,
    sendApproveMusd,
    sendVaultTx,
  } = useWallet();

  // Testnet-friendly defaults while supporting large allocations
  const [budgetMusd, setBudgetMusd] = useState<number>(100);
  const [trancheSizeMusd, setTrancheSizeMusd] = useState<number>(25);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(60);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [troveSafeFloorIcr, setTroveSafeFloorIcr] = useState<number>(150);

  // Live Tigris AMM quote
  const [quotedBtcOut, setQuotedBtcOut] = useState<number | null>(null);
  const [isQuoting, setIsQuoting] = useState<boolean>(false);

  // On-chain transaction workflow state
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | null>(null);
  const [launchTxHash, setLaunchTxHash] = useState<`0x${string}` | null>(null);
  const [createdPlanId, setCreatedPlanId] = useState<number | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const isBudgetValid = Number.isFinite(budgetMusd) && budgetMusd > 0;
  const isTrancheValid =
    Number.isFinite(trancheSizeMusd) &&
    trancheSizeMusd > 0 &&
    trancheSizeMusd <= budgetMusd;
  const isExtremeBudget = budgetMusd >= 1000000;
  const trancheCount = isBudgetValid
    ? Math.max(1, Math.ceil(budgetMusd / Math.max(1, trancheSizeMusd)))
    : 0;

  let budgetWei = 0n;
  let trancheWei = 0n;
  if (isBudgetValid) {
    try {
      budgetWei = parseEther(budgetMusd.toFixed(6));
    } catch {
      budgetWei = 0n;
    }
  }
  if (isTrancheValid) {
    try {
      trancheWei = parseEther(trancheSizeMusd.toFixed(6));
    } catch {
      trancheWei = 0n;
    }
  }

  const hasEnoughMusd =
    !isConnected || !walletBalances ? true : walletBalances.musdBalanceWei >= budgetWei;

  const isApprovedOnChain = Boolean(
    isConnected &&
      walletBalances &&
      budgetWei > 0n &&
      walletBalances.musdAllowanceWei >= budgetWei
  );

  // Debounced live Tigris Router quote
  useEffect(() => {
    if (!isBudgetValid) {
      setQuotedBtcOut(0);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsQuoting(true);
        const amountWei = parseEther(Math.min(budgetMusd, 100000).toFixed(4));
        const btcWei = await getTigrisSwapQuote(amountWei, 'MUSD_TO_BTC');
        const sampleBtc = Number(formatEther(btcWei));
        const scaledBtc =
          budgetMusd > 100000 ? sampleBtc * (budgetMusd / 100000) : sampleBtc;
        if (!cancelled) setQuotedBtcOut(scaledBtc);
      } catch {
        if (!cancelled) {
          setQuotedBtcOut(null);
        }
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [budgetMusd, isBudgetValid]);

  const fallbackRate = telemetry?.tigrisSpotPrice || telemetry?.oracleBtcPrice || 0;
  const estimatedBtcOutput =
    quotedBtcOut !== null
      ? quotedBtcOut
      : fallbackRate > 0 && isBudgetValid
      ? budgetMusd / fallbackRate
      : 0;

  const isHighSlippage = Number(customSlippage) > 5 || slippageTolerance > 5;
  const isIcrDangerous = troveSafeFloorIcr <= 120;

  const handleApprove = async () => {
    setTxError(null);
    setApproveTxHash(null);

    if (!isConnected) {
      openWalletModal();
      return;
    }
    if (!isBudgetValid || budgetWei <= 0n) {
      setTxError('Enter a valid MUSD budget greater than 0.');
      return;
    }

    try {
      setIsApproving(true);
      const hash = await sendApproveMusd(budgetWei);
      setApproveTxHash(hash);
    } catch (err) {
      setTxError(formatContractError(err));
    } finally {
      setIsApproving(false);
    }
  };

  const handleLaunch = async () => {
    setTxError(null);
    setLaunchTxHash(null);
    setCreatedPlanId(null);

    if (!isConnected) {
      openWalletModal();
      return;
    }
    if (!isBudgetValid || !isTrancheValid || budgetWei <= 0n || trancheWei <= 0n) {
      setTxError('Tranche size must be greater than 0 and cannot exceed total MUSD budget.');
      return;
    }
    if (!hasEnoughMusd) {
      setTxError(
        `Insufficient wallet MUSD (${formatCurrency(walletBalances?.musdBalance ?? 0)} MUSD available). Swap Testnet BTC to MUSD first.`
      );
      return;
    }

    try {
      setIsLaunching(true);
      const floorWei = parseEther((troveSafeFloorIcr / 100).toFixed(4));
      const hash = await sendVaultTx(
        'createPlan',
        [budgetWei, trancheWei, BigInt(intervalSeconds), floorWei],
        480000n
      );
      setLaunchTxHash(hash);

      // Extract real planId from PlanCreated event log
      const receipt = await mezoPublicClient.getTransactionReceipt({ hash });
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== CONTRACT_ADDRESSES.SatsStackVault.toLowerCase()) {
          continue;
        }
        try {
          const decoded = decodeEventLog({
            abi: SATS_STACK_VAULT_ABI as any,
            data: log.data,
            topics: log.topics,
          }) as { eventName: string; args: Record<string, any> };
          if (decoded.eventName === 'PlanCreated') {
            setCreatedPlanId(Number(decoded.args.planId));
            break;
          }
        } catch {
          // Ignore unrelated events
        }
      }
    } catch (err) {
      setTxError(formatContractError(err));
    } finally {
      setIsLaunching(false);
    }
  };

  const maxTrancheSlider = Math.max(100, Math.min(isBudgetValid ? budgetMusd : 100, 5000));

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Page Header & Wallet Funding Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[#F0F4F8]">
              Strategy Studio
            </h1>
            <p className="text-sm text-[#8B95A5]">
              Configure automated Bitcoin accumulation with sMUSD yield and Trove ICR collateral safety circuit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openSwapModal}
              className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181D24] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#F59E0B] text-xs font-mono text-[#F0F4F8] transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              <span>Swap BTC to MUSD</span>
            </button>
            <a
              href={MEZO_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181D24] hover:bg-[#1F2630] border border-[#262E3B] text-xs font-mono text-[#10B981]"
            >
              <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mezo Faucet</span>
            </a>
          </div>
        </div>

        {/* 2-Column Cockpit Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. DCA Budget Input */}
            <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="budget-input" className="text-xs font-medium text-[#8B95A5]">
                  Total DCA Budget (MUSD)
                </label>
                {isConnected && walletBalances && (
                  <span className="text-xs font-mono text-[#8B95A5] tabular-nums">
                    Wallet:{' '}
                    <strong className="text-[#F0F4F8]">
                      {formatCurrency(walletBalances.musdBalance)} MUSD
                    </strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  id="budget-input"
                  type="number"
                  name="budget"
                  placeholder="Enter MUSD budget"
                  value={budgetMusd || ''}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value);
                    setBudgetMusd(nextVal);
                    if (nextVal > 0 && trancheSizeMusd > nextVal) {
                      setTrancheSizeMusd(Math.max(5, Math.floor(nextVal)));
                    }
                    setTxError(null);
                  }}
                  className="w-full bg-[#0E1116] border border-[#262E3B] rounded-lg px-4 py-3 text-[#F0F4F8] font-mono text-lg tabular-nums placeholder-[#5A6474] focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
                />
                <span className="absolute right-4 top-3.5 font-mono text-xs text-[#8B95A5]">
                  MUSD
                </span>
              </div>

              {/* Quick Budget Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {[25, 50, 100, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setBudgetMusd(amt);
                      if (trancheSizeMusd > amt) {
                        setTrancheSizeMusd(Math.max(5, Math.floor(amt / 2)));
                      }
                      setTxError(null);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                      budgetMusd === amt
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]'
                        : 'bg-[#0E1116] border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
                {isConnected && walletBalances && walletBalances.musdBalance >= 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const maxBal = Math.floor(walletBalances.musdBalance * 100) / 100;
                      setBudgetMusd(maxBal);
                      if (trancheSizeMusd > maxBal) {
                        setTrancheSizeMusd(Math.max(5, Math.floor(maxBal / 2)));
                      }
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#0E1116] border border-[#262E3B] text-[#10B981] hover:border-[#10B981] cursor-pointer"
                  >
                    Max
                  </button>
                )}
              </div>

              {!isBudgetValid && (
                <p className="text-xs text-[#EF4444]">
                  Budget must be greater than 0 MUSD.
                </p>
              )}
              {isConnected && !hasEnoughMusd && (
                <p className="text-xs text-[#EF4444]">
                  Budget exceeds wallet balance ({formatCurrency(walletBalances?.musdBalance ?? 0)} MUSD). Swap Testnet BTC to MUSD above or lower your budget.
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
              min={5}
              max={maxTrancheSlider}
              step={5}
              unit="MUSD"
              onChange={(val) => {
                setTrancheSizeMusd(val);
                setTxError(null);
              }}
              hint={
                isBudgetValid && trancheSizeMusd > budgetMusd
                  ? 'Tranche size exceeds total budget. Lower tranche or increase budget.'
                  : `Executes ${trancheCount} scheduled tranches across Tigris pool`
              }
              isDanger={isBudgetValid && trancheSizeMusd > budgetMusd}
            />

            {/* 3. Cadence Selector */}
            <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
              <label className="block text-xs font-medium text-[#8B95A5]">
                Interval Cadence
              </label>
              <div role="radiogroup" aria-label="Interval Cadence" className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {INTERVAL_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIntervalSeconds(preset.value)}
                    className={`min-h-11 px-3 py-2.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer btn-press ${
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
                Max Slippage Tolerance (UI Check)
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
                    className={`min-h-10 px-3.5 py-2 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer btn-press ${
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
                  aria-label="Custom slippage percentage"
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
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Warning: high slippage tolerance can lead to unfavorable execution fills.</span>
                </div>
              )}
            </div>

            {/* 5. Trove ICR Safety Circuit Floor */}
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
                    : `Swaps auto-pause on-chain if borrower Trove ICR dips below ${troveSafeFloorIcr}% safety floor.`
                }
                isDanger={isIcrDangerous}
              />
            </div>
          </div>

          {/* Right Column: Live Settlement Routing Flow & On-Chain Launch Desk (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-5">
              <h2 className="font-heading text-base font-bold text-[#F0F4F8] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
                <span>Live Settlement Routing Flow</span>
              </h2>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between gap-2 overflow-hidden">
                  <span className="text-[#8B95A5] shrink-0">1. Input Deposit:</span>
                  <span className="text-[#F0F4F8] font-bold tabular-nums truncate max-w-[200px]">
                    {isBudgetValid ? `${formatCurrency(budgetMusd)} MUSD` : '0.00 MUSD'}
                  </span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" aria-hidden="true" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between">
                  <div>
                    <span className="text-[#8B95A5]">2. Yield Parking:</span>
                    <p className="text-[10px] text-[#5A6474] font-sans">
                      Idle principal earns in sMUSD
                    </p>
                  </div>
                  <span className="text-[#10B981] font-bold">sMUSD Vault</span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" aria-hidden="true" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between">
                  <div>
                    <span className="text-[#8B95A5]">3. Swaps via Tigris:</span>
                    <p className="text-[10px] text-[#5A6474] font-sans">
                      Basic MUSD/BTC Pool ({trancheCount} tranches)
                    </p>
                  </div>
                  <span className="text-[#F59E0B] font-bold tabular-nums">
                    ${formatCurrency(trancheSizeMusd)} / tranche
                  </span>
                </div>

                <div className="flex justify-center text-[#5A6474]">
                  <ArrowRight className="w-4 h-4 rotate-90" aria-hidden="true" />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[#8B95A5]">4. Live Tigris Quote:</span>
                    <p className="text-[10px] text-[#5A6474] font-sans">
                      {telemetry
                        ? `Spot ~$${formatCurrency(telemetry.tigrisSpotPrice, 0)} / BTC`
                        : 'Fetching Tigris Router'}
                    </p>
                  </div>
                  <span className="text-[#10B981] font-bold tabular-nums">
                    {isQuoting ? 'Quoting...' : `~${formatBtc(estimatedBtcOutput)} BTC`}
                  </span>
                </div>
              </div>
            </div>

            {/* Real On-Chain Launch Action Desk */}
            <div className="p-6 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold text-[#F0F4F8]">
                  Execute Strategy
                </h2>
                {isConnected && account ? (
                  <span className="text-[11px] font-mono text-[#10B981]">
                    {truncateAddress(account)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={openWalletModal}
                    className="text-[11px] font-mono text-[#F59E0B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Wallet className="w-3 h-3" aria-hidden="true" />
                    <span>Connect Wallet</span>
                  </button>
                )}
              </div>

              {isConnected && walletBalances && (
                <div className="p-3 rounded-lg bg-[#0E1116] border border-[#262E3B] text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#8B95A5]">MUSD Allowance:</span>
                    <span className="text-[#F0F4F8] tabular-nums">
                      {formatCurrency(walletBalances.musdAllowance)} MUSD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B95A5]">Native BTC Gas:</span>
                    <span className="text-[#F0F4F8] tabular-nums">
                      {formatBtc(walletBalances.btcBalance)} BTC
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <ActionExecuteButton
                  variant={isApprovedOnChain ? 'secondary' : 'primary'}
                  disabled={!isBudgetValid || !isTrancheValid || isApprovedOnChain}
                  isLoading={isApproving}
                  loadingText="Approving MUSD..."
                  onClick={handleApprove}
                  className="w-full py-3"
                >
                  {isApprovedOnChain
                    ? 'MUSD Approved for Budget'
                    : isConnected
                    ? 'Step 1: Approve MUSD'
                    : 'Step 1: Connect Wallet & Approve MUSD'}
                </ActionExecuteButton>

                <ActionExecuteButton
                  variant="primary"
                  disabled={
                    !isBudgetValid ||
                    !isTrancheValid ||
                    (isConnected && (!isApprovedOnChain || !hasEnoughMusd))
                  }
                  isLoading={isLaunching}
                  loadingText="Creating Plan On-Chain..."
                  onClick={handleLaunch}
                  className="w-full py-3"
                >
                  Step 2: Launch Accumulator
                </ActionExecuteButton>
              </div>

              {txError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{txError}</span>
                </div>
              )}

              {approveTxHash && !launchTxHash && (
                <div
                  role="status"
                  className="p-3 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] font-mono flex items-center justify-between gap-2"
                >
                  <span>Step 1 MUSD approval confirmed.</span>
                  <a
                    href={`${MEZO_EXPLORER_URL}/tx/${approveTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline"
                  >
                    <span>Tx</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              )}

              {launchTxHash && (
                <div
                  role="status"
                  className="p-4 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 space-y-2.5 text-xs text-[#10B981] font-mono"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>
                        {createdPlanId !== null
                          ? `Plan #${createdPlanId} deployed on Mezo Testnet!`
                          : 'Accumulation Plan deployed on Mezo Testnet!'}
                      </span>
                    </span>
                    <a
                      href={`${MEZO_EXPLORER_URL}/tx/${launchTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline"
                    >
                      <span>Blockscout</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {createdPlanId !== null && (
                      <Link
                        href={`/plan/${createdPlanId}`}
                        className="px-3 py-1.5 rounded-lg bg-[#10B981] text-[#0E1116] font-bold"
                      >
                        Open Plan #{createdPlanId} Ledger
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="px-3 py-1.5 rounded-lg bg-[#0E1116] border border-[#10B981]/40 text-[#F0F4F8]"
                    >
                      View Active Plans
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
