import {
  createPublicClient,
  http,
  defineChain,
  encodeFunctionData,
  decodeFunctionResult,
  parseEther,
  formatEther,
  parseAbiItem,
  decodeEventLog,
  zeroAddress,
  BaseError,
  ContractFunctionRevertedError,
} from 'viem';
import {
  MEZO_TESTNET_CHAIN_ID,
  MEZO_TESTNET_RPC_URL,
  MEZO_EXPLORER_URL,
  CONTRACT_ADDRESSES,
  SATSSTACK_DEPLOY_BLOCK,
} from './constants';
import {
  SATS_STACK_VAULT_ABI,
  ERC20_ABI,
  SMUSD_ABI,
  PRICE_FEED_ABI,
  TIGRIS_ROUTER_ABI,
  TROVE_MANAGER_ABI,
  MULTICALL3_ABI,
} from './contracts';
import type {
  OnChainPlan,
  PlanStatus,
  TrancheFill,
  LifecycleEvent,
  TroveHealthInfo,
  ProtocolTelemetry,
  WalletBalances,
} from './types';

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
    default: { name: 'Mezo Explorer', url: MEZO_EXPLORER_URL },
  },
});

function getPublicRpcUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/rpc`;
  }
  return MEZO_TESTNET_RPC_URL;
}

export const mezoPublicClient = createPublicClient({
  chain: mezoTestnet,
  transport: http(getPublicRpcUrl()),
});

const STATUS_MAP: Record<number, PlanStatus> = {
  0: 'ACTIVE',
  1: 'PAUSED',
  2: 'COMPLETED',
  3: 'CANCELLED',
};

const UINT256_MAX_THRESHOLD = BigInt(
  '1000000000000000000000000000000000000000'
);

export function formatUtcDate(unixSeconds: number): string {
  if (!unixSeconds || unixSeconds <= 0) return 'N/A';
  const d = new Date(unixSeconds * 1000);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hrs = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  const secs = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hrs}:${mins}:${secs} UTC`;
}

export async function waitForBlockSync(targetBlock: bigint): Promise<void> {
  for (let i = 0; i < 6; i++) {
    const current = await mezoPublicClient.getBlockNumber().catch(() => 0n);
    if (current >= targetBlock) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

async function fetchOracleAndSpotPrice(): Promise<{
  oraclePriceWei: bigint;
  oraclePriceUsd: number;
  tigrisSpotPriceUsd: number;
}> {
  const [priceRes, quoteRes] = await Promise.allSettled([
    mezoPublicClient.simulateContract({
      address: CONTRACT_ADDRESSES.PriceFeed,
      abi: PRICE_FEED_ABI,
      functionName: 'fetchPrice',
    }),
    mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.TigrisRouter,
      abi: TIGRIS_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [
        parseEther('100'),
        [
          {
            from: CONTRACT_ADDRESSES.MUSD,
            to: CONTRACT_ADDRESSES.NativeBtcGasToken,
            stable: false,
            factory: CONTRACT_ADDRESSES.TigrisFactory,
          },
        ],
      ],
    }),
  ]);

  let oraclePriceWei = parseEther('65000');
  let oraclePriceUsd = 0;
  if (priceRes.status === 'fulfilled' && priceRes.value.result > 0n) {
    oraclePriceWei = priceRes.value.result;
    oraclePriceUsd = Number(formatEther(oraclePriceWei));
  }

  let tigrisSpotPriceUsd = oraclePriceUsd;
  if (quoteRes.status === 'fulfilled' && quoteRes.value.length >= 2) {
    const btcOut = Number(formatEther(quoteRes.value[1]));
    if (btcOut > 0) {
      tigrisSpotPriceUsd = 100 / btcOut;
    }
  }

  if (oraclePriceUsd === 0 && tigrisSpotPriceUsd > 0) {
    oraclePriceUsd = tigrisSpotPriceUsd;
    oraclePriceWei = parseEther(tigrisSpotPriceUsd.toFixed(6));
  }

  return { oraclePriceWei, oraclePriceUsd, tigrisSpotPriceUsd };
}

