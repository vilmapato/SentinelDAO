# ENS Integration - Technical Documentation

## Overview

SentinelDAO integrates **Ethereum Name Service (ENS)** to qualify for the ETHGlobal HackMoney 2026 ENS "Integrate ENS" prize.

## Purpose

ENS is used to resolve **human-readable treasury identities** into recipient addresses and to read **portable payment metadata** via ENS text records, while all contract execution remains on testnet.

## Architecture

### Key Principles

1. **Read-Only Mainnet ENS**: All ENS resolution happens on Ethereum Mainnet (Chain ID: 1)
2. **No Contract Changes**: ENS integration is purely frontend - smart contracts remain unchanged
3. **Human Identity Focus**: ENS represents payment recipients (people/organizations), NOT contract owners or agents
4. **Dynamic Metadata**: Text records are fetched dynamically from the ENS registry

### Component Structure

```
components/ens/
└── EnsRecipientResolver.tsx    # Main ENS resolution UI component

app/dashboard/
└── page.tsx                     # Dashboard integrates ENS resolver
```

## Implementation Details

### ENS Hooks Used

The implementation uses `wagmi` ENS hooks for all mainnet queries:

```typescript
import { useEnsAddress, useEnsAvatar, useEnsName, useEnsText } from "wagmi";
import { mainnet } from "wagmi/chains";

// Resolve ENS name to address
useEnsAddress({
  name: "vitalik.eth",
  chainId: mainnet.id,  // Always Ethereum Mainnet
});

// Reverse lookup (address to ENS name)
useEnsName({
  address: "0x...",
  chainId: mainnet.id,
});

// Fetch ENS avatar
useEnsAvatar({
  name: "vitalik.eth",
  chainId: mainnet.id,
});

// Read text records
useEnsText({
  name: "vitalik.eth",
  key: "email",  // or "url", "payment:preferred_token"
  chainId: mainnet.id,
});
```

### ENS Text Records Supported

| Key | Description | Example Value |
|-----|-------------|---------------|
| `email` | Contact email | `treasury@example.com` |
| `url` | Website or profile | `https://example.com` |
| `payment:preferred_token` | Preferred payment token | `USDC`, `ETH` |

## User Flow

### 1. Resolve ENS Name

User enters an ENS name (e.g., `sentinelvault.eth`) and clicks **"Resolve ENS"**.

**What happens:**
- Frontend calls `useEnsAddress` on Ethereum Mainnet
- Resolved address is displayed
- Avatar (if set) is fetched and displayed
- Text records are dynamically queried and shown

### 2. Review Metadata

User sees:
- ✅ Resolved Ethereum address
- 🖼️ ENS avatar (if available)
- 📧 Email (if set in text record)
- 🔗 URL (if set in text record)
- 💰 Preferred payment token (if set)

### 3. Add to Recipients

User clicks **"Add to Recipients"**.

**What happens:**
- Address is appended to the existing `recipients` field in the policy form
- Duplicate addresses are prevented (case-insensitive check)
- Form is ready for policy creation

### 4. Create Policy

User completes the rest of the policy form (amounts, interval, etc.) and submits.

**Contract execution:**
- Policy is created on testnet (Anvil or Arc Testnet)
- Resolved ENS address is used as a recipient
- No ENS interaction at contract level

## Key Features

### Reverse Lookup Helper

If the connected wallet has an ENS name:
- It's detected automatically via `useEnsName`
- A **"Use this ENS"** button appears
- Clicking it pre-fills the ENS input field

### Duplicate Prevention

The `addRecipient` helper function:
```typescript
const addRecipient = (address: `0x${string}`) => {
  const currentRecipients = recipients
    .split(",")
    .map(r => r.trim().toLowerCase())
    .filter(r => r.length > 0);

  // Check for duplicates (case-insensitive)
  if (currentRecipients.includes(address.toLowerCase())) {
    console.log("Address already in recipients list");
    return;
  }

  // Add to recipients
  if (recipients.trim() === "") {
    setRecipients(address);
  } else {
    setRecipients(recipients + ", " + address);
  }
};
```

### Error Handling

- Invalid ENS names: "Please enter a valid ENS name (e.g., vitalik.eth)"
- Not found: "ENS name not found or invalid"
- Loading state: "Resolving..." button disabled during resolution

