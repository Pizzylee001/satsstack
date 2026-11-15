'use client';

import React, { useEffect, useState } from 'react';
import {
  Wallet,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  LogOut,
  ArrowRightLeft,
  Eye,
  ShieldCheck,
  Droplets,
} from 'lucide-react';
import { useWallet } from '@/lib/walletContext';
import {
  MEZO_EXPLORER_URL,
  MEZO_FAUCET_URL,
  MEZO_TESTNET_CHAIN_ID,
  MEZO_TESTNET_RPC_URL,
} from '@/lib/constants';
import { formatBtc, formatCurrency, truncateAddress } from '@/lib/utils';
import ActionExecuteButton from './ActionExecuteButton';

export default function WalletConnectModal() {
  const {
    account,
    watchAddress,
    chainId,
    isConnected,
    isWrongNetwork,
    isConnecting,
    walletError,
    discoveredWallets,
    activeWalletName,
    walletBalances,
    isWalletModalOpen,
    closeWalletModal,
    openSwapModal,
    connectWallet,
    disconnectWallet,
    setWatchAddress,
    switchToMezoTestnet,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [rpcCopied, setRpcCopied] = useState(false);
  const [inspectInput, setInspectInput] = useState('');

  useEffect(() => {
    if (!isWalletModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWalletModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isWalletModalOpen, closeWalletModal]);

  if (!isWalletModalOpen) return null;

  const copyAddress = async () => {
    if (!account) return;
    await navigator.clipboard.writeText(account).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const copyRpcDetails = async () => {
    const info = `Network: Mezo Testnet\nRPC URL: ${MEZO_TESTNET_RPC_URL}\nChain ID: ${MEZO_TESTNET_CHAIN_ID}\nCurrency: BTC\nExplorer: ${MEZO_EXPLORER_URL}`;
    await navigator.clipboard.writeText(info).catch(() => {});
    setRpcCopied(true);
    setTimeout(() => setRpcCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      data-testid="wallet-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeWalletModal();
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl bg-[#181D24] border border-[#3B4556] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#262E3B] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
              <Wallet className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="wallet-modal-title"
                className="font-heading text-lg font-bold text-[#F0F4F8]"
              >
                {isConnected ? 'Connected Wallet' : 'Connect Wallet'}
              </h2>
              <p className="text-xs text-[#8B95A5]">
                Mezo Testnet (Chain ID 31611)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWalletModal}
            aria-label="Close wallet dialog"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[#8B95A5] hover:text-[#F0F4F8] hover:bg-[#262E3B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {walletError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444] flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{walletError}</span>
          </div>
        )}

        {isConnected && account ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0E1116] border border-[#262E3B] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-mono text-[#8B95A5] block">
                    {activeWalletName || 'Connected Signer'}
                  </span>
                  <span className="font-mono text-sm font-bold text-[#F0F4F8] break-all">
                    {truncateAddress(account, 8, 6)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={copyAddress}
                    aria-label="Copy connected address"
                    className="min-h-9 min-w-9 px-2 rounded-lg bg-[#181D24] border border-[#262E3B] text-[#8B95A5] hover:text-[#F0F4F8] flex items-center justify-center cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`${MEZO_EXPLORER_URL}/address/${account}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View address on Mezo Blockscout"
                    className="min-h-9 min-w-9 px-2 rounded-lg bg-[#181D24] border border-[#262E3B] text-[#8B95A5] hover:text-[#F59E0B] flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {isWrongNetwork && (
                <div className="p-3 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-between gap-3">
                  <span className="text-xs text-[#F59E0B] font-mono">
                    Current chain: {chainId ?? 'Unknown'} (need 31611)
                  </span>
                  <ActionExecuteButton
                    variant="primary"
                    onClick={() => switchToMezoTestnet()}
                    className="text-xs py-1.5 px-3 shrink-0"
                  >
                    Switch Network
                  </ActionExecuteButton>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#262E3B] font-mono text-xs">
                <div>
                  <span className="text-[#8B95A5] block text-[11px]">Native BTC Gas</span>
                  <span className="text-[#F0F4F8] font-bold tabular-nums">
                    {walletBalances ? `${formatBtc(walletBalances.btcBalance)} BTC` : 'Loading...'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8B95A5] block text-[11px]">Wallet MUSD</span>
                  <span className="text-[#F59E0B] font-bold tabular-nums">
                    {walletBalances ? `${formatCurrency(walletBalances.musdBalance)} MUSD` : 'Loading...'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#262E3B] flex items-center justify-between text-xs font-mono">
                <span className="text-[#8B95A5]">Mezo Trove ICR:</span>
                {walletBalances?.trove.hasActiveTrove && walletBalances.trove.icrPercent !== null ? (
                  <span className="text-[#10B981] font-bold flex items-center gap-1 tabular-nums">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    {walletBalances.trove.icrPercent.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-[#8B95A5]">No Active Trove</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  closeWalletModal();
                  openSwapModal();
                }}
                className="min-h-11 px-3 py-2 rounded-lg bg-[#1F2630] hover:bg-[#262E3B] border border-[#3B4556] text-xs font-medium text-[#F0F4F8] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
                <span>Swap BTC to MUSD</span>
              </button>
              <a
                href={MEZO_FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 px-3 py-2 rounded-lg bg-[#1F2630] hover:bg-[#262E3B] border border-[#3B4556] text-xs font-medium text-[#F0F4F8] flex items-center justify-center gap-1.5"
              >
                <Droplets className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
                <span>Testnet Faucet</span>
              </a>
            </div>

            <ActionExecuteButton
              variant="danger"
              onClick={disconnectWallet}
              className="w-full min-h-11"
            >
              <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Disconnect Wallet</span>
            </ActionExecuteButton>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[#8B95A5] leading-relaxed">
              Connect an EVM browser wallet to approve MUSD, create DCA accumulation plans, or sign plan transactions on Mezo Testnet.
            </p>

            {discoveredWallets.length > 0 ? (
              <div className="space-y-2">
                {discoveredWallets.map((w) => (
                  <button
                    key={w.uuid}
                    type="button"
                    disabled={isConnecting}
                    onClick={() => connectWallet(w)}
                    data-testid={`wallet-option-${w.rdns}`}
                    className="w-full min-h-12 px-4 py-3 rounded-xl bg-[#0E1116] hover:bg-[#1F2630] border border-[#262E3B] hover:border-[#F59E0B]/60 flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {w.icon ? (
                        <img
                          src={w.icon}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6 rounded"
                        />
                      ) : (
                        <Wallet className="w-5 h-5 text-[#F59E0B]" aria-hidden="true" />
                      )}
                      <div>
                        <span className="text-sm font-semibold text-[#F0F4F8] block">
                          {w.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#8B95A5]">
                          EIP-1193 Signer
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#F59E0B]">
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0E1116] border border-[#262E3B] space-y-3">
                <p className="text-xs text-[#F0F4F8] font-medium">
                  No browser wallet extension detected.
                </p>
                <p className="text-xs text-[#8B95A5]">
                  Install MetaMask or Rabby Wallet in your browser, add Mezo Testnet (Chain ID 31611), and claim gas tokens from the Mezo Faucet.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#0E1116] text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <span>Install MetaMask</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={copyRpcDetails}
                    className="px-3 py-1.5 rounded-lg bg-[#181D24] border border-[#262E3B] text-xs font-mono text-[#F0F4F8] hover:border-[#3B4556] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {rpcCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#10B981]" />
                        <span>RPC Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Mezo RPC Config</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Read-Only Watch Mode for Judging Without Extension */}
            <div className="pt-3 border-t border-[#262E3B] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#8B95A5] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#F59E0B]" aria-hidden="true" />
                  <span>Inspect Any Address (Read-Only)</span>
                </span>
                {watchAddress && (
                  <button
                    type="button"
                    onClick={() => setWatchAddress(null)}
                    className="text-[11px] font-mono text-[#EF4444] hover:underline cursor-pointer"
                  >
                    Clear Watch
                  </button>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setWatchAddress(inspectInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  name="watchAddress"
                  value={inspectInput}
                  onChange={(e) => setInspectInput(e.target.value)}
                  placeholder="0x... Mezo address"
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 min-w-0 bg-[#0E1116] border border-[#262E3B] rounded-lg px-3 py-2 text-xs font-mono text-[#F0F4F8] placeholder-[#5A6474]"
                />
                <ActionExecuteButton
                  type="submit"
                  variant="secondary"
                  className="text-xs px-3 py-2 shrink-0"
                >
                  Inspect
                </ActionExecuteButton>
              </form>
              <button
                type="button"
                onClick={() => setWatchAddress('0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde')}
                className="text-[11px] font-mono text-[#F59E0B] hover:underline cursor-pointer"
              >
                Use Plan #0-#2 Vault Deployer (0x58F6...7Fde) read-only
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