async function fetchTroveHealthBatch(
  owners: `0x${string}`[],
  oraclePriceWei: bigint
): Promise<Map<string, TroveHealthInfo>> {
  const resultMap = new Map<string, TroveHealthInfo>();
  if (owners.length === 0) return resultMap;

  const calls: { target: `0x${string}`; allowFailure: boolean; callData: `0x${string}` }[] = [];
  for (const owner of owners) {
    calls.push({
      target: CONTRACT_ADDRESSES.TroveManager,
      allowFailure: true,
      callData: encodeFunctionData({
        abi: TROVE_MANAGER_ABI,
        functionName: 'getTroveStatus',
        args: [owner],
      }),
    });
    calls.push({
      target: CONTRACT_ADDRESSES.TroveManager,
      allowFailure: true,
      callData: encodeFunctionData({
        abi: TROVE_MANAGER_ABI,
        functionName: 'getEntireDebtAndColl',
        args: [owner],
      }),
    });
    calls.push({
      target: CONTRACT_ADDRESSES.TroveManager,
      allowFailure: true,
      callData: encodeFunctionData({
        abi: TROVE_MANAGER_ABI,
        functionName: 'getCurrentICR',
        args: [owner, oraclePriceWei],
      }),
    });
  }

  const agg = await mezoPublicClient.readContract({
    address: CONTRACT_ADDRESSES.Multicall3,
    abi: MULTICALL3_ABI,
    functionName: 'aggregate3',
    args: [calls],
  });

  for (let i = 0; i < owners.length; i++) {
    const owner = owners[i];
    const statusRes = agg[i * 3];
    const debtCollRes = agg[i * 3 + 1];
    const icrRes = agg[i * 3 + 2];

    let statusCode = 0;
    if (statusRes.success) {
      statusCode = Number(
        decodeFunctionResult({
          abi: TROVE_MANAGER_ABI,
          functionName: 'getTroveStatus',
          data: statusRes.returnData,
        })
      );
    }

    let debtMusd = 0;
    let collBtc = 0;
    if (debtCollRes.success) {
      const decoded = decodeFunctionResult({
        abi: TROVE_MANAGER_ABI,
        functionName: 'getEntireDebtAndColl',
        data: debtCollRes.returnData,
      }) as readonly [bigint, bigint, bigint, bigint];
      debtMusd = Number(formatEther(decoded[0]));
      collBtc = Number(formatEther(decoded[1]));
    }

    let icrPercent: number | null = null;
    if (statusCode === 1 && icrRes.success) {
      const rawIcr = decodeFunctionResult({
        abi: TROVE_MANAGER_ABI,
        functionName: 'getCurrentICR',
        data: icrRes.returnData,
      }) as bigint;
      if (rawIcr < UINT256_MAX_THRESHOLD) {
        icrPercent = Number(rawIcr) / 1e16;
      }
    }

    resultMap.set(owner.toLowerCase(), {
      borrower: owner,
      hasActiveTrove: statusCode === 1,
      statusCode,
      icrPercent,
      collBtc,
      debtMusd,
    });
  }

  return resultMap;
}

