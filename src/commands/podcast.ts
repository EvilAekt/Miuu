import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";
import {
  parseRssFeed,
  addPodcastFeed,
  listPodcastFeeds,
  removePodcastFeed,
} from "../podcast/podcastManager.js";

export const podcastCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("podcast")
    .setDescription("Mengelola dan memutar episode podcast dari feed RSS (PRD v5 E6)")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Menambahkan langganan feed podcast RSS baru")
        .addStringOption((opt) =>
          opt.setName("url").setDescription("URL feed RSS podcast (XML/RSS)").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Melihat daftar langganan podcast di server ini")
    )
    .addSubcommand((sub) =>
      sub
        .setName("play")
        .setDescription("Memutar episode terbaru dari podcast")
        .addStringOption((opt) =>
          opt
            .setName("feed")
            .setDescription("ID podcast atau URL feed RSS podcast")
            .setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("episode")
            .setDescription("Nomor episode (1 = terbaru, 2 = sebelumnya, dst.)")
            .setMinValue(1)
            .setMaxValue(25)
            .setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Menghapus langganan podcast")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("ID podcast yang ingin dihapus").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const feeds = listPodcastFeeds(interaction.guildId!);
      if (feeds.length === 0) {
        await interaction.reply({
          embeds: [createSuccessEmbed("Daftar Podcast", "Belum ada feed podcast yang ditambahkan. Gunakan `/podcast add <url>`.")],
          ephemeral: true,
        });
        return;
      }

      const listStr = feeds.map((f) => `• **[#${f.id}] ${f.title}**\n  🔗 \`${f.feed_url}\``).join("\n\n");
      await interaction.reply({
        embeds: [createSuccessEmbed("Langganan Podcast Server", listStr)],
      });
      return;
    }

    if (sub === "add") {
      await interaction.deferReply();
      const url = interaction.options.getString("url", true);

      try {
        const { title, episodes } = await parseRssFeed(url);
        const id = addPodcastFeed(interaction.guildId!, url, title, interaction.user.id);

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "Podcast Berhasil Ditambahkan",
              `🎙️ **${title}** (ID: #${id})\n` +
                `Berhasil memindai **${episodes.length} episode** terbaru.\nGunakan \`/podcast play feed:${id}\` untuk memutar episode terbaru!`
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Membaca Feed RSS", err?.message || "Format feed RSS tidak valid.")],
        });
      }
      return;
    }

    if (sub === "remove") {
      const id = interaction.options.getInteger("id", true);
      const deleted = removePodcastFeed(interaction.guildId!, id);

      if (deleted) {
        await interaction.reply({
          embeds: [createSuccessEmbed("Podcast Dihapus", `Langganan podcast ID #${id} berhasil dihapus.`)],
        });
      } else {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak Ditemukan", `Langganan podcast ID #${id} tidak ditemukan.`)],
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === "play") {
      const player = await getValidPlayer(interaction);
      if (!player) return;

      await interaction.deferReply();
      const feedInput = interaction.options.getString("feed", true);
      const epIndex = interaction.options.getInteger("episode") || 1;

      let feedUrl = feedInput;
      // Jika input berupa angka ID
      const feedId = parseInt(feedInput, 10);
      if (!isNaN(feedId)) {
        const savedFeeds = listPodcastFeeds(interaction.guildId!);
        const found = savedFeeds.find((f) => f.id === feedId);
        if (found) {
          feedUrl = found.feed_url;
        }
      }

      try {
        const { title, episodes } = await parseRssFeed(feedUrl);
        const targetEpisode = episodes[epIndex - 1];

        if (!targetEpisode) {
          await interaction.editReply({
            embeds: [
              createErrorEmbed(
                "Episode Tidak Tersedia",
                `Hanya ditemukan ${episodes.length} episode pada podcast ini. Pilihan episode: 1 hingga ${episodes.length}.`
              ),
            ],
          });
          return;
        }

        const res = await player.search(
          { query: targetEpisode.audioUrl },
          { id: interaction.user.id, username: interaction.user.username }
        );

        if (!res || !res.tracks.length) {
          throw new Error("Lavalink tidak dapat memuat file audio dari enclosure podcast ini.");
        }

        const track = res.tracks[0];
        track.info.title = `${targetEpisode.title} (${title})`;
        player.queue.add(track);

        if (!player.playing && !player.paused) {
          await player.play();
        }

        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              "Memutar Podcast",
              `🎙️ **${targetEpisode.title}**\nDari: *${title}* (Episode #${epIndex})\nDurasi: \`${targetEpisode.duration || "N/A"}\``
            ),
          ],
        });
      } catch (err: any) {
        await interaction.editReply({
          embeds: [createErrorEmbed("Gagal Memutar Podcast", err?.message || "Terjadi kesalahan saat memuat audio podcast.")],
        });
      }
    }
  },
};
