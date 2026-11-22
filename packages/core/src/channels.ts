/**
 * Channel registry — who posts where, and who we are not working on.
 *
 * Every entry was checked on 2026-11-22, either by opening the profile or from
 * the owner directly. States mean exactly what they say:
 *
 *   confirmed       opened it; name and posts rendered
 *   empty           exists, has never posted
 *   owner-confirmed owner supplied it; platform blocks logged-out checks
 *   deferred        handle is free, owner will register it later — do not plan on it
 *   missing         does not resolve
 *   unchecked       linked from a site, not opened
 *
 * The active set is deliberate. Two of the four roster artists are paused by the
 * owner, and no content is planned for them. Their verified handles are kept so
 * that nothing has to be re-researched when they come back.
 */

export type Platform = "Instagram" | "TikTok" | "X" | "YouTube" | "SoundCloud" | "Facebook";

export type AccountState =
  | "confirmed"
  | "empty"
  | "owner-confirmed"
  | "deferred"
  | "missing"
  | "unchecked";

export type Account = {
  platform: Platform;
  handle: string;
  url: string;
  state: AccountState;
  /** Present when the account belongs to a roster artist rather than the brand. */
  artist?: string;
  /** True when this account belongs to the owner personally. */
  owner?: boolean;
  note?: string;
};

export type PausedArtist = {
  name: string;
  reason: string;
  handles: Account[];
};

export type BusinessChannels = {
  slug: string;
  /** Accounts to plan and post against now. */
  brand: Account[];
  /** Free handles the owner will register later. Never planned against. */
  deferred: Account[];
  /** Active roster accounts. */
  artists: Account[];
  /** Artists explicitly out of scope. Do not write, tag or plan for these. */
  paused: PausedArtist[];
  voice: string;
  gaps: string;
};

const ig = (handle: string, state: AccountState, extra: Partial<Account> = {}): Account => ({
  platform: "Instagram",
  handle,
  url: `https://www.instagram.com/${handle.replace(/^@/, "")}/`,
  state,
  ...extra,
});

const tt = (handle: string, state: AccountState, extra: Partial<Account> = {}): Account => ({
  platform: "TikTok",
  handle,
  url: `https://www.tiktok.com/@${handle.replace(/^@/, "")}`,
  state,
  ...extra,
});

const x = (handle: string, state: AccountState, extra: Partial<Account> = {}): Account => ({
  platform: "X",
  handle,
  url: `https://x.com/${handle.replace(/^@/, "")}`,
  state,
  ...extra,
});

const yt = (handle: string, state: AccountState, extra: Partial<Account> = {}): Account => ({
  platform: "YouTube",
  handle,
  url: `https://www.youtube.com/@${handle.replace(/^@/, "")}`,
  state,
  ...extra,
});

