# SKILL-DEPLOY — Deployment Guide
<!-- Validated: @fhevm/solidity ^0.11.1 | @fhevm/hardhat-plugin ^0.4.2 | 2026-05-07 -->

## Pre-Deployment Checklist
Before deploying to any network, confirm:
- [ ] All 10 invariants in `.fhevm/INVARIANTS.md` pass
- [ ] Tests pass on mock mode: `npx hardhat test`
- [ ] `ZamaEthereumConfig` is inherited (provides correct gateway addresses per network)
- [ ] Constructor arguments documented and verified
- [ ] `package.json` version matches directive headers

## Required Environment Variables
```bash
# .env file
PRIVATE_KEY=0x...               # deployer wallet private key
INFURA_API_KEY=...              # or ALCHEMY_API_KEY
ETHERSCAN_API_KEY=...           # for contract verification (optional)
```

## Hardhat Deploy Script Pattern
```typescript
// ignition/modules/MyContract.ts  (Hardhat Ignition — recommended)
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyContractModule", (m) => {
  const deployer = m.getAccount(0);

  const myContract = m.contract("MyContract", [
    deployer,           // initialOwner — TODO: replace with actual args
    // TODO: add constructor args from Privacy Spec
  ]);

  return { myContract };
});
```

```typescript
// scripts/deploy.ts  (classic script — alternative)
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const MyContract = await ethers.getContractFactory("MyContract");
  const contract = await MyContract.deploy(
    deployer.address,
    // TODO: add constructor args
  );
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Deployed to:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);

  // TODO: Record address in deployment registry
  return address;
}

main().catch(console.error);
```

## Deploy Commands
```bash
# Mock (local Hardhat node — fastest)
npx hardhat node &
npx hardhat run scripts/deploy.ts --network localhost

# Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia

# Using Ignition
npx hardhat ignition deploy ignition/modules/MyContract.ts --network sepolia
```

## Verify Contract on Etherscan
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARG_1> <CONSTRUCTOR_ARG_2>
```

## Network Config in hardhat.config.ts
```typescript
import "@fhevm/hardhat-plugin";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 11155111,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
export default config;
```

## Deployment Registry Pattern
Keep a `deployments.json` file updated after each deploy:
```json
{
  "sepolia": {
    "MyContract": {
      "address": "0x...",
      "deployedAt": "2026-05-07T10:00:00Z",
      "deployer": "0x...",
      "constructorArgs": []
    }
  }
}
```

## Post-Deploy Verification Steps
1. Record contract address → share with frontend team + backend service config
2. Verify on Etherscan (optional but recommended)
3. Run integration smoke test against deployed contract:
```bash
npx hardhat test --network sepolia
```
4. Confirm ZamaEthereumConfig gateway addresses are correct for the target network
