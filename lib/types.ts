export type PlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface TrancheFill {
  trancheNumber: number;
  blockNumber: number;
  timestampUnix: number;
  timestamp: string;
  musdSpent: number;
  btcAcquired: number;
  executionPrice: number;
  txHash: `0x${string}`;
}

export interface LifecycleEvent {
  type:
    | 'PlanCreated'
    | 'TrancheExecuted'
    | 'PlanTopUp'
    | 'PlanPaused'
    | 'PlanResumed'
    | 'PlanCancelled'
    | 'BtcClaimed'
    | 'BtcRoutedToTrove'
    | 'TroveCircuitTripped';
  blockNumber: number;
  timestampUnix: number;
  timestamp: string;
  txHash: `0x${string}`;
  summary: string;
}

export interface TroveHealthInfo {
  borrower: `0x${string}`;
  hasActiveTrove: boolean;
  statusCode: number;
  icrPercent: number | null;
  collBtc: number;
  debtMusd: number;
}

export interface OnChainPlan {
  id: number;
  owner: `0x${string}`;
  status: PlanStatus;
  totalBudgetMusd: number;
  totalBudgetWei: bigint;
  remainingMusd: number;
  remainingWei: bigint;
  trancheSizeMusd: number;
  trancheSizeWei: bigint;
  intervalSeconds: number;
  nextExecutionTime: number;
  stackedBtc: number;
  stackedBtcWei: bigint;
  troveSafeFloorIcr: number;
  totalTranches: number;
  executedTranches: number;
  createdAtUnix: number;
  createdAt: string;
  ownerTrove: TroveHealthInfo;
  weightedAvgEntryPrice: number | null;
  proRataSmusdShareMusd: number;
  fills: TrancheFill[];
  events: LifecycleEvent[];
}

export interface ProtocolTelemetry {
  blockNumber: bigint;
  oracleBtcPrice: number;
  tigrisSpotPrice: number;
  vaultSmusdBalanceMusd: number;
  vaultClaimableYieldMusd: number;
  vaultNativeBtc: number;
  nextPlanId: number;
}

export interface WalletBalances {
  address: `0x${string}`;
  btcBalance: number;
  btcBalanceWei: bigint;
  musdBalance: number;
  musdBalanceWei: bigint;
  musdAllowance: number;
  musdAllowanceWei: bigint;
  trove: TroveHealthInfo;
}
