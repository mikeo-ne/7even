/**
 * The account map.
 *
 * Which accounts to hold, in what form, and — the part that decides your whole
 * automation strategy — whether an API can post to it for free.
 *
 * `automation` is the only field that matters for planning:
 *   "free"        an agent can post without paying anyone
 *   "paid"        posting needs a paid API tier
 *   "review"      posting is possible for free, but only after an app review
 *   "manual"      no API worth using; hand it to a human
 *
 * This is not speculation. Each entry says where the requirement comes from.
 */

export type Automation = "free" | "paid" | "review" | "manual";

export type PlatformSpec = {
  platform: string;
  key: string;
  /** What account you need, in the form the platform actually demands. */
  account: string;
  /** The shape of a post there, for planning. */
  limits: string;
  automation: Automation;
  /** Why, in one sentence you can act on. */
  automationNote: string;
  /** Whether the agent can publish through it today, as built. */
  adapter: "x" | "instagram" | "tiktok" | "linkedin" | "youtube" | null;
  /** Priority for 7H, with the reason. 1 = do this first. */
  priority: number;
  why: string;
};

export const PLATFORMS: PlatformSpec[] = [
  {
    platform: "Instagram",
    key: "instagram",
    account: "An Instagram Business or Creator account, linked to a Facebook Page (a Page is mandatory, even if it is empty).",
    limits: "Caption 2,200 characters, first 125 before 'more'. Up to 30 hashtags. Feed 4:5 or 1:1, Reels 9:16.",
    automation: "review",
    automationNote:
      "Free to post through the Graph API, but the Meta app needs instagram_content_publish approved first. That review takes days to weeks.",
    adapter: "instagram",
    priority: 1,
    why: "Baranga's audience and the label's live on Instagram. It is the account that matters most and the one worth the review.",
  },
  {
    platform: "TikTok",
    key: "tiktok",
    account: "A TikTok Business account for the label and a personal Creator account for the artist. Do not use an unaudited app's posting.",
    limits: "Caption 2,200 characters, up to 5 hashtags that matter. Video 9:16, hook in the first 2 seconds.",
    automation: "review",
    automationNote:
      "The Content Posting API is free but needs app approval, and an unaudited app can only post privately — a successful call is not proof anyone saw it.",
    adapter: "tiktok",
    priority: 1,
    why: "This is where the roster's actual reach is. Baranga's account carries the label more than the label's own posts do.",
  },
  {
    platform: "X",
    key: "x",
    account: "A plain account is enough — no Premium needed to post by hand or to schedule natively.",
    limits: "280 characters, 2 hashtags at most. Threads as reply chains.",
    automation: "paid",
    automationNote:
      "Free tier closed to new developers in February 2026. Pay-per-use is $0.015 a post, and $0.20 for a post containing a link — so automating link posts here is the worst value of any platform.",
    adapter: "x",
    priority: 3,
    why: "Worth holding for industry and press reach, but post it by hand. X's own scheduler in the compose box is free and needs no API.",
  },
  {
    platform: "YouTube",
    key: "youtube",
    account: "A YouTube channel on the label's Google account. Brand accounts under one Google login are how you avoid password sprawl.",
    limits: "Title 100 characters, description 5,000. Thumbnail text under 6 words.",
    automation: "review",
    automationNote:
      "The Data API allows uploads free, but a new project starts unverified: uploads from it are locked to private until Google audits the project.",
    adapter: "youtube",
    priority: 2,
    why: "Every release needs a home for the visual, the lyric video and the interview. Free to automate after an audit.",
  },
  {
    platform: "LinkedIn",
    key: "linkedin",
    account: "A LinkedIn Company Page for 7H, and a personal profile to administer it. East Sound needs its own Company Page.",
    limits: "Post 3,000 characters, 3 hashtags. Links get demoted — put them in the first comment.",
    automation: "free",
    automationNote:
      "The Posts API posts to a Company Page on the free developer tier once the app is verified against a Page you administer. No payment.",
    adapter: "linkedin",
    priority: 4,
    why: "This is where East Sound actually belongs — broadcasters, regulators and labels, not fans. For 7H it is for partners and press.",
  },
  {
    platform: "Facebook",
    key: "facebook",
    account: "A Facebook Page for each business. Required anyway, because Instagram Business needs one.",
    limits: "Post 63,206 characters. Links are demoted in the feed.",
    automation: "review",
    automationNote: "Graph API posting works on the same app review as Instagram. One approval covers both.",
    adapter: null,
    priority: 5,
    why: "You need the Page for Instagram regardless. Keep it in sync rather than posting separately.",
  },
  {
    platform: "WhatsApp Channel",
    key: "whatsapp",
    account: "A WhatsApp Channel on the label's number, under the WhatsApp Business account.",
    limits: "Short text. No hashtags. No links in the first message or it looks like spam.",
    automation: "manual",
    automationNote:
      "The Business API exists but charges per conversation and is built for support, not broadcasts. Use the app.",
    adapter: null,
    priority: 2,
    why: "For Uganda this is closer to a mailing list than social. Release days, airplay alerts, and demo replies land better here than anywhere.",
  },
];

/** The minimum set to run the label's social properly. */
export const MINIMUM_STACK = [
  "Instagram Business for @7hmusicgroup, linked to a Facebook Page",
  "TikTok Business for @7hmusicgroup",
  "A YouTube channel and one Google account to own every brand account",
  "LinkedIn Company Page for 7H and a separate one for East Sound",
  "WhatsApp Channel on the label number",
];

export function byAutomation(automation: Automation): PlatformSpec[] {
  return PLATFORMS.filter((spec) => spec.automation === automation);
}