async function fetchVaultEvents(
  latestBlock: bigint
): Promise<{
  fillsByPlan: Map<number, TrancheFill[]>;
  eventsByPlan: Map<number, LifecycleEvent[]>;
}> {
  const fillsByPlan = new Map<number, TrancheFill[]>();
  const eventsByPlan = new Map<number, LifecycleEvent[]>();

  const chunkSize = 10000n;
  const rawLogs: any[] = [];
  for (let start = SATSSTACK_DEPLOY_BLOCK; start <= latestBlock; start += chunkSize) {
    const end = start + chunkSize - 1n > latestBlock ? latestBlock : start + chunkSize - 1n;
    const batch = await mezoPublicClient.getLogs({
      address: CONTRACT_ADDRESSES.SatsStackVault,
      fromBlock: start,
      toBlock: end,
    });
    rawLogs.push(...batch);
  }

  const uniqueBlocks = Array.from(
    new Set(rawLogs.map((l) => l.blockNumber).filter((b): b is bigint => typeof b === 'bigint'))
  );

  const blockTimestamps = new Map<string, number>();
  if (uniqueBlocks.length > 0) {
    const blocks = await Promise.all(
      uniqueBlocks.map((blockNumber) =>
        mezoPublicClient.getBlock({ blockNumber }).catch(() => null)
      )
    );
    blocks.forEach((blk, idx) => {
      if (blk) {
        blockTimestamps.set(uniqueBlocks[idx].toString(), Number(blk.timestamp));
      }
    });
  }

  const eventsWithOrder = new Map<number, (LifecycleEvent & { logIndex: number })[]>();

  for (const log of rawLogs) {
    try {
      const decoded = decodeEventLog({
        abi: SATS_STACK_VAULT_ABI as any,
        data: log.data,
        topics: log.topics,
      }) as { eventName: string; args: Record<string, any> };

      const planIdNum = Number(decoded.args?.planId ?? -1);
      if (planIdNum < 0) continue;

      const blockNum = Number(log.blockNumber ?? 0n);
      const logIdx = Number(log.logIndex ?? 0);
      const tsUnix = blockTimestamps.get(String(log.blockNumber ?? '0')) ?? 0;
      const tsFormatted = formatUtcDate(tsUnix);
      const txHash = log.transactionHash as `0x${string}`;

      if (!fillsByPlan.has(planIdNum)) fillsByPlan.set(planIdNum, []);
      if (!eventsWithOrder.has(planIdNum)) eventsWithOrder.set(planIdNum, []);

      let summary = decoded.eventName;

      if (decoded.eventName === 'TrancheExecuted') {
        const musdSpent = Number(formatEther(decoded.args.musdSpent as bigint));
        const btcAcquired = Number(formatEther(decoded.args.btcReceived as bigint));
        const executionPrice = btcAcquired > 0 ? musdSpent / btcAcquired : 0;
        const trancheNum = Number(decoded.args.trancheIndex);

        fillsByPlan.get(planIdNum)!.push({
          trancheNumber: trancheNum,
          blockNumber: blockNum,
          timestampUnix: tsUnix,
          timestamp: tsFormatted,
          musdSpent,
          btcAcquired,
          executionPrice,
          txHash,
        });
        summary = `Executed tranche #${trancheNum}: swapped ${musdSpent.toFixed(2)} MUSD for ${btcAcquired.toFixed(6)} BTC`;
      } else if (decoded.eventName === 'PlanCreated') {
        const budget = Number(formatEther(decoded.args.totalBudgetMusd as bigint));
        const tranche = Number(formatEther(decoded.args.trancheSizeMusd as bigint));
        summary = `Created plan with ${budget.toFixed(2)} MUSD (${tranche.toFixed(2)} MUSD per tranche)`;
      } else if (decoded.eventName === 'PlanTopUp') {
        const added = Number(formatEther(decoded.args.additionalMusd as bigint));
        summary = `Added ${added.toFixed(2)} MUSD into sMUSD reserve`;
      } else if (decoded.eventName === 'PlanPaused') {
        summary = 'Plan paused by owner';
      } else if (decoded.eventName === 'PlanResumed') {
        summary = 'Plan resumed by owner';
      } else if (decoded.eventName === 'PlanCancelled') {
        const refunded = Number(formatEther(decoded.args.refundedMusd as bigint));
        const btc = Number(formatEther(decoded.args.claimedBtc as bigint));
        summary = `Cancelled plan: withdrew ${refunded.toFixed(2)} MUSD and ${btc.toFixed(6)} BTC`;
      } else if (decoded.eventName === 'BtcClaimed') {
        const btc = Number(formatEther(decoded.args.amountBtc as bigint));
        summary = `Claimed ${btc.toFixed(6)} BTC to wallet`;
      } else if (decoded.eventName === 'BtcRoutedToTrove') {
        const btc = Number(formatEther(decoded.args.amountBtc as bigint));
        summary = `Routed ${btc.toFixed(6)} BTC toward Trove collateral`;
      } else if (decoded.eventName === 'TroveCircuitTripped') {
        const currentIcr = Number(decoded.args.currentIcr as bigint) / 1e16;
        const floor = Number(decoded.args.minIcrFloor as bigint) / 1e16;
        summary = `Circuit tripped at ${currentIcr.toFixed(1)}% ICR (below ${floor.toFixed(0)}% floor)`;
      }

      eventsWithOrder.get(planIdNum)!.push({
        type: decoded.eventName as LifecycleEvent['type'],
        blockNumber: blockNum,
        timestampUnix: tsUnix,
        timestamp: tsFormatted,
        txHash,
        summary,
        logIndex: logIdx,
      });
    } catch {
      // Skip unrelated event signatures
    }
  }

  for (const fills of fillsByPlan.values()) {
    fills.sort((a, b) => a.trancheNumber - b.trancheNumber);
  }
  for (const [pid, evs] of eventsWithOrder.entries()) {
    evs.sort((a, b) => (b.blockNumber !== a.blockNumber ? b.blockNumber - a.blockNumber : b.logIndex - a.logIndex));
    eventsByPlan.set(
      pid,
      evs.map(({ logIndex: _ignored, ...rest }) => rest)
    );
  }

  return { fillsByPlan, eventsByPlan };
}

