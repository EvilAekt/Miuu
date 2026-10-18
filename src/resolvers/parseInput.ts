export type InputType =
  | { source: "spotify"; type: "track" | "album" | "playlist" | "artist" | "episode" | "unknown"; url: string; id: string }
  | { source: "youtube"; url: string; isShort: boolean }
  | { source: "bandcamp"; url: string }
  | { source: "url"; url: string }
  | { source: "search"; query: string };

export function parseInput(rawInput: string): InputType {
  const input = rawInput.trim();

  // 1. Spotify URL or URI
  const spotifyUrlRegex = /https?:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z0-9_-]+\/)?(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/i;
  const spotifyUriRegex = /spotify:(track|album|playlist|artist|episode):([a-zA-Z0-9]+)/i;

  const urlMatch = input.match(spotifyUrlRegex);
  if (urlMatch) {
    const [, type, id] = urlMatch;
    return {
      source: "spotify",
      type: type.toLowerCase() as "track" | "album" | "playlist" | "artist" | "episode",
      url: `https://open.spotify.com/${type.toLowerCase()}/${id}`,
      id,
    };
  }

  const uriMatch = input.match(spotifyUriRegex);
  if (uriMatch) {
    const [, type, id] = uriMatch;
    return {
      source: "spotify",
      type: type.toLowerCase() as "track" | "album" | "playlist" | "artist" | "episode",
      url: `https://open.spotify.com/${type.toLowerCase()}/${id}`,
      id,
    };
  }

  // 2. YouTube URL
  if (/^(https?:\/\/)?(www\.|music\.)?(youtube\.com|youtu\.be)\//i.test(input)) {
    // Convert shorts to standard video URL
    const shortsMatch = input.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
    if (shortsMatch) {
      return {
        source: "youtube",
        url: `https://www.youtube.com/watch?v=${shortsMatch[1]}`,
        isShort: true,
      };
    }

    try {
      const parsedUrl = new URL(input);
      // Strip tracking parameters
      parsedUrl.searchParams.delete("si");
      parsedUrl.searchParams.delete("feature");
      return {
        source: "youtube",
        url: parsedUrl.toString(),
        isShort: false,
      };
    } catch {
      return { source: "youtube", url: input, isShort: false };
    }
  }

  // 3. Bandcamp URL (PRD v4 E7)
  if (/^https?:\/\/[a-zA-Z0-9_-]+\.bandcamp\.com\/(track|album)\//i.test(input)) {
    return { source: "bandcamp", url: input };
  }

  // 4. Other direct URLs
  if (/^https?:\/\//i.test(input)) {
    return { source: "url", url: input };
  }

  // 4. Keyword search
  return { source: "search", query: input };
}
