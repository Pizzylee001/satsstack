'use client';

import React from 'react';
import { TrancheFill } from '@/lib/types';
import { MEZO_EXPLORER_URL } from '@/lib/constants';
import { formatCurrency, formatBtc, truncateAddress } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface PositionLedgerTableProps {
  fills: TrancheFill[];
}

export default function PositionLedgerTable({ fills }: PositionLedgerTableProps) {
  if (!fills || fills.length === 0) {
    return (
      <div
        data-testid="ledger-table-empty"
        className="p-8 text-center text-sm text-[#8B95A5] bg-[#181D24] rounded-xl border border-[#262E3B]"
      >
        No execution tranches have settled yet. Due tranches can be executed from this plan or the Active Plans Desk.
      </div>
    );
  }

  return (
    <div
      data-testid="ledger-table"
      className="w-full max-w-full overflow-x-auto rounded-xl border border-[#262E3B] bg-[#181D24]"
    >
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[#0E1116] border-b border-[#262E3B] text-xs font-mono text-[#8B95A5] uppercase tracking-wider">
          <tr>
            <th className="py-3 px-4 whitespace-nowrap">Tranche #</th>
            <th className="py-3 px-4 whitespace-nowrap">Timestamp (UTC)</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">MUSD Spent</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">BTC Acquired</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Execution Price</th>
            <th className="py-3 px-4 text-right whitespace-nowrap">Tigris Pool Tx</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262E3B] font-mono text-xs">
          {fills.map((fill) => (
            <tr
              key={`${fill.txHash}-${fill.trancheNumber}`}
              className="hover:bg-[#1F2630]/50 transition-colors text-[#F0F4F8]"
            >
              <td className="py-3 px-4 font-semibold text-[#F59E0B] tabular-nums whitespace-nowrap">
                #{fill.trancheNumber}
              </td>
              <td className="py-3 px-4 text-[#8B95A5] tabular-nums whitespace-nowrap">
                {fill.timestamp}
              </td>
              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                ${formatCurrency(fill.musdSpent)}
              </td>
              <td className="py-3 px-4 text-right text-[#10B981] font-semibold tabular-nums whitespace-nowrap">
                +{formatBtc(fill.btcAcquired)} BTC
              </td>
              <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                ${formatCurrency(fill.executionPrice)}
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <a
                  href={`${MEZO_EXPLORER_URL}/tx/${fill.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
                >
                  <span>{truncateAddress(fill.txHash, 6, 4)}</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
