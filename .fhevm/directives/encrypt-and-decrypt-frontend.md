---
name: encrypt-and-decrypt-frontend
description: Frontend FHE operations — encrypting inputs and decrypting results with Relayer SDK
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## SDK Import (React / Next.js)
```typescript
import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { toHex } from "viem";
```
**Rule:** Always use `@zama-fhe/relayer-sdk/web` for frontend. Never use `fhevmjs` directly.

## Instance Initialization (Two-Step)
You must initialize the WASM binaries before creating an instance.
```typescript
let instance: FhevmInstance;

async function getFhevmInstance() {
  if (instance) return instance;
  
  // 1. Init SDK (WASM blobs)
  await initSDK({ 
    tfheParams: "/wasm/tfhe_bg.wasm", 
    kmsParams: "/wasm/kms_lib_bg.wasm" 
  });

  // 2. Create Instance with Sepolia Config
  instance = await createInstance({
    ...SepoliaConfig,
    network: process.env.NEXT_PUBLIC_RPC_URL // e.g., Infura/Alchemy Sepolia URL
  });
  
  return instance;
}
```

## Encrypting User Inputs
Use a single `createEncryptedInput` for all values intended for the same transaction to minimize proofs.
```typescript
async function encryptInputs(contractAddress: string, userAddress: string, value: bigint) {
  const inst = await getFhevmInstance();
  const input = inst.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);
  
  const encrypted = await input.encrypt();
  return {
    handle: toHex(encrypted.handles[0]),
    inputProof: toHex(encrypted.inputProof)
  };
}
```

## Decrypting Results (userDecrypt)
The `userDecrypt` function replaces the old `reencrypt`. It requires 8 arguments and an EIP-712 signature.
```typescript
async function decryptBalance(contractAddress: string, handle: string, userAddress: string, walletClient: any) {
  const inst = await getFhevmInstance();
  const { publicKey, privateKey } = inst.generateKeypair();
  
  const now = Math.floor(Date.now() / 1000);
  const duration = 1; // 1 day
  
  // 1. Create EIP-712 Typed Data
  const eip712 = inst.createEIP712(publicKey, [contractAddress], now, duration);
  
  // 2. Get User Signature
  const signature = await walletClient.signTypedData({
    account: userAddress,
    ...eip712
  });

  // 3. Decrypt with 8 arguments
  const results = await inst.userDecrypt(
    [{ handle, contractAddress }],
    privateKey,
    publicKey,
    signature,
    [contractAddress],
    userAddress,
    now,
    duration
  );

  return results[handle]; // Returns bigint, boolean, or string
}
```

## Fingerprint Reference
See `fingerprints/relayer-sdk-web-api.md` for exact signatures.

## Common Pitfalls
- **A1:** Calling `createInstance()` without `SepoliaConfig` or `network`.
- **A4:** Using `instance.reencrypt` (deprecated/removed) instead of `userDecrypt`.
- **E7:** Generating multiple proofs for one transaction — use `input.add64()` multiple times instead.
