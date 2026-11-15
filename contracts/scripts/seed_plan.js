const fs = require('fs');
const path = require('path');
const {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  parseAbi,
  parseEther,
  formatEther
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const RPC_URL = 'https://rpc.test.mezo.org';
const CHAIN_ID = 31611;

async function seedPlan() {
  console.log('=== SatsStackVault Seed Live On-Chain Plan ===');

  const secretPath = path.join(__dirname, '..', '.deployer.secret.json');
  const secret = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
  const account = privateKeyToAccount(secret.privateKey);

  const deploymentPath = path.join(__dirname, '..', 'deployment.json');
  if (!fs.existsSync(deploymentPath)) {
    throw new Error('deployment.json not found');
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const vaultAddress = getAddress(deployment.contractAddress);
  console.log('Vault address: ', vaultAddress);
  console.log('Deployer:      ', account.address);

  const publicClient = createPublicClient({ transport: http(RPC_URL) });
  const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL)
  });

  const musd = getAddress('0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503');
  const btcToken = getAddress('0x7b7C000000000000000000000000000000000000');
  const router = getAddress('0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9');
  const factory = '0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A';

  const erc20Abi = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)'
  ]);

  const routerAbi = parseAbi([
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, address to, uint256 deadline) returns (uint256[] amounts)'
  ]);

  const vaultArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'SatsStackVault.json'), 'utf8'));

  // Step 1: Check MUSD balance
  let musdBal = await publicClient.readContract({
    address: musd,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log('Initial MUSD balance:', formatEther(musdBal), 'MUSD');

  let swapTxHash = null;
  const targetBudget = parseEther('50'); // 50 MUSD
  if (musdBal < targetBudget) {
    console.log('Acquiring MUSD via Tigris Router swap (0.001 BTC -> MUSD)...');
    const btcSwapAmount = parseEther('0.001'); // 0.001 BTC yields ~77.8 MUSD

    const swapTx = await walletClient.writeContract({
      address: router,
      abi: routerAbi,
      functionName: 'swapExactTokensForTokens',
      args: [
        btcSwapAmount,
        0n,
        [{ from: btcToken, to: musd, stable: false, factory }],
        account.address,
        BigInt(Math.floor(Date.now() / 1000) + 3600)
      ]
    });
    console.log('Swap tx broadcasted:', swapTx);
    const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapTx });
    console.log('Swap receipt status:', swapReceipt.status);
    swapTxHash = swapTx;

    musdBal = await publicClient.readContract({
      address: musd,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log('New MUSD balance:', formatEther(musdBal), 'MUSD');
  }

  // Step 2: Approve MUSD to SatsStackVault
  console.log('Checking MUSD allowance to SatsStackVault...');
  const currentAllowance = await publicClient.readContract({
    address: musd,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account.address, vaultAddress]
  });

  let approveTxHash = null;
  if (currentAllowance < targetBudget) {
    console.log('Approving MUSD to SatsStackVault...');
    const approveTx = await walletClient.writeContract({
      address: musd,
      abi: erc20Abi,
      functionName: 'approve',
      args: [vaultAddress, parseEther('1000000')]
    });
    console.log('Approve tx broadcasted:', approveTx);
    const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('Approve receipt status:', approveReceipt.status);
    approveTxHash = approveTx;
  }

  // Step 3: Call createPlan on SatsStackVault
  console.log('Calling createPlan on SatsStackVault...');
  const budget = parseEther('50'); // 50 MUSD
  const tranche = parseEther('10'); // 10 MUSD
  const interval = 60n; // 60 seconds
  const minIcrFloor = parseEther('1.5'); // 150%

  const createPlanTx = await walletClient.writeContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'createPlan',
    args: [budget, tranche, interval, minIcrFloor]
  });
  console.log('createPlan tx broadcasted:', createPlanTx);
  const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createPlanTx });
  console.log('createPlan receipt status:', createReceipt.status);
  console.log('createPlan block number:   ', createReceipt.blockNumber.toString());

  // Check nextPlanId or plan details
  const nextPlanId = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'nextPlanId'
  });
  const planId = nextPlanId - 1n;
  console.log('Created Plan ID:', planId.toString());

  const planDetails = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'plans',
    args: [planId]
  });
  console.log('Plan details before tranche execution:');
  console.log('  Remaining budget:', formatEther(planDetails[6]), 'MUSD');
  console.log('  Accumulated BTC: ', planDetails[7].toString(), 'sats');
  console.log('  Status:          ', planDetails[11]);

  // Step 4: Execute first tranche
  console.log('Executing first tranche on-chain...');
  const executeTx = await walletClient.writeContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'executeTranche',
    args: [planId]
  });
  console.log('executeTranche tx broadcasted:', executeTx);
  const executeReceipt = await publicClient.waitForTransactionReceipt({ hash: executeTx });
  console.log('executeTranche receipt status:', executeReceipt.status);
  console.log('executeTranche block number:   ', executeReceipt.blockNumber.toString());

  const planAfter = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: 'plans',
    args: [planId]
  });

  console.log('Plan details after tranche execution:');
  console.log('  Remaining budget: ', formatEther(planAfter[6]), 'MUSD');
  console.log('  Accumulated BTC:  ', planAfter[7].toString(), 'sats (', formatEther(planAfter[7]), 'BTC)');
  console.log('  Executed tranches:', planAfter[10].toString(), 'of', planAfter[9].toString());
  console.log('  Status:           ', planAfter[11], '(0=ACTIVE)');

  const seedResult = {
    vaultAddress,
    planId: planId.toString(),
    swapTxHash,
    approveTxHash,
    createPlanTxHash: createPlanTx,
    createPlanBlockNumber: createReceipt.blockNumber.toString(),
    executeTrancheTxHash: executeTx,
    executeTrancheBlockNumber: executeReceipt.blockNumber.toString(),
    planDetails: {
      owner: planAfter[1],
      totalBudgetMusd: formatEther(planAfter[2]),
      trancheSizeMusd: formatEther(planAfter[3]),
      intervalSeconds: planAfter[4].toString(),
      remainingBudgetMusd: formatEther(planAfter[6]),
      accumulatedBtcSats: planAfter[7].toString(),
      accumulatedBtcEther: formatEther(planAfter[7]),
      minIcrFloor: formatEther(planAfter[8]),
      totalTranches: planAfter[9].toString(),
      executedTranches: planAfter[10].toString(),
      status: planAfter[11] === 0 ? 'ACTIVE' : planAfter[11].toString()
    }
  };

  const seedResultPath = path.join(__dirname, '..', 'seedResult.json');
  fs.writeFileSync(seedResultPath, JSON.stringify(seedResult, null, 2));
  console.log('Saved seed result to:', seedResultPath);

  // Update deployment.json with plan info
  deployment.seededPlan = seedResult;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));

  // Update lib/deployedContract.json for frontend
  const libDeployedPath = path.join(__dirname, '..', '..', 'lib', 'deployedContract.json');
  fs.writeFileSync(libDeployedPath, JSON.stringify(deployment, null, 2));
  console.log('Updated lib/deployedContract.json with live plan data');

  return seedResult;
}

if (require.main === module) {
  seedPlan()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed plan error:', err);
      process.exit(1);
    });
}

module.exports = { seedPlan };
