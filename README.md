# 🛡️ SentinelDAO

An agentic DAO treasury system with **on-chain policies** and **autonomous execution**.

**🎯 Deployed on Arc Testnet** - Circle's Layer 1 blockchain for stablecoin finance. See [Arc Testnet deployment docs](docs/arc-testnet.md).

## Features

- ✅ **On-Chain Policies**: All policy logic stored on the blockchain
- 🤖 **Autonomous Agent**: Executes payouts automatically (no manual intervention)
- 💰 **Multi-Recipient**: Send to multiple addresses in a single policy
- 🔄 **Recurring or One-Off**: Support for both recurring and one-time payments
- ✋ **Optional Approval**: Governance-friendly approval workflow
- ⏸️ **Emergency Pause**: Owner can pause all executions
- 📊 **Real-Time Dashboard**: Monitor treasury, policies, and events
- 🔍 **Full Transparency**: All actions logged as blockchain events
- 🌐 **Arc Testnet Ready**: Uses Circle's native USDC on Arc's L1
- 🏷️ **ENS Integration**: Resolve human-readable names to recipient addresses with portable payment metadata

## Architecture

```
┌─────────────┐         ┌─────────────┐
│  Dashboard  │────────▶│   Vault     │
│  (Next.js)  │         │ (Solidity)  │
└─────────────┘         └──────┬──────┘
                               │
                               │ executePolicy()
                               │
                        ┌──────▼──────┐
                        │    Agent    │
                        │  (Node.js)  │
                        │             │
                        │  Observe    │
                        │  Decide     │
                        │  Act        │
                        └─────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed architecture.

## Quick Start

### Local Development

For local development with Anvil:

### 1. Install Dependencies

```bash
cd app
yarn install
```

### 2. Start Local Chain

```bash
cd app
yarn chain
```

*Keep this terminal running.*

### 3. Deploy Contracts

In a new terminal:

```bash
cd app
yarn deploy
```

This deploys:
- `MockUSDC` (ERC20 with 6 decimals)
- `TreasuryVault` (policy executor)

Initial state:
- Deployer receives 10,000 USDC
- Treasury funded with 5,000 USDC
- Agent set to deployer address

### 4. Start Frontend

In a new terminal:

```bash
cd app
yarn start
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

### 5. Configure & Start Agent

In a new terminal:

```bash
cd agent
yarn install
cp env.example .env
# Edit .env if needed (default config works for local dev)
yarn dev
```

The agent will start polling for policies every 10 seconds.

---

### Arc Testnet Deployment