export const CHANNELS: BusinessChannels[] = [
  {
    slug: "7h-music-group",
    brand: [
      ig("@7hmusicgroup", "owner-confirmed"),
      x("@7hmusicgroup", "empty", {
        note: "Joined Oct 2026. 0 posts, 0 followers. Has never posted — the first one is the introduction, so do not open with a thread.",
      }),
      yt("@7hmusicgroup", "unchecked"),
      {
        platform: "SoundCloud",
        handle: "7h-music-group",
        url: "https://soundcloud.com/7h-music-group",
        state: "unchecked",
      },
    ],
    deferred: [
      tt("@7hmusicgroup", "deferred", {
        note: "Free, and the same handle is taken on Instagram and X, so it is worth claiming early. Owner will register it later — do not plan TikTok for the label until then.",
      }),
    ],
    artists: [
      ig("@_baranga._", "owner-confirmed", { artist: "Baranga" }),
      tt("@_baranga", "confirmed", {
        artist: "Baranga",
        note: "Posts consistently and already uses #7hmusicgroup in his own captions. The strongest reach on the roster by a distance.",
      }),
      yt("@baranga_music", "unchecked", { artist: "Baranga" }),
      ig("@mike.1ne_", "owner-confirmed", { artist: "Mike 1ne", owner: true }),
      tt("@mike.1ne_", "confirmed", {
        artist: "Mike 1ne",
        owner: true,
        note: "Producer-led: studio sessions, beat breakdowns, mixing technique, sync licensing. Talks to other producers, not to fans.",
      }),
    ],
    paused: [
      {
        name: "Mr Fallback",
        reason:
          "Out of scope by owner instruction. Do not post about him, tag him, add him to a release plan or mention him in a caption until the owner lifts this. Note his TikTok repeatedly credits 2PUFF Records, which is unresolved.",
        handles: [
          ig("@mr_fallback01", "owner-confirmed"),
          tt("@mrfallback6", "confirmed"),
          yt("@mrfallback01", "unchecked"),
        ],
      },
      {
        name: "Smokie Cee",
        reason:
          "Out of scope by owner instruction. Do not post about him, tag him or plan around his release. He is the newest signing and has no Instagram published anywhere — that is for him and the owner to settle, not for the agent.",
        handles: [tt("@smokie_ceee", "confirmed")],
      },
    ],
    voice:
      "Artist-first, confident, never corporate. Short sentences. Name the artist, the record and the platform. Ugandan English, no borrowed American slang. Two voices now: label posts (third person, '7H') and Mike 1ne's own accounts (first person, 'I' — he is the owner and the producer, so he writes as himself, not as the label).",
    gaps:
      "Work with Instagram, X, YouTube and SoundCloud for the label, and Instagram and TikTok for Baranga and Mike 1ne. The label X account has never posted. The label has no TikTok yet: until it does, TikTok is artist-led, and Baranga's account is where the reach already is. Mike 1ne's accounts belong to the owner personally: drafts for them are first person and still need approval, because posting as the owner is not the same as posting as the label.",
  },
  {
    slug: "7h-music-blog",
    brand: [
      ig("@7hmusic.blog", "owner-confirmed", {
        note: "The blog's own account. Post editorial here, never from the label's handle.",
      }),
    ],
    deferred: [
      x("@7hmusicblog", "deferred", {
        note: "Verified free on X. Owner will register it later; hold any X drafts until then.",
      }),
      tt("@7hmusic.blog", "deferred", {
        note: "Free, and it matches the Instagram handle exactly. Owner will register it later.",
      }),
    ],
    artists: [
      ig("@_baranga._", "owner-confirmed", { artist: "Baranga" }),
      ig("@mike.1ne_", "owner-confirmed", { artist: "Mike 1ne", owner: true }),
    ],
    paused: [
      {
        name: "Mr Fallback",
        reason:
          "Out of scope by owner instruction. Report on him only if a story is unavoidable and editorially significant, and ask first.",
        handles: [ig("@mr_fallback01", "owner-confirmed")],
      },
      {
        name: "Smokie Cee",
        reason: "Out of scope by owner instruction. No coverage, no tagging, no planning.",
        handles: [tt("@smokie_ceee", "confirmed")],
      },
    ],
    voice:
      "Editorial, not promotional. Lead with the story, not the brand. Link the article. Never announce a story with 'New blog post'. Bylined 7H Music Blog.",
    gaps:
      "Instagram only, on the blog's own account, which settles the independence problem. X and TikTok are unregistered: draft those posts into the workspace and label them 'for owner to place' rather than planning a schedule. Coverage in scope is Baranga and Mike 1ne; Mr Fallback and Smokie Cee are paused.",
  },
  {
    slug: "east-sound",
    brand: [
      ig("@eas_tsound", "owner-confirmed"),
      x("@EastSoundTech", "empty", {
        note: "Joined Nov 2026. 0 posts, 1 follower. The bio claims 26 stations monitored live — confirm that number before repeating it anywhere.",
      }),
    ],
    deferred: [
      tt("@eastsoundtech", "deferred", {
        note: "Free. Owner will register it later. @eas_tsound is also free on TikTok if the handle should match Instagram.",
      }),
    ],
    artists: [],
    paused: [],
    voice:
      "Precise, factual, unexcited. Numbers with units, dates in full. Say 'detected play', never 'proven royalty'. No regulator, broadcaster or CMO is ever named as a partner until an agreement exists in writing. Share the parentage, do not sound like a record label.",
    gaps:
      "Instagram and X, both empty and both new. There is no TikTok yet, so do not plan one. This audience is broadcasters, regulators, labels and artists chasing royalties: X carries the argument, Instagram carries the evidence — charts, clips, coverage. The station count in the X bio is unverified, so no post may repeat it until the owner confirms it.",
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
- Never tag an artist, brand or station without confirming the relationship is current.
- Respect the paused list. If a person is paused, they do not appear in a post, a tag, a plan or a thread.`;

export const CADENCE_RULES = `## Cadence

- Plan in weekly blocks, published every Monday morning for the week ahead.
- Per active artist: 3-5 posts a week while a release is live, 1-2 a week otherwise.
- A release gets a defined arc: announce, tease, drop, proof (first plays/screenshots), thank-you, then catalogue.
- TikTok is artist-led: Baranga's account carries the reach, Mike 1ne's carries the craft. Do not mirror the same cut to both.
- Instagram is label-led. X is where the label introduces itself properly for the first time.
- Blog: each published story yields one post on its own Instagram, and, if it concerns Baranga or Mike 1ne, a distinct post from a different angle.
- East Sound: X for the argument, Instagram for the evidence. No TikTok yet.`;

const STATE_LABEL: Record<AccountState, string> = {
  confirmed: "verified — posts present",
  empty: "exists but has never posted",
  "owner-confirmed": "supplied by the owner; not openable logged-out",
  deferred: "free, not created yet — do not plan on it",
  missing: "does not resolve — do not use",
  unchecked: "linked from the site, not opened",
};

function accountLines(accounts: Account[]): string {
  if (accounts.length === 0) return "- None.";
  return accounts
    .map((account) => {
      const who = account.artist ? `${account.artist}: ` : "";
      const owner = account.owner ? " (owner's own account)" : "";
      const head = `- ${who}**${account.platform}** ${account.handle}${owner} — ${STATE_LABEL[account.state]}`;
      const note = account.note ? `\n  ${account.note}` : "";
      const url = account.url ? `\n  ${account.url}` : "";
      return `${head}${note}${url}`;
    })
    .join("\n");
}

/** The markdown written into a business workspace on first run. */
export function channelFile(slug: string, businessName: string): string {
  const profile = CHANNELS.find((channel) => channel.slug === slug);

  const brand = accountLines(profile?.brand ?? []);
  const deferred = accountLines(profile?.deferred ?? []);
  const artists = accountLines(profile?.artists ?? []);
  const paused = profile?.paused.length
    ? profile.paused
        .map(
          (person) =>
            `- **${person.name}** — ${person.reason}\n  Handles on record: ${person.handles
              .map((handle) => `${handle.platform} ${handle.handle}`)
              .join(", ")}`,
        )
        .join("\n")
    : "- Nobody is paused.";

  return `# ${businessName} — channels

_Checked 22 November 2026. Edit this file freely; it is read before any social
work and the agent will not overwrite it once it exists._

## Use these now

${brand}

## Active artists

${artists}

## Paused — do not plan, tag or post about these people

${paused}

## Not created yet — do not plan on these

${deferred}

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
