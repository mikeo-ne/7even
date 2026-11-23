/**
 * Publishing adapters.
 *
 * One interface, several platforms, and a clear answer for each about whether it
 * can actually post. The honest state:
 *
 *   x          works today with a user-context OAuth 2.0 token on a paid tier.
 *   instagram  needs an Instagram Business account, a Facebook Page, and an app
 *              that has passed Meta's review. Implemented against the Graph API;
 *              unusable until that review exists.
 *   tiktok     needs the Content Posting API and an approved app. TikTok also
 *              only accepts an unaudited client's posts as private.
 *   others     no adapter. Never silently succeed — refuse loudly.
 *
 * A missing credential is not an error to retry; it is a reason to tell the
 * owner exactly what to go and get.
 */

import type { Post, PublishResult } from "./types.js";

export type PublishContext = {
  /** Long-lived tokens keyed by platform, from ~/.7even/config.json. */
  tokens: Partial<Record<string, { accessToken: string; accountId?: string; extra?: Record<string, string> }>>;
  /** Where media lives, so a relative path can be made absolute before upload. */
  publicUrl?: string;
  fetchImpl?: typeof fetch;
};

export type Adapter = {
  platform: string;
  /** What this needs before it can post, in words the owner can act on. */
  requirements: string;
  publish: (post: Post, ctx: PublishContext) => Promise<PublishResult>;
};

const notConfigured = (platform: string, requirements: string): PublishResult => ({
  ok: false,
  needsHuman: true,
  error: `${platform} is not connected. ${requirements}`,
});

/* --------------------------------------------------------------------- X --- */

/**
 * X API v2. Threads are posted as a reply chain: each tweet replies to the one
 * before it, and a partial failure leaves an honest half-thread rather than
 * pretending otherwise.
 */
const x: Adapter = {
  platform: "x",
  requirements:
    "An X app with OAuth 2.0 user context and a paid API tier. Put the user token in config.social.tokens.x.accessToken.",
  publish: async (post, ctx) => {
    const token = ctx.tokens.x?.accessToken;
    if (!token) return notConfigured("X", x.requirements);
    if (post.status !== "approved") return { ok: false, error: "post is not approved" };

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const body = post.caption.trim();
    const chunks = post.format === "thread" ? splitThread(body, 280) : [body];

    if (chunks.some((chunk) => [...chunk].length > 280)) {
      return { ok: false, error: "a tweet exceeds 280 characters", needsHuman: true };
    }

    let previousId: string | undefined;
    const ids: string[] = [];

    for (const chunk of chunks) {
      const response = await fetchImpl("https://api.x.com/2/tweets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: chunk,
          ...(previousId ? { reply: { in_reply_to_tweet_id: previousId } } : {}),
        }),
      });

      if (!response.ok) {
        const detail = await safeText(response);
        return {
          ok: false,
          error: `X rejected the post (${response.status}): ${detail}${ids.length ? ` — ${ids.length} earlier tweet(s) already published` : ""}`,
          externalId: ids[0],
        };
      }

      const json = (await response.json()) as { data?: { id?: string } };
      previousId = json.data?.id;
      if (previousId) ids.push(previousId);
    }

    return { ok: true, externalId: ids[0] };
  },
};

/* --------------------------------------------------------------- Instagram --- */

/**
 * Instagram publishing, two-step: create a media container, then publish it.
 * Carousels need child containers first. Reels need a video container that is
 * polled until Meta has finished ingesting it.
 *
 * Two login paths reach the same endpoints, and the difference decides whether
 * you wait weeks for an app review:
 *
 *   Instagram Login  host graph.instagram.com, scopes instagram_business_*,
 *                    no Facebook Page needed. This is the path for an account
 *                    you own, and Standard Access covers it with no review.
 *                    It is NOT the Graph API: it lives at /v21.0/me/... behind
 *                    a prefix of its own, and it takes graph.instagram.com
 *                    tokens only.
 *   Facebook Login   host graph.facebook.com, scopes instagram_*, and the IG
 *                    account must be linked to a Page.
 *
 * The token only works on the host that issued it, and mixing them up looks
 * like a permissions bug rather than a wrong URL. So the path is explicit:
 * `extra.api` is "instagram" or "facebook", and `extra.host` can override the
 * base URL if Meta moves it again. Defaults to the Graph host, so an existing
 * Page token keeps working untouched.
 */
