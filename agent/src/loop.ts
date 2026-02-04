import { formatUnits } from "viem";
import type { Logger } from "pino";
import type { ChainClients } from "./chain.js";

export class AgentLoop {
  private executedCount = 0;
  private lastRun = 0;

  constructor(
    private clients: ChainClients,
    private logger: Logger,
  ) {}

  async run(): Promise<void> {
    this.logger.info("🔍 Starting policy evaluation cycle...");
    this.lastRun = Date.now();

    try {
      // Observe: Get all policies and vault state
      const policyCount = await this.clients.publicClient.readContract({
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "policyCount",
      });

      this.logger.info(`Found ${policyCount} policies`);

      if (policyCount === 0n) {
        this.logger.info("No policies to execute");
        return;
      }

      // Get USDC contract address
      const usdcAddress = await this.clients.publicClient.readContract({
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "usdc",
      });

      // Get vault balance
      const vaultBalance = await this.clients.publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "balanceOf",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
          },
        ],
        functionName: "balanceOf",
        args: [this.clients.vaultAddress],
      });

      this.logger.info(`Vault balance: ${formatUnits(vaultBalance as bigint, 6)} USDC`);

      const now = Math.floor(Date.now() / 1000);

      // Check each policy
      for (let i = 0; i < Number(policyCount); i++) {
        await this.evaluatePolicy(i, now, vaultBalance as bigint);
      }
    } catch (error) {
      this.logger.error({ error }, "Error in agent loop");
    }
  }

  private async evaluatePolicy(policyId: number, now: number, vaultBalance: bigint): Promise<void> {
    try {
      // Observe: Get policy details
      const policy = await this.clients.publicClient.readContract({
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "getPolicy",
        args: [BigInt(policyId)],
      });

      const [
        enabled,
        requiresApproval,
        approved,
        intervalSeconds,
        nextExecutionTime,
        maxPerExecution,
        executions,
        lastExecutedAt,
        recipients,
        amounts,
      ] = policy as [
        boolean,
        boolean,
        boolean,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        `0x${string}`[],
        bigint[],
      ];

      // Get total amount
      const total = await this.clients.publicClient.readContract({
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "totalPerExecution",
        args: [BigInt(policyId)],
      });

      this.logger.debug({
        policyId,
        enabled,
        requiresApproval,
        approved,
        nextExecutionTime: Number(nextExecutionTime),
        now,
        total: formatUnits(total as bigint, 6),
        vaultBalance: formatUnits(vaultBalance, 6),
        executions: Number(executions),
      }, `Policy ${policyId} state`);

      // Decide: Check if policy should be executed
      if (!enabled) {
        this.logger.debug(`Policy ${policyId}: disabled`);
        return;
      }

      if (now < Number(nextExecutionTime)) {
        this.logger.debug(`Policy ${policyId}: not yet time (next: ${nextExecutionTime}, now: ${now})`);
        return;
      }

      if (total as bigint > maxPerExecution) {
        this.logger.warn(`Policy ${policyId}: total exceeds maxPerExecution`);
        return;
      }

      if (total as bigint > vaultBalance) {
        this.logger.warn(`Policy ${policyId}: insufficient vault balance`);
        return;
      }

      if (requiresApproval && !approved) {
        this.logger.info(`Policy ${policyId}: waiting for approval`);
        return;
      }

      // Check if vault is paused
      const paused = await this.clients.publicClient.readContract({
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "paused",
      });

      if (paused) {
        this.logger.warn("Vault is paused, skipping execution");
        return;
      }

      // Act: Execute the policy
      this.logger.info(`✅ Policy ${policyId} is ready for execution!`);
      await this.executePolicy(policyId, total as bigint);
    } catch (error) {
      this.logger.error({ error, policyId }, `Error evaluating policy ${policyId}`);
    }
  }

  private async executePolicy(policyId: number, total: bigint): Promise<void> {
    try {
      this.logger.info(`🚀 Executing policy ${policyId}...`);

      const { request } = await this.clients.publicClient.simulateContract({
        account: this.clients.account,
        address: this.clients.vaultAddress,
        abi: this.clients.vaultABI,
        functionName: "executePolicy",
        args: [BigInt(policyId)],
      });

      const txHash = await this.clients.walletClient.writeContract(request);
      
      this.logger.info({ txHash, policyId }, `Transaction sent for policy ${policyId}`);

      // Wait for transaction receipt
      const receipt = await this.clients.publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      if (receipt.status === "success") {
        this.executedCount++;
        this.logger.info({
          txHash,
          policyId,
          total: formatUnits(total, 6),
          gasUsed: receipt.gasUsed.toString(),
        }, `✅ Policy ${policyId} executed successfully!`);
      } else {
        this.logger.error({ txHash, policyId }, `❌ Policy ${policyId} execution failed`);
      }
    } catch (error) {
      this.logger.error({ error, policyId }, `Error executing policy ${policyId}`);
    }
  }

  getStats() {
    return {
      executedCount: this.executedCount,
      lastRun: this.lastRun,
    };
  }
}
