// src/dj/voiceAnnouncer.ts: Virtual AI Voice DJ Host untuk Intro Lagu Otomatis

export type DjPersonality = "casual" | "hype" | "chill";

export interface DjGuildConfig {
  enabled: boolean;
  personality: DjPersonality;
  frequency: number; // Putar intro setiap N lagu (default: 3)
}

const djConfigs = new Map<string, DjGuildConfig>();
const guildTrackCounters = new Map<string, number>();

/**
 * Mengatur konfigurasi Virtual Voice DJ untuk sebuah guild.
 */
export function setDjConfig(
  guildId: string,
  config: Partial<DjGuildConfig>
): DjGuildConfig {
  const current = djConfigs.get(guildId) || {
    enabled: false,
    personality: "casual",
    frequency: 3,
  };

  const updated: DjGuildConfig = { ...current, ...config };
  djConfigs.set(guildId, updated);
  return updated;
}

/**
 * Mendapatkan konfigurasi Virtual DJ sebuah guild.
 */
export function getDjConfig(guildId: string): DjGuildConfig {
  return (
    djConfigs.get(guildId) || {
      enabled: false,
      personality: "casual",
      frequency: 3,
    }
  );
}

/**
 * Menghasilkan naskah ucapan pengantar (voice intro script) berdasarkan kepribadian DJ.
 */
export function generateDjScript(
  title: string,
  artist: string,
  requesterName?: string,
  personality: DjPersonality = "casual"
): string {
  const cleanTitle = title.slice(0, 40).replace(/[^a-zA-Z0-9\s]/g, "");
  const cleanArtist = (artist || "Unknown").slice(0, 30).replace(/[^a-zA-Z0-9\s]/g, "");
  const userGreeting = requesterName ? ` untuk ${requesterName}` : "";

  switch (personality) {
    case "hype":
      return `Yo! Naikkan volumenya! Sekarang memutar ${cleanTitle} dari ${cleanArtist}${userGreeting}!`;
    case "chill":
      return `Tarik napas dan rileks. Berikutnya, ${cleanTitle} oleh ${cleanArtist}${userGreeting}. Selamat mendengarkan.`;
    case "casual":
    default:
      return `Selanjutnya, ${cleanTitle} dari ${cleanArtist}${userGreeting}. Selamat menikmati!`;
  }
}

/**
 * Menghasilkan URL audio TTS (Google Translate TTS MP3 stream terbuka).
 */
export function getTtsAudioUrl(text: string, lang = "id"): string {
  const encoded = encodeURIComponent(text);
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encoded}`;
}

/**
 * Menilai apakah lagu ini perlu diberi intro DJ sesuai frekuensi rotasi.
 */
export function shouldAnnounceTrack(guildId: string): boolean {
  const cfg = getDjConfig(guildId);
  if (!cfg.enabled) return false;

  const currentCount = (guildTrackCounters.get(guildId) || 0) + 1;
  guildTrackCounters.set(guildId, currentCount);

  // Lagu pertama selalu diputar intro, lalu setiap N lagu
  return currentCount === 1 || currentCount % cfg.frequency === 0;
}
