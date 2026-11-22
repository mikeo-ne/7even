/**
 * Channel registry — who posts where.
 *
 * Every entry below was opened and checked on 2026-11-22, not inferred from a
 * link in a footer. `confirmed` means the profile page rendered with a name and
 * content. `empty` means the account exists but has never posted. `missing`
 * means the handle does not resolve. `owner-confirmed` means the owner supplied
 * the handle and the platform refuses logged-out requests, so it is true because
 * they say so rather than because it was verified. `available` means the handle
 * is free and needs registering by a human.
 *
 * The business sites are the source for handles; this file is the source for
 * what 7even is allowed to plan against. It is written into each business
 * workspace as CHANNELS.md on first run, and the owner's edits win from then on.
 */

export type Platform = "Instagram" | "TikTok" | "X" | "YouTube" | "SoundCloud" | "Facebook";

export type AccountState =
  | "confirmed" // opened it, name and posts rendered
  | "empty" // exists, has never posted
  | "owner-confirmed" // the owner supplied it; the platform blocks logged-out checks
  | "available" // the handle is free and should be registered
  | "missing" // does not resolve
  | "unchecked";

export type Account = {
  platform: Platform;
  handle: string;
  url: string;
  state: AccountState;
  /** Present when the account belongs to a roster artist rather than the brand. */
  artist?: string;
  note?: string;
};

export type BusinessChannels = {
  slug: string;
  brand: Account[];
  artists: Account[];
  voice: string;
  /** What the agent should do about the gaps, in plain instruction. */
  gaps: string;
};

const ig = (handle: string, state: AccountState, artist?: string, note?: string): Account => ({
  platform: "Instagram",
  handle,
  url: `https://www.instagram.com/${handle.replace(/^@/, "")}/`,
  state,
  artist,
  note,
});

const tt = (handle: string, state: AccountState, artist?: string, note?: string): Account => ({
  platform: "TikTok",
  handle,
  url: `https://www.tiktok.com/@${handle.replace(/^@/, "")}`,
  state,
  artist,
  note,
});

const x = (handle: string, state: AccountState, note?: string): Account => ({
  platform: "X",
  handle,
  url: `https://x.com/${handle.replace(/^@/, "")}`,
  state,
  note,
});

const none = (platform: Platform, suggested: string, note: string): Account => ({
  platform,
  handle: suggested,
  url: "",
  state: "available",
  note: `${note} Suggested handle: ${suggested}.`,
});

const yt = (handle: string, state: AccountState, artist?: string): Account => ({
  platform: "YouTube",
  handle,
  url: `https://www.youtube.com/@${handle.replace(/^@/, "")}`,
  state,
  artist,
});

