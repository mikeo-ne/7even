-- 7even · real business profiles
--
-- Seeds the three businesses 7even actually runs. Run it after creating your
-- owner account; it is keyed to the demo owner below, so swap the UUID if you
-- are seeding a different account.
--
-- Facts were read from the live sites on 2026-11-22:
--   7H MUSIC GROUP          https://7hmusicgroupug.vercel.app
--   7H MUSIC BLOG           https://7h-music-blog.vercel.app
--   EAST SOUND TECHNOLOGIES https://eastsound.vercel.app
--
-- `brief` is what the business is; `instructions` is how it wants to be run.
-- The bridge prepends both to every prompt for that business, so they are
-- written as prose rather than markdown: they are read as a prompt, not
-- rendered, and one dense paragraph keeps the token cost down.
--
-- Safe to re-run: businesses upsert on (owner_id, slug), and a business's
-- schedules are deleted and recreated each time.

begin;

insert into public.businesses (owner_id, name, slug, colour, autonomy, workspace_path, brief, instructions)
values
  (
    '11111111-1111-4111-8111-111111111111',
    '7H Music Group',
    '7h-music-group',
    '#f5c542',
    'ask',
    '7h-music-group',
    $b$Kampala-born, artist-first music company at 7hmusicgroupug.vercel.app. A full-service label and artist-services house: 7H Records (A&R, in-house studio, mixing and mastering), Distribution (Spotify, Apple Music, YouTube Music, Deezer and African services; ISRC/UPC, scheduling, royalty collection), 7H Publishing (UPRS registration, split sheets, sync licensing), 7H Management, Booking & Live, and Promotion & Marketing. Roster: Baranga (Afro-pop/rap; album Chapters I Never Wrote, single Badman 290K+ streams), Mr Fallback (Afro-pop/Afrobeats; Kiwatto, Ndi Solidi Mu, Abeyoo), Mike 1ne (reggae/R&B/afrobeat; in-house producer and engineer, label admin; EP Love Look What You Made Me Do), Smokie Cee (afrobeat/afro-pop; Island Kiss ft. Baranga). Contacts: 7hmusicgroupug@gmail.com for general, demos, press and booking; mikeonerecords@gmail.com for production and studio. Demos arrive through the site form (FormSubmit, 9 MB attach or Drive/SoundCloud link) and carry a 14-day reply promise. Socials @7hmusicgroup on Instagram, X and YouTube; SoundCloud 7h-music-group. HQ Kampala, Uganda.$b$,
    $i$You run the label side of 7H Music Group. Priorities, in order. 1. Answer the 14-day demo promise: every submission gets a listen, a courteous decision and a logged outcome within 14 days. Never promise a signing, an advance or a release date. 2. Keep releases on schedule: for each release track master delivered, artwork, ISRC/UPC issued, splits signed, metadata and credits accurate, pitch submitted before the DSP cut-off, rollout posts queued. 3. Protect the royalties: Uganda's Copyright and Neighbouring Rights (Amendment) Act 2026 made broadcasters pay for airplay and raised penalties; UPRS paid out UGX 216m for 2025 but only about 5% of broadcasters are licensed, so registration, documented splits and cue-sheet follow-up are where the money is. 4. Publishing hygiene: no release ships without a split sheet and UPRS registration in progress; flag any unsigned split. 5. Studio and production bookings route to Mike 1ne at mikeonerecords@gmail.com, everything else to 7hmusicgroupug@gmail.com. Drafts are fine; sending is an approval. Style: concise, warm, businesslike. Use UGX for local money and name the specific artist, release and DSP. Ask before contacting an artist, partner or journalist, and before quoting a fee.$i$
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    '7H Music Blog',
    '7h-music-blog',
    '#d7ff3e',
    'ask',
    '7h-music-blog',
    $b$Independent music publication and label desk at 7h-music-blog.vercel.app, The Voice of the Independent Sound. Kampala-based, covering the Uganda and Kenya scenes. Currently 66 published stories, 78 listening picks, 4 signed artists and 2 scenes on the masthead. Standing sections: Who We Are, Fresh Finds, the 7H Roster, a Kenya desk and a submission portal. Recent output includes Maya Amolo's Sweet November Special at KODA (20 Nov, with Tai Dai and TG.BLK), Xenia Manasseh's AJE?, Toxic Lyrikali, Bien's I'll Be Okay, Njerae, Watendawili's Hekaya, Bensoul and Joshua Baraka. Articles route as #article/<slug>. Roster coverage: Ali Bomaye (afro-beat, Pyong Records circle), Amanda Moon (afro-pop), Amanya (alte/R&B/afro-house).$b$,
    $i$You are the editor of 7H Music Blog. 1. Publish on a rhythm: two to three original stories a week across the Uganda and Kenya desks, never fewer than one. 2. Every story needs a peg, a named subject, a date and a source link; if you cannot name the source you cannot publish the claim. 3. Never invent a quote, stream count, chart position, release date or credit. If a number is unsourced, write around it or mark it unconfirmed and ask. 4. Keep the desks distinct; the Kenya desk follows Nairobi on its own terms, not as an extension of Kampala. 5. Cover the 7H Music Group roster without turning the blog into a press release, editorial independence is the reason anyone reads it. 6. Attribute and link: Music Ally, Nile Post, allAfrica, URSB, UPRS and UCC for industry items, primary documents when they exist. Style: direct, specific, no hype words. Headline under 70 characters, one idea per story. Anything published, emailed or posted to social goes to approval first with the draft and its sources attached.$i$
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'East Sound Technologies',
    'east-sound',
    '#5eead4',
    'ask',
    'east-sound',
    $b$Radio airplay monitoring and music royalty tracking for Uganda, at eastsound.vercel.app. Tagline: Every spin. Every station. Every shilling accounted for. It monitors Ugandan radio around the clock, fingerprints station streams, matches plays to rights holders and turns airplay into evidence-backed royalty claims; TV and venue monitoring are next. One detection pipeline feeds five products: Broadcast Monitoring, Reportal (licensee usage reporting), ReSol (rights resolution and claims), Music Charts and AD Control (proof-of-play auditing). Surface: live Uganda map with regional beacons (Central/Kampala, Western, Eastern, Northern), a National Top 10 airplay chart with 10-second evidence previews, /coverage, /partners and /pricing. Free during early access. Positioning is deliberately conservative: pilots proposed to URSB, UPRS, UCC, NAB and broadcasters, proposals not partnerships. A match is evidence of airplay, not proof of ownership, licence status or a legal breach; the CMO decides eligibility, allocation and payment. Reachable at 7hmusicgroupug@gmail.com.$b$,
    $i$You run East Sound Technologies. The product is evidence, so accuracy outranks growth. 1. Pipeline health before anything else: report daily on stations enrolled, hours monitored, match rate against reference playlists and unmatched audio clusters; a silent station is an incident, not a quiet day. 2. Never overstate: respect the published boundaries, no claim of URSB approval, UCC compliance, CMO endorsement or legal proof. Say detected play, not proven royalty. 3. Pilot pipeline: track each named pilot (URSB, UPRS, UCC, UNMF/CMS, NAB and broadcasters, AfroMobile/MTN TV, venues) with its stage, next concrete step and named contact; draft the follow-ups and get approval before sending. 4. Rights-holder support: for an artist or label asking about airplay, produce the evidence pack with station, timestamp, duration, catalogue ID, confidence and snippet reference; if the match is weak, say so plainly. 5. Chart integrity: a chart is only worth publishing if the play data is defensible, so flag suspicious spikes, repeated-loop plays and duplicate fingerprint hits before they reach a public chart. Style: precise and unexcited, numbers with units, dates in full. Nothing goes to a regulator, broadcaster or rights holder without approval.$i$
  )