const instagram: Adapter = {
  platform: "instagram",
  requirements:
    "An Instagram professional (Business or Creator) account and a Meta app you control, with the account added as a tester in the app dashboard. Simplest path: Instagram Login (graph.instagram.com, instagram_business_content_publish) needs no Facebook Page and no app review. Put the IG user id in config.social.tokens.instagram.accountId and set extra.host if you are on the graph.facebook.com path.",
  publish: async (post, ctx) => {
    const creds = ctx.tokens.instagram;
    // The Instagram Login API does not take an account id — the token is the
    // account. Requiring one here would refuse a perfectly valid connection.
    const needsAccountId = creds?.extra?.api !== "instagram";
    if (!creds?.accessToken || (needsAccountId && !creds.accountId)) {
      return notConfigured("Instagram", instagram.requirements);
    }
    if (post.status !== "approved") return { ok: false, error: "post is not approved" };
    if (post.media_urls.length === 0) {
      return { ok: false, error: "Instagram needs at least one public image or video URL" };
    }
    const absolute = post.media_urls.map((url) => absolutise(url, ctx.publicUrl));
    if (absolute.some((url) => !url)) {
      return { ok: false, error: "media is not publicly reachable; Instagram fetches it by URL" };
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;

    // Instagram Login addresses the author as `me`, because the token is the
    // identity. The Graph path addresses the IG user id under the Page's app.
    const loginApi = creds.extra?.api === "instagram";
    const host = (
      creds.extra?.host ??
      (loginApi ? "https://graph.instagram.com/v21.0" : "https://graph.facebook.com/v21.0")
    ).replace(/\/$/, "");
    const base = loginApi ? `${host}/me` : `${host}/${creds.accountId}`;
    const caption = withTags(post);

    try {
      if (post.format === "carousel") {
        const children: string[] = [];
        for (const url of absolute) {
          const child = await graphPost(fetchImpl, `${base}/media`, {
            image_url: url!,
            is_carousel_item: "true",
            access_token: creds.accessToken,
          });
          children.push(child);
        }
        const container = await graphPost(fetchImpl, `${base}/media`, {
          media_type: "CAROUSEL",
          children: children.join(","),
          caption,
          access_token: creds.accessToken,
        });
        const id = await graphPublish(fetchImpl, base, container, creds.accessToken);
        return { ok: true, externalId: id };
      }

      const isVideo = post.format === "reel" || post.format === "video";
      const container = await graphPost(fetchImpl, `${base}/media`, {
        ...(isVideo
          ? { media_type: post.format === "reel" ? "REELS" : "VIDEO", video_url: absolute[0]! }
          : { image_url: absolute[0]! }),
        caption,
        access_token: creds.accessToken,
      });

      if (isVideo) await waitForContainer(fetchImpl, container, creds.accessToken, host);

      const id = await graphPublish(fetchImpl, base, container, creds.accessToken);
      return { ok: true, externalId: id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
};

/* ------------------------------------------------------------------ TikTok --- */

/**
 * TikTok Content Posting API (direct post). An unaudited app can only post to
 * private, which the API enforces — so a successful call here is not proof the
 * post is visible. Say so rather than let the owner assume it went public.
 */
const tiktok: Adapter = {
  platform: "tiktok",
  requirements:
    "A TikTok developer app with video.publish scope, and audit approval for public posting. Unaudited apps can only post privately. Put the access token in config.social.tokens.tiktok.accessToken.",
  publish: async (post, ctx) => {
    const creds = ctx.tokens.tiktok;
    if (!creds?.accessToken) return notConfigured("TikTok", tiktok.requirements);
    if (post.status !== "approved") return { ok: false, error: "post is not approved" };
    if (post.format !== "video" && post.format !== "reel") {
      return { ok: false, error: "TikTok direct post takes a video, not an image" };
    }

    const absolute = post.media_urls.map((url) => absolutise(url, ctx.publicUrl));
    if (!absolute[0]) return { ok: false, error: "video is not publicly reachable" };

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const response = await fetchImpl("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: withTags(post).slice(0, 2200),
          privacy_level: "SELF_ONLY",
        },
        source_info: { source: "PULL_FROM_URL", video_url: absolute[0] },
      }),
    });

    const json = (await response.json().catch(() => ({}))) as {
      data?: { publish_id?: string };
      error?: { code?: string; message?: string };
    };

    if (!response.ok || json.error?.code) {
      return {
        ok: false,
        error: `TikTok rejected the post: ${json.error?.message ?? response.status}`,
        needsHuman: true,
      };
    }

    return {
      ok: true,
      externalId: json.data?.publish_id,
    };
  },
};


/* ---------------------------------------------------------------- LinkedIn --- */

/**
 * LinkedIn Posts API. The only platform here that posts to a company page on a
 * free developer tier — which makes it the best value automation of the set, and
 * the right home for East Sound's argument and 7H's partner news.
 *
 * Needs a Company Page, an app verified against it (Community Management API),
 * and an author URN in the form urn:li:organization:<id>.
 */
const linkedin: Adapter = {
  platform: "linkedin",
  requirements:
    "A LinkedIn Company Page, an app with the Community Management API verified against it, and the organisation URN in config.social.tokens.linkedin.accountId (urn:li:organization:12345).",
  publish: async (post, ctx) => {
    const creds = ctx.tokens.linkedin;
    if (!creds?.accessToken || !creds.accountId) {
      return notConfigured("LinkedIn", linkedin.requirements);
    }
    if (post.status !== "approved") return { ok: false, error: "post is not approved" };

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const text = [post.caption.trim(), post.hashtags.join(" ")].filter(Boolean).join("\n\n");

    const response = await fetchImpl("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202409",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: creds.accountId,
        commentary: text,
        visibility: "PUBLIC",
        distribution: { feedDistribution: "MAIN_FEED" },
        lifecycleState: "PUBLISHED",
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `LinkedIn rejected the post (${response.status}): ${await safeText(response)}`,
        needsHuman: response.status === 401 || response.status === 403,
      };
    }

    // LinkedIn returns the post URN in a header, not the body.
    const id = response.headers.get("x-restli-id") ?? undefined;
    return { ok: true, externalId: id };
  },
};

