# ⚡ Quick Start - Deploy Smart Contract (5 Minutes)

## 🎯 Super Quick Guide (Untuk yang sudah punya MetaMask & Test ETH)

### 1️⃣ Buka Remix
- Go to [remix.ethereum.org](https://remix.ethereum.org)
- Tidak perlu login!

### 2️⃣ Create File
- File Explorer → contracts folder
- Click "+" icon
- Name: `ScheduledCastRegistry.sol`

### 3️⃣ Copy Contract
Copy dari `contracts/ScheduledCastRegistry.sol` atau grab dari PANDUAN_DEPLOY_REMIX.md

### 4️⃣ Compile
- Click "Solidity Compiler" icon (sidebar)
- Compiler: 0.8.20+
- Click "Compile ScheduledCastRegistry.sol"

### 5️⃣ Deploy
- Click "Deploy & Run" icon (sidebar)
- Environment: "Injected Provider - MetaMask"
- Connect MetaMask (Base Sepolia network)
- Click "Deploy"
- Confirm in MetaMask

### 6️⃣ Copy Address
- In "Deployed Contracts", copy contract address
- Format: `0x123abc...`

### 7️⃣ Update App
Open `src/contracts/ScheduledCastRegistry.ts`:
```typescript
export const SCHEDULED_CAST_REGISTRY_ADDRESS = '0xYourAddressHere' as `0x${string}`;
```

### 8️⃣ Done! 🎉
Test app → Schedule tab → Check "Store onchain" → Schedule cast!

---

## 🆘 Butuh Help?

**Belum punya MetaMask?** → See PANDUAN_DEPLOY_REMIX.md STEP 1

**Belum punya Test ETH?** → See PANDUAN_DEPLOY_REMIX.md STEP 3

**Lengkap dengan screenshot?** → See PANDUAN_DEPLOY_REMIX.md (panduan lengkap)

---

## 📊 Time Breakdown:

- ⏱️ Remix setup: 1 min
- ⏱️ Copy & compile: 1 min
- ⏱️ Deploy: 2 min
- ⏱️ Update app: 1 min

**Total: ~5 minutes** ⚡
