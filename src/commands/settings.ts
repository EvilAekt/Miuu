import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import type { Command } from "./types.js";
import { getGuildSettingsExtended, updateGuildSettings } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const settingsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Kelola pengaturan musik server (Volume, DJ Role, Auto-Leave, Vote-Skip, Max Queue)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption((opt) =>
      opt.setName("volume").setDescription("Volume default pemutar musik (10-150%)").setMinValue(10).setMaxValue(150)
    )
    .addIntegerOption((opt) =>
      opt.setName("autoleave").setDescription("Durasi auto-leave saat antrean kosong (menit)").setMinValue(1).setMaxValue(60)
    )
    .addRoleOption((opt) =>
      opt.setName("djrole").setDescription("Role khusus DJ yang dapat mengontrol musik tanpa voting skip")
    )
    .addIntegerOption((opt) =>
      opt.setName("voteskip").setDescription("Persentase vote skip yang dibutuhkan (misal: 50 untuk 50%)").setMinValue(10).setMaxValue(100)
    )
    .addIntegerOption((opt) =>
      opt.setName("maxqueue").setDescription("Batas maksimal kapasitas lagu dalam antrean").setMinValue(10).setMaxValue(500)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const inputVolume = interaction.options.getInteger("volume");
    const inputAutoLeave = interaction.options.getInteger("autoleave");
    const inputDjRole = interaction.options.getRole("djrole");
    const inputVoteSkip = interaction.options.getInteger("voteskip");
    const inputMaxQueue = interaction.options.getInteger("maxqueue");

    const hasUpdates =
      inputVolume !== null ||
      inputAutoLeave !== null ||
      inputDjRole !== null ||
      inputVoteSkip !== null ||
      inputMaxQueue !== null;

    if (hasUpdates) {
      updateGuildSettings(guildId, {
        default_volume: inputVolume !== null ? inputVolume : undefined,
        auto_leave_minutes: inputAutoLeave !== null ? inputAutoLeave : undefined,
        dj_role_id: inputDjRole ? inputDjRole.id : undefined,
        vote_skip_ratio: inputVoteSkip !== null ? inputVoteSkip / 100 : undefined,
        max_queue: inputMaxQueue !== null ? inputMaxQueue : undefined,
      });
    }

    const current = getGuildSettingsExtended(guildId);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`⚙️ Pengaturan Musik Server: ${interaction.guild?.name || "Server"}`)
      .setDescription(
        hasUpdates
          ? "✅ **Pengaturan berhasil diperbarui!** Berikut adalah konfigurasi aktif server ini:"
          : "Berikut adalah konfigurasi pemutar musik aktif untuk server ini:"
      )
      .addFields([
        { name: "🔊 Volume Default", value: `\`${current.default_volume}%\``, inline: true },
        { name: "⏳ Auto-Leave Timer", value: `\`${current.auto_leave_minutes} menit\``, inline: true },
        { name: "🎧 DJ Role", value: current.dj_role_id ? `<@&${current.dj_role_id}>` : "*Tidak diatur (Semua anggota)*", inline: true },
        { name: "🗳️ Vote Skip Ratio", value: `\`${Math.round(current.vote_skip_ratio * 100)}%\``, inline: true },
        { name: "📑 Batas Antrean (Max Queue)", value: `\`${current.max_queue} lagu\``, inline: true },
        { name: "🎨 Mode Tampilan", value: `\`${current.ui_mode.toUpperCase()}\``, inline: true },
      ])
      .setFooter({ text: "Gunakan opsi command /settings untuk memperbarui nilai di atas" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
