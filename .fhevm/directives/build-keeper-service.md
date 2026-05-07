---
name: build-keeper-service
description: Backend keeper/relayer patterns — Dual transport, Event watching, and Node-side decryption
version: "@zama-fhe/relayer-sdk ^0.4.2 | viem ^2.0.0"
validated: 2026-05-08
---

## Dual Transport Pattern
Always use two clients: WebSocket for reliable event watching and HTTP for stable reads/writes/decryption.

```typescript
import { createPublicClient, createWalletClient, webSocket, http } from "viem";
import { sepolia } from "viem/chains";

// 1. Events Only (WS)
const wsClient = createPublicClient({ 
  chain: sepolia, 
  transport: webSocket(process.env.RPC_URL_WSS) 
});

// 2. Reads + Writes + Decryption (HTTP)
const httpClient = createPublicClient({ 
  chain: sepolia, 
  transport: http(process.env.HTTP_RPC_URL) 
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY),
  chain: sepolia,
  transport: http(process.env.HTTP_RPC_URL)
});
```

## Node-Side Initialization (Relayer SDK)
Use the `@zama-fhe/relayer-sdk/node` entry point. Use lazy require to prevent startup crashes in environments where WASM loading might be deferred.

```typescript
const sdk = require("@zama-fhe/relayer-sdk/node");

async function initKeeperSDK() {
  const instance = await sdk.createInstance({
    ...sdk.SepoliaConfig,
    network: process.env.HTTP_RPC_URL
  });
  return instance;
}
```

## Keeper Decryption (userDecrypt)
When a keeper needs to reveal a result (e.g., after an event triggers), it uses `userDecrypt` signing as the keeper account.

```typescript
async function keeperReveal(handle: string, contractAddress: string) {
  const instance = await initKeeperSDK();
  const { publicKey, privateKey } = instance.generateKeypair();
  
  const now = Math.floor(Date.now() / 1000);
  const duration = 1;

  // 1. Keeper signs typed data
  const eip712 = instance.createEIP712(publicKey, [contractAddress], now, duration);
  const signature = await walletClient.signTypedData(eip712);

  // 2. 8-argument userDecrypt
  const results = await instance.userDecrypt(
    [{ handle, contractAddress }],
    privateKey,
    publicKey,
    signature,
    [contractAddress],
    keeperAddress,
    now,
    duration
  );

  return results[handle];
}
```

## Event-Driven Architecture (NestJS)
Use `EventEmitter2` to decouple event listening from business logic.
- `EventsService`: Watches the chain with `wsClient.watchContractEvent` and emits local events.
- `KeeperService`: Listens for local events with `@OnEvent` and performs the reveal logic.

## Fingerprint Reference
- `fingerprints/relayer-sdk-node-api.md`
- `fingerprints/viem-keeper-api.md`
- `fingerprints/nestjs-module-api.md`

## Common Pitfalls
- **E4:** Using HTTP transport for `watchContractEvent` (silently drops events).
- **E8:** Forgetting to pad `eaddress` bigint to 40 hex characters when converting back to an Ethereum address.
- **A5:** Sharing one `http()` client for both events and writes.
