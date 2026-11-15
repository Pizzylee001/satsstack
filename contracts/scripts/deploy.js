const fs = require('fs');
const path = require('path');
const {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  encodeDeployData,
  formatEther
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const RPC_URL = 'https://rpc.test.mezo.org';
const CHAIN_ID = 31611;

async function deploy() {
  console.log('=== SatsStackVault Live Mezo Deployment ===');

  const secretPath = path.join(__dirname, '..', '.deployer.secret.json');
  if (!fs.existsSync(secretPath)) {
    throw new Error('Deployer secret file not found: ' + secretPath);
  }
  const secret = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
  const account = privateKeyToAccount(secret.privateKey);

  console.log('Deployer account address:', account.address);

  const publicClient = createPublicClient({
    transport: http(RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL)
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer balance:', formatEther(balance), 'MEZO/BTC');

  if (balance === 0n) {
    throw new Error('Deployer balance is zero. Faucet funds required.');
  }

  const artifactPath = path.join(__dirname, '..', 'SatsStackVault.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const musd = getAddress('0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503');
  const smusd = getAddress('0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16');
  const router = getAddress('0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9');
  const btcToken = getAddress('0x7b7C000000000000000000000000000000000000');
  const troveManager = getAddress('0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0');
  const borrowerOperations = getAddress('0x484439C27419a20ffb1c1fa16fA68c07B71391d8');

  const constructorArgs = [
    musd,
    smusd,
    router,
    btcToken,
    troveManager,
    borrowerOperations
  ];

  console.log('Constructor arguments:');
  console.log('  musd:              ', musd);
  console.log('  smusd:             ', smusd);
  console.log('  router:            ', router);
  console.log('  btcToken:          ', btcToken);
  console.log('  troveManager:      ', troveManager);
  console.log('  borrowerOperations:', borrowerOperations);

  const deployData = encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: constructorArgs
  });

  console.log('Broadcasting deployment transaction to Mezo Testnet...');
  const txHash = await walletClient.sendTransaction({
    data: deployData
  });

  console.log('Deployment transaction hash:', txHash);
  console.log('Waiting for transaction receipt...');

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash
  });

  if (receipt.status !== 'success') {
    throw new Error('Deployment transaction failed with status: ' + receipt.status);
  }

  const contractAddress = receipt.contractAddress;
  console.log('Contract successfully deployed!');
  console.log('Contract Address:', contractAddress);
  console.log('Block Number:    ', receipt.blockNumber.toString());
  console.log('Gas Used:        ', receipt.gasUsed.toString());
  console.log('Explorer URL:    ', 'https://explorer.test.mezo.org/address/' + contractAddress);

  const deploymentData = {
    contractAddress,
    transactionHash: txHash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    deployer: account.address,
    network: 'Mezo Testnet',
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    explorerUrl: 'https://explorer.test.mezo.org/address/' + contractAddress,
    deployedAt: new Date().toISOString(),
    parameters: {
      musd,
      smusd,
      router,
      btcToken,
      troveManager,
      borrowerOperations
    }
  };

  const deploymentOutPath = path.join(__dirname, '..', 'deployment.json');
  fs.writeFileSync(deploymentOutPath, JSON.stringify(deploymentData, null, 2));
  console.log('Saved deployment record to:', deploymentOutPath);

  // Write to lib/deployedContract.json for frontend integration
  const libDir = path.join(__dirname, '..', '..', 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }
  const libDeployedPath = path.join(libDir, 'deployedContract.json');
  fs.writeFileSync(libDeployedPath, JSON.stringify(deploymentData, null, 2));
  console.log('Saved frontend contract config to:', libDeployedPath);

  return deploymentData;
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Deployment error:', err);
      process.exit(1);
    });
}

module.exports = { deploy };
