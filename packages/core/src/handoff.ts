/**
 * Manual handoff.
 *
 * Most of the time the right answer is not an API. X charges $0.20 for a post
 * containing a link, Instagram needs a Business account and an app review, and a
 * human tapping "paste" costs nothing and cannot misconfigure a scope.
 *
 * So every approved post can be turned into exactly what you need to paste, in
 * the order you need it, per platform — because each one wants a different
 * shape and getting that wrong is how a caption ends up mangled on the timeline.
 */

import type { Post } from "./types.js";

export type Handoff = {
  /** What to paste into the "what's on the post" box. */
  caption: string;
  /** Where the file goes, if there is one. */
  media: string[];
  /** The character count against the platform's limit. */
  length: number;
  limit: number;
  /** Anything that will trip you up on this specific platform. */
  warning?: string;
};

const LIMITS: Record<string, number> = {
  x: 280,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
  facebook: 63206,
  linkedin: 3000,
};

/**
 * Hashtags belong in the caption on some platforms and not on others. Putting
 * them in the caption on Instagram is normal; on YouTube they belong in the
 * description; on X more than two looks desperate.
 */
function captionFor(post: Post): string {
  const tags = post.hashtags.join(" ");
  const base = post.caption.trim();

  switch (post.platform) {
    case "x":
      // Links go in the caption on X; two tags at most.
      return [base, post.link, tags].filter(Boolean).join("\n\n").trim();
    case "tiktok":
      return [base, tags].filter(Boolean).join("\n\n").trim();
    case "instagram":
      return [base, tags].filter(Boolean).join("\n\n").trim();
    case "youtube":
      return [base, post.link, tags].filter(Boolean).join("\n").trim();
    case "linkedin":
      return [base, tags].filter(Boolean).join("\n\n").trim();
    default:
      return base;
  }
}

export function handoffFor(post: Post): Handoff {
  const caption = captionFor(post);
  const limit = LIMITS[post.platform] ?? 2200;
  const length = [...caption].length;

  let warning: string | undefined;

  if (post.platform === "instagram") {
    if (/https?:\/\//.test(caption)) {
      warning = "Instagram captions are not clickable. Move the link to your bio, or drop it.";
    } else if (!post.alt_text) {
      warning = "No alt text. Add it in the 'Advanced settings' step before posting.";
    }
  }

  if (post.platform === "x" && post.link) {
    warning =
      "A post containing a link costs $0.20 on the API, but this is a manual post, so it is free. Post it natively.";
  }

  if (post.platform === "tiktok") {
    warning = "TikTok captions need a video. Post from the app if the media is not a video file.";
  }

  if (post.platform === "linkedin") {
    warning =
      "LinkedIn defaults to posting as you, not as a company page. Switch the author if it should be 7H.";
  }

  if (length > limit) {
    warning = `This is ${length - limit} characters over the limit. It will be cut off.`;
  }

  return { caption, media: post.media_urls, length, limit, warning };
}

/** A single block you can read on a phone while standing at the laptop. */
export function handoffText(post: Post, businessName: string): string {
  const handoff = handoffFor(post);
  const when = post.scheduled_for
    ? new Date(post.scheduled_for).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Kampala",
      })
    : "no slot set";

  return [
    `${post.platform.toUpperCase()} — ${post.account_handle}${post.account_role === "artist" ? " (artist account)" : ""}`,
    `${businessName} · ${when} EAT · ${post.format}`,
    "",
    handoff.caption,
    "",
    handoff.media.length > 0 ? `Media: ${handoff.media.join(", ")}` : "Media: none",
    post.alt_text ? `Alt text: ${post.alt_text}` : "Alt text: none — add one before posting",
    `Length: ${handoff.length}/${handoff.limit}`,
    handoff.warning ? `\n! ${handoff.warning}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Where to go, per platform, when you are pasting by hand. */
export const HANDOFF_STEPS: Record<string, string> = {
  instagram:
    "Instagram app → + → select the image → paste the caption → Advanced settings → write alt text → share. Or schedule it in Meta Business Suite, which is free.",
  x: "x.com/compose/post → paste → attach the image → post. To schedule without paying: use X's own scheduler in the compose box.",
  tiktok:
    "TikTok app → + → upload the video → paste the caption → cover → post. Add the sound before the caption or the caption resets.",
  youtube:
    "YouTube Studio → Create → Upload video → title and description → paste the description → set visibility → publish.",
  linkedin:
    "LinkedIn → Start a post → check the author dropdown says the right page → paste → add media → post.",
};
