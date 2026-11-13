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

## What is on the homepage now

| Component | Where | Purpose |
|---|---|---|
| `WindowDial` + `DialFace` + `lib/window-model.ts` + `lib/dial-geometry.ts` | `/` hero | The opening instrument. One turn of the dial is the window; the four stages run round it; time past the window runs on an inner ring. |
| `DialReading` | `/` problem section | Two fixed readings of the same dial: the chain on paper and under pressure. |
| `SediExplorer` (revised) | `/`, `/agda/`, `/methodology/`, `/style-guide/` | The four stages on one rail, open on Detect; every later stage is drawn as waiting. |
| `EvidenceTrace` + `lib/sample-report.ts` | `/` | The constructed sample as a trace: records, stage findings, conclusion. |
| `OfferLadder` | `/` | The three engagements as one framed comparison, each led by its question and fee. |
| `HeroWindow` | `/intervention-readiness/` | The linear on-paper and under-pressure figure. |

Retired, and in the branch history: `WindowLab`, `WindowRace`,
`AssessmentArtefact`, `OfferDepth`, `FindingChain`. The four standalone
sketches remain in `prototypes/`, outside the build.

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

## Second pass, after review against the references

The first pass organised the content; it did not have enough presence. Set
beside Linear, Vercel, Stripe, Palantir and Anduril, four weaknesses stood
out, and each was addressed on the homepage only.

1. **No dominant object.** Each reference puts one large, object-like
   demonstration directly under the headline. The scenario model moved into
   the hero as a dark instrument and replaced the thin two-row figure there.
2. **The model read as a chart with form controls.** It gained a time axis
   with ticks, the whole chain on one line above the stage rows, a playhead
   that crosses every row, a closed region that takes the warning tint only
   when the chain runs into it, and a large stated outcome.
3. **The SEDI stages were prose in four columns.** Opening a stage now shows
   the dependency itself: the rail is solid up to it, and every later stage
   is dashed, dimmed and labelled as waiting.
4. **The artefact was a row of tabs.** It is now one bounded report whose
   record strip states "Constructed illustration · Not issued · Not signed"
   in every state.

Also: two-tone headings (the second clause in a quieter tone), and the page
closes on the question, at display size, on the instrument's dark surface.

Three faults were caught by the existing motion tests during this pass and
fixed: the instrument's controls appearing after load moved the content
below it; playback changed the readout's height; and preset tabs could wrap
differently before and after the web font loaded. Controls now hold their
space from first paint, playback status shares the result's cell, and the
tabs sit in equal cells.

The dark instrument and closing band use the site's existing dark palette,
scoped to those two elements. They are the same in light and dark
appearance. No token was added or changed.

## Third pass, on review decisions

1. **The dark instrument and closing band stay**, as two contained elements
   inside the light theme. They do not set the site's appearance.
2. **The SEDI chain opens on Detect.** The dependency is drawn before any
   interaction: every later stage reads as waiting. This is the shared
   component, so `/agda/`, `/methodology/` and `/style-guide/` open on Detect
   too. Tests that assumed a closed first stage now use the second.
3. **The model is in the opening view.** From 1100px the headline and its
   support sit side by side, and inside the instrument the model sits on the
   left with the scenario, outcome and window test beside it. At 1440 by 900
   the scenarios, all four stages and the stated outcome are visible without
   scrolling; a test holds that.
4. **Playback starts on arrival**, not on scroll, wherever the model is on
   screen. On a phone the headline fills the opening view, so it starts when
   the model is reached. "Replay the scenario" sits in the instrument's top
   bar and "Move a stage to change the outcome" labels the sliders. With
   reduced motion nothing plays and the result is shown at once.
5. **The three engagements are one framed comparison.** Each column leads
   with the question it answers, then the name and the fee; what it includes
   runs down a rail, as the stages of the chain do. No animation was added.
   Fees moved from the foot of each column to its head and are stated once.

## Fourth pass: the race and the trace

Direction, as decided: prototype A (the race) for the intervention
experience and prototype C (the trace) for the evidence.

**The time model.** One straight axis, linear in time. The window and the
response share it, so the boundary is one line through both. Time does not
stop or reset at the boundary; the response continues past it into the
region marked irreversible. A chain that ends exactly on the boundary ends
exactly at the mark and is not too late, which is the scenario model's own
rule (only total greater than window is too late). The statement and its
tests are in `lib/race-geometry.ts` and `tests/unit/race-geometry.test.ts`.

