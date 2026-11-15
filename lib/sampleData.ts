export interface TrancheFill {
  trancheNumber: number;
  timestamp: string;
  musdSpent: number;
  btcAcquired: number;
  executionPrice: number;
  txHash: string;
}

export interface AccumulationPlan {
  id: number;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  owner: string;
  totalBudgetMusd: number;
  remainingMusd: number;
  stackedBtc: number;
  trancheSizeMusd: number;
  intervalSeconds: number;
  nextExecutionTime: number;
  troveSafeFloorIcr: number;
  borrowerCurrentIcr: number;
  weightedAvgEntryPrice: number;
  liveOracleBtcPrice: number;
  accruedYieldMusd: number;
  createdAt: string;
  fills: TrancheFill[];
}

export const SAMPLE_PLANS: AccumulationPlan[] = [
  {
    id: 0,
    name: 'Live On-Chain Seeded Stack',
    status: 'ACTIVE',
    owner: '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde',
    totalBudgetMusd: 50,
    remainingMusd: 40,
    stackedBtc: 0.000128398,
    trancheSizeMusd: 10,
    intervalSeconds: 60,
    nextExecutionTime: Math.floor(Date.now() / 1000) + 55,
    troveSafeFloorIcr: 150,
    borrowerCurrentIcr: 174.2,
    weightedAvgEntryPrice: 94820,
    liveOracleBtcPrice: 95420,
    accruedYieldMusd: 0.15,
    createdAt: '2026-11-15T09:14:13Z',
    fills: [
      {
        trancheNumber: 1,
        timestamp: '2026-11-15 09:15:30 UTC',
        musdSpent: 10,
        btcAcquired: 0.000128398,
        executionPrice: 94820,
        txHash: '0x1f5493e0475b786c13261a1f37509322a8e03a77dfef37065138ea71f30441e2',
      },
    ],
  },
  {
    id: 1,
    name: 'Active Mezo Borrower Stack',
    status: 'ACTIVE',
    owner: '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde',
    totalBudgetMusd: 12000,
    remainingMusd: 6500,
    stackedBtc: 0.058142,
    trancheSizeMusd: 500,
    intervalSeconds: 60,
    nextExecutionTime: Math.floor(Date.now() / 1000) + 42,
    troveSafeFloorIcr: 150,
    borrowerCurrentIcr: 174.2,
    weightedAvgEntryPrice: 94580,
    liveOracleBtcPrice: 95420,
    accruedYieldMusd: 38.64,
    createdAt: '2026-11-14T10:30:00Z',
    fills: [
      {
        trancheNumber: 1,
        timestamp: '2026-11-14 10:31:00 UTC',
        musdSpent: 500,
        btcAcquired: 0.005312,
        executionPrice: 94120,
        txHash: '0x8f7a14e9d56c9a3b018e7e5a1b3c9f28d7e6a5b4c3d2e1f0a9b8c7d6e5f4a3b2',
      },
      {
        trancheNumber: 2,
        timestamp: '2026-11-14 10:32:00 UTC',
        musdSpent: 500,
        btcAcquired: 0.005298,
        executionPrice: 94370,
        txHash: '0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
      },
      {
        trancheNumber: 3,
        timestamp: '2026-11-14 10:33:00 UTC',
        musdSpent: 500,
        btcAcquired: 0.005275,
        executionPrice: 94780,
        txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
      },
      {
        trancheNumber: 4,
        timestamp: '2026-11-14 10:34:00 UTC',
        musdSpent: 500,
        btcAcquired: 0.005260,
        executionPrice: 95050,
        txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      },
      {
        trancheNumber: 5,
        timestamp: '2026-11-14 10:35:00 UTC',
        musdSpent: 500,
        btcAcquired: 0.005281,
        executionPrice: 94680,
        txHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      },
    ],
  },
  {
    id: 2,
    name: 'Paused Low ICR Plan',
    status: 'PAUSED',
    owner: '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde',
    totalBudgetMusd: 25000,
    remainingMusd: 18000,
    stackedBtc: 0.074250,
    trancheSizeMusd: 1000,
    intervalSeconds: 3600,
    nextExecutionTime: Math.floor(Date.now() / 1000) + 1850,
    troveSafeFloorIcr: 155,
    borrowerCurrentIcr: 148.5,
    weightedAvgEntryPrice: 94270,
    liveOracleBtcPrice: 95420,
    accruedYieldMusd: 94.20,
    createdAt: '2026-11-13T14:00:00Z',
    fills: [
      {
        trancheNumber: 1,
        timestamp: '2026-11-13 14:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010620,
        executionPrice: 94160,
        txHash: '0x9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
      },
      {
        trancheNumber: 2,
        timestamp: '2026-11-13 15:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010590,
        executionPrice: 94420,
        txHash: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
      },
    ],
  },
  {
    id: 3,
    name: 'High Yield Completed Accumulation',
    status: 'COMPLETED',
    owner: '0x58F6B39A1De2f72C50ce966E01f24153c86B7Fde',
    totalBudgetMusd: 5000,
    remainingMusd: 0,
    stackedBtc: 0.054210,
    trancheSizeMusd: 1000,
    intervalSeconds: 86400,
    nextExecutionTime: 0,
    troveSafeFloorIcr: 150,
    borrowerCurrentIcr: 210.4,
    weightedAvgEntryPrice: 92230,
    liveOracleBtcPrice: 95420,
    accruedYieldMusd: 112.50,
    createdAt: '2026-11-08T09:00:00Z',
    fills: [
      {
        trancheNumber: 1,
        timestamp: '2026-11-08 09:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010880,
        executionPrice: 91910,
        txHash: '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
      },
      {
        trancheNumber: 2,
        timestamp: '2026-11-09 09:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010840,
        executionPrice: 92250,
        txHash: '0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c',
      },
      {
        trancheNumber: 3,
        timestamp: '2026-11-10 09:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010810,
        executionPrice: 92500,
        txHash: '0x8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e',
      },
      {
        trancheNumber: 4,
        timestamp: '2026-11-11 09:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010830,
        executionPrice: 92330,
        txHash: '0x0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
      },
      {
        trancheNumber: 5,
        timestamp: '2026-11-12 09:00:00 UTC',
        musdSpent: 1000,
        btcAcquired: 0.010850,
        executionPrice: 92160,
        txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      },
    ],
  },
];
