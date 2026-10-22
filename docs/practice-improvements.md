# Practice improvements (no additional persistent storage)

This change adds `/timer` and a responsive practice hub on `/welcome`.
Existing competition features and upstream API contracts are unchanged.

## Scope and storage policy

- No new database, account system, cloud storage, file upload, media, or direct messages.
- Public/private forum work is deferred under the latest storage constraint.
- Timer results exist only in React memory. Reloading or leaving the page discards them.
- No solve sync, export, localStorage, IndexedDB, or other persistent solve storage.
- The existing locale preference mechanism remains; no new storage key is introduced.
- No GitHub Actions workflows are added or invoked.

## Timer

- Event scrambles via the existing `cubing` dependency, not ad-hoc random moves.
- Space: hold 300 ms, release to start; press to stop. Touch/click starts immediately.
- Optional inspection: at 15 s, +2; at 17 s, DNF. Escape cancels a solve.
- Five temporary sessions per puzzle, +2/DNF editing, deletion, best, ao5/ao12.
- Averages discard the best and worst; one DNF is discarded, two yield DNF.
- This is a practice tool, not a competition timing device.

## Languages and interface

English and Simplified Chinese catalogs remain. Traditional Chinese, Japanese and
Spanish have translated main navigation and all new practice controls, with English
fallback for untranslated legacy pages. These are partial locales, not a claim that
all legacy/API content is translated. A language dropdown replaces the two-language
toggle, follows browser language on first visit, and uses the existing preference key.

## Validation

Run `npx tsc --noEmit`, targeted ESLint, and `node --test tests/practice.test.mjs`
(Node 22.18+ or 24 supports importing the type-stripped timer model).
Browser visual and keyboard testing is still required: the local Chromium binary
could not be downloaded in the implementation environment.

## 2026-10-22 — Korean and fixed timer viewport

- Add 한국어 (ko-KR), Korean browser-language detection, and Korean practice timer copy.
- Translate navigation, welcome content, algorithms, settings, drawing controls and
  main WCA player/results labels. Specialized untranslated legacy text continues
  to use English; this is not a claim of complete Korean coverage.
- Add a visible language icon inside the existing accessible native language selector.
- Lock document scrolling only while /timer is mounted; restore scrolling on exit.
- Fit the timer to the remaining visual viewport and adapt on resize/rotation.
- Browse session results with previous/next buttons instead of a scrolling list.
- Keep the test-host DEMO title and original-site link visible in a compact banner
  on the timer page. Other pages retain the full deployment notice.
- Validation: TypeScript, targeted ESLint and existing timer calculation tests pass.
