'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  createWalletClient,
  custom,
  getAddress,
  BaseError,
  ContractFunctionRevertedError,
  type EIP1193Provider,
} from 'viem';
import {
  MEZO_TESTNET_CHAIN_ID,
  MEZO_TESTNET_CHAIN_ID_HEX,
  MEZO_TESTNET_CHAIN_PARAMS,
  CONTRACT_ADDRESSES,
} from './constants';
import {
  mezoPublicClient,
  mezoTestnet,
  fetchProtocolAndPlans,
  fetchWalletBalances,
  estimateSafeGasLimit,
  waitForBlockSync,
  formatContractError,
} from './mezoClient';
import {
  SATS_STACK_VAULT_ABI,
  ERC20_ABI,
  TIGRIS_ROUTER_ABI,
} from './contracts';
import type {
  OnChainPlan,
  ProtocolTelemetry,
  WalletBalances,
} from './types';

export interface DiscoveredWallet {
  uuid: string;
  name: string;
  rdns: string;
  icon?: string;
  provider: EIP1193Provider;
}

interface WalletContextValue {
  account: `0x${string}` | null;
  watchAddress: `0x${string}` | null;
  effectiveAddress: `0x${string}` | null;
  chainId: number | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
  isConnecting: boolean;
  walletError: string | null;
  discoveredWallets: DiscoveredWallet[];
  activeWalletName: string | null;
  walletBalances: WalletBalances | null;
  isBalancesLoading: boolean;
  plans: OnChainPlan[];
  telemetry: ProtocolTelemetry | null;
  isProtocolLoading: boolean;
  protocolError: string | null;
  isWalletModalOpen: boolean;
  isSwapModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  openSwapModal: () => void;
  closeSwapModal: () => void;
  connectWallet: (wallet?: DiscoveredWallet) => Promise<void>;
  disconnectWallet: () => void;
  setWatchAddress: (address: string | null) => void;
  switchToMezoTestnet: () => Promise<boolean>;
  refreshAll: () => Promise<void>;
  getSignerClient: () => Promise<{
    account: `0x${string}`;
    walletClient: ReturnType<typeof createWalletClient>;
  }>;
  sendApproveMusd: (amountWei: bigint) => Promise<`0x${string}`>;
  sendVaultTx: (
    functionName: string,
    args: any[],
    fallbackGas?: bigint
  ) => Promise<`0x${string}`>;
  sendSwapBtcToMusd: (
    btcAmountWei: bigint,
    minMusdOutWei: bigint
  ) => Promise<`0x${string}`>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const DISCONNECT_STORAGE_KEY = 'satsstack_wallet_disconnected';
const PROVIDER_RDNS_KEY = 'satsstack_wallet_rdns';

function detectInjectedName(eth: any): string {
  if (!eth) return 'Browser Wallet';
  if (eth.isRabby) return 'Rabby Wallet';
  if (eth.isMetaMask) return 'MetaMask';
  if (eth.isCoinbaseWallet) return 'Coinbase Wallet';
  if (eth.isOkxWallet || eth.isOKExWallet) return 'OKX Wallet';
  if (eth.isTaho) return 'Taho';
  return 'Browser Injected Wallet';
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [discoveredWallets, setDiscoveredWallets] = useState<DiscoveredWallet[]>([]);
  const [activeProvider, setActiveProvider] = useState<EIP1193Provider | null>(null);
  const [activeWalletName, setActiveWalletName] = useState<string | null>(null);

  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [watchAddress, setWatchAddressState] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [walletBalances, setWalletBalances] = useState<WalletBalances | null>(null);
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);

  const [plans, setPlans] = useState<OnChainPlan[]>([]);
  const [telemetry, setTelemetry] = useState<ProtocolTelemetry | null>(null);
  const [isProtocolLoading, setIsProtocolLoading] = useState(true);
  const [protocolError, setProtocolError] = useState<string | null>(null);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

  const initialAutoCheckedRef = useRef(false);

