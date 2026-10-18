import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { setScrobbleToken, getScrobbleAccount, removeScrobbleAccount, db } from "../db/index.js";
import { validateListenBrainzToken } from "../scrobble/listenbrainz.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const scrobbleCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("scrobble")
    .setDescription("Hubungkan profil mendengarkan musik Anda ke ListenBrainz (PRD v4 E4)")
    .addSubcommand((sub) =>
      sub
        .setName("connect")
        .setDescription("Hubungkan akun ListenBrainz Anda menggunakan User Token")
        .addStringOption((opt) =>
          opt
            .setName("token")
            .setDescription("User Token ListenBrainz Anda (dari listenbrainz.org/profile)")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Melihat status koneksi scrobble akun Anda")
    )
    .addSubcommand((sub) =>
      sub
        .setName("disconnect")
        .setDescription("Memutuskan koneksi scrobble dan menghapus token dari database")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "connect") {
      const rawToken = interaction.options.getString("token", true).trim();
      await interaction.deferReply({ ephemeral: true });

      // Validasi token ke ListenBrainz API
      const isValid = await validateListenBrainzToken(rawToken);
      if (!isValid) {
        await interaction.editReply({
          embeds: [
            createErrorEmbed(
              "Token Tidak Valid",
              "Token ListenBrainz yang Anda masukkan tidak valid atau tidak dapat diverifikasi oleh server ListenBrainz.\n" +
                "Silakan periksa kembali token Anda di **https://listenbrainz.org/profile/**."
            ),
          ],
        });
        return;
      }

      setScrobbleToken(userId, "listenbrainz", rawToken);

      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            "🎵 ListenBrainz Terhubung!",
            "Akun ListenBrainz Anda berhasil dihubungkan!\n\n" +
              "🔒 **Privasi:** Token Anda disimpan secara aman dan tidak pernah dibagikan. Lagu yang Anda dengarkan akan otomatis dicatat (*scrobbled*) ke profil ListenBrainz Anda.\n" +
              "Gunakan `/scrobble disconnect` kapan saja untuk mencabut akses."
          ),
        ],
      });
      return;
    }

    if (subcommand === "status") {
      const account = getScrobbleAccount(userId, "listenbrainz");
      if (!account) {
        await interaction.reply({
          embeds: [
            createErrorEmbed(
              "Belum Terhubung",
              "Anda belum menghubungkan akun scrobble.\n" +
                "Gunakan `/scrobble connect token: <token_anda>` untuk mulai mencatat lagu ke ListenBrainz."
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const sentCount = (db.prepare("SELECT COUNT(*) as count FROM scrobble_queue WHERE user_id = ? AND status = 'sent'").get(userId) as any)?.count || 0;
      const pendingCount = (db.prepare("SELECT COUNT(*) as count FROM scrobble_queue WHERE user_id = ? AND status = 'pending'").get(userId) as any)?.count || 0;

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📊 Status Scrobble ListenBrainz")
        .setDescription(`Status: **Aktif & Terhubung** 🟢\nLayanan: **ListenBrainz Open Database**`)
        .addFields([
          { name: "✅ Berhasil Dicatat", value: `\`${sentCount} lagu\``, inline: true },
          { name: "⏳ Dalam Antrean", value: `\`${pendingCount} lagu\``, inline: true },
        ])
        .setFooter({ text: "Gunakan /scrobble disconnect untuk memutuskan koneksi" });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (subcommand === "disconnect") {
      const removed = removeScrobbleAccount(userId, "listenbrainz");
      if (!removed) {
        await interaction.reply({
          embeds: [createErrorEmbed("Belum Terhubung", "Anda tidak memiliki koneksi ListenBrainz yang aktif.")],
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Koneksi Diputus",
            "Token dan akun ListenBrainz Anda telah berhasil dihapus dari database bot."
          ),
        ],
        ephemeral: true,
      });
      return;
    }
  },
};
