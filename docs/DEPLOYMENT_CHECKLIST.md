# 🚀 SentinelDAO Arc Testnet Deployment Checklist

## Pre-Deployment Setup

### 1. Environment Verification
- [ ] Foundry installed and updated (`foundryup`)
- [ ] Node.js 20+ installed
- [ ] All dependencies installed (`cd app && yarn install`)
- [ ] All dependencies installed (`cd agent && yarn install`)

### 2. Get Testnet USDC
- [ ] Visit https://faucet.circle.com/
- [ ] Connect wallet
- [ ] Add Arc Testnet to MetaMask (Chain ID: 5042002, RPC: https://arc-testnet.drpc.org)
- [ ] Request 20 USDC from faucet
- [ ] Verify USDC balance in wallet

### 3. Prepare Deployment Account
- [ ] Use testnet-only private key (NEVER use mainnet keys!)
- [ ] Export private key: `export PRIVATE_KEY="0x..."`
- [ ] Verify RPC connectivity: `cast block latest --rpc-url arc_testnet`
- [ ] Verify USDC balance: `cast balance YOUR_ADDRESS --rpc-url arc_testnet`

---

## Deployment

### 4. Deploy TreasuryVault
```bash
cd app/packages/foundry
forge script script/DeploySentinelArc.s.sol \
  --rpc-url arc_testnet \
  --broadcast \
  --slow
```

- [ ] Deployment successful
- [ ] Record TreasuryVault address: `_________________________`
- [ ] Record deployment tx hash: `_________________________`
- [ ] Verify on ArcScan: https://testnet.arcscan.app/tx/YOUR_TX_HASH
- [ ] Confirm agent is set to deployer address
- [ ] Confirm USDC address is correct: `0x3600000000000000000000000000000000000000`

### 5. Update Frontend
```bash
cd app/packages/foundry
node scripts-js/generateTsAbis.js
```

- [ ] ABIs generated successfully
- [ ] `deployedContracts.ts` updated with Arc Testnet addresses
- [ ] Verified TreasuryVault address in generated file

### 6. Start Frontend
```bash
cd app
yarn start
```

- [ ] Frontend started successfully
- [ ] Open http://localhost:3000/dashboard
- [ ] Connect wallet (should auto-detect Arc Testnet)
- [ ] Verify wallet switches to Arc Testnet
- [ ] Confirm contract addresses load correctly
- [ ] Check treasury balance displays (should be 0 initially)

### 7. Configure Agent
```bash
cd agent
cat > .env << EOF
RPC_URL=https://arc-testnet.drpc.org
PRIVATE_KEY=YOUR_AGENT_PRIVATE_KEY
VAULT_ADDRESS=YOUR_DEPLOYED_VAULT_ADDRESS
POLL_INTERVAL_MS=10000
PORT=3001
EOF
```

- [ ] `.env` file created
- [ ] Vault address matches deployed contract
- [ ] Agent private key set (can be same as deployer for testing)

### 8. Start Agent
```bash
cd agent
yarn dev
```

- [ ] Agent started successfully
- [ ] Logs show connection to Arc Testnet
- [ ] Vault address correct in logs
- [ ] Agent address matches expected
- [ ] Polling started (checking every 10 seconds)

---

## Validation & Testing

### 9. Test 1: Fund Treasury
**Dashboard UI:**
- [ ] Go to http://localhost:3000/dashboard
- [ ] Enter amount (e.g., 100 USDC)
- [ ] Click "Fund Treasury"
- [ ] Approve USDC in MetaMask
- [ ] Confirm funding transaction
- [ ] Wait for confirmation

**Verification:**
- [ ] Treasury balance updates on dashboard
- [ ] Record tx hash: `_________________________`
- [ ] View on ArcScan: https://testnet.arcscan.app/tx/YOUR_TX_HASH
- [ ] Confirm transfer event emitted
- [ ] Check on-chain balance:
  ```bash
  cast call 0x3600000000000000000000000000000000000000 \
    "balanceOf(address)(uint256)" \
    YOUR_VAULT_ADDRESS \
    --rpc-url arc_testnet
  ```

### 10. Test 2: Create Policy
**Dashboard UI:**
- [ ] Switch to "Policies" tab
- [ ] Fill in policy form:
  - Recipients: Enter 1-2 test addresses (comma-separated)
  - Amounts: Enter amounts matching recipients (e.g., "10, 20")
  - Interval: 0 (for one-off) or 300 (for 5-minute recurring)
  - Start Time: Unix timestamp 60 seconds from now
  - Requires Approval: Leave unchecked for testing
- [ ] Click "Create Policy"
- [ ] Confirm transaction in MetaMask
- [ ] Wait for confirmation

**Verification:**
- [ ] Policy appears in policies table
- [ ] Record policy ID: `_________________________`
- [ ] Record tx hash: `_________________________`
- [ ] View on ArcScan: https://testnet.arcscan.app/tx/YOUR_TX_HASH
- [ ] Check policy on-chain:
  ```bash
  cast call YOUR_VAULT_ADDRESS "policyCount()(uint256)" --rpc-url arc_testnet
  cast call YOUR_VAULT_ADDRESS "getPolicy(uint256)" POLICY_ID --rpc-url arc_testnet
  ```

### 11. Test 3: Execute Policy
**Wait for execution time:**
- [ ] Monitor agent logs for policy evaluation
- [ ] Agent detects eligible policy
- [ ] Agent executes policy automatically
- [ ] Record execution tx hash: `_________________________`

**OR Manual Execution (for testing):**
```bash
cast send YOUR_VAULT_ADDRESS \
  "executePolicy(uint256)" \
  POLICY_ID \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

**Verification:**
- [ ] Execution successful
- [ ] View tx on ArcScan: https://testnet.arcscan.app/tx/YOUR_TX_HASH
- [ ] Confirm USDC transfers to recipients
- [ ] Check recipient balances:
  ```bash
  cast call 0x3600000000000000000000000000000000000000 \
    "balanceOf(address)(uint256)" \
    RECIPIENT_ADDRESS \
    --rpc-url arc_testnet
  ```
- [ ] Verify policy execution count incremented
- [ ] Treasury balance reduced on dashboard
- [ ] Event logs show execution on dashboard

---

## Documentation

### 12. Update Arc Testnet Documentation
Edit `docs/arc-testnet.md`:

- [ ] Add deployed TreasuryVault address
- [ ] Add agent address
- [ ] Add deployment transaction hash
- [ ] Add validation transaction hashes:
  - Fund treasury tx
  - Create policy tx
  - Execute policy tx
- [ ] Add block numbers and timestamps
- [ ] Add total USDC transferred
- [ ] Add number of recipients served

### 13. Capture Evidence
- [ ] Screenshot: Dashboard showing treasury balance
- [ ] Screenshot: Policy creation form
- [ ] Screenshot: Policies table with created policy
- [ ] Screenshot: Agent logs showing execution
- [ ] Screenshot: ArcScan transaction details
- [ ] Screenshot: Recipient USDC balance increase
- [ ] (Optional) Record short demo video

---

## Hackathon Submission Prep

### 14. Final Verification
- [ ] All contracts deployed and verified on Arc Testnet
- [ ] At least 3 validation transactions completed
- [ ] All transaction hashes documented
- [ ] Screenshots captured
- [ ] Documentation complete and accurate
- [ ] README updated with deployment info
- [ ] Agent running and monitoring vault
- [ ] Frontend functional on Arc Testnet

### 15. Highlight Circle/Arc Integration
In your submission, emphasize:
- [ ] Uses Circle's native USDC on Arc Testnet
- [ ] USDC address: `0x3600000000000000000000000000000000000000`
- [ ] Benefits from Arc's sub-second finality
- [ ] Predictable gas fees in USDC
- [ ] Integration with Circle's faucet
- [ ] Real-world use case for stablecoin treasury management
- [ ] Autonomous execution on Arc's L1

### 16. Prepare Submission Materials
- [ ] Demo video (2-5 minutes) showing:
  - Dashboard interface
  - Funding treasury with USDC
  - Creating a policy
  - Autonomous execution by agent
  - Transaction verification on ArcScan
- [ ] GitHub README with:
  - Clear description
  - Arc Testnet deployment section
  - Links to live contracts on ArcScan
  - Architecture diagram
- [ ] Submission form filled with:
  - Project description
  - Contract addresses
  - Demo video link
  - GitHub repository link
  - Highlight Circle/Arc integration

---

## Troubleshooting

### Common Issues
- **"Insufficient funds"**: Get more USDC from https://faucet.circle.com/
- **"Wrong network"**: Verify Arc Testnet in MetaMask (Chain ID: 5042002)
- **"Contract not found"**: Run `node scripts-js/generateTsAbis.js`
- **"Agent can't execute"**: Verify agent address matches on-chain
- **Frontend not loading**: Clear browser cache, restart dev server
- **Transaction reverts**: Check ArcScan for error details

---

## 🎉 Completion

Once all items are checked:

✅ **SentinelDAO is successfully deployed on Arc Testnet!**

You are ready to:
1. Submit to Circle/Arc hackathon
2. Share your deployed dApp
3. Demonstrate autonomous treasury management
4. Showcase Circle USDC integration

---

## Key Resources

- **Arc Explorer**: https://testnet.arcscan.app/
- **Circle Faucet**: https://faucet.circle.com/
- **Documentation**: `docs/arc-testnet.md`
- **Quick Reference**: `docs/arc-quick-reference.md`
- **Deployment Guide**: `docs/deployment-guide.md`

**Good luck with your hackathon submission! 🚀**