  const effectiveAddress = account ?? watchAddress;

  const refreshProtocol = useCallback(async () => {
    try {
      setProtocolError(null);
      const data = await fetchProtocolAndPlans();
      setPlans(data.plans);
      setTelemetry(data.telemetry);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to reach Mezo Testnet RPC.';
      setProtocolError(msg);
    } finally {
      setIsProtocolLoading(false);
    }
  }, []);

  const refreshBalances = useCallback(async (targetAddress: `0x${string}` | null) => {
    if (!targetAddress) {
      setWalletBalances(null);
      return;
    }
    try {
      setIsBalancesLoading(true);
      const data = await fetchWalletBalances(targetAddress);
      setWalletBalances(data);
    } catch {
      // Keep prior balances if a transient RPC glitch happens
    } finally {
      setIsBalancesLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshProtocol(), refreshBalances(effectiveAddress)]);
  }, [refreshProtocol, refreshBalances, effectiveAddress]);

  // Discover EIP-6963 wallets + window.ethereum cleanly without pre-connecting
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const map = new Map<string, DiscoveredWallet>();

    const syncList = () => {
      const list = Array.from(map.values());
      const winEth = (window as any).ethereum as EIP1193Provider | undefined;
      if (winEth) {
        const alreadyHasInjected = list.some((w) => w.provider === winEth);
        if (!alreadyHasInjected) {
          list.push({
            uuid: 'window-ethereum',
            name: detectInjectedName(winEth),
            rdns: 'injected.ethereum',
            provider: winEth,
          });
        }
      }
      setDiscoveredWallets(list);
    };

    const handleAnnounce = (event: any) => {
      const detail = event?.detail;
      if (!detail?.info?.uuid || !detail?.provider) return;
      map.set(detail.info.uuid, {
        uuid: detail.info.uuid,
        name: detail.info.name || 'Browser Wallet',
        rdns: detail.info.rdns || detail.info.uuid,
        icon: detail.info.icon,
        provider: detail.provider,
      });
      syncList();
    };

    window.addEventListener('eip6963:announceProvider', handleAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    syncList();

    return () => {
      window.removeEventListener('eip6963:announceProvider', handleAnnounce);
    };
  }, []);

  // Quietly restore authorized wallet ONLY if user already granted permission and did not disconnect
  useEffect(() => {
    if (initialAutoCheckedRef.current || discoveredWallets.length === 0) return;
    initialAutoCheckedRef.current = true;

    const explicitlyDisconnected =
      typeof window !== 'undefined' &&
      window.localStorage.getItem(DISCONNECT_STORAGE_KEY) === 'true';
    if (explicitlyDisconnected) return;

    const preferredRdns =
      typeof window !== 'undefined' ? window.localStorage.getItem(PROVIDER_RDNS_KEY) : null;
    const candidate =
      (preferredRdns && discoveredWallets.find((w) => w.rdns === preferredRdns)) ||
      discoveredWallets[0];

    if (!candidate) return;

    (async () => {
      try {
        const accounts = (await candidate.provider.request({
          method: 'eth_accounts',
        })) as string[];
        if (accounts && accounts.length > 0) {
          const hexChain = (await candidate.provider.request({
            method: 'eth_chainId',
          })) as string;
          setActiveProvider(candidate.provider);
          setActiveWalletName(candidate.name);
          setAccount(getAddress(accounts[0]));
          setChainId(parseInt(hexChain, 16));
          setWatchAddressState(null);
        }
      } catch {
        // Silent fallback stays disconnected
      }
    })();
  }, [discoveredWallets]);

  // Bind accountsChanged & chainChanged listeners on active EIP-1193 provider
  useEffect(() => {
    if (!activeProvider) return;
    const prov = activeProvider as any;
    if (typeof prov.on !== 'function') return;

    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setWalletBalances(null);
      } else {
        setAccount(getAddress(accounts[0]));
        setWatchAddressState(null);
      }
    };

    const onChainChanged = (hexChain: string) => {
      setChainId(parseInt(hexChain, 16));
    };

    prov.on('accountsChanged', onAccountsChanged);
    prov.on('chainChanged', onChainChanged);

    return () => {
      if (typeof prov.removeListener === 'function') {
        prov.removeListener('accountsChanged', onAccountsChanged);
        prov.removeListener('chainChanged', onChainChanged);
      }
    };
  }, [activeProvider]);

  // Initial + interval protocol load
  useEffect(() => {
    refreshProtocol();
    const timer = setInterval(refreshProtocol, 30000);
    return () => clearInterval(timer);
  }, [refreshProtocol]);

  // Balance load whenever effective address or chain changes
  useEffect(() => {
    refreshBalances(effectiveAddress);
  }, [effectiveAddress, chainId, refreshBalances]);

  const switchToMezoTestnet = useCallback(
    async (providerOverride?: EIP1193Provider): Promise<boolean> => {
      const targetProvider =
        providerOverride ??
        activeProvider ??
        ((typeof window !== 'undefined' ? (window as any).ethereum : null) as EIP1193Provider | null);

      if (!targetProvider) return false;
      try {
        await targetProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MEZO_TESTNET_CHAIN_ID_HEX }],
        });
        setChainId(MEZO_TESTNET_CHAIN_ID);
        return true;
      } catch (err: any) {
        if (err?.code === 4902 || String(err?.message || '').includes('Unrecognized chain')) {
          try {
            await targetProvider.request({
              method: 'wallet_addEthereumChain',
              params: [MEZO_TESTNET_CHAIN_PARAMS],
            });
            setChainId(MEZO_TESTNET_CHAIN_ID);
            return true;
          } catch (addErr: any) {
            setWalletError(
              addErr?.message || 'Unable to add Mezo Testnet (Chain 31611) to wallet.'
            );
            return false;
          }
        }
        setWalletError(
          err?.message || 'Please switch your wallet network to Mezo Testnet (Chain 31611).'
        );
        return false;
      }
    },
    [activeProvider]
  );

  const connectWallet = useCallback(
    async (chosen?: DiscoveredWallet) => {
      setWalletError(null);
      const target = chosen ?? discoveredWallets[0];
      const fallbackEth =
        typeof window !== 'undefined'
          ? ((window as any).ethereum as EIP1193Provider | undefined)
          : undefined;
      const provider = target?.provider ?? fallbackEth;

      if (!provider) {
        setWalletError(
          'No EVM browser wallet found. Install MetaMask or Rabby, or enter an address in Read-Only Watch Mode below.'
        );
        return;
      }

      setIsConnecting(true);
      try {
        const accounts = (await provider.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error('Wallet returned no accounts.');
        }

        const hexChain = (await provider.request({
          method: 'eth_chainId',
        })) as string;
        const currentChain = parseInt(hexChain, 16);

        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(DISCONNECT_STORAGE_KEY);
          if (target?.rdns) {
            window.localStorage.setItem(PROVIDER_RDNS_KEY, target.rdns);
          }
        }

        setActiveProvider(provider);
        setActiveWalletName(target?.name ?? detectInjectedName(provider));
        setAccount(getAddress(accounts[0]));
        setWatchAddressState(null);
        setChainId(currentChain);

        if (currentChain !== MEZO_TESTNET_CHAIN_ID) {
          await switchToMezoTestnet(provider);
        }

        setIsWalletModalOpen(false);
      } catch (err: any) {
        if (err?.code === 4001) {
          setWalletError('Connection request rejected in wallet.');
        } else {
          setWalletError(err?.message || 'Failed to connect browser wallet.');
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [discoveredWallets, switchToMezoTestnet]
  );

  const disconnectWallet = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISCONNECT_STORAGE_KEY, 'true');
    }
    setAccount(null);
    setWatchAddressState(null);
    setChainId(null);
    setActiveProvider(null);
    setActiveWalletName(null);
    setWalletBalances(null);
    setWalletError(null);
  }, []);

  const setWatchAddress = useCallback((rawAddress: string | null) => {
    if (!rawAddress || !rawAddress.trim()) {
      setWatchAddressState(null);
      return;
    }
    try {
      const normalized = getAddress(rawAddress.trim());
      setAccount(null);
      setWatchAddressState(normalized);
      setWalletError(null);
      setIsWalletModalOpen(false);
    } catch {
      setWalletError('Invalid EVM address format. Enter a 42-character 0x address.');
    }
  }, []);

  const getSignerClient = useCallback(async () => {
    if (!account || !activeProvider) {
      setIsWalletModalOpen(true);
      throw new Error('Connect a browser wallet to sign this transaction.');
    }

    const hexChain = (await activeProvider.request({
      method: 'eth_chainId',
    })) as string;
    const currentChain = parseInt(hexChain, 16);
    if (currentChain !== MEZO_TESTNET_CHAIN_ID) {
      const switched = await switchToMezoTestnet(activeProvider);
      if (!switched) {
        throw new Error('Please switch wallet network to Mezo Testnet (Chain ID 31611).');
      }
    }

    const walletClient = createWalletClient({
      account,
      chain: mezoTestnet,
      transport: custom(activeProvider),
    });

    return { account, walletClient };
  }, [account, activeProvider, switchToMezoTestnet]);

  const sendApproveMusd = useCallback(
    async (amountWei: bigint): Promise<`0x${string}`> => {
      const { account: signer, walletClient } = await getSignerClient();
      const gas = await estimateSafeGasLimit({
        address: CONTRACT_ADDRESSES.MUSD,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.SatsStackVault, amountWei],
        account: signer,
        fallbackGas: 120000n,
      });

      const hash = await walletClient.writeContract({
        account: signer,
        chain: mezoTestnet,
        address: CONTRACT_ADDRESSES.MUSD,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.SatsStackVault, amountWei],
        gas,
      });

      const receipt = await mezoPublicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error('MUSD approval transaction reverted on-chain.');
      }
      await waitForBlockSync(receipt.blockNumber);
      await refreshAll();
      return hash;
    },
    [getSignerClient, refreshAll]
  );

  const sendVaultTx = useCallback(
    async (
      functionName: string,
      args: any[],
      fallbackGas: bigint = 480000n
    ): Promise<`0x${string}`> => {
      const { account: signer, walletClient } = await getSignerClient();

      try {
        await mezoPublicClient.simulateContract({
          address: CONTRACT_ADDRESSES.SatsStackVault,
          abi: SATS_STACK_VAULT_ABI as any,
          functionName,
          args,
          account: signer,
        });
      } catch (simErr) {
        if (simErr instanceof BaseError) {
          const reverted = simErr.walk(
            (e) => e instanceof ContractFunctionRevertedError
          );
          if (reverted instanceof ContractFunctionRevertedError) {
            throw new Error(formatContractError(simErr));
          }
        }
      }

      const gas = await estimateSafeGasLimit({
        address: CONTRACT_ADDRESSES.SatsStackVault,
        abi: SATS_STACK_VAULT_ABI,
        functionName,
        args,
        account: signer,
        fallbackGas,
      });

      const hash = await walletClient.writeContract({
        account: signer,
        chain: mezoTestnet,
        address: CONTRACT_ADDRESSES.SatsStackVault,
        abi: SATS_STACK_VAULT_ABI as any,
        functionName,
        args,
        gas,
      });

      const receipt = await mezoPublicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error(`Vault transaction ${functionName} reverted on-chain.`);
      }
      await waitForBlockSync(receipt.blockNumber);
      await refreshAll();
      return hash;
    },
    [getSignerClient, refreshAll]
  );

  const sendSwapBtcToMusd = useCallback(
    async (btcAmountWei: bigint, minMusdOutWei: bigint): Promise<`0x${string}`> => {
      const { account: signer, walletClient } = await getSignerClient();

      const btcAllowance = (await mezoPublicClient.readContract({
        address: CONTRACT_ADDRESSES.NativeBtcGasToken,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [signer, CONTRACT_ADDRESSES.TigrisRouter],
      })) as bigint;

      if (btcAllowance < btcAmountWei) {
        const approveGas = await estimateSafeGasLimit({
          address: CONTRACT_ADDRESSES.NativeBtcGasToken,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.TigrisRouter, btcAmountWei * 10n],
          account: signer,
          fallbackGas: 120000n,
        });
        const approveHash = await walletClient.writeContract({
          account: signer,
          chain: mezoTestnet,
          address: CONTRACT_ADDRESSES.NativeBtcGasToken,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.TigrisRouter, btcAmountWei * 10n],
          gas: approveGas,
        });
        const approveReceipt = await mezoPublicClient.waitForTransactionReceipt({
          hash: approveHash,
        });
        await waitForBlockSync(approveReceipt.blockNumber);
      }

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const routes = [
        {
          from: CONTRACT_ADDRESSES.NativeBtcGasToken,
          to: CONTRACT_ADDRESSES.MUSD,
          stable: false,
          factory: CONTRACT_ADDRESSES.TigrisFactory,
        },
      ];

      const swapGas = await estimateSafeGasLimit({
        address: CONTRACT_ADDRESSES.TigrisRouter,
        abi: TIGRIS_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [btcAmountWei, minMusdOutWei, routes, signer, deadline],
        account: signer,
        fallbackGas: 350000n,
      });

      const swapHash = await walletClient.writeContract({
        account: signer,
        chain: mezoTestnet,
        address: CONTRACT_ADDRESSES.TigrisRouter,
        abi: TIGRIS_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [btcAmountWei, minMusdOutWei, routes, signer, deadline],
        gas: swapGas,
      });

      const receipt = await mezoPublicClient.waitForTransactionReceipt({ hash: swapHash });
      if (receipt.status !== 'success') {
        throw new Error('Tigris BTC to MUSD swap reverted on-chain.');
      }
      await waitForBlockSync(receipt.blockNumber);
      await refreshAll();
      return swapHash;
    },
    [getSignerClient, refreshAll]
  );

  const isConnected = account !== null;
  const isWrongNetwork = isConnected && chainId !== null && chainId !== MEZO_TESTNET_CHAIN_ID;

  const value = useMemo<WalletContextValue>(
    () => ({
      account,
      watchAddress,
      effectiveAddress,
      chainId,
      isConnected,
      isWrongNetwork,
      isConnecting,
      walletError,
      discoveredWallets,
      activeWalletName,
      walletBalances,
      isBalancesLoading,
      plans,
      telemetry,
      isProtocolLoading,
      protocolError,
      isWalletModalOpen,
      isSwapModalOpen,
      openWalletModal: () => setIsWalletModalOpen(true),
      closeWalletModal: () => {
        setIsWalletModalOpen(false);
        setWalletError(null);
      },
      openSwapModal: () => setIsSwapModalOpen(true),
      closeSwapModal: () => setIsSwapModalOpen(false),
      connectWallet,
      disconnectWallet,
      setWatchAddress,
      switchToMezoTestnet: () => switchToMezoTestnet(),
      refreshAll,
      getSignerClient,
      sendApproveMusd,
      sendVaultTx,
      sendSwapBtcToMusd,
    }),
    [
      account,
      watchAddress,
      effectiveAddress,
      chainId,
      isConnected,
      isWrongNetwork,
      isConnecting,
      walletError,
      discoveredWallets,
      activeWalletName,
      walletBalances,
      isBalancesLoading,
      plans,
      telemetry,
      isProtocolLoading,
      protocolError,
      isWalletModalOpen,
      isSwapModalOpen,
      connectWallet,
      disconnectWallet,
      setWatchAddress,
      switchToMezoTestnet,
      refreshAll,
      getSignerClient,
      sendApproveMusd,
      sendVaultTx,
      sendSwapBtcToMusd,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used inside WalletProvider');
  }
  return ctx;
}
