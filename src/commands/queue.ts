import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { createQueueEmbed, createQueueComponents, createErrorEmbed } from "../ui/embeds.js";

export const queueCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Melihat daftar antrean musik saat ini")
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Nomor halaman antrean (10 lagu per halaman)")
        .setMinValue(1)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("clean")
        .setDescription("Bersihkan antrean dari lagu duplikat atau trek rusak")
        .setRequired(false)
        .addChoices(
          { name: "Hapus Duplikasi (Duplicates)", value: "duplicates" },
          { name: "Hapus Trek Rusak (Unplayable)", value: "unplayable" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player || (!player.queue.current && player.queue.tracks.length === 0)) {
      await interaction.reply({
        embeds: [createErrorEmbed("Antrean Kosong", "Saat ini tidak ada musik yang sedang diputar atau dalam antrean.")],
        ephemeral: true,
      });
      return;
    }

    const cleanMode = interaction.options.getString("clean");
    if (cleanMode) {
      const initialCount = player.queue.tracks.length;
      let filteredTracks = [...player.queue.tracks];

      if (cleanMode === "duplicates") {
        const seen = new Set<string>();
        if (player.queue.current) {
          seen.add(player.queue.current.info.uri || player.queue.current.info.title);
        }
        filteredTracks = filteredTracks.filter((t) => {
          const key = t.info.uri || t.info.title;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      } else if (cleanMode === "unplayable") {
        filteredTracks = filteredTracks.filter((t) => {
          return !t.info.isStream && (t.info.duration || 0) > 1000;
        });
      }

      player.queue.tracks.splice(0, player.queue.tracks.length, ...filteredTracks);
      const removed = initialCount - player.queue.tracks.length;
      const { createSuccessEmbed } = await import("../ui/embeds.js");
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Sanitasi Antrean Berhasil 🧹",
            `Berhasil membersihkan **${removed} lagu** (${cleanMode === "duplicates" ? "duplikat" : "tidak valid"}) dari antrean.\nSisa antrean: **${player.queue.tracks.length} lagu**.`
          ),
        ],
      });
      return;
    }

    const page = interaction.options.getInteger("page") ?? 1;
    const totalPages = Math.ceil(player.queue.tracks.length / 10) || 1;
    const embed = createQueueEmbed(player, page);
    const components = totalPages > 1 ? createQueueComponents(page, totalPages) : [];
    await interaction.reply({ embeds: [embed], components });
  },
};
