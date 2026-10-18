import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer } from "../player/lavalink.js";
import { getQueueSnapshot, clearQueueSnapshot } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const restoreCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("restore")
    .setDescription("Memulihkan antrean musik yang tersimpan sebelum bot di-restart"),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus bergabung ke Voice Channel terlebih dahulu.")],
        ephemeral: true,
      });
      return;
    }

    const snapshot = getQueueSnapshot(interaction.guildId!);
    if (!snapshot || !snapshot.tracks || snapshot.tracks.length === 0) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Snapshot", "Tidak ada antrean tersimpan sebelumnya yang dapat dipulihkan.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

      let loadedCount = 0;
      for (const t of snapshot.tracks) {
        try {
          const res = await player.search({ query: t.info?.uri || `${t.info?.author} - ${t.info?.title}` }, interaction.user);
          if (res && res.tracks.length > 0) {
            player.queue.add(res.tracks[0]);
            loadedCount++;
            if (!player.playing && !player.paused) {
              await player.play();
            }
          }
        } catch {}
      }

      clearQueueSnapshot(interaction.guildId!);

      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            "Antrean Dipulihkan",
            `🔄 Berhasil memulihkan **${loadedCount}/${snapshot.tracks.length} lagu** ke dalam antrean.`
          ),
        ],
      });
    } catch (err: any) {
      console.error("[Restore Command Error]", err);
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Memulihkan", err?.message || "Terjadi kendala saat memulihkan antrean.")],
      });
    }
  },
};
