#!/usr/bin/env node
/**
 * Generate docs/channels-setup.md — the claim sheet for every handle that does
 * not exist yet, plus the first post for every account that has never posted.
 *
 * Reads the verified state from packages/core so the doc cannot drift from what
 * the agent believes. Run after `npm run build --workspace @7even/core`:
 *
 *   node scripts/channel-setup.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import { CHANNELS } from "../packages/core/dist/channels.js";

/** Platform bio limits, enforced below. */
const LIMITS = { X: 160, Instagram: 150, TikTok: 80 };

/** Hand-written copy for each account that needs creating. */
const SETUP = {
  "7h-music-group|TikTok|@7hmusicgroup": {
    displayName: "7H Music Group",
    bio: "Kampala label. Baranga, Mr Fallback, Mike 1ne, Smokie Cee.",
    link: "https://7hmusicgroupug.vercel.app",
    category: "Record label",
    firstPost:
      "We are 7H Music Group. Kampala label, in-house studio, four artists and a straight answer for anyone who sends us music.\n\nBaranga. Mr Fallback. Mike 1ne. Smokie Cee.\n\nDemos: 7hmusicgroupug.vercel.app",
  },
  "7h-music-blog|X|@7hmusicblog": {
    displayName: "7H Music Blog",
    bio: "The voice of the independent sound. Uganda and Kenya desks.",
    link: "https://7h-music-blog.vercel.app",
    category: "Media / news",
    firstPost:
      "We cover East African music without the press release. Uganda desk, Kenya desk, and the business behind both.\n\n66 stories in. More this week.",
  },
  "7h-music-blog|TikTok|@7hmusic.blog": {
    displayName: "7H Music Blog",
    bio: "East African music, without the press release.",
    link: "https://7h-music-blog.vercel.app",
    category: "Media / news",
    firstPost:
      "One story, ninety seconds, no press release. Uganda and Kenya desks, every week.",
  },
  "east-sound|TikTok|@eastsoundtech": {
    displayName: "East Sound",
    bio: "Radio airplay evidence for East Africa.",
    link: "https://eastsound.vercel.app",
    category: "Technology",
    firstPost:
      "Your song played on radio in Gulu at 2am. Here is the clip, the station and the time.\n\nThat is the product. Free while we build the panel.",
  },
};

/** First posts for accounts that exist but have never posted. */
const FIRST_POST = {
  "7h-music-group|X|@7hmusicgroup": [
    "7H Music Group is a label, a studio and a straight answer for anyone who sends us music.",
    "Baranga. Mr Fallback. Mike 1ne. Smokie Cee.",
    "We reply to every demo within 14 days: 7hmusicgroupug.vercel.app",
    "",
    "Pinned. 🎵",
  ].join("\n"),
  "east-sound|X|@EastSoundTech": [
    "Ugandan radio plays music all day. Almost nobody can prove what played, or when.",
    "",
    "East Sound fingerprints station streams and matches each play back to the people who own the song.",
    "",
    "Free while we build the panel: eastsound.vercel.app",
  ].join("\n"),
};

const rows = [];
for (const channel of CHANNELS) {
  for (const account of [...channel.brand, ...channel.artists]) {
    rows.push({ channel, account, key: `${channel.slug}|${account.platform}|${account.handle}` });
  }
}

// Look up the human-facing business name.
const NAMES = {
  "7h-music-group": "7H Music Group",
  "7h-music-blog": "7H Music Blog",
  "east-sound": "East Sound Technologies",
};

const toCreate = rows.filter((row) => row.account.state === "available");
const neverPosted = rows.filter((row) => row.account.state === "empty");

const problems = [];
const sections = [];

sections.push(`# Channels to set up

Generated from \`packages/core/src/channels.ts\` by \`scripts/channel-setup.mjs\`.
Every handle below was checked on 22 November 2026.

7even cannot create accounts: that needs a verified human with a phone. What it
can do is remove every decision — the handle, the bio, the link, the first post,
and the limit each one has to fit inside. Do this once, then tell the agent, and
it will plan against the real accounts.

**${toCreate.length} accounts to create · ${neverPosted.length} that exist but have never posted.**
`);

if (toCreate.length > 0) {
  sections.push("\n---\n\n## Create these\n");
  for (const { channel, account, key } of toCreate) {
    const setup = SETUP[key];
    if (!setup) {
      problems.push(`No setup copy written for ${key}`);
      continue;
    }
    const limit = LIMITS[account.platform];
    const bioLength = [...setup.bio].length;
    if (limit && bioLength > limit) {
      problems.push(`${key} bio is ${bioLength} characters, limit is ${limit}`);
    }
    const postLimit = account.platform === "X" ? 280 : account.platform === "TikTok" ? 2200 : 2200;
    const postLength = [...setup.firstPost].length;
    if (postLength > postLimit) {
      problems.push(`${key} first post is ${postLength} characters, limit is ${postLimit}`);
    }

    sections.push(`
### ${NAMES[channel.slug]} — ${account.platform} ${account.handle}

Claim it at ${account.platform === "X" ? "https://x.com/i/flow/signup" : "https://www.tiktok.com/signup"} — search the handle first to confirm it is still free.

| Field | Value |
| --- | --- |
| Handle | \`${account.handle}\` |
| Display name | ${setup.displayName} |
| Bio | ${setup.bio} |
| Bio length | ${bioLength} / ${limit ?? "—"} characters |
| Link | ${setup.link} |
| Category | ${setup.category} |
| Profile photo | The 7H mark on \`#07070a\`, 1:1, no text — it has to survive being 32px |
| Banner | Roster or chart image, 1500×500 |

**First post** (${postLength} / ${postLimit} characters):

\`\`\`text
${setup.firstPost}
\`\`\`

${account.note ? `> ${account.note}` : ""}
`);
  }
}

if (neverPosted.length > 0) {
  sections.push("\n---\n\n## Already exist, but empty\n");
  for (const { channel, account, key } of neverPosted) {
    const post = FIRST_POST[key];
    const postLength = post ? [...post].length : 0;
    if (post && account.platform === "X" && postLength > 280) {
      problems.push(`${key} first post is ${postLength} characters, limit is 280`);
    }
    sections.push(`
### ${NAMES[channel.slug]} — ${account.platform} ${account.handle}

${account.note ?? ""}

${post ? `**First post** (${postLength} / ${account.platform === "X" ? 280 : 2200} characters):\n\n\`\`\`text\n${post}\n\`\`\`\n\nPost it as a single post, then pin it. Do not open with a thread.` : "_No first post drafted._"}
`);
  }
}

sections.push(`
---

## After you create them

1. Sign in on the Mac and keep the sessions alive there; the agent works from that machine.
2. Tell 7even the handles exist, or edit \`CHANNELS.md\` in each workspace — the agent reads it before any social work.
3. Then the Monday plan can allocate real accounts instead of drafting "for owner to place".

## Deliberately not in this list

- **Smokie Cee's Instagram.** His TikTok is active; no Instagram is published anywhere. That is his account to make, not the label's.
- **Any automated posting.** Nothing here connects an API. The agent writes, you publish.
`);

const doc = sections.join("\n");
await mkdir("docs", { recursive: true });
await writeFile("docs/channels-setup.md", doc, "utf8");

if (problems.length > 0) {
  console.error("Copy does not fit the platform limits:");
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  process.exit(1);
}

console.log(`docs/channels-setup.md — ${toCreate.length} to create, ${neverPosted.length} to fill, ${doc.length} chars, all copy within limits.`);