export const CHANNELS: BusinessChannels[] = [
  {
    slug: "7h-music-group",
    brand: [
      ig("@7hmusicgroup", "owner-confirmed"),
      none("TikTok", "@7hmusicgroup", "Checked: no label TikTok exists. The same handle is taken on Instagram and X, so register it here before anyone else does."),
      x("@7hmusicgroup", "empty", "Joined Oct 2026. 0 posts, 0 followers, 2 following."),
      yt("@7hmusicgroup", "unchecked"),
      {
        platform: "SoundCloud",
        handle: "7h-music-group",
        url: "https://soundcloud.com/7h-music-group",
        state: "unchecked",
      },
    ],
    artists: [
      ig("@_baranga._", "owner-confirmed", "Baranga"),
      tt("@_baranga", "confirmed", "Baranga", "Posts under 7hmusicgroup hashtags; the most active account on the roster."),
      yt("@baranga_music", "unchecked", "Baranga"),
      ig("@mr_fallback01", "owner-confirmed", "Mr Fallback"),
      tt("@mrfallback6", "confirmed", "Mr Fallback", "Name shown: Mrfalllback. Active, frequently tags 2PUFF Records."),
      yt("@mrfallback01", "unchecked", "Mr Fallback"),
      ig("@mike.1ne_", "owner-confirmed", "Mike 1ne"),
      tt("@mike.1ne_", "confirmed", "Mike 1ne", "Producer-led: sessions, beat breakdowns, music business."),
      tt("@smokie_ceee", "confirmed", "Smokie Cee", "1,405 followers, 6,732 likes. No Instagram published."),
      yt("@smokie_cee", "unchecked", "Smokie Cee"),
    ],
    voice:
      "Artist-first, confident, never corporate. Short sentences. Name the artist, the record and the platform. Capitalise the roster properly: Baranga, Mr Fallback, Mike 1ne, Smokie Cee. Ugandan English, no borrowed American slang.",
    gaps:
      "Instagram is the label's only account with a history. The X account exists but has never posted, so treat the first post as a first impression and do not open with a thread. No label TikTok exists yet: until one is registered, plan TikTok on the artists' own accounts, where the reach already is (Baranga and Mr Fallback are strongest). Mr Fallback's TikTok repeatedly credits 2PUFF Records, so confirm the current label relationship before any post that claims him.",
  },
  {
    slug: "7h-music-blog",
    brand: [
      ig("@7hmusic.blog", "owner-confirmed", "Its own account — the blog no longer borrows the label's."),
      none("X", "@7hmusicblog", "Checked: the handle is free on X."),
      none("TikTok", "@7hmusic.blog", "Checked: free, and it matches the Instagram handle."),
    ],
    artists: [
      ig("@_baranga._", "owner-confirmed", "Baranga"),
      ig("@mr_fallback01", "owner-confirmed", "Mr Fallback"),
      ig("@mike.1ne_", "owner-confirmed", "Mike 1ne"),
    ],
    voice:
      "Editorial, not promotional. Lead with the story, not the brand. Link the article. On X, the headline plus one line of why it matters. Never announce a story with 'New blog post'.",
    gaps:
      "The blog now has its own Instagram (@7hmusic.blog), which settles the independence problem: post blog stories only from that account, never from the label's. X and TikTok are not registered yet, so hold those posts until they are, and keep every post visibly bylined 7H Music Blog.",
  },
  {
    slug: "east-sound",
    brand: [
      ig("@eas_tsound", "owner-confirmed"),
      x("@EastSoundTech", "empty", "Joined Nov 2026. 0 posts, 1 follower. The bio claims 26 stations monitored live — confirm that figure before repeating it anywhere."),
      none("TikTok", "@eastsoundtech", "Checked: free. @eas_tsound is also free if you want the TikTok to match Instagram."),
    ],
    artists: [],
    voice:
      "Precise, factual, unexcited. Numbers with units, dates in full. Say 'detected play', never 'proven royalty'. No regulator, broadcaster or CMO is ever named as a partner until an agreement exists in writing.",
    gaps:
      "East Sound has Instagram (@eas_tsound) and X (@EastSoundTech); neither has ever posted and there is no TikTok yet. Its X bio claims 26 radio stations monitored live and says the company is powered by 7H Music Group: the station count must be true and kept current, and the agent must never publish a figure it has not re-checked. This audience is broadcasters, regulators and labels, so X and LinkedIn carry the message and Instagram carries the evidence — charts, clips, coverage maps. Keep the label's voice out of it: share the parentage, do not sound like a record label.",
  },
];

/** Hard limits, checked before anything is drafted. Truncation is not a style. */
export type PlatformLimit = {
  platform: string;
  post: number;
  hashtags?: number;
  notes: string;
};

export const PLATFORM_LIMITS: PlatformLimit[] = [
  { platform: "X", post: 280, hashtags: 2, notes: "Threads allowed; one idea per post." },
  {
    platform: "Instagram",
    post: 2200,
    hashtags: 30,
    notes: "First 125 characters show before 'more'. 4:5 or 1:1 image, 9:16 for Reels.",
  },
  { platform: "TikTok", post: 2200, hashtags: 5, notes: "Hook in the first 2 seconds. Vertical 9:16." },
  { platform: "YouTube", post: 5000, notes: "Title 100 characters. Thumbnail text under 6 words." },
  { platform: "Facebook", post: 63206, notes: "Links get demoted; put the link in the first comment." },
  { platform: "LinkedIn", post: 3000, hashtags: 3, notes: "For partners and regulators, not fans." },
  { platform: "WhatsApp Channel", post: 900, notes: "Short, plain, no hashtags." },
];

