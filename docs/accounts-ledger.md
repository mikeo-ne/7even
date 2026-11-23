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
| 7H Music Group | Instagram | `@mike.1ne_` | artist | The owner's own. **Trailing underscore** — same string as the TikTok handle. |
| 7H Music Blog | Instagram | `@7hmusic.blog` | label | The blog's own account. Editorial only, never posted from the label's handle. |
| 7H Music Group | TikTok | `@_baranga` | artist | Live. Where the roster's reach actually is. |
| 7H Music Group | TikTok | `@mike.1ne_` | artist | Live. Note the trailing underscore. |
| 7H Music Group | X | `@7hmusicgroup` | label | **Zero posts.** Needs one pinned post. Post by hand. |
| East Sound | X | `@EastSoundTech` | label | **Zero posts.** Bio claims 26 radio stations — still unverified. |

## Wanted, not yet real

| Business | Platform | Handle | What it takes |
| --- | --- | --- | --- |
| 7H Music Group | Instagram | `@7hmusicgroup` | The only Instagram the label still lacks. Create as Business, or link an existing one to the Page. **Never both.** |
| 7H Music Group | TikTok | `@7hmusicgroup` | Handle still free at time of checking. |
| 7H Music Group | YouTube | — | Channel on the label Google account. |
| 7H Music Group | LinkedIn | — | Company Page. |
| East Sound | LinkedIn | — | Separate Company Page — the business belongs here. |
| East Sound | Instagram | — | Optional. B2B reach is thin on Instagram. |
| 7H Music Blog | TikTok | `@7hmusic.blog` | Free and matches the Instagram handle exactly. Not registered. |
| 7H Music Blog | X | `@7hmusicblog` | Free on X, not registered. |

## Confirmed since the first pass

**Mike 1ne on Instagram** is `@mike.1ne_` — confirmed by the owner. The same
string as the TikTok handle, trailing underscore included, which is why it is
worth writing down rather than assuming.

**`@7hmusic.blog` exists on Instagram** — confirmed by the owner. It had been left
out of this ledger because nobody had seen it, which is the rule working as
intended: the cost of a wrong row is content written for an account that cannot
receive it.

## Still to confirm

- **Baranga's Instagram.** `channels.ts` records `@_baranga._`; TikTok is
  `@_baranga` and earlier checks saw `@_baranga` on Instagram too. One of the two
  is written down wrong, and a post to the wrong one does not fail — it goes to
  whichever account is real and simply never reaches him.
- **Whether the 7H Music Group Page is separate from the Mike 1ne Page.** Both are
  recorded as present because the owner named both. If 7H is a section of the
  Mike 1ne Page rather than a Page of its own, the two rows collapse into one and
  the Instagram accounts attach to that single Page.

## API ids to fill in as accounts are connected

The publishing call needs an object id, not a username — a Page id, an IG user id,
or a URN. Fill `api_account_id` on the row when you have it:

- Facebook Page → Page id (also goes in `SEVEN_FACEBOOK_ACCOUNT_ID`)
- Instagram → IG user id — **only** on the Facebook Login path, in
  `SEVEN_INSTAGRAM_ACCOUNT_ID`. On the Instagram Login path the token is the
  account and the API addresses it as `me`, so an id is a record, not a parameter.
- LinkedIn → `urn:li:organization:<id>` (also `SEVEN_LINKEDIN_ACCOUNT_ID`)
- YouTube → channel id
- TikTok → open id from the developer app

A token without its id is the most common reason a publish attempt 403s while
looking like a permissions problem.
