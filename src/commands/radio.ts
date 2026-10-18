import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer } from "../player/lavalink.js";
import { startRadio, stopRadio, isRadioActive } from "../recommend/radio.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const radioCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("Menghasilkan antrean musik berkelanjutan tanpa batas dari lagu atau artis benih (PRD v2 E5)")
    .addStringOption((opt) =>
      opt
        .setName("seed")
        .setDescription("Judul lagu atau artis yang dijadikan patokan stasiun radio")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus bergabung ke Voice Channel terlebih dahulu untuk menyalakan mode Radio.")],
        ephemeral: true,
      });
      return;
    }

    const seedQuery = interaction.options.getString("seed", true).trim();

    await interaction.deferReply();

    try {
      const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

      const result = await startRadio(player, seedQuery, interaction.user);

      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            "📻 Stasiun Radio Musik Aktif!",
            `Memulai radio berkelanjutan berdasarkan benih lagu:\n` +
              `🎶 **[${result.seedTrack.info.title}](${result.seedTrack.info.uri || ""})**\n` +
              `🎤 **Artis:** \`${result.seedTrack.info.author || "Unknown"}\`\n\n` +
              `✨ Telah menyiapkan **${result.queuedCount} lagu rekomendasi awal** ke antrean.\n` +
              `🔄 Lagu baru yang serupa akan ditambahkan secara otomatis tanpa batas tanpa mengulang lagu yang sama!\n` +
              `⏹️ *Gunakan \`/stop\` kapan saja untuk menghentikan stasiun radio.*`
          ),
        ],
      });
    } catch (err: any) {
      console.error("[Radio Command Error]", err);
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Memulai Radio", err?.message || "Tidak dapat memuat stasiun radio.")],
      });
    }
  },
};
