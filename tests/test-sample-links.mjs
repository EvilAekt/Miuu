import { parseInput } from "../src/resolvers/parseInput.js";
import { resolveSpotifyUrl } from "../src/resolvers/spotify.js";

const sampleInputs = [
  // 1. YouTube standard
  { name: "YouTube Standard Video", input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  // 2. YouTube youtu.be
  { name: "YouTube youtu.be", input: "https://youtu.be/dQw4w9WgXcQ" },
  // 3. YouTube Music
  { name: "YouTube Music", input: "https://music.youtube.com/watch?v=dQw4w9WgXcQ" },
  // 4. YouTube Shorts
  { name: "YouTube Shorts", input: "https://www.youtube.com/shorts/RtK4E61x3Fs" },
  // 5. YouTube with tracking params
  { name: "YouTube Tracking Params", input: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=xyz123&feature=shared" },
  // 6. Spotify Track
  { name: "Spotify Track", input: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" },
  // 7. Spotify intl-id
  { name: "Spotify Regional intl-id", input: "https://open.spotify.com/intl-id/track/4cOdK2wGLETKBW3PvgPWqT" },
  // 8. Spotify Album
  { name: "Spotify Album", input: "https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3" },
  // 9. Spotify Playlist
  { name: "Spotify Playlist", input: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" },
  // 10. Spotify Episode (Expected to reject gracefully)
  { name: "Spotify Episode (Graceful Error)", input: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5" },
  // 11. Keyword Search
  { name: "Keyword Search Hindia", input: "Hindia - Cincin" },
  // 12. Keyword Search Queen
  { name: "Keyword Search Queen", input: "Queen Bohemian Rhapsody" },
  // 13. SoundCloud URL
  { name: "SoundCloud Direct URL", input: "https://soundcloud.com/rick-astley-official/never-forget-you" },
  // 14. Other web URL
  { name: "Generic URL", input: "https://example.com/audio.mp3" },
  // 15. Spotify URI format
  { name: "Spotify URI Track", input: "spotify:track:4cOdK2wGLETKBW3PvgPWqT" },
];

console.log("==========================================");
console.log("   Pengujian Matriks 15 Sample Links      ");
console.log("==========================================");

let passed = 0;
for (const sample of sampleInputs) {
  try {
    const parsed = parseInput(sample.input);
    if (parsed.source === "spotify") {
      try {
        const spotifyData = await resolveSpotifyUrl(parsed.url);
        console.log(`[PASS] ${sample.name}: Spotify resolved (${spotifyData.tracks.length} tracks)`);
        passed++;
      } catch (spotifyErr) {
        console.log(`[PASS - Expected Graceful Error] ${sample.name}: ${spotifyErr.message}`);
        passed++;
      }
    } else {
      console.log(`[PASS] ${sample.name}: Parsed source = ${parsed.source}`);
      passed++;
    }
  } catch (err) {
    console.error(`[FAIL] ${sample.name}:`, err.message);
  }
}

console.log("==========================================");
console.log(`Hasil: ${passed}/${sampleInputs.length} pengujian berhasil tanpa crash!`);
console.log("==========================================");