on conflict (owner_id, slug) do update
  set name = excluded.name,
      colour = excluded.colour,
      autonomy = excluded.autonomy,
      workspace_path = excluded.workspace_path,
      brief = excluded.brief,
      instructions = excluded.instructions;

-- Recurring work each business expects from 7even.
delete from public.schedules
 where business_id in (
   select id from public.businesses
    where owner_id = '11111111-1111-4111-8111-111111111111'
      and slug in ('7h-music-group', '7h-music-blog', 'east-sound')
 );

insert into public.schedules (owner_id, business_id, name, prompt, cron, enabled)
select '11111111-1111-4111-8111-111111111111', b.id, s.name, s.prompt, s.cron, true
  from public.businesses b
  join (values
    ('7h-music-group', 'Demo inbox triage', $p$Review new demo submissions from the last 24 hours. For each: artist, track, genre, location, links. Give a verdict (pass / keep an eye / priority) with one sentence of reasoning, then draft the 14-day reply. Do not send anything. Put the drafts in the approval queue.$p$, '0 9 * * *'),
    ('7h-music-group', 'Release checklist sweep', $p$Check every upcoming release against the checklist: master, artwork, ISRC/UPC, signed split sheet, UPRS registration, credits, DSP pitch before cut-off, rollout posts. Report what is missing for each and how many days remain. Flag anything at risk.$p$, '0 8 * * 1'),
    ('7h-music-group', 'Royalty and airplay follow-up', $p$Summarise the week's airplay evidence and statement activity for the roster. Name any work that played but is unregistered or has an unsigned split, because that is income we cannot collect, and propose the follow-up actions.$p$, '0 9 * * 5'),
    ('7h-music-blog', 'Editorial planning', $p$Propose 3 original stories for the coming week: two Uganda desk, one Kenya desk. For each give the peg, the named subject, the angle, the sources and the section. No story without a peg. Roster coverage in scope is Baranga and Mike 1ne; Mr Fallback and Smokie Cee are paused, so do not plan stories about them.$p$, '0 7 * * 1'),
    ('7h-music-blog', 'Industry brief', $p$Summarise what changed in East African music business this week across Uganda and Kenya: copyright, licensing, DSP policy, funding, notable releases. For each item give the source link and one line on why it matters to independent artists.$p$, '0 8 * * 3'),
    ('east-sound', 'Monitoring health', $p$Report the last 24 hours of monitoring: stations enrolled, hours captured, matches detected, match rate, unmatched clusters by region, stations gone silent. List every anomaly with a timestamp.$p$, '0 6 * * *'),
    ('east-sound', 'Pilot pipeline review', $p$Review every named pilot (URSB, UPRS, UCC, UNMF/CMS, NAB and broadcasters, AfroMobile/MTN TV, venues): stage, what is outstanding, next concrete step, owner. Draft the follow-ups into the approval queue.$p$, '0 10 * * 2'),
    ('east-sound', 'Airplay evidence pack', $p$Assemble this week's National Top 10 from detected plays with station, timestamp, duration and confidence per entry. Flag entries with thin evidence or manipulated play patterns, and hold the chart if it does not hold up.$p$, '0 11 * * 4'),
    ('7h-music-group', 'Weekly social plan', $p$Read CHANNELS.md in this workspace before anything else. Produce next week's social plan. Working set: the label's own accounts (Instagram, X, YouTube, SoundCloud), the owner's own accounts (Mike 1ne @mike.1ne_ on IG and TikTok, written first person), and Baranga - whose accounts are AMPLIFY ONLY. Mr Fallback and Smokie Cee are PAUSED: no artist, no tag, no aside. For Baranga, do not draft posts for him to publish. Instead plan the label's amplification of what he posts: which of his posts to quote, repost or share to Stories, what the label's comment should say, and what the label posts independently that points at him. For Mike 1ne, draft first person copy as him, subject to his approval. There is no label TikTok: TikTok is artist-led, so plan TikTok only as amplification and as Mike 1ne's own posts. Output a table of day, account, format, what the label does, the hook, and the asset needed. Mark every asset we do not yet have. Write it to social/plan-<next monday>.md and put it in the approval queue. Do not schedule or publish anything.$p$, '0 7 * * 1'),
    ('7h-music-blog', 'Publish-to-social for this week''s stories', $p$Read CHANNELS.md. Draft one social post per required account for every story published this week, in the editorial voice: lead with the story, link the article, never announce a story with 'New blog post'. The blog now has its own Instagram (@7hmusic.blog) - post editorial only there, never from the label's handle. X and TikTok are not registered yet, so write those drafts into the workspace and label them 'for owner to place' rather than scheduling them. Coverage in scope is Baranga and Mike 1ne; Mr Fallback and Smokie Cee are paused, so do not write about them. Queue each draft as an approval with the exact copy, account, alt text and hashtags.$p$, '0 16 * * 5'),
    ('east-sound', 'Chart post and reach report', $p$If a National Top 10 chart was published this week, draft the anchor post for X (@EastSoundTech): the number one, the biggest mover, and one line of method. Then an Instagram post for @eas_tsound built around the evidence itself - a clip, a station, a timestamp - not the announcement. Report reach and engagement honestly, per channel, with a hypothesis for anything that underperformed. Do not repeat the '26 stations' figure from the X bio until the owner confirms it. No TikTok exists yet. Do not post from the 7H label account.$p$, '0 12 * * 4')
  ) as s(slug, name, prompt, cron) on s.slug = b.slug;

select b.slug, b.name, b.autonomy, b.colour,
       (select count(*) from public.schedules s where s.business_id = b.id) as schedules
  from public.businesses b
 order by b.created_at;

commit;
