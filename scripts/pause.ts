import { ethers } from "hardhat";

async function main() {
  console.log("⏸️  Pausing DailyRewardClaim contract...\n");

  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }

  const [signer] = await ethers.getSigners();
  console.log(`👤 Pausing from: ${signer.address}\n`);

  const contract = await ethers.getContractAt("DailyRewardClaim", CONTRACT_ADDRESS);

  // Check if already paused
  const isPaused = await contract.paused();
  if (isPaused) {
    console.log("⚠️  Contract is already paused!");
    return;
  }

  console.log("📝 Sending pause transaction...");
  const tx = await contract.pause();
  console.log(`   Transaction: ${tx.hash}`);
  await tx.wait();

  console.log("\n✅ Contract paused successfully!");
  console.log("⚠️  All claims are now disabled until unpause.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Pause failed:", error);
    process.exit(1);
  });
