import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
} from "discord.js";
import type { Track, UnresolvedTrack, Player } from "lavalink-client";

export type AnyTrack = Track | UnresolvedTrack;

/**
 * Tema Visual Lucu Miu (Kawaii Pastel Pink)
 */
export const MIU_THEME = {
  PRIMARY: 0xFFA6C9,   // Soft Pastel Sakura Pink
  SECONDARY: 0xFFD1DC, // Light Blush Pink
  SUCCESS: 0xB5EAD7,   // Pastel Mint
  ERROR: 0xFF6B81,     // Pastel Crimson / Coral
  ACCENT: 0xF472B6,    // Cute Vibrant Pink
  // CDN Avatar Miu aktif (Foto profil Miu terbaru terverifikasi HTTP 200)
  DEFAULT_AVATAR: "https://cdn.discordapp.com/avatars/1561188740511043634/8d50dd99931542b47f1a94e20996ea81.png",
};

let uiClient: Client | null = null;

export function setUiClient(client: Client | null): void {
  uiClient = client;
}

export function getBotAvatarUrl(): string {
  try {
    if (uiClient?.user) {
      return uiClient.user.displayAvatarURL({ extension: "png", size: 256 }) || MIU_THEME.DEFAULT_AVATAR;
    }
  } catch {}
  return MIU_THEME.DEFAULT_AVATAR;
}

export function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "0:00";
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}

export function createProgressBar(
  currentMs: number,
  totalMs: number,
  length = 14,
  indicator = "🔘",
  line = "▬"
): string {
  if (!totalMs || totalMs <= 0) return indicator + line.repeat(Math.max(length - 1, 1));
  const progress = Math.min(Math.max(currentMs / totalMs, 0), 1);
  const progressIndex = Math.round(progress * (length - 1));
  const before = line.repeat(progressIndex);
  const after = line.repeat(Math.max(length - 1 - progressIndex, 0));
  return `${before}${indicator}${after}`;
}

export function createNowPlayingEmbed(track: AnyTrack, player: Player): EmbedBuilder {
  const durationStr = track.info.isStream ? "🔴 LIVE" : formatDuration(track.info.duration || 0);
  const currentPos = player.position || 0;
  const avatarUrl = getBotAvatarUrl();

  const bar = track.info.isStream
    ? ""
    : `\n\n\`${formatDuration(currentPos)}\` ${createProgressBar(currentPos, track.info.duration || 0, 10, "🌸", "━")} \`${durationStr}\``;

  const repeatMode = player.repeatMode ?? "off";
  let repeatText = "Mati";
  if (repeatMode === "track") repeatText = "🔂 Lagu Ini";
  else if (repeatMode === "queue") repeatText = "🔁 Antrean";

  const embed = new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({
      name: "🌸 Miu Sedang Memutar Musik ~",
      iconURL: avatarUrl,
    })
    .setTitle(track.info.title)
    .setURL(track.info.uri || "https://discord.com")
    .setDescription(`🎤 Artis: **${track.info.author}**${bar}`)
    .addFields([
      { name: "🔊 Volume", value: `\`${player.volume}%\``, inline: true },
      { name: "🔁 Ulang", value: `\`${repeatText}\``, inline: true },
      { name: "🎀 Antrean", value: `\`${player.queue.tracks.length} lagu\``, inline: true },
    ]);

  if (track.info.artworkUrl) {
    embed.setThumbnail(track.info.artworkUrl);
  } else {
    embed.setThumbnail(avatarUrl);
  }

  const requester = (track.requester as any)?.username;
  embed.setFooter({
    text: requester
      ? `Diminta oleh ${requester} • Semoga harimu menyenangkan! 🤍`
      : "Miu siap menemani harimu dengan alunan musik! 🌸",
    iconURL: avatarUrl,
  });

  return embed;
}

export function createTrackAddedEmbed(track: AnyTrack, position: number): EmbedBuilder {
  const durationStr = track.info.isStream ? "🔴 LIVE" : formatDuration(track.info.duration || 0);
  const avatarUrl = getBotAvatarUrl();

  return new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({
      name: "🌸 Lagu Ditambahkan ke Antrean ~",
      iconURL: avatarUrl,
    })
    .setTitle(track.info.title)
    .setURL(track.info.uri || "https://discord.com")
    .setDescription(`🎤 Artis: **${track.info.author}**`)
    .addFields([
      { name: "⏱️ Durasi", value: `\`${durationStr}\``, inline: true },
      { name: "📌 Posisi Antrean", value: `\`#${position}\``, inline: true },
    ])
    .setThumbnail(track.info.artworkUrl || avatarUrl)
    .setFooter({
      text: "Miu siap memutarkan untukmu! 🎀",
      iconURL: avatarUrl,
    });
}

export function createPlaylistAddedEmbed(name: string, count: number, firstTrack: AnyTrack, isTruncated = false): EmbedBuilder {
  const avatarUrl = getBotAvatarUrl();
  const desc = isTruncated
    ? `✨ Berhasil menambahkan **${count} lagu** dari **${name}** ke antrean Miu!\n*(Catatan: Halaman publik Spotify membatasi 50 lagu pertama per playlist)*`
    : `✨ Berhasil menambahkan **${count} lagu** dari **${name}** ke antrean Miu!`;

  return new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({
      name: "🎀 Playlist / Album Berhasil Dimuat ~",
      iconURL: avatarUrl,
    })
    .setTitle(name)
    .setDescription(desc)
    .addFields([
      { name: "🎵 Lagu Pertama", value: `[${firstTrack.info.title}](${firstTrack.info.uri})`, inline: false },
    ])
    .setThumbnail(firstTrack.info.artworkUrl || avatarUrl)
    .setFooter({
      text: "Miu Music Player 🌸",
      iconURL: avatarUrl,
    });
}

