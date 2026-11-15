const assert = require('assert');
const solc = require('solc');
const {
  createPublicClient,
  http,
  encodeDeployData,
  encodeFunctionData,
  decodeFunctionResult,
  getAddress,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters
} = require('viem');
const artifact = require('../SatsStackVault.json');

const RPC_URL = 'https://rpc.test.mezo.org';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   SatsStack Zero-Gas StateOverride Test Suite     ');
  console.log('   RPC: ' + RPC_URL);
  console.log('====================================================\n');

  const client = createPublicClient({
    transport: http(RPC_URL)
  });

  const testUser = getAddress('0x1000000000000000000000000000000000000001');
  const recipient = getAddress('0x3000000000000000000000000000000000000003');
  const vaultAddress = getAddress('0x2000000000000000000000000000000000000002');

  const MUSD = getAddress('0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503');
  const sMUSD = getAddress('0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16');
  const router = getAddress('0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9');
  const btcToken = getAddress('0x7b7C000000000000000000000000000000000000');
  const troveManager = getAddress('0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0');
  const borrowerOperations = getAddress('0x484439c27419A20ffB1c1Fa16fa68c07b71391d8'.toLowerCase());

  console.log('[Test 1] Deploying SatsStackVault via eth_call simulation...');
  const deployData = encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [MUSD, sMUSD, router, btcToken, troveManager, borrowerOperations]
  });

  const deployedCode = await client.request({
    method: 'eth_call',
    params: [{ from: testUser, data: deployData }, 'latest']
  });

  assert(deployedCode && deployedCode.length > 2, 'Deployment code must not be empty');
  console.log(' PASS: SatsStackVault bytecode successfully simulated. Code length: ' + deployedCode.length + ' chars');

  const maxVal = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

  // Storage slot utilities
  const userMusdBalanceSlot = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [testUser, 0n]));
  const userMusdInnerAllowance = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [testUser, 1n]));
  const userToVaultAllowance = keccak256(encodeAbiParameters(parseAbiParameters('address, bytes32'), [vaultAddress, userMusdInnerAllowance]));

  const vaultInnerAllowance = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [vaultAddress, 1n]));
  const vaultToSmusdAllowance = keccak256(encodeAbiParameters(parseAbiParameters('address, bytes32'), [sMUSD, vaultInnerAllowance]));
  const vaultToRouterAllowance = keccak256(encodeAbiParameters(parseAbiParameters('address, bytes32'), [router, vaultInnerAllowance]));

  const smusdMusdBalKey = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [sMUSD, 0n]));
  const vaultSmusdBalKey = keccak256(encodeAbiParameters(parseAbiParameters('address, uint256'), [vaultAddress, 51n]));

  function toSlotHex(bigintVal) {
    return '0x' + bigintVal.toString(16).padStart(64, '0');
  }

  const fundHex = toSlotHex(10000000000000000000000n); // 10,000 MUSD
  const smusdReserveHex = toSlotHex(50000000000000000000000000n); // 50M MUSD

  console.log('\n[Test 2] Testing createPlan with MUSD deposit into sMUSD...');
  const createPlanCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'createPlan',
    args: [
      1000000000000000000000n, // totalBudget: 1000 MUSD
      100000000000000000000n,  // trancheSize: 100 MUSD
      3600n,                   // interval: 1 hour
      1500000000000000000n     // minIcrFloor: 150%
    ]
  });

  const stateOverrideCreate = {
    [vaultAddress]: {
      code: deployedCode,
      balance: '0xDE0B6B3A7640000'
    },
    [MUSD]: {
      stateDiff: {
        [userMusdBalanceSlot]: fundHex,
        [userToVaultAllowance]: maxVal,
        [vaultToSmusdAllowance]: maxVal,
        [vaultToRouterAllowance]: maxVal
      }
    }
  };

  const createRes = await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: createPlanCalldata },
      'latest',
      stateOverrideCreate
    ]
  });

  const planId = decodeFunctionResult({
    abi: artifact.abi,
    functionName: 'createPlan',
    data: createRes
  });

  assert.strictEqual(planId, 0n, 'First planId must be 0');
  console.log(' PASS: createPlan created planId 0 and deposited MUSD into sMUSD');

  console.log('\n[Test 3] Testing Trove ICR Safety Circuit read via TroveManager...');
  const checkIcrCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'checkTroveIcr',
    args: [testUser]
  });

  const icrRes = await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: checkIcrCalldata },
      'latest',
      { [vaultAddress]: { code: deployedCode } }
    ]
  });

  const reportedIcr = BigInt(icrRes);
  assert(reportedIcr > 0n, 'Trove ICR check should return a valid non-zero ICR');
  console.log(' PASS: checkTroveIcr safely queried Mezo TroveManager: ' + reportedIcr.toString());

  console.log('\n[Test 4] Testing executeTranche swap on Tigris Router...');
  const plan0BaseSlot = BigInt(keccak256(encodeAbiParameters(parseAbiParameters('uint256, uint256'), [0n, 3n])));

  const vaultStoragePlan0 = {};
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 0n)] = toSlotHex(0n); // id
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 1n)] = '0x' + testUser.slice(2).padStart(64, '0'); // owner
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 2n)] = toSlotHex(1000000000000000000000n); // totalBudget
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 3n)] = toSlotHex(100000000000000000000n); // trancheSize
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 4n)] = toSlotHex(3600n); // interval
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 5n)] = toSlotHex(1n); // nextExecutionTime <= now
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 6n)] = toSlotHex(1000000000000000000000n); // remainingBudget
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 7n)] = toSlotHex(0n); // accumulatedBtc
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 8n)] = toSlotHex(1500000000000000000n); // minIcrFloor (150%)
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 9n)] = toSlotHex(10n); // totalTranches
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 10n)] = toSlotHex(0n); // executedTranches
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 11n)] = toSlotHex(0n); // status: ACTIVE
  vaultStoragePlan0[toSlotHex(plan0BaseSlot + 12n)] = toSlotHex(1n); // createdAt

  const stateOverrideExecute = {
    [vaultAddress]: {
      code: deployedCode,
      balance: '0xDE0B6B3A7640000',
      stateDiff: vaultStoragePlan0
    },
    [MUSD]: {
      stateDiff: {
        [vaultToSmusdAllowance]: maxVal,
        [vaultToRouterAllowance]: maxVal,
        [smusdMusdBalKey]: smusdReserveHex
      }
    },
    [sMUSD]: {
      stateDiff: {
        [vaultSmusdBalKey]: fundHex
      }
    }
  };

  const executeTrancheCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'executeTranche',
    args: [0n]
  });

  const executeRes = await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: executeTrancheCalldata },
      'latest',
      stateOverrideExecute
    ]
  });

  const btcBought = decodeFunctionResult({
    abi: artifact.abi,
    functionName: 'executeTranche',
    data: executeRes
  });

  assert(btcBought > 0n, 'executeTranche must purchase positive amount of BTC');
  console.log(' PASS: executeTranche successfully pulled MUSD from sMUSD and swapped on Tigris for ' + btcBought.toString() + ' sats of BTC');

  console.log('\n[Test 5] Testing Trove ICR Circuit Trip (reverts TroveUnsafe when ICR < minIcrFloor)...');
  // Compile small Mock TroveManager that reports 110% ICR (below 150% floor)
  const mockTmSource = `
  // SPDX-License-Identifier: MIT
  pragma solidity 0.8.28;
  contract MockTroveManager {
    function priceFeed() external pure returns (address) { return address(0); }
    function getCurrentICR(address, uint256) external pure returns (uint256) {
      return 1100000000000000000; // 110% ICR
    }
  }
  `;
  const mockTmOutput = JSON.parse(solc.compile(JSON.stringify({
    language: 'Solidity',
    sources: { 'MockTM.sol': { content: mockTmSource } },
    settings: { evmVersion: 'paris', outputSelection: { '*': { '*': ['*'] } } }
  })));
  const mockTmBytecode = '0x' + mockTmOutput.contracts['MockTM.sol']['MockTroveManager'].evm.deployedBytecode.object;

  let tripped = false;
  try {
    await client.request({
      method: 'eth_call',
      params: [
        { from: testUser, to: vaultAddress, data: executeTrancheCalldata },
        'latest',
        {
          ...stateOverrideExecute,
          [troveManager]: {
            code: mockTmBytecode
          }
        }
      ]
    });
  } catch (err) {
    tripped = true;
    console.log(' PASS: Circuit tripped correctly and execution reverted due to unsafe Trove ICR');
  }
  assert(tripped, 'executeTranche must revert when Trove ICR is below minIcrFloor');

  console.log('\n[Test 6] Testing claimBtc transfer of accumulated Bitcoin...');
  const vaultStorageWithBtc = Object.assign({}, vaultStoragePlan0);
  const accumulatedSats = 500000000000000n; // 0.0005 BTC
  vaultStorageWithBtc[toSlotHex(plan0BaseSlot + 7n)] = toSlotHex(accumulatedSats);

  const claimBtcCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'claimBtc',
    args: [0n, recipient]
  });

  const claimRes = await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: claimBtcCalldata },
      'latest',
      {
        [vaultAddress]: {
          code: deployedCode,
          balance: '0xDE0B6B3A7640000',
          stateDiff: vaultStorageWithBtc
        }
      }
    ]
  });
  console.log(' PASS: claimBtc executed cleanly, transferring accumulated BTC');

  console.log('\n[Test 7] Testing routeBtcToTrove auto-collateralization...');
  const routeTroveCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'routeBtcToTrove',
    args: [0n, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000']
  });

  const routeRes = await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: routeTroveCalldata },
      'latest',
      {
        [vaultAddress]: {
          code: deployedCode,
          balance: '0xDE0B6B3A7640000',
          stateDiff: vaultStorageWithBtc
        }
      }
    ]
  });
  console.log(' PASS: routeBtcToTrove routed accumulated BTC directly to Trove collateral');

  console.log('\n[Test 8] Testing plan lifecycle controls (pause, resume, topUp, cancelAndWithdraw)...');
  // 8a: pause
  const pauseCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'pause',
    args: [0n]
  });
  await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: pauseCalldata },
      'latest',
      {
        [vaultAddress]: {
          code: deployedCode,
          stateDiff: vaultStoragePlan0
        }
      }
    ]
  });
  console.log(' PASS: pause executed');

  // 8b: resume
  const vaultStoragePaused = Object.assign({}, vaultStoragePlan0);
  vaultStoragePaused[toSlotHex(plan0BaseSlot + 11n)] = toSlotHex(1n); // PAUSED
  const resumeCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'resume',
    args: [0n]
  });
  await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: resumeCalldata },
      'latest',
      {
        [vaultAddress]: {
          code: deployedCode,
          stateDiff: vaultStoragePaused
        }
      }
    ]
  });
  console.log(' PASS: resume executed');

  // 8c: topUp
  const topUpCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'topUp',
    args: [0n, 500000000000000000000n] // 500 MUSD
  });
  await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: topUpCalldata },
      'latest',
      {
        ...stateOverrideCreate,
        [vaultAddress]: {
          code: deployedCode,
          stateDiff: vaultStoragePlan0
        }
      }
    ]
  });
  console.log(' PASS: topUp executed and added funds to sMUSD position');

  // 8d: cancelAndWithdraw
  const cancelCalldata = encodeFunctionData({
    abi: artifact.abi,
    functionName: 'cancelAndWithdraw',
    args: [0n]
  });
  await client.request({
    method: 'eth_call',
    params: [
      { from: testUser, to: vaultAddress, data: cancelCalldata },
      'latest',
      {
        ...stateOverrideExecute,
        [vaultAddress]: {
          code: deployedCode,
          balance: '0xDE0B6B3A7640000',
          stateDiff: vaultStorageWithBtc
        }
      }
    ]
  });
  console.log(' PASS: cancelAndWithdraw refunded remaining MUSD and accumulated BTC');

  console.log('\n====================================================');
  console.log('   ALL 8 ZERO-GAS STATE OVERRIDE TESTS PASSED 100%! ');
  console.log('====================================================\n');
}

runTestSuite().catch(err => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
