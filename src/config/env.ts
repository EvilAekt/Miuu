import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required in .env"),
  GUILD_ID: z.string().min(1, "GUILD_ID is required in .env"),
  VOICE_CHANNEL_ID: z.string().optional(),
  OWNER_ID: z.string().optional(),
  LAVALINK_HOST: z.string().default("127.0.0.1"),
  LAVALINK_PORT: z.string().default("2333").transform((val) => Number(val)),
  LAVALINK_PASSWORD: z.string().min(1, "LAVALINK_PASSWORD is required in .env"),
  LAVALINK_SECURE: z.string().optional().transform((val) => val === "true"),
  AUTO_LEAVE_MINUTES: z.string().default("3").transform((val) => Number(val)),
  DEFAULT_VOLUME: z.string().default("50").transform((val) => Number(val)),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Configuration validation error in .env:");
    for (const error of parsed.error.issues) {
      console.error(` - ${error.path.join(".")}: ${error.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const config = loadConfig();
