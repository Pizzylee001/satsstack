const fs = require('fs');
const path = require('path');
const solc = require('solc');

const contractPath = path.join(__dirname, 'SatsStackVault.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'SatsStackVault.sol': { content: source }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    evmVersion: 'paris',
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode']
      }
    }
  }
};

console.log('Compiling SatsStackVault.sol via solc with viaIR and paris EVM...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  output.errors.forEach((e) => {
    console.log(e.formattedMessage);
    if (e.severity === 'error') hasError = true;
  });
  if (hasError) {
    console.error('Compilation failed.');
    process.exit(1);
  }
}

const contract = output.contracts['SatsStackVault.sol']['SatsStackVault'];
const artifact = {
  contractName: 'SatsStackVault',
  abi: contract.abi,
  bytecode: '0x' + contract.evm.bytecode.object,
};

fs.writeFileSync(
  path.join(__dirname, 'SatsStackVault.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('Compilation succeeded: contracts/SatsStackVault.json updated.');
