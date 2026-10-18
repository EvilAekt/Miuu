// src/timer/sleepTimerManager.ts: Pengelola Sleep Timer dengan Smooth Fade-Out per Guild

export interface SleepTimerSession {
  guildId: string;
  durationMinutes: number;
  endsAt: Date;
  timerHandle: NodeJS.Timeout;
  fadeStartTimeout?: NodeJS.Timeout;
  fadeIntervalHandle?: NodeJS.Timeout;
  initialVolume: number;
  setVolume: (vol: number) => Promise<unknown> | unknown;
}

const activeTimers = new Map<string, SleepTimerSession>();

/**
 * Memulai Sleep Timer untuk sebuah guild.
 * @param guildId ID Guild Discord
 * @param durationMinutes Durasi tidur dalam menit
 * @param getCurrentVolume Callback untuk mendapatkan volume awal
 * @param setVolume Callback untuk mengubah volume Lavalink
 * @param onFinish Callback saat timer selesai (stop player & leave channel)
 */
export function startSleepTimer(
  guildId: string,
  durationMinutes: number,
  getCurrentVolume: () => number,
  setVolume: (vol: number) => Promise<unknown> | unknown,
  onFinish: () => Promise<unknown> | unknown
): { endsAt: Date; durationMinutes: number } {
  // Batalkan timer aktif jika sudah ada
  cancelSleepTimer(guildId);

  const durationMs = durationMinutes * 60 * 1000;
  const endsAt = new Date(Date.now() + durationMs);
  const initialVolume = getCurrentVolume() || 100;

  // Fase fade-out berlangsung pada 30 detik terakhir (atau 20% jika durasi < 2.5 menit)
  const fadeDurationMs = Math.min(30 * 1000, durationMs * 0.2);
  const fadeStartDelayMs = Math.max(0, durationMs - fadeDurationMs);

  let fadeIntervalHandle: NodeJS.Timeout | undefined;

  // Jadwalkan fade-out bertahap
  const fadeStartTimeout = setTimeout(() => {
    const fadeSteps = 5;
    const stepIntervalMs = fadeDurationMs / fadeSteps;
    let currentStep = 0;

    fadeIntervalHandle = setInterval(async () => {
      currentStep++;
      const factor = Math.max(0, 1 - currentStep / fadeSteps);
      const targetVol = Math.round(initialVolume * factor);
      try {
        await setVolume(targetVol);
      } catch (e) {
        console.warn(`[SleepTimer] Gagal menyesuaikan volume fade-out di guild ${guildId}:`, e);
      }

      if (currentStep >= fadeSteps) {
        clearInterval(fadeIntervalHandle);
      }
    }, stepIntervalMs);
    fadeIntervalHandle.unref?.();
  }, fadeStartDelayMs);
  fadeStartTimeout.unref?.();

  // Timer eksekusi akhir
  const timerHandle = setTimeout(async () => {
    if (fadeIntervalHandle) clearInterval(fadeIntervalHandle);
    if (fadeStartTimeout) clearTimeout(fadeStartTimeout);
    activeTimers.delete(guildId);

    try {
      await onFinish();
    } catch (err) {
      console.error(`[SleepTimer] Kesalahan saat menghentikan pemutaran di guild ${guildId}:`, err);
    }
  }, durationMs);
  timerHandle.unref?.();

  activeTimers.set(guildId, {
    guildId,
    durationMinutes,
    endsAt,
    timerHandle,
    fadeStartTimeout,
    fadeIntervalHandle,
    initialVolume,
    setVolume,
  });

  return { endsAt, durationMinutes };
}

/**
 * Membatalkan Sleep Timer aktif di sebuah guild dan mengembalikan volume semula.
 */
export function cancelSleepTimer(guildId: string): boolean {
  const session = activeTimers.get(guildId);
  if (!session) return false;

  clearTimeout(session.timerHandle);
  if (session.fadeStartTimeout) {
    clearTimeout(session.fadeStartTimeout);
  }
  if (session.fadeIntervalHandle) {
    clearInterval(session.fadeIntervalHandle);
  }

  // Pulihkan volume semula agar tidak tersangkut di angka rendah jika fade sudah dimulai
  try {
    session.setVolume(session.initialVolume);
  } catch (e) {
    console.warn(`[SleepTimer] Gagal memulihkan volume saat cancel di guild ${guildId}:`, e);
  }

  activeTimers.delete(guildId);
  return true;
}

/**
 * Memeriksa status Sleep Timer di sebuah guild.
 */
export function getSleepTimer(guildId: string): { endsAt: Date; durationMinutes: number; remainingSeconds: number } | null {
  const session = activeTimers.get(guildId);
  if (!session) return null;

  const remainingMs = session.endsAt.getTime() - Date.now();
  if (remainingMs <= 0) {
    activeTimers.delete(guildId);
    return null;
  }

  return {
    endsAt: session.endsAt,
    durationMinutes: session.durationMinutes,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}
