// src/commands/ask.ts: Slash Command /ask untuk AI Natural Language Intent Parsing & Multi-action Execution
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type GuildMember,
} from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer, lavalink, cancelAutoLeave } from "../player/lavalink.js";
import { parseNaturalIntent } from "../ai/intentParser.js";
import { set8DAudio } from "../audio/advancedDsp.js";
import { startSleepTimer } from "../timer/sleepTimerManager.js";
import { stopRadio } from "../recommend/radio.js";
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from "../ui/embeds.js";
import { FilterManager } from "lavalink-client";

export const askCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Kendalikan bot musik dengan bahasa alami (contoh: 'putar lofi volume 40 nyalakan 8d')")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("Instruksi bahasa alami yang ingin dijalankan")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice?.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Tidak di Voice Channel",
            "Anda harus bergabung ke Voice Channel terlebih dahulu untuk memberi instruksi pada bot."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt", true);
    const parsed = await parseNaturalIntent(prompt);

    const executedActions: string[] = [];
    const player = await getOrCreatePlayer(
      interaction.guildId!,
      voiceChannel.id,
      interaction.channelId
    );

    // 1. Aksi Play Query jika ada
    if (parsed.playQuery) {
      try {
        const res = await player.search({ query: parsed.playQuery, source: "ytsearch" }, interaction.user);
        if (res.tracks.length > 0) {
          const track = res.tracks[0];
          player.queue.add(track);
          if (!player.playing && !player.paused) {
            await player.play();
          }
          executedActions.push(`🎵 **Lagu**: Memutar \`${track.info.title}\``);
        } else {
          executedActions.push(`⚠️ **Lagu**: Tidak menemukan hasil pencarian untuk "${parsed.playQuery}"`);
        }
      } catch (err: any) {
        executedActions.push(`❌ **Lagu**: Gagal memutar lagu (${err?.message || "error"})`);
      }
    }

    // 2. Aksi Volume jika ada
    if (typeof parsed.volume === "number") {
      try {
        await player.setVolume(parsed.volume);
        executedActions.push(`🔊 **Volume**: Diatur ke **${parsed.volume}%**`);
      } catch (err: any) {
        executedActions.push(`❌ **Volume**: Gagal mengatur volume`);
      }
    }

    // 3. Aksi 8D Audio Spasial jika ada
    if (typeof parsed.enable8d === "boolean") {
      try {
        await set8DAudio(player, parsed.enable8d, "normal");
        executedActions.push(
          `🎧 **8D Spasial**: **${parsed.enable8d ? "Aktif" : "Nonaktif"}**`
        );
      } catch (err: any) {
        executedActions.push(`❌ **8D Spasial**: Gagal mengubah efek 8D`);
      }
    }

    // 4. Aksi Filter DSP jika ada
    if (parsed.filter) {
      try {
        if (parsed.filter === "bassboost_medium") {
          await player.filterManager.setEQ(FilterManager.EQList.BassboostMedium);
          executedActions.push(`🎚️ **Filter**: Bassboost Medium`);
        } else if (parsed.filter === "nightcore") {
          await player.filterManager.toggleNightcore();
          executedActions.push(`✨ **Filter**: Nightcore`);
        } else if (parsed.filter === "vaporwave") {
          await player.filterManager.toggleVaporwave();
          executedActions.push(`🌊 **Filter**: Vaporwave`);
        }
      } catch (err: any) {
        executedActions.push(`❌ **Filter**: Gagal menerapkan filter audio`);
      }
    }

    // 5. Aksi Sleep Timer jika ada
    if (typeof parsed.sleeptimerMinutes === "number" && parsed.sleeptimerMinutes > 0) {
      try {
        const guildId = interaction.guildId!;
        const mins = parsed.sleeptimerMinutes;
        startSleepTimer(
          guildId,
          mins,
          () => player.volume || 100,
          async (vol) => {
            await player.setVolume(vol);
          },
          async () => {
            try {
              stopRadio(guildId);
              cancelAutoLeave(guildId);
              player.queue.tracks.splice(0, player.queue.tracks.length);
              await player.destroy("Sleep Timer Berakhir via AI Intent");
              const channel = interaction.channel;
              if (channel && "send" in channel) {
                await (channel as any).send({
                  embeds: [
                    createInfoEmbed(
                      "🌙 Waktu Tidur Tiba",
                      "Sleep Timer otomatis selesai. Bot meninggalkan Voice Channel."
                    ),
                  ],
                });
              }
            } catch (e) {
              console.error("[AI SleepTimer] Error saat menghentikan:", e);
            }
          }
        );
        executedActions.push(`🌙 **Sleep Timer**: Otomatis berhenti dalam **${mins} menit**`);
      } catch (err: any) {
        executedActions.push(`❌ **Sleep Timer**: Gagal menyetel sleep timer`);
      }
    }

    if (executedActions.length === 0) {
      await interaction.editReply({
        embeds: [
          createInfoEmbed(
            "AI Intent Commander 🤖",
            `Prompt: *"${prompt}"*\n\nTidak ada tindakan musik yang berhasil dikenali. Coba berikan perintah seperti:\n• \`/ask prompt: putar lofi girl volume 40 nyalakan 8d\`\n• \`/ask prompt: naikkan volume ke 80 dan nyalakan bassboost\`\n• \`/ask prompt: setel radio tidur 30 menit\``
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        createSuccessEmbed(
          "AI Intent Commander 🤖",
          `**Prompt**: *"${prompt}"*\n\n**Aksi yang dieksekusi:**\n${executedActions.join("\n")}`
        ),
      ],
    });
  },
};
