import { adapterFor } from "@7even/core";
import type { Config } from "./config.js";

/**
 * What the bridge is actually allowed to post to, and what it would take to
 * change that.
 *
 * `7even status` says whether the bridge is up. It does not say whether
 * publishing would work, which is the question that actually decides whether
 * approving a post means anything. This does, and it is deliberately blunt:
 * a platform with no token is reported as not connected, never as "ready".
 */

export type ConnectionState = {
  platform: string;
  label: string;
  /** An adapter exists, so the code path for this platform is real. */
  adapter: boolean;
  /** A token and, where the platform needs it, an account id are present. */
  connected: boolean;
  /** Which env var switches it on, so the message is actionable. */
  variables: string[];
  /** What you have to go and get, in the platform's own terms. */
  needs: string;
  /** Set when the configuration would fail in a confusing way. */
  warning?: string;
  /** True when the setting works but an assumption is being made. */
  info?: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook Page",
  linkedin: "LinkedIn page",
  tiktok: "TikTok",
  x: "X",
};

/** In value order: these are the ones a label can switch on for free today. */
const ORDER = ["instagram", "facebook", "linkedin", "tiktok", "x"];

const GRAPH_HOST = "https://graph.facebook.com/v21.0";

export function connectionStates(config: Config): ConnectionState[] {
  const tokens = config.social?.tokens ?? {};

  return ORDER.map((platform) => {
    const creds = tokens[platform];
    const adapter = adapterFor(platform) !== null;
    const label = PLATFORM_LABELS[platform] ?? platform;
    const upper = platform.toUpperCase();

    const variables = [`SEVEN_${upper}_TOKEN`];
    // Instagram and Facebook both post as an object id, not as the person
    // holding the token. LinkedIn needs the organisation URN for the same
    // reason. Without it the call 403s and looks like a permissions problem.
    if (platform === "instagram" || platform === "facebook" || platform === "linkedin") {
      variables.push(`SEVEN_${upper}_ACCOUNT_ID`);
    }
    if (platform === "instagram") variables.push("SEVEN_INSTAGRAM_API");

    // The Instagram Login API identifies the author as `me` from the token, so
    // it needs no separate account id. Every other publishing path here posts
    // as an object id and is not connected without one.
    const needsAccountId =
      platform === "facebook" ||
      platform === "linkedin" ||
      (platform === "instagram" && creds?.extra?.api !== "instagram");

    const connected = Boolean(creds?.accessToken && (needsAccountId ? creds.accountId : true));

    let warning: string | undefined;
    let info: string | undefined;

    if (platform === "instagram" && creds?.accessToken) {
      const api = creds.extra?.api;
      if (!api || api === "facebook") {
        info =
          "using the Facebook Login path, so the account must be linked to a Page and both the token and id come from graph.facebook.com. A token generated under Instagram Login will be rejected here: set SEVEN_INSTAGRAM_API=instagram.";
      } else if (api === "instagram" && creds.accountId && !creds.extra?.host) {
        info =
          "on the Instagram Login path the author is `me` from the token, so the account id is only a record, not something sent. Fine to keep.";
      }
    }

    if (platform === "facebook" && creds?.accessToken && !creds.accountId) {
      warning = "a user token cannot post as a Page. Put the Page id in SEVEN_FACEBOOK_ACCOUNT_ID.";
    }

    if (platform === "linkedin" && creds?.accountId && !creds.accountId.startsWith("urn:li:")) {
      warning = "the author must be a URN, e.g. urn:li:organization:12345 — not a bare number.";
    }

    return {
      platform,
      label,
      adapter,
      connected,
      variables,
      needs: adapterFor(platform)?.requirements ?? "No adapter — publishing here is manual.",
      warning,
      info,
    };
  });
}

/**
 * The one pairing mistake that costs the most time: tokens issued for one host
 * sent to the other. Returns notes worth printing when something is off.
 */
export function pairingNotes(config: Config): string[] {
  const notes: string[] = [];
  const tokens = config.social?.tokens ?? {};

  if (
    tokens.instagram?.accessToken &&
    !tokens.instagram?.accountId &&
    tokens.instagram?.extra?.api !== "instagram"
  ) {
    notes.push(
      "Instagram has a token but no account id. Both are needed: the token says who you are, the id says which account to post to.",
    );
  }

  if (!config.social?.publishEnabled) {
    notes.push(
      "Publishing is switched off. Approving a post will not send anything until SEVEN_PUBLISH=1 is set and the bridge is restarted.",
    );
  }

  return notes;
}

/** A block to print after `7even status`, readable on a laptop at 2am. */
export function connectionsReport(config: Config): string[] {
  const states = connectionStates(config);
  const lines: string[] = [];

  lines.push("");
  lines.push("  Publishing");
  lines.push("  ──────────");

  for (const state of states) {
    const mark = state.connected ? "✓" : "·";
    lines.push(`  ${mark} ${state.label.padEnd(16)} ${state.connected ? "connected" : "not connected"}`);
    if (!state.connected) lines.push(`    ${state.variables.join(" + ")}`);
    if (state.info) lines.push(`    · ${state.info}`);
    if (state.warning) lines.push(`    ! ${state.warning}`);
  }

  lines.push(
    `  ${config.social?.publishEnabled ? "✓" : "·"} ${"sending".padEnd(16)} ${
      config.social?.publishEnabled ? "on" : "off (SEVEN_PUBLISH=1)"
    }`,
  );

  const notes = pairingNotes(config);
  if (notes.length > 0) {
    lines.push("");
    for (const note of notes) lines.push(`  ! ${note}`);
  }

  return lines;
}
