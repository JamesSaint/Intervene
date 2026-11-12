# Visual transformation: record of decisions

Branch `redesign/intervene-visual-transformation`, cut from `main` at `19e791c`.
Nothing on this branch is published. This file records what was decided and
why, what must keep working, and which published wording changed.

## Direction

Time is the axis. Intervention is a sequence of stages spending time against
a window that closes, so every new figure is drawn on the same grammar:

- a horizontal rail, with stages as nodes on it;
- a dashed boundary where the window closes, and a hatched region beyond it;
- a filled node for the intervention itself, and the site's existing square
  mark when it lands late;
- ink for what is within the window, `--warn` for what falls after it.

No new colours, fonts or dependencies. The existing tokens, Montserrat and
IBM Plex Mono carry everything. Gold remains a structural signal only.
Section kickers and stage numbering were removed from the homepage: the
heading carries the section.

## What was built

| Component | Where | Purpose |
|---|---|---|
| `HeroWindow` | `/`, `/intervention-readiness/` | The proposition as one figure: the same chain on paper and under pressure, against one window. |
| `WindowLab` + `lib/window-model.ts` | `/` | The scenario model. Six presets, a slider per stage, and the window tested 25% shorter and longer. |
| `SediExplorer` (revised) | `/`, `/agda/`, `/methodology/`, `/style-guide/` | The four stages on one continuous rail; each opens in place and now states what it depends on. |
| `AssessmentArtefact` + `lib/sample-report.ts` | `/` | The constructed sample as an explorable output: scope, evidence register, SEDI findings, conclusion, verification. |
| `OfferLadder` | `/` | The three engagements as one comparison, read across. |

## Decisions worth knowing

1. **The scenario model is not the engine.** It uses relative units and its
   own outcome words (In time, Narrow margin, Too late), never the three
   verdict states. A unit test fails if a verdict state, a measured duration
   or the word "verdict" enters its copy. Its note is always visible.
2. **A narrow margin is defined by the published sensitivity test**: the
   chain completes, but would not if the window were 25% shorter.
3. **Qualifications stay outside interactions.** The artefact's "Constructed
   illustration" status sits above its tabs. The issuance, signed-record and
   integrity notes sit below the artefact, visible in every state. An
   existing claims test caught an earlier draft that had moved the
   signed-record note into a tab; it was moved back.
4. **Everything reads without JavaScript.** The model renders its opening
   scenario on the server; the artefact shows all five parts in order; the
   offer comparison is three complete lists.
5. **The offer table is presentation only.** Wide screens align three lists
   against one label column with subgrid. Each list keeps its own labels and
   an "included" or "not included" suffix for assistive technology.
6. **The two-outcome window widget left the homepage** because the scenario
   model covers the same ground. It is unchanged on `/methodology/` and
   `/style-guide/`, and its motion tests now run against `/methodology/`.
7. **The sample data has one source.** `/sample-report/` and the homepage
   artefact both read `lib/sample-report.ts`.
8. **Build and deployment configuration are unchanged.** Inlining
   stylesheets was tried for Lighthouse and reverted: two or three points
   for more than double the HTML.

## Published wording that changed

Prices, offer names, boundaries, the price qualifier, the availability
statement, legal pages and every verification claim are unchanged.

**Added**

- Hero figure: "On paper", "Under pressure", "Window closes", and the caption
  "Conceptual illustration. Positions show order, not measured durations."
- Scenario model: the introduction "Every stage of a response spends time.
  Change any of them and see whether the intervention still lands before the
  window closes."; six preset names; the outcome sentences; and the note
  "Illustrative model. Relative units, not measured durations, and not an
  assessment result. An assessment sets the window from your own records."
  Four preset descriptions reuse the existing stage-failure sentences.
- SEDI stages, a new "Depends on" line each (all four pages that show them):
  - Detect: "Starts the chain. Every later stage begins after it."
  - Escalate: "An actionable signal from Detect."
  - Decide: "The signal reaching a person with authority to act."
  - Intervene: "An authorised decision, and a mechanism that takes effect."
- Homepage artefact, brought across from `/sample-report/`: the system
  specification, the evidence register, the illustrative conclusion
  ("After impact", marked illustrative, not issued, not signed), the four
  proposed remediation priorities with their caveat, and a short list of
  what a signature check does and does not establish, taken from `/verify/`.
- Offer comparison: eight capability rows restating `lib/offers.ts`.

**Removed from the homepage** (still published elsewhere)

- Kickers: "The problem", "The method", "The evidence", "Where should we
  begin?", and "Route A/B/C".
- The scenario sentence "A macro shock coincides with model drift and creates
  a need to stop or redirect the affected pathway." The scenario remains in
  the artefact's scope as "Macro shock + model drift".
- The long form of the decision the finding supports, replaced by the sample
  report's own question.
- Per offer: the "Appropriate when" line, the "What you receive" list (now the
  comparison rows) and "Choose by the intervention question and available
  evidence."

## Regression checklist

Automated unless marked manual.

- [x] Production build: 34 pages.
- [x] Unit tests, including the new model tests.
- [x] Browser tests, desktop and mobile projects.
- [x] Type check: no errors.
- [x] Content check and private-path check.
- [x] Navigation, takeover menu, footer, quick navigation.
- [x] Appearance: light, dark, system; no-JavaScript fallback.
- [x] Contact form, snapshot form, consent banner and analytics gating.
- [x] Offers: names, prices, qualifier and availability on `/` and `/services/`.
- [x] Claims: verdict attribution, signed-record condition, no retired offer.
- [x] SEDI stages: keyboard, no JavaScript, disclosure motion.
- [x] Two-outcome window on `/methodology/`: keyboard, replay, reduced motion.
- [x] Scenario model: presets, sliders, window test, playback, reduced motion,
      no JavaScript, drawn chain agrees with stated outcome.
- [x] Artefact: tab pattern, status always visible, all parts without script.
- [x] Offer comparison: inclusion counts, labels, prices, links.
- [x] No horizontal overflow from 320px to 1440px.
- [x] axe (WCAG 2.2 AA) on the changed pages, both themes, two widths, with
      every artefact part and SEDI stage open.
- [x] Console errors and failed requests: none across 33 pages, five widths,
      both themes.
- [ ] Manual: Safari and Firefox. Only Chromium was exercised.
- [ ] Manual: a screen reader pass on the scenario model and the artefact.
- [ ] Manual: print styles for the new components.
