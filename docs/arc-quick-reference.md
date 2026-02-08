# Arc Testnet Deployment - Quick Reference

## Essential Information

| Item | Value |
|------|-------|
| **Chain ID** | 5042002 |
| **Network Name** | Arc Testnet |
| **RPC URL** | https://arc-testnet.drpc.org |
| **Block Explorer** | https://testnet.arcscan.app/ |
| **USDC Contract** | `0x3600000000000000000000000000000000000000` |
| **Testnet Faucet** | https://faucet.circle.com/ |

## One-Command Deployment

```bash
# Set private key
export PRIVATE_KEY="0x..."

# Deploy
cd app/packages/foundry && \
forge script script/DeploySentinelArc.s.sol \
  --rpc-url arc_testnet \
  --broadcast && \
node scripts-js/generateTsAbis.js
```

## MetaMask Setup

Add Arc Testnet to MetaMask:

```javascript
Network Name: Arc Testnet
RPC URL: https://arc-testnet.drpc.org
Chain ID: 5042002
Currency Symbol: USDC
Block Explorer URL: https://testnet.arcscan.app/
```

## Useful Commands

### Check balances
```bash
# Check deployer USDC balance
cast balance YOUR_ADDRESS --rpc-url arc_testnet

# Check vault USDC balance  
cast call 0x3600000000000000000000000000000000000000 \
  "balanceOf(address)(uint256)" \
  YOUR_VAULT_ADDRESS \
  --rpc-url arc_testnet
```

### Check vault state
```bash
# Get agent address
cast call YOUR_VAULT_ADDRESS "agent()(address)" --rpc-url arc_testnet

# Get owner
cast call YOUR_VAULT_ADDRESS "owner()(address)" --rpc-url arc_testnet

# Check if paused
cast call YOUR_VAULT_ADDRESS "paused()(bool)" --rpc-url arc_testnet

# Get policy count
cast call YOUR_VAULT_ADDRESS "policyCount()(uint256)" --rpc-url arc_testnet
```

### Manual policy execution (for testing)
```bash
cast send YOUR_VAULT_ADDRESS \
  "executePolicy(uint256)" \
  POLICY_ID \
  --rpc-url arc_testnet \
  --private-key $PRIVATE_KEY
```

## Agent Configuration

```bash
# agent/.env
RPC_URL=https://arc-testnet.drpc.org
PRIVATE_KEY=0x...
VAULT_ADDRESS=0x...  # From deployment
POLL_INTERVAL_MS=10000
PORT=3001
```

## Troubleshooting

### Issue: Transactions fail with "insufficient funds"
**Solution**: Arc uses USDC as gas. Get USDC from faucet: https://faucet.circle.com/

### Issue: Wrong network in MetaMask
**Solution**: Manually add Arc Testnet using values above

### Issue: Contract not verified
**Solution**: Use manual verification:
```bash
forge verify-contract \
  YOUR_VAULT_ADDRESS \
  contracts/TreasuryVault.sol:TreasuryVault \
  --chain-id 5042002 \
  --constructor-args $(cast abi-encode "constructor(address)" 0x3600000000000000000000000000000000000000)
```

### Issue: Frontend not showing Arc Testnet contracts
**Solution**: Regenerate ABIs:
```bash
cd app/packages/foundry
node scripts-js/generateTsAbis.js
```

## Testing Checklist

- [ ] Get testnet USDC from faucet
- [ ] Deploy TreasuryVault
- [ ] Fund treasury (via dashboard)
- [ ] Create policy (via dashboard)
- [ ] Verify policy on-chain
- [ ] Execute policy (manual or agent)
- [ ] Verify execution on ArcScan
- [ ] Record all transaction hashes
- [ ] Take screenshots for submission

## Key Files

- **Deployment Script**: `app/packages/foundry/script/DeploySentinelArc.s.sol`
- **Foundry Config**: `app/packages/foundry/foundry.toml`
- **Frontend Config**: `app/packages/nextjs/scaffold.config.ts`
- **Documentation**: `docs/arc-testnet.md`
- **Deployment Guide**: `docs/deployment-guide.md`

## Resources

- Circle Developer Docs: https://developers.circle.com/
- Arc Documentation: https://docs.arc.network/
- USDC Contract Addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Foundry Book: https://book.getfoundry.sh/

---

**Ready to deploy? Run the one-command deployment above!**
