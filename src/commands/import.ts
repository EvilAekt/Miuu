import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer } from "../player/lavalink.js";
import { resolveSpotifyUrl } from "../resolvers/spotify.js";
import { getCachedTrack, setCachedTrack } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const importCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("import")
    .setDescription("Import banyak link track Spotify sekaligus (melewati batas 50 lagu)")
    .addStringOption((opt) =>
      opt
        .setName("links")
        .setDescription("Daftar link track Spotify yang ditempel (dipisah baris baru atau koma)")
        .setRequired(false)
    )
    .addAttachmentOption((opt) =>
      opt
        .setName("file")
        .setDescription("Upload file .txt yang memuat daftar link Spotify (satu link per baris)")
        .setRequired(false)
    ),

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

    const rawLinks = interaction.options.getString("links");
    const attachment = interaction.options.getAttachment("file");

    if (!rawLinks && !attachment) {
      await interaction.reply({
        embeds: [createErrorEmbed("Input Diperlukan", "Silakan tempel link pada opsi `links` atau upload file `.txt` pada opsi `file`.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    let fullText = rawLinks || "";
    if (attachment) {
      try {
        const fileRes = await fetch(attachment.url);
        const fileContent = await fileRes.text();
        fullText += "\n" + fileContent;
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Membaca File", "Tidak dapat membaca file lampiran yang diunggah.")],
        });
        return;
      }
    }

    // Extract Spotify track links
    const spotifyTrackRegex = /(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z0-9_-]+\/)?track\/[a-zA-Z0-9]+|spotify:track:[a-zA-Z0-9]+)/gi;
    const matches = fullText.match(spotifyTrackRegex) || [];
    const uniqueLinks = [...new Set(matches)];

    if (uniqueLinks.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Tidak Ada Link Spotify", "Tidak ditemukan link track Spotify yang valid pada input Anda.")],
      });
      return;
    }

    const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

    // Initial response to notify user
    await interaction.editReply({
      embeds: [
        createSuccessEmbed(
          "Memulai Impor Massal",
          `Menemukan **${uniqueLinks.length} link track Spotify**.\nMemproses dan menambahkan lagu ke antrean secara bertahap...`
        ),
      ],
    });

    // Progressive resolution
    let added = 0;
    for (const link of uniqueLinks) {
      try {
        const spotifyId = link.split("/").pop()?.split("?")[0]?.replace("spotify:track:", "") || "";
        const cached = getCachedTrack("spotify", spotifyId);

        if (cached) {
          const res = await player.search({ query: `https://www.youtube.com/watch?v=${cached.resolved_id}` }, interaction.user);
          if (res && res.tracks.length > 0) {
            player.queue.add(res.tracks[0]);
            added++;
            if (!player.playing && !player.paused) await player.play();
            continue;
          }
        }

        const details = await resolveSpotifyUrl(link);
        if (details.tracks.length > 0) {
          const item = details.tracks[0];
          const query = `${item.artist} - ${item.title}`;
          let res = await player.search({ query, source: "ytmsearch" }, interaction.user);
          if (!res || res.loadType === "empty" || !res.tracks.length) {
            res = await player.search({ query, source: "ytsearch" }, interaction.user);
          }

          if (res && res.tracks.length > 0) {
            const track = res.tracks[0];
            if (track.info.identifier) {
              setCachedTrack("spotify", spotifyId, "youtube", track.info.identifier, track.info.title, track.info.duration || 0);
            }
            player.queue.add(track);
            added++;
            if (!player.playing && !player.paused) await player.play();
          }
        }
      } catch (e: any) {
        console.warn(`[Import Error] Gagal memproses link ${link}:`, e?.message);
      }
    }

    console.log(`[Import] Selesai mengimpor ${added}/${uniqueLinks.length} lagu.`);
    try {
      await interaction.editReply({
        embeds: [
          createSuccessEmbed(
            "Impor Selesai",
            `✅ Berhasil menambahkan **${added} dari ${uniqueLinks.length} lagu** Spotify ke dalam antrean.`
          ),
        ],
      });
    } catch {}
  },
};
