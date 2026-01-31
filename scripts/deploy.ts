import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // USDC Contract Addresses on Base
  const USDC_ADDRESSES = {
    mainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    sepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };

  // Detect network
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === BigInt(8453) ? "mainnet" : "sepolia";
  const usdcAddress = USDC_ADDRESSES[networkName as keyof typeof USDC_ADDRESSES];

  console.log(`📡 Network: Base ${networkName} (${network.chainId})`);
  console.log(`💵 USDC Address: ${usdcAddress}\n`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying from: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy contract
  console.log("📝 Deploying DailyRewardClaim contract...");
  const DailyRewardClaim = await ethers.getContractFactory("DailyRewardClaim");
  const contract = await DailyRewardClaim.deploy(usdcAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contract deployed successfully!");
  console.log(`📍 Address: ${contractAddress}\n`);

  // Display contract info
  console.log("📊 Contract Configuration:");
  console.log(`   - Base Reward: 0.001 USDC (1000 units)`);
  console.log(`   - Streak Bonus: 10% per day`);
  console.log(`   - Cooldown: 24 hours`);
  console.log(`   - Grace Period: 2 hours`);
  console.log(`   - Max Streak: 30 days\n`);

  // Verification info
  console.log("🔍 To verify on Basescan, run:");
  console.log(`   npx hardhat verify --network ${networkName === "mainnet" ? "base" : "baseSepolia"} ${contractAddress} ${usdcAddress}\n`);

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    contractAddress,
    usdcAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  console.log("💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Next steps
  console.log("\n\n📋 NEXT STEPS:");
  console.log("1. Verify contract on Basescan (see command above)");
  console.log("2. Fund contract with USDC:");
  console.log(`   - Approve USDC: ${usdcAddress}`);
  console.log(`   - Call fundContract() with amount (e.g., 100000000 = 100 USDC)`);
  console.log("3. Update frontend with contract address:");
  console.log(`   - CONTRACT_ADDRESS = "${contractAddress}"`);
  console.log("4. Test claim functionality with a test wallet");
  console.log("5. Monitor contract balance and user activity\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
