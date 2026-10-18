import type { Client, Guild } from "discord.js";
import { isGuildApproved, setGuildStatus, getAllGuilds, recordDemandEvent } from "../db/index.js";
import { config } from "../config/env.js";

export function syncGuildsOnReady(client: Client): void {
  for (const [id, guild] of client.guilds.cache) {
    const isPrimary = id === config.GUILD_ID;
    const defaultApproved = isPrimary || config.MULTI_SERVER_MODE;
    const currentStatus = isGuildApproved(id) ? "approved" : "pending";
    const status = defaultApproved ? "approved" : currentStatus;
    setGuildStatus(id, guild.name, status, "system");
  }
}

export function handleGuildCreate(guild: Guild): void {
  const isPrimary = guild.id === config.GUILD_ID;
  const status = isPrimary || config.MULTI_SERVER_MODE ? "approved" : "pending";
  setGuildStatus(guild.id, guild.name, status, guild.ownerId);

  if (status === "pending") {
    recordDemandEvent("guild_join_pending", guild.id, guild.ownerId, `Bergabung ke server baru: ${guild.name} (${guild.memberCount} members)`);
    console.log(`[GuildManager] Bot bergabung ke server baru: ${guild.name} (${guild.id}). Status: PENDING.`);
  } else {
    console.log(`[GuildManager] Bot bergabung ke server: ${guild.name} (${guild.id}). Status: APPROVED.`);
  }
}

export function isGuildAllowed(guildId: string): boolean {
  if (config.MULTI_SERVER_MODE) return true;
  if (guildId === config.GUILD_ID) return true;
  return isGuildApproved(guildId);
}

export { getAllGuilds };
