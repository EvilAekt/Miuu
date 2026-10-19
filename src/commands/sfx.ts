// src/commands/sfx.ts: Slash Command /sfx untuk memainkan klip efek suara singkat
import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { playSfxWithSmartResume } from "../player/sfxManager.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const SFX_PRESETS: Record<string, { label: string; query: string }> = {
  airhorn: { label: "🎺 MLG Airhorn", query: "https://www.myinstants.com/media/sounds/air-horn-club-sample_1.mp3" },
  bruh: { label: "🗿 Bruh Sound Effect", query: "https://www.myinstants.com/media/sounds/movie_1.mp3" },
  applause: { label: "👏 Tepuk Tangan Penonton", query: "https://www.myinstants.com/media/sounds/applause-8.mp3" },
  badumtss: { label: "🥁 Ba Dum Tss (Punchline)", query: "https://www.myinstants.com/media/sounds/ba-dum-tss.mp3" },
  victory: { label: "🏆 Final Fantasy Fanfare", query: "https://www.myinstants.com/media/sounds/ffvii-victory-fanfare.mp3" },
  sadviolin: { label: "🎻 Sad Violin", query: "https://www.myinstants.com/media/sounds/sad-violin.mp3" },
  nope: { label: "🛑 Engineer Nope", query: "https://www.myinstants.com/media/sounds/engineer_no01.mp3" },
};

export const sfxCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("sfx")
    .setDescription("Mainkan klip efek suara atau meme instan di Voice Channel")
    .addStringOption((opt) =>
      opt
        .setName("effect")
        .setDescription("Pilih efek suara yang ingin diputar")
        .setRequired(true)
        .addChoices(
          { name: "🎺 Airhorn", value: "airhorn" },
          { name: "🗿 Bruh", value: "bruh" },
          { name: "👏 Applause", value: "applause" },
          { name: "🥁 Ba-Dum-Tss", value: "badumtss" },
          { name: "🏆 Victory Fanfare", value: "victory" },
          { name: "🎻 Sad Violin", value: "sadviolin" },
          { name: "🛑 Nope", value: "nope" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        embeds: [createErrorEmbed("Voice Channel Diperlukan", "Anda harus bergabung ke Voice Channel terlebih dahulu untuk memutar SFX.")],
        ephemeral: true,
      });
      return;
    }

    const effectKey = interaction.options.getString("effect", true);
    const sfx = SFX_PRESETS[effectKey];

    if (!sfx) {
      await interaction.reply({
        embeds: [createErrorEmbed("Efek Tidak Ditemukan", "Efek suara yang Anda pilih tidak tersedia.")],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

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

    const res = await player.search({ query: sfx.query }, interaction.user);

    if (!res || !res.tracks || res.tracks.length === 0) {
      // Fallback menggunakan pencarian nama jika link langsung bermasalah
      const fallbackRes = await player.search({ query: `ytsearch:${sfx.label} sound effect short` }, interaction.user);
      if (!fallbackRes || !fallbackRes.tracks || fallbackRes.tracks.length === 0) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memuat SFX", `Tidak dapat menemukan audio untuk efek: **${sfx.label}**`)],
        });
        return;
      }
      res.tracks = fallbackRes.tracks;
    }

    const sfxTrack = res.tracks[0];
    const { resumed } = await playSfxWithSmartResume(player, sfxTrack);

    const descMsg = resumed
      ? `Berhasil memutar efek suara: **${sfx.label}** ✨\n*(Lagu yang sedang berjalan dijeda sebentar dan otomatis lanjut kembali)*`
      : `Berhasil memutar efek suara: **${sfx.label}** ✨`;

    await interaction.editReply({
      embeds: [createSuccessEmbed("Memutar SFX 🔊", descMsg)],
    });
  },
};
