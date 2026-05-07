---
name: relayer-sdk-node-api
description: Exact @zama-fhe/relayer-sdk/node patterns — backend keeper decryption only
version: "@zama-fhe/relayer-sdk ^0.4.2"
validated: 2026-05-08
---

## Lazy require (avoid startup crash)
const sdk = require("@zama-fhe/relayer-sdk/node");

## Init
const instance = await sdk.createInstance({ ...sdk.SepoliaConfig, network: HTTP_RPC_URL });

## Same userDecrypt API as web (keeper signs as itself)
const { publicKey, privateKey } = instance.generateKeypair();
const now = Math.floor(Date.now() / 1000);
const eip712 = instance.createEIP712(publicKey, [contractAddr], now, 1);
const sig = await walletClient.signTypedData({ domain, types, primaryType, message });
const result = await instance.userDecrypt(
  [{ handle, contractAddress }], privateKey, publicKey, sig,
  [contractAddress], keeperAddress, now, 1
);
// eaddress: result[handle].toString(16).padStart(40, '0') → getAddress(`0x${...}`)
