---
name: deploy-fhevm-contract
description: Deploying fhEVM contracts — Sepolia configuration and explicit gas limits
version: "@fhevm/hardhat-plugin ^0.4.2"
validated: 2026-05-08
---

## Pre-Deployment Checklist
- [ ] Inherit `ZamaEthereumConfig` in your contract.
- [ ] Ensure NO FHE operations (like `FHE.asEuint64`) are in the constructor.
- [ ] Pass all 10+2 invariants in `.fhevm/INVARIANTS.md`.
- [ ] Verify `hardhat.config.ts` has the correct Sepolia network settings.

## Deployment Script (with Explicit Gas)
You **MUST** provide an explicit `gasLimit` when deploying or interacting with fhEVM contracts on Sepolia, as `estimateGas` is unreliable for FHE calls.

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const MyContract = await ethers.getContractFactory("MyContract");

  // Deployment itself usually doesn't need FHE gas limits 
  // UNLESS the constructor performs FHE ops (which it shouldn't)
  const contract = await MyContract.deploy(deployer.address);
  await contract.waitForDeployment();

  console.log("Deployed to:", await contract.getAddress());
}

main().catch(console.error);
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

## Hardhat Config (Sepolia)
```typescript
networks: {
  sepolia: {
    url: process.env.RPC_URL_HTTP,
    accounts: [process.env.PRIVATE_KEY!],
    chainId: 11155111,
  }
}
```

## Fingerprint Reference
- `fingerprints/viem-keeper-api.md`
- `manage-gas-limits.md`

## Common Pitfalls
- **E3:** Relying on `estimateGas` for FHE transactions.
- **E5:** Constructor reverts because it contains `FHE.asEuint64`.
