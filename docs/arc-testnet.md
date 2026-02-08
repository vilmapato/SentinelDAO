# SentinelDAO on Arc Testnet

## Overview

SentinelDAO is an **agentic DAO treasury system** with on-chain policies deployed to **Arc Testnet** - Circle's open Layer 1 blockchain built for stablecoin finance.

## Why Arc + Circle?

- **Native USDC**: Arc uses USDC as the native gas token, providing predictable dollar-denominated fees
- **Sub-second Finality**: Deterministic finality through the Malachite consensus
- **Built for Stablecoins**: Perfect for treasury management and DeFi applications
- **Circle Integration**: Direct integration with Circle's USDC infrastructure

## Network Details

| Parameter | Value |
|-----------|-------|
| **Network Name** | Arc Testnet |
| **Chain ID** | 5042002 (0x4cef52) |
| **RPC URL** | https://arc-testnet.drpc.org |
| **Block Explorer** | https://testnet.arcscan.app/ |
| **Native Currency** | USDC (6 decimals) |
| **Testnet Faucet** | https://faucet.circle.com/ |

## Deployed Contracts

> **Note**: Update this section after deployment with actual addresses and transaction hashes

### Contract Addresses

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| **USDC (Circle Native)** | `0x3600000000000000000000000000000000000000` | [View on ArcScan](https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000) |
| **TreasuryVault** | `[TO BE DEPLOYED]` | [View on ArcScan]() |
| **Agent Address** | `[SET AFTER DEPLOYMENT]` | [View on ArcScan]() |

### Deployment Transactions

| Action | Transaction Hash | Block | Timestamp |
|--------|------------------|-------|-----------|
| Deploy TreasuryVault | `[TX_HASH]` | `[BLOCK]` | `[DATE]` |
| Set Agent | `[TX_HASH]` | `[BLOCK]` | `[DATE]` |

## How SentinelDAO Uses Arc + USDC

### 1. Treasury Management
- **On-Chain Policies**: All treasury policies are stored and executed on Arc's blockchain
- **USDC Native**: Uses Circle's official USDC deployed on Arc Testnet
- **Transparent Execution**: All transactions are verifiable on ArcScan

### 2. Policy Structure
Each policy defines:
- **Recipients**: Wallet addresses to receive funds
- **Amounts**: USDC amounts (6 decimals) for each recipient
- **Schedule**: One-off or recurring with configurable intervals
- **Approval Requirements**: Optional multi-sig approval before execution
- **Execution Limits**: Maximum amount per execution for safety

### 3. Autonomous Agent
- **Observe**: Monitors policies and vault balance
- **Decide**: Determines which policies are ready to execute
- **Act**: Automatically executes approved policies on-chain
- **Gas Efficiency**: Benefits from Arc's predictable USDC gas fees

## Deployment Instructions

### Prerequisites

1. **Install Dependencies**
   ```bash
   cd app
   yarn install
   ```

2. **Get Testnet USDC**
   - Visit https://faucet.circle.com/
   - Connect your wallet
   - Request 20 USDC (can request every 2 hours)

3. **Set Private Key**
   ```bash
   # In app/packages/foundry directory
   export PRIVATE_KEY="your_private_key_here"
   ```

### Deploy to Arc Testnet

```bash
cd app/packages/foundry

# Deploy TreasuryVault
forge script script/DeploySentinelArc.s.sol \
  --rpc-url arc_testnet \
  --broadcast \
  --verify

# The script will:
# 1. Verify you're on Arc Testnet (chain ID 5042002)
# 2. Deploy TreasuryVault with Circle's USDC
# 3. Set deployer as initial agent
# 4. Export addresses for frontend
```

### Update Frontend

The frontend configuration is already set up to support Arc Testnet. After deployment:

1. **Generate Contract ABIs**
   ```bash
   cd app/packages/foundry
   node scripts-js/generateTsAbis.js
   ```

2. **Start Frontend**
   ```bash
   cd app
   yarn start
   ```

3. **Connect Wallet**
   - Open http://localhost:3000/dashboard
   - Connect MetaMask or other web3 wallet
   - Add Arc Testnet network in your wallet (if not auto-detected)

