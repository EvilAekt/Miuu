import type { VoiceState, Client } from "discord.js";
import { lavalink, scheduleAutoLeave, cancelAutoLeave } from "../player/lavalink.js";

export async function onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState, client: Client): Promise<void> {
  const guild = oldState.guild || newState.guild;
  const player = lavalink.getPlayer(guild.id);

  if (!player || !player.connected || !player.voiceChannelId) return;

  const channel = guild.channels.cache.get(player.voiceChannelId);
  if (!channel || !channel.isVoiceBased()) return;

  // Filter members in the VC who are not bots
  const humanMembers = channel.members.filter((m) => !m.user.bot);

  if (humanMembers.size === 0) {
    console.log(`[VoiceState] VC kosong (hanya bot tersisa). Memulai auto-leave dalam 1 menit...`);
    scheduleAutoLeave(player, client, 60 * 1000);
  } else {
    // If a human user is in VC, ensure auto-leave timer is cleared
    if (player.playing) {
      cancelAutoLeave(player.guildId);
    }
  }
}