For deploying to Arc Testnet (Circle's L1):

**📚 See detailed guide**: [Deployment Guide](docs/deployment-guide.md)

**Quick commands**:
```bash
# Get testnet USDC from faucet
# Visit: https://faucet.circle.com/

# Deploy to Arc Testnet
cd app/packages/foundry
export PRIVATE_KEY="your_private_key"
forge script script/DeploySentinelArc.s.sol --rpc-url arc_testnet --broadcast

# Update frontend
node scripts-js/generateTsAbis.js

# Start dashboard (will auto-detect Arc Testnet)
cd ../.. && yarn start
```

**Arc Testnet Details**:
- Chain ID: 5042002
- RPC: https://arc-testnet.drpc.org
- USDC (Native): `0x3600000000000000000000000000000000000000`
- Explorer: https://testnet.arcscan.app/

See [Arc Testnet documentation](docs/arc-testnet.md) for full deployment details.

## ENS Integration

SentinelDAO integrates **Ethereum Name Service (ENS)** to provide human-readable treasury identities for payment recipients. 

### How ENS is Used

ENS is used to:
- **Resolve human-readable names** (e.g., `sentinelvault.eth`) into Ethereum addresses
- **Read portable payment metadata** via ENS text records:
  - `email` - Contact information for the recipient
  - `url` - Website or profile link
  - `payment:preferred_token` - Preferred payment token
- **Simplify policy creation** by allowing users to add recipients using memorable ENS names

### Key Implementation Details

- **Mainnet Resolution**: ENS names are resolved from Ethereum Mainnet (read-only) to ensure canonical resolution
- **No Contract Changes**: ENS integration is purely frontend - all smart contract writes remain on the testnet
- **Human Identity Focus**: ENS represents payment recipients (human/organization identities), NOT the contract owner or agent
- **Dynamic Metadata**: Text records are read dynamically and displayed in the UI

### Using ENS in the Dashboard

1. Navigate to the **Policies** tab
2. Look for the **ENS_RECIPIENT_RESOLVER** section above the policy creation form
3. Enter an ENS name (e.g., `vitalik.eth`)
4. Click **"Resolve ENS"** to fetch the address and metadata from Ethereum Mainnet
5. Review the resolved address and any available text records (email, url, preferred token)
6. Click **"Add to Recipients"** to automatically add the address to your policy recipients list
7. Complete the rest of the policy form and create your policy

### Reverse Lookup

If your connected wallet has an ENS name, it will be detected automatically with a **"Use this ENS"** button for quick access.

### Technical Implementation

- Uses `wagmi` ENS hooks: `useEnsAddress`, `useEnsName`, `useEnsAvatar`, `useEnsText`
- All ENS queries are directed to Ethereum Mainnet (`chainId: 1`)
- Component location: `components/ens/EnsRecipientResolver.tsx`

---

## Usage

### Fund Treasury

1. Open dashboard at `http://localhost:3000/dashboard`
2. Connect wallet (MetaMask will auto-switch to correct network)
3. Enter amount in "Fund Treasury" input
4. Click "Fund" (approves + transfers USDC to vault)

**On Arc Testnet**: Get USDC from https://faucet.circle.com/ first

### Create a Policy

1. Ensure you're connected as the owner
2. Fill in "Create Policy" form:
   - **Recipients**: Comma-separated addresses
   - **Amounts**: Comma-separated USDC amounts
   - **Interval**: Seconds between executions (0 = one-off)
   - **Start Time**: Unix timestamp for first execution
   - **Max Per Execution**: Optional cap
   - **Requires Approval**: Toggle for approval workflow
3. Click "Create Policy"

### Watch Auto-Execution

- Agent logs show policy evaluation
- When conditions are met, agent executes automatically
- Dashboard event log shows execution history
- Treasury balance updates in real-time

### Pause/Unpause

- Owner can pause vault to stop all executions
- Use Debug Contracts page or add pause button to dashboard
- Agent respects pause state

## Repository Structure

```
SentinelDao/
├── app/                          # Scaffold-ETH 2 root
│   ├── packages/
│   │   ├── foundry/              # Smart contracts
│   │   │   ├── contracts/
│   │   │   │   ├── MockUSDC.sol
│   │   │   │   └── TreasuryVault.sol
│   │   │   ├── script/
│   │   │   │   └── DeploySentinel.s.sol
│   │   │   └── deployments/      # Deployed addresses
│   │   └── nextjs/               # Frontend
│   │       └── app/
│   │           └── sentinel/     # Dashboard page
│   │               └── page.tsx
├── agent/                        # Autonomous agent
│   ├── src/
│   │   ├── config.ts
│   │   ├── chain.ts
│   │   ├── loop.ts
│   │   └── index.ts
│   └── package.json
└── docs/                         # Documentation
    ├── architecture.md
    └── demo-script.md
```

## Documentation

- **[Arc Testnet Deployment](docs/arc-testnet.md)** - Complete Arc Testnet deployment info
- **[Deployment Guide](docs/deployment-guide.md)** - Step-by-step deployment instructions
- **[ENS Integration](docs/ens-integration.md)** - ENS integration for human-readable recipient identities
- [Architecture](docs/architecture.md) - System design and data flow
- [Demo Script](docs/demo-script.md) - Step-by-step demo walkthrough
- [Agent README](agent/README.md) - Agent configuration and usage

## Development

### Smart Contracts

```bash
cd app/packages/foundry
forge build                    # Compile
forge test                     # Run tests
forge script script/Deploy.s.sol --rpc-url localhost --broadcast  # Deploy
```

### Frontend

```bash
cd app
yarn start                     # Dev server
yarn next:build                # Production build
yarn lint                      # Lint code
```

### Agent

```bash
cd agent
yarn dev                       # Dev mode (auto-reload)
yarn build                     # Compile TypeScript
yarn start                     # Run compiled code
```

## Tech Stack

- **Contracts**: Solidity 0.8.19, OpenZeppelin, Foundry
- **Frontend**: Next.js 14 (App Router), React, Wagmi, Viem, DaisyUI, Tailwind
- **Agent**: Node.js 20+, TypeScript, Viem, Pino, Express
- **Chain**: Anvil (local) / Arc Testnet (Circle's L1)
- **Stablecoin**: MockUSDC (local) / Circle USDC (Arc Testnet)

## Configuration

### Agent Environment Variables

See `agent/env.example`:

- `RPC_URL`: Ethereum RPC endpoint
- `PRIVATE_KEY`: Agent wallet private key
- `VAULT_ADDRESS`: TreasuryVault contract address
- `POLL_INTERVAL_MS`: Polling frequency (default: 10000)
- `PORT`: Health check server port (default: 3001)

### Network Configuration

**For Arc Testnet deployment**, the configuration is already set up:
- Foundry config: `app/packages/foundry/foundry.toml` (arc_testnet RPC)
- Frontend config: `app/packages/nextjs/scaffold.config.ts` (Arc chain definition)
- Deployment script: `app/packages/foundry/script/DeploySentinelArc.s.sol`

**For other testnets/mainnet**:

1. Add RPC endpoints in `app/packages/foundry/foundry.toml`
2. Add network config in `app/packages/nextjs/scaffold.config.ts`
3. Generate secure keystore: `cd app && yarn generate`
4. Deploy: `cd app && yarn deploy --network <network-name>`
5. Update agent `.env` with new VAULT_ADDRESS and RPC_URL

## Safety Features

- **Owner-only policy creation**: Only owner can create/modify policies
- **Agent authorization**: Only designated agent can execute
- **Balance checks**: Execution fails if insufficient funds
- **Time locks**: Policies execute only after `nextExecutionTime`
- **Max caps**: `maxPerExecution` prevents overspending
- **Pause mechanism**: Emergency stop for all executions
- **Approval workflow**: Optional governance approval step

## License

MIT

## Support

For issues and questions:
- Check [docs/demo-script.md](docs/demo-script.md) for troubleshooting
- Review [docs/architecture.md](docs/architecture.md) for system design
- Check agent logs for execution details

---

Built with ❤️ using Scaffold-ETH 2
