// src/commands/mood.ts: Slash Command /mood untuk kurasi playlist otomatis dengan Gemini AI
import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { generateMoodPlaylist } from "../ai/moodCurator.js";
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from "../ui/embeds.js";

export const moodCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("mood")
    .setDescription("Hasilkan dan putar playlist lagu yang dikurasi oleh Google Gemini AI berdasarkan suasana hati")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("Deskripsikan suasana hati atau aktivitas Anda (contoh: coding santai malam hari dengan lofi)")
        .setRequired(true)
        .setMaxLength(300)
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed("Voice Channel Diperlukan", "Anda harus bergabung ke Voice Channel untuk memutar kurasi playlist mood.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    const prompt = interaction.options.getString("prompt", true);

    const result = await generateMoodPlaylist(prompt, 5);
    const { tracks, source } = result;

    if (tracks.length === 0) {
      await interaction.editReply({
        embeds: [createErrorEmbed("Kurasi Gagal", "Tidak dapat menemukan rekomendasi lagu yang sesuai dengan deskripsi tersebut.")],
      });
      return;
    }

    let player = lavalink.getPlayer(interaction.guildId!);
    if (!player) {
      player = lavalink.createPlayer({
        guildId: interaction.guildId!,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        volume: 100,
      });
      await player.connect();
    }

    let addedCount = 0;
    const addedList: string[] = [];

    for (const item of tracks) {
      const query = `ytsearch:${item.title} ${item.artist} audio`;
      const searchRes = await player.search({ query }, interaction.user);
      if (searchRes && searchRes.tracks && searchRes.tracks.length > 0) {
        const track = searchRes.tracks[0];
        await player.queue.add(track);
        addedCount++;
        addedList.push(`• **${item.title}** - *${item.artist}* ${item.reason ? `\n  ↳ _${item.reason}_` : ""}`);
      }
    }

    if (!player.playing && player.queue.tracks.length > 0) {
      await player.play();
    }

    const badge = source === "gemini" ? "✨ **Google Gemini AI**" : "🎧 **Smart Heuristic Curator**";
    const desc = `${badge} telah mengurasi **${addedCount} lagu** untuk suasana:\n> *"${prompt}"*\n\n${addedList.join("\n\n")}`;

    await interaction.editReply({
      embeds: [
        createSuccessEmbed("Playlist Mood Ditambahkan 🎶", desc),
      ],
    });
  },
};