**What the scene distinguishes.** Time available is the window bar. Time
consumed is the dark part behind the present moment. Time remaining is the
lit part ahead of it. Time beyond the window is the red part of the
response. The same four quantities are stated as percentages of the window,
never as durations.

**Stage states.** Pending is a dashed outline, active is the stage filling,
completed is filled. A stage is marked completed only when its whole
duration has elapsed, not when its animation ends; a unit test holds that.

**Playback.** One run on arrival when the stage name is in view, then
nothing by itself. Pause, resume and replay are in the scene. While time
runs the outcome is withheld and the window is shown closed only once time
has reached the boundary. With reduced motion nothing plays and the result
is shown at once.

**Telling apart from diagnostics.** The scene shows the scenario, the stage,
the bars and the outcome. Stage timings and the window test are in a
drawer, "Open the diagnostic model".

**Evidence links.** A record is tied to a stage only where the sample
supports it, and the supporting wording is quoted beside the record:

| Record | Tied to | Basis in the sample |
|---|---|---|
| E-02 | Detect | Its register entry calls it "a source for detection timing". |
| E-01 | Detect | Control C-01 cites "timing telemetry from a 2024 outage post-mortem" for detection. |
| E-04 | Escalate | Control C-03, escalation to MRC, cites "one tabletop in 2024-Q4". |
| E-08 | Decide | Its register entry names the quorum; Decide is the time to obtain it. |
| E-12 | none | It concerns halt authority (C-04); the sample ties it to no single stage. |
| E-06 | none | It concerns the audit trail (C-06), not a stage timing. |

These are readings of a constructed example, not assessment findings, and
the first four should be confirmed before publication. Intervals stay as
text; the "not to scale and not added together" footnote is unchanged.

**Two existing tests caught real faults** during this pass, both fixed: the
sentence "not an issued assessment or a verified outcome" had dropped off
the page, and a screen-reader-only sentence was measuring outside the
viewport.

**Unresolved question for the methodology owner.** The homepage finding
gives Intervene as "Not assessed", while `/sample-report/` gives about six
minutes for the same stage. Both predate this work and both are preserved.

## Fifth pass: lighter and plainer

The fourth pass was rejected as too heavy and not clear enough in three
places: the opening scene, the evidence trace and the engagements.

- **Scene.** It left its dark full-bleed surface for the page's own, in the
  page's own tokens, so it follows light and dark appearance like everything
  else. The outcome dropped from display size to heading size, in ink, with
  a small mark carrying the state. Red is now only the part of the response
  that falls after the window. The bars are labelled for what they are,
  "Time available" and "Time taken", with "Signal" and "Window closes" on the
  axis, and one sentence states the premise.
- **Trace.** The dark conclusion block and the black decisive stage became
  outlined sheets with a heavier rule. A sentence says how to read it, the
  three columns are headed, and arrowheads give the direction of support.
- **Engagements.** The black blocks became pale cells with a solid top rule
  where a level is examined and a dashed one, reading "Not examined", where
  it is not.

The dark closing band is unchanged. Layout, model, tests and evidence links
are unchanged.

New wording in this pass: "A response has four stages. It has to finish
before the window closes."; "Time available"; "Time taken"; "Signal";
"Window closes"; "Window used up"; "Too late to prevent harm" (replacing
"Irreversible"); "Read from left to right. Each record supports a finding
about one stage, and the four findings lead to the conclusion."; "What each
stage takes, against a window of about six hours"; "Not examined".

## Sixth pass: the dial

Prototype B, the dial, was the direction selected in the brief. The fourth
and fifth passes built the horizontal timeline instead, following a later
one-line instruction; that was reversed on review and the dial restored.

**The time model.** One turn of the outer ring is the intervention window,
and angle is linear in time. Time starts at twelve o'clock and runs
clockwise, so twelve o'clock is both the signal and, one turn later, the
moment the window closes. Time does not reset there: anything after it is
drawn on a separate inner ring at the same rate. A chain that ends exactly
on the boundary ends at twelve o'clock on the outer ring, draws nothing on
the inner one and is not too late, which is the scenario model's own rule.
The inner ring holds one further window; a longer chain is clamped there and
the "Beyond the window" figure still reports the true amount. Stated and
tested in `lib/dial-geometry.ts` and `tests/unit/dial-geometry.test.ts`.

**What the dial distinguishes.** Time available is the whole outer ring.
Time consumed is the part drawn. Time remaining is the part left faint.
Time beyond the window is the inner ring. The same quantities are stated as
percentages of the window, never as durations. Major ticks are units of the
model, so the scale is redrawn when the window is tested shorter or longer.

