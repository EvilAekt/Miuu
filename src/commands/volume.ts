import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { createSuccessEmbed } from "../ui/embeds.js";
import { recordDemandEvent, setTrackVolumePref } from "../db/index.js";

export const volumeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Mengatur tingkat volume suara pemutaran musik")
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("Tingkat volume dari 1 hingga 100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("remember")
        .setDescription("Ingat volume ini khusus untuk lagu ini pada pemutaran berikutnya (PRD v5 E5)")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const level = interaction.options.getInteger("level", true);
    const remember = interaction.options.getBoolean("remember") || false;
    await player.setVolume(level);

    // PRD v5 Epic 0: Catat sinyal demand event volume_adjust jika diubah dalam 30 detik pertama
    if (player.queue.current && player.position < 30000) {
      recordDemandEvent(
        "volume_adjust",
        interaction.guildId!,
        interaction.user.id,
        `Volume disesuaikan ke ${level}% pada ${player.position}ms`
      );
    }

    let extraText = "";
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (player.queue.current) {
      const trackKey = `${player.queue.current.info.author} - ${player.queue.current.info.title}`;
      if (remember) {
        setTrackVolumePref(trackKey, level, interaction.user.id);
        extraText = `\n📌 **Preferensi Disimpan:** Lagu ini akan otomatis disetel ke **${level}%** saat diputar lagi.`;
      } else {
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`vol_remember_${level}`)
            .setLabel("📌 Ingat Volume Lagu Ini")
            .setStyle(ButtonStyle.Secondary)
        );
        components.push(row);
      }
    }

    await interaction.reply({
      embeds: [createSuccessEmbed("Volume Diubah", `🔊 Volume berhasil diatur ke **${level}%**${extraText}`)],
      components,
    });
  },
};
