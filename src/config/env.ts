import { z } from "zod";

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required in .env"),
  GUILD_ID: z.string().min(1, "GUILD_ID is required in .env"),
  VOICE_CHANNEL_ID: z.string().optional(),
  OWNER_ID: z.string().optional(),
  LAVALINK_HOST: z.string().default("nodelink.gdjkhp.com"),
  LAVALINK_PORT: z.string().default("443").transform((val) => Number(val)),
  LAVALINK_PASSWORD: z.string().default("youshallnotpass"),
  LAVALINK_SECURE: z.string().optional().transform((val) => (val !== undefined ? val === "true" : true)),
  LAVALINK_BACKUP_HOST: z.string().optional().default("lavalink.jirayu.net"),
  LAVALINK_BACKUP_PORT: z.string().optional().default("443").transform((val) => Number(val)),
  LAVALINK_BACKUP_PASSWORD: z.string().optional().default("youshallnotpass"),
  LAVALINK_BACKUP_SECURE: z.string().optional().transform((val) => (val !== undefined ? val === "true" : true)),
  MULTI_SERVER_MODE: z.string().optional().default("true").transform((val) => val !== "false"),
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
