// src/commands/sleeptimer.ts: Slash Command /sleeptimer untuk mengatur timer tidur
import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { startSleepTimer, cancelSleepTimer, getSleepTimer } from "../timer/sleepTimerManager.js";
import { createSuccessEmbed, createInfoEmbed, createErrorEmbed } from "../ui/embeds.js";
import { stopRadio } from "../recommend/radio.js";
import { cancelAutoLeave } from "../player/lavalink.js";

export const sleeptimerCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sleeptimer")
    .setDescription("Atur penghitung waktu mundur otomatis untuk menghentikan musik saat Anda hendak tidur")
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Mulai penghitung waktu tidur baru dengan pengurangan volume halus")
        .addIntegerOption((opt) =>
          opt
            .setName("minutes")
            .setDescription("Durasi dalam menit sebelum musik berhenti (contoh: 15, 30, 60)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(240)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("cancel").setDescription("Batalkan timer tidur aktif saat ini")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Periksa sisa waktu timer tidur yang sedang berjalan")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "cancel") {
      const cancelled = cancelSleepTimer(guildId);
      if (cancelled) {
        await interaction.reply({
          embeds: [createSuccessEmbed("Timer Dibatalkan", "⏰ Sleep Timer telah dibatalkan. Musik akan tetap diputar normal.")],
        });
        return;
      } else {
        await interaction.reply({
          embeds: [createInfoEmbed("Tidak Ada Timer", "ℹ️ Tidak ada Sleep Timer yang sedang aktif di server ini.")],
          ephemeral: true,
        });
        return;
      }
    }

    if (sub === "status") {
      const active = getSleepTimer(guildId);
      if (!active) {
        await interaction.reply({
          embeds: [createInfoEmbed("Status Sleep Timer", "ℹ️ Tidak ada Sleep Timer yang sedang aktif.")],
          ephemeral: true,
        });
        return;
      }

      const minutes = Math.floor(active.remainingSeconds / 60);
      const seconds = active.remainingSeconds % 60;
      await interaction.reply({
        embeds: [
          createInfoEmbed(
            "Status Sleep Timer 🌙",
            `Sisa waktu: **${minutes} menit ${seconds} detik**.\nMusik akan memudar perlahan pada 30 detik terakhir.`
          ),
        ],
      });
      return;
    }

    // sub === 'set'
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const minutes = interaction.options.getInteger("minutes", true);

    const session = startSleepTimer(
      guildId,
      minutes,
      () => player.volume || 100,
      async (vol) => {
        await player.setVolume(vol);
      },
      async () => {
        try {
          stopRadio(guildId);
          cancelAutoLeave(guildId);
          player.queue.tracks.splice(0, player.queue.tracks.length);
          await player.destroy("Sleep Timer Berakhir");

          const channel = interaction.channel;
          if (channel && "send" in channel) {
            await (channel as any).send({
              embeds: [
                createInfoEmbed(
                  "🌙 Waktu Tidur Tiba",
                  "Sleep Timer telah selesai. Musik dihentikan dan bot telah meninggalkan Voice Channel. Selamat beristirahat!"
                ),
              ],
            });
          }
        } catch (e) {
          console.error("[SleepTimer] Error saat menyelesaikan timer:", e);
        }
      }
    );

    const endsTimestamp = Math.floor(session.endsAt.getTime() / 1000);
    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          "Sleep Timer Diaktifkan 🌙",
          `Musik akan otomatis berhenti dalam **${minutes} menit** (<t:${endsTimestamp}:R>).\nVolume akan memudar secara halus sebelum bot keluar.`
        ),
      ],
    });
  },
};