### Update Agent Configuration

```bash
cd agent

# Update .env with Arc Testnet values
echo "RPC_URL=https://arc-testnet.drpc.org" > .env
echo "PRIVATE_KEY=your_agent_private_key" >> .env
echo "VAULT_ADDRESS=deployed_vault_address" >> .env
echo "POLL_INTERVAL_MS=10000" >> .env

# Start agent
yarn dev
```

## Testing & Validation

### Step 1: Fund Treasury
1. Get testnet USDC from https://faucet.circle.com/
2. Open dashboard at http://localhost:3000/dashboard
3. Use "Fund Treasury" feature
4. Approve USDC spending
5. Confirm funding transaction
6. Verify balance on dashboard

### Step 2: Create Policy
1. Go to "Policies" tab
2. Fill in policy details:
   - Recipients: Comma-separated addresses
   - Amounts: Comma-separated USDC amounts
   - Interval: 0 for one-off, or seconds for recurring
   - Start Time: Unix timestamp
   - Requires Approval: Toggle if needed
3. Submit transaction
4. Note the policy ID from event logs

### Step 3: Execute Policy
**Manual Execution** (for testing):
```solidity
// As the agent address
vault.executePolicy(policyId)
```

**Autonomous Execution**:
- Agent automatically detects eligible policies
- Executes when conditions are met
- Logs execution to console

### Step 4: Verify Transactions
- Check ArcScan explorer for all transactions
- Verify USDC transfers to recipients
- Confirm policy execution events

## Validation Transactions

> **Update this section after testing on Arc Testnet**

### Transaction Log

| Action | TX Hash | Amount | Recipients | Timestamp |
|--------|---------|--------|------------|-----------|
| Fund Treasury | `[TX]` | `[AMOUNT] USDC` | - | `[DATE]` |
| Create Policy | `[TX]` | - | `[ADDRESSES]` | `[DATE]` |
| Execute Policy | `[TX]` | `[TOTAL] USDC` | `[COUNT]` recipients | `[DATE]` |

## Architecture

```
┌─────────────────────┐
│  Next.js Dashboard  │
│   (React + Viem)    │
└──────────┬──────────┘
           │
           │ writes policies
           │ funds treasury
           ▼
┌─────────────────────┐      ┌──────────────────┐
│   TreasuryVault     │◄─────│  Autonomous      │
│  (Solidity/Arc)     │      │  Agent (Node.js) │
└──────────┬──────────┘      └──────────────────┘
           │                          │
           │ uses                     │ observes/executes
           ▼                          │
┌─────────────────────┐              │
│  Circle USDC        │◄─────────────┘
│  (Arc Native)       │
└─────────────────────┘
```

## Key Features for Bounty Review

1. **Real USDC Integration**
   - Uses Circle's official USDC on Arc Testnet
   - No mock tokens or test implementations
   - Address: `0x3600000000000000000000000000000000000000`

2. **On-Chain Policy Execution**
   - All policies stored on Arc blockchain
   - Immutable execution logic in TreasuryVault contract
   - Verifiable on ArcScan block explorer

3. **Autonomous Operations**
   - Agent runs independently
   - Monitors chain state
   - Executes policies without human intervention

4. **Production-Ready**
   - Pausable for emergency stops
   - Ownable for administrative control
   - Approval requirements for sensitive operations
   - Maximum execution limits for safety

## Resources

- **Arc Documentation**: https://docs.arc.network/
- **Circle USDC Docs**: https://developers.circle.com/stablecoins/what-is-usdc
- **Testnet Faucet**: https://faucet.circle.com/
- **Block Explorer**: https://testnet.arcscan.app/
- **SentinelDAO GitHub**: [Your GitHub URL]

## Contact & Support

For questions or support regarding this deployment:
- **GitHub**: [Your GitHub]
- **Twitter**: [Your Twitter]
- **Discord**: [Your Discord]

---

**Built for Circle / Arc Hackathon**

*Demonstrating autonomous treasury management with native USDC on Arc's L1 blockchain.*
