import { ethers } from "hardhat";

async function main() {
  console.log("▶️  Unpausing DailyRewardClaim contract...\n");

  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }

  const [signer] = await ethers.getSigners();
  console.log(`👤 Unpausing from: ${signer.address}\n`);

  const contract = await ethers.getContractAt("DailyRewardClaim", CONTRACT_ADDRESS);

  // Check if already unpaused
  const isPaused = await contract.paused();
  if (!isPaused) {
    console.log("⚠️  Contract is already active!");
    return;
  }

  console.log("📝 Sending unpause transaction...");
  const tx = await contract.unpause();
  console.log(`   Transaction: ${tx.hash}`);
  await tx.wait();

  console.log("\n✅ Contract unpaused successfully!");
  console.log("🎉 Claims are now enabled again.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unpause failed:", error);
    process.exit(1);
  });
