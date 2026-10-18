// src/ai/intentParser.ts: Parser Instruksi Bahasa Alami Multi-Tindakan dengan Gemini AI & Heuristic Fallback

export interface ParsedMusicIntent {
  playQuery?: string;
  volume?: number;
  enable8d?: boolean;
  filter?: string;
  sleeptimerMinutes?: number;
  summary: string;
}

/**
 * Mengurai instruksi bahasa alami menjadi rangkaian aksi bot musik terstruktur.
 */
export async function parseNaturalIntent(prompt: string): Promise<ParsedMusicIntent> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const systemInstruction = `You are an AI natural language intent parser for a Discord music bot.
Parse the user's natural language request into a JSON object with:
- "playQuery": string (the song or search query to play, if mentioned, otherwise null)
- "volume": number (integer between 0 and 150, if mentioned, otherwise null)
- "enable8d": boolean (true if user asks for 8d/spatial audio, false if user asks to turn off 8d, otherwise null)
- "filter": string ("bassboost_medium", "nightcore", "vaporwave", or null)
- "sleeptimerMinutes": number (minutes for sleep timer, if mentioned, otherwise null)
- "summary": string (short description in Indonesian of what actions were detected)
Return strictly valid JSON only.`;

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
            temperature: 0.2,
            maxOutputTokens: 300,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleaned = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
          const parsed = JSON.parse(cleaned);
          return {
            playQuery: parsed.playQuery || undefined,
            volume: typeof parsed.volume === "number" ? parsed.volume : undefined,
            enable8d: typeof parsed.enable8d === "boolean" ? parsed.enable8d : undefined,
            filter: parsed.filter || undefined,
            sleeptimerMinutes: typeof parsed.sleeptimerMinutes === "number" ? parsed.sleeptimerMinutes : undefined,
            summary: parsed.summary || "Instruksi berhasil diproses oleh Gemini AI.",
          };
        }
      }
    } catch (e) {
      console.warn("[IntentParser] Gemini API gagal, beralih ke regex heuristic parser:", e);
    }
  }

  // Heuristic Regex Fallback Parser
  const result: ParsedMusicIntent = {
    summary: "Instruksi diproses via Smart Heuristic Parser.",
  };

  const lower = prompt.toLowerCase();

  // 1. Deteksi Volume
  const volMatch = lower.match(/volume\s*(ke|menjadi|=)?\s*(\d+)/i);
  if (volMatch && volMatch[2]) {
    const vol = parseInt(volMatch[2], 10);
    if (!isNaN(vol)) result.volume = Math.min(Math.max(vol, 0), 150);
  }

  // 2. Deteksi 8D Audio
  if (lower.includes("8d") || lower.includes("spasial") || lower.includes("spatial")) {
    result.enable8d = !lower.includes("matikan") && !lower.includes("nonaktif");
  }

  // 3. Deteksi Filter
  if (lower.includes("bassboost") || lower.includes("bass boost") || lower.includes("jedag jedug")) {
    result.filter = "bassboost_medium";
  } else if (lower.includes("nightcore")) {
    result.filter = "nightcore";
  } else if (lower.includes("vaporwave") || lower.includes("slowed")) {
    result.filter = "vaporwave";
  }

  // 4. Deteksi Sleep Timer
  const sleepMatch = lower.match(/(tidur|sleep|timer)\s*(\d+)\s*(menit|min)?/i);
  if (sleepMatch && sleepMatch[2]) {
    const mins = parseInt(sleepMatch[2], 10);
    if (!isNaN(mins) && mins > 0) result.sleeptimerMinutes = mins;
  }

  // 5. Deteksi Lagu / Play Query
  const playMatch = lower.match(/(putar|play|setel|mainkan)\s+([^,]+)/i);
  if (playMatch && playMatch[2]) {
    let clean = playMatch[2]
      .replace(/(dan\s+)?(volume|vol)\s*(ke|menjadi|=)?\s*\d+.*/i, "")
      .replace(/(dan\s+)?(naikkan|turunkan|atur|set)\s+(volume|vol).*/i, "")
      .replace(/(dan\s+)?(nyalakan|aktifkan|matikan|nonaktifkan)?\s*(8d|spasial|spatial).*/i, "")
      .replace(/(dan\s+)?(bassboost|nightcore|vaporwave).*/i, "")
      .replace(/(dan\s+)?(tidur|sleep|timer)\s*\d+.*/i, "")
      .replace(/lalu\s+.*/i, "")
      .trim();
    if (clean.length > 0) {
      result.playQuery = clean;
    }
  } else if (!result.volume && !result.enable8d && !result.sleeptimerMinutes) {
    result.playQuery = prompt.trim();
  }

  return result;
}
