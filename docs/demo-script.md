# SentinelDAO Demo Script

This document provides a 6-step walkthrough to demonstrate the complete SentinelDAO system.

## Prerequisites

- Local Anvil chain running (`yarn chain`)
- Contracts deployed (`yarn deploy`)
- Frontend running (`yarn start`)
- Agent configured and running (`cd agent && yarn dev`)

## Demo Steps

### Step 1: Show Vault Funded ✅

**Goal**: Demonstrate that the treasury has been funded and is ready to pay out policies.

1. Open the dashboard at `http://localhost:3000/sentinel`
2. **Show Treasury Overview section:**
   - Treasury Balance: Should show 5,000 USDC (from deployment script)
   - Your Balance: Shows connected wallet's USDC
   - Total Policies: Currently 0
   - Vault Status: Active

3. **Optional - Fund more:**
   - Enter amount (e.g., 1000) in "Fund Treasury" input
   - Click "Fund" button
   - Wait for approval + transfer transactions
   - Treasury balance updates in UI

**Talking Points:**
- Treasury is funded with real USDC tokens (mock for local dev)
- Anyone can fund the treasury (permissionless)
- All data is read from the blockchain (no mock data)

---

### Step 2: Create Policy 📝

**Goal**: Create a recurring policy that pays multiple recipients.

