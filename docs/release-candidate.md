# Release candidate: site redesign

Prepared 14 November 2026. Not deployed. Nothing has been pushed.

| | |
|---|---|
| Candidate build | commit `464430d` on branch `redesign/intervene-visual-transformation` |
| This report | the commit after it, documentation only |
| Base | `main` at `19e791c`, which is also `origin/main` |
| Size | 16 commits, 78 files, 6,820 insertions, 492 deletions |
| Branch upstream | none; the branch exists only in the local worktree |
| Status | awaiting visual acceptance |

## What the candidate contains

The full record is `docs/redesign-record.md`. In brief:

- Homepage: the circular intervention dial; a dependency circuit; the SEDI
  chain, which carries the dial's scenario and can set it; the evidence
  trace with an executive reading; the three engagements with a depth of
  examination on each.
- Services, sectors, about, verification, sample report, AGDA, methodology,
  five comparison pages and insights each have their own treatment.
- Fonts subset from 549 kB to 208 kB, pixel-identical to the originals.
- Email signature: link text inherits the message's text colour; the gold
  is the underline.

## Verification at `464430d`

| Check | Result |
|---|---|
| Production build | 34 pages |
| Unit tests | 234 passed |
| Chromium, desktop and mobile | 628 passed, 10 skipped |
| Firefox and WebKit, desktop and phone | 287 passed, 7 skipped |
| Type check, content check, private-path check | clean |
| axe, WCAG 2.2 AA: 33 routes, two themes, two widths, interactive states active | 132 of 132 clean |
| Overflow, console errors, failed requests: twelve pages, five widths, two themes | none |
| Lighthouse mobile | homepage 96; AGDA 98; methodology 98; services 98 |
| Lighthouse desktop, homepage | 100 |
| Lighthouse accessibility and best practices | 100 on each page run |

The skipped tests are skips that exist in the suite by design (for example
hover tests on touch projects). None was added to hide a failure.

## Outstanding limitations

Not done, and not claimed:

1. **VoiceOver.** No screen-reader session has been run. Behaviour is
   tested through roles, names and live regions only. Procedure:
   `docs/manual-test-procedures.md`, section 1.
2. **Mail clients.** The signature has not been tested in any mail client.
   One limit is known from automated tests: a rich-text editor in Chromium
   discards `color: inherit` on paste, so a pasted link takes the editor's
   own link colour, with the gold underline. A client that composes that
   way may show blue link text. Procedure: the same document, section 2.
   This should be checked before the new signature is used.
3. **Physical devices.** None used. Phone results are emulated viewports in
   Chromium and WebKit.

Known weaknesses in the design:

4. The gold underline on signature links is 1.98:1 against white. The link
   text meets contrast; the underline is a brand mark.
5. The dial and the chain are never on one screen. They are linked in both
   directions and share one scenario, but the connection is seen by
   scrolling.
6. The chain carries two vocabularies: "Waits on" for dependency and the
   window states for time.
7. The comparison pages share one ledger treatment.
8. `/services/` is long on a phone. Its exclusions are deliberately not
   folded.
9. Reading time on notes is an estimate at 230 words a minute.
10. Mobile Lighthouse performance on the homepage is 96, one point below
    its best in this work (97), since the added instruments.

## Material wording changes

Every change is listed, pass by pass, under "Published wording that
changed" in `docs/redesign-record.md`. The ones a reviewer should read:

- Homepage headline is three lines, "Can you / stop it / in time?", with
  the dial and its illustrative-model note.
- "Governance is an input. Intervention capability is the outcome." leads
  the problem section.
- `/services/` opens "Where to begin. Any of the three." and shows each
  fee and boundary there.
- Each engagement carries "Depth of examination" with "Covers ..." and
  "Outside it: ...", built from its published scope.
- The sample report's Intervene row reads "assumed by the source to
  propagate a halt if instructed. No duration is assessed for this stage."
- Two evidence links are marked "matched by description".
- `/agda/` gains "How a conclusion is reached." and no longer repeats the
  stage explorer.
- `/methodology/` gains "Four layers, kept apart."
- New labels on `/sectors/`, `/verify/` and `/insights/`.

Not changed anywhere: prices, scope, deliverables, exclusions, methodology
statements, verification claims, legal pages. The claims tests and the
offers parity test pass unaltered.

## Screenshots

Held outside the repository, in the session's working folder under
`deliverables/release-candidate/`:

- `full/light/` and `full/dark/`: twelve pages at 1440, 1180, 768, 390 and
  320 pixels.
- `dial-1000-dark.png`: the dial with its longest outcome word.
- `carry-390.png`, `carry-1440.png`: the chain header, phone and desktop.
- `comparison-ledgers/`: the five ledgers.
- `signature-page-light.png`: the signature on white and charcoal.

Earlier passes' before-and-after sets and two recordings are beside it.
These files are temporary. Copy what should be kept.

## Deployment procedure

Deployment is by push to `main`: `.github/workflows/deploy.yml` builds and
publishes to GitHub Pages. The repository is public. Nothing below has been
run.

Before release:

1. Review the local preview and accept it, or list changes.
2. Run the mail-client check (limitation 2) and decide whether the new
   signature treatment stands. If not, restore `src/lib/email-signature.ts`
   and the two signature test files from `f7a13c4` before going further.
3. Run the VoiceOver procedure, or accept it as outstanding.
4. Confirm `main` has not moved: `git fetch origin` then
   `git rev-parse origin/main` should print `19e791c...`. If it has moved,
   rebase the branch on it and re-run step 5.
5. In the worktree, on Node 24.22.1:
   `npm ci --ignore-scripts && npm run check-private-paths && npm run content-check && npm test && npm run typecheck && npm run build`
   then `npx playwright test` and
   `npx playwright test -c playwright-browsers.config.ts`.
6. Confirm nothing private is included: `docs/` holds this report, the
   design record and the manual procedures; `prototypes/` holds four
   sketches. Neither is part of the built site, but both become public in
   the repository. Remove any that should not be.

Release:

7. `git push -u origin redesign/intervene-visual-transformation`
8. Open a pull request into `main`. `content-checks.yml` runs on it.
9. Merge with a merge commit, so the release is one commit to revert.
10. `deploy.yml` runs on the merge and publishes. Watch it complete.

After release:

11. Load `https://intervene.uk/` and check: the dial plays once and
    settles; the scenario control on the chain changes the dial; an
    evidence question marks the trace; `/services/` shows the three fees;
    `/verify/` and `/sample-report/` load; the contact form page loads.
12. Check the appearance control in light and dark, and one page with
    JavaScript off.
13. `monitor.yml` runs hourly and will report a failure.

Rollback:

14. `git revert -m 1 <merge commit>` on `main` and push. `deploy.yml`
    republishes the previous site. The fonts return to the originals with
    it; nothing outside the repository changes in this release.

Not part of this release: DNS, GitHub Pages settings, the workflows
themselves, analytics configuration and the contact endpoint. None was
touched.
