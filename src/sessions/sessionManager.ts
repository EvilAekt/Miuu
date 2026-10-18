import { recordDemandEvent } from "../db/index.js";

export interface ActiveSession {
  sessionId: string;
  guildId: string;
  voiceChannelId: string;
  textChannelId: string;
  startedAt: number;
}

const activeSessions = new Map<string, ActiveSession>();
export const MAX_CONCURRENT_SESSIONS = 3;

export function getSessionId(guildId: string, voiceChannelId: string): string {
  return `${guildId}:${voiceChannelId}`;
}

export function registerSession(
  guildId: string,
  voiceChannelId: string,
  textChannelId: string,
  userId?: string
): { allowed: boolean; reason?: string; session?: ActiveSession } {
  const sessionId = getSessionId(guildId, voiceChannelId);

  // Jika sesi sudah ada untuk VC ini, izinkan langsung
  const existing = activeSessions.get(sessionId);
  if (existing) {
    existing.textChannelId = textChannelId;
    return { allowed: true, session: existing };
  }

  // Periksa apakah guild ini sudah memiliki sesi di VC lain (1 bot per guild limit)
  for (const s of activeSessions.values()) {
    if (s.guildId === guildId && s.voiceChannelId !== voiceChannelId) {
      recordDemandEvent("busy_rejected", guildId, userId, `Bot sedang aktif di VC lain: ${s.voiceChannelId}`);
      return {
        allowed: false,
        reason: `Bot saat ini sedang aktif memutar musik di Voice Channel lain (<#${s.voiceChannelId}>). Silakan bergabung ke sana atau tunggu hingga selesai.`,
      };
    }
  }

  // Periksa batas konkurensi global (PRD v3 E1: max_concurrent_sessions = 3)
  if (activeSessions.size >= MAX_CONCURRENT_SESSIONS) {
    recordDemandEvent("busy_rejected", guildId, userId, `Batas maksimal konkurensi ${MAX_CONCURRENT_SESSIONS} sesi tercapai`);
    return {
      allowed: false,
      reason: `Batas maksimal pemutaran bersamaan (${MAX_CONCURRENT_SESSIONS} sesi) sedang penuh. Silakan coba beberapa saat lagi.`,
    };
  }

  const session: ActiveSession = {
    sessionId,
    guildId,
    voiceChannelId,
    textChannelId,
    startedAt: Date.now(),
  };

  activeSessions.set(sessionId, session);
  return { allowed: true, session };
}

export function unregisterSession(guildId: string, voiceChannelId?: string): void {
  if (voiceChannelId) {
    const sessionId = getSessionId(guildId, voiceChannelId);
    activeSessions.delete(sessionId);
  } else {
    for (const [id, s] of activeSessions.entries()) {
      if (s.guildId === guildId) {
        activeSessions.delete(id);
      }
    }
  }
}

export function getActiveSession(guildId: string, voiceChannelId: string): ActiveSession | undefined {
  return activeSessions.get(getSessionId(guildId, voiceChannelId));
}

export function getAllActiveSessions(): ActiveSession[] {
  return Array.from(activeSessions.values());
}
