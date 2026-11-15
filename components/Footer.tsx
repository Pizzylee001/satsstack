'use client';

import React from 'react';
import { ExternalLink, Droplets } from 'lucide-react';
import {
  CONTRACT_ADDRESSES,
  MEZO_EXPLORER_URL,
  MEZO_FAUCET_URL,
  MEZO_TESTNET_CHAIN_ID,
} from '@/lib/constants';
import { useWallet } from '@/lib/walletContext';

export default function Footer() {
  const { telemetry, protocolError } = useWallet();

  return (
    <footer className="border-t border-[#262E3B] bg-[#0E1116]/95 px-4 lg:px-8 py-3.5 text-[11px] font-mono text-[#8B95A5]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-[#F0F4F8]">
            <span
              className={`h-2 w-2 rounded-full ${
                protocolError ? 'bg-[#EF4444]' : 'bg-[#10B981]'
              }`}
              aria-hidden="true"
            />
            <span>Mezo Testnet ({MEZO_TESTNET_CHAIN_ID})</span>
          </span>
          <span className="text-[#5A6474]" aria-hidden="true">|</span>
          <span className="tabular-nums">
            {telemetry
              ? `Block #${telemetry.blockNumber.toLocaleString('en-US')}`
              : protocolError
              ? 'RPC Offline'
              : 'Syncing RPC...'}
          </span>
          <span className="text-[#5A6474] hidden md:inline" aria-hidden="true">|</span>
          <span className="hidden md:inline text-[#8B95A5]">
            rpc.test.mezo.org
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href={`${MEZO_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.SatsStackVault}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#F59E0B] transition-colors"
          >
            <span>Vault: 0x9f2f...26b6</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <a
            href={`${MEZO_EXPLORER_URL}/address/${CONTRACT_ADDRESSES.BasicPool}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#F59E0B] transition-colors"
          >
            <span>Tigris Pool: 0xd16A...6AA9</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <a
            href={MEZO_FAUCET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#10B981] hover:underline"
          >
            <Droplets className="w-3 h-3" aria-hidden="true" />
            <span>Testnet Faucet</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
