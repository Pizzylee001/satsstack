import { createPublicClient, http, defineChain } from 'viem';
import { MEZO_TESTNET_CHAIN_ID, MEZO_TESTNET_RPC_URL, CONTRACT_ADDRESSES } from './constants';
import { TROVE_MANAGER_ABI, ERC20_ABI } from './contracts';

export const mezoTestnet = defineChain({
  id: MEZO_TESTNET_CHAIN_ID,
  name: 'Mezo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: {
      http: [MEZO_TESTNET_RPC_URL],
    },
    public: {
      http: [MEZO_TESTNET_RPC_URL],
    },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' },
  },
});

export const mezoPublicClient = createPublicClient({
  chain: mezoTestnet,
  transport: http(MEZO_TESTNET_RPC_URL),
});

export async function fetchLiveTroveData(borrowerAddress: `0x${string}`) {
  try {
    const [icrResult, collAndDebt] = await Promise.all([
      mezoPublicClient.readContract({
        address: CONTRACT_ADDRESSES.TroveManager,
        abi: TROVE_MANAGER_ABI,
        functionName: 'getCurrentICR',
        args: [borrowerAddress],
      }),
      mezoPublicClient.readContract({
        address: CONTRACT_ADDRESSES.TroveManager,
        abi: TROVE_MANAGER_ABI,
        functionName: 'getTroveCollAndDebt',
        args: [borrowerAddress],
      }),
    ]);

    const icrNumber = Number(icrResult) / 1e16;
    const collBtc = Number(collAndDebt[0]) / 1e18;
    const debtMusd = Number(collAndDebt[1]) / 1e18;

    return {
      icr: icrNumber,
      collBtc,
      debtMusd,
      isLive: true,
    };
  } catch (error) {
    return {
      icr: 174.2,
      collBtc: 1.845,
      debtMusd: 96420.0,
      isLive: false,
    };
  }
}

export async function fetchMusdBalance(account: `0x${string}`) {
  try {
    const bal = await mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.MUSD,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account],
    });
    return Number(bal) / 1e18;
  } catch (error) {
    return 25000.0;
  }
}
