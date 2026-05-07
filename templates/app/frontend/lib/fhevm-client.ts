import { initSDK, createInstance, SepoliaConfig, FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instance: FhevmInstance | null = null;

export const getFhevmInstance = async (rpcUrl: string) => {
  if (instance) return instance;

  await initSDK({
    tfheParams: "/wasm/tfhe_bg.wasm",
    kmsParams: "/wasm/kms_lib_bg.wasm"
  });

  instance = await createInstance({
    ...SepoliaConfig,
    network: rpcUrl
  });

  return instance;
};
