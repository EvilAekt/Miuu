import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { lavalink } from "../player/lavalink.js";
import { createNowPlayingEmbed, createNowPlayingComponents, createErrorEmbed } from "../ui/embeds.js";

export const nowPlayingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Menampilkan informasi detail lagu yang sedang diputar"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = lavalink.getPlayer(interaction.guildId!);
    if (!player || !player.queue.current) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Musik", "Saat ini tidak ada musik yang sedang diputar.")],
        ephemeral: true,
      });
      return;
    }

    const embed = createNowPlayingEmbed(player.queue.current, player);
    const components = createNowPlayingComponents(player);
    await interaction.reply({ embeds: [embed], components });
  },
};

