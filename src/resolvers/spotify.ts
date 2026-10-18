import spotifyUrlInfo from "spotify-url-info";

const { getDetails } = (spotifyUrlInfo as any)(fetch);

export interface ResolvedSpotifyItem {
  title: string;
  artist: string;
  durationMs: number;
  uri?: string;
}

export interface SpotifyResolutionResult {
  type: "track" | "album" | "playlist" | "episode";
  name: string;
  thumbnail?: string;
  tracks: ResolvedSpotifyItem[];
  isTruncated: boolean;
}

export async function resolveSpotifyUrl(url: string): Promise<SpotifyResolutionResult> {
  const details = await getDetails(url);
  const type = details.preview?.type;

  if (type === "artist") {
    throw new Error("Link artist Spotify saat ini belum didukung. Silakan gunakan link track, album, atau playlist.");
  }

  const tracks: ResolvedSpotifyItem[] = (details.tracks ?? []).map((t: any) => ({
    title: t.name ?? details.preview?.title ?? "Unknown Track",
    artist: t.artist ?? details.preview?.artist ?? "Unknown Artist",
    durationMs: t.duration ?? t.duration_ms ?? 0,
    uri: t.uri,
  }));

  if (tracks.length === 0 && details.preview?.title) {
    tracks.push({
      title: details.preview.title,
      artist: details.preview.artist ?? "Unknown Artist",
      durationMs: 0,
      uri: details.preview.uri,
    });
  }

  if (tracks.length === 0) {
    throw new Error("Tidak dapat membaca data lagu dari link Spotify ini.");
  }

  // Spotify embed truncates playlists at 50 tracks
  const isTruncated = type === "playlist" && tracks.length === 50;

  return {
    type: (type as "track" | "album" | "playlist" | "episode") || "track",
    name: details.preview?.title ?? "Spotify Item",
    thumbnail: details.preview?.image,
    tracks,
    isTruncated,
  };
}
