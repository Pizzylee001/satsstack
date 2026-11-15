const fs = require('fs');
const path = require('path');
const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');

function generateDeployer() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  console.log('Generated Deterministic Deployer Wallet:');
  console.log('Address:    ', account.address);
  console.log('Network:    Mezo Testnet (Matsnet)');
  console.log('Chain ID:   31611 (0x7b7b)');
  console.log('Faucet URL: https://faucet.test.mezo.org');

  const deployerInfo = {
    address: account.address,
    network: 'Mezo Testnet',
    chainId: 31611,
    faucetUrl: 'https://faucet.test.mezo.org',
    instructions: 'Request testnet BTC gas tokens at https://faucet.test.mezo.org for address ' + account.address
  };

  const deployerPath = path.join(__dirname, '..', 'deployer.json');
  fs.writeFileSync(deployerPath, JSON.stringify(deployerInfo, null, 2));
  console.log('Saved public deployer info to:', deployerPath);

  // Save private key securely to local uncommitted secrets file
  const secretPath = path.join(__dirname, '..', '.deployer.secret.json');
  const secretInfo = {
    address: account.address,
    privateKey: privateKey,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(secretPath, JSON.stringify(secretInfo, null, 2));
  console.log('Saved private key to secure secret file (gitignored):', secretPath);
}

generateDeployer();
