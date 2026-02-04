import express from "express";
import pino from "pino";
import { loadConfig } from "./config.js";
import { createClients } from "./chain.js";
import { AgentLoop } from "./loop.js";

// Create logger
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});

async function main() {
  logger.info("🛡️ Starting SentinelDAO Agent...");

  // Load and validate configuration
  const config = loadConfig();
  logger.info({
    rpcUrl: config.RPC_URL,
    vaultAddress: config.VAULT_ADDRESS,
    pollInterval: config.POLL_INTERVAL_MS,
  }, "Configuration loaded");

  // Create blockchain clients
  const clients = createClients(config);
  logger.info({ agentAddress: clients.account.address }, "Agent wallet initialized");

  // Verify agent is authorized
  try {
    const authorizedAgent = await clients.publicClient.readContract({
      address: clients.vaultAddress,
      abi: clients.vaultABI,
      functionName: "agent",
    });

    if ((authorizedAgent as string).toLowerCase() !== clients.account.address.toLowerCase()) {
      logger.warn({
        expected: clients.account.address,
        actual: authorizedAgent,
      }, "⚠️  Agent address mismatch! This wallet may not be authorized to execute policies.");
      logger.warn("Please set the agent address in the vault contract using the owner account.");
    } else {
      logger.info("✅ Agent is authorized");
    }
  } catch (error) {
    logger.error({ error }, "Failed to verify agent authorization");
  }

  // Create agent loop
  const agentLoop = new AgentLoop(clients, logger);

  // Start interval loop
  const pollInterval = config.POLL_INTERVAL_MS;
  logger.info(`Starting polling every ${pollInterval}ms`);

  // Run immediately on start
  await agentLoop.run();

  // Then run on interval
  setInterval(async () => {
    await agentLoop.run();
  }, pollInterval);

  // Optional: Start health check server
  const app = express();
  const port = Number(config.PORT);

  app.get("/health", (req, res) => {
    const stats = agentLoop.getStats();
    res.json({
      status: "ok",
      agentAddress: clients.account.address,
      vaultAddress: clients.vaultAddress,
      ...stats,
      uptime: process.uptime(),
    });
  });

  app.listen(port, () => {
    logger.info(`Health endpoint available at http://localhost:${port}/health`);
  });
}

main().catch((error) => {
  logger.error({ error }, "Fatal error in main");
  process.exit(1);
});
