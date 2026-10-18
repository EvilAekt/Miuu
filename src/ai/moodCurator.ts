// src/ai/moodCurator.ts: Kurasi Playlist dan Analisis Lirik menggunakan Google Gemini API

export interface CuratedTrack {
  title: string;
  artist: string;
  reason?: string;
}

/**
 * Menghasilkan daftar rekomendasi lagu berdasarkan deskripsi suasana hati / tema.
 */
export async function generateMoodPlaylist(
  prompt: string,
  count = 5
): Promise<{ tracks: CuratedTrack[]; source: "gemini" | "heuristic" }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const systemInstruction = `You are a world-class music curator and DJ. When the user gives you a mood, vibe, activity, or description, recommend exactly ${count} real, high-quality, popular or acclaimed songs that match the feeling. You must reply strictly with a JSON array where each object has "title" (string), "artist" (string), and "reason" (short string in Indonesian explaining why it fits). Do not include markdown code block backticks if possible, only raw JSON.`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction}\n\nUser Prompt: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const cleaned = rawText.replace(/```json/gi, "").replace(/```/gi, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const tracks: CuratedTrack[] = parsed.slice(0, count).map((item) => ({
              title: String(item.title || "Unknown Title"),
              artist: String(item.artist || "Unknown Artist"),
              reason: item.reason ? String(item.reason) : undefined,
            }));
            return { tracks, source: "gemini" };
          }
        }
      } else {
        console.warn(`[GeminiAPI] HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.warn("[GeminiAPI] Error saat menghubungi Google Gemini API, beralih ke kurasi lokal:", err);
    }
  }

  // Heuristic Fallback bila API key belum diisi atau offline
  const fallbackList: Record<string, CuratedTrack[]> = {
    chill: [
      { title: "Weightless", artist: "Marconi Union", reason: "Meredakan stres dan menenangkan pikiran" },
      { title: "Sunset Lover", artist: "Petit Biscuit", reason: "Melodi elektronik hangat nan santai" },
      { title: "Lofi Rain", artist: "ChilledCow / Lofi Girl", reason: "Irama lofi klasik untuk ketenangan" },
      { title: "Resonance", artist: "HOME", reason: "Nuansa synthwave nostalgia yang damai" },
      { title: "Daylight", artist: "Taylor Swift", reason: "Balada lembut yang menyejukkan" },
    ],
    coding: [
      { title: "Subwoofer Lullaby", artist: "C418", reason: "Fokus mendalam dan minim distraksi vokal" },
      { title: "Around the World", artist: "Daft Punk", reason: "Ketukan ritmis konsisten untuk alur kerja" },
      { title: "Midnight City", artist: "M83", reason: "Energi synth untuk memompa produktivitas" },
      { title: "Teardrop", artist: "Massive Attack", reason: "Trip-hop atmosferik untuk konsentrasi" },
      { title: "Strobe", artist: "deadmau5", reason: "Progresi melodi bertahap untuk *deep focus*" },
    ],
    semangat: [
      { title: "Eye of the Tiger", artist: "Survivor", reason: "Lagu pembangkit motivasi legendaris" },
      { title: "Stronger", artist: "Kanye West", reason: "Beat elektronik dinamis berenergi tinggi" },
      { title: "Can't Hold Us", artist: "Macklemore", reason: "Tempo cepat dan lirik yang memompa adrenalis" },
      { title: "Believer", artist: "Imagine Dragons", reason: "Irama drum bertenaga kuat" },
      { title: "Don't Stop Me Now", artist: "Queen", reason: "Nuansa ceria dan penuh semangat positif" },
    ],
  };

  const lower = prompt.toLowerCase();
  let selected = fallbackList.chill;
  if (lower.includes("code") || lower.includes("coding") || lower.includes("kerja") || lower.includes("fokus")) {
    selected = fallbackList.coding;
  } else if (lower.includes("semangat") || lower.includes("gym") || lower.includes("olahraga") || lower.includes("energi")) {
    selected = fallbackList.semangat;
  }

  return { tracks: selected.slice(0, count), source: "heuristic" };
}

/**
 * Menghasilkan analisis atau penjelasan lirik lagu dengan AI.
 */
export async function explainLyricsWithAI(
  title: string,
  artist: string,
  lyrics: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Lagu **"${title}"** oleh **${artist}** memiliki komposisi lirik puitis. Untuk mendapatkan analisis mendalam dan tafsir makna bait secara otomatis menggunakan Google Gemini AI, silakan tambahkan \`GEMINI_API_KEY\` pada file \`.env\` Anda.`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const truncatedLyrics = lyrics.slice(0, 2000); // Batasi panjang lirik agar token efisien

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Jelaskan secara artistik, ringkas, dan bermakna dalam Bahasa Indonesia (maksimal 2 paragraf) tentang pesan emosional, tema sentral, dan interpretasi lirik lagu berikut:\nJudul: "${title}"\nArtis: "${artist}"\n\nLirik:\n${truncatedLyrics}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 500,
        },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (e) {
    console.warn("[GeminiAPI] Gagal menganalisis lirik:", e);
  }

  return `Lagu **"${title}"** oleh **${artist}** menghadirkan tema musikal yang mendalam dan beresonansi dengan pendengarnya. (Analisis AI sedang tidak dapat diakses saat ini).`;
}
