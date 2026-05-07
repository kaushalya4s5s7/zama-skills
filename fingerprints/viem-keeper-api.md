---
name: viem-keeper-api
description: Exact viem v2 patterns for backend keeper — dual transport setup
version: "viem ^2.0.0"
validated: 2026-05-08
---

## Imports
import { createPublicClient, createWalletClient, webSocket, http, parseAbi, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

## Dual Transport (ALWAYS two clients)
// Events ONLY: WebSocket
const wsClient = createPublicClient({ chain: sepolia, transport: webSocket(RPC_URL_WSS) });
// Reads + Writes: HTTP
const httpClient = createPublicClient({ chain: sepolia, transport: http(HTTP_RPC_URL) });
const walletClient = createWalletClient({
  account: privateKeyToAccount(KEEPER_PRIVATE_KEY),
  chain: sepolia, transport: http(HTTP_RPC_URL)
});

## Watch Events
wsClient.watchContractEvent({ address, abi, eventName, onLogs: (logs) => { ... } });

## Read
await httpClient.readContract({ address, abi, functionName, args });

## Write
const hash = await walletClient.writeContract({ address, abi, functionName, args, chain: sepolia });
await httpClient.waitForTransactionReceipt({ hash });

## Parse ABI
parseAbi(["function myFn(uint256 id) external", "event MyEvent(uint256 indexed id)"])
parseAbiItem("event PositionOpened(uint256 indexed positionId, address buyer)")