1. **Scroll to "Create Policy" section** (only visible if you're the owner)

2. **Fill in the form:**
   - **Recipients**: Enter 2 addresses (comma-separated)
     ```
     0x70997970C51812dc3A010C7d01b50e0d17dc79C8,0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
     ```
   - **Amounts**: Enter USDC amounts matching recipients
     ```
     50,100
     ```
   - **Interval**: `120` (2 minutes for demo; 0 for one-off)
   - **Start Time**: Leave default (60 seconds from now) or enter timestamp
   - **Max Per Execution**: Leave empty (auto-calculates to 150)
   - **Requires Approval**: Toggle OFF for automatic execution

3. **Click "Create Policy"**

4. **Verify creation:**
   - Transaction completes
   - Policy appears in "Policies" table below
   - Event log shows "PolicyCreated" event
   - Policy ID = 0 (first policy)

**Talking Points:**
- Policy is stored entirely on-chain
- Can create one-off or recurring policies
- Optional approval workflow for governance
- Multiple recipients in a single policy

---

### Step 3: Show Agent Logs Evaluating 🔍

**Goal**: Demonstrate that the agent is monitoring policies autonomously.

1. **Switch to the terminal running the agent** (`cd agent && yarn dev`)

2. **Observe agent logs:**
   ```
   🔍 Starting policy evaluation cycle...
   Found 1 policies
   Vault balance: 5000.0 USDC
   Policy 0 state: { enabled: true, nextExecutionTime: 1738691234, now: 1738691174, ... }
   Policy 0: not yet time (next: 1738691234, now: 1738691174)
   ```

3. **Point out the agent logic:**
   - Agent polls every 10 seconds (configurable)
   - Reads all policies from the blockchain
   - Evaluates execution conditions for each policy
   - Logs detailed state for debugging

**Talking Points:**
- Agent runs autonomously (no manual intervention)
- Implements Observe → Decide → Act pattern
- Respects all on-chain constraints (time, balance, approval, pause)
- Can be monitored via logs or health endpoint

---

### Step 4: Wait for Auto Execution ⏰

**Goal**: Show the policy executing automatically when time arrives.

1. **Wait for the start time to arrive** (60 seconds after creation)

2. **Watch agent logs for execution:**
   ```
   ✅ Policy 0 is ready for execution!
   🚀 Executing policy 0...
   Transaction sent for policy 0 { txHash: '0xabc...' }
   ✅ Policy 0 executed successfully! { policyId: 0, total: '150', gasUsed: '...' }
   ```

3. **Switch back to dashboard** and refresh if needed

4. **Verify execution:**
   - "Policies" table shows:
     - Executions: 1
     - Next Execution: 2 minutes from now (if recurring)
   - Event log shows new "PolicyExecuted" event with:
     - Policy ID: 0
     - Amount: 150 USDC
     - Timestamp
     - Transaction hash
   - Treasury Balance decreased by 150 USDC

**Talking Points:**
- Policy executed automatically without any manual action
- Recipients received USDC according to policy
- Recurring policy scheduled for next execution
- All events are emitted and visible on-chain

---

### Step 5: Show Transaction & Updated Balance 💰

**Goal**: Prove the execution with on-chain evidence.

1. **In Event Logs section:**
   - Click the transaction hash (or copy it)
   - Open in block explorer (for testnet) or show full hash

2. **Show updated balances:**
   - Treasury Balance: 4,850 USDC (was 5,000)
   - Check recipient wallets (in Debug Contracts or block explorer):
     - 0x7099... received 50 USDC
     - 0x3C44... received 100 USDC

3. **In Policies table:**
   - Executions count: 1
   - Last Executed At: Recent timestamp
   - Next Execution Time: 2 minutes later (if recurring)

**Talking Points:**
- All changes are on-chain and verifiable
- USDC actually transferred to recipients
- Policy state updated correctly
- Dashboard reads real blockchain data (no mock UI)

---

### Step 6: Pause and Show No Execution 🛑

**Goal**: Demonstrate emergency pause functionality.

1. **Scroll to Owner Controls** (can add a pause button, or use Debug Contracts page)
   - Alternatively, use the "Debug Contracts" page
   - Find TreasuryVault contract
   - Call `pause()` function

2. **Verify pause status:**
   - Dashboard shows "Vault Status: Paused" (in red)

3. **Wait for next execution time** (or create a new policy with immediate start)

4. **Watch agent logs:**
   ```
   Vault is paused, skipping execution
   ```

5. **Verify no execution:**
   - Policy is NOT executed
   - No new event in logs
   - Treasury balance unchanged

6. **Un-pause:**
   - Call `unpause()` via Debug Contracts
   - Dashboard shows "Vault Status: Active" (in green)
   - Next cycle, policy executes normally

**Talking Points:**
- Owner can pause vault in emergency
- Agent respects pause state
- No policies execute while paused
- Un-pause resumes normal operation
- Important safety mechanism

---

## Additional Demo Points (Optional)

### Approval Workflow

1. Create a new policy with "Requires Approval" toggled ON
2. Show policy in table with "Approval: Pending"
3. Agent logs: "Policy X: waiting for approval"
4. Owner clicks "Approve" button
5. Agent executes on next cycle
6. After execution, approval resets (requires re-approval for next run)

### Enable/Disable Policy

1. Click "Disable" on a policy
2. Agent logs: "Policy X: disabled"
3. No execution even if time has arrived
4. Click "Enable" to resume

### Set Agent Address

1. Show current agent address
2. Enter new agent address
3. Click "Set Agent"
4. Previous agent can no longer execute
5. New agent can execute (if private key configured)

---

## Demo Checklist

- [ ] Step 1: Treasury funded and visible
- [ ] Step 2: Policy created successfully
- [ ] Step 3: Agent evaluating policies in logs
- [ ] Step 4: Policy auto-executes at scheduled time
- [ ] Step 5: Balances updated, event logged
- [ ] Step 6: Pause blocks execution, unpause resumes

**Total Demo Time**: ~5-7 minutes

---

## Troubleshooting

**Agent not executing?**
- Check agent address matches vault.agent()
- Check vault is not paused
- Check start time is in the past
- Check vault has sufficient USDC balance
- Check policy is enabled and approved (if required)

**Dashboard not updating?**
- Refresh page
- Check wallet is connected
- Check you're on the correct network (localhost/31337)

**Transactions failing?**
- Check wallet has ETH for gas
- Check contract addresses are correct
- Check you have permission (owner for creates, agent for executes)
