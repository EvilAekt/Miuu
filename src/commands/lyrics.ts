import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { createErrorEmbed } from "../ui/embeds.js";
import { explainLyricsWithAI } from "../ai/moodCurator.js";

function cleanString(str: string): string {
  return str
    .replace(/(\(|\[).*?(official|video|lyric|audio|mv|remaster|visualizer).*?(\)|\])/gi, "")
    .replace(/ft\..*|feat\..*/gi, "")
    .trim();
}

export const lyricsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Menampilkan lirik lagu dan analisis makna cerdas")
    .addStringOption((opt) =>
      opt.setName("song").setDescription("Judul lagu yang ingin dicari (opsional)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("artist").setDescription("Nama artis penyanyi lagu (opsional)").setRequired(false)
    )
    .addBooleanOption((opt) =>
      opt.setName("explain").setDescription("Minta Google Gemini AI menjelaskan makna dan tema emosional lagu ini").setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const inputSong = interaction.options.getString("song");
    const inputArtist = interaction.options.getString("artist");

    let songTitle = inputSong ? cleanString(inputSong) : "";
    let artistName = inputArtist ? cleanString(inputArtist) : "";
    let artworkUrl: string | null | undefined;

    if (!songTitle) {
      const player = lavalink.getPlayer(interaction.guildId!);
      if (!player || !player.queue.current) {
        await interaction.reply({
          embeds: [
            createErrorEmbed(
              "Tidak Ada Lagu",
              "Saat ini tidak ada lagu yang sedang diputar. Silakan masukkan judul lagu dengan opsi `/lyrics song: <judul>`."
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      const current = player.queue.current;
      songTitle = cleanString(current.info.title);
      artistName = cleanString(current.info.author || "");
      artworkUrl = current.info.artworkUrl;

      // Extract artist if title is formatted as "Artist - Song" and author is a Topic channel
      if (artistName.toLowerCase().includes("topic") && songTitle.includes(" - ")) {
        const parts = songTitle.split(" - ");
        artistName = parts[0].trim();
        songTitle = parts.slice(1).join(" - ").trim();
      }
    }

    await interaction.deferReply();

    try {
      // 1. Coba exact match di LRCLIB
      let lyricsText: string | null = null;
      let finalTitle = songTitle;
      let finalArtist = artistName;

      if (songTitle && artistName) {
        try {
          const res = await fetch(
            `https://lrclib.net/api/get?track_name=${encodeURIComponent(songTitle)}&artist_name=${encodeURIComponent(artistName)}`
          );
          if (res.ok) {
            const data = (await res.json()) as any;
            if (data && data.plainLyrics) {
              lyricsText = data.plainLyrics;
              finalTitle = data.trackName || finalTitle;
              finalArtist = data.artistName || finalArtist;
            }
          }
        } catch {}
      }

      // 2. Jika tidak ditemukan, coba search query di LRCLIB
      if (!lyricsText) {
        const query = `${artistName} ${songTitle}`.trim();
        const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const list = (await res.json()) as any[];
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.plainLyrics) || list[0];
            if (match && match.plainLyrics) {
              lyricsText = match.plainLyrics;
              finalTitle = match.trackName || finalTitle;
              finalArtist = match.artistName || finalArtist;
            }
          }
        }
      }

      if (!lyricsText) {
        await interaction.editReply({
          embeds: [
            createErrorEmbed(
              "Lirik Tidak Ditemukan",
              `Tidak dapat menemukan lirik untuk lagu **${songTitle}** ${artistName ? `oleh **${artistName}**` : ""}.\n` +
                `Coba lakukan pencarian manual yang lebih spesifik menggunakan \`/lyrics song: <judul> artist: <artis>\`.`
            ),
          ],
        });
        return;
      }

      // Potong jika melebihi batas 4096 karakter Discord embed description
      const maxLength = 4000;
      let displayLyrics = lyricsText;
      let isTruncated = false;

      if (displayLyrics.length > maxLength) {
        displayLyrics = displayLyrics.slice(0, maxLength);
        const lastNewline = displayLyrics.lastIndexOf("\n");
        if (lastNewline > 0) {
          displayLyrics = displayLyrics.slice(0, lastNewline);
        }
        isTruncated = true;
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`📜 Lirik: ${finalTitle}`)
        .setDescription(
          `**Artis:** ${finalArtist || "Unknown"}\n\n` +
            displayLyrics +
            (isTruncated ? "\n\n*(Lirik terpotong karena batas karakter Discord)*" : "")
        )
        .setFooter({ text: "Sumber Lirik: LRCLIB Open Database" });

      if (artworkUrl) {
        embed.setThumbnail(artworkUrl);
      }

      const shouldExplain = interaction.options.getBoolean("explain") ?? false;
      if (shouldExplain) {
        const explanation = await explainLyricsWithAI(finalTitle, finalArtist, lyricsText);
        embed.addFields([
          {
            name: "✨ Makna & Analisis Lirik (Google Gemini AI)",
            value: explanation.slice(0, 1024),
            inline: false,
          },
        ]);
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      console.error("[Lyrics Command Error]", err);
      await interaction.editReply({
        embeds: [createErrorEmbed("Gagal Mengambil Lirik", err?.message || "Terjadi kendala saat menghubungi database lirik.")],
      });
    }
  },
};
