# SentinelDAO Deployment Guide - Arc Testnet

This guide walks you through deploying SentinelDAO to Arc Testnet for the Circle/Arc hackathon.

## Quick Start

```bash
# 1. Get testnet USDC
Visit https://faucet.circle.com/ and request 20 USDC

# 2. Set your private key
cd app/packages/foundry
export PRIVATE_KEY="0x..."

# 3. Deploy contracts
forge script script/DeploySentinelArc.s.sol \
  --rpc-url arc_testnet \
  --broadcast

# 4. Update frontend with deployed addresses
node scripts-js/generateTsAbis.js

# 5. Start the dashboard
cd ../.. && yarn start

# 6. Configure and start the agent
cd ../../../agent
cp .env.example .env  # Edit with deployed vault address
yarn dev
```

## Detailed Steps

### Step 1: Prerequisites

**Install Foundry** (if not already installed):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Install Node.js dependencies**:
```bash
cd app && yarn install
cd ../agent && yarn install
```

### Step 2: Get Testnet USDC

1. Visit https://faucet.circle.com/
2. Connect your MetaMask or other web3 wallet
3. Ensure you're on Arc Testnet (Chain ID: 5042002)
4. Request 20 USDC (repeatable every 2 hours)

**Add Arc Testnet to MetaMask**:
- Network Name: Arc Testnet
- RPC URL: https://arc-testnet.drpc.org
- Chain ID: 5042002
- Currency Symbol: USDC
- Block Explorer: https://testnet.arcscan.app/

### Step 3: Prepare Deployment Account

**Export your private key**:
```bash
# IMPORTANT: Use a testnet-only account, never use mainnet keys!
export PRIVATE_KEY="your_private_key_here"
```

**Verify you have USDC for gas**:
```bash
cd app/packages/foundry
cast balance YOUR_ADDRESS --rpc-url arc_testnet
```

Note: Arc uses USDC as native gas, so your testnet USDC is also your gas token!

### Step 4: Deploy TreasuryVault

```bash
cd app/packages/foundry

# Deploy to Arc Testnet
forge script script/DeploySentinelArc.s.sol \
  --rpc-url arc_testnet \
  --broadcast \
  --slow

# The script will output:
# - TreasuryVault address
# - USDC address (Circle's native)
# - Agent address (your deployer)
```

**Verify Contract** (optional):
```bash
forge verify-contract \
  YOUR_VAULT_ADDRESS \
  contracts/TreasuryVault.sol:TreasuryVault \
  --chain-id 5042002 \
  --constructor-args $(cast abi-encode "constructor(address)" 0x3600000000000000000000000000000000000000)
```

### Step 5: Update Frontend Configuration

**Generate TypeScript ABIs**:
```bash
cd app/packages/foundry
node scripts-js/generateTsAbis.js
```

This will update `packages/nextjs/contracts/deployedContracts.ts` with your Arc Testnet deployment.

**Start the frontend**:
```bash
cd ../..
yarn start
```

Open http://localhost:3000/dashboard

### Step 6: Configure Autonomous Agent

**Create .env file**:
```bash
cd agent
cat > .env << EOF
RPC_URL=https://arc-testnet.drpc.org
PRIVATE_KEY=your_agent_private_key
VAULT_ADDRESS=your_deployed_vault_address
POLL_INTERVAL_MS=10000
EOF
```

**Start the agent**:
```bash
yarn dev
```

The agent will:
- Connect to Arc Testnet
- Monitor the TreasuryVault
- Execute eligible policies automatically

## Testing the Deployment

### Test 1: Fund Treasury

1. Open http://localhost:3000/dashboard
2. Connect your wallet (should auto-switch to Arc Testnet)
3. Enter amount (e.g., 100 USDC)
4. Click "Fund Treasury"
5. Approve USDC spending in MetaMask
6. Confirm funding transaction
7. Wait for confirmation
8. Verify treasury balance updates

**Verify on chain**:
```bash
cast call YOUR_VAULT_ADDRESS "usdc()(address)" --rpc-url arc_testnet
cast call 0x3600000000000000000000000000000000000000 \
  "balanceOf(address)(uint256)" \
  YOUR_VAULT_ADDRESS \
  --rpc-url arc_testnet
```

