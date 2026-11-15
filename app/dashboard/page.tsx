'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PlanRowCard from '@/components/PlanRowCard';
import TroveCircuitBadge from '@/components/TroveCircuitBadge';
import ActionExecuteButton from '@/components/ActionExecuteButton';
import { useWallet } from '@/lib/walletContext';
import { formatContractError } from '@/lib/mezoClient';
import { MEZO_EXPLORER_URL } from '@/lib/constants';
import { formatCurrency, formatBtc, formatSats, truncateAddress } from '@/lib/utils';
import type { PlanStatus } from '@/lib/types';
import {
  Wallet,
  Bitcoin,
  TrendingUp,
  Percent,
  PlusCircle,
  Filter,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const forceEmpty = searchParams.get('empty') === 'true';

  const {
    account,
    effectiveAddress,
    isConnected,
    openWalletModal,
    openSwapModal,
    plans,
    telemetry,
    isProtocolLoading,
    protocolError,
    walletBalances,
    refreshAll,
    sendVaultTx,
  } = useWallet();

  const [scope, setScope] = useState<'ALL' | 'MINE'>('ALL');
  const [filter, setFilter] = useState<'ALL' | PlanStatus>('ALL');
  const [executingPlanId, setExecutingPlanId] = useState<number | null>(null);
  const [claimingPlanId, setClaimingPlanId] = useState<number | null>(null);
  const [isClaimingAll, setIsClaimingAll] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<{
    kind: 'success' | 'error' | 'info';
    text: string;
    txHash?: `0x${string}`;
  } | null>(null);

  const ownedPlans = effectiveAddress
    ? plans.filter((p) => p.owner.toLowerCase() === effectiveAddress.toLowerCase())
    : [];

  const scopedPlans = forceEmpty
    ? []
    : scope === 'MINE' && effectiveAddress
    ? ownedPlans
    : plans;

  const displayedPlans =
    filter === 'ALL' ? scopedPlans : scopedPlans.filter((p) => p.status === filter);

  const totalRemainingMusd = scopedPlans.reduce((acc, p) => acc + p.remainingMusd, 0);
  const totalSmusdShare = scopedPlans.reduce(
    (acc, p) => acc + p.proRataSmusdShareMusd,
    0
  );
  const totalStackedBtc = scopedPlans.reduce((acc, p) => acc + p.stackedBtc, 0);

  const totalSpentUsd = scopedPlans.reduce(
    (acc, p) => acc + p.fills.reduce((s, f) => s + f.musdSpent, 0),
    0
  );
  const totalBtcFilled = scopedPlans.reduce(
    (acc, p) => acc + p.fills.reduce((s, f) => s + f.btcAcquired, 0),
    0
  );
  const weightedEntryPrice = totalBtcFilled > 0 ? totalSpentUsd / totalBtcFilled : null;

  const totalRemainingAllPlans = plans.reduce((acc, p) => acc + p.remainingMusd, 0);
  const claimableYieldTotal = telemetry?.vaultClaimableYieldMusd ?? 0;
  const scopedYieldOffset =
    totalRemainingAllPlans > 0
      ? (totalRemainingMusd / totalRemainingAllPlans) * claimableYieldTotal
      : 0;

  const ownedClaimablePlans = account
    ? plans.filter(
        (p) =>
          p.owner.toLowerCase() === account.toLowerCase() && p.stackedBtc > 0
      )
    : [];

  const oracleBtcPrice = telemetry?.oracleBtcPrice ?? 0;
  const spotDiffPct =
    weightedEntryPrice && oracleBtcPrice > 0
      ? ((oracleBtcPrice - weightedEntryPrice) / weightedEntryPrice) * 100
      : null;

  const activeTrove = walletBalances?.trove;
  const hasTrove = Boolean(activeTrove?.hasActiveTrove && activeTrove.icrPercent !== null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExecuteTranche = async (planId: number) => {
    setStatusNotice(null);
    if (!isConnected) {
      setStatusNotice({
        kind: 'info',
        text: `Connect a browser wallet to sign executeTranche(${planId}) on Mezo Testnet.`,
      });
      openWalletModal();
      return;
    }

    try {
      setExecutingPlanId(planId);
      const hash = await sendVaultTx('executeTranche', [BigInt(planId)], 550000n);
      setStatusNotice({
        kind: 'success',
        text: `Executed tranche on Plan #${planId} via Tigris AMM.`,
        txHash: hash,
      });
    } catch (err) {
      setStatusNotice({
        kind: 'error',
        text: formatContractError(err),
      });
    } finally {
      setExecutingPlanId(null);
    }
  };

  const handleClaimBtc = async (planId: number) => {
    setStatusNotice(null);
    if (!isConnected || !account) {
      setStatusNotice({
        kind: 'info',
        text: `Connect plan owner wallet to claim stacked BTC from Plan #${planId}.`,
      });
      openWalletModal();
      return;
    }

    const target = plans.find((p) => p.id === planId);
    if (target && target.owner.toLowerCase() !== account.toLowerCase()) {
      setStatusNotice({
        kind: 'error',
        text: `Claim BTC is restricted to plan owner ${truncateAddress(target.owner)}.`,
      });
      return;
    }

    try {
      setClaimingPlanId(planId);
      const hash = await sendVaultTx('claimBtc', [BigInt(planId), account], 220000n);
      setStatusNotice({
        kind: 'success',
        text: `Claimed stacked BTC from Plan #${planId} to ${truncateAddress(account)}.`,
        txHash: hash,
      });
    } catch (err) {
      setStatusNotice({
        kind: 'error',
        text: formatContractError(err),
      });
    } finally {
      setClaimingPlanId(null);
    }
  };

  const handleClaimAll = async () => {
    setStatusNotice(null);
    if (!isConnected || !account) {
      openWalletModal();
      return;
    }
    if (ownedClaimablePlans.length === 0) {
      setStatusNotice({
        kind: 'info',
        text: 'Connected wallet has no claimable BTC across your plans yet.',
      });
      return;
    }

    try {
      setIsClaimingAll(true);
      let lastHash: `0x${string}` | undefined;
      for (const plan of ownedClaimablePlans) {
        lastHash = await sendVaultTx('claimBtc', [BigInt(plan.id), account], 220000n);
      }
      setStatusNotice({
        kind: 'success',
        text: `Claimed accumulated BTC from ${ownedClaimablePlans.length} owned plan(s).`,
        txHash: lastHash,
      });
    } catch (err) {
      setStatusNotice({
        kind: 'error',
        text: formatContractError(err),
      });
    } finally {
      setIsClaimingAll(false);
    }
  };

  return (
    <main role="main" className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
      {/* Top Banner: Live Trove ICR Safety Circuit + Wallet / Quick Actions */}
      <div className="p-4 rounded-xl bg-[#181D24] border border-[#262E3B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <TroveCircuitBadge
            currentIcr={hasTrove ? activeTrove!.icrPercent : null}
            hasActiveTrove={hasTrove}
            safetyFloorIcr={150}
          />
          <span className="text-xs text-[#8B95A5]">
            {hasTrove && activeTrove?.icrPercent != null ? (
              <>
                Liquidation buffer:{' '}
                <strong className="text-[#10B981] font-mono tabular-nums">
                  +{(activeTrove.icrPercent - 110).toFixed(1)}%
                </strong>{' '}
                above 110% MCR
              </>
            ) : effectiveAddress && walletBalances ? (
              <span className="font-mono">
                Wallet: {formatBtc(walletBalances.btcBalance)} BTC |{' '}
                {formatCurrency(walletBalances.musdBalance)} MUSD
              </span>
            ) : (
              'Live on-chain plans verified from SatsStackVault on Mezo Testnet.'
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isConnected && (
            <button
              type="button"
              onClick={openWalletModal}
              className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#F59E0B] text-xs font-mono text-[#F0F4F8] transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
              <span>Connect Wallet</span>
            </button>
          )}
          <button
            type="button"
            onClick={openSwapModal}
            className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#F59E0B] text-xs font-mono text-[#F0F4F8] transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
            <span>Swap BTC to MUSD</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh on-chain vault state"
            className="min-h-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] text-xs font-mono text-[#8B95A5] hover:text-[#F0F4F8] transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
          <Link
            href="/create"
            className="min-h-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0E1116] text-xs font-semibold transition-colors cursor-pointer btn-press"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create Plan</span>
          </Link>
        </div>
      </div>

      {/* Live Portfolio Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active MUSD in sMUSD */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Active MUSD in Vault</span>
            <Wallet className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <div
            className="font-mono text-2xl font-bold text-[#F0F4F8] tabular-nums"
            data-testid="metric-musd"
          >
            {isProtocolLoading && !telemetry
              ? 'Loading...'
              : `$${formatCurrency(totalRemainingMusd)}`}
          </div>
          <span className="text-[11px] text-[#8B95A5] font-mono tabular-nums block">
            sMUSD balance share: ${formatCurrency(totalSmusdShare)} MUSD
          </span>
        </div>

        {/* Metric 2: Total Stacked BTC */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Stacked BTC</span>
            <Bitcoin className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <div
            className="font-mono text-2xl font-bold text-[#10B981] tabular-nums"
            data-testid="metric-btc"
          >
            {isProtocolLoading && !telemetry
              ? 'Loading...'
              : `${formatBtc(totalStackedBtc)} BTC`}
          </div>
          <span className="text-[11px] text-[#8B95A5] font-mono tabular-nums block">
            {formatSats(totalStackedBtc)} sats via Tigris AMM
          </span>
        </div>

        {/* Metric 3: Weighted Avg Entry Price */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Weighted Entry Price</span>
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
          </div>
          <div
            className="font-mono text-2xl font-bold text-[#F0F4F8] tabular-nums"
            data-testid="metric-entry"
          >
            {isProtocolLoading && !telemetry
              ? 'Loading...'
              : weightedEntryPrice !== null
              ? `$${formatCurrency(weightedEntryPrice, 0)}`
              : '--'}
          </div>
          <span className="text-[11px] font-mono tabular-nums block text-[#8B95A5]">
            {telemetry
              ? `Oracle: $${formatCurrency(telemetry.oracleBtcPrice, 0)}${
                  spotDiffPct !== null
                    ? ` (${spotDiffPct >= 0 ? '+' : ''}${spotDiffPct.toFixed(1)}%)`
                    : ''
                }`
              : 'Live Mezo PriceFeed'}
          </span>
        </div>

        {/* Metric 4: sMUSD Yield Offset */}
        <div className="p-5 rounded-xl bg-[#181D24] border border-[#262E3B] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#8B95A5]">
            <span>Yield Offset</span>
            <Percent className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
          </div>
          <div
            className="font-mono text-2xl font-bold text-[#10B981] tabular-nums"
            data-testid="metric-yield"
          >
            {isProtocolLoading && !telemetry
              ? 'Loading...'
              : `+$${formatCurrency(scopedYieldOffset)}`}
          </div>
          <span className="text-[11px] text-[#8B95A5] block">
            Claimable on-chain sMUSD interest
          </span>
        </div>
      </div>

      {/* Plans Header, Scope Switcher, Filters, Claim All */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-xl font-bold text-[#F0F4F8]">
              Active Accumulation Plans
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#262E3B] text-xs font-mono text-[#F0F4F8] tabular-nums">
              {displayedPlans.length}
            </span>

            {/* Scope Toggle */}
            <div className="flex items-center bg-[#181D24] border border-[#262E3B] rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  scope === 'ALL'
                    ? 'bg-[#262E3B] text-[#F59E0B] font-semibold'
                    : 'text-[#8B95A5] hover:text-[#F0F4F8]'
                }`}
              >
                All Vault Plans ({plans.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!effectiveAddress) {
                    openWalletModal();
                    return;
                  }
                  setScope('MINE');
                }}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  scope === 'MINE'
                    ? 'bg-[#262E3B] text-[#F59E0B] font-semibold'
                    : 'text-[#8B95A5] hover:text-[#F0F4F8]'
                }`}
              >
                My Plans ({ownedPlans.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#181D24] border border-[#262E3B] rounded-lg p-1 text-xs font-mono overflow-x-auto max-w-full">
              {(['ALL', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    filter === mode
                      ? 'bg-[#262E3B] text-[#F59E0B] font-semibold'
                      : 'text-[#8B95A5] hover:text-[#F0F4F8]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {ownedClaimablePlans.length > 0 && (
              <ActionExecuteButton
                variant="secondary"
                isLoading={isClaimingAll}
                loadingText="Claiming All..."
                onClick={handleClaimAll}
                className="text-xs py-1.5 px-3"
              >
                Claim All BTC
              </ActionExecuteButton>
            )}
          </div>
        </div>

        {/* Live Transaction or RPC Feedback Banner */}
        {statusNotice && (
          <div
            role={statusNotice.kind === 'error' ? 'alert' : 'status'}
            className={`p-3.5 rounded-xl border text-xs font-mono flex flex-wrap items-center justify-between gap-2 ${
              statusNotice.kind === 'error'
                ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                : statusNotice.kind === 'success'
                ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
                : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
            }`}
          >
            <span className="flex items-center gap-2">
              {statusNotice.kind === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{statusNotice.text}</span>
            </span>
            {statusNotice.txHash && (
              <a
                href={`${MEZO_EXPLORER_URL}/tx/${statusNotice.txHash}`}
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

        {/* Loading, Error, Empty, or Live Plans List */}
        {isProtocolLoading && plans.length === 0 ? (
          <div className="space-y-3" data-testid="plans-loading">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-32 rounded-xl bg-[#181D24] border border-[#262E3B] animate-pulse p-5"
              />
            ))}
          </div>
        ) : protocolError && plans.length === 0 ? (
          <div
            role="alert"
            className="p-8 text-center rounded-2xl bg-[#181D24] border border-[#EF4444]/40 space-y-3"
          >
            <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto" aria-hidden="true" />
            <h2 className="font-heading text-base font-bold text-[#F0F4F8]">
              Unable to reach Mezo Testnet RPC
            </h2>
            <p className="text-xs text-[#8B95A5] max-w-md mx-auto">{protocolError}</p>
            <ActionExecuteButton variant="secondary" onClick={handleRefresh}>
              Retry RPC
            </ActionExecuteButton>
          </div>
        ) : displayedPlans.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#181D24] border border-[#262E3B] space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#262E3B] flex items-center justify-center text-[#8B95A5]">
              <Filter className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-bold text-[#F0F4F8]">
                No active plans found
              </h2>
              <p className="text-xs text-[#8B95A5]">
                Configure a non-custodial accumulation strategy in Strategy Studio to start stacking sats on Mezo.
              </p>
            </div>
            <div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#0E1116] text-xs font-bold transition-colors cursor-pointer btn-press"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>Create Plan</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPlans.map((plan) => {
              const yieldShare =
                totalRemainingAllPlans > 0
                  ? (plan.remainingMusd / totalRemainingAllPlans) * claimableYieldTotal
                  : 0;
              const isPlanOwner = Boolean(
                account && plan.owner.toLowerCase() === account.toLowerCase()
              );

              return (
                <PlanRowCard
                  key={plan.id}
                  plan={plan}
                  isOwner={isPlanOwner}
                  yieldOffsetMusd={yieldShare}
                  onExecuteTranche={handleExecuteTranche}
                  onClaimBtc={handleClaimBtc}
                  isExecuting={executingPlanId === plan.id}
                  isClaiming={claimingPlanId === plan.id}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Navbar />
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs font-mono text-[#8B95A5]">
            Loading live plans from Mezo Testnet...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  );
}
