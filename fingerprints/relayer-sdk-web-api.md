---
name: relayer-sdk-web-api
description: Exact @zama-fhe/relayer-sdk/web API signatures — load before any frontend FHE code
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Import
import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from "@zama-fhe/relayer-sdk/web";

## Init (two steps — ALWAYS both)
await initSDK({ tfheParams: "/wasm/tfhe_bg.wasm", kmsParams: "/wasm/kms_lib_bg.wasm" });
instance = await createInstance({ ...SepoliaConfig, network: process.env.NEXT_PUBLIC_RPC_URL });

## Encrypt
const input = instance.createEncryptedInput(contractAddress: string, userAddress: string);
input.add64(value: bigint): void
input.addBool(flag: boolean): void
const { handles: Uint8Array[], inputProof: Uint8Array } = await input.encrypt();
// Wrap with viem toHex(): toHex(handles[0]), toHex(inputProof)

## Decrypt (userDecrypt — NOT reencrypt)
const { publicKey, privateKey } = instance.generateKeypair();
const now = Math.floor(Date.now() / 1000);
const eip712 = instance.createEIP712(publicKey, [contractAddr], now, 1); // startTimestamp, durationDays
// Sign: walletClient.signTypedData({ account, ...eip712 })
const results: Record<string, bigint|boolean|`0x${string}`> = await instance.userDecrypt(
  items: Array<{handle: string, contractAddress: string}>,
  privateKey: string, publicKey: string, signature: string,
  contractAddresses: string[], userAddress: string,
  startTimestamp: number, durationDays: number
);
