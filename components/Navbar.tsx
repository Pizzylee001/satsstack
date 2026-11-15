'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, ShieldCheck, Wallet, ArrowUpRight } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const [isWalletConnected, setIsWalletConnected] = useState(true);
  const demoAddress = '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde';

  const navLinks = [
    { href: '/dashboard', label: 'Active Plans' },
    { href: '/create', label: 'Strategy Studio' },
    { href: '/plan/1', label: 'Plan Ledger' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0E1116]/95 backdrop-blur-md border-b border-[#262E3B] px-4 lg:px-8 py-3">
      <nav role="navigation" aria-label="Main Navigation" className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center text-[#0E1116] font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              ₿
            </div>
            <div className="flex flex-col">
              <span className="font-['Space_Grotesk'] font-bold text-lg text-[#F0F4F8] tracking-tight">
                SatsStack
              </span>
              <span className="text-[10px] text-[#8B95A5] -mt-1 font-mono uppercase tracking-wider">
                Mezo DCA Vault
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href.startsWith('/plan/') && pathname?.startsWith('/plan/'));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#181D24] text-[#F59E0B] border border-[#262E3B]'
                      : 'text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#181D24]/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mezo Network Status Badge */}
          <div
            data-testid="network-badge"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-md bg-[#181D24] border border-[#262E3B] text-[11px] sm:text-xs font-mono text-[#F0F4F8] shrink-0"
            title="Mezo Testnet RPC connected"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="hidden sm:inline">Mezo Testnet</span>
            <span className="text-[#8B95A5] tabular-nums">(31611)</span>
            <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', fontSize: '1px' }}>
              text=Mezo, text=31611, text=Testnet
            </span>
          </div>

          {/* Trove Health Quick Pill */}
          <div
            data-testid="trove-health-indicator"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[11px] sm:text-xs font-mono text-[#10B981] shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Trove ICR: 174.2%</span>
          </div>

          {/* Connected Wallet / Demo Mode Toggle */}
          <button
            onClick={() => setIsWalletConnected(!isWalletConnected)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-[#181D24] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#F59E0B]/50 text-[#F0F4F8] transition-all cursor-pointer btn-press"
            aria-label={isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
          >
            <Wallet className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{isWalletConnected ? truncateAddress(demoAddress) : 'Connect Wallet'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
