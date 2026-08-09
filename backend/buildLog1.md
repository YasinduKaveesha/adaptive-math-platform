# Component B Backend Build Log (continued)

> `backend/buildLog.md` is closed as of its final entry, **FE-0c** (2026-07-29), and must not be
> appended to or edited further. This file, `buildLog1.md`, is its rotation and continues the same
> living, append-only development audit log from FE-0d onward, under the same rules: future work
> is appended as a new dated phase or batch, earlier entries here are never removed, rewritten, or
> silently altered.

---

## 2026-07-29 — FE-0d: close the authorization-bypass hole (BE-G2 dependency)

**Why.** Two shortcuts introduced during Component B page construction had quietly become
authorization bypasses rather than the narrow dev conveniences they were meant to be:
`app/_layout.tsx` forced `learnerAccess: true` / `onboarding: false` whenever
`EXPO_PUBLIC_APP_ENV === 'development'`, and `app/index.tsx` unconditionally redirected every
bootstrap to `(learner)/home` under the same condition — before `useAuth()`'s real `status` was
even consulted. Both meant that in any development build, the entire learner-activation path
(BE-G1's grade assignment, BE-G2's classroom-membership approval, FE-1a's onboarding screens) was
silently unreachable and untested by anyone running the app the normal way. This batch removes
both bypasses and, for the first time, actually exercises FE-1a end-to-end against a live backend.

**The governing distinction for this batch, stated once so it can be pointed back to:** a fixture
flag (`EXPO_PUBLIC_COMPONENT_B_DEV_FIXTURE`, still present and untouched in `component-b-api.ts`)
may legitimately substitute response *data* for a screen that has nothing else to render against
yet. It must never flip an authorization *decision*. The two removed bypasses both violated this;
the fixture flag itself does not and was left exactly as it was.

**Part 0 — closed the optionality hole FE-0c opened.** FE-0c's six new `ComponentBApi` methods
(`getActiveSession`, `selectOpportunity`, `submitResponse`, `requestAssist`,
`completeOpportunity`, `getSessionSummary`) were typed optional solely because `createFixtureApi`
didn't implement them. This batch makes all six required on `ComponentBApi` and implements them in
`createFixtureApi` as immediate `ApiClientError('unavailable', …)` throws — no delay, no fake
payload, no fixture branching by flag value. Comment left in place: the fixture covers the prep
screen's readiness/start path only; the session loop is deliberately unimplemented so a fixture
run can never masquerade as a real session past the prep screen.

**Part 1 — removed the two bypasses.**
- `app/_layout.tsx`: deleted the `componentBPagePreview` constant and its two usages; `learnerAccess`
  is now exactly `authorized || status === 'preview'` (the pre-existing, explicitly user-triggered
  `continueToComponentBPreview()` preview path in `auth-context.tsx` — untouched, out of scope, and
  not an automatic env-keyed bypass) and `onboarding` is exactly `status === 'onboarding'`.
- `app/index.tsx`: deleted the `if (process.env.EXPO_PUBLIC_APP_ENV === 'development') return
  <Redirect href="/(learner)/home" />` block entirely. `BootstrapRoute` now always routes off the
  real `useAuth()` status: `checking` → spinner, `authorized`/`preview` → home, `onboarding` →
  onboarding, everything else → sign-in.

**An incidental, in-scope fix required to get `tsc` green — not part of the bypass removal
itself.** `app/index.tsx`'s onboarding redirect (`<Redirect href="/(onboarding)" />`) has apparently
never been type-checked strictly before: Expo Router's generated route-literal union
(`.expo/types/router.d.ts`) includes only fully-qualified leaf paths
(`` `${'/(onboarding)'}/index` ``, `/index`, etc.), never the bare group-index shorthand
`/(onboarding)` itself, even though that shorthand is a valid runtime route that resolves to
`app/(onboarding)/index.tsx`. This was caught the hard way during Run 3 below: the first fix
attempt changed the href to `/(onboarding)/index` to satisfy `tsc`, which typechecked cleanly but
produced a real "Unmatched Route" screen at runtime — a live regression, caught only because Run 3
was actually driven against a running app rather than assumed from the type system. Reverted to
`/(onboarding)` (confirmed live, see Run 3) and resolved the type error with an explicit
`as Href` cast plus a comment naming this as a known typed-routes gap, not an invalid route.
**Corrected in-flight, not shipped as a regression** — recorded here because a future editor
tightening `tsc` again might otherwise "fix" this the same wrong way.

**Part 2 — standing guard.** New `frontend/src/api/__tests__/no-auth-bypass.test.ts`: asserts
neither `app/_layout.tsx` nor `app/index.tsx` contains the literal string
`EXPO_PUBLIC_APP_ENV`. Grep-as-a-test is inelegant; the test file says so in its own comment,
specifically so nobody deletes it for being ugly — it is standing in for the fact that neither file
has any other structural way to prevent this exact regression class (an env-keyed shortcut
reintroducing an authorization decision) from coming back.

**Verification — static (all from `frontend/`):**
- `npx tsc --noEmit` — clean, no errors.
- `npm run lint` — clean, no errors.
- `npm run test:contract` — **53 passed, 0 failed** (51 pre-existing tests unregressed, 2 new).

**Verification — three live runs against the real running backend (`docker compose`) and real
Supabase auth, driven through an actual browser (Playwright) against `expo start --web`, per the
BE-G2 dependency this batch has (needed the fixture learner's credentials now that the bypass
that made verification unnecessary is gone):**

*Local-only test-environment note (nothing shipped):* `expo start --web` needed
`EXPO_PUBLIC_API_BASE_URL` overridden to `http://localhost:8000` (the committed `.env.local`
points at `10.0.2.2`, the Android-emulator loopback alias, unreachable from a browser) — passed as
a process-level env override, no file changed. The backend's CORS config (`backend/.env`'s
`CORS_ALLOWED_ORIGINS`, `app/main.py`'s `allow_headers`) also had to be widened temporarily to
admit the web origin and the app's `X-Mobile-App-Version` header, neither of which a native app's
CORS-exempt requests ever need. Both were reverted immediately after the three runs completed and
the container rebuilt back to its original state; `git status` confirms zero diff in
`backend/app/main.py`, and `backend/.env` (gitignored, never committed) is back to its
pre-existing single line. No production or committed configuration changed as a result of this
verification.

1. **Signed out → lands on `(auth)/sign-in`, not home.** Confirmed: a fresh page load with no
   session landed on `/sign-in`.
2. **BE-G2 fixture learner → reaches `(learner)/home`.** Signed in as
   `dev-fixture-learner@example.com` (BE-G2's pre-provisioned, APPROVED Grade-2 learner) and landed
   directly on `/home`, greeted "Hi, FIXTURE Learner G2!".
3. **A fresh Supabase user → reaches `(onboarding)`, completes name → join code → pending, then
   approve → reaches home — this is the first real regression test FE-1a has ever had, and it
   passed.** Created a brand-new account (`fe0d-verify-run3@example.com`) through the app's own
   sign-up form. Landed on `/(onboarding)/welcome` (confirming BootstrapRoute's real onboarding
   branch, not the removed bypass); the name field was pre-filled from signup and `CONTINUE`
   advanced to `/(onboarding)/teacher-link`. Minted a fresh classroom invite for the existing
   `FIXTURE Grade 2` classroom via the fixture teacher's credentials (the same
   `POST /api/v1/classrooms/{id}/invites` call `dev_fixture_learner.py` itself makes), entered the
   resulting join code in the app, confirmed the resolved classroom name, and landed on
   `/classroom-status` showing "Waiting for your teacher to approve" (a real `PENDING`
   `classroom_membership`, confirmed via the teacher's own membership-requests listing).
   Approved it via `POST /api/v1/classroom-memberships/{id}/approve` as the fixture teacher — the
   same mechanism `dev_fixture_learner.py`'s `ensure_membership_approved` uses, applied here to a
   fresh learner identity the script itself doesn't manage. `classroom-status-screen.tsx` fetches
   membership status on mount and pull-to-refresh only (no polling, per `frontend.md 15.10`), so a
   plain re-sign-in (rather than a native pull-to-refresh gesture, impractical to drive from a
   browser) re-triggered the check; the app landed on `/home` immediately, greeted "Hi, FE0D Verify
   Learner!". **No FE-1a defect found** — the full activation path (BE-G1's grade assignment,
   BE-G2's approval mechanism, FE-1a's onboarding screens, and this batch's bypass removal) holds
   together end-to-end.

**One piece of user-facing feedback noted during Run 3, out of scope for this batch and not
acted on:** the sign-up screen's gender field (`sign-in-screen.tsx`, not one of this batch's four
scoped files) currently offers four options (Female / Male / Non-binary / Prefer not to say); the
user flagged during live verification that it should offer only Female / Male. Left untouched —
recorded here so it isn't lost before whichever batch next touches that screen.

**Files touched:** `frontend/src/api/component-b-api.ts`, `frontend/app/_layout.tsx`,
`frontend/app/index.tsx`, `frontend/src/api/__tests__/no-auth-bypass.test.ts` (new),
`backend/buildLog1.md` (new — see rotation note above). No file under `backend/app/` left modified
(the temporary CORS/header changes made purely for local live verification were fully reverted).
`backend/buildLog.md` was not touched, per the rotation.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Post-FE-0d housekeeping: gitignore allow-list correction + sign-up gender narrowing

Two small out-of-batch changes made directly, both authorized by Yasindu during FE-0d review.

**1. `.gitignore` allow-list — silent governance-record loss (the substantive one).**
`.gitignore:29` ignores all `*.md` behind an explicit allow-list. `backend/buildLog.md` is
allow-listed; `backend/buildLog1.md` was not. The FE-0d entry above therefore existed only on
disk and would never have reached the repository — the rotation instruction was followed
correctly and the result was still invisible to git. The same defect had been latent since BE-G2:
`backend/scripts/README.md`, the file carrying the mandatory *"delete this directory when FE-1b
lands"* notice, was likewise ignored. Both are now allow-listed with comments explaining why each
is tracked. Verified with `git check-ignore` (exit 1 for both) and `git status` (both now appear
as untracked rather than vanishing).

Worth noting for future rotations: an append-only log whose file is gitignored fails silently and
in exactly the direction that destroys the audit trail. Any future `buildLog2.md` needs the same
allow-list line added at rotation time, not after.

**2. Sign-up gender options narrowed to Female/Male.**
`Gender` in `frontend/src/auth/auth-context.tsx` went from
`'female' | 'male' | 'non_binary' | 'prefer_not_to_say'` to `'female' | 'male'`, and
`genderOptions` in `frontend/src/features/auth/sign-in-screen.tsx` from four entries to two.

Recorded honestly, because the finding is broader than the change: the field is **write-only**.
`auth-context.tsx` writes it into Supabase `user_metadata` at signup and nothing — frontend or
backend — ever reads it back. The backend has zero references to gender; `ProfileCreateRequest`
is `{name}` only. Narrowing also removes `prefer_not_to_say`, the field's only opt-out, making
disclosure mandatory for data that currently has no consumer and no documented purpose. This
trade-off was raised before the change and the narrowing was reaffirmed; it is implemented as
asked. If gender is later needed as a research covariate it should get a real backend column and
a stated purpose rather than continuing to accumulate in auth metadata.

**Verification (from `frontend/`):** `npx tsc --noEmit` exit 0; `npm run lint` clean;
`npm run test:contract` **53 passed, 0 failed** (unregressed).

**Files touched:** `.gitignore`, `frontend/src/auth/auth-context.tsx`,
`frontend/src/features/auth/sign-in-screen.tsx`, `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — FE-2a: resume detection, and deleting three promises the app could not keep

**Why.** Two unrelated problems lived in the same screen. First, the prep screen had no resume
affordance at all: every visit called `startSession`, and while that is safe by construction
(`POST /api/v1/b/sessions` never 409s on an existing session — `b_session_lifecycle.py:185-194`
takes an advisory lock, finds any starting-or-active session for the learner, and returns it with
`201` regardless of idempotency key), the child had no way to *see* "Resume" before tapping; they
would only discover it after. Second, and unrelated to resume, the screen made three specific
promises to a child that the backend cannot currently keep: a lesson identity ("Counting") that
does not exist before a session starts, a hints affordance that 409s for the overwhelming majority
of templates, and a retry guarantee the app has no approved policy to back. This batch fixes the
first and removes the second — treating both as correctness work, not a redesign.

**Part 1 — resume detection.** `GET /api/v1/b/sessions/active` is treated strictly as a UX
affordance, never a correctness requirement, which is what makes the whole design safe:
- New `resolveResumableSessionId(api, accessToken)` (exported from the screen — pure, no React,
  no rendering): calls `api.getActiveSession`, returns the session id only when
  `session !== null && session.state === 'active'`, and returns `null` on any thrown error. The
  catch is unconditional and silent by design — commented in place — because a failed or stale
  read here is self-correcting: if a session actually exists, starting "a new one" anyway just
  returns it (see the idempotency behavior above), so the child still lands in the right place
  either way. No new error phase was added for this path; the existing 10-state phase machine
  (`checking-identity` through `technical-failure`) was extended, not rewritten.
- Wired into `checkReadiness`: immediately after a successful readiness check sets `phase` to
  `'ready'`, and only then, the resume check runs (skipped entirely for the fixture — see below) —
  fetches an access token, calls `resolveResumableSessionId`, and stores the result in new
  `resumableSessionId` state. When a session is found, `saveActiveSessionId` is called immediately
  (not deferred to a tap), so Batch 13's `clearActiveSessionId` on exit always has a current value
  to work with, matching the store's existing "keep the local hint fresh" discipline from FE-0b.
- `startAdventure`: when `resumableSessionId` is set, tapping the (now "Resume Adventure") button
  routes straight to `/(learner)/session/[sessionId]` via a new shared `navigateToSession` helper
  (factored out of the old `openActiveSession`, which now delegates to it) — `sendStartCommand`,
  and therefore `POST /api/v1/b/sessions`, is never called on the resume path.
- `loadActiveSessionId()` (the FE-0b local-storage reader) was deliberately **not** used to make
  this decision — the stored id is a hint that can go stale (a completed or abandoned session
  would route the child into a dead screen); the server via `getActiveSession` is the only
  authority on what is actually resumable. `loadActiveSessionId` is not called anywhere in this
  file; only `saveActiveSessionId`/`clearActiveSessionId`-adjacent writes happen here.
- **Fixture handling is an explicit skip, not a swallowed error.** FE-0d made
  `createFixtureApi.getActiveSession` throw `ApiClientError('unavailable', …)` by design (the
  fixture covers the prep screen's readiness/start path only, deliberately not a fake session
  engine). Calling it unconditionally would still "work" — `resolveResumableSessionId`'s catch
  would just turn it into `null`, i.e. Start — but that is an accident of the catch block matching
  the fixture's designed-in failure, not a real "no session" answer. Wrapping the resume check in
  `if (!fixture)` keeps that distinction visible in the code instead of hiding a real future
  regression (e.g. the fixture starting to implement this call) behind a catch block that would
  swallow it identically either way.
- Resolved the stale comment this batch was named for: `openActiveSession`'s old "Resume/recovery
  … is deferred to FE-2" note is gone; it now explains why a non-`'active'` `SessionCommandResponse`
  state is only ever reached from the start-a-new-session path, never from resume (which only ever
  targets a session `resolveResumableSessionId` already confirmed is `'active'`).

**An in-flight correction caught during live verification, not shipped as a regression.** No code
change was needed to satisfy this correction — it surfaced and was caught entirely within this
batch's own verification, before anything was left in a broken state, so it is recorded here for
visibility rather than as a fix to something that shipped wrong. (No such issue actually arose in
this batch's `tsc` run — FE-0d's `app/index.tsx` typed-routes gap does not recur here, since this
batch touches no `<Redirect>` call. Noted only to confirm the pattern was checked for and not
present.)

**Part 2 — deleted three promises the app could not keep, not "removed placeholder content."**
Each of the following was a specific, checkable claim, verified false before deletion, not a
generic cleanup:
1. **`previewLesson` (`{skillId: 'counting', skillLabel: 'Counting'}`) and both its uses** — the
   hero subtitle ("Let's start your **Counting** adventure") and the `lessonCard`'s skill row. No
   pre-session lesson identity exists anywhere in the contract; `OpportunitySelectionService`
   (`app/application/opportunity_selection.py`) picks the skill *after* a session starts, adaptively,
   from the learner's seven-skill BKT state. Promising "Counting" to a child when the server may
   serve subtraction is not a simplification of real data, it is a fabricated one — deleted, not
   relocated.
2. **"Hints available — Get helpful hints anytime."** Verified false for the overwhelming majority
   of sessions: hint requests 409 for 34 of 36 templates (governed-hint availability is
   template-scoped and most templates have none configured yet). A blanket "available" claim is
   true for roughly 6% of sessions.
3. **"You can try again — Learn at your own pace."** Attempt-limit behavior is an unapproved
   placeholder (BEplan's safe-progress policy is architecturally GATE-B UNRESOLVED, per
   `app/domain/b_completion.py`'s own module docstring) — the app has no approved policy to point
   to and cannot guarantee this to a child.

The whole `lessonCard` block was deleted (not just the skill row), since the skill it displayed was
its only content. That also removed the grade-badge comment at the card's old bottom edge
("Grade badge removed: no `grade` field exists anywhere reachable from the frozen v1 contract") —
which was itself factually stale as of FE-0c: `grade` **is** reachable, on
`OpportunityPresentationResponse`/`OpportunityPresentationFields`. The comment was not relocated or
corrected; it died with the card it was explaining, since nothing in this batch reads `grade` and
inventing a new place to park a now-moot comment would be scope creep.

The hero subtitle was rewritten to make no lesson claim at all ("Let's start your adventure"). The
readiness `PreparationItem` — driven by the real phase machine, not a claim about the backend's
capabilities — was kept unchanged, now the preparation card's only item. Per the batch's own
instruction, the resulting visual gap was **not** filled with new content: `preparationCard` is
`flex: 1` and absorbs it; inventing replacement copy to pad the space would have reintroduced
exactly the class of unverifiable claim this batch exists to remove.

**Dead styles deleted:** `lessonCard`, `lessonColumn`, `lessonIcon`, `lessonLabel`, `lessonValue`,
`skillIcon`, `heroSkill`, `heroSkillCompact` — confirmed via lint (`expo lint` via `eslint-plugin-react-native`'s
unused-styles rule would have caught any missed).

**Verification (all from `frontend/`):**
- `npx tsc --noEmit` — clean, no errors.
- `npm run lint` — clean, no errors.
- `npm run test:contract` — **57 passed, 0 failed** (53 pre-existing tests unregressed, 4 new).
  New `frontend/src/api/__tests__/resume-decision.test.ts` tests `resolveResumableSessionId` as a
  pure function — active session → returns the id (Resume); `session: null` → `null` (Start); a
  `completed`/`abandoned` session → `null` (Start, both states exercised); a thrown error → `null`
  (Start, degrades silently). No rendering, no RNTL (Batch 15's territory) — this file reached the
  screen's exported pure function the same way FE-0b's store test reached its target: by
  monkeypatching `Module.prototype.require` to stub every React Native/Expo/image-asset specifier
  the screen (and its transitive dependency tree — `auth-context`, `supabase`, `secure-storage`,
  `app-text`, `learner-tab-bar`) pulls in at module-load time but that `resolveResumableSessionId`
  itself never touches (it only calls the `api` parameter it is given). Isolated to this one test
  file's module registry; `node --test` runs each test file in its own worker/process.

**Verification — five live runs against the real running backend and the BE-G2 fixture learner,
driven through an actual browser (Playwright) against `expo start --web`, same local-only CORS/API-base
test-environment setup as FE-0d (widened `CORS_ALLOWED_ORIGINS`/`allow_headers` and an
`EXPO_PUBLIC_API_BASE_URL` override, both reverted immediately after; `git status` confirms zero
diff in `backend/app/main.py` and `backend/.env` is back to its original single line):**

One environment snag hit and resolved before these runs: a stale `expo start --web` process from
the FE-0d session was still holding port 8082 with the original (unreachable-from-a-browser)
`.env.local` API base baked in, so the first sign-in attempt silently called `10.0.2.2:8000`
instead of the intended override and failed with no CORS error at all (confirmed via
`browser_network_requests` — the request never left for the right host). Killed the stale process,
restarted cleanly on the same port with the override, and all five runs below are against that
clean instance.

1. **No active session → Start → lands in a session.** Ran the fixture script fresh (no
   `--keep-session`, confirming no stale session survived); prepare correctly showed
   "Start Adventure"; tapping it landed on `/session/7abb7455-b078-45f5-926c-4514b346b42d`.
2. **Navigate back to prepare → Resume, same `session_id`.** In-app navigation (not a full reload,
   which this dev harness's web session does not survive) back to `/prepare` showed
   "Resume Adventure"; tapping it routed to the identical
   `/session/7abb7455-b078-45f5-926c-4514b346b42d` — confirming `sendStartCommand` was not called.
3. **Kill the app, relaunch, open prepare → still Resume, same session.** Simulated via a full page
   reload (which does drop this harness's in-memory web session) followed by a fresh sign-in —
   the closest equivalent to a real kill/relaunch available in this environment. Prepare again
   showed "Resume Adventure" and routed to the same session id, confirming the decision is made
   fresh from the server on every mount, not cached client-side.
4. **Abandon the session via the fixture script → prepare shows Start again.** Re-ran
   `dev_fixture_learner.py` (no `--keep-session`): its own stale-session-reset step printed
   `"Abandoned stale active session 7abb7455-b078-45f5-926c-4514b346b42d."` (exact id match) before
   self-verifying and abandoning its own fresh session. A subsequent fresh sign-in and visit to
   `/prepare` showed "Start Adventure" again.
5. **Stop the backend, open prepare → readiness fails as before; the active-session check did not
   add a new error state.** To exercise this without losing the in-memory web session (which a
   full reload would, and the backend being down would then block re-authenticating), signed in
   *before* stopping the container, then stopped `docker compose stop api` and navigated to
   `/prepare` via in-app SPA navigation only. Readiness correctly failed
   (`net::ERR_CONNECTION_REFUSED` on `GET /health/ready`, the pre-existing `readinessCopy` "Almost
   ready — Try again in a moment" copy shown, button still reads "Start Adventure"). No separate
   resume-check error surfaced — confirms the resume check is unreachable when `checkReadiness`
   itself throws, exactly as coded (the resume-check block sits inside the try, after
   `setPhase('ready')`, which never executes on failure).

**Explicitly out of scope, untouched:** no live session screen (Batch 9), no renderer work
(Batch 8), no home screen (Batch 14), no API or store change (FE-0b/FE-0c already shipped
everything this batch consumes), no new dependency, no contract re-freeze.

**Files touched:** `frontend/src/features/session/session-preparation-screen.tsx`,
`frontend/src/api/__tests__/resume-decision.test.ts` (new), `backend/buildLog1.md`. No API file,
no store file, no other screen touched.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Manual-testing fixes: web CORS header, join-code input formatting, fixture invite minting

Three small, independently-verified fixes made directly during manual UI testing of the onboarding
flow in a web browser, none part of the FE-2a batch.

**1. Backend CORS was silently blocking every state-changing request on web.**
`frontend/src/api/client.ts` sends `X-Mobile-App-Version: 1.0.0` on every request, on every
platform, despite the header's name. `app/main.py`'s `CORSMiddleware.allow_headers` did not
include it. Native platforms don't enforce CORS, so this was invisible until web testing began;
on web, every POST (sign-up's profile creation, save-name, join-code resolve/request, ...) failed
its preflight with "Disallowed CORS origin" — surfacing to the user as generic messages like "We
could not save your name." Fixed by adding `X-Mobile-App-Version` to `allow_headers` in
`app/main.py`, with a comment explaining why it was web-only and previously invisible. Verified by
replaying the exact failing preflight (`curl -X OPTIONS .../learner/profile` with the same
`Access-Control-Request-Headers`) before (400 "Disallowed CORS headers") and after (200, header
present in `Access-Control-Allow-Headers`) rebuilding the container.

**2. Join-code input didn't uppercase or format as typed.**
`autoCapitalize="characters"` on `TeacherLinkInstructionsScreen`'s `TextInput` is a keyboard hint
only — React Native Web doesn't use it to transform the typed value, so lowercase input stayed
lowercase. Added `formatInviteTokenInput()`: strips non-alphanumeric characters, uppercases, and
groups 4-4 with a dash — matching the server's own format exactly
(`classroom_membership.py`'s `_JOIN_CODE_ALPHABET`/`_JOIN_CODE_LENGTH=8`, e.g. `M7KP-4X9D`), not
an arbitrary grouping. Purely a display aid: the resolve/request endpoints already accept the
code case-insensitively with separators ignored, so this changes nothing about what is sent.

**3. The fixture script had no way to hand out a join code once its own learner was approved.**
Requested: a literal fixed code (e.g. `ABCDEF`) for convenience. Declined as designed — a
permanently fixed, guessable join code is a standing authorization bypass (anyone who learns or
guesses it can join the classroom), the same class of shortcut FE-0d's batch spent its scope
closing (a fixture may substitute data, never an authorization outcome). It would also need a new
backend code path, since invite tokens are only ever generated by `secrets.choice()` inside
`POST /classrooms/{id}/invites` today — there is no way to set a custom plaintext token. Presented
three options; the fixture-script route was chosen. That route's real blocker: once the fixture
learner's own membership reaches `APPROVED` (the steady state after the first run),
`ensure_membership_approved` skips minting an invite entirely, so nothing is left to print.
Added `--mint-invite-only`: signs in as the (already-existing) fixture teacher only, ensures the
`FIXTURE Grade 2` classroom exists, mints one fresh invite via the same
`POST /classrooms/{id}/invites` route the teacher already has legitimate authority over, prints
it, and exits — no new authorization surface, just the existing action exposed standalone instead
of only firing as a side effect of approving the fixture's own learner. Confirmed invites are not
single-use (no consumption flag in `classroom_membership.py` — only `revoked_at_utc`/
`expires_at_utc` gate validity), so the same code works for any number of separate real accounts
until the 24h expiry.

**Verification:**
- Frontend (`npx tsc --noEmit`, `npm run lint`, `npm run test:contract`): clean, 57/57 unregressed.
- CORS fix verified live via direct preflight replay against the rebuilt container (400 → 200).
- `--mint-invite-only` run live against the real backend twice: printed distinct fresh codes
  (`NZEA-V5TZ`, `D888-WE2K`) both times, confirming the endpoint mints anew each call.
- Normal (no-flag) fixture run re-verified unregressed afterward: correctly still skips minting
  when the fixture learner's own membership is already `APPROVED`, self-verify still returns 201.
- `backend/tests/test_dev_fixture_isolation.py`: 3 passed (the new flag adds no disallowed
  import or direct-write pattern).

**Files touched:** `backend/app/main.py`, `backend/scripts/dev_fixture_learner.py`,
`backend/scripts/README.md`, `frontend/src/features/onboarding/teacher-link-instructions-screen.tsx`,
`backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Fixture script: standalone approval for a separate real account

Follow-on to the previous entry's `--mint-invite-only`. That flag solved getting a fresh join
code for a separate real account, but the script had no way to approve that account's resulting
PENDING request afterward — `ensure_membership_approved` only ever looks up and approves the
fixture's own `LEARNER_ID`, never a different learner. A user who joined by hand through the
app's onboarding UI with a minted code was left stuck on the classroom-status screen with no
in-app way to move PENDING to APPROVED (no teacher UI exists; FE-1b is intentionally out of
scope).

Added `--approve-pending`: signs in as the (already-existing) fixture teacher only, ensures the
`FIXTURE Grade 2` classroom exists, lists every `PENDING` request via
`GET /classrooms/{id}/membership-requests`, and approves each one via the same
`POST /classroom-memberships/{id}/approve` route the teacher already has legitimate authority
over for their own classroom — same pattern as `--mint-invite-only`: no new authorization
capability, an existing legitimate action exposed standalone. Approves *all* pending requests in
one call, not just one, so multiple queued test accounts clear in a single run.

**Verification, all live:**
- Ran against a real PENDING request (a real Supabase account that had joined via a code from
  `--mint-invite-only`): approved 1, printed the learner_id.
- Re-ran immediately after: correctly reports "No PENDING membership requests found" rather than
  erroring or re-approving.
- Normal (no-flag) fixture run re-verified unregressed: still skips its own already-approved
  learner correctly, self-verify still 201.
- `backend/tests/test_dev_fixture_isolation.py`: 3 passed.

**Files touched:** `backend/scripts/dev_fixture_learner.py`, `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Clarification: classroom-status screen does not auto-navigate on approval

No code change. Recorded because it is easy to mistake for a regression during manual testing and
someone could otherwise "fix" intentional behavior.

After using `--mint-invite-only` + `--approve-pending` to approve a separate real account's
membership, the app's classroom-status screen did not automatically move to `(learner)/home`.
Confirmed this is by design, not a bug: `classroom-status-screen.tsx`'s own comment states it
"fetches membership status on mount and pull-to-refresh only — no continuous polling while this
screen is foregrounded, per frontend.md 15.10's don't-poll guidance" (a child's device should not
be polling the backend in a tight loop while a screen sits idle). The screen's `load()` already
does `router.replace('/(learner)/home')` the instant it observes `state === 'APPROVED'` — it
simply has no way to know the state changed until the next mount or pull-to-refresh triggers that
check. Pulling down to refresh, or navigating away and back, is the expected way to see an
out-of-band approval (via the fixture script, since no in-app teacher UI exists) take effect.

No files touched.

---

## 2026-07-29 — Home/prep greetings show first name only

Both `LearnerHomeScreen` and `SessionPreparationScreen` greeted with the learner's full name
("Hi, Yasindu Kularathne!") wherever it came from a signup display name or a saved learner
profile name. Added `frontend/src/utils/display-name.ts`'s `firstNameOf()` — takes the first
whitespace-separated token, collapses extra internal whitespace, passes an already-single-word or
empty value through unchanged. Applied at the single point in each screen where the greeting
string is computed (`learner-home-screen.tsx`'s `displayName`,
`session-preparation-screen.tsx`'s `displayName`) — the full name is still stored and passed
through internal state/`profileName` untouched; only the rendered greeting is shortened.

**Verification (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **62 passed, 0 failed** (57 pre-existing + 5 new in
`src/api/__tests__/display-name.test.ts`, covering two-part/three-part/single-word/empty/
extra-whitespace names).

**Files touched:** `frontend/src/utils/display-name.ts` (new),
`frontend/src/features/home/learner-home-screen.tsx`,
`frontend/src/features/session/session-preparation-screen.tsx`,
`frontend/src/api/__tests__/display-name.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Batch 8: answer-renderer registry (UI-free)

**What.** Three new modules under `frontend/src/features/session/renderers/` — `types.ts`,
`registry.ts`, `encode.ts` — exporting exactly two functions:

- `resolveRenderer(responseFormat, presentedChoices): RendererSpec | null`
- `encodeSubmittedValue(spec, state): string | null`

Deliberately UI-free so the whole batch is testable under the existing `node:test` + `tsx`
runner at zero new dependency cost. React Native Testing Library remains deferred to Batch 15.
No screen, no component, no API call, no timeout/hint/advance/results logic, no new dependency.

**Format table (verified against the generator).** Nine `response_format` values reduce to three
answer surfaces: `single_integer`, `single_integer_or_choice`, `single_choice_or_integer`,
`single_choice`, `ordered_list` → choice/4; `relation_choice` → choice/3; `binary_or_choice` →
choice/2; `expanded_form` → free-entry/0; `interactive_set_selection` → count-selection/0.

**Correction 1 — `ordered_list` is a plain choice format, not client-side answer construction.**
The plan as originally written would have had the client assemble the ordering (collect the
child's sequence, join it). That would put answer construction in the client. The server already
comma-joins each candidate ordering into a single `presented_choices` entry (e.g. `"12,45,300"`),
so the child picks one whole string and the client relays it verbatim — same as every other choice
format. Implemented and tested that way; `encode.ts` never joins, splits or reorders anything.

**Correction 2 — no relation symbols or conservation words anywhere in the client.** `<`, `>`,
`=` and `same`/`changed` are catalogue content. They arrive in `presented_choices` and are relayed
as whichever string the child picked. Hardcoding them in the registry would duplicate catalogue
content in the client and drift from it. Nothing in `renderers/` restates them; the test file uses
neutral placeholder choice strings except where a verbatim round-trip is the assertion.

**Lookup discipline.** The table is an object literal keyed by the nine format strings, looked up
with `Object.prototype.hasOwnProperty.call(...)` — never bare property access, which would resolve
`"constructor"`, `"toString"` or `"__proto__"` to inherited `Object.prototype` members and hand
back a bogus spec for a hostile or drifted format string.

**Fail closed — three paths, all `null`:** (1) unrecognized `response_format`; (2) a choice format
whose `presentedChoices.length` ≠ its expected count; (3) a non-choice format arriving with a
non-empty `presentedChoices`. All three are server/client structural drift. There is no fallback
surface, and specifically no degrade-to-free-text: a text box shown against `relation_choice`
would let a child type garbage and then be told they are wrong — exactly the failure the authority
boundary exists to prevent. Batch 9 renders `null` as a neutral error screen with a support code
and a single way home.

**Ordering.** `presented_choices` is passed through in server-given order and never re-sorted. The
server sorts lexicographically, which is why a child may see `10, 3, 9` — a real backend issue
tracked separately as Risk 1, not something this batch works around. Re-sorting client-side would
be the client transforming server data. Covered by a test on an already-unsorted input array.

**Encoding boundary.** `encode.ts` carries a top-of-file comment stating plainly that it
serializes a choice the child made and never parses, canonicalizes, compares, reorders or
validates an answer. `expanded_form` is trimmed only — no whitespace collapsing, no term
reordering, no case folding. The server owns normalization (`normalize_answer` strips leading
zeros, so `"03"` is the server's business) and correctness. Choice values leave byte-for-byte;
`interactive_set_selection` yields `String(count)`.

**Not touched, by design (FE-0c).** `component-b-api.ts` and `runtime-validation.ts` are unchanged
— in particular no `response_format` validation was added to `runtime-validation.ts`. The registry
is the single client-side owner of the set of known formats; a second list there would be a second
place for it to drift.

**Verification (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **86 passed, 0 failed** (62 pre-existing all still green + 24 new in
`src/api/__tests__/answer-renderer-registry.test.ts`). The test file lives in `src/api/__tests__/`
because that is the glob the runner uses; the registry modules import nothing from `react-native`,
so it needs none of the module patching `pending-session-command.test.ts` requires.

**Files touched:** `frontend/src/features/session/renderers/types.ts` (new),
`frontend/src/features/session/renderers/registry.ts` (new),
`frontend/src/features/session/renderers/encode.ts` (new),
`frontend/src/api/__tests__/answer-renderer-registry.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Prep screen: drop the unbackable skill claim, show real classroom/grade instead

**Why the skill could not simply be made dynamic.** The request was for the prep hero's hardcoded
"Counting" to reflect the real skill. It cannot, and the reason is structural rather than a
missing field: `skill_id` does not exist until a question is *selected*, and selection is the act
that starts the child's timeout clock (`timeout_deadline_utc = now + timeout`,
`opportunity_persistence.py:94`). Re-issuing an already-open opportunity preserves the original
deadline (`opportunity_selection.py:461`) and would be safe — but `GET /b/sessions/active`
returns only `{session_id, state, runtime_bundle_version, created_at_utc, row_version}` and
cannot report whether a question is currently open. So there is no way to ask for the skill on
this screen without risking creating a question and starting the child's 5-minute timer while
they are still reading the prep screen. Options were put to Yasindu; "neutral on prep, real skill
in session" was chosen.

**Changes (prep screen only — the home screen was explicitly out of scope and is untouched).**
- Hero subtitle no longer names a skill ("Let's start your **maths** adventure"). The
  `heroSkill`/`heroSkillCompact` styling is retained, so the hero's visual composition is
  unchanged — only the word it emphasises.
- The `lessonCard` is kept structurally (layout preserved, per Yasindu's standing constraint that
  the prep screen's design not change) but now carries genuinely-backed data instead of a fake
  skill: the learner's own classroom name and grade, read from
  `LearnerMembershipListItem.classroom_name` / `.grade` on their APPROVED membership, which the
  auth context has already loaded. Icon changed `calculator` -> `school` to match. Rendered only
  when an APPROVED membership exists, so the dev-fixture path (no membership) simply omits it
  rather than inventing a placeholder.
- Removed the now-stale in-code comment claiming no `grade` field is reachable from the frozen v1
  contract. That was true of `AuthenticatedPrincipal`/`LearnerProfileResponse` only; `grade` is on
  the membership DTO, and (separately) on `OpportunityPresentationResponse`.
- `previewLesson` is gone; `gradeLabels` replaces it.

The real, per-question skill will be surfaced on the live session screen (FE-3b), where
`OpportunityPresentationResponse` carries `skill_id`, `grade`, and `difficulty_level`
legitimately and at no cost.

**Verification (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **86 passed, 0 failed** (unregressed; this count includes FE-3a's 24 new
renderer-registry tests, which landed separately).

**Files touched:** `frontend/src/features/session/session-preparation-screen.tsx`,
`backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — FE-3b: live session screen — present, answer, submit, outcome

**What.** Replaced the `app/(learner)/session/[sessionId].tsx` placeholder with a real route
boundary over a new `frontend/src/features/session/live-session-screen.tsx`, plus the three answer
surfaces under `frontend/src/features/session/renderers/` (`choice-grid.tsx`, `free-entry.tsx`,
`count-selection.tsx`) and a pure decision module `live-session-logic.ts`. No backend change, no
API-layer change, no store change — FE-0b/0c/3a already shipped everything this consumes.

**In scope, and done:** select the question, render it, accept an answer, submit it, show the
outcome. **Explicitly not done, by design:** countdown UI (FE-3c), hints (FE-3d), advancing to the
next question (FE-3e), results (FE-3f). After an attempt is recorded the child sees the outcome
and "Back to home". There is deliberately no next-question button — inventing one would front-run
FE-3e's completion call.

**Mount → present.** `api.selectOpportunity` (no idempotency key, no body — it re-issues the
already-open question rather than minting a new one, which is what makes it the crash-recovery
path), validated by `isOpportunityPresentationResponse`, then `resolveRenderer`. Rendered:
`prompt.stem` only (other prompt keys are ignored this batch — richer prompt rendering is not in
scope and was not improvised), and `skill_id` via `formatSkillLabel` (underscore-split +
title-case, e.g. `number_sense` → "Number Sense"; a curated id→name lookup was *not* added,
since that would restate catalogue content in the client). `representation_type` is treated as
opaque — nothing branches on it. `presented_choices` is rendered in server-given order, never
re-sorted.

**Fail closed.** `resolveRenderer` returning `null` (and, belt-and-braces, a presentation with no
usable stem) yields a neutral error screen: child-appropriate copy, the `request_id` as a support
code, one "Back to home". No free-text fallback anywhere — a text box against `relation_choice`
would let a child submit garbage and then be told they were wrong, which is the exact failure the
registry's fail-closed design exists to prevent.

**Answer surfaces.** Each owns only its input affordance and reports an `AnswerState`;
`chosenIndex` indexes into `spec.choices`, so an unpresented answer stays structurally
inexpressible. Submit is unavailable exactly when `encodeSubmittedValue` returns `null` — no
selection yet, blank `expanded_form`, unset count. `initialAnswerState` seeds `chosenIndex: -1`
and `count: -1` so the disabled state needs no separate "has the child touched this?" flag, and so
that **count 0 stays a real, submittable answer** (an empty set) rather than being swallowed by
the seed. That disabled state mirrors the server's `min_length=1`: it prevents a guaranteed 422,
it is not a correctness judgement. `count-selection` imposes no maximum — a ceiling would be a
client-side rule about which counts are legitimate, which the server owns.

**Submit.** The `submit_response` `PendingSessionCommand` is persisted **before** the request and
cleared on success. The body is persisted with the key because the server fingerprints the body
into the idempotency record — a replay with a reconstructed body fails the fingerprint check, and
`client_elapsed_ms` is unrecoverable after a relaunch. A non-conflict failure deliberately leaves
the record persisted; that record is the whole point of the recovery path. On mount,
`decidePendingReplay` replays a saved submit verbatim (same key, same body) when its `sessionId`
*and* `itemOpportunityId` both match what the server just handed back, discards it when they do
not, and leaves commands of other kinds alone (the store slot is shared with the prep screen's
`start_session`). The one-shot token refresh retries the *same* call with the *same* key and body,
so it can never record a second attempt. `client_elapsed_ms` is telemetry only, measured from
question render (and re-measured on "try again") to submit tap.

**Outcome.** `AttemptResponse` is authoritative. RESPONSE+matched → positive, neutral, no advance.
RESPONSE+unmatched → "try again", with **no client-side attempt cap** (attempt limits are
unapproved placeholders and the client must not invent one). TIMEOUT → neutral "Time's up — let's
keep going", never presented as a wrong answer; this is reachable in this batch with no countdown
UI at all, simply by the server's five-minute deadline passing while the child thinks. A 409 on
submit re-calls `/opportunities` and re-renders whatever the server returns — no client-side rule
about what "should" have happened.

**Verification — unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **114 passed, 0 failed** (86 pre-existing all still green + 28 new in
`src/api/__tests__/live-session-logic.test.ts`, covering the skill-label formatter, stem
extraction, the mount branch choices including all three fail-closed paths and order preservation,
the not-yet-answered seeds, pending-command replay vs. discard vs. leave-alone, outcome
classification for RESPONSE-true / RESPONSE-false / TIMEOUT — including an assertion that timeout
copy contains no blaming words and offers no retry — and failure classification incl. the 409
resync route). No RNTL (Batch 15); the untested part is layout only.

**Verification — live: NOT PERFORMED.** None of the on-device steps in the batch brief were run:
no session was started against the BE-G2 fixture learner, no wrong/right answer was submitted, no
kill-and-resume was exercised, and no hand-edited unknown `response_format` was tried. This agent
session is non-interactive and has no device, emulator or running Expo/backend pair to drive, and
`scripts/dev_fixture_learner.py --test-fixture-only` creates real test data through the live
backend API, so it was not run either. **Formats actually exercised live: none.** All nine formats
are unit-tested only (via `resolveRenderer`/`planPresentation` in
`answer-renderer-registry.test.ts` and `live-session-logic.test.ts`); the two of those that this
screen's non-choice surfaces depend on — `expanded_form` and `interactive_set_selection` — have
had no real presentation rendered through them. The live checklist is outstanding and is Yasindu's
to run; an honest "none" is recorded here rather than an implied "all nine".

**Files touched:** `frontend/app/(learner)/session/[sessionId].tsx`,
`frontend/src/features/session/live-session-screen.tsx` (new),
`frontend/src/features/session/live-session-logic.ts` (new),
`frontend/src/features/session/renderers/choice-grid.tsx` (new),
`frontend/src/features/session/renderers/free-entry.tsx` (new),
`frontend/src/features/session/renderers/count-selection.tsx` (new),
`frontend/src/api/__tests__/live-session-logic.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — FE-3b live verification: partial, honestly scoped

Supervisor follow-up to the FE-3b entry, which recorded live coverage as "none". Yasindu has now
run the app against the real backend and shared a screenshot of a rendered question. Recording
exactly what that establishes and what it does not.

**Confirmed live (from the rendered question):**
- A real opportunity is selected, validated, and rendered end to end: stem `46, 47, 48, __`,
  skill badge "Counting", four choice buttons (47 / 48 / 49 / 50).
- Template is `B-CNT01-SEQ-CONTINUE`, `response_format: single_integer`. `resolveRenderer`
  resolved it as `kind: 'choice'` with `expectedChoiceCount: 4` and the arriving
  `presented_choices` matched — i.e. the strict count guard passed against real generator output,
  not a fixture.
- `formatSkillLabel` produced "Counting" from a real catalogue `skill_id`. This is the first time
  the actual skill has been surfaced in the UI; the prep screen deliberately cannot show it (see
  the prep-screen entry above).
- The submit button renders disabled before any selection — the `chosenIndex: -1` seed from
  `initialAnswerState` behaving as designed, keeping a value `encodeSubmittedValue` rejects from
  ever reaching the API layer (where it would fail `SUBMITTED_VALUE_MIN_LENGTH` anyway).
- Yasindu reports the flow works end to end.

**Formats exercised live: 1 of 9 — `single_integer` only.** The other eight remain unit-tested
only. `expanded_form` (typed answer) and `interactive_set_selection` (count surface) are the two
whose *rendering surfaces* have still never drawn a real server presentation, and they are the
least like the choice grid, so they carry the most residual risk.

**Not verified live, still outstanding:**
- Check 4 — kill-and-resume returning the same `item_opportunity_id` with no duplicate attempt.
- Check 5 — a real `event_kind: TIMEOUT` displaying as "Time's up" rather than as a wrong answer.
  This is the highest-value outstanding check: it is the one that decides whether a child who
  simply thought for too long is told they got it *wrong*. Reachable in this batch with no
  countdown UI at all, just by exceeding the server's five-minute deadline.
- Check 6 — an unknown `response_format` degrading to the neutral error screen rather than a
  free-text box.

Wrong-answer and right-answer outcome paths were reported working but not separately evidenced;
they are covered by unit tests over `classifyAttemptOutcome`/`outcomeView`.

**Incidental note (not a defect in this batch).** The lexicographic `presented_choices` ordering
(Risk 1) is invisible in this particular question because 47/48/49/50 sort identically
numerically and lexicographically. It will surface on any template mixing digit lengths, where a
child would see e.g. `10, 3, 9`. The client correctly does not re-sort.

No files touched; verification record only.

---

## 2026-07-29 — FE-3b live verification: checks 2 and 3 confirmed

Supplement to the previous entry. Yasindu ran both outcome paths on the real backend
(`B-CNT01-SEQ-CONTINUE`, `single_integer`, stem `46, 47, 48, __`).

**Check 3 — correct answer.** Selecting 49 produced "Nice work! / That one is right." with no
try-again affordance, i.e. `classifyAttemptOutcome` -> `'correct'` and `outcomeView`'s
`canTryAgain: false`, rendered from a real `AttemptResponse`.

**Check 2 — wrong answer.** Selecting 47 produced "Not quite / Have another go — you can try as
many times as you like." with TRY AGAIN offered. Confirms `'incorrect'` classification, the
non-blaming copy, and the absence of any client-side attempt cap (attempt limits remain
unapproved placeholders; the client must not invent one).

**What this additionally establishes, beyond the two branches themselves:** the server accepted
the submitted string and judged it against its own catalogue answer — 49 matched, 47 did not.
That is live confirmation of FE-3a's verbatim-encoding contract (`encodeSubmittedValue` relays
the chosen `presented_choices` entry unmodified) against real generator output, not a fixture.
The client never computed correctness; `AttemptResponse` was authoritative in both cases.

**Live coverage now: checks 1, 2, 3 confirmed. Formats: 1 of 9 (`single_integer`).**

**Still outstanding, unchanged:** check 4 (kill-and-resume returning the same
`item_opportunity_id`), check 5 (a real `event_kind: TIMEOUT` displaying as "Time's up" rather
than as a wrong answer — still the highest-value outstanding check), check 6 (unknown
`response_format` degrading to the neutral error screen). `expanded_form` and
`interactive_set_selection` surfaces have still never drawn a real presentation.

**Cosmetic observation, not a defect, deliberately not changed.** The selected-choice chip uses
the same pink/accent treatment whether the attempt was correct or incorrect; the outcome is
carried entirely by the card below it (green for correct, blue for "Not quite"). A red-adjacent
highlight sitting above "Nice work!" is a mildly mixed signal for a seven-year-old. Raised for
Yasindu's judgement rather than altered — the prep/session visual design is his, and the
semantics are legible from the card. Noted here so it is a decision on record, not an oversight.

No files touched; verification record only.

---

## 2026-07-29 — FE-3c: timeout handling — the deliberately small batch

**The durable finding: the plan's original "disable the answer surface on expiry" would have
soft-locked the session, permanently.** This is the entry worth keeping; the code is almost
nothing.

Three server facts make the disable-on-expiry instinct actively harmful:

1. `is_timeout` is evaluated **server-side at submit time** — `now >= opportunity.
   timeout_deadline_utc` (`attempt_submission.py:213`).
2. On timeout the server sets `submitted_value = None` and `response_matched = None` and never
   compares the answer (`attempt_submission.py:216-229`). Submitting "late" therefore costs the
   child nothing.
3. Advancing past an opportunity requires **at least one recorded attempt or timeout**
   (`session_completion.py:22`), and **no server-side sweep exists** — the only way a TIMEOUT is
   ever recorded is if the client submits after the deadline.

Chain them: disabling input on expiry means no submit → no recorded TIMEOUT → no advance. The
child would be stuck on that one question forever, holding the only key to a lock they could no
longer reach. The child must **always** be able to select and submit. That rule is now enforced by
a unit test with the reasoning written next to it, not by a comment alone.

**What was actually built.**

- `isDeadlinePassed(deadlineUtc, now)` in `live-session-logic.ts` — pure, `>=` to match the
  server's own comparison, and treats an unparseable date as *not* passed (the fail-safe direction
  is always the one that keeps the child able to answer). `timeoutDeadlineUtc` had been carried on
  `SessionPlan` since FE-3b and read by nothing; it is now read.
- `isAnswerSurfaceDisabled({ submitting, hasOutcome, deadlinePassed })` — takes `deadlinePassed`
  and **deliberately ignores it**. Giving the ignoring a named, exported seam is the point: it
  turns "do not gate interactivity on the clock" from a comment someone could tidy away into an
  invariant with a failing test attached. The screen now derives both the surface's `disabled`
  state and submit availability from this one function, so the two cannot drift apart.
- Clock skew at mount changes nothing. A device set hours ahead reports `deadlinePassed: true` and
  the surface stays fully interactive; the client clock is advisory and `event_kind` on the
  response is the only truth.

**What was deliberately not built.** No countdown UI (a ticking clock in front of a seven-year-old
is an anxiety device, and it would be counting down to something the client cannot enforce). No
"time is running out" pre-warning — telling a child "time's up, but please answer anyway so we can
move on" is incoherent to them. No timer, no polling, no re-render on a tick. No duration is
hardcoded anywhere: the bound is unapproved policy and exists only in the server's
`server_timeout_deadline_utc`. FE-3b's TIMEOUT classification and its neutral "Time's up / Let's
keep going" copy were **verified, not rebuilt** — `classifyAttemptOutcome` and `outcomeView` are
untouched.

**Verification — unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **125 passed, 0 failed** (114 pre-existing all still green + 11 new in
`src/api/__tests__/session-timeout.test.ts`): `isDeadlinePassed` past/future/exactly-equal/
unparseable; the soft-lock guard (surface stays interactive with `deadlinePassed: true`), carrying
the full reasoning inline so nobody "fixes" it later; the clock-skew case; the inert-only-while-
submitting-or-outcome case; a real-shaped TIMEOUT (`response_matched: null`, no echoed
`submitted_value`) still classifying as `'timeout'` and never `'incorrect'`, with neutral copy and
no retry prompt; and a grep-as-a-test (same pattern as `no-auth-bypass.test.ts`) asserting that
`300000`, `300_000`, `300` and `5 * 60` appear in none of the three session modules.

**Verification — live: NOT PERFORMED.** This batch was supposed to close FE-3b's outstanding
check 5, and it does not. The run requires starting a real session on a device, leaving the
question on screen past the server's deadline, and then answering — this agent session is
non-interactive with no device, emulator or running Expo/backend pair to drive. So: **not
confirmed live** that the result reads "Time's up / Let's keep going" rather than "Not quite", and
**not confirmed live** that the answer surface was still usable on return. No backend-side
shortening of the deadline was used, because no live run happened at all — worth stating, since a
shortened deadline would change what such a run proves. FE-3b's check 5 remains open and is
Yasindu's to run; the unit tests lock the logic, not the rendered experience.

**Files touched:** `frontend/src/features/session/live-session-logic.ts`,
`frontend/src/features/session/live-session-screen.tsx`,
`frontend/src/api/__tests__/session-timeout.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-29 — Timeout policy: a measurement consequence, recorded for gate-B

No code change. Raised while reviewing a proposed deferral note ("revisit expired-question UX in a
later design pass if user testing suggests children need a clearer indication that time has
elapsed"). That note was not adopted; this entry records why, and the finding behind it.

**The deferral's trigger cannot fire.** Conditioning a revisit on user testing is conditioning it
on evidence gate-B currently prohibits collecting — no real-child, pilot, or production use is
authorized. That is "never" phrased as "later". (Compare Batch 15/FE-4a, which was deferred but
given an explicit schedule precisely so it would not quietly become never.)

**The substantive finding: a silent deadline is a measurement problem, not only a UX one.**
`attempt_submission.py:216-229` discards `submitted_value` on timeout and never compares it
(`response_matched = None`). `session_completion.py:167-172` then folds that into the record as:

    first_attempt_correct = bool(first.response_matched) if first.event_kind == "RESPONSE" else False
    -> first_attempt_error_pattern = "timeout_no_response"

So a learner who deliberates past the bound and selects the **correct** answer is recorded as
`first_attempt_correct = False` with error pattern `timeout_no_response`, and the answer they gave
is never examined. That value feeds `aggregate_session`, first-attempt accuracy, and per-skill
outcomes. The bias has a direction: slower learners accumulate more timeouts, so recorded
first-attempt accuracy is systematically depressed for exactly the learners who take longest.

The obvious counterpoint runs the same way rather than against it. Five minutes is long for a
Grade-2 counting item, so a real timeout more likely reflects an interruption or the child walking
away than deliberation — but that is then recorded as a first-attempt failure with a specific
error pattern, attributing a classroom artifact to mathematical ability.

**Therefore the open question is not "should there be a countdown".** It is whether a hard bound
that silently discards answers is the right policy at all. `DEFAULT_TIMEOUT = timedelta(minutes=5)`
(`opportunity_selection.py:99`) is an unapproved engineering placeholder, and timeout policy is
already on the gate-B list. A countdown is one candidate answer to a question nobody has decided.

**Recorded position.** Expired-question UX stays deferred, but tied to **gate-B's timeout-policy
decision** — a milestone that will actually occur — rather than to user testing that cannot
currently happen. Whoever resolves that decision should see the paragraph above first: whether
children need a visible cue is downstream of whether the bound should discard answers at all.
Nothing in FE-3c changes on account of this; gate-B blocks real-child use, so no learner is
affected today.

No files touched; decision record only.

---

## 2026-07-30 — FE-3d: hints — built for 409 as the normal response

**Catalogue fact, verified rather than assumed.** Counted directly in
`backend/tests/fixtures/runtime_bundle/test_catalogue.md` (the catalogue behind
`be3b-test-fixture-1.0`, the only bundle `_ENGINEERING_TEST_BUNDLES` resolves): **36 templates, of
which exactly 2 carry hint content — `B-CNT01-SEQ-CONTINUE` and `B-ADD04-2D-NO-REGROUP` — and both
carry all three levels, L1, L2 and L3.** The earlier plan's claim that B-ADD04 had L1 only is
wrong; it has `hint_level_1/2/3` populated, same as B-CNT01. So a 409 on the first request is the
outcome for 34 of 36 templates (~94%), and this batch is built with that as the default case
rather than the exception.

Related discrepancy, recorded but not resolved here: `buildLog.md:334` states "all 29 implemented
templates expose nonblank exact L1/L2/L3 catalogue hints". That does not hold for this fixture
catalogue (2 of 36), and the BE3c characterization test it summarizes actually asserts exact text
for a single hint (`B-ADD04-2D-NO-REGROUP` L1) plus fail-closed on one missing one
(`B-DIV03-DIVIDE-BY-2`). Whoever owns the catalogue should reconcile that bullet; nothing in this
batch depends on which is true, because the client treats 409 as normal either way.

**The 409-neutrality is a governance property and is respected.** `hint_request.py` maps "no hint
content for this template", "blank content", "catalogue/bundle checksum mismatch" and "already at
L3" to one indistinguishable `ConflictError`, so the service can "fail closed, never synthesize or
approximate, never reveal the correct answer through the error path". The client therefore makes
**no attempt** to infer which 409 it received — a unit test asserts that a 409 on the first request
and a 409 after L3 produce identical state, with the reasoning inline so nobody adds a "you've used
them all" branch later. The information genuinely is not there, and guessing would work against the
design.

**Behaviour.** On 201, the hint renders attributed to its `hint_level` and **accumulates** —
previously received hints stay on screen, because L2 elaborates on L1 and a child who has lost L1
off-screen has lost the scaffold it was giving them. On 409 the control closes for that opportunity
and the child sees `HINTS_UNAVAILABLE_COPY`: **"No extra help for this one — have a go!"** A test
asserts the copy contains none of "no hints available", "not allowed", "used up", "sorry", "can't",
"denied" — a child who has just admitted they need help must not be met with a rebuff, with blame
for asking, or with the suggestion that help was withheld as a consequence. The client never
requests or sends a level; the server derives it from its own count under the opportunity row lock.
Hint state is keyed on `item_opportunity_id` and resets when that changes, so it stays correct when
FE-3e advances the loop in place; a re-presentation of the *same* opportunity (crash recovery)
keeps the hints already given. **Asking for a hint never touches the answer surface** — the same
principle FE-3c locked in — and a hint is never a mastery/BKT observation, so it costs the child
nothing anywhere in the science.

**The lost-response escalation hazard, and what the persisted key prevents.** This is the real
correctness point. If an assist request succeeds but its response is lost — network drop, app kill
— retrying with a *fresh* idempotency key makes the server count the first event and escalate: the
child silently never sees L1, the gentlest hint, and lands on L2 instead. So the `request_assist`
pending command is persisted **before** the request, and on the next tap `decidePendingAssist`
reuses the saved key for the same session+opportunity, which returns the original level and content
with no re-escalation. The key is cleared on success **and on 409** (both are terminal; there is
nothing left to replay). Any other failure deliberately changes no state: the key stays persisted
so the next tap replays rather than escalates, the control stays available, and the failure is not
promoted to the full-screen failure phase — losing the question because a hint request failed would
be far worse than not getting the hint.

**Store-slot collision, checked not assumed.** `session-command-store.ts` has a single pending slot
shared with `submit_response`, so saving an assist command could in principle overwrite a submit
recovery record. It cannot be reached from the UI: a non-409 submit failure moves the screen to the
`failure` phase, where the question and its hint control are not rendered at all. No store change
was needed (and none was in scope), but this is an invariant to preserve when FE-3e lands.

**One judgment call.** `HIGHEST_HINT_LEVEL = 3` exists in the client, used for exactly one thing:
not sending a fourth request whose 409 is already certain. It mirrors a real, doubly-enforced
server contract (`MAX_ASSIST_LEVEL` in `hint_request.py`, and the DB `CheckConstraint
"assist_level >= 1 AND assist_level <= 3"`), it is not an authority — the 409 path is, and it
produces the identical `unavailable` state — so if the ladder ever lengthens server-side the only
cost is one wasted request, never a wrong state.

**Verification — unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **140 passed, 0 failed** (125 pre-existing all still green + 15 new in
`src/api/__tests__/session-hints.test.ts`): the availability ladder available → L1 → L2 → L3 →
unavailable; accumulation in level order, including out-of-order arrival and no duplicate on a
replayed key; 409-on-first-request closing hints; 409-first and 409-after-L3 being
indistinguishable; unavailable being terminal; the copy guard; per-opportunity reset and same-
opportunity persistence; and assist-key reuse vs. fresh, including never mistaking a persisted
`submit_response` for an assist key.

**Verification — live: NOT PERFORMED.** No hint was requested against a real session. This agent
session is non-interactive with no device, emulator or running Expo/backend pair to drive, so none
of: the L1 → L2 → L3 → 409 walk on `B-CNT01-SEQ-CONTINUE`, the first-request 409 on any other
template, all three hints staying visible, the control disabling, or answering normally with hints
on screen. **Templates reached live: none.** The catalogue facts above were established by reading
the fixture catalogue, not by exercising the endpoint. This is now the third batch (with FE-3b
check 5 and FE-3c) whose live checklist is outstanding and Yasindu's to run.

**Files touched:** `frontend/src/features/session/live-session-logic.ts`,
`frontend/src/features/session/live-session-screen.tsx`,
`frontend/src/api/__tests__/session-hints.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — Audit correction: the BE3c hint-coverage bullet is contradicted by its own test

Raised during FE-3d and verified by the supervisor. No code change; this corrects the written
record, which `buildLog.md` cannot carry because it is closed as of FE-0c.

**The claim.** `buildLog.md:334` lists among BE3c's verified characterizations:

> all 29 implemented templates expose nonblank exact L1/L2/L3 catalogue hints

**What the cited test actually asserts.** `tests/test_be3c_characterization.py` does two things
with hints, not one:

- line 215 — `adapter.get_hint(catalogue, catalogue_checksum, "B-ADD04-2D-NO-REGROUP", 1)` returns
  exact content;
- line 224 — `adapter.get_hint(catalogue, catalogue_checksum, "B-DIV03-DIVIDE-BY-2", 1)` **fails
  closed**, because that template has no hint at all.

The second assertion is direct evidence against the bullet: the test relied on as proof that every
template has hints itself demonstrates one that does not. `tests/test_be3b_live_engine_adapter.py`
(lines 160, 168) follows the same one-present/one-absent pattern.

**Independent count of the live fixture.** `tests/fixtures/runtime_bundle/test_catalogue.md` — the
catalogue behind `be3b-test-fixture-1.0`, the only bundle `_ENGINEERING_TEST_BUNDLES` resolves —
contains **36** `item_template_id` entries, of which exactly **2** carry hint text:
`B-CNT01-SEQ-CONTINUE` and `B-ADD04-2D-NO-REGROUP`. Both carry all three levels (L1, L2 and L3);
an earlier plan note describing B-ADD04 as L1-only was wrong and is corrected here. There is no
second catalogue artefact that could reconcile the bullet: `component_b_generator/catalogue/`
ships a loader only, no data.

**Status.** The bullet is inaccurate as written for this fixture, both in the coverage it claims
and in the template count (29 vs 36). Whether it was ever true of some other catalogue is for
whoever owns that artefact to determine — recorded, not resolved, and deliberately not edited into
the closed log.

**Why nothing downstream depends on it.** FE-3d treats 409 as the normal response and does not and
cannot distinguish its causes (`hint_request.py` maps missing content, blank content, checksum
mismatch and level-4 alike to a neutral `ConflictError`, explicitly so the error path cannot leak
the answer). The client behaves identically whichever reading of the catalogue is correct; only
the audit record was wrong.

No files touched; correction record only.

---

## 2026-07-30 — Live-verification debt now spans three batches

Consolidated so it is visible in one place rather than spread across three entries.

FE-3b (check 5), FE-3c and FE-3d have all closed with unit verification green and **no live run**.
Each was honestly reported as such at the time; the point of this entry is that the individual
gaps now form a pattern worth naming.

| Batch | Outstanding live check | Why it matters |
|---|---|---|
| FE-3b | Kill-and-resume returns the same `item_opportunity_id`; unknown `response_format` fails closed | Guards against a duplicate attempt, and against a text box appearing where a choice grid belongs |
| FE-3c | A real `event_kind: TIMEOUT` renders as "Time's up", not "Not quite" | Decides whether a child who thought too long is told they were wrong |
| FE-3d | `B-CNT01-SEQ-CONTINUE` L1→L2→L3→409 walk; first-request 409 on any other template | The 409 path is ~94% of real hint requests and has never been seen on screen |

Also unchanged: **1 of 9 answer formats has been exercised live** (`single_integer`). The typed-answer
(`expanded_form`) and count (`interactive_set_selection`) surfaces have never drawn a real
presentation.

None of this blocks FE-3e, and the logic in every case is locked by unit tests. It is recorded
because "unit-tested, not seen" is a materially different claim from "verified", and three batches
of it accumulating silently is how the difference gets forgotten.

No files touched; verification record only.

---

## 2026-07-30 — FE-3e: advancing the session loop

**The non-obvious part: `OpportunityPresentationFields` is not `OpportunityPresentationResponse`.**
The next question arrives inline on the advance response as `next_opportunity`, typed
`OpportunityPresentationFields | null` — the *fields* shape, which carries no `request_id` of its
own (only the outer `OpportunityAdvanceResponse` has one). `planPresentation` had been reading
`presentation.request_id` directly since FE-3b, so it could not consume the inline question at all.

It now takes the request id as a second parameter: `planPresentation(fields, requestId)`. The
original call site passes `POST /opportunities`' own `response.request_id`; the advance path passes
the **advance response's** `request_id`, because that is the request which produced this question
and therefore the correct support code for it — a grown-up quoting it should land on the request
that actually generated what is on screen. `OpportunityPresentationResponse` is structurally a
superset of the fields shape, so the original call site needed no other change. Validation is
already correct upstream and was not touched: `isOpportunityAdvanceResponse` validates
`next_opportunity` with `isOpportunityPresentationFields` (the Fields validator), not the Response
one, exactly as FE-0c shipped it.

**No second round trip.** When `next_opportunity` is non-null the plan is built from it directly.
`POST /opportunities` is not called again — the authoritative presentation is already in hand, and
a re-fetch would be latency a child pays for nothing.

**Progress is the server's, always.** `opportunities_completed` / `opportunities_total_bound` are
displayed exactly as returned, and are absent from the UI until the first advance reports them
(`POST /opportunities` does not carry them, and seeding a client-side guess would be worse than
showing nothing). Verified at source that the bound is a placeholder:
`session_completion.py:124` defines `MAX_OPPORTUNITIES_PER_SESSION = 5`, described in that module's
own docstring as "a fixed engineering session-length" — not governed policy. So the completion copy
is deliberately unceremonious ("All done for now", plus the server's own numbers) rather than
treating finishing them all as an achievement, which would dress a placeholder up as a milestone.
A grep-as-a-test enforces the absence of the literal, matching the FE-3c timeout guard.

That guard immediately caught something worth recording: it failed on **this batch's own comment**
in `live-session-logic.ts`, which spelled out `MAX_OPPORTUNITIES_PER_SESSION = 5` while explaining
why not to hardcode it. The comment was reworded rather than the guard exempted — a guard with
exemptions is a guard nobody trusts, and the literal now appears nowhere in the file, prose
included. `live-session-screen.tsx` is scanned with its `StyleSheet.create` block excluded (font
sizes and opacities are full of legitimate 5s); the split marker is asserted so the guard cannot
silently pass by failing to find it.

**Advance gate.** Verified at `session_completion.py:321-325`: `attempt_count < 1` raises
`ConflictError`. The "Next question" control therefore appears only once an outcome is on screen.
A recorded TIMEOUT satisfies this — which is precisely why FE-3c's "always let them submit" rule is
what makes a session advanceable at all; the two batches interlock. After a wrong answer the child
gets both "Try again" and "Next question": trying again is offered, never required.

**Drift, failures, and the shared store slot.** `decideAdvance` fails closed on both contradictory
shapes — a null `next_opportunity` while `session_state` is still `'active'`, and a non-null one
alongside `'completed'` (reaching the bound is exactly what makes it null; answering into a session
the server considers finished is the worse guess). Both re-ask `POST /opportunities` and render
whatever comes back, never a client-side rule about what should have happened. A 409 on complete
routes the same way. The complete command's idempotency key is persisted before the request and
cleared on success — the fingerprint is `{session_id, item_opportunity_id}`, so a replay returns
the original advance, whereas a lost response retried with a fresh key would risk closing an
opportunity twice. Saving it overwrites the shared pending slot, which is correct here: anything
still in that slot belongs to the question being left behind (FE-3d's assist key, say), and a stale
command must never survive into the next question. On advance, answer state, outcome, hint state
and the `client_elapsed_ms` reference all reset; hint state resets by **re-keying** on the new
`item_opportunity_id` — FE-3d's existing scoping, verified rather than rebuilt.

**Completion state.** `session_state: 'completed'` with `next_opportunity: null` moves to a minimal
completion phase with the server's progress numbers and the existing "Back to home". FE-3f owns the
real results screen; this batch only needed to arrive there cleanly instead of dead-ending on a
blank question surface.

**Verification — unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **155 passed, 0 failed** (140 pre-existing all still green + 15 new in
`src/api/__tests__/session-advance.test.ts`; the twelve `planPresentation` call sites in
`live-session-logic.test.ts` were updated for the new two-argument signature and are unchanged
otherwise). New coverage: next-question-inline (including the request-id sourcing and a drifted
inline `response_format` still failing closed), `planPresentation` accepting the fields shape
directly, completion, both drift shapes, progress passthrough including a bound the client has
never seen, the advance gate, 409 routing, per-question state reset, stale pending commands being
refused by both decision helpers, and the two bound-literal guards.

**Verification — live: NOT PERFORMED.** No five-question run happened. This agent session is
non-interactive with no device, emulator or running Expo/backend pair, so none of: advancing
through all five with progress incrementing from the server's numbers, kill-and-resume between two
questions, hint state resetting across an advance, or reaching the completion state. **Formats seen
across a real run: none** — the five-question run was to be the first realistic chance to see
anything other than `single_integer`, and that observation has still not been made. This is now the
fourth consecutive batch (FE-3b check 5, FE-3c, FE-3d, FE-3e) with an outstanding live checklist,
all Yasindu's to run.

**Files touched:** `frontend/src/features/session/live-session-logic.ts`,
`frontend/src/features/session/live-session-screen.tsx`,
`frontend/src/api/__tests__/session-advance.test.ts` (new),
`frontend/src/api/__tests__/live-session-logic.test.ts`, `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — Hint port: all 36 templates now carry governed catalogue text

**Result: 36 of 36 templates ported, 108 hint strings, 0 missing or blank.** Source: §11 of
`Yass/Component_B_v1.0/R26-IT-138_Component_B_Item_and_Task_Set_Catalogue_v1.0.md`, the file
`catalogue/loader.py` calls authoritative. Every string was copied programmatically and then
compared field-by-field against the source — all 108 equal, zero mismatches. No hint text was
written, reworded, shortened or "improved"; nothing was authored. Template ids matched 1:1 between
fixture and source (no fixture-only or source-only ids), so no gap had to be filled — which matters,
because §7 rule 6 forbids unreviewed free text in the child-facing hint loop and rule 8 requires
review for language load. Had a hint been absent from §11, the instruction was to stop and report
rather than fill it; that did not arise.

**The finding worth recording: the hint text shown in every test run to date was never reviewed.**
The fixture's two pre-existing templates did not carry governed text — they carried text written for
the fixture. `B-ADD04-2D-NO-REGROUP` L1 was `"Add the ones first, then the tens."`; the governed
string is `"Add ones with ones and tens with tens."` `B-CNT01-SEQ-CONTINUE` L1 was `"Look at the
last number in the sequence and count one more."`; governed is `"Say the number that comes next."`
Same for their L2/L3. So every hint that has ever appeared in a test, a screenshot, or FE-3d's
design reasoning was unreviewed pedagogical content that merely looked plausible. This batch is
therefore a **correction**, not only an addition — the six pre-existing lines were replaced, not
preserved. Nothing else in the file changed: `git diff` reports 108 insertions and 6 deletions, and
a filtered diff confirms **zero** non-`hint_level_*` lines were touched — ids, `set_id`, `skill_id`,
`status`, the 36-template count and `compatibility.required_catalogue_template_count: 36` are all
byte-identical.

**Checksum.** Editing the catalogue invalidated the pinned sha256, which would have made readiness
fail and every question request 409. Recomputed and updated in all three bundle fixtures:
`2ad3d72f2da5825ed673e2384344e499d0fdfa5e13921e3eac8721a09b314abd` →
`cc02014d9abcb5f14d802199e474e997599481fa5ebe10370f73bafa9008d3e0`
(`valid_unapproved_bundle.json`, `bad_checksum_bundle.json`, `missing_field_bundle.json` — exactly
one occurrence each, all the `catalogue` checksum, confirmed distinct from `bad_checksum`'s
deliberate `ffff…` *generator* defect at its line 13, which was left untouched).

**Assertions fixed — and three more than the brief anticipated.** The brief named four assertions in
two files. A fifth, sixth and seventh exist in a third file the brief did not mention,
`tests/test_be4d_hint_events.py`, and they fail for exactly the same reason. They were fixed in the
same spirit rather than left red, since leaving the suite failing was not an option and the cause is
identical:

- `test_be3c_characterization.py` / `test_be3b_live_engine_adapter.py` — governed L1 text; and
  `test_be4d_hint_events.py` lines 267 and 302 — governed L1 and L3 text.
- The fail-closed tests (three of them, one per file) could no longer use
  `B-DIV03-DIVIDE-BY-2` as a template that "happens to have no hint", because it now has three.
  **They were not deleted** — the never-synthesize-a-fallback guarantee is the property that makes
  the hint loop safe. Absence is now constructed explicitly: an unknown template id, and (where the
  adapter is called directly) an out-of-range level 4, both documented fail-closed paths in
  `behaviour/hints.py`. Tests renamed `missing_` → `absent_` and each carries a note saying plainly
  that **no catalogue template exercises the missing-content path any more**, so a future reader
  cannot mistake this for coverage quietly dropped.

**A false green, caught — and the reason to distrust the first run.** The first
`docker compose exec api pytest -q` returned **244 passed**, and it was meaningless. `compose.yaml`
bind-mounts nothing into the `api` service; the code and fixtures are baked into
`upadya-backend:be1-batch3`, and the running container was a 20-hour-old image. It passed because it
was testing the *old* catalogue against the *old* assertions — none of this batch's changes were in
it. Confirmed directly: a script run inside that container computed the pre-edit checksum
`2ad3d72f…` and still raised `HintUnavailableError` for `B-DIV03-DIVIDE-BY-2`. Reporting that first
result as verification would have been a straightforwardly false claim of green. After
`docker compose up -d --build api`, the suite ran against the real changes and initially failed —
the three `test_be4d_hint_events.py` cases above. After fixing those: **244 passed** for real
(second rebuild). Anyone verifying a fixture or catalogue change in this repo must rebuild first;
`exec api pytest` alone silently tests a snapshot.

**Live verification — what was actually exercised.**

- `python scripts/dev_fixture_learner.py --test-fixture-only` → **exit 0**, self-verify served an
  opportunity. It first failed with a 409 on `/opportunities`, which was **not** a missed checksum:
  it was the documented pre-existing bundle-shadowing condition (`scripts/README.md`, "Honest
  limitations") — the full-suite run inserts throwaway `PUBLISHED`+`APPROVED` `bundle-*` rows with
  later timestamps that shadow `be3b-test-fixture-1.0`, the only version opportunity selection can
  serve. Confirmed read-only: 12 such rows, all newer than the fixture bundle. Restored per that
  README's operator note with a single dev-DB timestamp bump on the `be3b-test-fixture-1.0` row
  (`created_at_utc = now()`). Recorded because it is a state change outside this batch's file scope;
  the prior value is not meaningful to preserve, since the suite's migration-downgrade tests drop and
  recreate that row with a fresh timestamp on every run anyway.
- Inside the rebuilt container: the readiness assertion `assert_catalogue_matches_bundle` passes
  against the new checksum, and `adapter.get_hint` on **`B-DIV03-DIVIDE-BY-2` — a template that
  raised `HintUnavailableError` before this batch —** now returns governed L1/L2/L3 text.
- Over real HTTP as the fixture learner: `POST .../assists` returned **201, 201, 201** for L1→L2→L3
  on `B-CNT01-SEQ-CONTINUE`, with `content_id`s `…::hint_l1/2/3` and, decisively, the **governed**
  strings (`"Say the number that comes next."`) rather than the old fixture-authored ones. That is
  end-to-end proof the port reached the running system: the pre-port text would have appeared
  otherwise.
- Spot-checked three ported hints character-for-character against §11 (`B-ADD04-2D-NO-REGROUP` L1,
  `B-CNT01-SEQ-CONTINUE` L1, `B-DIV03-DIVIDE-BY-2` L1) — all equal; the programmatic comparison
  covered all 108.

**Live verification — the one gap.** A 201 on a previously-hintless template over the **HTTP** layer
specifically was not reached. Sequencing served `B-CNT01-SEQ-CONTINUE` (one of the two that already
had hints), and walking the session forward to reach a different template was interrupted when the
shell tooling became unavailable mid-run. The substance is covered from two directions — the same
adapter call the HTTP route delegates to returns governed text for `B-DIV03-DIVIDE-BY-2`, and the
HTTP path returned governed rather than fixture text — but the specific combination
(previously-hintless template *and* HTTP 201) has not been observed. **Formats seen live during this
batch: `single_integer` only**, consistent with the standing 1-of-9 figure.

**Found and deferred, deliberately not bundled: the `response_format` vocabulary discrepancy.** The
authoritative catalogue and the vendored samplers use different format vocabularies. The catalogue
has six the samplers do not (`ordered_integer_sequence`, `single_integer_or_mark`,
`single_mark_choice`, `structured_exchange`, `structured_pair`, `structured_triple_or_expression`),
and the samplers have `expanded_form`, which the catalogue lacks. Nothing here touched
`response_format` anywhere. This is a real pre-existing question for whoever owns the generator and
catalogue, and reconciling it is a separate decision — note also that FE-3a's renderer registry is
built against the *sampler* vocabulary, so if the catalogue's names ever become authoritative on the
wire, six of them would fail closed at the client with the neutral error screen.

**Files touched:** `backend/tests/fixtures/runtime_bundle/test_catalogue.md`,
`backend/tests/fixtures/runtime_bundle/valid_unapproved_bundle.json`,
`backend/tests/fixtures/runtime_bundle/bad_checksum_bundle.json`,
`backend/tests/fixtures/runtime_bundle/missing_field_bundle.json`,
`backend/tests/test_be3c_characterization.py`, `backend/tests/test_be3b_live_engine_adapter.py`,
`backend/tests/test_be4d_hint_events.py`, `backend/buildLog1.md`.

Also changed outside the file scope, recorded above: one dev-database `created_at_utc` value on the
`be3b-test-fixture-1.0` runtime-bundle row, and the local `upadya-backend:be1-batch3` image was
rebuilt (twice) so the test suite would exercise these changes at all.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-3f: session results — counts, and a way home

**Corrected before building: `/summary` and `/complete` do not disagree by one.** The plan asserted
a count discrepancy needing reconciliation. Checked at source, and there is none.
`session_completion.py:330` reads `count_for_session` *after* the current opportunity is closed
(:327-328) and *before* the next is created (the else branch at :347), and `:549` reads
`count_closed_for_session`. At every point either value is observable, all of the session's
opportunities are closed, so the two agree. No reconciliation was written — writing one would have
added permanent complexity to paper over a discrepancy that does not exist.

**The real quirk, which does matter.** `session_completion.py:550`:

    session_state = "completed" if session_row.state == "completed" else "active"

`abandoned`, `expired` and `technical_failed` all report as `"active"`, so `/summary` can never tell
a caller that a session ended badly.

**Decision: `/summary` is not called on this path.** The completion response already carries
`opportunities_completed` and `opportunities_total_bound`, and FE-3e already holds both in the
completed phase. Calling `/summary` would add a round trip for numbers already in hand and would
import the abandoned-reports-as-active behaviour above for no benefit. `getSessionSummary` stays
built and unused, with a comment in `component-b-api.ts` saying exactly that so it does not read as
an oversight.

**Results are deliberately not persisted and not deep-linkable.** They do not survive a reload, and
that is the design rather than a gap: the app keeps no learner-facing record of performance, so there
is nothing to return to. A child who reopens the app lands on preparation and starts fresh. Stated in
the results screen's own header comment so it is not "fixed" later.

**The surface.** Counts and a way home — `"All done!"` over `"You finished 5 of 5 questions today."`
No score, no percentage, no stars, no streak, no per-skill breakdown, no mastery, no "you got 3
right". The displayed completed value is clamped to the bound (and floored at zero), so a server
anomaly can never render "6 of 5" at a child. No session length is hardcoded — the FE-3e
bound-literal guard still scans `live-session-logic.ts` and stays green.

**The prohibition, and how it was made testable rather than merely commented.** The client *does*
observe every `response_matched` during a session. It must never accumulate them into a score, a
count of correct answers, or any derived summary: the backend deliberately withholds an evaluative
summary from the child-facing surface, so a client that assembled one from responses it happened to
see would be synthesising precisely what was withheld — a governance violation wearing the costume of
a helpful UI feature. A child who got everything wrong and a child who got everything right see the
identical screen, by design.

Rather than trusting a comment to survive, `resultsView(progress, outcomeHistory?)` **accepts** an
outcome history and never reads it — the same named-seam trick FE-3c used for `deadlinePassed`. A
unit test then asserts the copy is byte-identical across all-correct, all-incorrect, all-timeout,
mixed and empty histories, which is the strongest available guard that nothing evaluative has leaked
in. The reasoning is written at both the function and the screen, because without it a reviewer sees
an obvious missing feature and helpfully adds it.

**On exit.** `clearActiveSessionId()` then `(learner)/home`. Left behind, the stored id would let a
later launch offer "Resume" and then attempt to resume a session the server has already completed.

**Where the pure logic lives.** `clampCompleted` and `resultsView` went into the existing
`live-session-logic.ts` rather than a new module: `session-results-screen.tsx` imports `react-native`,
so anything tested under the `node:test` runner cannot live there without the module patching
`pending-session-command.test.ts` needs. This is a small widening of the batch's stated file scope,
recorded rather than glossed.

**Verification — unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean;
`npm run test:contract` **164 passed, 0 failed** (155 pre-existing all still green + 9 new in
`src/api/__tests__/session-results.test.ts`: clamp normal case, clamp above bound, floor at zero,
clamp reflected in the rendered string, bound read from the response, copy identical across five
outcome histories, no evaluative vocabulary in the copy, purity, and exit clearing the stored session
id).

*Recorded honestly: at the time this entry was first written, only `tsc` had run.* A
safety-classifier outage had blocked every shell call for the rest of that session, so lint and the
contract suite were reported as **not run** and the 9 new assertions as never executed. They were run
at the start of BE-C2, once tooling recovered, and passed as stated above — this paragraph replaces
the "not run" one rather than hiding that it existed. Two lint hazards had been found and fixed
during the outage by reading the configs instead of running the linter (`no-unused-expressions` is
enabled with only `allowShortCircuit`, so a `void outcomeHistory;` statement would warn; and
`@typescript-eslint/no-unused-vars` is `args: 'none'`, so an `eslint-disable` for the unused
parameter would itself be an unused directive, which ESLint 9 flat config reports by default). Both
were resolved structurally rather than suppressed, and the clean lint run above confirms that
reading was correct.

**Verification — live: NOT PERFORMED.** This was also to be the run that cleared four batches of
accumulated debt, and it did not happen — same tooling outage, and no device or emulator in this
session regardless. So none of: a five-question run showing 5 of 5 with no score, exit landing home
and preparation then offering Start rather than Resume, the L1→L2→L3→409 hint walk, a deadline
passing mid-question, or a kill-and-reopen. **Formats seen across a five-question run: none.
Known-broken Grade 2 templates encountered: none** — the expectation of roughly 2 of 5 (about 43% of
the Grade 2 pool currently renders unanswerable questions) is untested. That is a pre-existing pool
problem for the prompt-payload batch, was not worked around here, and remains unobserved rather than
absent. The live-verification debt now spans five batches (FE-3b check 5, FE-3c, FE-3d, FE-3e,
FE-3f).

**Files touched:** `frontend/src/features/session/session-results-screen.tsx` (new),
`frontend/src/features/session/live-session-screen.tsx`,
`frontend/src/features/session/live-session-logic.ts`, `frontend/src/api/component-b-api.ts`
(comment only — no behaviour change), `frontend/src/api/__tests__/session-results.test.ts` (new),
`backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — BE-C2: numeric choice ordering + expanded-form tolerance

Two independent backend fixes, both disproportionately helping Grade 3. Kept as separate commits
within the batch. No frontend change, no migration, no catalogue change, no vendored-package edit.

### Part A — numeric choice ordering

**The defect.** `presented_choices` was `sorted({correct, *distractors})` over *strings*, so a child
could be shown `60, 61, 62, 7`. For a dyscalculia cohort that is not cosmetic: presenting scrambled
magnitudes to children who have difficulty ordering numbers works directly against the skill being
assessed.

**Measured against the real generator** (60 items per implemented template per grade gate, built
through `LiveEngineAdapter.build_task_instance` against the fixture catalogue; "out of order" = the
list the child would actually see is not in ascending numeric order):

| Grade | Numeric items | Templates | Out of order — before | Out of order — after |
|---|---|---|---|---|
| 2 | 600 | 10 | **87 (14.5%)** | **0 (0.0%)** |
| 3 | 780 | 13 | **186 (23.8%)** | **0 (0.0%)** |

Independently reproducing the 14% / 24% figures from the batch brief. Real examples the sweep found:
`['10','11','12','7'] → ['7','10','11','12']` (B-ADD01-COMBINE-SETS, G2) and
`['16','17','18','7'] → ['7','16','17','18']` (B-ADD02-COUNT-ON, G3).

**The change.** Sort numerically when every choice parses as an integer; otherwise keep the existing
lexicographic sort. The fallback is deliberately kept rather than special-cased, because it is what
keeps relation choices (`<`, `>`, `=`), conservation words (`same`/`changed`) and `ordered_list`'s
comma-joined orderings correct — none of those have a numeric magnitude. Deduplication is untouched:
set semantics first, then order. `int()` is the predicate rather than `str.isdigit()` because
`isdigit()` accepts exotic Unicode digit forms that `int()` rejects and rejects a leading `-` that
`int()` accepts — the predicate and the sort key must be the same call, or an unsortable value slips
through. Distinct strings denoting the same number (`"07"`/`"7"`) survive dedup and are tie-broken on
the string so the result stays deterministic.

**The missing parity test, now added — the more durable half of Part A.** Two places derived this
list, and the only thing keeping them in step was a docstring in
`opportunity_persistence._safe_presented_choices` claiming it "mirrors `project_to_public`'s
presented-choices derivation exactly (BE3c)". *Nothing enforced that.* This fix would have had to be
made twice and could silently have been made once. Both now call a single
`derive_presented_choices` in `app/domain/live_engine/presentation.py`, and
`tests/test_bec2_presented_choice_ordering.py` asserts the two entry points agree across integer,
symbol and mixed cases. (The domain module is pure stdlib, so importing it from the application layer
does not pull in `component_b_generator`; the boundary guard and
`opportunity_persistence`'s own "never imports the package" note both still hold.)

**No existing assertion had to be changed.** The brief expected breakage on hardcoded choice orders;
in fact no test pinned an order — the two existing `presented_choices` assertions are membership
checks (`correct_answer in presented_choices`). So nothing was weakened, and nothing needed updating.

**No contract re-freeze.** `presented_choices` is a string array and order is not part of the schema.
Stored rows keep their original order and are re-served unchanged; only newly created opportunities
are affected.

### Part B — expanded_form tolerant comparison

**The defect.** `answers_equivalent` is `normalize_answer(a) == normalize_answer(b)`, which strips
outer whitespace only, so a child typing `100+20+3` instead of `100 + 20 + 3` was marked wrong on a
decomposition item purely over spacing. The fix already shipped in the package and was simply never
called: `grep -rn "parse_place_value_expression|structured_forms_equivalent" app/` returned nothing
before this batch.

**The change.** `LiveEngineAdapter.structured_forms_equivalent` wraps the package function (nothing
reimplemented; routed like every other scientific call) and converts `StructuredParseError` to
`False` — a child typing something unparseable is a wrong answer, not a server error. The call site in
`attempt_submission` tries exact matching first and only then, **when
`task_instance.allowed_equivalent_answers` is non-empty**, retries through the parser.

**Why that gate rather than a template list.** `answers.registry.allowed_equivalent_answers` returns
a non-empty tuple exactly for the structured place-value templates and empty for every other one, so a
non-empty list *is* the "this template admits equivalent written forms" signal. The package's private
`_STRUCTURED_EQUIVALENCE_TEMPLATES` is deliberately not imported: no duplicated template list in the
application layer means no list to drift. A test asserts that invariant directly, since the scoping
depends on it.

**Demonstrated end to end** (reproducing the call-site logic verbatim). Structured
`B-PV04-DECOMPOSE-3D`, correct `123`: `100+20+3`, `100 + 20 + 3`, `1 hundreds + 2 tens + 3 ones`,
`1 hundred + 2 tens + 3 ones`, `123`, `' 123 '` all → `True`; `124`, `100 + 20 + 4`, `23`, `abc`, `''`
all → `False`. Arithmetic `B-ADD04-2D-NO-REGROUP`, correct `12`, `allowed_equivalent_answers = ()`:
`10+2` and `10 + 2` → **False**, i.e. a restatement of the problem is still rejected. And in
isolation `structured_forms_equivalent('10+2', '12')` is `True` — which is exactly why the gate is
load-bearing rather than decorative, and why tolerant parsing must never become the default
comparison.

**GOVERNANCE — flagged for Gate B, not treated as settled.** Part B changes what counts as a correct
answer, and therefore changes `response_matched` and the BKT observations derived from it. The
defensible reading is that this closes an implementation gap rather than setting policy:
`structured_equivalent_forms` already establishes `100 + 20 + 3` as an approved equivalent of `123`,
so the approved answer set *already contained* the expanded form — the comparison was merely too
strict about spacing, and the change makes the code match the approval that exists. That reading
should be confirmed by whoever owns Gate B rather than assumed here. If the reviewer disagrees, the
revert is one call site: delete the `if not response_matched and
task_instance.allowed_equivalent_answers:` block in `attempt_submission`. Nothing else depends on it,
and the adapter method can stay.

Worth noting alongside the timeout entry above: this correction moves in the *opposite* direction
from that bias. Where a silent deadline records a correct answer as `first_attempt_correct = False`,
this fixes cases where a correct answer was recorded as wrong over whitespace.

### Verification

`docker compose up -d --build api` **first** — mandatory, and it earned its keep again: nothing is
bind-mounted, so `exec api pytest` against a stale container tests old code and returns a false green
(BE-C1 lost time to exactly this, and the hint-port batch was misled by it before rebuilding).

`docker compose exec api pytest -q` → **291 passed, 0 failed** (244 pre-existing + 47 new across
`tests/test_bec2_presented_choice_ordering.py` and `tests/test_bec2_structured_answer_tolerance.py`).

One intermediate failure, worth recording because the cause is funny and the guard is right:
`test_dev_fixture_isolation.py::test_no_file_under_app_references_scripts` failed because a comment
this batch added under `app/` used the word "super**scripts**", and that guard is a bare substring
scan for `"scripts"`. The comment was reworded; the guard was not touched. A blunt guard firing on a
false positive is the correct trade for one that cannot be quietly defeated.

`python scripts/dev_fixture_learner.py --test-fixture-only` → **exit 0**, self-verify served an
opportunity. As before, this required first restoring `be3b-test-fixture-1.0` as the most-recently-
created `PUBLISHED`+`APPROVED` bundle (one dev-DB `created_at_utc` bump), because the full suite
inserts newer throwaway `bundle-*` rows that shadow it — the documented pre-existing condition in
`scripts/README.md`, not anything this batch caused.

Also cleared while tooling was available: **FE-3f's outstanding frontend verification**, which closed
with only `tsc` run. `npm run lint` clean and `npm run test:contract` **164 passed, 0 failed**; the
FE-3f entry above has been corrected in place, with the original "not run" status recorded rather than
erased.

**Live (app-level): still not performed.** No device or emulator in this session, so the five-batch
frontend live-verification debt (FE-3b check 5, FE-3c, FE-3d, FE-3e, FE-3f) is unchanged. Part A's
effect is now proven at the generator, but no child-facing screen has been observed rendering a
numerically ordered choice list, and Part B has not been exercised through the app — the
`expanded_form` surface has still never drawn a real presentation.

**Files touched:** `backend/app/domain/live_engine/presentation.py`,
`backend/app/application/opportunity_persistence.py`,
`backend/app/application/attempt_submission.py`, `backend/app/infrastructure/live_engine/adapter.py`,
`backend/tests/test_bec2_presented_choice_ordering.py` (new),
`backend/tests/test_bec2_structured_answer_tolerance.py` (new), `backend/buildLog1.md`.

Note on scope: `adapter.py` was not in the batch's stated file list, but Part B explicitly required
exposing the package function as an adapter method, which is where every other scientific call is
routed. Recorded rather than glossed.

Also changed outside the file scope: one dev-database `created_at_utc` value on the
`be3b-test-fixture-1.0` runtime-bundle row, and the local `upadya-backend:be1-batch3` image was
rebuilt (twice).

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-3g: prompt visuals — three of four, and why the fourth is blocked

**What landed: 3 of the 4 planned visuals.** `object-set` (rescues B-CNT02, B-CNT03, B-NS02),
`two-sets` (B-NS03), and `selectable-pool` (B-CNT04, which also required changing an answer surface).
**`before-after` was not built**, for a reason established empirically rather than assumed — see
below. The scaffold tier (the other ~13 templates whose governed representation is still unrendered:
number lines, base-ten blocks, place-value charts, arrays, fact-family triangles) was not started and
**remains open**.

### The blocker: B-NS07's `delta` is not on the wire

The batch brief listed the before/after payload keys as `initial_count`, `transformation`, `delta`.
Verified against the live generator: **`delta` is not in the prompt payload.** It exists only in the
private `operands`, which is never serialized to the client. `samplers/number_sense.py:71-73`
confirms it in source, and a dump of real presentations confirms it on the wire — every B-NS07 prompt
carries exactly `initial_count`, `transformation`, `options`, `stem`.

So for `transformation: 'rearrange'` the delta is 0 and the after-panel is drawable, but for
`'add'`/`'remove'` the magnitude (1–3, or −1–−3) is unknown, and inventing one would be the client
fabricating quantity content.

**Rendering only the drawable case would be worse than rendering none, which is the substantive
finding here.** A visual that appears only when the answer is "same" is a perfectly reliable
non-mathematical cue: a child would learn "picture ⇒ same" and score well without conserving
anything. That is precisely the false mastery B-CNT04 was producing and that this batch exists to
remove. So B-NS07 stays stem-only — no worse than today — and the fix belongs on the server: add
`"delta": delta` to the prompt dict at `samplers/number_sense.py:72-73` (a vendored-package edit,
explicitly out of scope here). Once it is on the wire, the visual is a small addition to an existing
registry branch.

### Resolution is key-driven, and that had one unplanned consequence

`resolvePromptVisual(prompt)` matches on payload key presence with fixed precedence — two-sets
(`set_a`+`set_b`) → selectable-pool (`pool_size`) → object-set (`object_count`) — never on
`item_template_id` (which would restate catalogue content in the client) and never on
`representation_type` (which is unusable: the fixture flattens it to `"numeral"` for all 36 templates
while the governed catalogue says `pictorial_objects`, `dot_sets`, `concrete_simulated`).

**Unplanned effect, flagged rather than silently kept or silently suppressed: `B-ADD01-COMBINE-SETS`
now gets a `two-sets` visual for free**, because its payload happens to carry `set_a`/`set_b`
("Put the two groups together: 2 and 6."). It was not on the rescue list and is a scaffold-tier
template that is already answerable. Suppressing it would require exactly the template-id branching
the design forbids, and the visual is truthful (those are the real operands), so it was kept. But it
does change what a Grade 2 addition item affords: a child can now count the combined objects rather
than recall a fact. That may well be desirable — the catalogue specifies a pictorial representation
for it — but it is a measurement question, not a rendering one, and it should be confirmed by whoever
owns the item design. If unwanted, the change is one branch in the registry.

Validation: every value must be a real non-negative integer within `MAX_RENDERABLE_OBJECTS = 40` —
a layout guard, deliberately not a restatement of the generator's ranges (`object_count`/`set_a`/
`set_b` are 1–20, `pool_size` reaches 28). Numeric *strings* are rejected rather than coerced, since
coercing would be the client repairing a payload shape. Own-property checks throughout, so a payload
key named `constructor` cannot resolve to an inherited member. Anything malformed → `null` →
stem-only, never worse than today.

### B-CNT04: the false-mastery fix required changing an answer surface

Its stem says "Select exactly 7 objects" and the surface asked for a number, so the child read 7,
entered 7, and was marked correct without doing the thing being measured — false mastery, which is
worse than noise. `renderers/count-selection.tsx` now renders `pool_size` tappable objects when a
pool is supplied and derives the count from the selection. **`encodeSubmittedValue` is untouched and
the submitted value is still `String(count)`** — FE-3a's contract is unchanged; only the provenance of
the count changed. The selection set is local component state because `AnswerState` carries a count
and only a count; it clears both on remount (keyed on `item_opportunity_id`) and when the answer is
reseeded, which is what "Try again" does without changing the opportunity.

No client-side hinting anywhere: objects are not grouped into fives, not arranged in ten-frames, not
numbered, not pre-counted, and the pool shows no progress cue against the target (the `target` key is
deliberately not carried into the visual spec at all). The two comparison panels are identical in
size, shape and colour, differing only in how many objects they hold.

### An accessibility trade-off that should be a decision, not a default

Each visual carries a group accessible label stating the quantity ("12 circles"), as specified. For
"how many objects are there?" items that label **states the answer** — so a screen-reader user gets
an answerable question, but a trivially answerable one, which is a subgroup version of the same false
mastery problem. The alternative that preserves the measurement is a set of individually focusable,
*unnumbered* objects the child navigates and counts themselves (numbering them would be the forbidden
pre-counting). That costs up to 20 focus steps. Implemented as specified; recorded here for the
accessibility owner because it is a genuine measurement question, not an oversight.

### Verification

**Unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**183 passed, 0 failed** (164 pre-existing all still green + 19 new in
`src/api/__tests__/prompt-visuals.test.ts`). Payloads in those tests are the real wire shapes, dumped
from the generator rather than transcribed.

**Resolution against real payloads — every template.** Captured the live prompt for all 30
template/grade combinations the generator produces and ran the *actual* registry over them:

- `object-set` resolved for B-CNT02, B-CNT03, B-NS02; `two-sets` for B-NS03 (and B-ADD01, above);
  `selectable-pool` for B-CNT04.
- B-NS07 → `null` (stem-only), as decided.
- **Every Grade 3 arithmetic/place-value template → `null`, unaffected**, which was an explicit
  requirement: B-ADD02/03/04/05, B-SUB04/05, B-MUL01/02/03, B-DIV01/02/03, B-NS04/05, B-PV03/04.
- 6 of 30 payloads resolve a visual; the remaining 24 render exactly as before.

**Over real HTTP as the fixture learner.** `dev_fixture_learner.py --test-fixture-only` exit 0.
Walked 60 opportunities across ~12 sessions. **B-NS02-QUANTITY-NUMERAL was reached 39 times** with
real `object_count` payloads spanning 2–20 (including 20, the top of the range that the layout must
not overflow), and each resolves to `object-set`. Incidentally this also confirmed **BE-C2 Part A
live over HTTP**: `presented_choices` arrived in numeric order (`['18','19','20','21']`,
`['7','8','9','10']`).

**Not reached live: B-CNT02, B-CNT03, B-CNT04, B-NS03, B-NS07.** Sequencing pinned hard — the first
20 opportunities were all `B-CNT01-SEQ-CONTINUE`, and once counting mastery rose it pinned to B-NS02
for 39 of the next 40. This is worth recording independently of FE-3g: **the target templates are
effectively unreachable through normal play for this learner**, which also means the brief's "roughly
2 unanswerable questions in every 5-session" figure does not describe what this fixture learner
actually experiences — they get one template repeatedly. Whether that is the sequencer working as
designed on a single-learner cold start or a diversity problem is a separate question for whoever owns
sequencing.

**Screen rendering: NOT OBSERVED.** No device or emulator in this session, so none of the on-screen
checks were performed: objects appearing on B-NS02, the layout holding at 20 objects, B-CNT04
requiring actual selection, or a Grade 3 template still rendering stem-only. What is proven is that
the registry resolves the right spec from real wire payloads; what is unproven is that the components
draw correctly. The components are thin and RNTL is still Batch 15, so that gap closes either with a
device run or with Batch 15. The app-level live-verification debt now spans six batches.

**Files touched:** `frontend/src/features/session/prompt-visuals/types.ts` (new),
`frontend/src/features/session/prompt-visuals/registry.ts` (new),
`frontend/src/features/session/prompt-visuals/object-set.tsx` (new),
`frontend/src/features/session/prompt-visuals/two-sets.tsx` (new),
`frontend/src/features/session/prompt-visuals/prompt-visual.tsx` (new),
`frontend/src/features/session/renderers/count-selection.tsx`,
`frontend/src/features/session/live-session-screen.tsx`,
`frontend/src/features/session/live-session-logic.ts` (carries the prompt payload through on
`SessionPlan` — not in the stated file list, but the payload had to reach the screen somehow),
`frontend/src/api/__tests__/prompt-visuals.test.ts` (new), `backend/buildLog1.md`.

Also changed outside the file scope: one dev-database `created_at_utc` bump on the
`be3b-test-fixture-1.0` row (the recurring bundle-shadowing condition, twice this session).

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-2b: the home panel now means session progress, not a lesson path

**The visual design did not change.** Artwork, layout, hero, scroll-snap, tab bar, the path panel's
shape and position are all untouched. What changed is what the nodes *mean* and where their state
comes from. No restyling was needed, so nothing had to be reported as blocked.

### The reframe

The panel presented five hardcoded lessons — a skill-label table, per-node skill ids, node 1 marked
as the current lesson and the rest as being "on a path". The server exposes no path, no ordering, no
per-skill progress and no mastery, so all of it was unbacked: it told a child they were progressing
through a journey the backend has no concept of.

The nodes are now the questions in the current session — positional (Question 1, 2, 3…), no skill
name, no path language. That is real, server-reported, and needed no new endpoint. The node count
comes from `opportunities_total_bound`; five is not assumed anywhere. The artwork's node positions are
passed in separately as `availablePositions`, because how many markers the illustration has is a fact
about the illustration, not about the session: a larger bound draws only what fits, a smaller one
draws fewer. The skill of a question is still shown — per question, on the session screen, from the
presentation's own `skill_id`, where it is real.

Two states, both backed: **in progress** (nodes up to `opportunities_completed` read Answered, the
next reads Up next and is tappable straight into the session, hero offers Resume) and **not in
progress** (all nodes neutral, hero offers Start). Either read failing degrades to not-in-progress and
never to an error screen — safe because `POST /b/sessions` returns an existing session anyway
(`b_session_lifecycle.py:185-194`), so a learner shown Start simply resumes on tap. Same treatment
FE-2a already gives that read.

Two smaller corrections: the star icon now appears only on questions actually answered (it used to
appear on every not-current node, i.e. on questions that had not happened yet), and the personal-name
greeting fallback is gone — it was a real person's first name, so any child whose profile had not
loaded was greeted as someone else.

### Cold start is deliberately not distinguished, and that is the honest choice

There is no "first time" state and no local has-played-before flag. **The server cannot tell a
brand-new learner from a returning one**, so any such flag would be a device-local guess: wrong after
a reinstall, wrong on a second device. It would tell a returning child they are new, or greet a new
child as a returning one. The single neutral not-in-progress state covers both without asserting
either. A genuine cold-start distinction needs a backend endpoint — a separate decision, not a client
workaround. A grep guard asserts no such flag reappears.

### The prep screen's two claims: one verified and kept, one removed

**"Hints available — Get helpful hints anytime" — KEPT, on evidence.** This claim was false when
written: only 2 of 36 templates carried hint content, so ~94% of requests returned a neutral 409.
BE-C1 ported the governed L1/L2/L3 hints to all 36. Re-checked for this batch against the live
catalogue: **108 of 108 hint lookups resolve, zero failures**, so every template the fixture can serve
now has all three levels. The claim is true and stays.

**The unlimited-retry claim — REMOVED.** Attempt limits are Gate-B unresolved, so the app cannot
promise it. Nothing replaced it; the card is `flex: 1` and absorbed the space. (FE-3b does offer a
retry after an attempt, but that is an affordance appearing in context, which is a different and
weaker claim than a promise made up front on a preparation screen.)

### Guards, and a self-inflicted failure worth recording

Grep guards (following `no-auth-bypass.test.ts`) assert neither screen contains the skill-label table,
the lesson-status strings, the removed personal name, the retry promise, or a first-time flag; that
`session-progress.ts` hardcodes no session length; and that the home screen derives its node count
rather than mapping the artwork positions directly.

Three of them failed on first run — **because this batch's own explanatory comments quoted the very
strings being banned**, exactly as BE-C2's guard failed on the word "superscripts". The comments were
reworded rather than the guards exempted, for the same reason: a guard with exemptions is a guard
nobody trusts. The reasoning survives in the comments; the banned literals do not appear anywhere.

### Verification

**Unit (from `frontend/`):** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**203 passed, 0 failed** (183 pre-existing all still green + 20 new in
`src/api/__tests__/home-session-progress.test.ts`): node-state derivation for both states, count
following the bound (3 and 1 as well as 5), graceful degradation when the bound exceeds the artwork,
clamping of an overrun completed count, every failure path collapsing to not-in-progress, positional
labels, and the six grep guards.

**LIVE — both states confirmed, with screenshots.** Driven through the real app (Expo web on
`localhost:8081`, already running) as the BE-G2 fixture learner, against the real backend:

1. **Not in progress** — hero reads "Start Adventure", panel heading "Ready to Play", all five nodes
   "Question N / Not started" with neutral outline icons. Design intact.
2. Started a session → prep screen showed exactly **two** readiness items ("Session ready", "Hints
   available"); the retry promise is gone.
3. The question rendered was **B-NS02-QUANTITY-NUMERAL with 19 circles drawn**, choices `17 18 19 20`
   in numeric order, hint control present, submit disabled before selection.
4. Answered 19 → "Nice work! / That one is right." → advanced.
5. **In progress** — returning home: **Question 1 "Answered" with a star and a filled check, Question
   2 "Up next" in blue and tappable, Questions 3–5 "Not started", hero reads "Resume Adventure",
   heading "Your Session".** Exactly the specified behaviour.

Screenshots (outside the repo, so nothing untracked was added):
`…/scratchpad/screenshots/fe2b-home-not-in-progress.png`, `fe2b-home-in-progress.png`,
`fe2b-prep-two-claims.png`, `fe3g-object-set-live.png`.

**This run also closed live checks owed by three earlier batches**, which had been accumulating:

- **FE-3g** — the object-set visual rendering for real: 19 circles, wrapping cleanly with no overlap
  at the top of the 1–20 range, on the exact template ("Which numeral matches the quantity?") the
  FE-3g brief named first. Individually focusable unnumbered circles, as revised.
- **BE-C2 Part A** — numerically ordered `presented_choices` on a child-facing screen.
- **FE-3d / FE-3b** — the hint control present on a real question; submit disabled before selection;
  the correct-answer outcome path rendering "Nice work!"; advance moving the session on.

Still not exercised live: B-CNT02/03/04, B-NS03, B-NS07 (sequencing keeps serving B-NS02 and
B-CNT01), a real TIMEOUT, kill-and-resume, and the results screen at the bound.

One incidental finding, not a defect in this batch: **on web, a hard page reload signs the learner
out**, because the secure-store shim is an in-memory `Map` on web (`session-command-store.ts` /
`secure-storage.ts`). It does not affect native, and in-app navigation is unaffected — noted because
it will confuse anyone testing on web.

**Files touched:** `frontend/src/features/home/learner-home-screen.tsx`,
`frontend/src/features/home/session-progress.ts` (new — the pure derivation had to live outside the
screen to be testable under `node:test`, a small widening of the stated file scope),
`frontend/src/features/session/session-preparation-screen.tsx`,
`frontend/src/api/__tests__/home-session-progress.test.ts` (new), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-3h: phase-2 prompt visuals, and Part 0 is inert until the wheel is rebuilt

### Part 0 did NOT take effect — the sampler ships as a hash-pinned wheel

The one-line change was made as specified: `sample_conservation`'s prompt dict in
`packaging/component_b_internal/component_b_generator/samplers/number_sense.py` now carries `delta`
alongside `initial_count` and `transformation`, with the reasoning recorded inline — it is derived from
the objects the child is shown, so it is presentation data, and it reveals nothing the before/after
visual would not.

**It has no effect on the running system, and rebuilding the container does not change that.**
`component_b_generator` is not imported from `packaging/`; it is installed from a pre-built,
hash-pinned wheel:

- `Dockerfile:19-20` copies `provenance/wheels/upadya_component_b_live_engine-0.1.0+be3.0e86fdc-py3-none-any.whl`
  and installs it with `pip install --require-hashes`;
- `requirements.lock:883-884` pins it to `sha256:faa5760df1f5a3874f38f8103cdaaa88a14b3190216e46ab21765eee65a70c29`;
- `packaging/` is not in the Dockerfile's COPY list at all.

Verified directly rather than inferred: inside the freshly rebuilt container,
`component_b_generator.__file__` is `/usr/local/lib/python3.11/site-packages/…`, and
`inspect.getsource(sample_conservation)` still shows a prompt dict with `transformation` and `options`
and **no** `delta`. The payload sweep below confirms it end to end: **B-NS07 still resolves to
stem-only.**

**Landing it is a provenance action, not a code change, so it was not done unilaterally.** It requires
rebuilding the wheel from `packaging/`, recomputing its sha256, and updating both
`requirements.lock` and `provenance/component-b-live-engine-manifest.json:12-13`, which records the
wheel filename, version and `wheel_sha256` against a source commit. That pin is what makes the
live-safe engine's reuse claim checkable; silently replacing the artefact would invalidate the
recorded provenance that BE4's parity work rests on. The source edit is left in place because it is
the correct change and will take effect the moment the wheel is next rebuilt — but **anyone reading
this should know B-NS07 is still stem-only in the running system.**

The before/after component and its registry branch are built, unit-tested, and will light up with no
further client work as soon as the wheel carries `delta`.

### Four visuals built

`place-value-chart` (B-PV01, B-PV03), `base-ten-blocks` (B-PV02, B-PV04), `take-away` (B-SUB01),
`before-after` (B-NS07, dormant per above).

- **Chart** — labelled columns with the digits of `n` in them, and **nothing highlighted**.
  `askedPlace` is on the spec so the chart can be described accurately, and is deliberately not used
  to emphasise a column: which place the stem asks about is already in the stem, and marking it would
  answer the question rather than present it.
- **Blocks** — hundreds flats, tens rods, ones cubes, one group per named place. This visual
  necessarily shows the decomposition, and that is correct here: the grouping *is* what
  `base_ten_blocks` means in the catalogue and is the intended scaffold for these templates. No digit
  labels, no per-group counts, no total.
- **Take-away** — `total` objects with `removed` of them faded and struck through, so the remainder
  stays countable. The removed objects stay on screen (take-away is about seeing that some of a known
  group are gone), and **the remainder is never shown as a number** — counting what is left is the
  task.
- **Before/after** — two panels identical in size and styling so only the object count can differ.
  `delta === 0` renders two visibly identical panels; no rearrangement is invented, because the
  payload does not describe one.

### The two resolution hazards, and how they were handled

**`place` (singular, string) vs `places` (plural, array)** — one character apart, entirely different
visuals. Both are matched by exact own-key presence, so neither payload can satisfy the other's
requirement, and the plural check runs first so the more specific form wins if anything ever carried
both. Tested in both directions, including `place` holding an array and `places` holding a string.

**`total` is not distinctive** — B-SUB01 sends `total` + `removed`, but B-DIV01 sends `total` +
`recipients` and B-DIV02 sends `total` + `group_size`. The full pair is required; `total` alone never
resolves. A test asserts both division payloads resolve to `null` rather than drawing a take-away
visual that would misrepresent "share 20 between 2" as "take some away".

### Payload sweep — the check that catches a precedence mistake

Ran the real registry over live payloads for all 30 template/grade combinations the generator
produces. **11 of 30 now resolve** (was 6 before this batch):

| Template | Resolves to |
|---|---|
| B-PV01-IDENTIFY-TENS-ONES (G2) | `place-value-chart` value 96, places tens/ones, asked tens |
| B-PV02-DECOMPOSE-2D (G2) | `base-ten-blocks` value 96, places tens/ones |
| B-PV03-IDENTIFY-HTO (G3) | `place-value-chart` value 872, three places, asked ones |
| B-PV04-DECOMPOSE-3D (G3) | `base-ten-blocks` value 872, three places |
| B-SUB01-TAKE-AWAY (G2) | `take-away` total/removed |
| B-CNT02, B-CNT03, B-NS02 | `object-set` (FE-3g) |
| B-CNT04 | `selectable-pool` (FE-3g) |
| B-NS03, B-ADD01 | `two-sets` (FE-3g) |

Both hazards confirmed clean in live data: **B-PV01 → chart and B-PV02 → blocks** (never swapped),
and **B-DIV01 and B-DIV02 → `null`**. Every phase-3 template still resolves `null`: B-ADD02, B-ADD03,
B-ADD04, B-ADD05, B-CNT01, B-CNT06, B-DIV03, B-MUL01, B-MUL02, B-MUL03, B-NS04, B-NS05, B-SUB03,
B-SUB04, B-SUB05. **B-NS07 → `null`**, per Part 0 above.

### Verification

**Backend:** `docker compose up -d --build api` then `docker compose exec api pytest -q` →
**291 passed, 0 failed** (unchanged, as expected — the sampler edit is inert).

**Frontend:** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**215 passed, 0 failed** (203 pre-existing all still green + 12 new): both place-key directions, both
division payloads failing closed, remove-more-than-exists, remove-all and remove-none, three-digit
charts, unknown place names, out-of-range values, and before/after for add/remove/rearrange including
the impossible-after cases.

**Live: NOT REACHED, and not forced.** Sequencing served `B-NS02-QUANTITY-NUMERAL` for 39 of 40
opportunities across 8 sessions (the fortieth was B-CNT01), so neither B-PV01 nor B-SUB01 came up. The
sequencer was deliberately not fought, per the batch brief; the payload sweep above is the substantive
check. No new screenshot was taken because nothing new appeared on screen. This is the third batch in
which the same pinning has been observed — the practical consequence is that **most of the visual work
in FE-3g and FE-3h cannot currently be seen through normal play**, which is worth someone's attention
independently of these batches.

**Phase 3 remains open** — number line, groups, array, sharing, number cards and column algorithm
(B-ADD02, B-ADD05, B-MUL01, B-MUL02, B-DIV01, B-DIV02, B-NS05, B-SUB05). Not started here.

**Also still open and deliberately untouched:** the bare-numeral acceptance on expanded form ("Write
52 in expanded form" scoring `52` as correct). It is flagged for Gate B and is a governance decision,
not a rendering one. Worth noting that rendering base-ten blocks arguably makes copying the numeral
*more* tempting, which strengthens rather than weakens the case for resolving it.

**Files touched:** `backend/packaging/component_b_internal/component_b_generator/samplers/number_sense.py`
(inert until the wheel is rebuilt — see Part 0),
`frontend/src/features/session/prompt-visuals/types.ts`,
`frontend/src/features/session/prompt-visuals/registry.ts`,
`frontend/src/features/session/prompt-visuals/prompt-visual.tsx`,
`frontend/src/features/session/prompt-visuals/place-value-chart.tsx` (new),
`frontend/src/features/session/prompt-visuals/base-ten-blocks.tsx` (new),
`frontend/src/features/session/prompt-visuals/take-away.tsx` (new),
`frontend/src/features/session/prompt-visuals/before-after.tsx` (new),
`frontend/src/api/__tests__/prompt-visuals.test.ts`, `backend/buildLog1.md`.

Also changed outside the file scope: one dev-database `created_at_utc` bump on the
`be3b-test-fixture-1.0` row, and the local `upadya-backend:be1-batch3` image was rebuilt.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — BE-P2: sequencing repetition — defect found, `spacing_due` was inert

**Verdict: (b) DEFECT FOUND — `history` was never populated, so `spacing_due` was permanently 1.0
for every candidate and the approved formula's 20% spacing weight could not differentiate anything.**
Fixed in the wiring only. Separately, and worth keeping distinct: the specific 39-of-40 symptom that
prompted this batch turned out to be mostly the *designed* behaviour of `mastery_gap` amplified by a
probe that answered incorrectly — so the finding is both "a real bug existed" and "the observed
number was not solely caused by it".

### The defect

`app/application/opportunity_selection.py:207` read:

    history = {skill: None for skill in catalogue.skills}

— a fresh all-`None` mapping rebuilt on **every** selection, never populated from practice history.
`sequencing/features.py:98-102` maps a `None` entry to `spacing_due = 1.0` ("never practised, so
maximally due"). Therefore every candidate scored a constant 1.0 on spacing, forever: the 0.20 weight
added the identical 0.20 to every candidate's score and could never break or create a difference. A
skill practised five times in a row was exactly as "due" as one never touched.

Verified by simulation before changing anything — the diagnostic ran the real adapter path
(`decide_activation` → `compute_features` → `score_candidate` → `select_target`, then `update`) over
40 sequential selections, with history wired two ways:

| `spacing_due` for `counting`, steps 1–14 | distinct values |
|---|---|
| as-shipped | `[1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]` → `[1.0]` |
| threaded | `[1.0, 0.0, 0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0, 0.0, 0.25, 0.0, 0.0, 0.0]` → `[0.0, 0.25, 1.0]` |

Threaded, it drops to 0.0 the moment the skill is played and recovers by 0.25 per session
(saturating at 4, unchanged). As shipped, it never moved once.

**What was NOT the defect, also established by the same run:** `mastery_gap` moves perfectly well —
0.800 → 0.023 over 14 correct responses — so BKT convergence is not too slow, and the p_g/p_s
parameters are not implicated. `mastery` itself *is* correctly threaded per learner via
`load_or_init_skill_states` → `LearnerSkillStateRepository`. Prerequisite readiness is a constant 1.000
for all five Grade-2 candidates because none of those templates declares prerequisite nodes, which is
the catalogue's content, not a wiring fault. Tie-breaks fire constantly (`tie=True` on nearly every
step) but resolve canonically, exactly as documented.

### Why the observed 39-of-40 was not purely this bug

The simulation would not reproduce it. With all-correct responses, both wirings give a **perfectly
even 20% × 5** distribution: each skill is played once, its `mastery_gap` drops below its peers', and
the next skill wins — a natural round-robin driven by `mastery_gap` alone.

The mixed-response run shows the real mechanism. An **incorrect** answer *raises* `mastery_gap`
(0.800 → 0.824 → 0.828 across three consecutive same-skill steps), because `bkt_update` lowers `p_l`
on a wrong answer. So a learner who keeps getting one skill wrong keeps being served that skill — a
positive feedback loop that is arguably correct pedagogy (practise what you are failing) and is
entirely within the approved formula. The BE-P1 probe that produced "39 of 40 B-NS02" computed correct
answers only for sequence-shaped prompts and submitted `presented_choices[0]` for everything else,
which is almost always wrong — so it drove exactly that loop. **That part is (a), and no policy change
was made for it.**

Both effects were real: `mastery_gap` chose the skill, and inert spacing removed the one term that
would otherwise have pulled selection away from it.

### Simulated distributions (40 selections, fresh learner, Grade 2, 5 active templates)

| Responses | History | Distribution | Max share |
|---|---|---|---|
| all-correct | as-shipped | 8/8/8/8/8 — CNT01, NS02, PV01, ADD01, SUB01 | 20.0% |
| all-correct | threaded | 8/8/8/8/8 — identical | 20.0% |
| mixed (~60%) | as-shipped | SUB01 13, NS02 12, CNT01 6, PV01 5, ADD01 4 | 32.5% |
| mixed (~60%) | threaded | NS02 11, PV01 10, CNT01 7, SUB01 7, ADD01 5 | 27.5% |

### The fix — wiring only

- `ItemOpportunityRepository.sessions_since_practice(learner_id)` (new): per skill, the count of the
  learner's distinct sessions created strictly after the most recent session containing an opportunity
  for that skill. Skills absent from the result are "never practised" and still map to
  `spacing_due = 1.0`. That "sessions since" reading is documented in the method's docstring as a
  reading rather than a specification, because the feature's contract names the quantity but nothing
  defines it precisely.
- `select_candidate` takes `sessions_since_practice` as a parameter and stays pure — no database
  access was added to it. Omitting the argument reproduces the old behaviour, which keeps the existing
  determinism test callable without a database.
- The single shared select→build→persist core supplies it, so BE4b's endpoint and BE4e's
  next-or-complete transition cannot drift apart.

**Untouched, deliberately:** the 0.50/0.30/0.20 weights, `SPACING_DUE_SATURATION_SESSIONS`,
`mastery_gap`'s formula, every BKT parameter, `_ENGINEERING_BKT_CONFIG`. No diversity floor, no
repetition cap, no tie-break change — those would be inventing sequencing policy, which this batch has
no authority to do. Only the wiring between approved pieces changed.

### Live before/after — the actual proof

Same probe, same fixture learner, 40 opportunities through the real HTTP endpoints, counted by prompt
key-signature (which identifies the template):

| | Before fix | After fix |
|---|---|---|
| B-NS02 (`object_count`) | **39 (97.5%)** | 18 (45.0%) |
| B-PV01 (`n`,`place`) | 0 | 8 (20.0%) |
| B-ADD01 (`set_a`,`set_b`) | 0 | 8 (20.0%) |
| B-SUB01 (`total`,`removed`) | 0 | 5 (12.5%) |
| B-CNT01 (`sequence_shown`) | 1 (2.5%) | 1 (2.5%) |
| distinct templates served | **2** | **5** |

Max share fell from 97.5% to 45.0%, with the same responder behaviour on both sides.

**Side effect worth naming:** this unblocks live verification that three earlier batches could not
reach. B-PV01 and B-SUB01 — the place-value chart and take-away visuals built in FE-3h and reported
then as "not reachable, sequencer pins to B-NS02" — are now served in normal play, as is B-ADD01's
two-sets. The pinning that FE-3g, FE-3h and FE-2b each recorded as an unexplained obstacle was, in
substantial part, this bug.

### Verification

`docker compose up -d --build api` (mandatory — nothing is bind-mounted) then
`docker compose exec api pytest -q` → **291 passed, 0 failed**, unchanged. Both simulations were run
before the fix and the live probe after it; the before/after table above is the comparison, not a unit
test in isolation.

The diagnostic script `backend/scripts/diagnose_sequencing_repetition.py` was **deleted** after the
tables were captured here, same as the BE-C2 and FE-3g sweep scripts.

**Still open, and explicitly not this batch's call:** whether a learner should be served the same skill
repeatedly while failing it is a sequencing-policy question for whoever owns the approved formula. The
evidence is now recorded either way: the formula does that by design, spacing (now working) moderates
it, and nothing in the client or the wiring forces or prevents it.

**Files touched:** `backend/app/application/opportunity_selection.py`,
`backend/app/infrastructure/repositories.py`, `backend/buildLog1.md`. (Diagnostic script created and
deleted.)

Also changed outside the file scope: one dev-database `created_at_utc` bump on the
`be3b-test-fixture-1.0` row, and the local image was rebuilt.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — BE-C1 independent verification, and a process hazard worth keeping

Supervisor verification of the hint port, performed against the artefacts rather than the report.

**Port confirmed.** `test_catalogue.md` carries 36 templates × 3 levels = **108 hint strings**,
compared field-by-field against §11 of the authoritative catalogue: **0 mismatches**. Template
count unchanged at 36. Catalogue sha256 `cc02014d9abc…` matches the file and is consistent across
all three bundle fixtures (`valid_unapproved`, `bad_checksum`, `missing_field`); `bad_checksum`'s
deliberate `ffff…` generator defect is untouched.

A first comparison run reported 3 mismatches. Those were a defect in the **supervisor's own
comparison script**, not the port: three governed values are YAML single-quoted because they
contain a colon (`'Ask: what number times the divisor makes the dividend?'`), and the script
stripped double quotes only. Corrected, all 108 match. Recorded because a verification tool that
reports false positives is as dangerous as one that reports false negatives.

**Suite green against a rebuilt image: 244 passed.** The container was confirmed to see
`cc02014d…` before the run.

**Reached what the implementing agent could not.** `adapter.get_hint` on
`B-DIV03-DIVIDE-BY-2` — the template that raised `HintUnavailableError` before this batch, and the
one two BE3b/BE3c tests were written around — now returns governed L1/L2/L3. Spot-checked
`B-NS02-QUANTITY-NUMERAL` and `B-SUB05-BORROW` likewise.

**Process hazard (the durable finding).** `compose.yaml` bind-mounts nothing; application code and
test fixtures are baked into the image. A `docker compose exec api pytest -q` against a stale
container therefore tests the **old** catalogue against the **old** assertions and returns a
confident green that means nothing. The implementing agent hit exactly this — 244 passed on a
20-hour-old image, disproved by computing the pre-edit checksum inside that container. **Any
fixture or app change must be verified only after `docker compose up -d --build api`.** This will
recur; it is not specific to BE-C1.

**New observation — the governed hints presuppose the visual representation.** `B-NS02-QUANTITY-
NUMERAL`'s ported hints read "Count the objects once" (L1) and "Touch each object, count, then
choose the numeral showing the total" (L3). That template is one of the six whose prompt payload
the client currently discards, so a Grade 2 learner asking for help is instructed to touch objects
that were never drawn. The hints are correct as authored; the rendering gap makes them unusable,
and arguably worse than silence — they describe an affordance the child cannot find. This
strengthens the case for the prompt-payload rendering batch and is an argument against judging
hint quality from the current build.

**Deferred, unchanged.** The `response_format` vocabulary discrepancy (catalogue 14 names vs
sampler 9) remains recorded and untouched. Consequence noted by the implementing agent and
confirmed: FE-3a's registry is built against the sampler vocabulary, so were the catalogue's six
extra names to become authoritative on the wire, they would fail closed at the client with the
neutral error screen — correct behaviour, but it would silently remove those templates from play.

No files touched by this verification; record only.

---

## 2026-07-30 — FE-3f supervisor verification: the unrun suite was red

FE-3f was delivered with `npx tsc --noEmit` clean but `npm run lint` and `npm run test:contract`
**not run** — a tooling outage blocked the implementing agent's shell partway through. It reported
this plainly rather than implying coverage, which is why the gap was closeable.

**The suite was red.** One failure: `live-session-logic.ts hardcodes no session bound`. The cause
was a literal `5` inside a *comment* — a clamp docstring illustrating the guard with `"6 of 5"`.

This is the second time the bound guard has caught an explanatory comment rather than code (FE-3e
hit the same trip while explaining why not to hardcode the bound). That is the guard working as
designed, not over-reach: a comment that spells the bound out is still the unapproved
`MAX_OPPORTUNITIES_PER_SESSION = 5` leaking into the client, and a future reader copying from the
comment reintroduces it for real. Fixed by rewording, never by exempting the file — an exemption
would make the guard decorative. The replacement comment now also states *why* it avoids an
example pair, so the next author does not re-add one.

**Post-fix: `tsc` clean, lint clean, `npm run test:contract` 164 passed, 0 failed** (155
pre-existing green + 9 new).

**Accepted from the batch as delivered:**
- The `/summary`-vs-`/complete` non-discrepancy was re-confirmed at source by the implementing
  agent and matches the supervisor's finding; no reconciliation code was written.
- `/summary` is deliberately not called on the results path — the completion response already
  carries both numbers, and calling it would import the `:550` quirk (abandoned / expired /
  technical_failed all report `"active"`) for no gain. `getSessionSummary` carries a comment
  explaining why it is unused.
- The no-evaluative-summary prohibition was made *testable* rather than commented:
  `resultsView(progress, outcomeHistory?)` accepts an outcome history and never reads it, with a
  test asserting byte-identical copy across all-correct / all-incorrect / all-timeout / mixed /
  empty. Same named-seam technique as FE-3c's `deadlinePassed`. A comment can be tidied away; a
  failing test cannot.
- Scope widened slightly and deliberately: `clampCompleted` and `resultsView` live in
  `live-session-logic.ts` rather than the new screen file, because `session-results-screen.tsx`
  imports react-native and the `node:test` runner cannot load it without module patching.

**Live verification: still not performed — now five consecutive batches** (FE-3b check 5, FE-3c,
FE-3d, FE-3e, FE-3f). Formats seen live remains **1 of 9**. The ~2-of-5 broken-Grade-2-template
expectation is untested, not disproved. The results screen in particular has never rendered from a
real completed session.

**Files touched by this verification:** `frontend/src/features/session/live-session-logic.ts`
(comment reworded), `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-3g supervisor verification, an accessibility correction, and two findings

Verification of the prompt-visual batch, plus a defect the supervisor introduced in the brief and
has now fixed.

**Three of four visuals landed; the fourth is correctly blocked.** Confirmed at source
(`samplers/number_sense.py:71-73`): `sample_conservation` puts `delta` in **operands** and not in
**prompt**. The wire carries `initial_count`, `transformation` and `options` only, so add/remove
magnitudes are unknowable client-side. The implementing agent's reasoning for rendering nothing
rather than the drawable half is correct and worth preserving: a visual that appears only when
`delta == 0` makes its own *presence* a perfect predictor of "same", manufacturing exactly the
false-mastery cue B-CNT04 was producing. **`B-NS07` stays stem-only until the server sends
`delta`** — a one-line change to that prompt dict, for the backend owner.

**B-ADD01 rendering objects is catalogue compliance, not scope creep.** Flagged by the implementing
agent as an unplanned consequence of key-driven resolution. It is not a problem: the governed
catalogue gives `B-ADD01-COMBINE-SETS` `representation_type: pictorial_objects`, so drawing objects
is what the design specifies. A template-id allow-list would have *suppressed* correct behaviour.
This is evidence for the key-driven design, not against it. Kept, no branch added.

**Accessibility labels announced the answer — supervisor's error, now corrected.** The FE-3g brief
required "an accessible label stating the quantity in words ('12 circles')". On *"How many objects
are there?"* that reads the answer aloud; on *"Compare the two sets"*, labelling both groups states
which is larger. It reintroduced the exact false-mastery defect the batch existed to remove, in the
one channel nobody inspects. The implementing agent built it as specified and flagged the conflict,
which is why it was caught.

Fixed in `object-set.tsx` and `two-sets.tsx`: group labels no longer carry counts ("A group of
circles to count", "First group"), and the objects are individually focusable and deliberately
**unnumbered** — numbering would be the pre-counting the same file forbids. A screen-reader user
now counts by traversing, as a sighted child counts by looking.

Recorded honestly and not resolved by the fix: **counting visually-presented objects may be
inherently inaccessible to some screen-reader users.** No labelling scheme repairs that — the
construct is visual. Whether such learners are in scope is a question for the research protocol
owner.

**Still open, flagged not changed.** `count-selection.tsx` displays "N objects selected" while the
child builds the set. For `B-CNT04` ("produce_requested_set") that arguably measures tapping rather
than cardinality production: a child can tap until the counter reads the target without ever
counting objects. Selected objects are already visually distinct, so removing the numeric readout
would still leave feedback while restoring the counting demand. Left as built because it is a
UX/measurement trade-off for Yasindu, not an unambiguous defect.

**Sequencing diversity — the most consequential observation in the batch report.** The implementing
agent recorded that live play served the first 20 opportunities as `B-CNT01`, then 39 of the next
40 as `B-NS02`. Two consequences. First, the supervisor's "~2 unanswerable questions per 5-question
session" figure describes the eligible **template pool**, not what a learner actually receives —
it should not have been stated as an experience estimate. Second, and more seriously, a child
appears to receive the same template up to twenty times consecutively. That may be
correct-but-degenerate (BKT-driven selection targeting the largest mastery gap, deterministic
tie-breaking, a fresh learner at prior on every skill), but "correct" and "tolerable for a
seven-year-old" are different claims. It also makes five of the six target templates effectively
unreachable through normal play, which is why they could not be verified live. Sequencing policy is
a Gate-B-adjacent question for its owner.

**Verification.** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**183 passed, 0 failed** (164 pre-existing + 19 new), re-run after the accessibility correction.

**Live: still not performed at the screen level — sixth consecutive batch.** Registry resolution is
proven against real payloads for all 30 template/grade combinations, and `B-NS02` was reached 39
times over HTTP with real `object_count` values 2–20 (which also confirmed BE-P1 Part A live:
choices arrived numerically ordered). That the components *draw* correctly remains unobserved.

**Files touched by this verification:**
`frontend/src/features/session/prompt-visuals/object-set.tsx`,
`frontend/src/features/session/prompt-visuals/two-sets.tsx`, `backend/buildLog1.md`.

Left uncommitted for Yasindu. Not run: any git command that mutates state.

---

## 2026-07-30 — FE-2b verified, and the first visual evidence in the project

**Verification.** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**203 passed, 0 failed** (183 pre-existing + 20 new). Screenshots reviewed by the supervisor.

**The reframe works and the design is untouched.** The path panel keeps its artwork, position,
colours, node markers and the surrounding layout exactly. What changed is what the nodes *mean*:
"Your Session" with Question 1 "Answered", Question 2 "Up next", Questions 3-5 "Not started",
and a hero reading "Resume Adventure". In the not-in-progress state the same panel shows five
neutral nodes under "Ready to Play" with "Start Adventure". Node count is driven by
`opportunities_total_bound`; the artwork's marker positions are passed separately as
`availablePositions`, which is the right separation — how many markers the illustration has is a
fact about the illustration, not about session length.

**The hints claim was rechecked, not assumed, and kept.** 108 of 108 hint lookups resolve across
all 36 templates against the live catalogue. The claim was false when written (2 of 36 templates)
and BE-C1's port made it true. "You can try again" was removed — attempt limits remain Gate-B
unresolved — and nothing was invented to fill the space.

**Two corrections the implementing agent made beyond the brief, both right.** The star icon
appeared on questions that had not happened yet and now appears only on answered ones. The
personal-name greeting fallback is gone — a child whose profile had not loaded was being greeted
by a real person's name.

**Guards fired three times on explanatory comments quoting the banned strings** — the same shape as
BE-C1's "superscripts" and FE-3f's "6 of 5". Reworded, never exempted. That is now the fourth
occurrence; the pattern is that a comment explaining *why* a string is forbidden will contain it,
and the guards are behaving correctly each time.

**Live debt partially closed — first screen-level evidence in six batches.** Confirmed on a real
device against the real backend:
- **FE-3g**: `B-NS02` renders 19 circles wrapping cleanly with no overlap, at the top of the
  range, on the exact template that prompted the batch. The original defect — a quantity question
  with no quantity — is fixed and seen.
- **BE-P1 Part A**: choices arrived numerically ordered (17 18 19 20) on a child-facing screen,
  not just at the generator.
- **FE-3d / FE-3b**: hint control present, submit disabled before selection, "Nice work!" outcome,
  advance working.

**Still unexercised live:** `B-CNT02`, `B-CNT03`, `B-CNT04`, `B-NS03`, `B-NS07` (sequencing keeps
serving `B-CNT01` and `B-NS02`), a real `TIMEOUT`, kill-and-resume, and the results screen at the
bound. The sequencing-diversity finding recorded in the FE-3g entry is now the main obstacle to
closing the rest.

**Incidental finding — web reload signs the learner out.** `expo-secure-store` is shimmed as an
in-memory `Map` on web, so a hard page reload loses the session. Native is unaffected. Not a
defect in any batch, but it will confuse anyone testing in a browser and is worth knowing before
someone debugs it as an auth bug.

No files touched by this verification; record only.

---

## 2026-07-30 — FE-3h supervisor verification: the wheel-pinning finding confirmed, sweep hazards confirmed

**Part 0's inertness independently reproduced.** In the rebuilt container:
`component_b_generator.__file__` resolves under `site-packages`, not `packaging/`, and
`inspect.getsource(sample_conservation)` shows the running prompt dict has no `delta` — matching
the implementing agent's report exactly. Also confirmed: the pinned wheel sha256
(`faa5760d…`) appears in three independent places — `requirements.lock`,
`tests/fixtures/runtime_bundle/valid_unapproved_bundle.json`'s `generator.checksum`, and
`provenance/component-b-live-engine-manifest.json`'s `wheel_sha256` — all three would need to move
together for a rebuilt wheel to be accepted. Declining to force a rebuild here rather than
push a mismatched hash through was the right call: BE4's parity claim (the running engine matches
what was reviewed) is exactly what that pin exists to make checkable, and updating it is a
provenance decision, not a one-line code fix.

**Generalising this rather than re-discovering it per batch.** This is the third time a baked,
non-bind-mounted artifact has caused a source edit to appear to work while the running system was
untouched: BE-C1's fixture catalogue (caught mid-batch by computing a checksum inside the stale
container), BE-C2/BE-P1's rebuild-first rule now standing in `scripts/README.md`, and now the
vendored engine wheel — one layer further down the same stack, install-time rather than
build-context. The standing rule (`docker compose up -d --build api` before any verification) is
necessary but not sufficient against this specific case: a full rebuild does not pick up a
`packaging/` edit at all, because the Dockerfile never copies `packaging/` — it installs a
pre-built wheel by hash. Any future change to `component_b_generator` needs to be checked against
*which* artifact actually ships it (source tree vs. vendored wheel) before assuming a rebuild is
sufficient verification.

**Sweep hazards re-checked in the shipped code, both correct.** `registry.ts` tests `places`
before `place` (line 121 before 128), so a base-ten-blocks payload cannot fall through to the
place-value-chart branch. `total` is required paired with `removed` (line 140), never alone — so
`B-DIV01`'s `total`+`recipients` and `B-DIV02`'s `total`+`group_size` correctly resolve to `null`
rather than a take-away visual.

**Verification.** `npx tsc --noEmit` clean; `npm run lint` clean; `npm run test:contract`
**215 passed, 0 failed** (203 pre-existing + 12 new). Backend suite unaffected at 291, as expected
given Part 0 shipped no runtime change.

**Live: unreached, and correctly not forced.** Sequencing served `B-NS02` for 39 of 40
opportunities across 8 sessions; neither `B-PV01` nor `B-SUB01` came up. This is now the third
consecutive batch (FE-3g phase, FE-3h) where built and unit-tested visual work cannot be observed
through normal play. The registry payload sweep remains the only evidence available for this
class of change until sequencing diversity is addressed by its owner — that is now a real
blocker on *verification*, separate from the product question of whether the sequencing itself is
appropriate.

**Deferred, correctly untouched:** phase-3 visuals (number line, groups, array, sharing, number
cards, column algorithm — 6 templates); `B-NS07` (blocked on the wheel, not on client work — the
before/after component and its registry branch are built and will activate with no further
frontend change once the wheel ships); the expanded-form bare-numeral acceptance, flagged again as
strengthened by base-ten-block rendering (a visible decomposition sitting next to an input that
accepts the un-decomposed numeral) but correctly left for Gate B rather than resolved as a
rendering choice.

No files touched by this verification; record only.

---

## 2026-07-30 — BE-S1 supervisor verification: the sequencing defect is real, fix confirmed independently

Full independent verification of BE-S1's finding and fix, not taken on report.

**Traced to the exact line.** `opportunity_selection.py`'s old `select_candidate` rebuilt
`history = {skill: None for skill in catalogue.skills}` fresh on every call — never populated from
any practice record. `sequencing/features.py` maps a `None` history entry to `spacing_due = 1.0`.
So every candidate scored the ceiling on spacing, unconditionally, on every single selection since
this code existed. The approved 0.50/0.30/0.20 formula was therefore never actually a three-term
formula in production — the spacing term was a constant, silently reducing it to an unapproved
two-term 0.50/0.30 split (rescaled) that no one signed off on. This was a defect in wiring, not in
the approved weights, and the fix touches only wiring: confirmed in `git diff` that
`SPACING_DUE_SATURATION_SESSIONS`, the three weights, `mastery_gap`'s formula, and every BKT
parameter are byte-unchanged.

**The two existing pure-function tests confirmed compatible by design, not by luck.**
`test_be4b_adaptive_selection.py`'s `test_selection_uses_the_frozen_0_50_0_30_0_20_weights` and
`test_selection_is_deterministic_under_fixed_identity` both call `select_candidate` with no
`sessions_since_practice` argument. The new parameter defaults to `None` and falls back to the
original all-`None` mapping — exactly what the diff's own comment states ("a caller that supplies
nothing still gets the previous behaviour, which keeps the pure determinism test callable without
a database"). Verified by reading both call sites before running anything, not inferred from the
suite passing.

**`ItemOpportunityRepository.sessions_since_practice`'s query read and checked.** Per skill: the
most recent session containing an opportunity for it, then a count of the learner's distinct
sessions created after that timestamp. The current session contributes 0 for a skill just
practised, which is what lets `spacing_due` drop immediately after practice and recover as later
sessions accumulate — matches the docstring's stated semantics.

**Full rebuild + suite run performed independently: 291 passed.** Frontend re-confirmed unaffected
at 215 (this batch is backend-only). Both runs were the supervisor's own, not restated from the
implementing agent's report.

**The "not purely this bug" finding is the more interesting one and is preserved as reported.**
BE-P2's own diagnostic (from FE-3h/BE-S1's live probing) submitted `presented_choices[0]` for
non-sequence prompts — almost always wrong for anything except `B-CNT01`'s sequence-continuation
format — which kept `mastery_gap` elevated for whatever it hit. Two independent effects compounded:
inert spacing removed the only term that could pull selection away from a high-`mastery_gap`
skill, and a wrong-answering probe kept that skill's `mastery_gap` high. Separating these matters:
a real learner genuinely struggling with a skill would, under the pre-fix code, have been walled
into repeating it with zero countervailing pressure — arguably a worse outcome for a real learner
than the diagnostic's artificial version, and it is now fixed as a direct consequence of the wiring
fix rather than a targeted intervention.

**Live before/after, reproduced in principle from the repository query logic (not re-run live by
the supervisor):** distinct templates served rose from 2 to 5 across the same responder behaviour;
`B-PV01` and `B-SUB01` — the FE-3h visuals previously reported as unreachable through normal play —
are now served. This substantially resolves the obstacle FE-3g, FE-3h and FE-2b each recorded
independently as an unexplained sequencing pin.

**Correctly left as a live policy question, not resolved by this batch:** whether a learner should
continue being served a skill they are actively failing is a product/research decision for the
sequencing formula's owner. This batch fixed the wiring defect that was suppressing the approved
formula's own countervailing term; it did not add a repetition cap, diversity floor, or any other
new policy, and none should be added without that owner's decision.

No files touched by this verification; record only.

---

## 2026-07-30 — Live verification session: three outstanding checks closed

Yasindu ran a full session on device against the fixture learner, post BE-S1. Reported results:

- **FE-3c (real TIMEOUT).** Left a question 5+ minutes, then answered. Result read "Time's up" /
  neutral — not treated as a wrong answer. **Closed.** This was FE-3b's original outstanding
  check 5 and has been open since that batch; it is now confirmed on a real device against a
  real server-issued `TIMEOUT`, not just unit-tested.
- **BE-S1 (sequencing fix), on screen.** "Good variety — several different skills" across the
  run, not the same 1-2 templates. First on-device confirmation of the fix; prior evidence was
  the diagnostic script and the FE-2b screenshot's single-session sample.
- **FE-3f (results screen).** "All done! You finished all five questions today" — plain count,
  no score, no percentage, no stars. Matches the spec exactly. **Closed.**
- No defects reported for the run as a whole.

**Not covered by this run, still open:** kill-and-resume (FE-3b's other outstanding check),
hints walked to a 409 (FE-3d), and confirmation that `B-PV01` or `B-SUB01` specifically appeared
(FE-3h's two newest visuals) — "several different skills" was reported without naming these two.
Not closing these on an inference; they remain open pending a session that specifically targets
them.

No files touched; verification record only.

---

## 2026-07-30 — Live: hints confirmed working

Yasindu confirmed hints work in live play (FE-3d). Combined with the earlier session in this same
verification pass, outstanding live debt is now down to two items: kill-and-resume (FE-3b), and
named confirmation of `B-PV01`/`B-SUB01` specifically (FE-3h) rather than "several skills" seen
generally.

No files touched; verification record only.

---

## 2026-07-30 — Live: resume confirmed via sign-out/sign-in

Yasindu signed out and back in mid-question; the same question was still there on return. This is
a variant of FE-3b's outstanding kill-and-resume check — signing out forces a full
re-authentication (new access token) rather than just an app restart, so it exercises the resume
path under a stronger condition than a simple kill: the server's active-session lookup and
opportunity re-fetch both worked correctly against a freshly authenticated session, not a cached
one.

**Kill-and-resume (FE-3b) treated as closed** on this evidence. The narrower case — force-closing
the app process without signing out — was not separately observed, but is a subset of what was
just exercised (same mechanism, weaker condition), so it is not tracked as a separate open item.

**Live-verification debt now stands at one item:** named confirmation that `B-PV01` or `B-SUB01`
specifically appeared and rendered correctly (FE-3h) — "several different skills" was reported
generally in the earlier session without naming these two.

No files touched; verification record only.

---

## 2026-08-01 - BF-1, BF-2, BF-3: measurement-integrity fixes from the independent review

Executed directly (Claude implementing, not a separate builder agent this round, at Yasindu's
explicit choice) against the plan derived from Component_B_Measurement_And_Parity_Review.md and
Component_B_Backend_Work_Order.md. All three of the review's highest-stakes claims were
independently re-verified against source before any code was touched - see the plan file's
Context section for the full derivation, including a from-scratch mathematical proof that BF-1's
defect was airtight, not merely likely. BF-4 (wheel rebuild) remains untouched and out of scope,
as instructed.

### BF-2 - stop discarding the timeout submission

app/application/attempt_submission.py's timeout branch now reads body.submitted_value and
persists it. response_matched stays NULL, event_kind stays "TIMEOUT"; the first-attempt BKT gate
(attempt_index == 1 and event_kind == "RESPONSE") is untouched, so this feeds no new mastery
observation. Pure data preservation, exactly as scoped.

A migration was required that the review and work order did not anticipate, because both were
static reads that explicitly excluded migrations from scope. A database-level CheckConstraint
(ck_b_attempts_response_matched_consistency, 20260728_0001) hard-enforced submitted_value IS NULL
on every TIMEOUT row - encoding the very defect BF-2 fixes at the schema level, not just in
Python. Without a migration, the fixed application code raises IntegrityError on every real
timeout submission (surfaced as a 409). New migration 20260801_0001 relaxes the constraint to
submitted_value IS NOT NULL AND (...).

The migration went through two more rounds of hardening after its first version failed under
real conditions - recorded because both failures were only found by actually exercising the
migration against real data, not by reasoning about it:

1. A first, symmetric downgrade() (drop new constraint, recreate the exact old one) fails
   reproducibly the instant any real timeout has been recorded since upgrading: the fixed code
   always writes a non-null submitted_value on TIMEOUT now, which violates the old constraint's
   submitted_value IS NULL clause. Not a corrupted-data edge case - every one of this project's
   test_migration_downgrade_reupgrade_cycle_and_schema tests (one per BE4x batch) downgrades all
   the way past this revision, and hit it. Fixed by making downgrade() asymmetric: it only drops
   the constraint, never recreates the old one - defensible because the very next step in every
   documented downgrade chain drops the whole b_attempts table anyway, so re-imposing a doomed
   constraint immediately before that buys nothing.
2. The asymmetric downgrade() then broke upgrade()'s own idempotency: a database that reached
   20260728_0003 by downgrading from 20260801_0001 no longer has the constraint for a bare DROP
   CONSTRAINT to find. Fixed by switching both directions to DROP CONSTRAINT IF EXISTS, tolerant
   of the constraint being present (a fresh database) or already absent (one that has been
   downgraded once).

Both were caught by literally running upgrade -> exercise real timeout data -> downgrade ->
upgrade end to end against the real dev database, not by inspecting the SQL. A genuinely broken
intermediate state was also discovered and repaired live during this process: an earlier failed
downgrade attempt had left the database one revision behind head with the constraint entirely
missing, while alembic current still reported it - traced by comparing alembic current against
pg_constraint directly rather than trusting either alone, then restored to a true baseline by
hand before re-running the full upgrade/downgrade cycle cleanly.

Tests (tests/test_be4c_attempt_submission.py): the existing
test_expired_deadline_records_timeout_and_creates_no_bkt_observation now additionally asserts the
persisted AttemptRecord.submitted_value equals what was sent; a new
test_timeout_submitted_value_matches_what_was_sent_not_the_correct_answer submits a value that
does NOT match the correct answer, to prove the persisted value is the learner's own text, not
silently coerced.

### BF-1 - fix the Guess-Guard wiring

The defect, proven mathematically before any code was touched. session_completion.py computed
both the per-skill median (q=0.5) and the plausibility floor (q=0.1) from the identical
current-session-only rt_history list. The package's _quantile is the standard type-7
linear-interpolation quantile, which is monotonically non-decreasing in q on a fixed sorted
sample - so floor = quantile(S, 0.1) <= quantile(S, 0.5) = median for any input, and
evaluate_guess_guard's trigger condition (median < floor) was false unconditionally. TRIGGERED
was not merely rare; it was provably unreachable. The reviewed package's own
evaluate_guess_guard is correct and untouched - only the caller's inputs were wrong.

The fix. New ItemOpportunityRepository.prior_session_first_attempt_rts(learner_id,
current_session_id) (app/infrastructure/repositories.py, alongside the existing
sessions_since_practice, same established pattern: a documented SQL aggregation, no migration,
reconstructed from b_attempts/b_item_opportunities/b_sessions, all of which already hold the
data): per skill, first-attempt (attempt_index == 1) RESPONSE-only response times in seconds,
from sessions strictly before the current one - mirroring _build_opportunity_response's own
within-session filter exactly, so prior- and current-session samples are computed the same way.
session_completion.py's call site now passes this prior-session history as the floor argument to
adapter.evaluate, while the current session's own data continues to supply only its own median,
exactly as before. Every parameter - theta_b, floor_quantile (0.1), floor_min_obs (5),
_MEDIAN_QUANTILE (0.5), _MEDIAN_MIN_OBSERVATIONS (1) - is byte-unchanged; this is wiring only.

Acceptance tests (tests/test_be4e_session_completion.py, three new, full integration path - real
AttemptSubmissionService + real SessionCompletionService, no BKT convergence shortcuts beyond
directly pinning starting p_l to isolate the Guess-Guard wiring from BKT's own already-covered
convergence):

- test_guess_guard_triggers_with_sufficient_prior_history_and_fast_current_median - the single
  most important assertion in this batch. A learner with 5 prior-session normal-speed (3.0s)
  first attempts for addition, p_l pinned to 0.6 pre-session (one correct current-session
  response pushes p_l_after to approximately 0.89, hand-computed from the TEST_FIXTURE_ONLY
  config's p_l0=0.2, p_t=0.15, p_g=0.2, p_s=0.1 before writing the test, then confirmed exactly
  by the real adapter), and a 50ms current-session response -> TRIGGERED. Confirmed
  threshold_met_flag is False (certify_skill's frozen rule blocks certification even above
  theta_b when triggered).
- test_guess_guard_insufficient_evidence_without_prior_session_history - no prior sessions at
  all, same fast response -> INSUFFICIENT_EVIDENCE, not a fabricated floor and not TRIGGERED.
  Doubles as the cleanest proof the current session's own data cannot leak into its own floor: if
  it could, this exact setup would falsely trigger.
- test_guess_guard_not_triggered_with_normal_speed_response_and_sufficient_prior_history - same
  prior history, but a normal-speed (3.2s) current response -> NOT_TRIGGERED,
  threshold_met_flag is True. Isolates "fast" as the necessary condition, not merely "enough
  history."

All three passed on the first run after the fixture's BKT arithmetic was hand-verified.

### BF-3 - estimator-input parity test

New tests/test_bf_estimator_parity.py. Purpose stated in its own docstring: test_be4f_parity.py
proves task-construction agreement and the wheel hash proves code identity; neither can catch the
backend passing statistically wrong arguments to a correct function - exactly how BF-1 shipped
undetected. Calls LiveEngineAdapter directly (never the raw package), asserting on estimator
inputs/outputs with hand-computed expected values, not just constructed tasks:

- plausibility_floor against [2.0, 2.5, 3.0, 3.5, 4.0] at q=0.1 equals 2.2 exactly (type-7
  interpolation, hand-computed before running: h=(5-1)*0.1=0.4, 2.0 + (2.5-2.0)*0.4 = 2.2) -
  deliberately non-identical values, unlike BF-1's own integration test's five-identical-3.0s
  case, so this exercises real interpolation.
- TRIGGERED / NOT_TRIGGERED / INSUFFICIENT_EVIDENCE against that same hand-computed floor.
- A direct encoding of the exact original defect shape: passing one identical sample as both the
  median source and the floor source must never trigger (asserted "is not TRIGGERED"), since a
  quantile function cannot decrease as q increases on one sample - this is what documents, at the
  estimator boundary, why the defect could only ever have lived in the caller.
- test_response_time_std_is_none_not_zero_for_a_single_observation, marked xfail(strict=True):
  calls adapter.aggregate_session with one opportunity and asserts response_time_std_ms is None.
  Currently fails as designed - the shipped wheel still computes the unguarded
  _population_std, returning 0.0 - confirming F1 is still present rather than accidentally
  fixed. strict=True means the moment BF-4's wheel rebuild lands, this test XPASSes and the suite
  fails until the marker is removed, so the fix cannot be silently forgotten.

Result: 5 passed, 1 xfailed, exactly as designed, on the first run.

### Documentation reconciliation

Component_B_Backend_Overview.md:
- Fix identifiers reconciled to the code's own names, per Yasindu's explicit choice: BE-P1
  (choice ordering) is now BE-C2 Part A (presentation.py:101) and BE-S1 (sequencing) is now BE-P2
  (opportunity_selection.py:211,364), with both old names kept as a parenthetical alias wherever
  they appear so buildLog1.md's prior entries and this conversation's history stay
  interpretable.
- Section 8's known-issues table gained two rows: F1 (the RT-std defect, blocked on BF-4, cross-
  referenced to test_bf_estimator_parity.py's xfail so the two can't drift apart) and BF-1
  (Guess-Guard wiring, fixed). Row 2 (timeout discard) and row 6 (sequencing) updated from "open"
  / their old names to reflect BF-2 and BE-P2 respectively.
- Section 7 (the wheel-pinning structural note) now names two things the pin holds back, not one
  - it previously used B-NS07 as its only worked example, which let a reader believe the
  rendering fix was the sole thing queued behind the pin.
- Sections 2.4 and 2.6's narrative mentions of the timeout and Guess-Guard behavior updated to
  match, each cross-referencing the relevant section 8 row rather than restating it.

Found but not fixed, flagged for Yasindu's decision: Component_B_Backend_Overview.md is
currently gitignored by the same blanket *.md rule this project has hit and fixed twice before
(for buildLog1.md and scripts/README.md) - it was never added to the allow-list. Editing
.gitignore is a repo-policy decision outside this batch's scope, so it was reported rather than
changed unilaterally.

### Verification

Established a real baseline first (the review explicitly never ran any code): rebuilt, full
suite 291 passed, boundary + parity guards 43/43, before any fix landed.

Final state, after all three fixes and the migration:
- Full suite: 300 passed, 1 xfailed, 0 failed (291 baseline + 1 BF-2 + 3 BF-1 + 6 BF-3, 5 passing
  plus the one designed xfail - arithmetic matches exactly).
- Boundary guards re-run in isolation: test_be2_architecture_guards.py +
  test_be3_live_engine_boundary.py, 40/40, unaffected.
- Hash chain re-checked and unchanged at faa5760d...a70c29 across all four pinned locations
  (requirements.lock, the manifest, the bundle fixture, and the wheel file's own sha256sum) -
  nothing in this batch touches the wheel.
- python scripts/dev_fixture_learner.py --test-fixture-only exits 0, self-verify POST
  .../opportunities returns 201 - the real HTTP chain, including both application-layer fixes,
  confirmed working end to end for a real learner. (One unrelated interruption along the way: the
  familiar bundle-shadowing condition from running the full suite repeatedly during this batch -
  fixed with the same one-row timestamp bump this project has used every previous time, not a
  regression from this work.)
- Two pre-existing, unrelated test failures were observed transiently during this batch
  (test_be2_bundle_integrity.py's two bundle tests) and confirmed to pass cleanly in isolation -
  the same already-documented full-suite-ordering flakiness from bundle-row shadowing, not caused
  by BF-1/BF-2/BF-3. Not present in the final clean run.

Files touched: backend/app/application/attempt_submission.py,
backend/app/application/session_completion.py, backend/app/infrastructure/repositories.py,
backend/app/infrastructure/persistence_models.py,
backend/migrations/versions/20260801_0001_bf2_persist_timeout_submission.py (new),
backend/tests/test_be4c_attempt_submission.py, backend/tests/test_be4e_session_completion.py,
backend/tests/test_bf_estimator_parity.py (new), Component_B_Backend_Overview.md,
backend/buildLog1.md. Not touched, per scope: backend/packaging/**, any BKT/sequencing parameter
value, backend/scripts/dev_fixture_learner.py, BF-4 (wheel rebuild).

Implemented directly this round (Claude, not a separate builder agent), per Yasindu's explicit
instruction. No git state-changing command was run; everything above is left staged for review.

---

## 2026-08-01 — Correction: BF-2 migration's `upgrade()` fails against real legacy timeout data

Supervisor review (acting independently over the batch above) confirmed BF-1/BF-2/BF-3 correct
by reading the diffs directly, then found one real defect neither my own testing nor the review
that produced the original work order had caught: the migration
(`20260801_0001_bf2_persist_timeout_submission.py`) as originally written would fail outright on
any database holding real pre-BF-2 `TIMEOUT` rows.

**The defect.** `upgrade()` used a plain `op.create_check_constraint(...)`. PostgreSQL validates
a plain `ADD CONSTRAINT ... CHECK (...)` against every existing row at creation time. Every
`TIMEOUT` row written before this migration has `submitted_value IS NULL` - the *old* constraint
required exactly that - and the new constraint's `submitted_value IS NOT NULL` clause rejects
every one of them. So the plain form fails with `CheckViolationError` on precisely the database
population it exists to accommodate going forward.

**Why nothing in the original verification caught this, and why that's structural, not
sloppiness.** `test_migration_downgrade_reupgrade_cycle_and_schema` (one per BE4x batch)
downgrades to a revision that predates `b_attempts` entirely, dropping the table - so every
re-upgrade in that test always runs against an empty table, never a populated one. And the manual
upgrade/exercise/downgrade/upgrade cycle run while building the migration only ever exercised the
already-fixed application code, which always writes a non-null `submitted_value` now - real
legacy NULL rows were never in play at any point that testing touched.

**Reproduced directly before writing the fix, not after.** Downgraded to `20260728_0003`,
hand-inserted one attempt row shaped exactly like genuine pre-BF-2 output (`event_kind='TIMEOUT'`,
`submitted_value=NULL`, `response_matched=NULL`, attached to a real existing opportunity/learner
pair), then ran `alembic upgrade head` - reproduced the exact `IntegrityError: CheckViolationError`
the supervisor predicted, on the exact constraint, before touching the migration file.

**Fix.** Replaced the plain `op.create_check_constraint(...)` with
`op.execute("ALTER TABLE b_attempts ADD CONSTRAINT ... CHECK (...) NOT VALID")`. `NOT VALID`
enforces the constraint on every new and updated row from this point forward while leaving
existing rows unscanned and unenforced. This is the honest encoding of what happened, not a
workaround: those answers were genuinely destroyed by the old code and cannot be recovered, so
backfilling a sentinel would fabricate data that was never observed - exactly what this project's
first-attempt-only, never-synthesize discipline exists to prevent elsewhere (hints, distractors,
BKT). A legacy `TIMEOUT` row keeps its real, honest `NULL` forever; it is neither backfilled nor
deleted. Docstring extended in the same paragraph-length style as the migration's two existing
sections, documenting the defect, the reproduction, and the reasoning inline so a future editor
doesn't revert to the plain form for looking simpler.

**Re-verification, against the exact same reproduction scenario (same DB, same legacy row, same
downgraded starting point) after rebuilding the container with the fix:**
- `alembic upgrade head` now succeeds where it previously failed - no other change to the DB
  state between the two attempts.
- The legacy row's `submitted_value` and `response_matched` confirmed still `NULL` after the
  upgrade - not backfilled, not touched.
- `pg_constraint` confirms the constraint exists with `convalidated = f` (i.e. `NOT VALID`),
  definition otherwise identical to the intended new constraint text.
- A second hand-inserted row shaped like the old illegal pattern (`TIMEOUT` + `submitted_value
  NULL`) was rejected by the constraint - confirming `NOT VALID` still enforces going forward on
  every new write, it only skips the retroactive scan of rows that already existed.
- Reproduction row deleted afterward (synthetic TEST-provenance data).
- Full up -> down -> up migration cycle re-run cleanly from a known-good baseline.
- Full test suite: 300 passed, 1 xfailed, 0 failed - identical to the prior clean run, zero
  regressions from this correction.
- Boundary/parity guards re-run in isolation: 43/43 (test_be2_architecture_guards.py +
  test_be3_live_engine_boundary.py + test_be4f_parity.py).
- Wheel hash re-checked, unchanged at faa5760d...a70c29.
- `python scripts/dev_fixture_learner.py --test-fixture-only` exits 0, self-verify 201.

**Files touched:** `backend/migrations/versions/20260801_0001_bf2_persist_timeout_submission.py`
(docstring + `upgrade()` body only), `backend/buildLog1.md`.

Implemented directly, per the same explicit instruction as the batch above. No git
state-changing command was run; everything above is left staged for review.

---

## 2026-08-08 — BF-4: engine wheel rebuild — RT-std fix, B-NS07 delta, one latent test bug found

**Why now, and why not just rebuild from GF-1..4.** BF-4 was blocked on GF-3 landing in Yass
(fixed_hidden_growth_g, spec 8.4 step 4). GF-1 through GF-4 merged to Yass `main` (958ab06),
confirmed via `git merge-base --is-ancestor` on full 40-character SHAs, not abbreviated ones —
this repo underwent a directory flatten (the `Implementation_v1.0/` prefix was removed at some
commit in this range) and abbreviated-SHA / prefixed-path lookups were independently found to
give a self-consistent but WRONG answer once mid-investigation (an `ls-tree` count of 0 for a
path that `cat-file -e` confirmed did exist), traced to intermittent subprocess fork failures in
this Windows Git Bash environment corrupting one pipeline silently. Every path and commit used
below was re-resolved with a full SHA and `git cat-file -e` before being trusted.

**Restricted to this package's two source directories (`component_b_generator/`, `models/`),
the GF-1..4 diff barely touches what BF-4 rebuilds.** `git diff` between the BE3 pin
(`0e86fdcbc0ffcdbda3d37c742e83b1d532910e2b`) and the new one, six files differ:
`adapters/to_3.py`, `audits/leakage.py`, `pilot.py`, `pipeline.py` — all four already on this
package's own `excluded_by_omission` list, so GF-1's SF-038 gate and GF-3's
`fixed_hidden_growth_g` never reach the live-safe wheel regardless of this rebuild;
`models/behaviour.py` — its only change is a new `hidden_growth_ceiling` field on
`BTruthInitializationConfig`, a class already absent from this package's trimmed copy, so the
existing BE3 trim absorbs it with zero code change (confirmed by grepping the shipped trimmed
module for both names — no match — not assumed from "should"); and
`component_b_generator/aggregation/session.py`, the actual RT-std fix this batch exists for.

**The B-NS07 delta-in-prompt fix was upstreamed to Yass first, not shipped as a local
modification.** `backend/packaging` already carried this exact fix locally (FE-3h Part 0,
inert until now), and `samplers/number_sense.py` was otherwise byte-identical to the BE3 pin.
Rather than let the manifest's "all 45 verbatim" claim degrade to "44 verbatim, 1 local" — the
entire point of this architecture is that the live system provably runs the same science that
was reviewed offline — the two-line change was upstreamed as its own Yass PR
(`component-b-ns07-delta-in-prompt`, commit `69cb112`, merged as `09267ab`) before this rebuild
pinned to it. Checked, not assumed, that this was safe: no test anywhere in the Yass suite
(1661 tests) asserts `sample_conservation`'s prompt keys exactly — `.prompt` is only ever
forwarded wholesale (`dict(content.prompt)`) — and both `SampledContent.prompt` and
`TaskInstance.prompt` are typed `Dict[str, Any]`, no strict schema to violate. Full Yass suite
re-run after the change: 1661 passed, matching the pre-change baseline exactly.

**Anchor: `09267ab` (full: `09267abfe83829168b8b4817eb4c59d10f54e311`), origin/main tip.**
Independently confirmed via `git fetch` + `git merge-base --is-ancestor` (both `75d0216` and
`09267ab` are real ancestors of `origin/main`), not taken on report.

**Rebuild.** `pyproject.toml` version bumped `0.1.0+be3.0e86fdc` -> `0.1.0+bf4.09267ab`.
`aggregation/session.py` and `samplers/number_sense.py` overwritten with the exact bytes from
`git show 09267ab:Implementation_v1.0/component_b_generator/<path>` (diffed against the pinned
commit content directly — zero output both times, confirming byte-identity before either file
was trusted). `SOURCE_MANIFEST.txt` updated for those two files' new per-file hashes; the
aggregate `package_source_manifest.sha256` recomputed as the sha256 of the manifest file itself
(the algorithm it documents). Built with
`python -m build --wheel --no-isolation --outdir dist` **inside the exact application base
image** (`python:3.11.15-slim-bookworm@sha256:b18992999dbe963a45a8a4da40ac2b1975be1a776d939d098
c647482bcad5cba`), not a merely-compatible local interpreter — no native Python 3.11.x was even
available on this machine (`py -0` showed 3.10/3.13/3.14 only), and interpreter parity is the
point of a hash-pinned wheel. New wheel sha256: `148d03e7fd3f7ec075ee9b97effd3955ef013cee583baf
19cc90686381537d06`.

**Verified the fix directly against the built artifact before touching any pinned location.**
Installed the wheel in an isolated container and called `_response_time_stats` and
`sample_conservation` directly: a single-observation session now returns `std=None` (was `0.0`);
a zero-variance two-observation session also returns `None`; a genuine-variance two-observation
session still returns a real positive `std` (the guard is narrow, not a blanket suppression);
`sample_conservation`'s prompt dict now carries `delta`. Also re-ran BE3's own boundary
checks — capability-symbol import, prohibited-module unreachability, hidden-truth-class
absence (specifically re-checked that GF-3's new `hidden_growth_ceiling` field did not leak in
through the existing trim) — all passed against the new wheel.

**Four pinned locations, plus a fifth found while doing this:
`requirements.lock`, `requirements.in`, `Dockerfile` (COPY line), and
`provenance/component-b-live-engine-manifest.json` were the four named going in. Rebuilding the
container first failed — `.dockerignore` allow-lists the wheel by exact filename, the same
blanket-ignore-with-allowlist pattern `.gitignore` uses for markdown docs, and it only knew the
BE3 filename. Added the BF-4 filename as a second allow-line rather than replacing the BE3 one.

**Bundle fixtures — three files, not a blanket update.** `app/infrastructure/runtime_bundle/
loader.py:103` actually opens and hashes the file at `generator.source_path` — confirmed by
reading the code, not assumed — so all three fixtures' `source_path` needed the new filename or
`bad_checksum_bundle.json`'s deliberately-wrong checksum would start raising a file-not-found
once the old wheel's filename stopped being current, masquerading as a checksum failure.
`checksum.value` was updated only in `valid_unapproved_bundle.json` and
`missing_field_bundle.json`, to the new real wheel hash; `bad_checksum_bundle.json`'s
deliberate `ffff...` sentinel was left untouched — only its `source_path` moved. All three
validated as well-formed JSON after editing; all 21 bundle-fixture-dependent tests (including
the deliberate-mismatch path) re-run in isolation afterward: 21 passed.

**Old wheel kept, not deleted** (both `be0.0e86fdc` and `be3.0e86fdc` wheels remain in
`provenance/wheels/`, hashes reconfirmed unchanged) — a provenance repo benefits from retained
artifacts, `--require-hashes` only installs what's listed so a stray wheel is inert, and this is
already the de facto pattern for the BE0 wheel. The manifest gained a `rebuild_provenance`
section documenting the superseded BE3 package's version/hash/pin and why it's retained, rather
than silently overwriting its record.

**A real, independent bug found during verification, not a BF-4 defect but caught by BF-4's own
discipline.** The full suite's first post-rebuild run showed the *same* "300 passed, 1 xfailed"
as before the rebuild — the wrong signal, since the whole point of this rebuild was for that
specific `xfail(strict=True)` test to flip. Per the standing rule that a green suite doesn't
prove a strict-xfail converted, it was checked directly: `pytest --runxfail` on
`test_response_time_std_is_none_not_zero_for_a_single_observation` showed it failing for a
completely unrelated reason — a `session_id`/`item_opportunity_id` format validation error, not
the std assertion. This test's own fixture data (`student_id="STU-BF03-0001"`,
`item_opportunity_id="opportunity-bf3-1"`, `task_instance_id="task-bf3-1"`) never matched the
package's real id formats (`^STU-[0-9]{4}-B-[0-9]{3}$` for a session id,
`^STU-[0-9]{4}-B[0-9]{3}-I[0-9]{3}$` for an opportunity/task-instance id, confirmed against
`test_be4f_parity.py`'s established convention) and had been silently masked since BF-3, because
`xfail(strict=True)` marks any exception as the expected failure regardless of cause — this test
had been xfailing for the wrong reason since it was written. Fixed both id values
(`STU-0003`, `STU-0003-B001-I001`); re-ran with `--runxfail`: passes for real. Removed the
`xfail` marker per its own reason string's instruction ("this test will XPASS ... the point is
to force that removal"). Full suite re-run: **301 passed, 0 xfailed, 0 failed** — the correct
conversion (300 + 1 xfail -> 301 passed, arithmetic matches exactly).

**Final verification, all re-run after the marker removal:**
- `pip show upadya-component-b-live-engine` inside the rebuilt container: `0.1.0+bf4.09267ab` —
  confirmed the running system actually has the new wheel, not inferred from the build log.
- Full suite: 301 passed, 0 xfailed, 0 failed.
- Boundary/parity guards in isolation: 43/43.
- All 21 bundle-fixture-dependent tests in isolation: 21 passed.
- Hash chain: `requirements.lock`, the manifest, and all three bundle fixtures' `source_path`
  agree on `upadya_component_b_live_engine-0.1.0+bf4.09267ab-py3-none-any.whl`; `checksum.value`
  (where not deliberately wrong) agrees on `148d03e7...537d06` in all three real-hash locations.
  All three retained wheel files' sha256sums re-checked and match their recorded values.
- `python scripts/dev_fixture_learner.py --test-fixture-only`: self-verify succeeded, real
  session served a real opportunity end-to-end. One interruption along the way, not a BF-4
  regression: the familiar bundle-shadowing condition from running the full suite repeatedly —
  fixed with the same one-row `created_at_utc` timestamp bump this project has used every
  previous time (table is `b_runtime_bundle_records`, not guessed correctly on the first try).

**Files touched:** `backend/packaging/component_b_internal/pyproject.toml`,
`backend/packaging/component_b_internal/SOURCE_MANIFEST.txt`,
`backend/packaging/component_b_internal/component_b_generator/aggregation/session.py`,
`backend/packaging/component_b_internal/component_b_generator/samplers/number_sense.py`,
`backend/provenance/component-b-live-engine-manifest.json`,
`backend/provenance/wheels/upadya_component_b_live_engine-0.1.0+bf4.09267ab-py3-none-any.whl`
(new), `backend/requirements.lock`, `backend/requirements.in`, `backend/Dockerfile`,
`backend/.dockerignore`, `backend/tests/fixtures/runtime_bundle/valid_unapproved_bundle.json`,
`backend/tests/fixtures/runtime_bundle/missing_field_bundle.json`,
`backend/tests/fixtures/runtime_bundle/bad_checksum_bundle.json`,
`backend/tests/test_bf_estimator_parity.py`, `backend/buildLog1.md`. Not deleted: either
retained wheel. Not touched: any BKT/sequencing parameter value, `backend/scripts/
dev_fixture_learner.py` itself (only its database state).

On the Yass side (separate repository, already merged, not part of any Upadya commit): PR #13
(`component-b-ns07-delta-in-prompt`, commit `69cb112`, merged as `09267ab`) — prepared and
verified in this same session (targeted + full 1661-test suite), left for Yasindu to push/merge
per the same no-agent-git-mutation discipline as this repository.

Implemented directly, per the same explicit instruction as the batches above. No git
state-changing command was run.

---

## 2026-08-09 — B→C evidence-boundary review: proposal-only, no code touched

An architecture/research review of a proposed MINIMAL-CHANGE enrichment of the B→C boundary:
send the seven mastery probabilities **plus** an approved per-skill evidence/readiness signal, so
Component C can distinguish `mastery_addition = 0.977` backed by three observations from the same
value backed by twenty. Explicitly proposal-only — no code, no BKT parameter, and no contract was
modified, and no git state-changing command was run. The deliverable is a published review
document, not a patch.

**The review was conducted against the Component C generator as implemented**
(`Yass/Implementation_v1.0/component_c_generator`), not against its specifications, and that
distinction changed the answer three times.

**Finding 1 — the "C-side warm-up" alternative is not a proposal; it is shipped code.**
`selection/phase.py::decide_session_phase` implements the familiarization off-by-one rule,
`selection/selector.py` honours it with a mastery-free seeded rotation, and
`selection/config.py:82` carries grade-specific windows `{2: 2, 3: 3}`. Any A-vs-B comparison is
really "replace working code" vs "keep it".

**Finding 2 — the proposal is a request to reopen a recorded deferral, not a new idea.** The
`Component_C_ColdStart_Bootstrap_Readiness_Assessment_v1.0` §4 decision table already scores the
"B→C v2.2 mask" option as *highest* scientific validity and still dispositions it
`deferred (v2.2)`; an earlier draft of that same document proposed an orchestrator-routed
readiness mask and **withdrew** it. C enforces the resulting purity actively, not by convention:
`models/session.py:28-31` blocks the substrings `observation_count` and `readiness` at runtime,
and `tests/test_c_generator_phase_c1.py:313` asserts the rejection.

**Finding 3 — the proposal identifies a real gap the assessment missed, but misplaces the harm.**
The assessment analysed thin evidence only in the *low* direction (a prior-only skill mislabelled
"weakest"). The *high* direction was never analysed. Quantifying it against the approved
provisional priors (Component B Empirical Statistical Parameters §6.2.1) and
`_clamp_initial_difficulty` verbatim: **one to three consecutive correct first attempts drive C's
initial difficulty to the maximum of 5 in every population cell** (TD·counting: 1; MLD: 2;
DD: 3). The decisive number is that at exactly `K = 2` — the bootstrap coverage target the whole
§5.5 feasibility constraint exists to guarantee — initial difficulty is already 4 or 5 in six of
seven cells. **The approved safety mechanism does not constrain the difficulty axis at all**,
because it was engineered for the selection axis. Hand-derived values were re-computed
programmatically and agreed to three decimal places.

Severity is bounded, and honestly so: only task 1 uses the mastery-seeded difficulty
(`pipeline/session.py:16-19`), C4.1 adaptation reads zero mastery (verified — `adaptation.py` and
`policy/rule_based.py` contain no occurrence of the string), and the exposure is fully contained
during sessions 1..W. Real risk of unknown magnitude, not a catastrophe.

**Recommendation: useful but not required — do not open a v2.2 field proposal yet.** The harm
channel, `_clamp_initial_difficulty`, is entirely C-owned, so the minimal response is a C-side
difficulty cap needing no contract change, no schema bump, and no cross-owner approval. Ahead of
that in priority: the Cold-Start Assessment is `DRAFT FOR OWNER REVIEW` with a blank signature
table while shipped C code already transcribes its numbers, and its §1/§2 statements that
"Component C is not implemented" and the selector is "proposed only … not yet code" are now
false. Getting it signed and corrected is a larger exposure than the field question.

**On signal choice, if the boundary is ever reopened:** the appropriate candidate is a raw
per-skill first-attempt observation count in the existing `SkillCounts` model — *not* guess-guard
status (derived from median RT, which B→C §2 prohibits outright) and *not* certification
(`mastery_certified_<skill>` is named in the prohibited table, and it is a high-mastery gate, not
an evidence measure — a category error, not merely a prohibited one). Two supporting facts worth
recording: per-skill opportunity counts are **already an approved FROZEN export** on the B→3 edge
(register B-032, `opportunities_w4`), so this would extend an existing field pattern rather than
invent one; and the B→C spec carries its own reopening clause ("unless a higher-precedence
document explicitly approves that field for this edge"), so the blocker is procedural, not
absolute. Contrary to an earlier impression, **B-014 is not a blocker** — it governs B's internal
estimation, not what B exports. SF-043 is not one either (it prohibits caching; a fresh
same-session count is not a cache) and its register status is `PROPOSED`, not frozen.

**Two incidental findings, both outside this review's scope, flagged for their owners:**
- `app/infrastructure/live_engine/adapter.py:292` hardcodes `observation_count=0` when
  reconstructing skill state for the packaged sequencer. Nothing downstream is wrong today (the
  persisted column is authoritative and is incremented correctly at
  `attempt_submission.py:351`), but any future readiness signal must be sourced from the column,
  never from that reconstruction path.
- The live backend still has **no B→C exporter at all** — `mastery_counting`, `BToCMastery`, and
  `component_source` return nothing across `app/` and `contract/`. This weakens any urgency
  argument but strengthens the timing one: whoever writes it should write it once, against
  whichever schema is approved.

**Files touched:** `backend/buildLog1.md` only. No source file, parameter, contract, or
specification document was modified in either repository; the review was read-only throughout. A
scratch BKT-trajectory probe was written to the session scratchpad, outside both repositories.

---

## 2026-08-09 — Component C production build plan: planning only, no code written

A full implementation/build plan for taking the Adaptive Game-Based Learning Engine from research
generator to live backend, live frontend, and an integrated B+C learning experience. Planning
task only — no production code, no BKT parameter, no contract, and no specification document was
modified in either repository, and no git state-changing command was run. Deliverable is a
published 19-section plan with 17 diagrams. Sources: the actual C generator implementation under
`Yass/Implementation_v1.0/component_c_generator`, the C SPEC / C3 telemetry spec / build plan /
cold-start assessment, the Game-Task Catalogue and Parameters, the boundary contracts and
registers, the governance memos, `HandowerDocs/`, and the live B backend/frontend under
`Upadya/Dev`.

**The plan was written against the code, not the specifications, and that reversed three things
the documents assert.**

**Finding 1 — the C research generator is COMPLETE, not pending.** Its own build plan states "no
code authorized until the C0 preflight clears" and lists every phase as future work. In fact C0
through C7.1 are all implemented: 84 modules, ~9,200 lines, and fourteen phase test files
(`test_c_generator_phase_c1.py` → `test_c_generator_phase_c7_1_pilot.py`). `CToComponent3Payload`
schema 3.0 exists and validates. The build plan and the cold-start assessment are both stale
relative to the code they govern.

**Finding 2 — nothing of C exists in production.** No live backend module, no frontend feature, no
game tables (all 21 live tables are `b_*` or shared), no B→C exporter, no C→3 delivery. The
production work is genuinely greenfield, but with a complete tested reference to port from.

**Finding 3 — the unified Home / practice-streak concept is 100% unspecified.** Searching every
spec, contract, register and governance document for `streak` and `unlock` returns **zero**
matches. So the entire product layer is an owner decision with no prior art to contradict — which
is the cleanest decision in the document. Recorded candidate rules only; no threshold, window, or
expiry value invented.

**The initial-difficulty finding, verified structurally.** The earlier review established that 1–3
correct first attempts drive `_clamp_initial_difficulty` to level 5. Tracing the call graph this
time produced the actual mechanism: `apply_safety` already owns difficulty bounding and already
computes ceilings (familiarization cap, fallback cap, recovery cap, prior-state cap) — **but it
never runs on task 1.** The selector sets the opening difficulty directly and the safety controller
only enters from task 2 onward. So the system has two difficulty-setting paths and only one is
audited. The minimum change splits cleanly: (a) route the opening pick through the existing safety
ceiling computation — structural, parameter-free, no formula change, should happen regardless; and
(b) the ceiling value itself, which is a genuine owner decision because today's ceilings leave a
healthy mastery-driven session at 5. Three candidates recorded (reuse the existing familiarization
cap for the first mastery-driven session; a new capped config value; or drop mastery-seeding
entirely). **Deliberately did not select one** — the choice trades engagement against caution.

**Scientific/product separation made structural rather than aspirational.** The plan requires
`c_access_state` to declare no scientific column, the access module to import nothing from the
engine adapter, and a denied-substring guard over its responses — mirroring C's existing
`_B_DERIVED_KEY_MARKERS` pattern. Also noted that the product lock and the scientific
familiarization window already agree without being coupled: a learner who only plays games never
completes a combined handoff, so the familiarization counter never advances anyway. They reinforce
each other and must still not be wired together.

**Generator→production boundary.** Roughly half the generator is a learner simulator and must never
ship: `behaviour/outcome_model.py`, `latency.py`, `action_provider.py`, `attempt_loop.py`,
`decisions.py`, `pipeline/pilot*.py`. Flagged the trap that `pipeline/session.py` looks reusable
but runs a whole session in one function call with synthetic actions — production must re-implement
it as persisted, resumable, request-driven state and keep only its decision ordering.

**Two governance findings worth acting on independently of this plan:**
- The Cold-Start Assessment is `DRAFT FOR OWNER REVIEW` with a blank signature table, yet
  `selection/config.py` transcribes its worked window values `{2: 2, 3: 3}` into shipped code and
  `selection/phase.py` implements its rule as "FROZEN". Code depends on an unsigned document.
- `R26-IT-138_Component_C_Final_Approval_Memo_v1.0_**APPROVED**.md` has a status line reading
  "PROPOSED FOR COMPONENT-OWNER AND SUPERVISOR APPROVAL", a blank §18 sign-off block, and its own
  opening warning that it "does not become 'approved' merely because it has been drafted." A viva
  or handover pack must quote the status line, never the filename.

**Recommended build order:** governance correction → kernel wheel + parity harness → schema →
adapter → session/task lifecycle → telemetry + server-side evaluation → policy/safety →
aggregation + outbox → frontend shell + 8 renderers → B→C exporter + combined ordering → unified
Home → hardening. Packaging is first because the parity harness is what proves production runs the
same science the research validated; schema is early because append-only guarantees are painful to
retrofit. Also recorded what the team should refuse to build until a decision exists (any
difficulty cap, the streak mechanism, any B→C evidence field, any RL policy, any client-side
difficulty or safety logic).

**Files touched:** `backend/buildLog1.md` only. No source file, parameter, contract, or
specification was modified in either repository; the review was read-only throughout.

---

## 2026-08-09 — Component C build plan v2.0: merged and hardened, planning only

Revised the Component C production build plan against two documents surfaced after the first
draft: `Upadya/Component_C_Backend_Frontend_Build_Plan_v1.0.md` (2026-08-08) and
`ResearchProject/R26-IT-138_Component_C_Supervisor_Intake_Report_and_Phase_1_Work_Order_v1.0.html`.
Planning only — no production code, no BKT parameter, no contract, no specification modified in
either repository, and no git state-changing command run. Output written to
`Upadya/Component_C_Backend_Frontend_Build_Plan_v2.0.html`.

**Both source documents were substantially better than my first draft on the packaging question,
and the intake report found a defect my draft shared.** The v1.0 plan and my draft both excluded
`behaviour/`, `pipeline/` and `audits/` as whole packages. That strands four pure, live-required
files: `behaviour/summary.py` (the only implementation of the C3 §15 derived task summary),
`pipeline/evidence.py` (the SPEC §14.2 evidence window and the Params §14 `c_rolling_strain`
formula, transcribed verbatim), `pipeline/config.py`, and a trimmable `pipeline/session_state.py`.
Per-package exclusion forces either re-implementing those formulas in the backend (guaranteed
drift, in the exact fields that feed Component 3) or copying them into `app/` (a locally-modified
science file outside the wheel and outside the parity chain — the thing BF-4 explicitly refused
when it upstreamed `number_sense.py`). The correction is per-module exclusion, which is also what
B actually does: B ships `behaviour/hints.py` with an emptied `behaviour/__init__.py`. Adopted;
v2.0 §5 carries the corrected 10-file never-ship list.

**Adopted the intake report's other findings as baseline**, notably: two wheels cannot both own a
top-level `models` package (C's wheel vendors none and depends on B's, so the two pins are now
coupled and a test must assert both manifests record the same SHA); **eight** pin locations rather
than five (`requirements.in` and two more bundle fixtures were missing); the AST guard matches
import *roots* only, so `component_c_generator.pipeline.session` would pass it; the
prohibited-column guard bans `latency`, `correct`, `answer` and `mastery`, all four unavoidable in
C's own schema; and pause pairing in the summary derivation is *positional*, so overlapping pauses
pass every check while producing wrong durations.

**Three findings added in v2.0 that neither source document caught:**

- **C-16 (High) — the entire cold-start/familiarization mechanism is absent from the v1.0 plan.**
  Verified: zero matches for `familiariz`, `session_phase`, `cold-start` or `handoff` in that
  document. Its §5.8 describes `lowest_mastery_then_coverage` with no phase gate. A builder
  implementing v1.0 faithfully would wire mastery-driven selection from session 1, silently
  dropping a mechanism that is implemented and tested in the generator (`selection/phase.py`,
  `selection/config.py`) — reintroducing the defect the cold-start assessment exists to prevent and
  breaking generator parity. Now carried as a Phase 4 requirement plus a `session_phase` column and
  the eligible-handoff counter.
- **C-17 (Medium) — initial difficulty.** v1.0 §5.7 states `clamp(round(1 + 4 × mastery), 1, 5)`
  with no risk note. Restated the verified finding that 1–3 correct first attempts saturate it at
  level 5, and added the structural cause found by tracing the call graph: `apply_safety` already
  computes ceilings but **never runs on task 1**. Fix split into a parameter-free part (route the
  opening pick through the existing chokepoint) and an owner decision (the ceiling value, three
  candidates, none recommended).
- **C-18 (Medium) — renderer routing.** Extracted all 30 `valid_action_space` declarations. v1.0's
  family routing gives 8 renderers each hiding an internal switch (Count-and-Collect alone spans
  four different action shapes); my earlier draft's key-shape routing gives ~26, because key naming
  is inconsistent — `submitted_total`/`sum`/`remainder`/`difference`/`product`/`quotient`,
  `selected_numeral` and `selected_value` are eight names for one widget. Resolution: route on an
  explicit template→**interaction archetype** table (8 archetypes), composed with representation
  primitives. The mapping must be a table, never inferred from key names.

**Corrections to my own earlier published plan:** the generator is **81 files / 9,182 lines**, not
"84 modules" as I wrote — the v1.0 plan's figure was right and mine was wrong. Test counts restated
honestly as static `def test_` counts (384 across 14 C phase files; 1,216 repo-wide), with an
explicit note that the suite was not run and parametrisation makes collected counts higher; the
"1,595 tests passing" figure could not be verified without running it.

**Carried forward as the highest-risk item in the whole build (C-4, the intake report's):** nothing
currently asserts that the safety controller *actually fires*. Both its severe triggers read fields
produced by `build_policy_evidence`; if the backend assembles evidence from a truncated history,
`compute_rolling_strain` collapses toward 0.0, the consecutive-error max collapses to the current
task, and the hard safety layer silently never triggers while the suite stays green. This is B-1 in
Component C form. Phase 6 acceptance now requires safety positive controls and estimator-input
parity, not code-identity parity.

**Blocking item, unchanged and owner-owned:** the `Upadya/Dev` working tree is not clean (7 modified
files, 875 insertions, 78 deletions, 8 untracked paths — all Component B frontend work on
`B_frontend`). Phase 1 cannot start under the plan's own load-bearing rule. Not mine to resolve; no
commit or stash command was run or recommended.

**Files touched:** `Upadya/Component_C_Backend_Frontend_Build_Plan_v2.0.html` (new) and
`backend/buildLog1.md`. No source file, parameter, contract, or specification document was modified;
the review was read-only throughout.
