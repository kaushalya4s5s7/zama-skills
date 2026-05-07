import { Injectable, OnModuleInit } from "@nestjs/common";
import { createPublicClient, createWalletClient, webSocket, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
const sdk = require("@zama-fhe/relayer-sdk/node");

@Injectable()
export class KeeperService implements OnModuleInit {
  private wsClient: any;
  private httpClient: any;
  private walletClient: any;
  private fhevm: any;

  async onModuleInit() {
    this.wsClient = createPublicClient({ 
      chain: sepolia, 
      transport: webSocket(process.env.RPC_URL_WSS!) 
    });

    this.httpClient = createPublicClient({ 
      chain: sepolia, 
      transport: http(process.env.HTTP_RPC_URL!) 
    });

    this.walletClient = createWalletClient({
      account: privateKeyToAccount(process.env.KEEPER_PRIVATE_KEY! as `0x${string}`),
      chain: sepolia,
      transport: http(process.env.HTTP_RPC_URL!)
    });

    this.fhevm = await sdk.createInstance({
      ...sdk.SepoliaConfig,
      network: process.env.HTTP_RPC_URL!
    });

    this.startWatching();
  }

  private startWatching() {
    this.wsClient.watchContractEvent({
      address: process.env.CONTRACT_ADDRESS,
      abi: parseAbi(["event ResultReady(bytes32 indexed handle)"]),
      eventName: "ResultReady",
      onLogs: (logs: any) => this.handleResult(logs[0].args.handle)
    });
  }

  private async handleResult(handle: string) {
    const { publicKey, privateKey } = this.fhevm.generateKeypair();
    const now = Math.floor(Date.now() / 1000);
    const duration = 1;

    const eip712 = this.fhevm.createEIP712(publicKey, [process.env.CONTRACT_ADDRESS], now, duration);
    const signature = await this.walletClient.signTypedData(eip712);

    const results = await this.fhevm.userDecrypt(
      [{ handle, contractAddress: process.env.CONTRACT_ADDRESS }],
      privateKey, publicKey, signature,
      [process.env.CONTRACT_ADDRESS], 
      this.walletClient.account.address,
      now, duration
    );

    const clearValue = results[handle];

    // Finalize on-chain
    await this.walletClient.writeContract({
      address: process.env.CONTRACT_ADDRESS,
      abi: parseAbi(["function finalize(uint64 value) external"]),
      functionName: "finalize",
      args: [clearValue],
      gasLimit: 500_000n
    });
  }
}