### Test 2: Create a Policy

1. Go to "Policies" tab in dashboard
2. Fill in policy form:
   ```
   Recipients: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0, 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
   Amounts (USDC): 10, 20
   Interval (seconds): 0  (one-off)
   Start Time: [60 seconds from now]
   Requires Approval: false
   ```
3. Click "Create Policy"
4. Confirm transaction
5. Note the Policy ID from event logs

**Verify on chain**:
```bash
cast call YOUR_VAULT_ADDRESS "policyCount()(uint256)" --rpc-url arc_testnet
cast call YOUR_VAULT_ADDRESS "getPolicy(uint256)" POLICY_ID --rpc-url arc_testnet
```

### Test 3: Execute Policy

**Option A: Let Agent Execute Automatically**
- Wait for the policy start time
- Agent will detect and execute automatically
- Watch agent logs for execution

**Option B: Manual Execution (for testing)**
```bash
cast send YOUR_VAULT_ADDRESS \
  "executePolicy(uint256)" \
  POLICY_ID \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

**Verify execution**:
- Check recipient balances
- View transaction on ArcScan
- Confirm policy execution count incremented

## Capturing Validation Data

### Save Contract Addresses

```bash
# Save to docs/arc-testnet.md
echo "TreasuryVault: YOUR_VAULT_ADDRESS" >> docs/arc-testnet.md
echo "Deployer/Agent: YOUR_ADDRESS" >> docs/arc-testnet.md
```

### Save Transaction Hashes

After each test action, record the transaction hash:

```markdown
| Action | TX Hash | Explorer Link |
|--------|---------|---------------|
| Fund Treasury | 0x... | https://testnet.arcscan.app/tx/0x... |
| Create Policy | 0x... | https://testnet.arcscan.app/tx/0x... |
| Execute Policy | 0x... | https://testnet.arcscan.app/tx/0x... |
```

### Take Screenshots

For bounty submission:
1. Dashboard showing treasury balance
2. Policy creation form
3. Policy execution in agent logs
4. ArcScan transaction details
5. USDC transfers to recipients

## Troubleshooting

### Issue: "Insufficient USDC for gas"
**Solution**: Get more testnet USDC from https://faucet.circle.com/

### Issue: "Wrong network"
**Solution**: Verify Arc Testnet configuration in MetaMask (Chain ID: 5042002)

### Issue: "Contract not found"
**Solution**: Run `node scripts-js/generateTsAbis.js` to update frontend ABIs

### Issue: "Agent can't execute"
**Solution**: Verify agent address is set correctly on vault:
```bash
cast call YOUR_VAULT_ADDRESS "agent()(address)" --rpc-url arc_testnet
```

### Issue: "Transaction reverted"
**Solution**: Check error on ArcScan, common issues:
- Insufficient vault balance
- Policy not enabled
- Policy not approved (if required)
- Execution time not reached

## Production Checklist

Before final submission:

- [ ] Contracts deployed to Arc Testnet
- [ ] Contract addresses documented in `docs/arc-testnet.md`
- [ ] At least 3 validation transactions recorded
- [ ] Treasury funded with USDC
- [ ] Policy created and visible on dashboard
- [ ] Policy executed (manually or by agent)
- [ ] All transaction hashes saved
- [ ] Screenshots captured
- [ ] README updated with deployment info
- [ ] Agent running and monitoring vault
- [ ] Frontend accessible and functional

## Next Steps for Hackathon Submission

1. **Complete all validation transactions**
2. **Update `docs/arc-testnet.md` with actual addresses and tx hashes**
3. **Prepare demo video** showing:
   - Dashboard interface
   - Policy creation
   - Autonomous execution
   - ArcScan transaction verification
4. **Highlight Circle/Arc integration**:
   - Native USDC usage
   - Arc's sub-second finality
   - Predictable gas fees in USDC
   - Integration with Circle's faucet

## Resources

- Arc Testnet Explorer: https://testnet.arcscan.app/
- Circle Faucet: https://faucet.circle.com/
- Arc Documentation: https://docs.arc.network/
- Foundry Book: https://book.getfoundry.sh/

---

**Ready to deploy? Start with Step 1!**
