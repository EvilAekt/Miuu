// src/commands/quiz.ts: Slash Command /quiz untuk permainan tebak lagu interaktif
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} from "discord.js";
import type { Command } from "./types.js";
import {
  startQuiz,
  getQuizSession,
  submitAnswer,
  nextRound,
  stopQuiz,
} from "../quiz/quizManager.js";
import { createSuccessEmbed, createInfoEmbed, createErrorEmbed } from "../ui/embeds.js";

export const quizCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Mainkan kuis tebak lagu interaktif bersama teman-teman di Discord")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Mulai sesi permainan kuis tebak lagu baru")
        .addIntegerOption((opt) =>
          opt
            .setName("rounds")
            .setDescription("Jumlah ronde permainan (default: 5)")
            .setRequired(false)
            .addChoices(
              { name: "3 Ronde (Cepat)", value: 3 },
              { name: "5 Ronde (Standar)", value: 5 },
              { name: "10 Ronde (Kompetitif)", value: 10 }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("stop").setDescription("Hentikan permainan kuis yang sedang berlangsung")
    )
    .addSubcommand((sub) =>
      sub.setName("leaderboard").setDescription("Lihat papan skor kuis saat ini")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "stop") {
      const stopped = stopQuiz(guildId);
      if (stopped) {
        await interaction.reply({
          embeds: [createSuccessEmbed("Kuis Dihentikan 🛑", "Sesi permainan kuis tebak lagu telah dihentikan.")],
        });
      } else {
        await interaction.reply({
          embeds: [createInfoEmbed("Tidak Ada Kuis", "Tidak ada sesi kuis yang sedang aktif saat ini.")],
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === "leaderboard") {
      const session = getQuizSession(guildId);
      if (!session) {
        await interaction.reply({
          embeds: [createInfoEmbed("Papan Skor Kuis", "Belum ada sesi kuis aktif.")],
          ephemeral: true,
        });
        return;
      }

      const scoresArray = Array.from(session.scores.entries()).sort((a, b) => b[1] - a[1]);
      const list = scoresArray.length > 0
        ? scoresArray.map(([uid, score], i) => `\`${i + 1}.\` <@${uid}> — **${score} Poin**`).join("\n")
        : "*Belum ada pemain yang mencetak skor.*";

      await interaction.reply({
        embeds: [
          createInfoEmbed(
            `🏆 Papan Skor Kuis (Ronde ${session.currentRound}/${session.totalRounds})`,
            list
          ),
        ],
      });
      return;
    }

    // sub === 'start'
    const existing = getQuizSession(guildId);
    if (existing) {
      await interaction.reply({
        embeds: [createErrorEmbed("Kuis Sudah Berjalan", "Sesi kuis sedang berlangsung! Selesaikan dulu atau gunakan `/quiz stop`.")],
        ephemeral: true,
      });
      return;
    }

    const rounds = interaction.options.getInteger("rounds") || 5;
    const session = startQuiz(guildId, rounds);
    const q = session.currentQuestion!;

    const buttons = q.options.map((optText, idx) =>
      new ButtonBuilder()
        .setCustomId(`quiz_opt_${idx}`)
        .setLabel(`${idx + 1}. ${optText.slice(0, 75)}`)
        .setStyle(ButtonStyle.Primary)
    );

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(0, 2));
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(2, 4));

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🎮 KUIS TEBAK LAGU — Ronde 1 / ${session.totalRounds}`)
      .setDescription(
        `Petunjuk Artis: **${q.artist}**\n\n` +
          `Klik tombol di bawah untuk menebak judul lagu yang tepat!\n*(Waktu menjawab: 20 detik)*`
      )
      .setFooter({ text: "Tebak tercepat yang benar mendapatkan +10 Poin!" });

    const replyMsg = await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      fetchReply: true,
    });

    // Pasang collector untuk menerima jawaban tombol
    const collector = replyMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 20000,
    });

    collector.on("collect", async (btnInteraction) => {
      const idx = parseInt(btnInteraction.customId.replace("quiz_opt_", ""), 10);
      const res = submitAnswer(guildId, btnInteraction.user.id, idx);

      if (res.correct) {
        await btnInteraction.reply({
          content: `🎉 **BENAR!** Jawaban Anda tepat! (+10 Poin, Total: ${res.currentScore} Poin)`,
          ephemeral: true,
        });
      } else {
        await btnInteraction.reply({
          content: `❌ **SALAH!** Sayang sekali, itu bukan jawaban yang benar.`,
          ephemeral: true,
        });
      }
    });

    collector.on("end", async () => {
      const finishedSession = getQuizSession(guildId);
      if (!finishedSession) return;

      const revealEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`Waktu Habis! — Ronde ${session.currentRound}`)
        .setDescription(
          `Jawaban yang benar adalah:\n` +
            `👉 **${q.trackTitle}** oleh **${q.artist}**\n\n` +
            `Gunakan \`/quiz leaderboard\` untuk melihat skor klasemen saat ini.`
        );

      try {
        await interaction.editReply({
          embeds: [revealEmbed],
          components: [],
        });
      } catch {}
    });
  },
};
