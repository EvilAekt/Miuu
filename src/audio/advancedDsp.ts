// src/audio/advancedDsp.ts: Pengelola Efek Audio Lanjutan (8D Audio, Timescale Pitch/Speed, dan Normalisasi)

export type RotationSpeed = "slow" | "normal" | "fast";

export const ROTATION_SPEED_MAP: Record<RotationSpeed, number> = {
  slow: 0.08,
  normal: 0.15,
  fast: 0.25,
};

/**
 * Mengaktifkan atau menonaktifkan efek 8D Audio Spasial (rotasi stereo 360 derajat binaural).
 */
export async function set8DAudio(
  player: any,
  enabled: boolean,
  speed: RotationSpeed = "normal"
): Promise<{ enabled: boolean; hz: number }> {
  if (!player || !player.filterManager) {
    throw new Error("Player atau FilterManager Lavalink tidak tersedia.");
  }

  const hz = enabled ? (ROTATION_SPEED_MAP[speed] || 0.15) : 0;

  if (typeof player.filterManager.setRotation === "function") {
    await player.filterManager.setRotation(enabled ? { rotationHz: hz } : null);
  } else if (typeof player.filterManager.setFilters === "function") {
    await player.filterManager.setFilters({
      rotation: enabled ? { rotationHz: hz } : undefined,
    });
  }

  return { enabled, hz };
}

/**
 * Mengatur kecepatan pemutaran lagu (Playback Speed: 0.5x - 2.0x).
 */
export async function setPlaybackSpeed(player: any, speed: number): Promise<number> {
  if (!player || !player.filterManager) {
    throw new Error("Player atau FilterManager Lavalink tidak tersedia.");
  }

  const clampedSpeed = Math.min(Math.max(speed, 0.5), 2.0);

  if (typeof player.filterManager.setTimescale === "function") {
    const currentTimescale = player.filterManager.filters?.timescale || {};
    await player.filterManager.setTimescale({
      ...currentTimescale,
      speed: clampedSpeed,
    });
  }

  return clampedSpeed;
}

/**
 * Mengatur tinggi/rendah nada lagu (Pitch: 0.5x - 2.0x).
 */
export async function setPlaybackPitch(player: any, pitch: number): Promise<number> {
  if (!player || !player.filterManager) {
    throw new Error("Player atau FilterManager Lavalink tidak tersedia.");
  }

  const clampedPitch = Math.min(Math.max(pitch, 0.5), 2.0);

  if (typeof player.filterManager.setTimescale === "function") {
    const currentTimescale = player.filterManager.filters?.timescale || {};
    await player.filterManager.setTimescale({
      ...currentTimescale,
      pitch: clampedPitch,
    });
  }

  return clampedPitch;
}

/**
 * Mengaktifkan atau menonaktifkan normalisasi volume otomatis (Auto-Normalizer).
 */
export async function setAutoNormalize(player: any, enabled: boolean): Promise<boolean> {
  if (!player || !player.filterManager) {
    throw new Error("Player atau FilterManager Lavalink tidak tersedia.");
  }

  // Menggunakan preset Equalizer datar terkompensasi atau reset
  if (enabled) {
    if (typeof player.filterManager.setEQ === "function") {
      // Menurunkan frekuensi ekstrem agar volume konsisten
      await player.filterManager.setEQ([
        { band: 0, gain: -0.05 },
        { band: 1, gain: -0.03 },
        { band: 2, gain: 0.0 },
        { band: 3, gain: 0.0 },
        { band: 4, gain: 0.0 },
      ]);
    }
  } else {
    if (typeof player.filterManager.clearEQ === "function") {
      await player.filterManager.clearEQ();
    }
  }

  return enabled;
}
