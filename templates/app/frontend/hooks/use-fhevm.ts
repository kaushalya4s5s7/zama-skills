import { useState, useCallback } from "react";
import { getFhevmInstance } from "../lib/fhevm-client";
import { toHex } from "viem";

export function useFhevm(contractAddress: string) {
  const [loading, setLoading] = useState(false);

  const encrypt = useCallback(async (value: bigint, userAddress: string) => {
    setLoading(true);
    try {
      const inst = await getFhevmInstance(process.env.NEXT_PUBLIC_RPC_URL!);
      const input = inst.createEncryptedInput(contractAddress, userAddress);
      input.add64(value);
      const encrypted = await input.encrypt();
      return {
        handle: toHex(encrypted.handles[0]),
        inputProof: toHex(encrypted.inputProof)
      };
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

  const decrypt = useCallback(async (handle: string, userAddress: string, walletClient: any) => {
    setLoading(true);
    try {
      const inst = await getFhevmInstance(process.env.NEXT_PUBLIC_RPC_URL!);
      const { publicKey, privateKey } = inst.generateKeypair();
      const now = Math.floor(Date.now() / 1000);
      const duration = 1;

      const eip712 = inst.createEIP712(publicKey, [contractAddress], now, duration);
      const signature = await walletClient.signTypedData({
        account: userAddress,
        ...eip712
      });

      const results = await inst.userDecrypt(
        [{ handle, contractAddress }],
        privateKey, publicKey, signature,
        [contractAddress], userAddress,
        now, duration
      );

      return results[handle];
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

  return { encrypt, decrypt, loading };
}
