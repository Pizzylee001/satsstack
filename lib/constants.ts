export const MEZO_TESTNET_CHAIN_ID = 31611;
export const MEZO_TESTNET_CHAIN_ID_HEX = '0x7b7b';
export const MEZO_TESTNET_RPC_URL = 'https://rpc.test.mezo.org';
export const MEZO_EXPLORER_URL = 'https://explorer.test.mezo.org';
export const MEZO_FAUCET_URL = 'https://faucet.test.mezo.org';
export const SATSSTACK_DEPLOY_BLOCK = 16793290n;

export const MEZO_TESTNET_CHAIN_PARAMS = {
  chainId: MEZO_TESTNET_CHAIN_ID_HEX,
  chainName: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: [MEZO_TESTNET_RPC_URL],
  blockExplorerUrls: [MEZO_EXPLORER_URL],
};

export const CONTRACT_ADDRESSES = {
  MUSD: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503' as `0x${string}`,
  sMUSD: '0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16' as `0x${string}`,
  TigrisRouter: '0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9' as `0x${string}`,
  TigrisFactory: '0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A' as `0x${string}`,
  BasicPool: '0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9' as `0x${string}`,
  NativeBtcGasToken: '0x7b7C000000000000000000000000000000000000' as `0x${string}`,
  TroveManager: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0' as `0x${string}`,
  PriceFeed: '0x86bCF0841622a5dAC14A313a15f96A95421b9366' as `0x${string}`,
  BorrowerOperations: '0x484439C27419a20ffb1c1fa16fA68c07B71391d8' as `0x${string}`,
  Multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
  SatsStackVault: '0x9f2f599fb96a8f743bbeb551138a09cdf15926b6' as `0x${string}`,
};

export const TROVE_SAFETY_DEFAULTS = {
  MIN_SAFE_ICR: 150,
  LIQUIDATION_CRITICAL_ICR: 110,
  DEFAULT_TARGET_ICR: 180,
  AUTO_PAUSE_FLOOR: 150,
};

export const INTERVAL_PRESETS = [
  { label: '60s Demo', value: 60, description: 'Rapid 1-minute execution cadence for testing' },
  { label: '1h', value: 3600, description: 'Hourly accumulation tranche' },
  { label: '1d', value: 86400, description: 'Daily accumulation tranche' },
  { label: '7d', value: 604800, description: 'Weekly accumulation tranche' },
];

export const SLIPPAGE_PRESETS = [
  { label: '0.1%', value: 0.1 },
  { label: '0.5%', value: 0.5 },
  { label: '1.0%', value: 1.0 },
];