export const SOCIAL_RULES = `## Social rules

- Nothing is published, scheduled, DM'd or commented without approval. Draft it, show the exact copy, platform, media and time, and wait.
- Never invent a number. No stream counts, follower counts, chart positions, ticket sales or "sold out" unless the figure is in the workspace or a tool result.
- One post, one idea. Write the caption for someone scrolling with the sound off.
- Every image needs alt text. Every video needs a caption file (SRT) before it goes up.
- No engagement bait, no fake urgency, no "link in bio" when the link can be in the post.
- Credit everyone: artist, producer, videographer, photographer, feature. Credit errors get corrected publicly, not quietly deleted.
- Reach is not the goal; the right 500 people are worth more than the wrong 50,000.
- When a post underperforms, report it with the numbers and a hypothesis. Do not quietly rebrand it as a "test".
- Never tag an artist, brand or station without confirming the relationship is current.`;

export const CADENCE_RULES = `## Cadence

- Plan in weekly blocks, published every Monday morning for the week ahead.
- Per artist or brand: 3-5 posts a week while a release is live, 1-2 a week otherwise.
- A release gets a defined arc: announce, tease, drop, proof (first plays/screenshots), thank-you, then catalogue.
- TikTok is artist-led on this roster; Instagram is label-led. Do not mirror the same cut to both.
- Blog: each published story yields one post for the account it shares with the label, and, if it concerns a roster artist, a distinct post from a different angle.
- East Sound: no accounts. Draft into the workspace and label it for the owner to place.`;

const STATE_LABEL: Record<AccountState, string> = {
  confirmed: "verified — posts present",
  empty: "exists but has never posted",
  "owner-confirmed": "supplied by the owner; Instagram hides it from logged-out checks",
  available: "FREE — register this handle",
  missing: "does not resolve — do not use",
  unchecked: "linked from the site, not opened",
};

function accountLines(accounts: Account[]): string {
  if (accounts.length === 0) return "- None found. Do not create any; ask the owner.";
  return accounts
    .map(
      (account) =>
        `- **${account.platform}** ${account.handle} — ${STATE_LABEL[account.state]}${account.note ? `. ${account.note}` : ""}\n  ${account.url}`,
    )
    .join("\n");
}

/** The markdown written into a business workspace on first run. */
export function channelFile(slug: string, businessName: string): string {
  const profile = CHANNELS.find((channel) => channel.slug === slug);

  const brand = accountLines(profile?.brand ?? []);
  const artists = profile?.artists.length
    ? accountLines(profile.artists)
    : "- No roster artist accounts are associated with this business.";

  return `# ${businessName} — channels

_Checked 22 November 2026 by opening each profile. Edit this file freely; it is
read before any social work and the agent will not overwrite it once it exists._

## Brand accounts

${brand}

## Artist accounts

${artists}

## What this means

${profile?.gaps ?? "No channel notes. Ask the owner before posting anything."}

## Voice

${profile?.voice ?? "Match the voice of the business brief. Short sentences, concrete nouns, no hype words."}

${SOCIAL_RULES}

${CADENCE_RULES}

## Limits

${PLATFORM_LIMITS.map(
  (limit) =>
    `- **${limit.platform}**: ${limit.post} characters${limit.hashtags ? `, max ${limit.hashtags} hashtags` : ""}. ${limit.notes}`,
).join("\n")}

## Assets

Put source images, video and captions in \`social/<YYYY-MM-DD>-<slug>/\` with
\`copy.md\`, \`alt.txt\` and the media files. Anything published must be traceable
back to that folder.
`;
}
