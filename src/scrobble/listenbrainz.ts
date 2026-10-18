import {
  getPendingScrobbles,
  updateScrobbleStatus,
  getScrobbleAccount,
  enqueueScrobble,
} from "../db/index.js";

export interface ListenBrainzTrackMetadata {
  artist: string;
  title: string;
  album?: string;
  durationMs?: number;
}

export function queueUserScrobble(
  userId: string,
  track: ListenBrainzTrackMetadata
): void {
  const account = getScrobbleAccount(userId, "listenbrainz");
  if (!account || !account.enabled) return;

  enqueueScrobble(userId, "listenbrainz", {
    artist: track.artist,
    title: track.title,
    album: track.album,
    duration_ms: track.durationMs || 0,
    played_at: Date.now(),
  });

  // Picu proses pengiriman secara asinkron tanpa menahan proses utama
  setImmediate(() => {
    processScrobbleQueue().catch((err) =>
      console.warn("[Scrobble Queue Error]", err?.message)
    );
  });
}

export async function processScrobbleQueue(): Promise<number> {
  const pending = getPendingScrobbles(10);
  if (pending.length === 0) return 0;

  let sentCount = 0;

  for (const item of pending) {
    const account = getScrobbleAccount(item.user_id, "listenbrainz");
    if (!account || !account.token_enc) {
      updateScrobbleStatus(item.id, "failed");
      continue;
    }

    try {
      const payload = {
        listen_type: "single",
        payload: [
          {
            listened_at: Math.floor(item.played_at / 1000),
            track_metadata: {
              artist_name: item.artist,
              track_name: item.title,
              release_name: item.album || undefined,
            },
          },
        ],
      };

      const res = await fetch("https://api.listenbrainz.org/1/submit-listens", {
        method: "POST",
        headers: {
          "Authorization": `Token ${account.token_enc}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        updateScrobbleStatus(item.id, "sent");
        sentCount++;
      } else {
        console.warn(`[ListenBrainz] Gagal submit scrobble (HTTP ${res.status}):`, await res.text().catch(() => ""));
        updateScrobbleStatus(item.id, "failed");
      }
    } catch (err: any) {
      console.warn(`[ListenBrainz Network Error] ID ${item.id}:`, err?.message);
      updateScrobbleStatus(item.id, "failed");
    }
  }

  return sentCount;
}

export async function validateListenBrainzToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.listenbrainz.org/1/validate-token", {
      headers: {
        Authorization: `Token ${token.trim()}`,
      },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as any;
    return data && data.valid === true;
  } catch {
    return false;
  }
}
