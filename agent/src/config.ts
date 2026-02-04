import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

dotenvConfig();

const configSchema = z.object({
  RPC_URL: z.string().url("Invalid RPC_URL"),
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid PRIVATE_KEY format"),
  VAULT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid VAULT_ADDRESS format"),
  POLL_INTERVAL_MS: z.string().transform(Number).pipe(z.number().positive()),
  PORT: z.string().transform(Number).pipe(z.number().positive()).optional().default("3001"),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  try {
    return configSchema.parse({
      RPC_URL: process.env.RPC_URL,
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      VAULT_ADDRESS: process.env.VAULT_ADDRESS,
      POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS,
      PORT: process.env.PORT,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Configuration validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      throw new Error("Invalid configuration. Please check your .env file.");
    }
    throw error;
  }
}
