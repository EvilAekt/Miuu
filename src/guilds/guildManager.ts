import type { Client, Guild } from "discord.js";
import { isGuildApproved, setGuildStatus, getAllGuilds, recordDemandEvent } from "../db/index.js";
import { config } from "../config/env.js";

export function syncGuildsOnReady(client: Client): void {
  for (const [id, guild] of client.guilds.cache) {
    // Default server utama dari config.GUILD_ID disetujui otomatis
    const isPrimary = id === config.GUILD_ID;
    const currentStatus = isGuildApproved(id) ? "approved" : "pending";
    const status = isPrimary ? "approved" : currentStatus;
    setGuildStatus(id, guild.name, status, "system");
  }
}

export function handleGuildCreate(guild: Guild): void {
  const isPrimary = guild.id === config.GUILD_ID;
  const status = isPrimary ? "approved" : "pending";
  setGuildStatus(guild.id, guild.name, status, guild.ownerId);

  if (status === "pending") {
    recordDemandEvent("guild_join_pending", guild.id, guild.ownerId, `Bergabung ke server baru: ${guild.name} (${guild.memberCount} members)`);
    console.log(`[GuildManager] Bot bergabung ke server baru: ${guild.name} (${guild.id}). Status: PENDING.`);
  }
}

export function isGuildAllowed(guildId: string): boolean {
  if (guildId === config.GUILD_ID) return true;
  return isGuildApproved(guildId);
}

export { getAllGuilds };
