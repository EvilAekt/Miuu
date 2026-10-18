// src/quiz/quizManager.ts: Mesin Permainan Kuis Tebak Lagu Interaktif (Music Quiz Game)
import { db } from "../db/index.js";

export interface QuizQuestion {
  trackTitle: string;
  artist: string;
  uri?: string;
  options: string[]; // 4 pilihan judul lagu
  correctIndex: number;
}

export interface QuizSession {
  guildId: string;
  totalRounds: number;
  currentRound: number;
  currentQuestion: QuizQuestion | null;
  scores: Map<string, number>; // userId -> score
  answeredUsers: Set<string>;
  active: boolean;
}

const activeQuizSessions = new Map<string, QuizSession>();

// Bank lagu pop & ikonik default sebagai bank decoy
const DEFAULT_SONG_BANK = [
  { title: "Daylight", artist: "Taylor Swift" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
  { title: "Levitating", artist: "Dua Lipa" },
  { title: "Someone You Loved", artist: "Lewis Capaldi" },
  { title: "As It Was", artist: "Harry Styles" },
  { title: "Hati-Hati di Jalan", artist: "Tulus" },
  { title: "Komang", artist: "Raim Laode" },
  { title: "Sial", artist: "Mahalini" },
  { title: "Jiwa yang Bersedih", artist: "Ghea Indrawari" },
  { title: "Tak Ingin Usai", artist: "Keisya Levronka" },
];

/**
 * Mengambil bank lagu dari database history atau fallback bawaan.
 */
function getSongPool(guildId: string): Array<{ title: string; artist: string }> {
  try {
    const rows = db
      .prepare(`SELECT DISTINCT title, artist FROM history WHERE guild_id = ? LIMIT 50`)
      .all(guildId) as Array<{ title: string; artist: string }>;
    if (rows && rows.length >= 4) {
      return rows;
    }
  } catch {}
  return DEFAULT_SONG_BANK;
}

/**
 * Mengacak array secara in-place (Fisher-Yates).
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Menghasilkan satu pertanyaan kuis tebak lagu dengan 4 pilihan ganda.
 */
export function generateQuestion(guildId: string): QuizQuestion {
  const pool = getSongPool(guildId);
  const shuffled = shuffle(pool);

  const target = shuffled[0];
  const decoys = shuffled.slice(1, 4).map((s) => s.title);

  // Buat 4 opsi pilihan ganda dan acak posisinya
  const options = shuffle([target.title, ...decoys]);
  const correctIndex = options.indexOf(target.title);

  return {
    trackTitle: target.title,
    artist: target.artist,
    options,
    correctIndex,
  };
}

/**
 * Memulai sesi kuis baru di guild.
 */
export function startQuiz(guildId: string, totalRounds = 5): QuizSession {
  const session: QuizSession = {
    guildId,
    totalRounds,
    currentRound: 1,
    currentQuestion: generateQuestion(guildId),
    scores: new Map(),
    answeredUsers: new Set(),
    active: true,
  };

  activeQuizSessions.set(guildId, session);
  return session;
}

/**
 * Mendapatkan sesi kuis aktif di guild.
 */
export function getQuizSession(guildId: string): QuizSession | null {
  const session = activeQuizSessions.get(guildId);
  return session && session.active ? session : null;
}

/**
 * Menilai tebakan pengguna untuk ronde saat ini.
 */
export function submitAnswer(
  guildId: string,
  userId: string,
  optionIndex: number
): { correct: boolean; isFirst: boolean; currentScore: number } {
  const session = getQuizSession(guildId);
  if (!session || !session.currentQuestion) {
    throw new Error("Tidak ada sesi kuis yang aktif.");
  }

  const isFirst = !session.answeredUsers.has(userId);
  session.answeredUsers.add(userId);

  const correct = optionIndex === session.currentQuestion.correctIndex;
  let currentScore = session.scores.get(userId) || 0;

  if (correct && isFirst) {
    currentScore += 10;
    session.scores.set(userId, currentScore);
  }

  return { correct, isFirst, currentScore };
}

/**
 * Melangkah ke ronde berikutnya atau mengakhiri kuis jika sudah selesai.
 */
export function nextRound(guildId: string): { finished: boolean; session: QuizSession } {
  const session = getQuizSession(guildId);
  if (!session) throw new Error("Sesi kuis tidak ditemukan.");

  if (session.currentRound >= session.totalRounds) {
    session.active = false;
    return { finished: true, session };
  }

  session.currentRound++;
  session.currentQuestion = generateQuestion(guildId);
  session.answeredUsers.clear();
  return { finished: false, session };
}

/**
 * Menghentikan sesi kuis secara manual.
 */
export function stopQuiz(guildId: string): boolean {
  const session = activeQuizSessions.get(guildId);
  if (!session || !session.active) return false;
  session.active = false;
  activeQuizSessions.delete(guildId);
  return true;
}
