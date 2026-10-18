// src/mixing/crossfadeManager.ts: Pengelola Smart Audio Crossfade & Transisi Volume

const guildCrossfades = new Map<string, number>();

/**
 * Mengatur durasi crossfade untuk sebuah guild (0 = nonaktif, 1-10 detik).
 */
export function setCrossfadeDuration(guildId: string, seconds: number): number {
  const clamped = Math.min(Math.max(seconds, 0), 10);
  if (clamped === 0) {
    guildCrossfades.delete(guildId);
  } else {
    guildCrossfades.set(guildId, clamped);
  }
  return clamped;
}

/**
 * Mendapatkan durasi crossfade aktif di sebuah guild.
 */
export function getCrossfadeDuration(guildId: string): number {
  return guildCrossfades.get(guildId) || 0;
}

/**
 * Menerapkan efek Fade-In bertahap pada player saat lagu baru dimulai.
 */
export async function applyFadeIn(
  player: any,
  targetVolume: number,
  durationSeconds: number
): Promise<void> {
  if (!player) return;
  if (durationSeconds <= 0) {
    await player.setVolume(targetVolume);
    return;
  }

  const steps = 5;
  const intervalMs = (durationSeconds * 1000) / steps;
  let step = 0;

  // Set volume awal sangat rendah
  await player.setVolume(Math.round(targetVolume * 0.15));

  const timer = setInterval(async () => {
    step++;
    const progress = step / steps;
    const currentVol = Math.round(targetVolume * (0.15 + 0.85 * progress));
    try {
      await player.setVolume(currentVol);
    } catch {}

    if (step >= steps) {
      clearInterval(timer);
    }
  }, intervalMs);
  timer.unref?.();
}

/**
 * Menerapkan efek Fade-Out bertahap pada player saat lagu akan selesai atau di-skip.
 */
export async function applyFadeOut(
  player: any,
  durationSeconds: number
): Promise<void> {
  if (!player) return;
  if (durationSeconds <= 0) {
    await player.setVolume(0);
    return;
  }

  const steps = 5;
  const intervalMs = (durationSeconds * 1000) / steps;
  let step = 0;
  const initialVolume = player.volume || 100;

  const timer = setInterval(async () => {
    step++;
    const progress = step / steps;
    const currentVol = Math.round(initialVolume * Math.max(0, 1 - progress));
    try {
      await player.setVolume(currentVol);
    } catch {}

    if (step >= steps) {
      clearInterval(timer);
    }
  }, intervalMs);
  timer.unref?.();
}
