/**
 * When to post.
 *
 * This is not a guess at "best times" from a blog post. It encodes when an
 * audience is actually reachable in Uganda and Kenya, and it refuses to put two
 * posts from the same account inside an hour, because the second one eats the
 * first. Everything here is a default the owner can override in CHANNELS.md.
 */

import type { Post, PostDraft } from "./types.js";

export type Slot = {
  /** Local time in EAT (UTC+3). */
  at: string;
  why: string;
};

/** Kampala and Nairobi share EAT, so one calendar serves both desks. */
export const EAT_OFFSET_MINUTES = 180;

export const SLOTS: Record<string, Slot[]> = {
  instagram: [
    { at: "12:30", why: "Lunch break scroll; the strongest window for a feed post on weekdays." },
    { at: "19:30", why: "After work, before the evening. Reels do best here." },
  ],
  tiktok: [
    { at: "13:00", why: "Lunch hour, and again after the 20:00 release of a track." },
    { at: "20:30", why: "Prime viewing; the algorithm rewards the first hour." },
  ],
  x: [
    { at: "08:30", why: "Commute and news-checking window in East Africa." },
    { at: "17:00", why: "End of the working day, when industry people check their feed." },
  ],
  youtube: [{ at: "18:00", why: "Evening viewing; give the algorithm an hour before prime time." }],
};

const MIN_GAP_MINUTES = 60;

/** ISO string for a wall-clock time in EAT on a given date. */
export function eatToIso(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - EAT_OFFSET_MINUTES * 60_000;
  return new Date(utcMs).toISOString();
}

export type ScheduleProblem = {
  draftIndex: number;
  problem: string;
};

/**
 * Give each draft a slot, in order, without stacking one account.
 * `existing` is what is already scheduled for the same accounts that day.
 */
export function assignSlots(
  drafts: PostDraft[],
  startDate: string,
  existing: Pick<Post, "account_handle" | "platform" | "scheduled_for">[] = [],
): { scheduled: PostDraft[]; problems: ScheduleProblem[] } {
  const scheduled: PostDraft[] = [];
  const problems: ScheduleProblem[] = [];

  const taken = existing
    .map((post) => post.scheduled_for)
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value));

  drafts.forEach((draft, index) => {
    if (draft.scheduled_for) {
      scheduled.push(draft);
      taken.push(Date.parse(draft.scheduled_for));
      return;
    }

    const slots = SLOTS[draft.platform];
    if (!slots?.length) {
      problems.push({ draftIndex: index, problem: `no posting window known for ${draft.platform}` });
      scheduled.push(draft);
      return;
    }

    const candidate = slots
      .map((slot) => ({ at: eatToIso(startDate, slot.at), why: slot.why }))
      .find((slot) =>
        taken.every((takenAt) => Math.abs(Date.parse(slot.at) - takenAt) >= MIN_GAP_MINUTES * 60_000),
      );

    if (!candidate) {
      problems.push({
        draftIndex: index,
        problem: `every ${draft.platform} window on ${startDate} is already taken; needs another day`,
      });
      scheduled.push(draft);
      return;
    }

    taken.push(Date.parse(candidate.at));
    scheduled.push({ ...draft, scheduled_for: candidate.at });
  });

  return { scheduled, problems };
}

/** The next N posting dates, skipping nothing — the plan decides rest days. */
export function upcomingDates(from: Date, count: number): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const day = new Date(from.getTime() + offset * 86_400_000);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}
