# Accounts ledger

_The data lives in `public.accounts` in Supabase; `/app/setup` renders it. This
file is the readable copy, checked 22 November 2026._

`present = true` means somebody has seen the account. The agent plans only
against those. Anything else is a wish, and writing content for a handle that
does not exist wastes a week and embarrasses you.

## Present

| Business | Platform | Handle | Role | Note |
| --- | --- | --- | --- | --- |
| 7H Music Group | Facebook | Mike 1ne Page | artist | Exists. Confirm the exact Page name. |
| 7H Music Group | Facebook | 7H Music Group Page | label | Exists. This is what Instagram Business attaches to. |
| 7H Music Group | Instagram | `@_baranga` | artist | Strongest account of the set; already uses `#7hmusicgroup`. |
| 7H Music Group | TikTok | `@_baranga` | artist | Live. Where the roster's reach actually is. |
| 7H Music Group | TikTok | `@mike.1ne_` | artist | Live. Note the trailing underscore. |
| 7H Music Group | X | `@7hmusicgroup` | label | **Zero posts.** Needs one pinned post. Post by hand. |
| East Sound | X | `@EastSoundTech` | label | **Zero posts.** Bio claims 26 radio stations — still unverified. |

## Wanted, not yet real

| Business | Platform | Handle | What it takes |
| --- | --- | --- | --- |
| 7H Music Group | Instagram | `@7hmusicgroup` | Create as Business, or link the existing one to the Page. **Never both.** |
| 7H Music Group | TikTok | `@7hmusicgroup` | Handle still free at time of checking. |
| 7H Music Group | YouTube | — | Channel on the label Google account. |
| 7H Music Group | LinkedIn | — | Company Page. |
| East Sound | LinkedIn | — | Separate Company Page — the business belongs here. |
| East Sound | Instagram | — | Optional. B2B reach is thin on Instagram. |
| 7H Music Blog | — | — | Consider folding blog content into the label's accounts rather than a fourth identity. |

## Unconfirmed

**Mike 1ne on Instagram.** The TikTok handle is `@mike.1ne_`; the Instagram handle
is a guess. Confirm it exists before anything is planned against it.

## API ids to fill in as accounts are connected

The publishing call needs an object id, not a username — a Page id, an IG user id,
or a URN. Fill `api_account_id` on the row when you have it:

- Facebook Page → Page id (also goes in `SEVEN_FACEBOOK_ACCOUNT_ID`)
- Instagram → IG user id (also `SEVEN_INSTAGRAM_ACCOUNT_ID`)
- LinkedIn → `urn:li:organization:<id>` (also `SEVEN_LINKEDIN_ACCOUNT_ID`)
- YouTube → channel id
- TikTok → open id from the developer app

A token without its id is the most common reason a publish attempt 403s while
looking like a permissions problem.
