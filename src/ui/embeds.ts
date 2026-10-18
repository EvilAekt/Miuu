import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { Track, UnresolvedTrack, Player } from "lavalink-client";

export type AnyTrack = Track | UnresolvedTrack;

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

export function createProgressBar(currentMs: number, totalMs: number, length = 14): string {
  if (!totalMs || totalMs <= 0) return "🔘" + "▬".repeat(length - 1);
  const progress = Math.min(Math.max(currentMs / totalMs, 0), 1);
  const progressIndex = Math.round(progress * (length - 1));
  const before = "▬".repeat(progressIndex);
  const after = "▬".repeat(length - 1 - progressIndex);
  return `${before}🔘${after}`;
}

export function createNowPlayingEmbed(track: AnyTrack, player: Player): EmbedBuilder {
  const durationStr = track.info.isStream ? "🔴 LIVE" : formatDuration(track.info.duration || 0);
  const currentPos = player.position || 0;
  const bar = track.info.isStream ? "" : `\n\n${createProgressBar(currentPos, track.info.duration || 0)}\n\`${formatDuration(currentPos)} / ${durationStr}\``;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: "Sedang Memutar Musik", iconURL: "https://cdn.discordapp.com/emojis/858682977464975370.gif" })
    .setTitle(track.info.title)
    .setURL(track.info.uri || "https://discord.com")
    .setDescription(`Oleh **${track.info.author}**${bar}`)
    .addFields([
      { name: "Volume", value: `${player.volume}%`, inline: true },
      { name: "Loop Mode", value: `${(player.repeatMode ?? "off").toUpperCase()}`, inline: true },
      { name: "Sisa Antrean", value: `${player.queue.tracks.length} lagu`, inline: true },
    ]);

  if (track.info.artworkUrl) {
    embed.setThumbnail(track.info.artworkUrl);
  }

  const requester = (track.requester as any)?.username;
  if (requester) {
    embed.setFooter({ text: `Diminta oleh ${requester}` });
  }

  return embed;
}

export function createTrackAddedEmbed(track: AnyTrack, position: number): EmbedBuilder {
  const durationStr = track.info.isStream ? "LIVE" : formatDuration(track.info.duration || 0);
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle("Ditambahkan ke Antrean")
    .setDescription(`[${track.info.title}](${track.info.uri})\nOleh **${track.info.author}**`)
    .addFields([
      { name: "Durasi", value: durationStr, inline: true },
      { name: "Posisi Antrean", value: `#${position}`, inline: true },
    ])
    .setThumbnail(track.info.artworkUrl || null);
}

export function createPlaylistAddedEmbed(name: string, count: number, firstTrack: AnyTrack, isTruncated = false): EmbedBuilder {
  const desc = isTruncated
    ? `Berhasil menambahkan **${count} lagu** dari **${name}**.\n*(Catatan: Halaman embed publik Spotify membatasi 50 lagu pertama per playlist)*`
    : `Berhasil menambahkan **${count} lagu** dari **${name}**.`;

  return new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle("Playlist / Album Ditambahkan")
    .setDescription(desc)
    .addFields([
      { name: "Lagu Pertama", value: `[${firstTrack.info.title}](${firstTrack.info.uri})`, inline: false },
    ])
    .setThumbnail(firstTrack.info.artworkUrl || null);
}

export function createQueueEmbed(player: Player, page = 1): EmbedBuilder {
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
    description += `**Sedang Diputar:**\n▶️ [${current.info.title}](${current.info.uri}) - \`${formatDuration(current.info.duration || 0)}\`\n\n`;
  }

  if (pageTracks.length > 0) {
    description += `**Daftar Berikutnya:**\n` + pageTracks.map((t, idx) => {
      const pos = startIdx + idx + 1;
      return `\`${pos}.\` [${t.info.title}](${t.info.uri}) - \`${formatDuration(t.info.duration || 0)}\``;
    }).join("\n");
  } else {
    description += "*Antrean berikutnya kosong.*";
  }

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Antrean Musik (${tracks.length} lagu berikutnya)`)
    .setDescription(description)
    .setFooter({
      text: `Halaman ${currentPage}/${totalPages} | Total Durasi: ${formatDuration(totalDurationMs)} | Loop: ${player.repeatMode}`,
    });
}

export function createSuccessEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(title)
    .setDescription(message);
}

export function createErrorEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`⚠️ ${title}`)
    .setDescription(message);
}

export function createInfoEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(message);
}

export function createNowPlayingComponents(player: Player, disabled = false): ActionRowBuilder<ButtonBuilder>[] {
  const isPaused = player.paused;

  const playPauseBtn = new ButtonBuilder()
    .setCustomId("btn_play_pause")
    .setLabel(isPaused ? "Resume" : "Pause")
    .setEmoji(isPaused ? "▶️" : "⏸️")
    .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
    .setDisabled(disabled);

  const skipBtn = new ButtonBuilder()
    .setCustomId("btn_skip")
    .setLabel("Skip")
    .setEmoji("⏭️")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  let loopLabel = "Loop: Off";
  let loopEmoji = "➡️";
  if (player.repeatMode === "track") {
    loopLabel = "Loop: Track";
    loopEmoji = "🔂";
  } else if (player.repeatMode === "queue") {
    loopLabel = "Loop: Queue";
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
    .setLabel("Shuffle")
    .setEmoji("🔀")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const stopBtn = new ButtonBuilder()
    .setCustomId("btn_stop")
    .setLabel("Stop")
    .setEmoji("⏹️")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    playPauseBtn,
    skipBtn,
    loopBtn,
    shuffleBtn,
    stopBtn
  );

  const volDownBtn = new ButtonBuilder()
    .setCustomId("btn_vol_down")
    .setLabel("-10%")
    .setEmoji("🔉")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const volUpBtn = new ButtonBuilder()
    .setCustomId("btn_vol_up")
    .setLabel("+10%")
    .setEmoji("🔊")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const queueBtn = new ButtonBuilder()
    .setCustomId("btn_queue")
    .setLabel("Queue")
    .setEmoji("📜")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    volDownBtn,
    volUpBtn,
    queueBtn
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

