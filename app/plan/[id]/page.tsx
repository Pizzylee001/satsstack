'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { parseEther } from 'viem';
import Navbar from '@/components/Navbar';
import PositionLedgerTable from '@/components/PositionLedgerTable';
import RouteCollateralModal from '@/components/RouteCollateralModal';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import { MEZO_EXPLORER_URL } from '@/lib/constants';
import { fetchSingleOnChainPlan, formatContractError } from '@/lib/mezoClient';
import { useWallet } from '@/lib/walletContext';
import type { OnChainPlan } from '@/lib/types';
import {
  formatCurrency,
  formatBtc,
  formatSats,
  formatDuration,
  truncateAddress,
} from '@/lib/utils';
import {
  ArrowLeft,
  ShieldCheck,
  Plus,
  Play,
  Pause,
  AlertOctagon,
  Sparkles,
  Zap,
  Coins,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function PlanDetailPage() {
  const params = useParams();
  const idStr = String(params?.id ?? '');
  const isValidNumericId = /^\d+$/.test(idStr);
  const planId = isValidNumericId ? parseInt(idStr, 10) : NaN;

  const {
    account,
    isConnected,
    openWalletModal,
    plans,
    telemetry,
    isProtocolLoading,
    walletBalances,
    sendApproveMusd,
    sendVaultTx,
  } = useWallet();

  const contextPlan = isValidNumericId
    ? plans.find((p) => p.id === planId) ?? null
    : null;
  const [fallbackPlan, setFallbackPlan] = useState<OnChainPlan | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState<boolean>(false);

  const plan = contextPlan ?? fallbackPlan;

  useEffect(() => {
    if (!isValidNumericId || contextPlan || isProtocolLoading) return;
    let cancelled = false;
    setIsFallbackLoading(true);
    fetchSingleOnChainPlan(planId)
      .then((res) => {
        if (!cancelled) setFallbackPlan(res.plan);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsFallbackLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isValidNumericId, planId, contextPlan, isProtocolLoading]);

  // Modals & Action states
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(25);

  const [isExecutingTranche, setIsExecutingTranche] = useState(false);
  const [isClaimingBtc, setIsClaimingBtc] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [actionNotice, setActionNotice] = useState<{
    kind: 'success' | 'error' | 'info';
    text: string;
    txHash?: `0x${string}`;
  } | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!plan) return;
    const sync = () => {
      setRemainingSeconds(
        Math.max(0, plan.nextExecutionTime - Math.floor(Date.now() / 1000))
      );
    };
    sync();
    if (plan.status !== 'ACTIVE') return;
    const timer = setInterval(sync, 1000);
    return () => clearInterval(timer);
  }, [plan]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTopUpModalOpen(false);
        setIsCancelModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if ((isProtocolLoading || isFallbackLoading) && !plan && isValidNumericId) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
          <div className="h-44 rounded-2xl bg-[#181D24] border border-[#262E3B] animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 rounded-xl bg-[#181D24] border border-[#262E3B] animate-pulse" />
            <div className="h-40 rounded-xl bg-[#181D24] border border-[#262E3B] animate-pulse" />
          </div>
          <div className="h-56 rounded-xl bg-[#181D24] border border-[#262E3B] animate-pulse" />
        </main>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main
          role="main"
          className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col items-center justify-center space-y-4"
        >
          <div className="p-12 text-center rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4 max-w-md">
            <h1 className="font-heading text-xl font-bold text-[#F0F4F8]">
              Plan #{idStr} Not Found
            </h1>
            <p className="text-xs text-[#8B95A5]">
              No active or historical accumulation plan exists on SatsStackVault with identifier #{idStr}.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] text-[#0E1116] text-xs font-bold btn-press"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = Boolean(
    isConnected && account && account.toLowerCase() === plan.owner.toLowerCase()
  );
  const isDue =
    plan.status === 'ACTIVE' && plan.remainingMusd > 0 && remainingSeconds === 0;
  const oraclePrice = telemetry?.oracleBtcPrice ?? 0;
  const tigrisPrice = telemetry?.tigrisSpotPrice ?? oraclePrice;
  const claimableYieldTotal = telemetry?.vaultClaimableYieldMusd ?? 0;
  const totalVaultRemaining = plans.reduce((acc, p) => acc + p.remainingMusd, 0);
  const planYieldShareMusd =
    totalVaultRemaining > 0
      ? (plan.remainingMusd / totalVaultRemaining) * claimableYieldTotal
      : 0;

  const priceDeltaPct =
    plan.weightedAvgEntryPrice && oraclePrice > 0
      ? ((oraclePrice - plan.weightedAvgEntryPrice) / plan.weightedAvgEntryPrice) * 100
      : null;

  const ensureOwnerOrPrompt = (verb: string): boolean => {
    if (!isConnected) {
      setActionNotice({
        kind: 'info',
        text: `Connect wallet ${truncateAddress(plan.owner)} to ${verb}.`,
      });
      openWalletModal();
      return false;
    }
    if (!isOwner) {
      setActionNotice({
        kind: 'error',
        text: `Owner action only: connect ${truncateAddress(plan.owner)} to ${verb}.`,
      });
      return false;
    }
    return true;
  };

  const handleExecuteDueTranche = async () => {
    setActionNotice(null);
    if (!isConnected) {
      setActionNotice({
        kind: 'info',
        text: `Connect any browser wallet to execute due tranche on Plan #${plan.id}.`,
      });
      openWalletModal();
      return;
    }
    try {
      setIsExecutingTranche(true);
      const hash = await sendVaultTx('executeTranche', [BigInt(plan.id)], 550000n);
      setActionNotice({
        kind: 'success',
        text: `Executed tranche on Plan #${plan.id} via Tigris AMM.`,
        txHash: hash,
      });
    } catch (err) {
      setActionNotice({ kind: 'error', text: formatContractError(err) });
    } finally {
      setIsExecutingTranche(false);
    }
  };

  const handleClaimBtc = async () => {
    setActionNotice(null);
    if (!ensureOwnerOrPrompt('claim stacked BTC') || !account) return;
    try {
      setIsClaimingBtc(true);
      const hash = await sendVaultTx('claimBtc', [BigInt(plan.id), account], 220000n);
      setActionNotice({
        kind: 'success',
        text: `Claimed ${formatBtc(plan.stackedBtc)} BTC to ${truncateAddress(account)}.`,
        txHash: hash,
      });
    } catch (err) {
      setActionNotice({ kind: 'error', text: formatContractError(err) });
    } finally {
      setIsClaimingBtc(false);
    }
  };

  const handleTogglePause = async () => {
    setActionNotice(null);
    const fn = plan.status === 'ACTIVE' ? 'pause' : 'resume';
    if (!ensureOwnerOrPrompt(`${fn} this plan`)) return;

    try {
      setIsActionLoading(true);
      const hash = await sendVaultTx(fn, [BigInt(plan.id)], 160000n);
      setActionNotice({
        kind: 'success',
        text: fn === 'pause' ? `Plan #${plan.id} paused.` : `Plan #${plan.id} resumed.`,
        txHash: hash,
      });
    } catch (err) {
      setActionNotice({ kind: 'error', text: formatContractError(err) });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTopUpConfirm = async () => {
    setActionNotice(null);
    if (!Number.isFinite(topUpAmount) || topUpAmount <= 0) return;
    if (!ensureOwnerOrPrompt('top up MUSD')) return;

    try {
      setIsActionLoading(true);
      const addWei = parseEther(topUpAmount.toFixed(6));
      if (!walletBalances || walletBalances.musdBalanceWei < addWei) {
        setActionNotice({
          kind: 'error',
          text: `Insufficient wallet MUSD (${formatCurrency(walletBalances?.musdBalance ?? 0)} available).`,
        });
        return;
      }

      if (walletBalances.musdAllowanceWei < addWei) {
        await sendApproveMusd(addWei);
      }

      const hash = await sendVaultTx('topUp', [BigInt(plan.id), addWei], 320000n);
      setIsTopUpModalOpen(false);
      setActionNotice({
        kind: 'success',
        text: `Added ${formatCurrency(topUpAmount)} MUSD to Plan #${plan.id}.`,
        txHash: hash,
      });
    } catch (err) {
      setActionNotice({ kind: 'error', text: formatContractError(err) });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelAndWithdraw = async () => {
    setActionNotice(null);
    if (!ensureOwnerOrPrompt('cancel and withdraw')) return;

    try {
      setIsActionLoading(true);
      const hash = await sendVaultTx(
        'cancelAndWithdraw',
        [BigInt(plan.id)],
        380000n
      );
      setIsCancelModalOpen(false);
      setActionNotice({
        kind: 'success',
        text: `Cancelled Plan #${plan.id} and withdrew unspent MUSD + stacked BTC.`,
        txHash: hash,
      });
    } catch (err) {
      setActionNotice({ kind: 'error', text: formatContractError(err) });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#8B95A5] hover:text-[#F0F4F8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="font-mono text-xs text-[#8B95A5]">
            Created {plan.createdAt}
          </div>
        </div>

        {/* Status Feedback Banner */}
        {actionNotice && (
          <div
            role={actionNotice.kind === 'error' ? 'alert' : 'status'}
            className={`p-3.5 rounded-xl border text-xs font-mono flex flex-wrap items-center justify-between gap-2 ${
              actionNotice.kind === 'error'
                ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                : actionNotice.kind === 'success'
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
            }`}
          >
            <span className="flex items-center gap-2">
              {actionNotice.kind === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{actionNotice.text}</span>
            </span>
            {actionNotice.txHash && (
              <a
                href={`${MEZO_EXPLORER_URL}/tx/${actionNotice.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline shrink-0"
              >
                <span>View on Blockscout</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {/* Plan Header */}
        <div className="p-6 rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-2xl font-bold text-[#F0F4F8]">
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
                <span className="text-xs font-mono text-[#8B95A5]">
                  {plan.executedTranches}/{plan.totalTranches} tranches | Cadence {formatDuration(plan.intervalSeconds)}
                </span>
              </div>
              <p className="text-xs text-[#8B95A5] break-all flex flex-wrap items-center gap-1.5">
                <span>Owner:</span>
                <a
                  href={`${MEZO_EXPLORER_URL}/address/${plan.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[#F0F4F8] hover:text-[#F59E0B] inline-flex items-center gap-1"
                >
                  <span>{plan.owner}</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
                {isOwner && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] text-[10px] font-mono">
                    Connected Owner
                  </span>
                )}
              </p>
            </div>

            {/* Operational & Owner Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {plan.status === 'ACTIVE' && plan.remainingMusd > 0 && (
                <ActionExecuteButton
                  variant="primary"
                  disabled={!isDue}
                  isLoading={isExecutingTranche}
                  loadingText="Executing..."
                  onClick={handleExecuteDueTranche}
                  className="text-xs py-2 px-3"
                >
                  <Zap className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                  <span>{isDue ? 'Execute Due Tranche' : `Next in ${formatDuration(remainingSeconds)}`}</span>
                </ActionExecuteButton>
              )}

              {plan.status !== 'CANCELLED' && plan.status !== 'COMPLETED' && (
                <>
                  <ActionExecuteButton
                    variant="secondary"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="text-xs py-2 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
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
                        <Pause className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" aria-hidden="true" />
                        <span>Pause Plan</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 mr-1 text-[#10B981]" aria-hidden="true" />
                        <span>Resume Plan</span>
                      </>
                    )}
                  </ActionExecuteButton>

                  <ActionExecuteButton
                    variant="danger"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="text-xs py-2 px-3"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    <span>Cancel & Withdraw</span>
                  </ActionExecuteButton>
                </>
              )}

              {plan.stackedBtc > 0 && (
                <>
                  <ActionExecuteButton
                    variant="secondary"
                    isLoading={isClaimingBtc}
                    loadingText="Claiming..."
                    onClick={handleClaimBtc}
                    className="text-xs py-2 px-3"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1 text-[#10B981]" aria-hidden="true" />
                    <span>Claim BTC</span>
                  </ActionExecuteButton>

                  <ActionExecuteButton
                    variant="primary"
                    onClick={() => setIsRouteModalOpen(true)}
                    className="text-xs py-2 px-3"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    <span>Route Stacked BTC to My Trove</span>
                  </ActionExecuteButton>
                </>
              )}
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
                {formatBtc(plan.stackedBtc)} BTC ({formatSats(plan.stackedBtc)} sats)
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#8B95A5] block">sMUSD Share / Yield:</span>
              <span className="text-base font-bold text-[#10B981] tabular-nums">
                ${formatCurrency(plan.proRataSmusdShareMusd)} (+${formatCurrency(planYieldShareMusd)})
              </span>
            </div>
          </div>
        </div>

        {/* Cost Basis & Trove Safety Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
            <h2 className="font-heading text-sm font-bold text-[#F0F4F8] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
              <span>Cost Basis Comparison</span>
            </h2>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Weighted Average Entry:</span>
              <span className="text-sm font-bold text-[#F0F4F8] tabular-nums">
                {plan.weightedAvgEntryPrice !== null
                  ? `$${formatCurrency(plan.weightedAvgEntryPrice)}`
                  : '-- (0 fills)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Live Oracle BTC Price:</span>
              <span className="text-sm font-bold text-[#F0F4F8] tabular-nums">
                {oraclePrice > 0 ? `$${formatCurrency(oraclePrice)}` : 'Loading...'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Tigris MUSD/BTC Pool Spot:</span>
              <span className="text-xs text-[#8B95A5] tabular-nums">
                {tigrisPrice > 0 ? `$${formatCurrency(tigrisPrice)}` : 'Loading...'}
              </span>
            </div>
            <div
              className={`p-2.5 rounded-lg border text-xs font-mono flex justify-between items-center ${
                priceDeltaPct === null
                  ? 'bg-[#0E1116] border-[#262E3B] text-[#8B95A5]'
                  : priceDeltaPct >= 0
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                  : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
              }`}
            >
              <span>Oracle Spread vs Entry:</span>
              <span className="font-bold tabular-nums">
                {priceDeltaPct !== null
                  ? `${priceDeltaPct >= 0 ? '+' : ''}${priceDeltaPct.toFixed(2)}% vs Spot`
                  : 'Awaiting first fill'}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-3">
            <h2 className="font-heading text-sm font-bold text-[#F0F4F8] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
              <span>Trove Collateral Safety Circuit</span>
            </h2>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#8B95A5]">Owner Current ICR:</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  plan.ownerTrove.hasActiveTrove && plan.ownerTrove.icrPercent !== null
                    ? plan.ownerTrove.icrPercent < plan.troveSafeFloorIcr
                      ? 'text-[#EF4444]'
                      : 'text-[#10B981]'
                    : 'text-[#F0F4F8]'
                }`}
              >
                {plan.ownerTrove.hasActiveTrove && plan.ownerTrove.icrPercent !== null
                  ? `${plan.ownerTrove.icrPercent.toFixed(1)}%`
                  : 'No Active Trove'}
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
            <h2 className="font-heading text-lg font-bold text-[#F0F4F8]">
              Execution Fill History
            </h2>
            <span className="text-xs font-mono text-[#8B95A5]">
              {plan.fills.length} tranches executed via Tigris
            </span>
          </div>
          <PositionLedgerTable fills={plan.fills} />
        </div>

        {/* On-Chain Lifecycle Audit Log */}
        {plan.events.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-heading text-base font-bold text-[#F0F4F8]">
              On-Chain Plan Event Log
            </h2>
            <div className="rounded-xl border border-[#262E3B] bg-[#181D24] divide-y divide-[#262E3B]">
              {plan.events.map((ev, idx) => (
                <div
                  key={`${ev.txHash}-${ev.type}-${idx}`}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="text-[#F59E0B] font-semibold mr-2">{ev.type}</span>
                    <span className="text-[#F0F4F8]">{ev.summary}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#8B95A5] shrink-0">
                    <span className="tabular-nums">{ev.timestamp}</span>
                    <a
                      href={`${MEZO_EXPLORER_URL}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#F59E0B] hover:underline"
                    >
                      <span>{truncateAddress(ev.txHash, 6, 4)}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Route Stacked BTC to My Trove */}
      <RouteCollateralModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        planId={plan.id}
        planOwner={plan.owner}
        stackedBtc={plan.stackedBtc}
        oracleBtcPrice={oraclePrice}
        ownerTrove={plan.ownerTrove}
      />

      {/* Modal 2: Top Up MUSD Modal */}
      {isTopUpModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTopUpModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#181D24] border border-[#3B4556] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-[#F0F4F8]">
                Top Up MUSD Budget
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsTopUpModalOpen(false)}
                className="min-h-10 min-w-10 flex items-center justify-center rounded-lg text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#262E3B] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs text-[#8B95A5]">
              Deposit extra MUSD into sMUSD to extend Plan #{plan.id}. Allowance will be approved automatically if needed.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#8B95A5]">
                <label htmlFor="topup-input">Top Up Amount (MUSD)</label>
                {walletBalances && (
                  <span className="font-mono tabular-nums">
                    Available: {formatCurrency(walletBalances.musdBalance)} MUSD
                  </span>
                )}
              </div>
              <input
                id="topup-input"
                type="number"
                min="1"
                value={topUpAmount || ''}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                placeholder="Enter MUSD amount"
                className="w-full bg-[#0E1116] border border-[#262E3B] rounded-lg px-3 py-2 text-sm font-mono text-[#F0F4F8] tabular-nums focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#262E3B]">
              <ActionExecuteButton
                variant="secondary"
                onClick={() => setIsTopUpModalOpen(false)}
              >
                Cancel
              </ActionExecuteButton>
              <ActionExecuteButton
                variant="primary"
                disabled={topUpAmount <= 0}
                isLoading={isActionLoading}
                loadingText="Depositing MUSD..."
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCancelModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-[#181D24] border border-[#3B4556] p-6 space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#EF4444] flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" aria-hidden="true" />
              <span>Cancel Plan & Withdraw</span>
            </h2>
            <p className="text-xs text-[#8B95A5]">
              Atomically unwraps unspent MUSD from sMUSD and returns all accumulated BTC to {truncateAddress(plan.owner)}.
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
            <div className="flex justify-end gap-3 pt-3 border-t border-[#262E3B]">
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
