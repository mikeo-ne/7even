# Accounts: what to do next

_Checked 22 November 2026. Access rules change; re-check before spending money._

You already have **two Facebook Pages** (Mike 1ne, 7H Music Group) and live
TikTok accounts for both artists. That changes the plan, because **a Facebook Page
you administer is the cheapest automation there is** — and it is also what
Instagram Business attaches to.

The short version:

1. **Nothing to create today to start posting.** The agent drafts, you paste.
2. **Facebook Page: free to automate immediately**, no review, because you own it.
3. **Instagram: free to automate, no review**, if you use the Instagram Login path
   on your own account. The review people wait weeks for is for posting to
   *other people's* accounts, which is not your case.
4. **LinkedIn: the one real wait.** 1–4 weeks of review. Start it, forget it.
5. **X: post by hand.** $0.015 a post, **$0.20 if the post contains a link**.

---

## The correction that saves weeks

App Review is not a toll on every API. It is the gate for **serving accounts you
do not own**. Meta calls the default tier *Standard Access*, and it covers
accounts whose owner has a role on your app — which, for a label posting to its
own Pages and its own Instagram, is always.

What that means in practice:

| Platform | Review needed for your own accounts? | What it actually needs |
| --- | --- | --- |
| Facebook Page | **No** | Page access token with `pages_manage_posts`, plus the Page id |
| Instagram | **No** on the Instagram Login path | Professional account, Meta app, account added as a tester, token |
| Instagram (Facebook Login path) | No, but the Page link is mandatory | Page token + IG user id on `graph.facebook.com` |
| LinkedIn Page | **Yes** — Community Management API, 1–4 weeks | A review by a human at LinkedIn |
| TikTok | Yes for public posting | Unaudited apps can only post privately |
| YouTube | Yes for public uploads | New projects upload privately until audited |

Two paths reach Instagram with the same published result. Pick one and stay on
it, because the token only works on the host that issued it:

- **Instagram Login** — `graph.instagram.com`, scopes `instagram_business_basic`
  and `instagram_business_content_publish`, no Facebook Page required. Posts
  address the author as `me`, because the token *is* the account.
- **Facebook Login** — `graph.facebook.com`, scopes `instagram_basic` and
  `instagram_content_publish`, IG account must be linked to a Page. Posts address
  the IG user id.

They are not the same API wearing two URLs: the paths and the identity differ, and
the token only works on the one that issued it. Sending an Instagram Login token
to the Graph host fails in a way that looks like a permissions bug.

In the bridge, `SEVEN_INSTAGRAM_API=instagram|facebook` picks the path. Leave it
unset and the adapter uses the Graph path, so an existing Page token keeps
working untouched.

---

## What exists, and what is only planned

`docs/accounts-ledger.md` is the list the agent is allowed to plan against, and
`/app/setup` renders the same data live. A handle that is not marked present is
never planned against — that rule exists because planning against a handle that
turns out not to exist is how a week of content gets written for an account
nobody can post to.

Present today: the two Facebook Pages, `@_baranga` and `@mike.1ne_` on TikTok,
`@_baranga`, `@mike.1ne_` and `@7hmusic.blog` on Instagram, `@7hmusicgroup` and
`@EastSoundTech` on X.

That is five Instagram accounts' worth of reach in two categories — label, artist
and editorial — and it means **three of the four accounts that can publish free
already exist**. What is missing is configuration, not registration.

Not yet real: a label Instagram and TikTok, a YouTube channel, LinkedIn Pages, an
East Sound Instagram, the blog's TikTok and X. Two handles are still unverified:
Baranga's Instagram (`@_baranga._` or `@_baranga`), and whether 7H Music Group is
its own Page or a section of the Mike 1ne Page.

---

## Do this, in this order

### 1. Attach the Instagram accounts to the Page (15 minutes)

- Instagram app → Settings → Account type → **Business**
- Link it to the **7H Music Group** Page
- Add `mikeonerecords@gmail.com` as an admin on both the Page and the Instagram

There is no 7H Music Group Instagram yet — the label's Instagram is the one thing
on this list that still has to be created. When you do, link it to the Page. Never
run two accounts for one brand: it splits the audience permanently, and Meta's
review treats duplicates as suspicious.

`@7hmusic.blog` is the blog's, not the label's. Editorial goes there and nowhere
else, and the label's handle must never announce a blog post.

### 2. Start the one queue that matters: LinkedIn

Create the East Sound Technologies Company Page, then apply for the Community
Management API on a developer app verified against it. This is the only item on
the list where waiting is unavoidable, and East Sound is the business that
belongs on LinkedIn — broadcasters, regulators, labels.

### 3. While that sits in a queue: post from what already works

Approve the weekly plan and use **copy for posting** on each card. Every card
gives the caption, the character count, the alt text and the trap for that
platform. That path needs no tokens and works today.

### 4. Ten minutes you keep not doing

`@7hmusicgroup` and `@EastSoundTech` have **zero posts**. An empty account reads
as abandoned. One pinned post each, posted natively, is free.

---

## One mailbox owns everything

Create every brand account from **`7hmusicgroupug@gmail.com`** — it already
exists and is published on the site. Add **`mikeonerecords@gmail.com`** as a
second admin on each.

If the mailbox that owns an account is lost, the account is gone. Everything else
here is recoverable; that is not. Use a password manager, never the browser, and
never reuse the label password on an artist's account.

---

## Truth about X

Its free API tier closed to new developers on 6 February 2026. Pay-per-use is
about **$0.015 a post**, and **$0.20 for any post containing a link**. A label
posting links to its own site would spend more on X automation than on every
other platform combined, for the platform least relevant to a Ugandan audience.

Post X by hand. X's own scheduler in the compose box is free and needs no API.

---

## What the bridge needs, per platform

| Platform | Variables | Get it from |
| --- | --- | --- |
| Instagram | `SEVEN_INSTAGRAM_TOKEN`, `SEVEN_INSTAGRAM_API=instagram` (or `facebook` + `SEVEN_INSTAGRAM_ACCOUNT_ID`) | Meta app dashboard → Instagram → API setup → Generate token |
| Facebook | `SEVEN_FACEBOOK_TOKEN`, `SEVEN_FACEBOOK_ACCOUNT_ID` | Graph API Explorer: `/me/accounts` → Page id and Page token |
| LinkedIn | `SEVEN_LINKEDIN_TOKEN`, `SEVEN_LINKEDIN_ACCOUNT_ID` (`urn:li:organization:<id>`) | After Community Management approval |
| TikTok | `SEVEN_TIKTOK_TOKEN` | TikTok developer app; private-only until audited |
| X | `SEVEN_X_TOKEN` | Not worth it while a link post costs $0.20 |

Sending stays off until **`SEVEN_PUBLISH=1`** *and* the platform's token exists.
`7even status` now prints a Publishing block that says, per platform, connected or
not, which variables are missing, and where the configuration would fail in a
confusing way — for example a Page token pointed at the Instagram Login host.
