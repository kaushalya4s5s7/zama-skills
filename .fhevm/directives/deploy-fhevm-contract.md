---
name: deploy-fhevm-contract
description: Deploying fhEVM contracts — Sepolia configuration and explicit gas limits
version: "@fhevm/hardhat-plugin ^0.4.2"
validated: 2026-05-08
---

## Project Location
**Rule:** All deployment-related files must reside in the `contracts/` directory. NEVER deploy from the project root.

## Pre-Deployment Checklist
- [ ] Inherit `ZamaEthereumConfig` in your contract.
- [ ] Ensure NO FHE operations (like `FHE.asEuint64`) are in the constructor.
- [ ] Pass all 12 invariants in `.fhevm/INVARIANTS.md`.
- [ ] **Solidity Optimizer:** Enabled (200 runs) in `contracts/hardhat.config.ts`.
- [ ] **EVM Version:** Set to `paris` (required for fhEVM coprocessor).

## Compiler Configuration
Standard Sepolia nodes do not natively support fhEVM precompiles. Unoptimized bytecode can exceed gas thresholds or fail initialization.

```typescript
// contracts/hardhat.config.ts
solidity: {
  version: "0.8.27",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: "paris", // REQUIRED for Zama Coprocessor
  },
},
```

## Deployment Script (with Explicit Gas)
You **MUST** provide an explicit `gasLimit` when deploying or interacting with fhEVM contracts on Sepolia, as `estimateGas` is unreliable for FHE calls.

```typescript
// contracts/scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const MyContract = await ethers.getContractFactory("MyContract");

  // Deployment itself usually doesn't need FHE gas limits 
  // UNLESS the constructor performs FHE ops (which it shouldn't)
  const contract = await MyContract.deploy(deployer.address, {
    gasLimit: 3_000_000n // Recommended for first deployment
  });
  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);
```

## Run Instructions
```bash
# Run from within the contracts/ directory
cd contracts
pnpm deploy
```

## Post-Deployment: Initializing State
Since constructors cannot use FHE, you must initialize encrypted state in a separate transaction.

```typescript
// Initializing an encrypted balance
const tx = await contract.initializeBalance({ 
  gasLimit: 500_000n // Explicit limit for FHE write
});
await tx.wait();
```

## Gas Limit Reference
| Transaction Type | gasLimit |
|---|---|
| Simple FHE Write | `500_000n` |
| Multi-ACL (≥5 allow) | `1_500_000n` |

## Fingerprint Reference
- `fingerprints/viem-keeper-api.md`
- `manage-gas-limits.md`

## Common Pitfalls
- **E3:** Relying on `estimateGas` for FHE transactions.
- **E5:** Constructor reverts because it contains `FHE.asEuint64`.
- **E11:** Deployment fails due to root-level execution or missing `paris` evmVersion.
