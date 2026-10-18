// tests/helpers/factories.ts: Objek data factory deterministik untuk pengujian
import type { Track } from "lavalink-client";

export function makeTrack(override: Partial<Track["info"]> = {}): Track {
  const identifier = override.identifier || `yt_${Math.random().toString(36).substring(2, 9)}`;
  return {
    encoded: "fake_encoded_track_base64",
    info: {
      identifier,
      isSeekable: true,
      author: override.author || "Test Artist",
      length: override.length || 210000,
      isStream: override.isStream || false,
      position: override.position || 0,
      title: override.title || "Test Song Title",
      uri: override.uri || `https://www.youtube.com/watch?v=${identifier}`,
      artworkUrl: override.artworkUrl || "https://example.com/art.jpg",
      isrc: override.isrc || "USUM71703861",
      sourceName: override.sourceName || "youtube",
      duration: override.length || 210000,
    },
    pluginInfo: {},
    userData: {},
  } as Track;
}

export function makeUser(override: { id?: string; username?: string; bot?: boolean } = {}) {
  return {
    id: override.id || "111222333444",
    username: override.username || "TestUser",
    bot: override.bot || false,
    tag: `${override.username || "TestUser"}#0001`,
  };
}

export function makeGuild(override: { id?: string; name?: string } = {}) {
  return {
    id: override.id || "999888777666",
    name: override.name || "Test Music Server",
  };
}

export function makeSession(override: { guildId?: string; voiceChannelId?: string; textChannelId?: string; userId?: string } = {}) {
  return {
    guildId: override.guildId || "999888777666",
    voiceChannelId: override.voiceChannelId || "voice_channel_1",
    textChannelId: override.textChannelId || "text_channel_1",
    userId: override.userId || "111222333444",
    startedAt: Date.now(),
  };
}
