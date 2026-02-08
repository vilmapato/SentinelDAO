"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";
import { useScaffoldReadContract, useScaffoldWriteContract, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { EnsRecipientResolver } from "~~/components/ens/EnsRecipientResolver";

const SentinelDashboard: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"overview" | "policies">("overview");
  const [mintAmount, setMintAmount] = useState("1000");
  const [fundAmount, setFundAmount] = useState("100");
  const [isApproving, setIsApproving] = useState(false);

  // Policy creation form state
  const [recipients, setRecipients] = useState("");
  const [recipientChips, setRecipientChips] = useState<Array<{ address: string; ensName?: string }>>([]);
  const [amounts, setAmounts] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState("0");
  const [startTime, setStartTime] = useState("");
  const [maxPerExecution, setMaxPerExecution] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Read vault and USDC addresses
  const { data: vaultContract } = useDeployedContractInfo({
    contractName: "TreasuryVault",
  });
  const vaultAddress = vaultContract?.address;

  const { data: usdcAddress } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "usdc",
  });

  const { data: actualVaultBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: vaultAddress ? [vaultAddress] : undefined,
  });

  const { data: userUsdcBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
  });

  const { data: policyCount } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "policyCount",
  });

  const { data: agent } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "agent",
  });

  const { data: owner } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "owner",
  });

  const { data: paused } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "paused",
  });

  // Write functions
  const { writeContractAsync: writeMockUSDC } = useScaffoldWriteContract({
    contractName: "MockUSDC",
  });

  const { writeContractAsync: writeVault } = useScaffoldWriteContract({
    contractName: "TreasuryVault",
  });

  // Event logs
  const { data: policyExecutedEvents } = useScaffoldEventHistory({
    contractName: "TreasuryVault",
    eventName: "PolicyExecuted",
    fromBlock: 0n,
    watch: true,
  });

  const { data: treasuryFundedEvents } = useScaffoldEventHistory({
    contractName: "TreasuryVault",
    eventName: "TreasuryFunded",
    fromBlock: 0n,
    watch: true,
  });

  const { data: policyCreatedEvents } = useScaffoldEventHistory({
    contractName: "TreasuryVault",
    eventName: "PolicyCreated",
    fromBlock: 0n,
    watch: true,
  });

  // Set default start time (60 seconds from now)
  useEffect(() => {
    if (!startTime) {
      const defaultStart = Math.floor(Date.now() / 1000) + 60;
      setStartTime(defaultStart.toString());
    }
  }, [startTime]);

  const handleMintUSDC = async () => {
    try {
      if (!connectedAddress) return;
      const amount = parseUnits(mintAmount, 6);
      await writeMockUSDC({
        functionName: "faucetMint",
        args: [amount],
      });
    } catch (error) {
      console.error("Error minting USDC:", error);
    }
  };

  const handleFundTreasury = async () => {
    try {
      if (!vaultAddress) return;
      const amount = parseUnits(fundAmount, 6);

      setIsApproving(true);
      // First approve the TreasuryVault to spend USDC
      await writeMockUSDC({
        functionName: "approve",
        args: [vaultAddress, amount],
      });

      // Wait a bit for the approval to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Then fund
      await writeVault({
        functionName: "fundTreasury",
        args: [amount],
      });

      setIsApproving(false);
      setFundAmount("100");
    } catch (error) {
      console.error("Error funding treasury:", error);
      setIsApproving(false);
    }
  };

  // Helper function to add ENS-resolved address to recipients
  const addRecipient = (address: `0x${string}`, ensName?: string) => {
    // Check for duplicates (case-insensitive)
    const isDuplicate = recipientChips.some(
      chip => chip.address.toLowerCase() === address.toLowerCase()
    );

    if (isDuplicate) {
      console.log("Address already in recipients list");
      return;
    }

    // Add to recipient chips
    setRecipientChips([...recipientChips, { address, ensName }]);
  };

  // Helper to remove a recipient chip
  const removeRecipient = (address: string) => {
    setRecipientChips(recipientChips.filter(chip => chip.address.toLowerCase() !== address.toLowerCase()));
  };

  // Helper to add recipient from manual input
  const handleAddRecipientFromInput = () => {
    const trimmedInput = recipients.trim();
    if (!trimmedInput) return;

    // Check if it's a valid Ethereum address
    if (trimmedInput.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.log("Adding recipient:", trimmedInput);
      addRecipient(trimmedInput as `0x${string}`);
      setRecipients(""); // Clear input
    } else {
      console.error("Invalid Ethereum address format");
      alert("Please enter a valid Ethereum address (0x followed by 40 hexadecimal characters)");
    }
  };

  const handleCreatePolicy = async () => {
    try {
      // Validation
      if (recipientChips.length === 0) {
        console.error("No recipients added");
        return;
      }

      if (!amounts.trim()) {
        console.error("No amounts specified");
        return;
      }

      const recipientsArray = recipientChips.map(chip => chip.address);
      const amountsArray = amounts.split(",").map(a => parseUnits(a.trim(), 6));

      // Validate amounts match recipients
      if (amountsArray.length !== recipientsArray.length) {
        console.error("Number of amounts must match number of recipients");
        alert(`Please enter ${recipientsArray.length} amount(s) to match the ${recipientsArray.length} recipient(s)`);
        return;
      }

      const totalAmount = amountsArray.reduce((acc, curr) => acc + curr, 0n);
      const maxPer = maxPerExecution ? parseUnits(maxPerExecution, 6) : totalAmount;

      console.log("Creating policy with:", {
        recipients: recipientsArray,
        amounts: amountsArray,
        intervalSeconds,
        startTime,
        maxPer,
        requiresApproval
      });

      await writeVault({
        functionName: "createPolicy",
        args: [recipientsArray, amountsArray, BigInt(intervalSeconds), BigInt(startTime), maxPer, requiresApproval],
      });

      // Reset form
      setRecipientChips([]);
      setRecipients("");
      setAmounts("");
      setIntervalSeconds("0");
      setStartTime((Math.floor(Date.now() / 1000) + 60).toString());
      setMaxPerExecution("");
      setRequiresApproval(false);
    } catch (error) {
      console.error("Error creating policy:", error);
      alert("Error creating policy. Check console for details.");
    }
  };

  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4">🛡️ Dashboard</h1>
          <p className="text-xl text-gray-400">Monitor and manage your autonomous treasury</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-4 text-xl font-bold transition-all border border-gray-700 ${
              activeTab === "overview"
                ? "text-orange-500 border-b-2 border-b-orange-500"
                : "text-gray-500 hover:text-gray-300 border-b-0"
            }`}
          >
            Treasury Overview
          </button>
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-6 py-4 text-xl font-bold transition-all border border-gray-700 ${
              activeTab === "policies"
                ? "text-orange-500 border-b-2 border-b-orange-500"
                : "text-gray-500 hover:text-gray-300 border-b-0"
            }`}
          >
            Policies
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-12">
            {/* Treasury Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-8 border-2 border-gray-800 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Treasury Balance</div>
                <div className="text-4xl font-bold text-orange-500">
                  {actualVaultBalance ? formatUnits(actualVaultBalance, 6) : "0"}
                </div>
                <div className="text-lg text-gray-400 mt-1">USDC</div>
              </div>

              <div className="p-8 border-2 border-gray-800 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Your Balance</div>
                <div className="text-4xl font-bold text-blue-500">
                  {userUsdcBalance ? formatUnits(userUsdcBalance, 6) : "0"}
                </div>
                <div className="text-lg text-gray-400 mt-1">USDC</div>
              </div>

              <div className="p-8 border-2 border-gray-800 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Total Policies</div>
                <div className="text-4xl font-bold text-white">{policyCount?.toString() || "0"}</div>
              </div>

              <div className="p-8 border-2 border-gray-800 rounded-lg bg-gray-900/50">
                <div className="text-sm text-gray-500 mb-2 uppercase tracking-wider">Vault Status</div>
                <div className={`text-4xl font-bold ${paused ? "text-red-500" : "text-green-500"}`}>
                  {paused ? "PAUSED" : "ACTIVE"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mint USDC */}
              <div className="p-8 border-2 border-gray-800 rounded-lg">
                <h3 className="text-3xl font-bold mb-6 text-orange-500">Mint USDC</h3>
                <p className="text-gray-400 mb-6 text-lg">For local development only</p>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="input input-bordered bg-black border-gray-700 text-white text-lg flex-grow"
                    value={mintAmount}
                    onChange={e => setMintAmount(e.target.value)}
                  />
                  <button className="btn bg-orange-500 hover:bg-orange-600 border-none text-white text-lg px-8" onClick={handleMintUSDC}>
                    Mint
                  </button>
                </div>
              </div>

              {/* Fund Treasury */}
              <div className="p-8 border-2 border-gray-800 rounded-lg">
                <h3 className="text-3xl font-bold mb-6 text-orange-500">Fund Treasury</h3>
                <p className="text-gray-400 mb-6 text-lg">Deposit USDC into the vault</p>
                <div className="flex gap-4">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="input input-bordered bg-black border-gray-700 text-white text-lg flex-grow"
                    value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)}
                  />
                  <button
                    className="btn bg-orange-500 hover:bg-orange-600 border-none text-white text-lg px-8"
                    onClick={handleFundTreasury}
                    disabled={isApproving}
                  >
                    {isApproving ? "Approving..." : "Fund"}
                  </button>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            <div className="p-8 border-2 border-gray-800 rounded-lg font-mono">
              <h3 className="text-3xl font-bold mb-6 text-orange-500">Contract Info</h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between">
                  <span className="text-gray-500">USDC:</span>
                  <span className="text-gray-300 text-sm">{usdcAddress || "Loading..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Agent:</span>
                  <span className="text-gray-300 text-sm">{agent || "Loading..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Owner:</span>
                  <span className="text-gray-300 text-sm">{owner || "Loading..."}</span>
                </div>
              </div>
            </div>

            {/* Event Logs */}
            <div className="p-8 border-2 border-gray-800 rounded-lg">
              <h3 className="text-3xl font-bold mb-8 text-orange-500">Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-gray-800 text-gray-400 text-base">
                      <th>Event</th>
                      <th>Policy ID</th>
                      <th>Amount</th>
                      <th>Timestamp</th>
                      <th>Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="text-lg">
                    {policyExecutedEvents?.map((event, idx) => (
                      <tr key={`exec-${idx}`} className="border-gray-800 hover:bg-gray-900/50">
                        <td>
                          <span className="badge bg-green-500/20 text-green-500 border-green-500/30 text-sm px-3 py-2">
                            Executed
                          </span>
                        </td>
                        <td className="text-orange-500 font-mono">{event.args.id?.toString()}</td>
                        <td>{event.args.total ? formatUnits(event.args.total, 6) : "0"} USDC</td>
                        <td className="text-gray-400">
                          {event.args.timestamp ? new Date(Number(event.args.timestamp) * 1000).toLocaleString() : "-"}
                        </td>
                        <td className="font-mono text-sm text-gray-500">{event.transactionHash?.slice(0, 10)}...</td>
                      </tr>
                    ))}
                    {treasuryFundedEvents?.map((event, idx) => (
                      <tr key={`fund-${idx}`} className="border-gray-800 hover:bg-gray-900/50">
                        <td>
                          <span className="badge bg-blue-500/20 text-blue-500 border-blue-500/30 text-sm px-3 py-2">
                            Funded
                          </span>
                        </td>
                        <td className="text-gray-500">-</td>
                        <td>{event.args.amount ? formatUnits(event.args.amount, 6) : "0"} USDC</td>
                        <td className="text-gray-400">-</td>
                        <td className="font-mono text-sm text-gray-500">{event.transactionHash?.slice(0, 10)}...</td>
                      </tr>
                    ))}
                    {policyCreatedEvents?.map((event, idx) => (
                      <tr key={`create-${idx}`} className="border-gray-800 hover:bg-gray-900/50">
                        <td>
                          <span className="badge bg-orange-500/20 text-orange-500 border-orange-500/30 text-sm px-3 py-2">
                            Created
                          </span>
                        </td>
                        <td className="text-orange-500 font-mono">{event.args.id?.toString()}</td>
                        <td>{event.args.total ? formatUnits(event.args.total, 6) : "0"} USDC</td>
                        <td className="text-gray-400">
                          {event.args.startTime ? new Date(Number(event.args.startTime) * 1000).toLocaleString() : "-"}
                        </td>
                        <td className="font-mono text-sm text-gray-500">{event.transactionHash?.slice(0, 10)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-12">
            {/* ENS Recipient Resolver */}
            {isOwner && (
              <EnsRecipientResolver 
                onAddRecipient={addRecipient} 
                connectedAddress={connectedAddress as `0x${string}` | undefined} 
              />
            )}

            {/* Create Policy Form */}
            {isOwner && (
              <div className="p-8 border-2 border-orange-500/30 rounded-lg bg-orange-500/5">
                <h3 className="text-3xl font-bold mb-8 text-orange-500">Create Policy</h3>
                
                {/* Recipients Section with Chips */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text text-gray-400 text-lg flex items-center gap-2">
                      Recipients
                      <div className="tooltip tooltip-right" data-tip="Add wallet addresses manually or use ENS resolver above">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current text-orange-500 cursor-help">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </span>
                  </label>
                  
                  {/* Recipient Chips Display */}
                  {recipientChips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-black border border-gray-700 rounded">
                      {recipientChips.map((chip, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/50 rounded px-3 py-2"
                        >
                          <span className="text-white font-mono text-sm">
                            {chip.ensName || `${chip.address.slice(0, 6)}...${chip.address.slice(-4)}`}
                          </span>
                          <button
                            onClick={() => removeRecipient(chip.address)}
                            className="text-orange-500 hover:text-orange-300 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Manual Address Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0x123..."
                      className="input input-bordered bg-black border-gray-700 text-white text-lg flex-grow"
                      value={recipients}
                      onChange={e => setRecipients(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleAddRecipientFromInput();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddRecipientFromInput}
                      className="btn bg-gray-700 hover:bg-gray-600 border-none text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Rest of Form in 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 text-lg flex items-center gap-2">
                        Amounts (USDC)
                        <div className="tooltip tooltip-right" data-tip="Enter amounts separated by commas, matching the order of recipients (e.g., 100, 200)">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current text-orange-500 cursor-help">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="100, 200"
                      className="input input-bordered bg-black border-gray-700 text-white text-lg"
                      value={amounts}
                      onChange={e => setAmounts(e.target.value)}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 text-lg">Start Time</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="input input-bordered bg-black border-gray-700 text-white text-lg"
                      onChange={e => {
                        const date = new Date(e.target.value);
                        setStartTime(Math.floor(date.getTime() / 1000).toString());
                      }}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 text-lg flex items-center gap-2">
                        Interval
                        <div className="tooltip tooltip-right" data-tip="Set recurring payment interval: 0 = one-time payment, 60 = every minute, 3600 = hourly, 86400 = daily, 2592000 = monthly, 31536000 = yearly">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current text-orange-500 cursor-help">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="0"
                        className="input input-bordered bg-black border-gray-700 text-white text-lg flex-grow"
                        value={intervalSeconds}
                        onChange={e => setIntervalSeconds(e.target.value)}
                      />
                      <select
                        className="select select-bordered bg-black border-gray-700 text-white text-lg"
                        onChange={e => {
                          const multiplier = e.target.value;
                          if (multiplier !== "custom") {
                            setIntervalSeconds(multiplier);
                          }
                        }}
                      >
                        <option value="custom">seconds</option>
                        <option value="0">one-off</option>
                        <option value="60">minute</option>
                        <option value="3600">hour</option>
                        <option value="86400">day</option>
                        <option value="604800">week</option>
                        <option value="2592000">month</option>
                        <option value="31536000">year</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 text-lg">Max Per Execution (USDC, optional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Auto-calculated"
                      className="input input-bordered bg-black border-gray-700 text-white text-lg"
                      value={maxPerExecution}
                      onChange={e => setMaxPerExecution(e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text text-gray-400 text-lg flex items-center gap-3">
                        Requires Approval
                        <input
                          type="checkbox"
                          className="toggle toggle-lg toggle-orange"
                          checked={requiresApproval}
                          onChange={e => setRequiresApproval(e.target.checked)}
                        />
                      </span>
                    </label>
                  </div>
                </div>

                <button 
                  className="btn bg-orange-500 hover:bg-orange-600 border-none text-white text-xl px-12 py-4 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCreatePolicy}
                  disabled={recipientChips.length === 0 || !amounts.trim()}
                  title={recipientChips.length === 0 ? "Add at least one recipient" : !amounts.trim() ? "Enter amounts" : ""}
                >
                  Create Policy →
                </button>
                {recipientChips.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">Add at least one recipient to create a policy</p>
                )}
              </div>
            )}

            {/* Policies Table */}
            <div className="p-8 border-2 border-gray-800 rounded-lg">
              <h3 className="text-3xl font-bold mb-8 text-orange-500">Active Policies</h3>
              <PoliciesTable policyCount={Number(policyCount || 0)} isOwner={!!isOwner} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Policies Table Component
const PoliciesTable = ({ policyCount, isOwner }: { policyCount: number; isOwner: boolean }) => {
  if (policyCount === 0) {
    return <p className="text-center py-8 text-gray-400 text-xl">No policies created yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="border-gray-800 text-gray-400 text-base">
            <th>ID</th>
            <th>Enabled</th>
            <th>Approval</th>
            <th>Recipients</th>
            <th>Next Execution</th>
            <th>Interval</th>
            <th>Executions</th>
            <th>Total/Execution</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className="text-lg">
          {Array.from({ length: policyCount }, (_, i) => (
            <PolicyRow key={i} policyId={i} isOwner={isOwner} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Recipient Display Component with ENS lookup
const RecipientDisplay = ({ address }: { address: string }) => {
  const { data: ensName } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
  });

  return (
    <span className="font-mono text-xs">
      {ensName || `${address.slice(0, 6)}...${address.slice(-4)}`}
    </span>
  );
};

// Individual Policy Row
const PolicyRow = ({ policyId, isOwner }: { policyId: number; isOwner: boolean }) => {
  const { data: policyData } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "getPolicy",
    args: [BigInt(policyId)],
  });

  const { data: totalPerExecution } = useScaffoldReadContract({
    contractName: "TreasuryVault",
    functionName: "totalPerExecution",
    args: [BigInt(policyId)],
  });

  const { writeContractAsync: writeVault } = useScaffoldWriteContract({
    contractName: "TreasuryVault",
  });

  const [enabled, requiresApproval, approved, intervalSeconds, nextExecutionTime, maxPerExecution, executions, lastExecutedAt, recipients, amounts] =
    policyData || [];

  const handleToggleEnabled = async () => {
    try {
      await writeVault({
        functionName: "setPolicyEnabled",
        args: [BigInt(policyId), !enabled],
      });
    } catch (error) {
      console.error("Error toggling policy:", error);
    }
  };

  const handleApprove = async () => {
    try {
      await writeVault({
        functionName: "approvePolicy",
        args: [BigInt(policyId)],
      });
    } catch (error) {
      console.error("Error approving policy:", error);
    }
  };

  if (!policyData) {
    return (
      <tr>
        <td colSpan={9} className="text-center text-gray-500">
          Loading...
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-gray-800 hover:bg-gray-900/50">
      <td className="font-mono text-orange-500 font-bold">{policyId}</td>
      <td>
        <span className={`badge ${enabled ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-red-500/20 text-red-500 border-red-500/30"} text-sm px-3 py-2`}>
          {enabled ? "Active" : "Disabled"}
        </span>
      </td>
      <td>
        {requiresApproval ? (
          <span className={`badge ${approved ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"} text-sm px-3 py-2`}>
            {approved ? "Approved" : "Pending"}
          </span>
        ) : (
          <span className="badge bg-gray-800 text-gray-500 border-gray-700 text-sm px-3 py-2">N/A</span>
        )}
      </td>
      <td className="text-sm text-gray-400">
        {recipients && recipients.length > 0 ? (
          <div className="flex flex-col gap-1">
            {recipients.map((recipient: string, idx: number) => (
              <RecipientDisplay key={idx} address={recipient} />
            ))}
          </div>
        ) : (
          "-"
        )}
      </td>
      <td className="text-sm text-gray-400 font-mono">
        {nextExecutionTime ? new Date(Number(nextExecutionTime) * 1000).toLocaleString() : "-"}
      </td>
      <td className="font-mono text-gray-300">{intervalSeconds?.toString()}s</td>
      <td className="font-bold text-white">{executions?.toString()}</td>
      <td className="text-orange-500">{totalPerExecution ? formatUnits(totalPerExecution, 6) : "0"} USDC</td>
      <td>
        {isOwner && (
          <div className="flex gap-2">
            <button className="btn btn-sm bg-orange-500 hover:bg-orange-600 border-none text-white" onClick={handleToggleEnabled}>
              {enabled ? "Disable" : "Enable"}
            </button>
            {requiresApproval && !approved && (
              <button className="btn btn-sm bg-green-500 hover:bg-green-600 border-none text-white" onClick={handleApprove}>
                Approve
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
};

export default SentinelDashboard;
