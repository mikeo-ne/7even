/**
 * Channel playbooks.
 *
 * A business's `brief` says what it is; this file says how its social presence
 * is meant to sound and what each platform will physically accept. It is
 * written into the business workspace as `CHANNELS.md` on first run so the
 * owner can edit it on their Mac without touching code or the database.
 */

export type PlatformLimit = {
  platform: string;
  post: number;
  caption?: number;
  hashtags?: number;
  notes: string;
};

/** Hard limits, checked before anything is drafted. Truncation is not a style. */
export const PLATFORM_LIMITS: PlatformLimit[] = [
  { platform: "X", post: 280, hashtags: 2, notes: "Threads allowed; one idea per post." },
  {
    platform: "Instagram",
    post: 2200,
    caption: 2200,
    hashtags: 30,
    notes: "First 125 characters show before 'more'. 4:5 or 1:1 image, 9:16 for Reels.",
  },
  { platform: "TikTok", post: 2200, hashtags: 5, notes: "Hook in the first 2 seconds. Vertical 9:16." },
  { platform: "Facebook", post: 63206, notes: "Links get demoted; put the link in the first comment." },
  { platform: "YouTube", post: 5000, notes: "Title 100 characters. Thumbnail text under 6 words." },
  { platform: "LinkedIn", post: 3000, hashtags: 3, notes: "For partners, labels and regulators, not fans." },
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
- When a post underperforms, report it with the numbers and a hypothesis. Do not quietly rebrand it as a "test".`;

export const CADENCE_RULES = `## Cadence

- Plan in weekly blocks, published every Monday morning for the week ahead.
- Per artist or brand: 3-5 posts a week while a release is live, 1-2 a week otherwise.
- A release gets a defined arc: announce, tease, drop, proof (first plays/screenshots), thank-you, then catalogue.
- Blog: each published story yields one post for the blog account and, if it concerns a roster artist, one for the label account.
- East Sound: the weekly chart is the anchor post; the rest is evidence, coverage and partner news.`;

export type ChannelProfile = {
  slug: string;
  handles: { platform: string; handle: string }[];
  voice: string;
};

export const CHANNELS: ChannelProfile[] = [
  {
    slug: "7h-music-group",
    handles: [
      { platform: "Instagram", handle: "@7hmusicgroup" },
      { platform: "X", handle: "@7hmusicgroup" },
      { platform: "YouTube", handle: "@7hmusicgroup" },
      { platform: "SoundCloud", handle: "7h-music-group" },
    ],
    voice:
      "Artist-first, confident, never corporate. Short sentences. Name the artist, the record and the platform. Capitalise the roster properly: Baranga, Mr Fallback, Mike 1ne, Smokie Cee. Ugandan English, no borrowed American slang.",
  },
  {
    slug: "7h-music-blog",
    handles: [
      { platform: "Instagram", handle: "@7hmusicgroup" },
      { platform: "X", handle: "@7hmusicgroup" },
      { platform: "YouTube", handle: "@7hmusicgroup" },
    ],
    voice:
      "Editorial, not promotional. Lead with the story, not the brand. Link the article. On X, the headline plus one line of why it matters. Never announce a story with 'New blog post'.",
  },
  {
    slug: "east-sound",
    handles: [],
    voice:
      "Precise, factual, unexcited. Numbers with units, dates in full. Say 'detected play', never 'proven royalty'. No regulator, broadcaster or CMO is ever named as a partner until an agreement exists in writing. If no dedicated account exists yet, draft for the 7H account and label the draft as such.",
  },
];

const GENERIC_VOICE =
  "Match the voice of the business brief. Short sentences, concrete nouns, no hype words.";

/** The markdown written into a business workspace on first run. */
export function channelFile(slug: string, businessName: string): string {
  const profile = CHANNELS.find((channel) => channel.slug === slug);
  const handles = profile?.handles.length
    ? profile.handles.map((handle) => `- **${handle.platform}**: ${handle.handle}`).join("\n")
    : "- No dedicated accounts found. Confirm with the owner before creating any.";

  return `# ${businessName} — channels

_Edit this file freely; it is read before any social work. The agent will not
overwrite it once it exists._

## Accounts

${handles}

## Voice

${profile?.voice ?? GENERIC_VOICE}

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
