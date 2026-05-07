// deploy-scaffold.ts
// Validated: @fhevm/hardhat-plugin ^0.4.2 | 2026-05-07
// ============================================================
// FHEVM DEPLOY SCAFFOLD — Hardhat Deploy Script
// ============================================================
// Fill TODO comments with your contract name and constructor args.
// Run: npx hardhat run scripts/deploy.ts --network <network>
// ============================================================

import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ────────────────────────────────────────────────────────────
// TODO: Replace "MyContract" with your contract name
// TODO: Update CONSTRUCTOR_ARGS with your actual args
// ────────────────────────────────────────────────────────────
const CONTRACT_NAME = "MyContract"; // TODO: replace

async function getConstructorArgs(deployer: any): Promise<any[]> {
  return [
    deployer.address,  // initialOwner — common first arg
    // TODO: add other constructor arguments here
    // Examples:
    // 1000n,           // initial supply (uint64)
    // "My Token",      // name
    // "MTKN",          // symbol
    // "https://...",   // contractURI
  ];
}

// ────────────────────────────────────────────────────────────
// Deployment Registry — records all deployments to JSON
// ────────────────────────────────────────────────────────────
interface DeploymentRecord {
  address: string;
  deployer: string;
  network: string;
  chainId: number;
  deployedAt: string;
  constructorArgs: any[];
  txHash: string;
}

function saveDeployment(record: DeploymentRecord) {
  const registryPath = path.join(__dirname, "../deployments.json");
  let registry: Record<string, Record<string, DeploymentRecord>> = {};

  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  }

  if (!registry[record.network]) registry[record.network] = {};
  registry[record.network][CONTRACT_NAME] = record;

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log(`📝 Deployment recorded in deployments.json`);
}

// ────────────────────────────────────────────────────────────
// Main Deploy Function
// ────────────────────────────────────────────────────────────
async function main() {
  const [deployer] = await ethers.getSigners();
  const { name: networkName, chainId } = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════");
  console.log(`  Deploying: ${CONTRACT_NAME}`);
  console.log(`  Network:   ${networkName} (chainId: ${chainId})`);
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("═══════════════════════════════════════════");

  // Pre-implemented: get constructor args
  const args = await getConstructorArgs(deployer);
  console.log(`  Constructor args: ${JSON.stringify(args)}`);

  // Pre-implemented: deploy
  const Factory = await ethers.getContractFactory(CONTRACT_NAME);
  console.log("\n⏳ Deploying...");
  const contract = await Factory.deploy(...args);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("\n✅ Deployed successfully!");
  console.log(`  Contract Address: ${address}`);
  console.log(`  Transaction Hash: ${deployTx?.hash}`);

  // Pre-implemented: save to registry
  saveDeployment({
    address,
    deployer: deployer.address,
    network: networkName,
    chainId: Number(chainId),
    deployedAt: new Date().toISOString(),
    constructorArgs: args,
    txHash: deployTx?.hash ?? "",
  });

  // Pre-implemented: verification hint
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n📋 To verify on Etherscan:");
    const argsStr = args.map(a => JSON.stringify(a)).join(" ");
    console.log(`  npx hardhat verify --network ${networkName} ${address} ${argsStr}`);
  }

  console.log("\n🔑 IMPORTANT: Record this address for your backend service and frontend:");
  console.log(`  CONTRACT_ADDRESS=${address}`);

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
