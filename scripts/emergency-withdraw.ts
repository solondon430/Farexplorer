import { ethers } from "hardhat";

async function main() {
  console.log("🚨 EMERGENCY WITHDRAW - DailyRewardClaim\n");

  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }

  const [signer] = await ethers.getSigners();
  console.log(`👤 Withdrawing to: ${signer.address}\n`);

  const contract = await ethers.getContractAt("DailyRewardClaim", CONTRACT_ADDRESS);

  // Check owner
  const owner = await contract.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Only owner can emergency withdraw!");
  }

  // Get current balance
  const balance = await contract.getContractBalance();
  console.log(`💰 Current Balance: ${ethers.formatUnits(balance, 6)} USDC\n`);

  if (balance === BigInt(0)) {
    console.log("⚠️  No balance to withdraw!");
    return;
  }

  // Confirm action
  console.log("⚠️  WARNING: This will withdraw ALL USDC from the contract!");
  console.log("⚠️  Users will not be able to claim rewards until you fund again!\n");

  console.log("📝 Sending emergency withdraw transaction...");
  const tx = await contract.emergencyWithdraw();
  console.log(`   Transaction: ${tx.hash}`);
  await tx.wait();

  console.log("\n✅ Emergency withdraw completed!");
  console.log(`💰 Withdrawn: ${ethers.formatUnits(balance, 6)} USDC`);
  console.log(`📍 To: ${signer.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Emergency withdraw failed:", error);
    process.exit(1);
  });
