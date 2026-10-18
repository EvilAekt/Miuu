import { SlashCommandBuilder, type ChatInputCommandInteraction, type GuildMember, PermissionFlagsBits } from "discord.js";
import type { Command } from "./types.js";
import { getValidPlayer } from "./utils.js";
import { getGuildSettingsExtended } from "../db/index.js";
import { createSuccessEmbed, createErrorEmbed } from "../ui/embeds.js";

// Penyimpanan vote skip per track URI: Map<trackUri, Set<userId>>
const skipVotes = new Map<string, Set<string>>();

export const skipCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Melewati lagu yang sedang diputar ke lagu berikutnya (dengan vote-skip jika ramai)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const player = await getValidPlayer(interaction);
    if (!player) return;

    const currentTrack = player.queue.current;
    if (!currentTrack) {
      await interaction.reply({
        embeds: [createErrorEmbed("Tidak Ada Lagu", "Tidak ada lagu yang sedang diputar untuk dilewati.")],
        ephemeral: true,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    const settings = getGuildSettingsExtended(interaction.guildId!);

    // Hitung jumlah pendengar manusia di Voice Channel
    const listeners = voiceChannel ? voiceChannel.members.filter((m) => !m.user.bot) : null;
    const listenerCount = listeners ? listeners.size : 1;

    // Cek apakah user adalah peminta lagu, DJ, atau Admin
    const isRequester = (currentTrack.requester as any)?.id === interaction.user.id;
    const hasDjRole = settings.dj_role_id ? member.roles.cache.has(settings.dj_role_id) : false;
    const isAdmin = member.permissions.has(PermissionFlagsBits.ManageGuild);

    // Jika pendengar <= 2 atau user adalah DJ / Requester / Admin: Skip langsung tanpa vote
    if (listenerCount <= 2 || isRequester || hasDjRole || isAdmin) {
      const trackUri = currentTrack.info.uri || currentTrack.info.title;
      skipVotes.delete(trackUri);
      await player.skip();
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Lagu Dilewati",
            `⏭️ Melewati: **${currentTrack.info.title}**${isRequester ? " *(Peminta lagu)*" : hasDjRole ? " *(DJ Role)*" : ""}`
          ),
        ],
      });
      return;
    }

    // Jika pendengar ramai (> 2), jalankan sistem voting (PRD v3 E1)
    const trackKey = currentTrack.info.uri || currentTrack.info.title;
    let votes = skipVotes.get(trackKey);
    if (!votes) {
      votes = new Set<string>();
      skipVotes.set(trackKey, votes);
    }

    votes.add(interaction.user.id);

    const neededVotes = Math.ceil(listenerCount * settings.vote_skip_ratio);

    if (votes.size >= neededVotes) {
      skipVotes.delete(trackKey);
      await player.skip();
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Vote Skip Berhasil!",
            `🗳️ Melewati lagu **${currentTrack.info.title}** setelah mencapai **${votes.size}/${neededVotes} vote** dari pendengar!`
          ),
        ],
      });
    } else {
      await interaction.reply({
        embeds: [
          createSuccessEmbed(
            "Vote Skip Dicatat",
            `🗳️ <@${interaction.user.id}> memberikan vote untuk melewati lagu ini.\n` +
              `Progress: **${votes.size}/${neededVotes} vote** dibutuhkan untuk melewati.`
          ),
        ],
      });
    }
  },
};
