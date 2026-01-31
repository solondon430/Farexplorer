import { ethers } from "hardhat";

async function main() {
  console.log("💰 Funding DailyRewardClaim contract...\n");

  // Contract address (UPDATE THIS after deployment)
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }

  // Amount to fund (in USDC - 6 decimals)
  const AMOUNT_USDC = process.env.FUND_AMOUNT || "100"; // Default: 100 USDC
  const amount = ethers.parseUnits(AMOUNT_USDC, 6); // USDC has 6 decimals

  // USDC Contract Addresses
  const USDC_ADDRESSES = {
    mainnet: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    sepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };

  // Detect network
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === BigInt(8453) ? "mainnet" : "sepolia";
  const usdcAddress = USDC_ADDRESSES[networkName as keyof typeof USDC_ADDRESSES];

  console.log(`📡 Network: Base ${networkName}`);
  console.log(`💵 USDC Address: ${usdcAddress}`);
  console.log(`🎯 Contract Address: ${CONTRACT_ADDRESS}`);
  console.log(`💸 Amount: ${AMOUNT_USDC} USDC\n`);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log(`👤 Funding from: ${signer.address}\n`);

  // USDC Contract ABI (minimal - just what we need)
  const USDC_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
  ];

  const usdc = new ethers.Contract(usdcAddress, USDC_ABI, signer);

  // Check USDC balance
  const balance = await usdc.balanceOf(signer.address);
  console.log(`💰 Your USDC Balance: ${ethers.formatUnits(balance, 6)} USDC`);

  if (balance < amount) {
    throw new Error("Insufficient USDC balance");
  }

  // Check current allowance
  const currentAllowance = await usdc.allowance(signer.address, CONTRACT_ADDRESS);
  console.log(`📝 Current Allowance: ${ethers.formatUnits(currentAllowance, 6)} USDC\n`);

  // Step 1: Approve USDC spending
  if (currentAllowance < amount) {
    console.log("✅ Step 1: Approving USDC...");
    const approveTx = await usdc.approve(CONTRACT_ADDRESS, amount);
    console.log(`   Transaction: ${approveTx.hash}`);
    await approveTx.wait();
    console.log("   ✅ Approved!\n");
  } else {
    console.log("✅ Already approved\n");
  }

  // Step 2: Fund contract
  console.log("✅ Step 2: Funding contract...");
  const contract = await ethers.getContractAt("DailyRewardClaim", CONTRACT_ADDRESS);
  const fundTx = await contract.fundContract(amount);
  console.log(`   Transaction: ${fundTx.hash}`);
  await fundTx.wait();
  console.log("   ✅ Contract funded!\n");

  // Get updated balance
  const contractBalance = await contract.getContractBalance();
  console.log(`💰 Contract Balance: ${ethers.formatUnits(contractBalance, 6)} USDC\n`);

  // Calculate how many claims this supports
  const baseReward = 1000; // 0.001 USDC in units
  const maxClaims = Number(contractBalance) / baseReward;
  console.log(`📊 This supports approximately ${Math.floor(maxClaims).toLocaleString()} claims\n`);

  console.log("✅ Funding complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Funding failed:", error);
    process.exit(1);
  });
