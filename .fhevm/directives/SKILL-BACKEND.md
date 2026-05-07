# SKILL-BACKEND — Backend Services (Keeper / Relayer / Bot)
<!-- Validated: @zama-fhe/relayer-sdk ^0.4.1 | 2026-05-07 -->

## When Do You Need a Backend Service?
A backend service is needed when your FHEVM contract requires **automated off-chain actions** that users cannot or should not trigger manually:

| Need | Service Type |
|---|---|
| Automatically call `publicDecrypt` + `checkSignatures` when a reveal event fires | **Keeper / Bot** |
| Watch for auction end / vote deadline, then trigger reveal | **Keeper / Bot** |
| Relay encrypted transactions for users (gasless UX) | **Relayer** |
| Periodically check contract state and act on it | **Watcher / Cron Bot** |

## Keeper Service Pattern (Node.js)
```typescript
// services/keeper.ts
import { ethers } from "ethers";
import { createInstance, FhevmInstance } from "@zama-fhe/relayer-sdk/node";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet   = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY!, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS!,
  CONTRACT_ABI,
  wallet
);

// ── STEP 1: Initialize FHEVM instance ──────────────────────
let instance: FhevmInstance;
async function initFhevm() {
  instance = await createInstance();
  console.log("FHEVM instance ready");
}

// ── STEP 2: Watch for reveal trigger event ─────────────────
async function watchForRevealEvent() {
  contract.on("RevealRequested", async (handle1, handle2, event) => {
    console.log("RevealRequested event detected — starting public decrypt");
    try {
      await handleReveal([handle1, handle2]);
    } catch (e) {
      console.error("Keeper error:", e);
    }
  });
  console.log("Watching for RevealRequested events...");
}

// ── STEP 3: Off-chain public decrypt ──────────────────────
async function handleReveal(handles: string[]) {
  // ⚠️ Handle order must match on-chain abi.encode order
  const results = await instance.publicDecrypt(handles);

  const clearValue1 = results.clearValues[handles[0]]; // bigint or boolean
  const clearValue2 = results.clearValues[handles[1]];
  const proof       = results.decryptionProof;

  console.log("Decrypted:", clearValue1, clearValue2);

  // ── STEP 4: Submit proof on-chain ───────────────────────
  const tx = await contract.finalizeResult(
    clearValue1,
    clearValue2,
    proof
  );
  const receipt = await tx.wait();
  console.log("Finalized in tx:", receipt.hash);
}

// ── MAIN ──────────────────────────────────────────────────
async function main() {
  await initFhevm();
  await watchForRevealEvent();
  // Keep process alive
}
main().catch(console.error);
```

## Cron/Polling Keeper Pattern
```typescript
// Poll every 30s instead of using events (simpler, less efficient)
async function pollAndReveal() {
  const revealNeeded: boolean = await contract.revealRequested();
  const isFinalized: boolean  = await contract.finalized();
  if (revealNeeded && !isFinalized) {
    const handle = await contract.getEncryptedResult();
    const results = await instance.publicDecrypt([handle]);
    await contract.finalizeResult(
      results.clearValues[handle],
      results.decryptionProof
    );
  }
}
setInterval(pollAndReveal, 30_000);
```

## Keeper Environment Variables
```bash
# .env
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
KEEPER_PRIVATE_KEY=0x...       # funded wallet to pay for finalize tx gas
CONTRACT_ADDRESS=0x...         # deployed contract address (from deployment registry)
```

## Starting the Keeper
```bash
# Install ts-node if needed
npm install -g ts-node

# Run keeper
ts-node services/keeper.ts

# Or with pm2 for production
pm2 start services/keeper.ts --name fhevm-keeper --interpreter ts-node
```

## Keeper Package Dependencies
```bash
npm install ethers @zama-fhe/relayer-sdk dotenv
```

## Service Architecture Options
```
Option A: Keeper-only
  Contract emits event → Keeper listens → publicDecrypt → submit proof

Option B: Keeper + Relayer (gasless UX)
  User signs encrypted tx offline
  → Relayer submits on-chain (pays gas)
  → Contract processes FHE op
  → Keeper finalizes reveal

Option C: Fully automated bot
  Cron watches state → triggers reveal → submits proof → notifies frontend via webhook
```

## Important Notes
- The keeper wallet must be **funded** with ETH to pay gas for the finalization tx
- The keeper **does not learn** any encrypted values — it only submits proofs that the KMS already generated
- Multiple keepers can be run in parallel — `require(!_finalized)` prevents double-finalization
- Record `CONTRACT_ADDRESS` from the deployment step — pass it to keeper config
