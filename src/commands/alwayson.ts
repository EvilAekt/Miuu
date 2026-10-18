import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { getGuildAlwaysOn, setGuildAlwaysOn } from "../db/index.js";
import { cancelAutoLeave } from "../player/lavalink.js";
import { createSuccessEmbed } from "../ui/embeds.js";

export const alwaysOnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("247")
    .setDescription("Mengaktifkan atau menonaktifkan mode 24/7 (bot tetap berada di Voice Channel)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const currentStatus = getGuildAlwaysOn(interaction.guildId!);
    const newStatus = !currentStatus;
    setGuildAlwaysOn(interaction.guildId!, newStatus);

    if (newStatus) {
      cancelAutoLeave(interaction.guildId!);
    }

    const statusText = newStatus ? "✅ **Aktif (24/7)**" : "❌ **Nonaktif**";
    const desc = newStatus
      ? "Bot akan tetap berada di Voice Channel dan tidak akan keluar secara otomatis meskipun antrean kosong atau ruang suara sepi."
      : "Mode 24/7 dinonaktifkan. Bot akan keluar dari Voice Channel secara otomatis sesuai durasi inaktivitas normal.";

    await interaction.reply({
      embeds: [createSuccessEmbed(`Mode 24/7 Voice Channel: ${statusText}`, desc)],
    });
  },
};
