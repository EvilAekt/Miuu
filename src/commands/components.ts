import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "./types.js";
import { getGuildUiMode, setGuildUiMode } from "../db/index.js";
import { createSuccessEmbed } from "../ui/embeds.js";

export const componentsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("components")
    .setDescription("Pilih gaya antarmuka pesan Now Playing (Classic Embeds atau Components V2)")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Mode tampilan antarmuka")
        .setRequired(false)
        .addChoices(
          { name: "Classic (Embeds + ActionRow Buttons)", value: "classic" },
          { name: "Components V2 (Modern Container Layout)", value: "v2" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId!;
    const chosenMode = interaction.options.getString("mode") as "classic" | "v2" | null;

    if (!chosenMode) {
      const current = getGuildUiMode(guildId);
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Pengaturan Tampilan UI",
            `Mode tampilan Now Playing saat ini: **${current.toUpperCase()}**.\n\n` +
              `• **Classic**: Format standar Discord Embed dengan tombol aksi interaktif.\n` +
              `• **Components V2**: Format modern Container dengan batas aksen warna dan integrasi native Discord.\n\n` +
              `Gunakan \`/components mode: <classic|v2>\` untuk mengubah.`
          ),
        ],
      });
      return;
    }

    setGuildUiMode(guildId, chosenMode);

    const desc =
      chosenMode === "v2"
        ? "✨ Pesan Now Playing berikutnya akan menggunakan **Discord Components V2 Container Layout**."
        : "📜 Pesan Now Playing berikutnya akan menggunakan format **Classic Embeds**.";

    await interaction.reply({
      embeds: [createSuccessEmbed(`Mode Tampilan Diubah: ${chosenMode.toUpperCase()}`, desc)],
    });
  },
};
