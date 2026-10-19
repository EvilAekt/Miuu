import {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import type { AnyTrack } from "./embeds.js";
import { formatDuration, createProgressBar } from "./embeds.js";
import type { Player } from "lavalink-client";

/**
 * Membuat container Discord Components V2 untuk Now Playing
 * (PRD Section 8, 10 & 15: Migrasi Components V2)
 */
export function createNowPlayingContainer(
  track: AnyTrack,
  player: Player,
  disabled: boolean = false
): ContainerBuilder {
  const durationStr = track.info.isStream ? "🔴 LIVE" : formatDuration(track.info.duration || 0);
  const currentPos = player.position || 0;
  const bar = track.info.isStream
    ? ""
    : `\n${createProgressBar(currentPos, track.info.duration || 0)}\n\`${formatDuration(currentPos)} / ${durationStr}\``;

  const titleLink = track.info.uri ? `[${track.info.title}](${track.info.uri})` : `**${track.info.title}**`;
  const requester = (track.requester as any)?.username || "User";

  const contentText =
    `🎵 **SEDANG MEMUTAR MUSIK**\n\n` +
    `📌 ${titleLink}\n` +
    `👤 Artis: **${track.info.author}**\n` +
    `${bar}\n\n` +
    `🔊 Volume: **${player.volume}%** | 🔁 Loop: **${(player.repeatMode ?? "off").toUpperCase()}** | 📜 Antrean: **${player.queue.tracks.length} lagu**\n` +
    `🙋 Diminta oleh: **${requester}**`;

  const container = new ContainerBuilder()
    .setAccentColor(0x5865f2)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(contentText));

  container.addSeparatorComponents(new SeparatorBuilder());

  const isPaused = player.paused;

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_play_pause")
      .setLabel(isPaused ? "Putar" : "Jeda")
      .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Primary)
      .setEmoji(isPaused ? "▶️" : "💖")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_skip")
      .setLabel("Lewati")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🌸")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_loop")
      .setLabel(player.repeatMode === "track" ? "Lagu" : player.repeatMode === "queue" ? "Antrean" : "Loop")
      .setStyle(player.repeatMode !== "off" ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setEmoji(player.repeatMode === "track" ? "🔂" : "🔁")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_shuffle")
      .setLabel("Acak")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✨")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_stop")
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🛑")
      .setDisabled(disabled)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("btn_vol_down")
      .setLabel("Vol -")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔉")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_vol_up")
      .setLabel("Vol +")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🔊")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_queue")
      .setLabel("Antrean")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📜")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId("btn_lyrics")
      .setLabel("Lirik")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("🎤")
      .setDisabled(disabled),
    new ButtonBuilder()
      .setLabel("Web Player")
      .setStyle(ButtonStyle.Link)
      .setEmoji("🎀")
      .setURL("https://miu-music-us.onrender.com/")
  );

  container.addActionRowComponents(row1, row2);
  return container;
}

export function createNowPlayingPayloadV2(track: AnyTrack, player: Player, disabled: boolean = false) {
  const container = createNowPlayingContainer(track, player, disabled);
  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  };
}
