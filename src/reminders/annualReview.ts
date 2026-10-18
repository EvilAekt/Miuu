import type { Client } from "discord.js";
import { getReviewState, setReviewState } from "../db/index.js";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function initAnnualReview(): void {
  const current = getReviewState();
  if (!current) {
    const now = Date.now();
    setReviewState(now, now + ONE_YEAR_MS, null);
  }
}

export function getAnnualReviewStatus(): {
  lastReviewDate: string;
  nextReviewDate: string;
  daysRemaining: number;
  isOverdue: boolean;
} {
  initAnnualReview();
  const state = getReviewState()!;
  const now = Date.now();

  const daysRemaining = Math.ceil((state.next_review_at - now) / (24 * 60 * 60 * 1000));
  // Overdue jika sudah melewati next_review_at lebih dari 30 hari (13 bulan sejak tinjauan terakhir)
  const isOverdue = now > state.next_review_at + 30 * 24 * 60 * 60 * 1000;

  return {
    lastReviewDate: new Date(state.last_review_at).toLocaleDateString("id-ID"),
    nextReviewDate: new Date(state.next_review_at).toLocaleDateString("id-ID"),
    daysRemaining,
    isOverdue,
  };
}

export async function checkReviewReminder(client: Client, ownerId?: string): Promise<void> {
  initAnnualReview();
  const state = getReviewState()!;
  const now = Date.now();

  // Pengingat aktif jika sisa waktu <= 14 hari
  if (now >= state.next_review_at - FOURTEEN_DAYS_MS) {
    const lastSent = state.reminder_sent_at || 0;
    // Kirim tiap minggu
    if (now - lastSent >= SEVEN_DAYS_MS && ownerId) {
      try {
        const owner = await client.users.fetch(ownerId);
        if (owner) {
          const daysLeft = Math.ceil((state.next_review_at - now) / (24 * 60 * 60 * 1000));
          await owner.send(
            `🔔 **[Pengingat Tinjauan Tahunan PRD v5]**\n` +
              `Waktu tinjauan tahunan bot musik Anda tinggal **${daysLeft} hari** (Jatuh tempo: ${new Date(state.next_review_at).toLocaleDateString("id-ID")}).\n` +
              `Silakan tinjau metriks pemeliharaan dan perbarui dokumen di \`docs/review/2026/keputusan.md\`.`
          );
          setReviewState(state.last_review_at, state.next_review_at, now);
        }
      } catch (err: any) {
        console.warn("[Annual Review Reminder] Gagal mengirim DM ke pemilik:", err?.message);
      }
    }
  }
}