## Prize Compliance Checklist

### ✅ ENS Integration Requirements

- [x] Uses official ENS hooks (`wagmi` ENS utilities)
- [x] Resolves from Ethereum Mainnet (read-only)
- [x] No hard-coded ENS names or addresses
- [x] Dynamic text record reading
- [x] ENS represents human identities (payment recipients)
- [x] Clear documentation of ENS purpose
- [x] Working demo in production app
- [x] No mainnet contract deployments

### ✅ Use Case: Human-Readable Treasury Identities

ENS enables:
1. **Memorable recipient addresses**: Use `alice.eth` instead of `0x742d35Cc...`
2. **Portable metadata**: Recipients can update their email/URL/payment preferences in ENS
3. **Verified identities**: ENS provides a canonical, decentralized naming system
4. **Improved UX**: Treasury managers can manage policies with recognizable names

### ✅ Technical Excellence

- Clean component architecture
- Type-safe TypeScript implementation
- Proper error handling and loading states
- Mobile-responsive UI
- Follows Scaffold-ETH patterns

## Testing the Integration

### Test with Real ENS Names

Try these verified ENS names on Ethereum Mainnet:

1. **vitalik.eth** - Vitalik Buterin (has avatar, text records)
2. **nick.eth** - Nick Johnson (ENS founder)
3. **brantly.eth** - Brantly Millegan
4. **dao.eth** - Example DAO identity

### Local Testing Steps

1. Start the local chain and frontend:
   ```bash
   cd app && yarn chain
   cd app && yarn start
   ```

2. Navigate to http://localhost:3000/dashboard

3. Click on **"Policies"** tab

4. Locate **"// ENS_RECIPIENT_RESOLVER"** section

5. Enter an ENS name (e.g., `vitalik.eth`)

6. Click **"Resolve ENS"**

7. Verify:
   - Address resolves correctly
   - Avatar displays (if available)
   - Text records appear
   - "Add to Recipients" button is enabled

8. Click **"Add to Recipients"**

9. Verify address appears in Recipients input below

10. Complete policy creation and submit

## Mainnet vs Testnet Clarification

| Component | Network | Purpose |
|-----------|---------|---------|
| **ENS Resolution** | Ethereum Mainnet | Read canonical ENS data |
| **Contract Execution** | Testnet (Anvil/Arc) | Write policies, execute payments |
| **Text Records** | Ethereum Mainnet | Read metadata (email, url, etc.) |
| **Policy Creation** | Testnet | Store policy on TreasuryVault |

**Key Point**: ENS provides the **identity layer** (names + metadata) while the **execution layer** (smart contracts) remains on testnet.

## Future Enhancements

Potential improvements (not required for prize):
- Support for custom text record keys
- Batch ENS resolution for multiple recipients
- ENS name suggestions/autocomplete
- Integration with ENS subdomain creation for DAOs
- Display ENS name alongside address in policy tables

## Troubleshooting

### "ENS name not found"

**Cause**: Name doesn't exist or hasn't set the ETH address record

**Solution**: Try a known ENS name like `vitalik.eth` or verify the name exists on app.ens.domains

### No text records showing

**Cause**: ENS name hasn't set any text records

**Solution**: This is normal - not all ENS names have text records. The integration gracefully handles missing records.

### "Please enter a valid ENS name"

**Cause**: Input doesn't contain a dot (.)

**Solution**: ENS names must be in format `name.eth` or `subdomain.name.eth`

## Code References

### Main Component
- Location: `app/packages/nextjs/components/ens/EnsRecipientResolver.tsx`
- Props: `onAddRecipient`, `connectedAddress`
- Hooks: `useEnsAddress`, `useEnsName`, `useEnsAvatar`, `useEnsText`

### Dashboard Integration
- Location: `app/packages/nextjs/app/dashboard/page.tsx`
- Helper: `addRecipient(address)`
- Placement: Policies tab, above CREATE_POLICY form

## Summary

SentinelDAO's ENS integration provides a **production-ready** example of using ENS for:
- Human-readable treasury recipient identities
- Portable, decentralized payment metadata
- Improved UX in DAO treasury management

All ENS interactions are read-only from Ethereum Mainnet, while contract execution remains safely on testnet.

---

**Built for ETHGlobal HackMoney 2026**
