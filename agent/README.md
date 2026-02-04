# SentinelDAO Agent

Autonomous agent service that executes treasury policies automatically.

## Setup

1. **Install dependencies:**
```bash
yarn install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Set the vault address** in `.env` after deploying contracts.

4. **Ensure the agent wallet is authorized** by calling `setAgent()` on the TreasuryVault contract (owner only).

## Running

**Development mode (with auto-reload):**
```bash
yarn dev
```

**Production mode:**
```bash
yarn build
yarn start
```

## Configuration

See `env.example` for all configuration options.

- `RPC_URL`: Ethereum RPC endpoint
- `PRIVATE_KEY`: Agent wallet private key
- `VAULT_ADDRESS`: TreasuryVault contract address
- `POLL_INTERVAL_MS`: How often to check policies (milliseconds)
- `PORT`: Health check server port

## Health Check

Once running, visit `http://localhost:3001/health` to see agent status.

## How It Works

The agent runs in a continuous loop:

1. **Observe**: Read all policies and vault state from the blockchain
2. **Decide**: Check if any policy is ready for execution based on:
   - Policy is enabled
   - Current time >= next execution time
   - Vault has sufficient balance
   - Policy is approved (if required)
   - Vault is not paused
3. **Act**: Execute eligible policies via `executePolicy()` transaction

## Logs

The agent logs all activity including:
- Policy evaluations
- Execution attempts
- Transaction hashes
- Errors and warnings