function buildOnChainPlanObject(
  raw: any,
  ownerTrove: TroveHealthInfo,
  fills: TrancheFill[],
  events: LifecycleEvent[],
  totalActiveBudgetAcrossPlans: number,
  vaultSmusdBalanceMusd: number
): OnChainPlan {
  const id = Number(raw.id);
  const owner = raw.owner as `0x${string}`;
  const totalBudgetWei = raw.totalBudgetMusd as bigint;
  const remainingWei = raw.remainingBudgetMusd as bigint;
  const trancheSizeWei = raw.trancheSizeMusd as bigint;
  const stackedBtcWei = raw.accumulatedBtc as bigint;

  const totalBudgetMusd = Number(formatEther(totalBudgetWei));
  const remainingMusd = Number(formatEther(remainingWei));
  const trancheSizeMusd = Number(formatEther(trancheSizeWei));
  const stackedBtc = Number(formatEther(stackedBtcWei));
  const intervalSeconds = Number(raw.intervalSeconds);
  const nextExecutionTime = Number(raw.nextExecutionTime);
  const troveSafeFloorIcr = Number(raw.minIcrFloor) / 1e16;
  const totalTranches = Number(raw.totalTranches);
  const executedTranches = Number(raw.executedTranches);
  const createdAtUnix = Number(raw.createdAt);
  const status = STATUS_MAP[Number(raw.status)] ?? 'ACTIVE';

  const totalSpentFromFills = fills.reduce((acc, f) => acc + f.musdSpent, 0);
  const totalBtcFromFills = fills.reduce((acc, f) => acc + f.btcAcquired, 0);
  const weightedAvgEntryPrice =
    totalBtcFromFills > 0 ? totalSpentFromFills / totalBtcFromFills : null;

  const proRataSmusdShareMusd =
    totalActiveBudgetAcrossPlans > 0
      ? (remainingMusd / totalActiveBudgetAcrossPlans) * vaultSmusdBalanceMusd
      : remainingMusd;

  return {
    id,
    owner,
    status,
    totalBudgetMusd,
    totalBudgetWei,
    remainingMusd,
    remainingWei,
    trancheSizeMusd,
    trancheSizeWei,
    intervalSeconds,
    nextExecutionTime,
    stackedBtc,
    stackedBtcWei,
    troveSafeFloorIcr,
    totalTranches,
    executedTranches,
    createdAtUnix,
    createdAt: formatUtcDate(createdAtUnix),
    ownerTrove,
    weightedAvgEntryPrice,
    proRataSmusdShareMusd,
    fills,
    events,
  };
}

