import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { resolveSpotifyUrl } from "../resolvers/spotify.js";
import { createErrorEmbed } from "../ui/embeds.js";

const TEST_SPOTIFY_TRACK = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"; // Never Gonna Give You Up

export const diagnoseCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("diagnose")
    .setDescription("Menjalankan pengujian diagnostik end-to-end pipa audio bot (Resolve, Search, Audio Node)"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const results: Array<{ step: string; status: "PASS" | "FAIL" | "WARN"; durationMs: number; details: string }> = [];

    // 1. Diagnosa Lavalink Node
    const nodeStart = Date.now();
    try {
      const node = lavalink?.nodeManager?.nodes?.values()?.next()?.value;
      if (!node || !node.connected) {
        results.push({
          step: "1. Koneksi Lavalink Node",
          status: "FAIL",
          durationMs: Date.now() - nodeStart,
          details: "Node tidak aktif atau koneksi websocket terputus",
        });
      } else {
        results.push({
          step: "1. Koneksi Lavalink Node",
          status: "PASS",
          durationMs: Date.now() - nodeStart,
          details: `Connected (${node.id}), Stats: ${(node as any).stats?.players || 0} players`,
        });
      }
    } catch (err: any) {
      results.push({
        step: "1. Koneksi Lavalink Node",
        status: "FAIL",
        durationMs: Date.now() - nodeStart,
        details: err?.message || "Error saat memeriksa node",
      });
    }

    // 2. Diagnosa Spotify Resolver (Scraping Embed)
    const spStart = Date.now();
    let resolvedTitle = "";
    try {
      const spData = await resolveSpotifyUrl(TEST_SPOTIFY_TRACK);
      const spDuration = Date.now() - spStart;
      if (spData && spData.tracks.length > 0) {
        resolvedTitle = `${spData.tracks[0].artist} - ${spData.tracks[0].title}`;
        results.push({
          step: "2. Spotify Public Embed Resolver",
          status: spDuration > 4000 ? "WARN" : "PASS",
          durationMs: spDuration,
          details: `Resolved metadata: "${resolvedTitle}" (${spDuration}ms)`,
        });
      } else {
        results.push({
          step: "2. Spotify Public Embed Resolver",
          status: "FAIL",
          durationMs: spDuration,
          details: "Gagal mengekstrak metadata dari halaman embed",
        });
      }
    } catch (err: any) {
      results.push({
        step: "2. Spotify Public Embed Resolver",
        status: "FAIL",
        durationMs: Date.now() - spStart,
        details: err?.message || "Resolver Spotify error",
      });
    }

    // 3. Diagnosa YouTube Search via Lavalink
    const ytQuery = resolvedTitle || "Rick Astley Never Gonna Give You Up";
    const ytStart = Date.now();
    try {
      const player = lavalink.getPlayer(interaction.guildId!) || lavalink.createPlayer({
        guildId: interaction.guildId!,
        voiceChannelId: "1528772217524191242",
        textChannelId: interaction.channelId,
      });

      const res = await player.search({ query: ytQuery, source: "ytsearch" }, interaction.user);
      const ytDuration = Date.now() - ytStart;

      if (res && res.tracks.length > 0) {
        const top = res.tracks[0];
        results.push({
          step: "3. Lavalink YouTube Plugin & Search",
          status: ytDuration > 3000 ? "WARN" : "PASS",
          durationMs: ytDuration,
          details: `Matched: "${top.info.title}" (${top.info.author}) [${top.info.identifier}]`,
        });
      } else {
        results.push({
          step: "3. Lavalink YouTube Plugin & Search",
          status: "FAIL",
          durationMs: ytDuration,
          details: `Pencarian kosong (${res.loadType})`,
        });
      }
    } catch (err: any) {
      results.push({
        step: "3. Lavalink YouTube Plugin & Search",
        status: "FAIL",
        durationMs: Date.now() - ytStart,
        details: err?.message || "Gagal melakukan query Lavalink",
      });
    }

    // Buat embed laporan diagnostik
    const allPass = results.every((r) => r.status === "PASS");
    const hasFail = results.some((r) => r.status === "FAIL");

    const embed = new EmbedBuilder()
      .setColor(hasFail ? 0xed4245 : allPass ? 0x57f287 : 0xfee75c)
      .setTitle("🩺 Hasil Uji Diagnostik Bot (End-to-End)")
      .setDescription(
        hasFail
          ? "❌ **Ditemukan kendala pada pipa audio.** Periksa rincian di bawah."
          : "✅ **Semua tahapan pipa audio berfungsi optimal.**"
      )
      .addFields(
        results.map((r) => {
          const icon = r.status === "PASS" ? "✅" : r.status === "WARN" ? "⚠️" : "❌";
          return {
            name: `${icon} ${r.step}`,
            value: `Status: **${r.status}** (${r.durationMs}ms)\nDetail: \`${r.details}\``,
            inline: false,
          };
        })
      )
      .setFooter({ text: "Diagnostik selesai dalam " + results.reduce((acc, c) => acc + c.durationMs, 0) + "ms" });

    await interaction.editReply({ embeds: [embed] });
  },
};