export function createQueueEmbed(player: Player, page = 1): EmbedBuilder {
  const avatarUrl = getBotAvatarUrl();
  const current = player.queue.current;
  const tracks = player.queue.tracks;
  const itemsPerPage = 10;
  const totalPages = Math.ceil(tracks.length / itemsPerPage) || 1;
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageTracks = tracks.slice(startIdx, startIdx + itemsPerPage);

  const totalDurationMs = tracks.reduce((acc, t) => acc + (t.info.duration || 0), 0) + (current?.info.duration || 0);

  let description = "";
  if (current) {
    description += `🌸 **Sedang Diputar:**\n▶️ [${current.info.title}](${current.info.uri}) - \`${formatDuration(current.info.duration || 0)}\`\n\n`;
  }

  if (pageTracks.length > 0) {
    description += `🎀 **Daftar Berikutnya:**\n` + pageTracks.map((t, idx) => {
      const pos = startIdx + idx + 1;
      return `\`${pos}.\` [${t.info.title}](${t.info.uri}) - \`${formatDuration(t.info.duration || 0)}\``;
    }).join("\n");
  } else {
    description += "*Antrean berikutnya masih kosong, yuk tambahkan lagu kesukaanmu! 🐇*";
  }

  return new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({
      name: "📜 Antrean Musik Miu ~",
      iconURL: avatarUrl,
    })
    .setTitle(`Daftar Putar (${tracks.length} lagu berikutnya)`)
    .setDescription(description)
    .setFooter({
      text: `Halaman ${currentPage}/${totalPages} • Total Durasi: ${formatDuration(totalDurationMs)} • Loop: ${player.repeatMode}`,
      iconURL: avatarUrl,
    });
}

export function createSuccessEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({ name: "🌸 Miu", iconURL: getBotAvatarUrl() })
    .setTitle(`✨ ${title}`)
    .setDescription(message);
}

export function createErrorEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(MIU_THEME.ERROR)
    .setAuthor({ name: "🌸 Miu", iconURL: getBotAvatarUrl() })
    .setTitle(`(｡•́︿•̀｡) ${title}`)
    .setDescription(message);
}

export function createInfoEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(MIU_THEME.PRIMARY)
    .setAuthor({ name: "🌸 Miu", iconURL: getBotAvatarUrl() })
    .setTitle(`ℹ️ ${title}`)
    .setDescription(message);
}

export function createNowPlayingComponents(player: Player, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const isPaused = player.paused;

  // Baris 1: Kontrol Pemutaran Inti (5 Tombol)
  const playPauseBtn = new ButtonBuilder()
    .setCustomId("btn_play_pause")
    .setLabel(isPaused ? "Putar" : "Jeda")
    .setEmoji(isPaused ? "▶️" : "💖")
    .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
    .setDisabled(disabled);

  const skipBtn = new ButtonBuilder()
    .setCustomId("btn_skip")
    .setLabel("Lewati")
    .setEmoji("🌸")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  let loopLabel = "Loop";
  let loopEmoji = "🔁";
  if (player.repeatMode === "track") {
    loopLabel = "Lagu";
    loopEmoji = "🔂";
  } else if (player.repeatMode === "queue") {
    loopLabel = "Antrean";
    loopEmoji = "🔁";
  }

  const loopBtn = new ButtonBuilder()
    .setCustomId("btn_loop")
    .setLabel(loopLabel)
    .setEmoji(loopEmoji)
    .setStyle(player.repeatMode !== "off" ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(disabled);

  const shuffleBtn = new ButtonBuilder()
    .setCustomId("btn_shuffle")
    .setLabel("Acak")
    .setEmoji("✨")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const stopBtn = new ButtonBuilder()
    .setCustomId("btn_stop")
    .setLabel("Stop")
    .setEmoji("🛑")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    playPauseBtn,
    skipBtn,
    loopBtn,
    shuffleBtn,
    stopBtn
  );

  // Baris 2: Utilitas Suara, Lirik, dan Web Player (5 Tombol Simetris Penuh)
  const volDownBtn = new ButtonBuilder()
    .setCustomId("btn_vol_down")
    .setLabel("Vol -")
    .setEmoji("🔉")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const volUpBtn = new ButtonBuilder()
    .setCustomId("btn_vol_up")
    .setLabel("Vol +")
    .setEmoji("🔊")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const queueBtn = new ButtonBuilder()
    .setCustomId("btn_queue")
    .setLabel("Antrean")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const lyricsBtn = new ButtonBuilder()
    .setCustomId("btn_lyrics")
    .setLabel("Lirik")
    .setEmoji("🎤")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const webPlayerBtn = new ButtonBuilder()
    .setLabel("Web Player")
    .setEmoji("🎀")
    .setStyle(ButtonStyle.Link)
    .setURL("https://miu-music-us.onrender.com/");

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    volDownBtn,
    volUpBtn,
    queueBtn,
    lyricsBtn,
    webPlayerBtn
  );

  return [row1, row2];
}

export function createQueueComponents(page: number, totalPages: number): ActionRowBuilder<ButtonBuilder>[] {
  const prevBtn = new ButtonBuilder()
    .setCustomId(`btn_queue_page_${page - 1}`)
    .setLabel("Sebelumnya")
    .setEmoji("◀️")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page <= 1);

  const nextBtn = new ButtonBuilder()
    .setCustomId(`btn_queue_page_${page + 1}`)
    .setLabel("Berikutnya")
    .setEmoji("▶️")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(page >= totalPages);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevBtn, nextBtn);
  return [row];
}