**Stages.** Each name is set along its own arc. Pending, active and
completed are shown on the arc and in words in the list beside it; a stage
is completed only once its whole duration has elapsed. Picking a stage in
the list picks out its arc.

**Composition around the dial.** The problem section sets two readings of
the same dial side by side. The linear figure it replaced stays on the
pillar page. The engagement section went back to the framed comparison of
the third pass, at the owner's request. Each section ends with one line, in
the form of the visitor's next question, that leads to the next section;
the engagement section ends in the contact action.

**A decision that reverses an existing rule on one page.** On a phone the
homepage now runs question, one action, dial, stage list, then the
supporting copy. An existing test required supporting copy before the
action on every hero; the homepage is now excepted from it.

**Faults caught by tests in this pass, and fixed.** Stage text was dimmed
to half strength while the dial played, which failed contrast. At the
slider maximum against the shortest window, a stage can start more than a
full window late and has no arc; placing its name crashed. Both have tests.

New wording in this pass: "Window closes" and "Window closed" above the
dial; the centre lines "Window closed during …", "Inside the window" and
"Inside the window, narrowly"; stage states "Pending", "Active",
"Completed", "Window closes here", "After the window"; "Adjust the model";
the dial's note ("One turn of the dial is the intervention window; time past
it runs on the inner ring."); the readings' titles "On paper" and "Under
pressure" with their figures; the readings' note; and the three next-step
lines "How is that assessed?", "What does an assessment produce?" and
"Which engagement fits your system?".

## Published wording that changed

Prices, offer names, boundaries, the price qualifier, the availability
statement, legal pages and every verification claim are unchanged.

**Added in the fourth pass**

- Scene: "Illustrative scenario", "Window", "Response", "Window open",
  "Irreversible", "Now", "Pause", "Resume", "Replay", "Window consumed",
  "Remaining", "Beyond the window", "Open the diagnostic model", "Stage
  timings and the window test", "Your own timings". While a stage runs it is
  captioned with the methodology's own phrase for it ("Recognise the need to
  act", "Reach decision authority", "Make the decision", "Put it into
  effect").
- Evidence: the heading "A verdict. Traced to its evidence."; "Records
  examined"; "Stage findings, each against a window of about six hours";
  "No record examined. No duration is assessed for this stage."; "Records
  the sample ties to no single stage"; "What it supports, and what remains
  open"; "Why it is tied to …"; and the six basis sentences in the table
  above.
- Engagements: the heading "Three questions. Three depths of examination.";
  three level names and descriptions restating `lib/offers.ts` ("Authority",
  "Evidence", "Timing and verdict"); "Scope and what you receive".

**Removed from the homepage in the fourth pass** (still published elsewhere
or in history)

- The earlier instrument's preset tabs, "The chain, end to end", "Signal",
  "Window closes", "Move a stage to change the outcome".
- The artefact's scope table, remediation priorities and the list of what a
  signature check establishes. They remain on `/sample-report/` and
  `/verify/`.
- The eight-row engagement comparison. Each engagement's deliverables now
  open beneath it, taken from `lib/offers.ts` unchanged.

**Added earlier**

- Pillar-page figure: "On paper", "Under pressure", "Window closes", and the
  caption "Conceptual illustration. Positions show order, not measured
  durations."
- Scenario model: six preset names; "The chain, end to end"; "Signal",
  "Window closes", "Irreversible"; "Replay the scenario"; "Move a stage to
  change the outcome"; the outcome sentences;
  and the note
  "Illustrative model. Relative units, not measured durations, and not an
  assessment result. An assessment sets the window from your own records."
  Four preset descriptions reuse the existing stage-failure sentences.
- SEDI stages, a new "Depends on" line each (all four pages that show them):
  - Detect: "Starts the chain. Every later stage begins after it."
  - Escalate: "An actionable signal from Detect."
  - Decide: "The signal reaching a person with authority to act."
  - Intervene: "An authorised decision, and a mechanism that takes effect."
- SEDI instruction, now "Select a stage to see what it depends on and what
  waits on it."
- SEDI stages, shown only on stages after the open one: "Waits on Detect",
  "Waits on Escalate", "Waits on Decide".
- Artefact record strip: "Intervention Readiness verdict · CRED-MOD-04" and
  "Not issued · Not signed", both restating the sample report's cover.
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
