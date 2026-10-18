import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import { lavalink } from "../player/lavalink.js";
import { createErrorEmbed } from "../ui/embeds.js";
import type { Player } from "lavalink-client";

export async function getValidPlayer(interaction: ChatInputCommandInteraction): Promise<Player | null> {
  const member = interaction.member as GuildMember;
  const userVc = member.voice.channel;

  if (!userVc) {
    await interaction.reply({
      embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus berada di Voice Channel untuk menggunakan kontrol pemutaran.")],
      ephemeral: true,
    });
    return null;
  }

  const player = lavalink.getPlayer(interaction.guildId!);
  if (!player || !player.connected) {
    await interaction.reply({
      embeds: [createErrorEmbed("Tidak Ada Musik", "Bot sedang tidak memutar musik di server ini.")],
      ephemeral: true,
    });
    return null;
  }

  if (player.voiceChannelId !== userVc.id) {
    await interaction.reply({
      embeds: [createErrorEmbed("Beda Voice Channel", `Anda harus berada di voice channel yang sama dengan bot (<#${player.voiceChannelId}>) untuk menggunakan perintah ini.`)],
      ephemeral: true,
    });
    return null;
  }

  return player;
}
