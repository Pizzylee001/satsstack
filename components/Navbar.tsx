'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ShieldAlert, Wallet, Eye, AlertTriangle } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { useWallet } from '@/lib/walletContext';

export default function Navbar() {
  const pathname = usePathname();
  const {
    account,
    watchAddress,
    isConnected,
    isWrongNetwork,
    walletBalances,
    protocolError,
    openWalletModal,
    switchToMezoTestnet,
  } = useWallet();

  const navLinks = [
    { href: '/dashboard', label: 'Active Plans' },
    { href: '/create', label: 'Strategy Studio' },
    { href: '/plan/0', label: 'Plan Ledger' },
  ];

  const trove = walletBalances?.trove;
  const hasTrove = Boolean(trove?.hasActiveTrove && trove.icrPercent !== null);
  const troveLow = Boolean(hasTrove && trove!.icrPercent! < 150);

  return (
    <header className="sticky top-0 z-40 bg-[#0E1116]/95 backdrop-blur-md border-b border-[#262E3B] px-3 sm:px-4 lg:px-8 py-2.5">
      <nav
        role="navigation"
        aria-label="Main Navigation"
        className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-3"
      >
        {/* Left: Crisp Inline SVG Brand Mark */}
        <Link href="/dashboard" className="order-1 flex items-center gap-2.5 group shrink-0 min-h-11">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3.5L15 7H9L12 3.5Z"
                fill="#0E1116"
              />
              <path
                d="M6.5 9.5H17.5M6.5 13.5H17.5M6.5 17.5H17.5"
                stroke="#0E1116"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <path
                d="M10.2 7V20.2M13.8 7V20.2"
                stroke="#0E1116"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-bold text-base sm:text-lg text-[#F0F4F8] tracking-tight">
              SatsStack
            </span>
            <span className="text-[10px] text-[#8B95A5] font-mono uppercase tracking-wider">
              Mezo DCA Vault
            </span>
          </div>
        </Link>

        {/* Right: Network Pill, Live Trove Status, Real Wallet Connect Desk */}
        <div className="order-2 lg:order-3 flex items-center gap-2 shrink-0">
          {/* Network Status Indicator */}
          {isWrongNetwork ? (
            <button
              type="button"
              onClick={() => switchToMezoTestnet()}
              data-testid="network-badge"
              className="min-h-11 sm:min-h-9 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-[11px] sm:text-xs font-mono text-[#EF4444] hover:bg-[#EF4444]/25 transition-colors cursor-pointer shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Switch to Mezo (31611)</span>
            </button>
          ) : (
            <div
              data-testid="network-badge"
              className="min-h-9 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181D24] border border-[#262E3B] text-[11px] sm:text-xs font-mono text-[#F0F4F8] shrink-0"
              title="Mezo Testnet Chain ID 31611"
            >
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    protocolError ? 'bg-[#EF4444]' : 'bg-[#10B981]'
                  }`}
                />
              </span>
              <span className="hidden sm:inline">Mezo Testnet</span>
              <span className="text-[#8B95A5] tabular-nums">(31611)</span>
            </div>
          )}

          {/* Live Trove Health Pill (hidden on <768px to prevent header crowding) */}
          <div
            data-testid="trove-health-indicator"
            className={`hidden md:flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono shrink-0 ${
              hasTrove
                ? troveLow
                  ? 'bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]'
                  : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-[#181D24] border-[#262E3B] text-[#8B95A5]'
            }`}
          >
            {troveLow ? (
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#10B981]" aria-hidden="true" />
            )}
            <span className="tabular-nums">
              {hasTrove
                ? `Trove ICR: ${trove!.icrPercent!.toFixed(1)}%`
                : watchAddress || isConnected
                ? 'Trove: None'
                : 'Trove Guard'}
            </span>
          </div>

          {/* Real EIP-6963 / EIP-1193 Wallet Button */}
          <button
            type="button"
            onClick={openWalletModal}
            data-testid={isConnected ? 'connected-wallet-btn' : 'connect-wallet-btn'}
            className={`min-h-11 sm:min-h-9 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer btn-press shrink-0 ${
              isConnected
                ? 'bg-[#181D24] hover:bg-[#1F2630] border-[#10B981]/40 text-[#F0F4F8]'
                : watchAddress
                ? 'bg-[#181D24] hover:bg-[#1F2630] border-[#F59E0B]/50 text-[#F59E0B]'
                : 'bg-[#F59E0B] hover:bg-[#FBBF24] border-[#F59E0B] text-[#0E1116]'
            }`}
          >
            {isConnected && account ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" aria-hidden="true" />
                <span>{truncateAddress(account)}</span>
              </>
            ) : watchAddress ? (
              <>
                <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{truncateAddress(watchAddress)}</span>
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        </div>

        {/* Center / Bottom Row on Mobile: Segmented Route Switcher (single DOM set, >=44px mobile touch targets) */}
        <div className="order-3 lg:order-2 w-full lg:w-auto flex items-center gap-1 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1F2630]">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href.startsWith('/plan/') && pathname?.startsWith('/plan/'));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 lg:flex-initial min-h-11 lg:min-h-9 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center ${
                  isActive
                    ? 'bg-[#181D24] text-[#F59E0B] border border-[#262E3B]'
                    : 'text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#181D24]/60 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
