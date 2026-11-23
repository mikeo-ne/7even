# Accounts to set up

_Checked 22 November 2026. Costs and API rules change; re-check before spending money._

## Read this first

**X cannot be automated for free.** Its free API tier closed to new developers on
6 February 2026. It is pay-per-use now: about **$0.015 per post**, and **$0.20 for
any post containing a link**. A label posting links to its own site would spend
more on X automation than on every other platform combined — for a platform that
is not where East African music audiences are. Post X by hand; X's own scheduler
in the compose box is free and needs no API.

**Instagram and TikTok cost nothing but patience.** Both post for free through
their APIs, but only after an app review. Until that passes, the agent writes and
you paste. That is not a failure state — it is the correct state for a label whose
posting volume is a few a week.

**LinkedIn is free to automate on a company page**, and it is where East Sound's
actual audience lives: broadcasters, regulators, labels.

---

## Start here

1. **Instagram Business** for `@7hmusicgroup`, linked to a **Facebook Page**. The
   Page is mandatory even if you never post to it.
2. **TikTok Business** for `@7hmusicgroup` — the one handle that is still free.
3. **A YouTube channel** on the label's Google account.
4. **LinkedIn Company Page** for 7H, and a separate one for East Sound.
5. **WhatsApp Channel** on the label number. In Uganda this behaves like a mailing
   list, and it is where release-day messages actually get read.

---

## Platform by platform

### Instagram — priority 1

| | |
| --- | --- |
| Account | Instagram Business or Creator, linked to a Facebook Page |
| Format | Caption 2,200 characters (125 before "more"), up to 30 hashtags, feed 4:5, Reels 9:16 |
| Automation | Free after Meta app review (`instagram_content_publish`) |
| Cost | None |
| Time | Days to weeks for review |

Why first: Baranga's audience and the label's live here.

### TikTok — priority 1

| | |
| --- | --- |
| Account | TikTok Business for the label; a Creator account for the artist |
| Format | Caption 2,200 characters, ~5 hashtags that matter, 9:16 video |
| Automation | Content Posting API, free, but needs app approval |
| Cost | None |
| Trap | An unaudited app can only post **privately**. A successful API call is not proof anyone saw it. |

This is where the roster's reach actually is.

### YouTube — priority 2

| | |
| --- | --- |
| Account | A channel on the label's Google account |
| Format | Title 100 characters, description 5,000, thumbnail text under 6 words |
| Automation | Data API uploads are free, but a new project's uploads are **locked to private** until Google audits it |
| Cost | None |

Every release needs a home for the visual and the lyric video.

### WhatsApp Channel — priority 2

| | |
| --- | --- |
| Account | A Channel on the label number under a WhatsApp Business account |
| Format | Short text, no hashtags, no link in the first message |
| Automation | None worth it — the Business API charges per conversation and is built for support |
| Cost | Channel is free |

More valuable in Uganda than a Twitter thread. Release days, airplay alerts, demo
replies.

### X — priority 3

| | |
| --- | --- |
| Account | A plain account. No Premium needed to post or to schedule natively. |
| Format | 280 characters, 2 hashtags at most |
| Automation | **Paid.** Free tier closed Feb 2026. $0.015/post, $0.20 with a link. |
| Cost | $0 to post by hand |

Keep it for industry and press reach. Do not pay to automate it.

### LinkedIn — priority 4

| | |
| --- | --- |
| Account | A Company Page for 7H and a separate one for East Sound; a personal profile to administer |
| Format | 3,000 characters, 3 hashtags, links in the first comment |
| Automation | **Free** on the developer tier once the app is verified against the Page |
| Cost | None |

The quiet win. East Sound belongs here more than on Instagram.

### Facebook — priority 5

| | |
| --- | --- |
| Account | A Page per business |
| Automation | Same app review as Instagram — one approval covers both |

You need the Page for Instagram regardless. Keep it in sync rather than posting
separately.

---

## One account to own them all

Create every brand account from **`7hmusicgroupug@gmail.com`** — it already exists
and is published on the site. Add **`mikeonerecords@gmail.com`** as a second admin
on each.

This matters more than any API: if the mailbox that owns the Instagram is lost, the
account is gone. Everything else here is recoverable. That is not.

Use a password manager, not the browser, and do not reuse the label password on an
artist's account.

---

## What the agent needs from you, in order

1. **Nothing, to start.** It drafts, you paste. Working today.
2. **X token** — pointless while it costs $0.20 a link. Skip it.
3. **LinkedIn token** — free, and unlocks the first real automation. Do this one.
4. **Meta app review** — the expensive-in-time one. Start it once Instagram is a
   Business account, because the queue is the wait.
5. **TikTok app** — after Meta, same reason.

Publishing stays off in the bridge until `SEVEN_PUBLISH=1` **and** a token exists
for that platform. A missing token produces an instruction, never a silent failure.
