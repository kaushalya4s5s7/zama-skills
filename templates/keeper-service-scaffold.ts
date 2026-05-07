// keeper-service-scaffold.ts
// Validated: @zama-fhe/relayer-sdk ^0.4.1 | 2026-05-07
// ============================================================
// FHEVM KEEPER SERVICE SCAFFOLD — Automated Reveal Bot
// ============================================================
// This service watches for on-chain events, calls off-chain
// publicDecrypt via the Relayer SDK, then submits the proof
// back on-chain to finalize the result.
//
// Fill TODO comments with your contract's specific events
// and finalize function signature.
// ============================================================

import { ethers } from "ethers";
import { createInstance, FhevmInstance } from "@zama-fhe/relayer-sdk/node";
import * as dotenv from "dotenv";
dotenv.config();

// ────────────────────────────────────────────────────────────
// TODO: Replace with your contract ABI (finalize function + events)
// ────────────────────────────────────────────────────────────
const CONTRACT_ABI = [
  // TODO: Add your specific event signature
  // Example: "event RevealRequested(bytes32 handle1, bytes32 handle2)"
  "event RevealRequested(bytes32 indexed handle1, bytes32 indexed handle2)",

  // TODO: Add your specific finalize function signature
  // Example: "function finalizeResult(uint64 clearA, uint64 clearB, bytes proof)"
  "function finalizeResult(uint64 clearA, uint64 clearB, bytes calldata decryptionProof)",

  // TODO: Add any read functions for polling mode
  "function finalized() view returns (bool)",
  "function revealRequested() view returns (bool)",
];

// ────────────────────────────────────────────────────────────
// Config — loaded from environment
// ────────────────────────────────────────────────────────────
const config = {
  rpcUrl:          process.env.RPC_URL!,
  privateKey:      process.env.KEEPER_PRIVATE_KEY!,
  contractAddress: process.env.CONTRACT_ADDRESS!,  // from deployments.json
  pollIntervalMs:  parseInt(process.env.POLL_INTERVAL_MS ?? "30000"),
};

// ────────────────────────────────────────────────────────────
// Setup
// ────────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet   = new ethers.Wallet(config.privateKey, provider);
const contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, wallet);

let fhevmInstance: FhevmInstance;

async function initFhevm(): Promise<void> {
  fhevmInstance = await createInstance();
  console.log("✅ FHEVM instance initialized");
}

// ────────────────────────────────────────────────────────────
// Core: Off-chain Decrypt → On-chain Submit
// ────────────────────────────────────────────────────────────
// Pre-implemented: full reveal pipeline
// ⚠️ handle order in array MUST match on-chain abi.encode order
async function executeReveal(handles: string[]): Promise<void> {
  console.log(`🔐 Starting public decrypt for ${handles.length} handle(s)...`);

  // Step 2 (off-chain): request decryption from Zama KMS
  const results = await fhevmInstance.publicDecrypt(handles);
  console.log("✅ Off-chain decryption complete");

  // TODO: Extract clear values in the correct order matching your finalize function
  // The key is the handle (as hex string), the value is bigint or boolean
  const clearA = results.clearValues[handles[0]] as bigint;
  const clearB = results.clearValues[handles[1]] as bigint;
  const proof  = results.decryptionProof;

  console.log(`  clearA: ${clearA}, clearB: ${clearB}`);

  // Step 3 (on-chain): submit proof to contract
  // TODO: Call YOUR contract's finalize function here
  const tx = await contract.finalizeResult(clearA, clearB, proof);
  console.log(`⏳ Finalize tx submitted: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`✅ Finalized in block ${receipt?.blockNumber}`);
}

// ────────────────────────────────────────────────────────────
// Mode A: Event-Driven (recommended)
// ────────────────────────────────────────────────────────────
async function startEventListener(): Promise<void> {
  console.log("👂 Listening for RevealRequested events...");

  // TODO: Replace "RevealRequested" with your event name
  contract.on("RevealRequested", async (handle1: string, handle2: string) => {
    console.log("\n📡 RevealRequested event received");
    try {
      // ⚠️ Order here must match abi.encode order in your finalize function
      await executeReveal([handle1, handle2]);
    } catch (e: any) {
      console.error("❌ Keeper error:", e.message ?? e);
      // TODO: Add alerting (Slack, PagerDuty, etc.) for production
    }
  });
}

// ────────────────────────────────────────────────────────────
// Mode B: Polling (simpler, use if events are unreliable)
// ────────────────────────────────────────────────────────────
async function startPolling(): Promise<void> {
  console.log(`🔄 Polling every ${config.pollIntervalMs}ms...`);

  const poll = async () => {
    try {
      const isFinalized     = await contract.finalized();
      const revealRequested = await contract.revealRequested();

      if (revealRequested && !isFinalized) {
        console.log("📡 Reveal needed — fetching handles...");

        // TODO: Replace with your contract's method to get handles
        // const handle1 = await contract.getEncryptedResultA();
        // const handle2 = await contract.getEncryptedResultB();
        // await executeReveal([handle1, handle2]);
      }
    } catch (e: any) {
      console.error("❌ Poll error:", e.message ?? e);
    }
  };

  // Run immediately, then on interval
  await poll();
  setInterval(poll, config.pollIntervalMs);
}

// ────────────────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────────────────
async function healthCheck(): Promise<void> {
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Keeper balance: ${ethers.formatEther(balance)} ETH`);
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  WARNING: Keeper wallet balance is low — refund to avoid failed txs");
  }
  const network = await provider.getNetwork();
  console.log(`🌐 Connected to: ${network.name} (chainId: ${network.chainId})`);
  console.log(`📋 Contract: ${config.contractAddress}`);
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  FHEVM Keeper Service");
  console.log("═══════════════════════════════════════════");

  await healthCheck();
  await initFhevm();

  // TODO: Choose your mode — event-driven (recommended) or polling
  await startEventListener(); // Mode A — event-driven
  // await startPolling();    // Mode B — polling (uncomment to use instead)

  console.log("\n🚀 Keeper running. Waiting for events...\n");
  // Keep process alive
  await new Promise(() => {});
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
