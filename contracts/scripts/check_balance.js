const { createPublicClient, http, formatEther, getAddress } = require('viem');
const secret = require('../.deployer.secret.json');

const RPC_URL = 'https://rpc.test.mezo.org';
const client = createPublicClient({
  transport: http(RPC_URL)
});

const deployerAddress = getAddress(secret.address);
const MUSD = getAddress('0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503');
const sMUSD = getAddress('0x6f461c68B2c5492C0F5CCEc5a264d692aA7A8e16');
const btcToken = getAddress('0x7b7C000000000000000000000000000000000000');

const minAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
];

async function check() {
  console.log('Checking balances for:', deployerAddress);
  const nativeBalance = await client.getBalance({ address: deployerAddress });
  console.log('Native balance:', nativeBalance.toString(), 'wei (', formatEther(nativeBalance), ')');

  try {
    const musdBal = await client.readContract({
      address: MUSD,
      abi: minAbi,
      functionName: 'balanceOf',
      args: [deployerAddress]
    });
    console.log('MUSD balance:', musdBal.toString(), '(', formatEther(musdBal), 'MUSD)');
  } catch (e) {
    console.log('Failed to read MUSD balance:', e.message);
  }

  try {
    const smusdBal = await client.readContract({
      address: sMUSD,
      abi: minAbi,
      functionName: 'balanceOf',
      args: [deployerAddress]
    });
    console.log('sMUSD balance:', smusdBal.toString(), '(', formatEther(smusdBal), 'sMUSD)');
  } catch (e) {
    console.log('Failed to read sMUSD balance:', e.message);
  }

  try {
    const btcBal = await client.readContract({
      address: btcToken,
      abi: minAbi,
      functionName: 'balanceOf',
      args: [deployerAddress]
    });
    console.log('btcToken balance:', btcBal.toString(), 'sats');
  } catch (e) {
    console.log('Failed to read btcToken balance:', e.message);
  }
}

check().catch(console.error);
