import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import type { Config } from "./config.js";
import TreasuryVaultABI from "./TreasuryVaultABI.json" assert { type: "json" };

export function createClients(config: Config) {
  const account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`);

  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(config.RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(config.RPC_URL),
  });

  return {
    publicClient,
    walletClient,
    account,
    vaultAddress: config.VAULT_ADDRESS as Address,
    vaultABI: TreasuryVaultABI,
  };
}

export type ChainClients = ReturnType<typeof createClients>;
