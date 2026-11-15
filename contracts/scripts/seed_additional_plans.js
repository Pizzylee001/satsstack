const fs = require('fs');
const path = require('path');
const {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  parseEther,
  formatEther,
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const RPC_URL = 'https://rpc.test.mezo.org';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForBlockSync(publicClient, targetBlock) {
  for (let i = 0; i < 15; i++) {
    const current = await publicClient.getBlockNumber();
    if (current >= targetBlock) return;
    await sleep(1000);
  }
}

async function main() {
  const secretPath = path.join(__dirname, '..', '.deployer.secret.json');
  const secret = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
  const account = privateKeyToAccount(secret.privateKey);

  const deploymentPath = path.join(__dirname, '..', 'deployment.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const vaultAddress = getAddress(deployment.contractAddress);
  const vaultArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'SatsStackVault.json'), 'utf8')
  );

  const publicClient = createPublicClient({ transport: http(RPC_URL) });
  const walletClient = createWalletClient({ account, transport: http(RPC_URL) });

  let nextId = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'nextPlanId',
  });
  console.log('Current nextPlanId:', nextId.toString());

  let plan1CreateTx = deployment.additionalSeededPlans?.find((p) => p.planId === '1')?.createPlanTxHash
    || '0x26eee32d511a8c8fdcdba9f42dfcfcbfc13e4eecc1d0742628c99002c28bde8d';
  let plan1CreateBlock = '16796478';

  if (nextId < 2n) {
    console.log('Creating Plan #1...');
    const tx1 = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'createPlan',
      args: [parseEther('15'), parseEther('5'), 3600n, parseEther('1.5')],
      gas: 450000n,
    });
    const receipt1 = await publicClient.waitForTransactionReceipt({ hash: tx1 });
    plan1CreateTx = tx1;
    plan1CreateBlock = receipt1.blockNumber.toString();
    await waitForBlockSync(publicClient, receipt1.blockNumber);
  }

  let plan1 = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'getPlan',
    args: [1n],
  });

  let exec1Tx = null;
  let exec1Block = null;
  if (plan1.executedTranches === 0n) {
    console.log('Executing Tranche #1 for Plan #1...');
    exec1Tx = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'executeTranche',
      args: [1n],
      gas: 550000n,
    });
    const exec1Receipt = await publicClient.waitForTransactionReceipt({ hash: exec1Tx });
    exec1Block = exec1Receipt.blockNumber.toString();
    console.log('Plan #1 tranche #1 tx:', exec1Tx, 'status:', exec1Receipt.status, 'block:', exec1Block);
    await waitForBlockSync(publicClient, exec1Receipt.blockNumber);
    plan1 = await publicClient.readContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'getPlan',
      args: [1n],
    });
  }

  nextId = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'nextPlanId',
  });

  let plan2CreateTx = null;
  let plan2CreateBlock = null;
  if (nextId < 3n) {
    console.log('Creating Plan #2 (10 MUSD budget, 5 MUSD tranche, 1d interval, 175% floor)...');
    const tx2 = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'createPlan',
      args: [parseEther('10'), parseEther('5'), 86400n, parseEther('1.75')],
      gas: 450000n,
    });
    const receipt2 = await publicClient.waitForTransactionReceipt({ hash: tx2 });
    plan2CreateTx = tx2;
    plan2CreateBlock = receipt2.blockNumber.toString();
    console.log('Plan #2 created tx:', tx2, 'status:', receipt2.status, 'block:', plan2CreateBlock);
    await waitForBlockSync(publicClient, receipt2.blockNumber);
  }

  let plan2 = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'getPlan',
    args: [2n],
  });

  let pause2Tx = null;
  let pause2Block = null;
  if (plan2.status === 0) {
    console.log('Pausing Plan #2 on-chain...');
    pause2Tx = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'pause',
      args: [2n],
      gas: 150000n,
    });
    const pause2Receipt = await publicClient.waitForTransactionReceipt({ hash: pause2Tx });
    pause2Block = pause2Receipt.blockNumber.toString();
    console.log('Plan #2 paused tx:', pause2Tx, 'status:', pause2Receipt.status, 'block:', pause2Block);
    await waitForBlockSync(publicClient, pause2Receipt.blockNumber);
    plan2 = await publicClient.readContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: 'getPlan',
      args: [2n],
    });
  }

  deployment.additionalSeededPlans = [
    {
      planId: '1',
      createPlanTxHash: plan1CreateTx,
      createPlanBlockNumber: plan1CreateBlock,
      executeTrancheTxHash: exec1Tx,
      executeTrancheBlockNumber: exec1Block,
      remainingBudgetMusd: formatEther(plan1.remainingBudgetMusd),
      accumulatedBtcEther: formatEther(plan1.accumulatedBtc),
      status: plan1.status === 0 ? 'ACTIVE' : String(plan1.status),
    },
    {
      planId: '2',
      createPlanTxHash: plan2CreateTx,
      createPlanBlockNumber: plan2CreateBlock,
      pauseTxHash: pause2Tx,
      pauseBlockNumber: pause2Block,
      remainingBudgetMusd: formatEther(plan2.remainingBudgetMusd),
      accumulatedBtcEther: formatEther(plan2.accumulatedBtc),
      status: plan2.status === 1 ? 'PAUSED' : String(plan2.status),
    },
  ];

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  const libDeployedPath = path.join(__dirname, '..', '..', 'lib', 'deployedContract.json');
  fs.writeFileSync(libDeployedPath, JSON.stringify(deployment, null, 2));

  const finalNext = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'nextPlanId',
  });
  console.log('Completed seeding. Final nextPlanId:', finalNext.toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
