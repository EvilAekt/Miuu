import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { cancelAutoLeave } from "../player/lavalink.js";
import { stopRadio } from "../recommend/radio.js";
import { createSuccessEmbed } from "../ui/embeds.js";

export const stopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Menghentikan musik, mengosongkan antrean, dan keluar dari Voice Channel"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    stopRadio(player.guildId);
    cancelAutoLeave(player.guildId);
    player.queue.tracks.splice(0, player.queue.tracks.length);
    await player.destroy("Command /stop dipanggil");

    await interaction.reply({
      embeds: [createSuccessEmbed("Musik Dihentikan", "⏹️ Pemutaran telah dihentikan, antrean dikosongkan, dan bot telah keluar dari Voice Channel.")],
    });
  },
};
