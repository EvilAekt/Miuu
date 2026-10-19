import { type Interaction, type GuildMember, EmbedBuilder } from "discord.js";
import { commandMap } from "../commands/index.js";
import { lavalink } from "../player/lavalink.js";
import {
  createErrorEmbed,
  createSuccessEmbed,
  createNowPlayingComponents,
  createQueueEmbed,
  createQueueComponents,
  MIU_THEME,
  getBotAvatarUrl,
} from "../ui/embeds.js";
import { incrementCommandUsage, setMatchOverride, setCachedTrack, setTrackVolumePref } from "../db/index.js";
import { isGuildAllowed } from "../guilds/guildManager.js";
import { fetchLyrics } from "../lyrics/lyricsService.js";

export async function onInteractionCreate(interaction: Interaction): Promise<void> {
  // 1. Handle Autocomplete Interactions
  if (interaction.isAutocomplete()) {
    const command = commandMap.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err: any) {
      console.warn(`[Autocomplete Error] /${interaction.commandName}:`, err?.message);
    }
    return;
  }

  // 2. Handle Slash Commands
  if (interaction.isChatInputCommand()) {
    if (interaction.guildId && !isGuildAllowed(interaction.guildId)) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Server Belum Disetujui",
            "Bot musik ini beroperasi dalam mode privat. Server ini belum disetujui oleh pemilik bot untuk menjalankan perintah musik."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const command = commandMap.get(interaction.commandName);
    if (!command) {
      console.warn(`[Interaction] Perintah tidak dikenali: /${interaction.commandName}`);
      return;
    }

    try {
      incrementCommandUsage(interaction.commandName);
      await command.execute(interaction);
    } catch (error: any) {
      console.error(`[Command Execution Error] /${interaction.commandName}:`, error);

      const embed = createErrorEmbed(
        "Kesalahan Eksekusi",
        "Terjadi kendala internal saat memproses perintah ini. Silakan coba kembali."
      );

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 3. Handle Button Interactions (PRD Section 10)
  if (interaction.isButton()) {
    const member = interaction.member as GuildMember;
    const player = lavalink.getPlayer(interaction.guildId!);

    if (!player || !player.connected) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Pemutar", "Bot sedang tidak terhubung atau memutar musik di server ini.")],
        ephemeral: true,
      });
      return;
    }

    // Voice channel proximity check (PRD Section 10)
    if (!member.voice.channel || member.voice.channel.id !== player.voiceChannelId) {
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            "Akses Ditolak",
            `Anda harus berada di Voice Channel yang sama (<#${player.voiceChannelId}>) untuk menggunakan tombol kontrol.`
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    try {
      const customId = interaction.customId;

      if (customId === "btn_play_pause") {
        if (player.paused) {
          await player.resume();
        } else {
          await player.pause();
        }
        await interaction.update({ components: createNowPlayingComponents(player) });
        return;
      }

      if (customId === "btn_skip") {
        await player.skip();
        await interaction.reply({ content: "⏭️ Lagu berhasil dilewati.", ephemeral: true });
        return;
      }

      if (customId === "btn_loop") {
        const nextMode = player.repeatMode === "off" ? "track" : player.repeatMode === "track" ? "queue" : "off";
        await player.setRepeatMode(nextMode);
        await interaction.update({ components: createNowPlayingComponents(player) });
        return;
      }

      if (customId === "btn_shuffle") {
        if (player.queue.tracks.length < 2) {
          await interaction.reply({ content: "Antrean memiliki kurang dari 2 lagu untuk diacak.", ephemeral: true });
          return;
        }
        player.queue.shuffle();
        await interaction.reply({ content: `🔀 Antrean (${player.queue.tracks.length} lagu) berhasil diacak.`, ephemeral: true });
        return;
      }

      if (customId === "btn_stop") {
        await player.destroy("User clicked Stop button");
        await interaction.update({
          content: "⏹️ Pemutaran dihentikan dan bot keluar dari Voice Channel.",
          embeds: [],
          components: [],
        });
        return;
      }

      if (customId === "btn_vol_down") {
        const newVol = Math.max(0, player.volume - 10);
        await player.setVolume(newVol);
        await interaction.reply({ content: `🔉 Volume diatur ke **${newVol}%**`, ephemeral: true });
        return;
      }

      if (customId === "btn_vol_up") {
        const newVol = Math.min(200, player.volume + 10);
        await player.setVolume(newVol);
        await interaction.reply({ content: `🔊 Volume diatur ke **${newVol}%**`, ephemeral: true });
        return;
      }

      if (customId === "btn_queue") {
        const page = 1;
        const totalPages = Math.ceil(player.queue.tracks.length / 10) || 1;
        const embed = createQueueEmbed(player, page);
        const components = totalPages > 1 ? createQueueComponents(page, totalPages) : [];
        await interaction.reply({ embeds: [embed], components, ephemeral: true });
        return;
      }

      if (customId === "btn_lyrics") {
        const cur = player.queue.current;
        if (!cur) {
          await interaction.reply({
            content: "🌸 Tidak ada lagu yang sedang diputar saat ini.",
            ephemeral: true,
          });
          return;
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          const lyricsData = await fetchLyrics(cur.info.title, cur.info.author);
          if (lyricsData && (lyricsData.plainLyrics || (lyricsData.syncedLines && lyricsData.syncedLines.length > 0))) {
            const rawLyrics = lyricsData.plainLyrics || lyricsData.syncedLines.map((l) => l.text).filter(Boolean).join("\n");
            const truncated = rawLyrics.length > 3900 ? rawLyrics.slice(0, 3900) + "\n\n*(Lirik terpotong karena batas karakter Discord...)*" : rawLyrics;

            const lyricsEmbed = new EmbedBuilder()
              .setColor(MIU_THEME.PRIMARY)
              .setAuthor({ name: "🌸 Miu Synced Lyrics ~", iconURL: getBotAvatarUrl() })
              .setTitle(`🎤 ${cur.info.title}`)
              .setDescription(`Artis: **${cur.info.author}**\n\n${truncated}`)
              .setFooter({ text: "Sumber: LRCLIB Open Database • Miu Music 🎀", iconURL: getBotAvatarUrl() });

            await interaction.editReply({ embeds: [lyricsEmbed] });
          } else {
            await interaction.editReply({
              content: `🌸 Maaf, lirik untuk lagu **${cur.info.title}** belum ditemukan di database terbuka.`,
            });
          }
        } catch (err) {
          await interaction.editReply({
            content: "⚠️ Gagal memuat lirik saat ini.",
          });
        }
        return;
      }

      if (customId.startsWith("btn_queue_page_")) {
        const targetPage = Number(customId.replace("btn_queue_page_", ""));
        const totalPages = Math.ceil(player.queue.tracks.length / 10) || 1;
        const embed = createQueueEmbed(player, targetPage);
        const components = totalPages > 1 ? createQueueComponents(targetPage, totalPages) : [];
        await interaction.update({ embeds: [embed], components });
        return;
      }

      if (customId.startsWith("vol_remember_")) {
        const level = parseInt(customId.replace("vol_remember_", ""), 10);
        if (player.queue.current) {
          const trackKey = `${player.queue.current.info.author} - ${player.queue.current.info.title}`;
          setTrackVolumePref(trackKey, level, interaction.user.id);
          await interaction.reply({
            content: `📌 **Preferensi Disimpan:** Lagu "${player.queue.current.info.title}" akan otomatis disetel ke **${level}%** pada pemutaran berikutnya.`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({ content: "Tidak ada lagu yang sedang diputar saat ini.", ephemeral: true });
        }
        return;
      }
    } catch (err: any) {
      console.error("[Button Interaction Error]", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [createErrorEmbed("Gagal Memproses", "Gagal memproses tombol interaksi.")],
          ephemeral: true,
        }).catch(() => {});
      }
    }
    return;
  }

  // 4. Handle String Select Menus (PRD v2 E3: /fixmatch)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId.startsWith("fixmatch_select_")) {
      const spotifyId = interaction.customId.replace("fixmatch_select_", "");
      const selectedYtId = interaction.values[0];
      const player = lavalink.getPlayer(interaction.guildId!);

      if (!player) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak Ada Pemutar", "Bot tidak sedang aktif di server ini.")],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferUpdate();

      try {
        // Simpan manual match override & update cache (PRD v2 E3)
        setMatchOverride(spotifyId, selectedYtId, interaction.user.id);

        const res = await player.search({ query: `https://www.youtube.com/watch?v=${selectedYtId}` }, interaction.user);
        if (res && res.tracks.length > 0) {
          const newTrack = res.tracks[0];
          setCachedTrack("spotify", spotifyId, "youtube", selectedYtId, newTrack.info.title, newTrack.info.duration || 0);

          // Masukkan lagu pilihan ke depan antrean dan putar langsung
          player.queue.tracks.unshift(newTrack);
          await player.skip();

          await interaction.editReply({
            embeds: [
              createSuccessEmbed(
                "Padanan Lagu Berhasil Diperbarui & Disimpan!",
                `🎯 Berhasil mengubah padanan lagu ke:\n**${newTrack.info.title}**\n\n` +
                  `Pilihan ini telah disimpan permanen ke database \`match_overrides\` dan akan otomatis dipakai setiap kali lagu Spotify ini diputar kembali.`
              ),
            ],
            components: [],
          });
        }
      } catch (err: any) {
        console.error("[Fixmatch Select Error]", err);
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memperbarui Padanan", err?.message || "Terjadi kesalahan saat memuat lagu baru.")],
          components: [],
        });
      }
      return;
    }
  }
}
