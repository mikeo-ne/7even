/**
 * Post extraction and validation.
 *
 * The brain is asked to emit posts in a fenced `post` block. Everything is
 * validated before it can reach the database or a platform: a caption that
 * overruns the limit is not trimmed silently, it is rejected, because a
 * half-sentence shipped to a label's account is worse than a failed task.
 */

import { PLATFORM_LIMITS } from "./channels.js";
import type { AccountRole, PostDraft, PostFormat, PostPlatform } from "./types.js";

const PLATFORMS: PostPlatform[] = ["instagram", "tiktok", "x", "youtube", "facebook", "linkedin"];
const FORMATS: PostFormat[] = ["image", "carousel", "reel", "video", "story", "text", "thread"];
const ROLES: AccountRole[] = ["label", "artist", "owner"];

export type DraftProblem = {
  index: number;
  problem: string;
};

/**
 * The contract the brain is given. Kept next to the parser so the two cannot
 * drift: change one and the other is staring at you.
 */
export const POST_CONTRACT = `## When the task asks for posts

Emit each post as a fenced block, exactly this shape, one block per post:

\`\`\`post
platform: instagram
account: @7hmusicgroup
role: label
format: image
schedule: 2026-11-24T09:00:00Z
caption: |
  Two lines of caption here.
  Plain text, no markdown.
alt: A short description for a screen reader.
hashtags: #7hmusicgroup #Baranga
link: https://example.com
\`\`\`

Rules:
- \`platform\` is one of ${PLATFORMS.join(", ")}.
- \`role\` is one of ${ROLES.join(", ")}. \`artist\` means the account belongs to the artist, not the label.
- \`format\` is one of ${FORMATS.join(", ")}.
- \`caption\` overruns the platform limit and the post is rejected. Do not pad to fit; cut.
- Omit \`schedule\` unless you were given a date. Never invent one.
- No markdown inside the caption. No emoji spam. No invented numbers.`;

const BLOCK = /```post\s*\n([\s\S]*?)```/g;

/** Parse the key: value blocks out of model output. */
export function extractPostDrafts(text: string): { cleaned: string; drafts: PostDraft[] } {
  const drafts: PostDraft[] = [];
  const cleaned = text.replace(BLOCK, (_match, body: string) => {
    const draft = parseBlock(body);
    if (draft) drafts.push(draft);
    return "";
  });

  return { cleaned: cleaned.trim(), drafts };
}

function parseBlock(body: string): PostDraft | null {
  const fields: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) fields[current] = buffer.join("\n").trim();
  };

  for (const line of body.split("\n")) {
    const match = line.match(/^([a-z_]+):\s*(.*)$/);
    if (match) {
      flush();
      current = match[1];
      buffer = match[2] === "|" ? [] : [match[2]];
    } else if (current) {
      buffer.push(line);
    }
  }
  flush();

  const platform = (fields.platform ?? "").trim().toLowerCase() as PostPlatform;
  const caption = (fields.caption ?? "").trim();
  if (!PLATFORMS.includes(platform) || !caption) return null;

  const format = (fields.format ?? "image").trim().toLowerCase() as PostFormat;
  const role = (fields.role ?? "label").trim().toLowerCase() as AccountRole;

  return {
    platform,
    account_handle: (fields.account ?? "").trim(),
    account_role: ROLES.includes(role) ? role : "label",
    format: FORMATS.includes(format) ? format : "image",
    caption,
    alt_text: fields.alt?.trim() || undefined,
    hashtags: (fields.hashtags ?? "")
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.startsWith("#")),
    link: fields.link?.trim() || undefined,
    scheduled_for: fields.schedule?.trim() || undefined,
  };
}

/** Reject rather than repair. Returns one problem per bad draft. */
export function validateDraft(draft: PostDraft): string | null {
  if (!draft.account_handle) return "no account given";

  const limit = PLATFORM_LIMITS.find(
    (entry) => entry.platform.toLowerCase() === platformName(draft.platform).toLowerCase(),
  );

  if (limit) {
    const length = [...draft.caption].length;
    if (length > limit.post) {
      return `caption is ${length} characters, ${platformName(draft.platform)} allows ${limit.post}`;
    }
    if (limit.hashtags && (draft.hashtags?.length ?? 0) > limit.hashtags) {
      return `${draft.hashtags?.length} hashtags, ${platformName(draft.platform)} allows ${limit.hashtags}`;
    }
  }

  if (!draft.alt_text && draft.format !== "text" && draft.format !== "thread") {
    return "no alt text — every image needs one";
  }

  if (draft.scheduled_for && Number.isNaN(Date.parse(draft.scheduled_for))) {
    return `unreadable schedule "${draft.scheduled_for}"`;
  }

  if (draft.scheduled_for && Date.parse(draft.scheduled_for) < Date.now() - 60_000) {
    return `schedule "${draft.scheduled_for}" is in the past`;
  }

  if (draft.media_urls?.some((url) => !/^https?:\/\//.test(url))) {
    return "media urls must be absolute http(s) urls";
  }

  return null;
}

/** Check a batch, so the agent can report exactly which drafts it refused and why. */
export function validateDrafts(drafts: PostDraft[]): { valid: PostDraft[]; problems: DraftProblem[] } {
  const valid: PostDraft[] = [];
  const problems: DraftProblem[] = [];

  drafts.forEach((draft, index) => {
    const problem = validateDraft(draft);
    if (problem) problems.push({ index, problem });
    else valid.push(draft);
  });

  return { valid, problems };
}

export function platformName(platform: PostPlatform): string {
  return platform === "x" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1);
}
