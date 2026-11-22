import type { AgentSkill } from "./a2a.js";

/**
 * The agent's published A2A skills. Every skill is really "talk to Claude Code
 * with this framing" — the value is in the guardrails and the business context
 * the bridge injects before the model sees the request.
 */
export const SKILLS: AgentSkill[] = [
  {
    id: "business-ops",
    name: "Run a business task",
    description:
      "Carry out an operational task for one of the owner's businesses: draft replies, reconcile numbers, chase a release, prepare a payout — anything that needs judgement plus access to the local workspace.",
    tags: ["operations", "business", "admin"],
    examples: [
      "Reconcile last month's Spotify statement against our catalogue",
      "Draft a follow-up to the distributor about the missing royalty period",
      "Summarise what changed in the shop's stock this week",
    ],
  },
  {
    id: "research",
    name: "Research and report",
    description:
      "Investigate a question using the web and the local workspace, then return a sourced short report that can be read on a phone.",
    tags: ["research", "analysis", "report"],
    examples: [
      "What are the current payout thresholds for Boomplay and Audiomack?",
      "Compare our release cadence this year to last year",
    ],
  },
  {
    id: "delegate",
    name: "Delegate to another agent",
    description:
      "Accept a task from a peer agent, hand off a sub-task to another A2A agent, and report the combined result back to the caller.",
    tags: ["a2a", "multi-agent", "orchestration"],
    examples: [
      "Ask the accounting agent to close the month while you prepare the artist report",
    ],
  },
  {
    id: "social",
    name: "Run social and promotion",
    description:
      "Plan, write and prepare the social calendar for a brand or artist: weekly plan, post copy, alt text, captions, hashtags and a posting schedule. Publishing itself waits for approval.",
    tags: ["social", "marketing", "content", "growth"],
    examples: [
      "Plan next week's posts for Baranga's album push",
      "Turn this week's chart into an East Sound post",
      "Write five X posts for the new blog story",
    ],
  },
  {
    id: "scheduled",
    name: "Scheduled maintenance",
    description:
      "Run recurring checks the owner has enabled — daily inbox triage, weekly catalogue audit, month-end reconciliation — and only surface what needs a human.",
    tags: ["schedule", "monitoring", "routine"],
    examples: ["Daily inbox triage at 08:00", "Weekly catalogue audit on Monday"],
  },
];

export const AGENT_DESCRIPTION =
  "A personal agent that runs on your own Mac and manages your businesses: it executes tasks against local workspaces, asks before doing anything irreversible, and accepts work from other A2A agents.";