export async function fetchProtocolAndPlans(): Promise<{
  telemetry: ProtocolTelemetry;
  plans: OnChainPlan[];
}> {
  const [
    blockNumber,
    nextPlanIdRaw,
    priceInfo,
    smusdBalRaw,
    claimableYieldRaw,
    vaultNativeBtcRaw,
  ] = await Promise.all([
    mezoPublicClient.getBlockNumber(),
    mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.SatsStackVault,
      abi: SATS_STACK_VAULT_ABI,
      functionName: 'nextPlanId',
    }) as Promise<bigint>,
    fetchOracleAndSpotPrice(),
    mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.sMUSD,
      abi: SMUSD_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESSES.SatsStackVault],
    }) as Promise<bigint>,
    mezoPublicClient
      .readContract({
        address: CONTRACT_ADDRESSES.sMUSD,
        abi: SMUSD_ABI,
        functionName: 'claimableYield',
        args: [CONTRACT_ADDRESSES.SatsStackVault],
      })
      .catch(() => 0n) as Promise<bigint>,
    mezoPublicClient.getBalance({ address: CONTRACT_ADDRESSES.SatsStackVault }),
  ]);

  const nextPlanId = Number(nextPlanIdRaw);
  const vaultSmusdBalanceMusd = Number(formatEther(smusdBalRaw));
  const vaultClaimableYieldMusd = Number(formatEther(claimableYieldRaw));
  const vaultNativeBtc = Number(formatEther(vaultNativeBtcRaw));

  const telemetry: ProtocolTelemetry = {
    blockNumber,
    oracleBtcPrice: priceInfo.oraclePriceUsd,
    tigrisSpotPrice: priceInfo.tigrisSpotPriceUsd,
    vaultSmusdBalanceMusd,
    vaultClaimableYieldMusd,
    vaultNativeBtc,
    nextPlanId,
  };

  if (nextPlanId <= 0) {
    return { telemetry, plans: [] };
  }

  const planCalls = Array.from({ length: nextPlanId }, (_, i) => ({
    target: CONTRACT_ADDRESSES.SatsStackVault,
    allowFailure: true,
    callData: encodeFunctionData({
      abi: SATS_STACK_VAULT_ABI as any,
      functionName: 'getPlan',
      args: [BigInt(i)],
    }),
  }));

  const [planResults, logsData] = await Promise.all([
    mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.Multicall3,
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3',
      args: [planCalls],
    }),
    fetchVaultEvents(blockNumber),
  ]);

  const decodedPlans: any[] = [];
  for (let i = 0; i < planResults.length; i++) {
    const r = planResults[i];
    if (!r.success) continue;
    const planStruct = decodeFunctionResult({
      abi: SATS_STACK_VAULT_ABI as any,
      functionName: 'getPlan',
      data: r.returnData,
    }) as any;
    if (planStruct && planStruct.owner && planStruct.owner !== zeroAddress) {
      decodedPlans.push(planStruct);
    }
  }

  const uniqueOwners = Array.from(
    new Set(decodedPlans.map((p) => p.owner as `0x${string}`))
  );
  const troveMap = await fetchTroveHealthBatch(uniqueOwners, priceInfo.oraclePriceWei);

  const totalActiveRemaining = decodedPlans.reduce(
    (sum, p) => sum + Number(formatEther(p.remainingBudgetMusd as bigint)),
    0
  );

  const plans = decodedPlans.map((raw) => {
    const pid = Number(raw.id);
    const ownerAddr = (raw.owner as string).toLowerCase();
    const troveInfo: TroveHealthInfo = troveMap.get(ownerAddr) ?? {
      borrower: raw.owner,
      hasActiveTrove: false,
      statusCode: 0,
      icrPercent: null,
      collBtc: 0,
      debtMusd: 0,
    };

    return buildOnChainPlanObject(
      raw,
      troveInfo,
      logsData.fillsByPlan.get(pid) ?? [],
      logsData.eventsByPlan.get(pid) ?? [],
      totalActiveRemaining,
      vaultSmusdBalanceMusd
    );
  });

  plans.sort((a, b) => b.id - a.id);

  return { telemetry, plans };
}

export async function fetchSingleOnChainPlan(planId: number): Promise<{
  plan: OnChainPlan | null;
  telemetry: ProtocolTelemetry;
}> {
  const { telemetry, plans } = await fetchProtocolAndPlans();
  const plan = plans.find((p) => p.id === planId) ?? null;
  return { plan, telemetry };
}

export async function fetchWalletBalances(
  address: `0x${string}`
): Promise<WalletBalances> {
  const [btcBalanceWei, priceInfo, agg] = await Promise.all([
    mezoPublicClient.getBalance({ address }),
    fetchOracleAndSpotPrice(),
    mezoPublicClient.readContract({
      address: CONTRACT_ADDRESSES.Multicall3,
      abi: MULTICALL3_ABI,
      functionName: 'aggregate3',
      args: [
        [
          {
            target: CONTRACT_ADDRESSES.MUSD,
            allowFailure: true,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address],
            }),
          },
          {
            target: CONTRACT_ADDRESSES.MUSD,
            allowFailure: true,
            callData: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [address, CONTRACT_ADDRESSES.SatsStackVault],
            }),
          },
        ],
      ],
    }),
  ]);

  const troveMap = await fetchTroveHealthBatch([address], priceInfo.oraclePriceWei);

  let musdBalanceWei = 0n;
  if (agg[0].success) {
    musdBalanceWei = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      data: agg[0].returnData,
    }) as bigint;
  }

  let musdAllowanceWei = 0n;
  if (agg[1].success) {
    musdAllowanceWei = decodeFunctionResult({
      abi: ERC20_ABI,
      functionName: 'allowance',
      data: agg[1].returnData,
    }) as bigint;
  }

  return {
    address,
    btcBalance: Number(formatEther(btcBalanceWei)),
    btcBalanceWei,
    musdBalance: Number(formatEther(musdBalanceWei)),
    musdBalanceWei,
    musdAllowance: Number(formatEther(musdAllowanceWei)),
    musdAllowanceWei,
    trove: troveMap.get(address.toLowerCase()) ?? {
      borrower: address,
      hasActiveTrove: false,
      statusCode: 0,
      icrPercent: null,
      collBtc: 0,
      debtMusd: 0,
    },
  };
}

