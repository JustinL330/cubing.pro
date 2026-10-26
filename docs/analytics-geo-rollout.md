# Fork-only analytics and GEO rollout (2026-10-26)

Status: **code scaffold only**, not configured, deployed, or verified with real visitors. A Chromium production-build regression checks that no Google scripts or requests appear without an ID, even with previously stored consent. This does not verify enabled GA4.

## Ownership and activation checklist

- [ ] Confirm the exact production URL **owned by JustinL330**. The upstream `cubing.pro` domain is not assumed to belong to this fork.
- [ ] Confirm hosting platform and whether GA4, GTM or Cloudflare Web Analytics is already injected outside this repository. Do not double-tag.
- [ ] Confirm the existing GA4 property owner, or create a new property owned by the fork operator.
- [ ] Configure `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX` (real owner-provided ID) and `NEXT_PUBLIC_SITE_ORIGIN=https://your-verified-domain.example` on the **production build only**. The example values here are placeholders, not working IDs.
- [ ] Confirm privacy notice, lawful consent requirements for target regions, and analytics retention/region settings before enabling.
- [ ] Check the deployment platform's CSP allows `www.googletagmanager.com` and GA4 collection endpoints, if enabled.
- [ ] Verify that preview/dev/staging traffic cannot satisfy the exact production-origin check.

The integration is off without **both** valid settings. It also requires `NODE_ENV=production`, an exact HTTPS origin match, and explicit per-browser opt-in. The six-language consent prompt is shown on allowed public routes only. Users can withdraw consent from Settings; no analytics script is injected before consent. Once a script has been loaded, revoking consent prevents future intended analytics events but cannot retract previously collected data or remove an already-loaded script.

## Privacy and SPA tracking

The current scaffold measures only **one sanitized `page_view` per permitted pathname change** after consent. Public route allowlist: `/`, `/welcome`, `/timer`, `/algs`, `/wca/players`, `/wca/wca-comps`, `/wca/statistics`, `/changelog`. No private/account/forum/profile or dynamic WCA player paths are allowed. No query string, raw referrer, user-provided title, player name, WCA ID, account data, password, invitation code or private-zone identifier is passed by this code.

Google tag uses `send_page_view: false` and manually sends one page view on allowed App Router navigation. **Before enabling**, in the GA4 web stream, disable automatic page views from enhanced measurement (both page loads and history changes), and check for any GTM or platform duplicate tags. Automatic GA4 events and referrer handling must be inspected in a real browser; the code alone is not proof of privacy compliance.

Future optional events (not yet implemented): timer started/completed, WCA search submitted/has results, language change, public forum participation after a security review. Only fixed event names and coarse boolean/count buckets should be sent, never raw queries, IDs or user content.

## Verification before marking production-ready

1. Run `node --test tests/analytics-privacy.test.mjs`, `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npx next build`. CI also runs `tests/analytics-browser.test.mjs` in Chromium against a production Next.js server built with no analytics ID or site origin. Preferences cannot store consent while analytics are unconfigured.
2. With **no ID**, verify no Google script, no GA cookies, and no collection requests on public or private routes.
3. On the verified production domain with a valid GA4 ID, verify the prompt in all six languages. Before consent and after rejection, check Network for **zero** analytics script/collection requests. Test withdrawal in Settings.
4. With consent, use browser Network + GA4 DebugView/Realtime: first load, client navigation, reload and Back each produce **one** page view for an allowed route, with sanitized `page_location` and no raw query/referrer. Check private/profile/settings routes produce no page views.
5. Check CSP, offline/blocked-Google fallback, page speed, and whether analytics storage/cookies follow the consent decision.
6. Only then distinguish: **code ready**, **GA4 property configured**, and **production receiving verified data**. None of the latter two is claimed here.

## GEO / search baseline

Google Search Central says generative search follows ordinary SEO fundamentals, helpful original content, accessible crawlable pages and technical clarity. `llms.txt` and special AI markup are not required for Google Search. Do not bulk-generate pages or promise rankings.

Before creating `sitemap.xml`, `robots.txt`, canonical URLs or hreflang, verify the **fork's production hostname**, public routes and actual crawlable server-rendered HTML. Do not advertise upstream-owned domains as canonical. Locale switching currently uses the same URL, so do not invent language-specific hreflang URLs. Account/private/forum routes require authorization and must not be indexed; `robots.txt` alone is not access control.

After verifying site ownership in Search Console, submit the actual sitemap and record weekly baseline for: cube timer / 魔方計時器, Ao5/Ao12, WCA player search, and practice community. Track impressions, clicks, CTR, indexing, identifiable referral sources and engagement; do not equate an AI referrer with all AI citations.

Official references:
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications
