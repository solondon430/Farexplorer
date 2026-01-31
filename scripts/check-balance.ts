import { ethers } from "hardhat";

async function main() {
  console.log("📊 Checking DailyRewardClaim contract status...\n");

  // Contract address (UPDATE THIS after deployment)
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }

  // Detect network
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === BigInt(8453) ? "mainnet" : "sepolia";

  console.log(`📡 Network: Base ${networkName}`);
  console.log(`🎯 Contract: ${CONTRACT_ADDRESS}\n`);

  // Get contract instance
  const contract = await ethers.getContractAt("DailyRewardClaim", CONTRACT_ADDRESS);

  // Get contract balance
  const balance = await contract.getContractBalance();
  console.log(`💰 Contract Balance: ${ethers.formatUnits(balance, 6)} USDC\n`);

  // Get statistics
  const stats = await contract.getStats();
  const [distributed, users, contractBalance] = stats;

  console.log("📈 Statistics:");
  console.log(`   Total Distributed: ${ethers.formatUnits(distributed, 6)} USDC`);
  console.log(`   Total Users: ${users.toString()}`);
  console.log(`   Current Balance: ${ethers.formatUnits(contractBalance, 6)} USDC\n`);

  // Calculate remaining claims
  const baseReward = 1000; // 0.001 USDC in units
  const remainingClaims = Number(balance) / baseReward;
  
  console.log("📊 Capacity:");
  console.log(`   Remaining Claims: ~${Math.floor(remainingClaims).toLocaleString()}`);
  console.log(`   Base Reward: 0.001 USDC per claim`);
  
  // Warning if low balance
  if (remainingClaims < 100) {
    console.log("\n⚠️  WARNING: Contract balance is low! Consider funding soon.");
  } else if (remainingClaims < 1000) {
    console.log("\n⚡ Notice: Contract balance getting low. Plan to fund soon.");
  } else {
    console.log("\n✅ Contract balance is healthy!");
  }

  // Get contract owner
  const owner = await contract.owner();
  console.log(`\n👤 Owner: ${owner}`);

  // Check if paused
  const isPaused = await contract.paused();
  console.log(`🔒 Status: ${isPaused ? "PAUSED ⚠️" : "Active ✅"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
