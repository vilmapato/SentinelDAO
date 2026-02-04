# SentinelDAO Architecture

## Overview

SentinelDAO is an agentic DAO treasury system with on-chain policies that enable automated, trustless payouts without requiring manual intervention for every transaction.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         SENTINELDAO SYSTEM                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐           ┌──────────────────┐
│   Next.js        │           │   Autonomous     │
│   Dashboard      │           │   Agent          │
│                  │           │   (Node.js/TS)   │
│  - Fund Treasury │           │                  │
│  - Create Policy │           │  Observe         │
│  - Approve Policy│           │  Decide          │
│  - View Logs     │           │  Act             │
└────────┬─────────┘           └────────┬─────────┘
         │                              │
         │ writes                       │ executePolicy()
         ▼                              ▼
    ┌────────────────────────────────────────┐
    │      TreasuryVault Contract            │
    │  ────────────────────────────────────  │
    │  Policies (on-chain):                  │
    │  - enabled                             │
    │  - requiresApproval / approved         │
    │  - intervalSeconds                     │
    │  - nextExecutionTime                   │
    │  - recipients[]                        │
    │  - amounts[]                           │
    │  - maxPerExecution                     │
    │  ────────────────────────────────────  │
    │  Functions:                            │
    │  - createPolicy()       [owner]        │
    │  - approvePolicy()      [owner]        │
    │  - setPolicyEnabled()   [owner]        │
    │  - executePolicy()      [agent]        │
    │  - fundTreasury()       [anyone]       │
    │  - pause/unpause()      [owner]        │
    └────────────┬───────────────────────────┘
                 │ USDC transfers
                 ▼
         ┌───────────────┐
         │  MockUSDC     │
         │  (ERC20)      │
         └───────────────┘
```

## Data Flow

### 1. Policy Creation (Dashboard → Vault)

```
User (Owner) → Dashboard UI → TreasuryVault.createPolicy()
  ↓
Policy stored on-chain with:
  - recipients: [address1, address2, ...]
  - amounts: [100 USDC, 200 USDC, ...]
  - intervalSeconds: 86400 (daily) or 0 (one-off)
  - nextExecutionTime: start timestamp
  - requiresApproval: true/false
  ↓
Event: PolicyCreated(id, startTime, intervalSeconds, total, requiresApproval)
```

### 2. Policy Approval (Optional)

```
User (Owner) → Dashboard UI → TreasuryVault.approvePolicy(id)
  ↓
Policy.approved = true
  ↓
Event: PolicyApproved(id)
```

### 3. Autonomous Execution (Agent → Vault)

```
Agent Loop (every POLL_INTERVAL_MS):
  ↓
  Observe:
    - Read policyCount()
    - For each policy: getPolicy(id)
    - Read vault USDC balance
  ↓
  Decide (for each policy):
    - Is enabled?
    - Current time >= nextExecutionTime?
    - total <= maxPerExecution?
    - vault balance >= total?
    - If requiresApproval: is approved?
    - Is vault paused?
  ↓
  Act (if all conditions met):
    - Call executePolicy(id)
    - Wait for transaction receipt
    - Log result
  ↓
Event: PolicyExecuted(id, total, executions, timestamp)
  ↓
Policy state updated:
  - executions++
  - lastExecutedAt = now
  - If recurring: nextExecutionTime += intervalSeconds
  - If one-off: enabled = false
  - If requiresApproval: approved = false (requires re-approval)
```

### 4. Event Monitoring (Dashboard)

```
Dashboard reads blockchain events:
  - PolicyCreated
  - PolicyExecuted
  - TreasuryFunded
  - PolicyApproved
  ↓
Displays in real-time event log
```

## Smart Contracts

### MockUSDC
- **Purpose**: ERC20 token for testing (6 decimals like real USDC)
- **Key Functions**:
  - `mint(address, uint256)`: Owner can mint
  - `faucetMint(uint256)`: Anyone can mint up to 1000 USDC for testing

### TreasuryVault
- **Purpose**: Holds USDC and manages policy-based payouts
- **Access Control**:
  - `owner`: Can create/approve/enable policies, set agent, pause
  - `agent`: Can execute policies
  - `anyone`: Can fund treasury
- **Key Features**:
  - On-chain policy storage (no off-chain dependencies)
  - One-off and recurring policies
  - Optional approval requirement
  - Pause mechanism for emergency stops
  - Event emission for all state changes

## Security Considerations

1. **Agent Authorization**: Only the designated agent address can execute policies
2. **Owner Controls**: Policy creation and approval require owner privileges
3. **Balance Checks**: Execution fails if insufficient vault balance
4. **Time Locks**: Policies can't execute before `nextExecutionTime`
5. **Pause Mechanism**: Owner can pause all executions
6. **Approval Workflow**: Optional approval step for sensitive policies
7. **Max Caps**: `maxPerExecution` prevents over-spending

## Technology Stack

- **Contracts**: Solidity 0.8.19, OpenZeppelin, Foundry
- **Frontend**: Next.js 14 (App Router), React, Wagmi, Viem, DaisyUI
- **Agent**: Node.js 20+, TypeScript, Viem, Pino
- **Local Chain**: Anvil (Foundry)

## Deployment Flow

```
1. Deploy MockUSDC
2. Deploy TreasuryVault(MockUSDC.address)
3. Set agent address: TreasuryVault.setAgent(agentWallet)
4. Mint USDC to users for testing
5. Fund treasury: approve + fundTreasury()
6. Create policies via dashboard
7. Start agent service
8. Agent automatically executes policies when conditions are met
```

## Extension Points

Future enhancements could include:

- Multi-token support (not just USDC)
- Governance voting on policies
- Oracle integration for conditional execution
- Multi-sig approval
- Policy templates
- Execution simulation/dry-run
- Gas optimization
- L2 deployment
