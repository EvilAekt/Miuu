import {
  addPodcastFeed,
  listPodcastFeeds,
  removePodcastFeed,
} from "../db/index.js";

export interface PodcastEpisode {
  title: string;
  audioUrl: string;
  duration?: string;
  pubDate?: string;
}

export async function parseRssFeed(feedUrl: string): Promise<{ title: string; episodes: PodcastEpisode[] }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "DiscordMusicBot/5.0 (PodcastFetcher)" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Server RSS mengembalikan status HTTP ${res.status}: ${res.statusText}`);
    }

    const xml = await res.text();

    // Ekstrak Judul Podcast Utama
    const feedTitleMatch = xml.match(/<channel[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const feedTitle = feedTitleMatch ? feedTitleMatch[1].trim() : "Podcast Feed";

    // Ekstrak Tiap Item / Episode
    const episodes: PodcastEpisode[] = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[0];

      // Ambil Title
      const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "Episode Tanpa Judul";

      // Ambil Enclosure URL (Audio MP3/M4A/AAC)
      const enclosureMatch = itemXml.match(/<enclosure[\s\S]*?url=["']([^"']+)["']/i);
      if (enclosureMatch && enclosureMatch[1]) {
        const audioUrl = enclosureMatch[1].trim();
        const durationMatch = itemXml.match(/<itunes:duration>([\s\S]*?)<\/itunes:duration>/i);
        const duration = durationMatch ? durationMatch[1].trim() : undefined;

        episodes.push({
          title,
          audioUrl,
          duration,
        });
      }

      if (episodes.length >= 25) break; // Batasi 25 episode terbaru
    }

    if (episodes.length === 0) {
      throw new Error("Tidak ditemukan enclosure audio yang valid pada feed RSS ini.");
    }

    return { title: feedTitle, episodes };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Koneksi timeout (10 detik) saat mengunduh feed RSS.");
    }
    throw err;
  }
}

export { addPodcastFeed, listPodcastFeeds, removePodcastFeed };
