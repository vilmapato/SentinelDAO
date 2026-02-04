# 🛡️ SentinelDAO

An agentic DAO treasury system with **on-chain policies** and **autonomous execution**.

## Features

- ✅ **On-Chain Policies**: All policy logic stored on the blockchain
- 🤖 **Autonomous Agent**: Executes payouts automatically (no manual intervention)
- 💰 **Multi-Recipient**: Send to multiple addresses in a single policy
- 🔄 **Recurring or One-Off**: Support for both recurring and one-time payments
- ✋ **Optional Approval**: Governance-friendly approval workflow
- ⏸️ **Emergency Pause**: Owner can pause all executions
- 📊 **Real-Time Dashboard**: Monitor treasury, policies, and events
- 🔍 **Full Transparency**: All actions logged as blockchain events

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

Open [http://localhost:3000/sentinel](http://localhost:3000/sentinel)

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

## Usage

### Fund Treasury

1. Open dashboard at `http://localhost:3000/sentinel`
2. Enter amount in "Fund Treasury" input
3. Click "Fund" (approves + transfers USDC to vault)

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
- **Chain**: Anvil (Foundry's local testnet)

## Configuration

### Agent Environment Variables

See `agent/env.example`:

- `RPC_URL`: Ethereum RPC endpoint
- `PRIVATE_KEY`: Agent wallet private key
- `VAULT_ADDRESS`: TreasuryVault contract address
- `POLL_INTERVAL_MS`: Polling frequency (default: 10000)
- `PORT`: Health check server port (default: 3001)

### Network Configuration

To deploy to testnets/mainnet:

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
