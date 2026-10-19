// src/player/sfxManager.ts: Pengelola interupsi SFX dengan Smart Resume
import type { Player, Track, UnresolvedTrack } from "lavalink-client";

export interface SfxInterruptionState {
  originalTrack: Track | UnresolvedTrack;
  position: number;
  sfxIdentifier?: string;
  timestamp: number;
}

const sfxInterruptions = new Map<string, SfxInterruptionState>();

export function getSfxInterruption(guildId: string): SfxInterruptionState | undefined {
  return sfxInterruptions.get(guildId);
}

export function clearSfxInterruption(guildId: string): void {
  sfxInterruptions.delete(guildId);
}

export function setSfxInterruption(guildId: string, state: SfxInterruptionState): void {
  sfxInterruptions.set(guildId, state);
}

export function isSfxTrack(track: Track | UnresolvedTrack | null): boolean {
  if (!track) return false;
  return !!(track as any).isSfxTrack || ((track.requester as any)?.isSfx === true);
}

/**
 * Memainkan track efek suara (SFX) dengan Smart Resume:
 * Menyimpan lagu & posisi detik saat ini, lalu setelah SFX berbunyi, lagu dilanjutkan otomatis.
 */
export async function playSfxWithSmartResume(
  player: Player,
  sfxTrack: Track | UnresolvedTrack
): Promise<{ success: boolean; resumed: boolean }> {
  // Tandai track sebagai SFX
  (sfxTrack as any).isSfxTrack = true;
  if (!sfxTrack.requester) sfxTrack.requester = {};
  (sfxTrack.requester as any).isSfx = true;

  if (player.playing && player.queue.current) {
    // Ambil track & posisi aktif sebelum SFX
    const currentTrack = player.queue.current;
    const currentPosition = Math.max(0, (player.position || 0) - 200); // Backtrack 200ms agar sambungan audio mulus

    setSfxInterruption(player.guildId, {
      originalTrack: currentTrack,
      position: currentPosition,
      sfxIdentifier: sfxTrack.info.identifier,
      timestamp: Date.now(),
    });

    // Masukkan sfx ke depan antrean dan langsung mainkan
    player.queue.tracks.unshift(sfxTrack);
    await player.skip();
    return { success: true, resumed: true };
  } else {
    // Player sedang idle / tidak memutar musik
    clearSfxInterruption(player.guildId);
    await player.queue.add(sfxTrack);
    await player.play();
    return { success: true, resumed: false };
  }
}

/**
 * Menangani kembalinya lagu (resume) saat event trackEnd terpicu untuk SFX
 */
export async function handleSfxTrackEnd(player: Player, finishedTrack: Track | UnresolvedTrack | null): Promise<boolean> {
  const interruption = getSfxInterruption(player.guildId);
  if (!interruption) return false;

  const isCurrentSfx = isSfxTrack(finishedTrack) || 
    (finishedTrack && interruption.sfxIdentifier && finishedTrack.info.identifier === interruption.sfxIdentifier);

  if (isCurrentSfx) {
    clearSfxInterruption(player.guildId);

    // Kembalikan lagu yang diinterupsi ke depan antrean dan lanjutkan dari posisi detik tersimpan
    player.queue.tracks.unshift(interruption.originalTrack);
    await player.play({ position: interruption.position });
    return true;
  }

  return false;
}
