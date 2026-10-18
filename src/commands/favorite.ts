import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember } from "discord.js";
import type { Command } from "./types.js";
import { getOrCreatePlayer, lavalink } from "../player/lavalink.js";
import { addFavoriteTrack, getFavoriteTracks, removeFavoriteTrack } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

export const favoriteCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("favorite")
    .setDescription("Kelola koleksi lagu favorit Anda")
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("Menambahkan lagu yang sedang diputar ke daftar favorit")
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("Melihat semua lagu di daftar favorit Anda")
    )
    .addSubcommand((sub) =>
      sub.setName("play").setDescription("Memutar semua lagu dari daftar favorit Anda")
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Menghapus lagu dari daftar favorit")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("ID nomor lagu favorit").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === "add") {
      const player = lavalink.getPlayer(interaction.guildId!);
      if (!player || !player.queue.current) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak Ada Musik", "Saat ini tidak ada lagu yang sedang diputar untuk difavoritkan.")],
          ephemeral: true,
        });
        return;
      }

      const current = player.queue.current;
      addFavoriteTrack(userId, current);

      await interaction.reply({
        embeds: [createSuccessEmbed("Ditambahkan ke Favorit", `❤️ Lagu **${current.info.title}** berhasil disimpan ke koleksi favorit Anda!`)],
      });
      return;
    }

    if (subcommand === "list") {
      const favorites = getFavoriteTracks(userId);
      if (favorites.length === 0) {
        await interaction.reply({
          embeds: [createErrorEmbed("Belum Ada Favorit", "Koleksi favorit Anda masih kosong. Gunakan `/favorite add` saat mendengarkan lagu.")],
          ephemeral: true,
        });
        return;
      }

      const listText = favorites
        .slice(0, 20)
        .map((f) => `\`[ID: ${f.id}]\` **${f.title}** — ${f.artist || "Unknown"}`)
        .join("\n");

      await interaction.reply({
        embeds: [createSuccessEmbed(`Koleksi Lagu Favorit Anda (${favorites.length})`, listText)],
      });
      return;
    }

    if (subcommand === "remove") {
      const id = interaction.options.getInteger("id", true);
      const success = removeFavoriteTrack(userId, id);
      if (!success) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak Ditemukan", `Lagu favorit dengan ID **${id}** tidak ditemukan.`)],
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        embeds: [createSuccessEmbed("Dihapus dari Favorit", `Lagu favorit dengan ID **${id}** berhasil dihapus.`)],
      });
      return;
    }

    if (subcommand === "play") {
      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel;
      if (!voiceChannel) {
        await interaction.reply({
          embeds: [createErrorEmbed("Tidak di Voice Channel", "Anda harus bergabung ke Voice Channel terlebih dahulu.")],
          ephemeral: true,
        });
        return;
      }

      const favorites = getFavoriteTracks(userId);
      if (favorites.length === 0) {
        await interaction.reply({
          embeds: [createErrorEmbed("Favorit Kosong", "Koleksi lagu favorit Anda masih kosong.")],
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const player = await getOrCreatePlayer(interaction.guildId!, voiceChannel.id, interaction.channelId);

      let added = 0;
      for (const f of favorites) {
        try {
          const res = await player.search({ query: f.source_url || `${f.artist} - ${f.title}` }, interaction.user);
          if (res && res.tracks.length > 0) {
            player.queue.add(res.tracks[0]);
            added++;
            if (!player.playing && !player.paused) {
              await player.play();
            }
          }
        } catch {}
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed("Memutar Koleksi Favorit", `Berhasil memuat **${added}/${favorites.length} lagu favorit** ke dalam antrean.`)],
      });
      return;
    }
  },
};
