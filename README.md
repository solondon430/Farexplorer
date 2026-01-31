# Farcaster Explorer - Daily Rewards

A Farcaster Mini App with blockchain-based daily rewards on Base.

## 🎯 Features

- **Daily USDC Rewards**: Claim 0.001 USDC every 24 hours
- **Streak System**: Get 10% bonus per consecutive day (up to 30 days)
- **Base Chain**: Rewards distributed on Base blockchain
- **OnchainKit Integration**: Seamless wallet connection
- **Real-time Tracking**: View your claims, streaks, and earnings

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x
- Base wallet with ETH for gas
- USDC for funding the contract

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys
```

### Development

```bash
# Run Next.js dev server
npm run dev

# Compile smart contracts
npx hardhat compile

# Run tests
npx hardhat test
```

## 📦 Smart Contract Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deploy

```bash
# 1. Deploy to testnet
npx hardhat run scripts/deploy.ts --network baseSepolia

# 2. Verify on Basescan
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS USDC_ADDRESS

# 3. Fund contract
npx hardhat run scripts/fund-contract.ts --network baseSepolia

# 4. Update frontend
# Edit src/lib/contractABI.ts with your contract address
```

## 🔧 Useful Scripts

```bash
# Check contract balance
npx hardhat run scripts/check-balance.ts --network base

# Pause contract (emergency)
npx hardhat run scripts/pause.ts --network base

# Unpause contract
npx hardhat run scripts/unpause.ts --network base

# Emergency withdraw
npx hardhat run scripts/emergency-withdraw.ts --network base
```

## 📊 Contract Configuration

- **Base Reward**: 0.001 USDC (1000 units)
- **Streak Bonus**: 10% per day
- **Cooldown**: 24 hours
- **Grace Period**: 2 hours (to maintain streak)
- **Max Streak**: 30 days (300% max bonus)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Blockchain**: Base (L2), Viem, Wagmi
- **Wallet**: OnchainKit (Coinbase Smart Wallet)
- **Smart Contracts**: Solidity 0.8.20, Hardhat
- **Testing**: Hardhat, Chai

## 🔐 Security

⚠️ **IMPORTANT**: This contract is unaudited. Start with small amounts.

- Start with $50-100 USDC maximum
- Use 0.001 USDC per claim
- Monitor closely during beta phase
- Have emergency pause ready
- Consider professional audit before scaling

See [Security Guidelines](./DEPLOYMENT_GUIDE.md#-security-checklist) for more.

## 📈 Economics

Example costs with 0.001 USDC per claim:

| Users/Day | Cost/Day | Cost/Month |
|-----------|----------|------------|
| 100 | $0.10 | $3.00 |
| 1,000 | $1.00 | $30.00 |
| 10,000 | $10.00 | $300.00 |

*With streak bonuses, multiply by ~1.5-2x*

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch
3. Test thoroughly
4. Submit a PR

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Base Discord: https://discord.gg/buildonbase
- Farcaster Dev: @base
- Issues: GitHub Issues

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. The smart contract is unaudited. Start with small amounts and test extensively before scaling.

---

Built with ❤️ on Base
