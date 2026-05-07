---
name: manage-gas-limits
description: Gas management for fhEVM — explicit limits for Coprocessor calls
version: "@fhevm/hardhat-plugin ^0.4.2"
validated: 2026-05-08
---

## Why Explicit Gas is Required (E3)
On live networks like Sepolia, the `estimateGas` interceptor in the fhEVM Hardhat plugin often returns incorrect or insufficient values for transactions containing FHE operations. You **MUST** provide an explicit `gasLimit` in your transaction options.

## Gas Limit Table (Sepolia)
| Operation Type | Recommended `gasLimit` |
|---|---|
| Simple State Write | `500_000n` |
| Complex Calc / Multi-ACL | `1_500_000n` |
| `acceptMatch` / High-ACL (≥5) | `2_000_000n` |

## TypeScript Example (viem)
```typescript
const hash = await walletClient.writeContract({
  address: contractAddress,
  abi: [...],
  functionName: "myFheFunction",
  args: [...],
  gasLimit: 1_500_000n // Explicit limit
});
```

## Hardhat Test Example
```typescript
await contract.myFheFunction(arg1, arg2, { gasLimit: 500000 });
```

## Symptoms of Low Gas
- **E2:** Transaction reverts with "out-of-gas" during the FHE operation phase.
- Transaction is submitted but never confirmed or fails silently during coprocessor execution.

## Fingerprint Reference
- `fingerprints/viem-keeper-api.md`
