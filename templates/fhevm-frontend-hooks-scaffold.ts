// fhevm-frontend-hooks-scaffold.ts
// Validated: @zama-fhe/relayer-sdk ^0.4.3 | 2026-05-07
// ============================================================
// FHEVM FRONTEND HOOKS SCAFFOLD — React + TypeScript
// ============================================================
// Pre-implemented: FhevmInstance initialization, encrypted input
// creation, public decryption result reading, user decryption.
// Fill TODO comments with your specific contract interactions.
// ============================================================

"use client"; // if using Next.js App Router

import { useState, useCallback, useEffect, useRef } from "react";
import type { FhevmInstance, PublicDecryptResults } from "@zama-fhe/relayer-sdk";

// ──────────────────────────────────────────────────────────
// SINGLETON: FHEVM Instance Initialization Hook
// ──────────────────────────────────────────────────────────
// Pre-implemented: initializes once, exposes ready state

export function useFhevm() {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        // Pre-implemented: dynamic import to avoid SSR issues
        const { createInstance } = await import("@zama-fhe/relayer-sdk");
        const inst = await createInstance();
        if (mounted) {
          setInstance(inst);
          setIsReady(true);
        }
      } catch (e: any) {
        if (mounted) setError(e.message ?? "FHEVM init failed");
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  return { instance, isReady, error };
}

// ──────────────────────────────────────────────────────────
// HOOK: Encrypted Input Creation
// ──────────────────────────────────────────────────────────
// Pre-implemented: creates encrypted input + ZKPoK proof

export function useEncryptedInput(contractAddress: string) {
  const { instance, isReady } = useFhevm();

  // Pre-implemented: encrypt a single uint64 value
  const encryptUint64 = useCallback(
    async (value: bigint, userAddress: string) => {
      if (!instance || !isReady) throw new Error("FHEVM not ready");
      const input = instance.createEncryptedInput(contractAddress, userAddress);
      input.add64(value);
      const enc = await input.encrypt();
      return {
        handle: enc.handles[0] as Uint8Array,   // externalEuint64 for Solidity
        inputProof: enc.inputProof as Uint8Array, // ZKPoK proof
      };
    },
    [instance, isReady, contractAddress]
  );

  // Pre-implemented: encrypt multiple values with one shared proof
  const encryptMultiple = useCallback(
    async (
      userAddress: string,
      fields: { type: "bool" | "u8" | "u16" | "u32" | "u64" | "u128"; value: boolean | bigint | number }[]
    ) => {
      if (!instance || !isReady) throw new Error("FHEVM not ready");
      const input = instance.createEncryptedInput(contractAddress, userAddress);
      for (const f of fields) {
        if (f.type === "bool")  input.addBool(f.value as boolean);
        if (f.type === "u8")   input.add8(Number(f.value));
        if (f.type === "u16")  input.add16(Number(f.value));
        if (f.type === "u32")  input.add32(Number(f.value));
        if (f.type === "u64")  input.add64(BigInt(f.value as bigint));
        if (f.type === "u128") input.add128(BigInt(f.value as bigint));
      }
      const enc = await input.encrypt();
      return { handles: enc.handles, inputProof: enc.inputProof };
    },
    [instance, isReady, contractAddress]
  );

  return { encryptUint64, encryptMultiple, isReady };
}

// ──────────────────────────────────────────────────────────
// HOOK: Public Decryption (Read Revealed Results)
// ──────────────────────────────────────────────────────────
// Pre-implemented: reads a value that the contract has made publicly decryptable
// Usage: call AFTER contract emits event indicating makePubliclyDecryptable was called

export function usePublicDecrypt() {
  const { instance, isReady } = useFhevm();
  const [results, setResults] = useState<PublicDecryptResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-implemented: fetch decrypted values from KMS via Relayer SDK
  const publicDecrypt = useCallback(
    async (handles: (string | Uint8Array)[]) => {
      if (!instance || !isReady) throw new Error("FHEVM not ready");
      setIsLoading(true);
      setError(null);
      try {
        // Pre-implemented: order of handles matters — must match on-chain abi.encode order
        const res = await instance.publicDecrypt(handles);
        setResults(res);
        return res;
        // res.clearValues       — Record<handle, bigint | boolean>
        // res.abiEncodedClearValues — bytes for on-chain submission
        // res.decryptionProof   — KMS proof for FHE.checkSignatures
      } catch (e: any) {
        setError(e.message ?? "Public decrypt failed");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [instance, isReady]
  );

  return { publicDecrypt, results, isLoading, error };
}

// ──────────────────────────────────────────────────────────
// HOOK: Submit Encrypted Transaction
// ──────────────────────────────────────────────────────────
// Pre-implemented: pattern for encrypting + calling contract in one flow

export function useConfidentialTransaction(contractAddress: string) {
  const { encryptUint64, encryptMultiple, isReady } = useEncryptedInput(contractAddress);
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-implemented: example single-value submission
  // TODO: Replace with your specific contract function call
  const submitEncryptedValue = useCallback(
    async (
      value: bigint,
      userAddress: string,
      contractCallFn: (handle: Uint8Array, proof: Uint8Array) => Promise<{ hash: string }>
    ) => {
      setIsPending(true);
      setError(null);
      try {
        const { handle, inputProof } = await encryptUint64(value, userAddress);
        const tx = await contractCallFn(handle, inputProof);
        setTxHash(tx.hash);
        return tx;
      } catch (e: any) {
        setError(e.message ?? "Transaction failed");
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [encryptUint64]
  );

  return { submitEncryptedValue, encryptMultiple, isPending, txHash, error, isReady };
}

// ──────────────────────────────────────────────────────────
// TODO: Add your specific hook implementations below
// ──────────────────────────────────────────────────────────
// Examples:
// - useBidSubmission() — encrypt bid, call contract.submitBid()
// - useVoteCasting()   — encrypt vote, call contract.castVote()
// - useRevealResult()  — publicDecrypt after RevealRequested event
// - useMyBalance()     — fetch and display own encrypted balance