export async function getTigrisSwapQuote(
  amountInWei: bigint,
  direction: 'MUSD_TO_BTC' | 'BTC_TO_MUSD'
): Promise<bigint> {
  if (amountInWei <= 0n) return 0n;
  const from =
    direction === 'MUSD_TO_BTC'
      ? CONTRACT_ADDRESSES.MUSD
      : CONTRACT_ADDRESSES.NativeBtcGasToken;
  const to =
    direction === 'MUSD_TO_BTC'
      ? CONTRACT_ADDRESSES.NativeBtcGasToken
      : CONTRACT_ADDRESSES.MUSD;

  const amounts = await mezoPublicClient.readContract({
    address: CONTRACT_ADDRESSES.TigrisRouter,
    abi: TIGRIS_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [
      amountInWei,
      [{ from, to, stable: false, factory: CONTRACT_ADDRESSES.TigrisFactory }],
    ],
  });

  return amounts[amounts.length - 1] ?? 0n;
}

export async function estimateSafeGasLimit(params: {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args: any[];
  account: `0x${string}`;
  fallbackGas?: bigint;
}): Promise<bigint> {
  const minFloor = params.fallbackGas ?? 280000n;
  try {
    const est = await mezoPublicClient.estimateContractGas({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args,
      account: params.account,
    });
    const buffered = (est * 125n) / 100n;
    return buffered > minFloor ? buffered : minFloor;
  } catch {
    return minFloor;
  }
}

export function formatContractError(err: unknown): string {
  if (!err) return 'Transaction failed.';

  if (err instanceof BaseError) {
    const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName === 'TroveUnsafe') {
        return 'Safety circuit tripped: borrower Trove ICR is below the plan safety floor. MUSD remains protected inside sMUSD.';
      }
      if (errorName === 'TrancheNotDue') {
        return 'Tranche is not due yet. Wait for the cadence interval timer to finish.';
      }
      if (errorName === 'NotPlanOwner') {
        return 'Wallet signature rejected: only the plan owner address can execute this management action.';
      }
      if (errorName === 'PlanNotActive') {
        return 'Plan is not active. Resume or check plan status before proceeding.';
      }
      if (errorName === 'PlanNotPaused') {
        return 'Plan is already active.';
      }
      if (errorName === 'InsufficientBalance') {
        return 'Insufficient stacked BTC balance inside this plan to withdraw or route.';
      }
      if (errorName === 'InvalidTrancheParameters') {
        return 'Invalid parameters: tranche size must be greater than 0 and not exceed total MUSD budget.';
      }
      if (errorName === 'TransferFailed') {
        return 'MUSD transfer failed. Check your wallet MUSD balance and vault allowance.';
      }
      if (errorName) {
        return `Contract reverted with ${errorName}.`;
      }
    }
    if (err.shortMessage) {
      if (err.shortMessage.toLowerCase().includes('user rejected')) {
        return 'Transaction cancelled in wallet.';
      }
      return err.shortMessage;
    }
  }

  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes('user rejected') || msg.includes('4001')) {
    return 'Transaction cancelled in wallet.';
  }
  if (msg.toLowerCase().includes('insufficient funds')) {
    return 'Insufficient Testnet BTC balance for transaction fees. Claim Testnet BTC from faucet.test.mezo.org.';
  }
  return msg.length > 180 ? `${msg.slice(0, 177)}...` : msg;
}