/* --------------------------------------------------------------- Facebook --- */

/**
 * Facebook Page posts. Same app, same review status as Instagram on the Graph
 * host — and for a Page you administer, Standard Access is enough: no review,
 * no payment. The Page is mandatory for Instagram anyway, so this is the one
 * extra platform that costs nothing at all once the Page exists.
 *
 * A Page posts with a Page access token, not a user token. `accountId` is the
 * Page id; that distinction is the usual reason this call 403s.
 */
const facebook: Adapter = {
  platform: "facebook",
  requirements:
    "A Facebook Page you administer and a Page access token with pages_manage_posts (Standard Access, no review, for a Page you own). Put the Page id in config.social.tokens.facebook.accountId.",
  publish: async (post, ctx) => {
    const creds = ctx.tokens.facebook;
    if (!creds?.accessToken || !creds.accountId) {
      return notConfigured("Facebook", facebook.requirements);
    }
    if (post.status !== "approved") return { ok: false, error: "post is not approved" };

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const base = `https://graph.facebook.com/v21.0/${creds.accountId}`;
    const message = withTags(post);
    const absolute = post.media_urls.map((url) => absolutise(url, ctx.publicUrl));

    try {
      // A photo post draws more reach than a bare status update, so when there
      // is an image, use the photo endpoint rather than the feed one.
      const first = absolute[0];
      if (first) {
        const isVideo = post.format === "video" || post.format === "reel";
        const id = await graphPost(
          fetchImpl,
          isVideo ? `${base}/videos` : `${base}/photos`,
          isVideo
            ? { file_url: first, description: message, access_token: creds.accessToken }
            : { url: first, caption: message, access_token: creds.accessToken },
        );
        return { ok: true, externalId: id };
      }

      const id = await graphPost(fetchImpl, `${base}/feed`, {
        message,
        ...(post.link ? { link: post.link } : {}),
        access_token: creds.accessToken,
      });
      return { ok: true, externalId: id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
};

/* ---------------------------------------------------------------- helpers --- */

function withTags(post: Post): string {
  const tags = post.hashtags.join(" ");
  return tags ? `${post.caption}\n\n${tags}`.trim() : post.caption;
}

function absolutise(url: string, publicUrl?: string): string | undefined {
  if (/^https?:\/\//.test(url)) return url;
  if (!publicUrl) return undefined;
  return `${publicUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 400);
  } catch {
    return "(no body)";
  }
}

async function graphPost(
  fetchImpl: typeof fetch,
  url: string,
  params: Record<string, string>,
): Promise<string> {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? `Graph API returned ${response.status}`);
  }
  return json.id;
}

async function graphPublish(
  fetchImpl: typeof fetch,
  base: string,
  containerId: string,
  token: string,
): Promise<string> {
  const response = await fetchImpl(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }).toString(),
  });
  const json = (await response.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? `publish failed with ${response.status}`);
  }
  return json.id;
}

/** Video containers are not publishable until Meta finishes ingesting them. */
async function waitForContainer(
  fetchImpl: typeof fetch,
  containerId: string,
  token: string,
  host = "https://graph.facebook.com/v21.0",
  timeoutMs = 180_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetchImpl(
      `${host.replace(/\/$/, "")}/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`,
    );
    const json = (await response.json().catch(() => ({}))) as { status_code?: string };
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR") throw new Error("Instagram could not process the video");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Instagram did not finish processing the video in time");
}

/** Split text into numbered tweet-sized chunks at sentence boundaries. */
export function splitThread(text: string, limit: number): string[] {
  // Split after sentence punctuation, keeping the space that follows it. Joining
  // trimmed fragments instead glues words together ("Three.Four."), which reads
  // as a typo once it is on the timeline.
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;

    if ([...candidate].length <= limit) {
      current = candidate;
      continue;
    }

    push();

    // A single sentence longer than the limit is cut rather than dropped, and
    // the remainder continues in the next chunk.
    let rest = sentence;
    while ([...rest].length > limit) {
      chunks.push([...rest].slice(0, limit).join(""));
      rest = [...rest].slice(limit).join("");
    }
    current = rest;
  }

  push();
  return chunks;
}

export const ADAPTERS: Record<string, Adapter> = { x, instagram, tiktok, linkedin, facebook };

/** Everything that is registered but cannot post, so the UI can say so plainly. */
export const SUPPORTED = ["x", "instagram", "tiktok", "linkedin", "facebook"] as const;
export const UNSUPPORTED = ["youtube"] as const;

export function adapterFor(platform: string): Adapter | null {
  return ADAPTERS[platform] ?? null;
}

