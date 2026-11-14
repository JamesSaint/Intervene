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
| `WindowDial` + `DialFace` + `lib/window-model.ts` + `lib/dial-geometry.ts` | `/` hero | The opening instrument. One turn of the dial is the window; the four stages run round it; time past the window runs on a narrow inner ring. |
| `SeriesCircuit` | `/` problem section | Three conditions in series between a signal and an intervention, one of them open. |
| `SediExplorer` (revised) | `/`, `/agda/`, `/methodology/`, `/style-guide/` | The four stages on one rail, each stating what it needs from the one before; open on Detect. |
| `EvidenceTrace` + `lib/sample-report.ts` | `/` | The constructed sample as a trace: records, stage findings, conclusion. |
| `OfferIntro` + `OfferLadder` | `/` | The three engagements in nested frames, by question, scope and fee, with the full comparison as a disclosure beneath. |
| `HeroWindow` | `/intervention-readiness/` | The linear on-paper and under-pressure figure. |

Retired, and in the branch history: `WindowLab`, `WindowRace`,
`AssessmentArtefact`, `OfferDepth`, `DialReading`, `FindingChain`. The four
standalone sketches remain in `prototypes/`, outside the build.

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

## Seventh pass: refinement with the dial approved

- **Hero.** The question is set on three lines at display size and holds the
  left of the view; the dial holds the right. The stage list and the three
  figures moved out of the left column into a console row beneath both.
  The site's heading tracking is kept, as an existing test requires.
- **Dial weights.** The window ring is the wide one (30 units at radius 238
  of 300). The overrun ring is narrow and sits close inside it (12 units at
  radius 204), so time beyond the window reads as an overrun of the same
  track and not as a second dial. Stage names are set on the window ring
  only. Geometry and tests are otherwise unchanged.
- **Problem section.** The two extra dials were replaced by a series
  circuit: three conditions between a signal and an intervention, each
  pairing a documented control with the question that decides it, with
  authority drawn open and everything after it carrying nothing.
- **SEDI.** Each stage now states on the chain what it needs from the one
  before, at heading weight, with an arrowhead on each hand-off. The detail
  behind each stage is unchanged.
- **Evidence.** Larger headline, larger stage values and conclusion, and
  the decisive stage is the one filled block.
- **Engagements.** Three nested frames introduce them by question, scope
  and fee; the Review's frame holds the Authority Check and the
  Assessment's holds both. The full comparison table is a disclosure
  beneath, unchanged.
- **Phone.** Stage states sit two by two under the dial; the circuit runs
  down a rail; SEDI questions and stage notes wait behind their stage; the
  engagement frames widen down the page.

New wording in this pass: "On paper" with "Monitoring is documented.",
"A risk owner is named." and "A halt procedure is written."; the states
"Holds", "Open under pressure" and "Holds, but nothing reaches it";
"Signal" and "Intervention not reached"; the circuit's caption; the four
SEDI lines "Starts the chain", "Needs an actionable signal", "Needs the
signal to reach someone with authority" and "Needs an authorised decision
and a working mechanism"; the heading "Three questions. One named system.";
and "Compare the three engagements in full".

## Eighth pass: site-wide

The homepage was approved as the foundation. This pass carries its system
to the other 33 pages without repeating its components on each.

**Two conditions set before the pass, both met.**

- *Engagement frames.* The nested frames show scope only. The caption now
  reads "Three separate engagements. Each can be commissioned on its own",
  every frame carries "Commissioned on its own", and inclusion is phrased as
  scope ("Scope includes: everything in the Review."). A test fails if the
  section acquires language of sequence or upgrade.
- *Circuit.* It is labelled "Illustration" above the figure, before it is
  read, with "A general argument, not a finding about any organisation", and
  its caption ends "The open condition shown here is an example, not an
  observed result."

**The shared layer** (`tokens.css`, `typography.css`, `global.css`), which
reaches every page:

- Larger heading scale: h1 to 88px and h2 to 60px at their upper bounds.
- Two-tone headings: the `<em>` clause of an h1 or h2 is set in the quieter
  tone at the same weight. The markup already existed on most pages.
- Opening composition: where a hero is a heading and a lede, the heading
  holds the left and the lede sits low on the right from 1100px.
- `.step-link` and `.mark-list` as shared patterns.

**Page treatments, one per purpose.**

| Page | Treatment |
|---|---|
| `/agda/` | The three verdict states as three readings of the dial, marked as a specimen of the format and not a result. The SEDI chain follows. |
| `/intervention-readiness/vs-*` (5) | The two core questions, side by side at heading size, taken word for word from each page's own comparison table. |
| `/intervention-readiness/halt-authority/`, `/intervention-chain/`, `/reversibility-window/` | A four-stage rail showing where the term sits in the chain. `/human-oversight/` has none, because the methodology places it at no single stage. |
| `/sample-report/` | The evidence trace leads "The chain breaks at authority"; every existing table remains beneath. |
| `/verify/` | Covered, not covered and not established are marked with solid and dashed marks as well as in words. |
| `/methodology/`, `/style-guide/` | The revised SEDI chain. |
| `/intervention-readiness/` | The linear on-paper and under-pressure figure, from an earlier pass. |
| All others | The shared layer only: `/services/`, `/sectors/`, `/about/`, `/contact/`, `/glossary/`, `/insights/` and its three notes, `/network/`, `/readiness-snapshot/`, the three legal pages, `/signature/`, `/category-map/`, `/human-oversight/`, `/method/`, 404. |

No content, price, limitation, verification claim or legal text was
changed on any of these pages. The verdict-state names and descriptions on
`/agda/` are the previous component's, unchanged.

**A test changed in principle.** "Desktop headings fill their container" now
allows the heading to fill the left column of the two-column opening.

**Performance, investigated.** Mobile Lighthouse is 86 to 87; desktop is 99.
The largest paint is the headline, and its render is held back about 3.2
seconds on the simulated slow connection by two preloaded Montserrat files
of about 100 kB each and three render-blocking stylesheets. The fonts are
not subset. Subsetting the two preloaded weights to the characters the site
uses is the fix most likely to clear 90; it was not done here because it
replaces brand font files and needs a tool that is not installed. Inlining
stylesheets was tried earlier and gained two or three points for double the
HTML. The new components add no blocking time and no layout shift.

**Screen reader.** No screen reader was run. The accessibility tree of the
dial, circuit, SEDI chain, trace and engagements was read out and reviewed
instead: names, roles, order and states are coherent, and the dial's figure
is named by its outcome sentence. Two things a listener will notice: the
dial's outcome sentence is reached twice (as the figure's name and as the
paragraph that names it), and decorative arrows are excluded from speech
only in browsers that support alternative text on generated content.

New wording in this pass: "Three separate engagements. Each can be
commissioned on its own"; "Commissioned on its own"; "The narrowest scope of
the three."; "Scope includes: …"; the circuit's status line and the last
sentence of its caption; "Specimen" and "The format of a verdict, drawn with
illustrative timings. Not a result."; "{discipline} asks" and "Intervention
Readiness asks"; and the three chain-position captions.

## Ninth pass: design excellence review

A completion pass. The approved direction is unchanged: the dial, the hero
composition, the monochrome identity, the circuit, the SEDI hand-off, the
evidence trace and the three independent engagements.

### Improvement register

Ranked by visitor importance, weakness before this pass and likely benefit.
"Done" means built, inspected at 1440, 768, 390 and 320 pixels in light and
dark, and covered by a test.

| # | Page | Weakness found | Change | Status |
|---|------|----------------|--------|--------|
| 1 | `/services/` | The commercial page opened with a compact fork that showed no fee and no boundary; a buyer had to read three long sheets to compare. | Opens with the framed three-engagement introduction: question, scope, fee, boundary and "Commissioned on its own" for each, linking to its sheet. The sheets, scope, sequence and FAQ are unchanged. | Done |
| 2 | Site-wide performance | Mobile Lighthouse 86 to 87. Two preloaded fonts of about 100 kB each delayed the headline. | Fonts subset (see below). Mobile 97, desktop 100. | Done |
| 3 | `/verify/` | The distinction that matters most, integrity against truth, was two plain lists in a reading column. | The boundary is drawn: a solid frame holds what the signature commits to and what a successful check establishes; what lies outside sits on open ground with a broken edge. Same lists, same words. | Done |
| 4 | `/sample-report/` | A long reference document with no stated order of reading. | A four-step reading path on the cover: conclusion, findings, evidence, qualifications. All sections and tables remain. | Done |
| 5 | `/sectors/` | Four identical text rows; nothing sector-specific was visible. | Each sector pairs "What is expected" on a solid line with "Where it can fail" on a broken one, with its regimes as tags. Both sentences are the page's existing ones. | Done |
| 6 | `/about/` | The founding statement was set as an italic aside; sector tiers and the practice statements were undifferentiated grids. | The statement leads the narrative at display size. Sector tiers are marked by firmness: solid, hairline, broken. The four practice statements sit on one line that closes at "Stops at the finding." | Done |
| 7 | Homepage evidence trace | Two of four record-to-stage links rested on a match by description, drawn the same as stated links. | Graded and marked (see below). | Done |
| 8 | Homepage and sample report | "Not assessed" on one page, "~6 min" on the other, for the same stage. | Reconciled from the repository history (see below). | Done |
| 9 | Dial | The outcome sentence was announced twice to a screen reader. | The figure has a fixed name; the outcome is one live sentence. | Done |
| 10 | `/services/` on a phone | Three full sheets, the scope lists and nine questions make a very long page. | Not changed. Collapsing sheet rows would hide exclusions that the claims tests, rightly, require to be visible. Needs a decision on which rows may be folded. | Open |
| 11 | Comparison pages | Already lead with the two core questions drawn side by side (eighth pass). | Reviewed, no change. A stronger visual would need claims about other disciplines that the pages do not make. | Reviewed |
| 12 | Insights, glossary, legal, contact, network | Editorial pages on the shared type system. | Reviewed, no change in this pass. | Open |

### The "Not assessed" and six-minute figures

Source: commit `b1228fe` (16 September 2026, "Acceptance pass: fourth stage
not assessed"). That commit set the homepage Intervene stage to "Not
assessed", carried "the source's six-minute propagation assumption" in the
note, and recorded that "no stage failure is implied". The sample report was
not updated in the same commit and kept "~6 min ... to propagate a halt if
instructed". Both figures therefore describe the same thing: the time the
source assumes a halt takes to propagate, if one is instructed. Nothing in
`internal/` says more. The sample report's Intervene row now says "assumed by
the source to propagate a halt if instructed. No duration is assessed for
this stage." No explanation has been added beyond what that commit records.

### Evidence-to-stage links

The sample has no record-to-stage table, so each link was checked against
the register and the control descriptions.

- E-02 to Detect: stated. Its register entry calls it "a source for
  detection timing".
- E-08 to Decide: stated. Its register entry concerns whether "the required
  quorum can be reached in time", which is what Decide measures.
- E-01 to Detect and E-04 to Escalate: matched, not stated. Controls C-01
  and C-03 describe a record of the same kind and date but cite no
  identifier. These two are now drawn with a dashed line, tagged "matched by
  description", and each says "It does not cite this record by its
  identifier."
- E-12 and E-06 stay unattached. Intervene has no record.

`tests/unit/evidence-links.test.ts` holds each grade to the wording that
supports it.

### Fonts

The seven woff2 files were subset to Basic Latin, Latin-1, Latin Extended-A
and the punctuation, arrows and symbols the site uses: 549 kB to 208 kB in
total, and the two preloaded files from 198 kB to 71 kB. The complete
originals are in the history at commit `6418902`. `scripts/subset-fonts.py`
reproduces the subsets and fails unless every check passes.

Verified: of the 103 distinct characters in the built site, every one the
originals could draw is still drawn (three, ↻ ♲ ✓, were never in Montserrat
and fall back as before); advance widths, vertical metrics and outlines are
identical for every kept glyph; kerning and all applicable layout features
are kept. Sixteen full-page screenshots (eight pages, two widths) are
pixel-identical before and after. A first attempt that dropped glyph names
rendered differently below 20 pixels on macOS and was rejected; names are
kept. Text typed into the contact form in a script outside these ranges will
use the system font.

Stylesheet inlining was assessed in the seventh pass (two to three points
for a 2.5 times larger document) and is not adopted; with the lighter fonts
it is not needed.

### Verification at the end of this pass

- 222 unit tests; 543 Chromium browser tests (9 skipped); 189 Firefox and
  WebKit tests (6 skipped); type check, content check and private-path
  check clean.
- Lighthouse, homepage: mobile 97 on three runs (LCP 2.4 s, CLS 0), desktop
  100. `/services/` mobile 98. Accessibility, best practices and SEO 100.
- axe, WCAG 2.2 AA, 33 routes, two themes, two widths: 128 of 132 clean. The
  four are one page, `/signature/`, whose embedded email-signature preview
  has link colours below contrast. That page was not changed on this branch.
- No horizontal overflow, console error or failed request on the reworked
  pages at 1440, 768, 390 and 320 pixels in either theme.

### Not done, stated plainly

- No VoiceOver or other screen-reader session was run. The accessible-name
  and live-region behaviour is tested through the accessibility tree only.
- No physical device was used. Phone results are emulated viewports in
  Chromium and WebKit.

## Tenth pass: one scenario, carried

The brief for this pass asked for a visible step in design quality, not
another refinement. The approved direction is unchanged. Nothing replaces the
dial.

### Audit: the five opportunities, ranked

| # | Opportunity | Visitor importance | Weakness before | Gain in understanding | Commercial relevance | Complexity | Status |
|---|-------------|--------------------|-----------------|-----------------------|----------------------|------------|--------|
| 1 | The homepage instruments did not know about each other. The dial showed a scenario; the SEDI chain beneath it started again from nothing. | High | High | High | Medium | Medium | Done |
| 2 | The evidence trace required reading every record before its point was clear. | High | Medium | High | High | Medium | Done |
| 3 | The engagements were compared by reading three columns of prose or opening a table. | High | Medium | Medium | High | Low | Done |
| 4 | The dial could be watched and configured but not questioned: a stage could not be asked what it cost. | High | Medium | Medium | Low | Low | Done |
| 5 | Page-level identity for AGDA, methodology, comparison and insights pages. | Medium | Medium | Medium | Medium | High | Not done in this pass |

### Creative architecture

One idea connects the instruments: the intervention window is a single
quantity, set once on the dial, and everything further down the page is read
against it.

- The dial sets the scenario and the window.
- The SEDI chain shows the same scenario as dependency: what each stage
  needs, its share of the window, and the point at which the window closes.
- The evidence trace shows what an assessment would hold behind such a
  finding. It is the constructed sample and is not driven by the dial: the
  model is illustrative, the sample is a fixed document, and joining them
  would imply the sample changes with a slider.
- The engagements show how far each one goes into that same chain.

The shared marks: a solid bar or line is time used or a thing established; a
broken line is something not established; the warm red is only ever the
window closing or time beyond it; a ring marks what a question rests on.

### What was built

**The scenario is carried into the SEDI chain** (`src/lib/scenario-chain.ts`,
`SediExplorer.astro` with `scenario`). The dial announces each settled
scenario (`intervene:scenario`); the chain redraws from the same model. Each
stage carries a bar whose length is its share of the window, the stage's
state (Inside the window, Window closes here, After the window) and, where
the window closes part-way through a stage, the bar changes colour at that
point and the boundary is marked on it. The line above the chain names the
scenario and repeats the dial's own outcome sentence. The first paint is the
default scenario, rendered on the server. Other pages that use the chain
(`/agda/`, `/methodology/`) carry no scenario, because they have no dial.
These are interface states of the illustrative model, labelled
"illustrative", and are not assessment states or verdicts.

Each failing preset is paired with one stage by wording, not inference: the
preset's sentence is that stage's "Possible failure" sentence, word for word
(tested).

**An executive reading of the evidence** (`EvidenceTrace.astro`). Four
questions sit above the trace: what was examined, what the example
establishes, what remains uncertain, why the conclusion follows. Each answer
is assembled from the sample's own values and counts, so it cannot say more
than the trace. Pressing a question rings the stages and records its answer
rests on; uncertain items take a broken ring. Nothing is hidden or dimmed.
The same component serves `/sample-report/`.

**Depth of examination on each engagement** (`OfferIntro.astro`). A
five-segment gauge: authority to halt, evidence for each step, timings in
your records, a window set from your records, the verdict. The Check covers
one, the Review three, the Assessment five. Each item is taken from the
engagement's published `examined` line, and the Review's published exclusion
names the last two as outside it. "Commissioned on its own" stays on every
frame. Shown on `/` and `/services/`.

**The dial can be questioned.** Pointing at or pressing a stage, on the list
or on the ring itself, reads that stage's share of the window in the centre.
The stage under the pointer is found from its angle and ring through the
geometry that draws the arcs, because a browser's hit test does not follow a
dashed stroke.

### Motion

No library was added. The rules already in `tokens.css` are the system:
state changes 160 ms, disclosures 220 ms, a value changing size (a share
bar) 360 ms, each on the standard ease; reduced motion cuts all of these to
80 ms or none and the dial shows its result at once. Only the dial plays
time, once, and never loops. Nothing introduced in this pass changes the
height of the page when it changes state (tested for the chain).

### Signature page

The page's own contrast failure is fixed: the caption label on the white
preview now takes a colour that reads on white in either site appearance.
Three flags remain inside the light preview: the email signature's bronze
links (`#c9b694`) on white. That is the emailed artefact itself, not the
page, and three existing tests assert that colour in both appearances
because a pasted signature carries one inline colour and no stylesheet.
Changing it changes the signature that is sent, so it is left for a decision.

### Verification

- 228 unit tests; 557 Chromium browser tests (9 skipped); 210 Firefox and
  WebKit tests (6 skipped); type check, content check and private-path check
  clean. No test was removed or loosened.
- Lighthouse, homepage: mobile 96 on two runs (LCP 2.5 s, CLS 0), desktop
  100. Accessibility, best practices and SEO 100.
- axe, WCAG 2.2 AA, 33 routes, two themes, two widths, with disclosures
  open, a lens pressed and a dial stage picked: 128 of 132 clean; the four
  are the email signature links described above.
- No horizontal overflow, console error or failed request on `/`,
  `/services/`, `/sample-report/`, `/agda/`, `/methodology/` and
  `/signature/` at 1440, 768, 390 and 320 pixels in either theme.

### What remains imperfect

- The link between the dial and the chain is only visible to someone who
  scrolls back and forth, or changes the scenario and then scrolls. On one
  screen the two are never seen together.
- The AGDA, methodology, comparison and insights pages did not receive
  purpose-built treatments in this pass.
- The chain's "Waits on" labels (dependency) and its window states (time)
  are two vocabularies on one component. They are both true, but a reader
  has to hold both.
- Below 1100 pixels the boundary on the chain loses its label and relies on
  the stage's own line.
- `/services/` on a phone is still long.
- No screen-reader session and no physical device. Results are from the
  accessibility tree and emulated viewports.

## Eleventh pass: completing the fifth objective

The tenth pass left one objective undone: purpose-built treatments for the
AGDA, methodology, comparison and insights pages. This pass does that, and
answers five points raised on the tenth.

### Page treatments

| Page | Before | Now | Judgement |
|------|--------|-----|-----------|
| `/agda/` | Three text subsections, then the verdict specimen. Nothing showed how scope, evidence, the chain and the conclusion relate. | `AssessmentModel.astro`: one figure, "How a conclusion is reached". Scope, evidence, the chain read against the available time, and one of three states. The available time is marked in the accent where it is set and again where the chain meets it. No stage is marked as failing and no state is selected. | Improves understanding and hierarchy. Not interactive beyond its links, by choice: it is a statement of dependence, not a model to operate. |
| `/methodology/` | A long technical page with no executive entry. | `MethodLayers.astro`: "Four layers, kept apart". Operational dependencies, timing, evidence and conclusion, each with a small diagram, the page's own statement and a link to its section. Captioned "Diagrams of the method, not measurements." | Gives an executive reading without removing any detail. |
| Five comparison pages | The two core questions, then a three-column table. | The same table drawn as a split ledger on wide screens: the adjacent discipline to the left of a spine, Intervention Readiness to the right, the thing compared on the spine. Explicit table roles keep it a table to assistive technology. Below 761 pixels the existing labelled stack is unchanged. | Presentation only. No cell was added, removed or reworded, so no difference is manufactured. |
| `/insights/` and three notes | A flat list; articles in grey body text with no way to the next note. | The index leads with the latest note at headline scale and lists the earlier ones by date. Notes take a larger headline and standfirst, body text in the ink colour, a larger opening paragraph, pull quotes at display weight, a reading time, and links to the notes either side. One source for titles, dates and order (`src/lib/insights.ts`). | Editorial only. No diagram, animation or interaction was added to a reading page (tested). |

### The dial and the chain

The chain now names its source and can set it. Its header reads "Carried
from the dial · illustrative", carries a scenario control and a link back to
the dial; the dial carries a link down, "This scenario is carried into the
chain below". Choosing a scenario on the chain asks the dial to take it, so
there is one scenario on the page and the dial owns it. The dial is not
duplicated and nothing is sticky.

### Timing semantics

Five quantities are now kept apart, in the model
(`src/lib/scenario-chain.ts`), on screen and in the text a screen reader
meets:

| Quantity | Where | Wording |
|----------|-------|---------|
| Stage duration | Each stage; dial centre when a stage is picked | "Takes 50% of the window" |
| Cumulative elapsed time | Each stage | "Complete at 58% elapsed" |
| Available window | The line on every track; one turn of the dial | "Window closes" |
| Remaining time | Chain header; dial meter | "Window remaining 0%" |
| Time beyond the window | Chain header; dial meter | "Beyond the window 8%" |

Each stage's track is on one scale: the window, or the whole chain when it
runs longer. The pale part is time already elapsed, the solid part is the
stage, and the line is where the window closes, at the same place on every
track. Only the part of a stage that falls after the line is drawn in the
warning colour. Percentages above 100% are stated as they are: with the
shortest window the default scenario reads "Complete at 122% elapsed" and
"144% elapsed", "Whole chain 144% of the window", "Beyond the window 44%".
The worst case the controls allow, 24 units against 9, reads 267%. The
scenario engine is unchanged and remains the only source of outcomes; the
chain's totals are tested against the dial's meter for every preset and
window.

A defect from the tenth pass is corrected here: the chain's bar then showed
only duration, so the point at which a stage completed could not be read
from it.

### Evidence interaction

Reviewed in the browser. A pressed question was easy to miss on a long
trace, and on a phone its marks were below the fold. Now: the ring is three
pixels, the connector leaving a marked finding or record is drawn at the
same weight so the path can be followed, the ring settles into place once,
and "Show the first on the trace" takes the reader to the first mark. The
page never scrolls unasked. No relationship was added: the marks are the
same selectors as before.

Also corrected: two no-script rules (this one and the chain's scenario
control) had been emitted with literal braces and did nothing. Without
JavaScript the controls that need it are now withheld, and the answers
remain.

### Email signature contrast

The bronze link colour is unchanged, as instructed. What fails, exactly:
three links in the light preview on `/signature/` (the email address and two
site links), bronze `#c9b694` on white, 1.98:1 against a requirement of
4.5:1. Nothing else on the page fails.
`tests/e2e/signature-contrast.spec.ts` asserts that these three, and only
these, fail, so the limitation is recorded and cannot widen unnoticed. No
existing test was changed.

Measured against representative canvases (chosen values, not sampled from
the clients themselves):

| Canvas | Current bronze `#c9b694` | Darker bronze `#7a6c55` | Inherited text, bronze underline |
|--------|--------------------------|-------------------------|----------------------------------|
| White `#ffffff` | 1.98:1 fails | 5.12:1 | 17.40:1 |
| Gmail light `#f6f8fc` | 1.86:1 fails | 4.81:1 | 16.37:1 |
| Outlook light `#faf9f8` | 1.88:1 fails | 4.87:1 | 16.55:1 |
| Apple Mail dark `#1e1e1e` | 8.42:1 | 3.26:1 fails | 14.63:1 |
| Gmail dark `#202124` | 8.13:1 | 3.15:1 fails | 14.13:1 |
| Outlook dark `#292929` | 7.34:1 | 2.84:1 fails | 12.77:1 |

No single link colour can meet 4.5:1 on both white and a dark canvas; the
two ranges do not overlap (tested). A pasted signature carries one inline
colour and no stylesheet, so it cannot switch. The alternative that keeps
the brand and passes everywhere is to let link text inherit the message's
text colour and carry the bronze as an underline. It has not been applied.
It changes the appearance of sent email and needs a decision.

### Verification

- 232 unit tests; 591 Chromium browser tests (9 skipped); 252 Firefox and
  WebKit tests (6 skipped); type check, content check and private-path
  check clean. No test was removed or loosened. Three assertions were
  rewritten because what they measured changed with the timing model, each
  to a stricter statement.
- Lighthouse mobile: homepage 96, `/agda/` 98, `/methodology/` 98, a note
  99, a comparison page 98; homepage desktop 100. Accessibility, best
  practices and SEO 100 on each.
- axe, WCAG 2.2 AA, 33 routes, two themes, two widths, with interactive
  states active: 128 of 132 clean; the four are the signature links above.
- No horizontal overflow, console error or failed request on twelve pages
  at 1440, 768, 390 and 320 pixels in either theme.
- Keyboard: the chain's scenario control, the evidence questions and the
  jump are tested from the keyboard. Reduced motion: tested for the dial and
  the lens ring. No JavaScript: tested for the chain and the evidence
  questions.

### Not done

- VoiceOver: no session was run. It cannot be driven from this environment.
  Screen-reader behaviour is tested through roles, names and live regions
  only.
- No physical device. Phone results are emulated viewports in Chromium and
  WebKit.

### What remains weak

- The chain header is now long on a phone: label, control, link, sentence,
  three totals and a key before the first stage.
- The AGDA figure and the methodology figure cover overlapping ground. They
  are drawn differently and serve different pages, but a reader of both sees
  the same four ideas twice.
- The comparison ledger is one treatment for five pages. Each page does not
  have its own picture of its own distinction.
- The chain still carries two vocabularies, "Waits on" and the window
  states.
- `/services/` on a phone is still long.
- Reading time is an estimate at 230 words a minute.

## Twelfth pass: release candidate

Focused work only. No new design.

**Two defects reported from the preview, both fixed.**

- The outcome word overflowed the dial. Its size was set from the page's
  width, so on a two-column layout where the dial is narrower than the type
  expected, "Narrow margin" was 504 pixels wide in a centre 397 wide and sat
  off-centre. The word is now sized from the dial's own width and from its
  own length (`centreWordSize`), so it fits whatever it says. Tested for
  all three outcomes and all four stage names at nine widths from 320 to
  1920 pixels, in Chromium, Firefox and WebKit. Earlier passes had not
  checked widths between 1000 and 1300 pixels.
- Buttons and links jumped on hover. Buttons lifted two pixels, which left
  a pointer resting on the lower edge outside the button: it lost the
  hover, dropped back and lifted again. Links moved their underline by two
  pixels. Both now answer with colour only. A test hovers at the lower edge
  of buttons and links with motion on and asserts nothing moves. This rule
  predates the redesign; it is recorded here because the fix is in this
  branch.

**Email signature.** Link text now inherits the surrounding text colour and
the gold is the underline. The earlier treatment is in the history at
`f7a13c4`. Rendered directly on seven representative canvases the link text
meets 4.5:1 on each, and `/signature/` has no accessibility violation in
either appearance (132 of 132 scans clean). One limit was found and is
asserted in the tests as it is: a rich-text editor in Chromium discards
`color: inherit` on paste, so a pasted link takes the editor's own link
colour. No mail client has been tested. See
`docs/manual-test-procedures.md`.

**Mobile chain header.** The scenario, its sentence, the whole-chain figure
and the link to the dial stay in view. "Window remaining", "Beyond the
window" and the key to the bars are behind one button, "More measurements
and how to read the bars", which names and controls its region. Wide
screens show everything with no control. Without script everything is
shown. Every figure still follows the scenario while folded. It is a button
and a region, not a details element, so the chain's own stage disclosures
remain the only ones in it.

**AGDA and methodology.** AGDA says what is assessed and established;
methodology says how. The stage-by-stage explorer is no longer repeated on
the AGDA page, which links to it on the methodology page. The methodology
figure no longer draws the three verdict states a third time: its fourth
layer is "Judgement" (engine computation, interpretation, conclusion) and
the states stay listed once, under the chain. Each page links to the other
for its half. No statement was removed from the site.

**Comparison pages.** Reviewed one by one. Each ledger carries its own
distinction in its own rows: structures against capability (AI governance),
retrospective against forward (audit), a point in time against an interval
(compliance), impact tolerance against the reversibility window
(operational resilience), likelihood against speed of response (risk
management). No page needed a graphic of its own and none would be
supportable from its content. No change.

**Verification.** 234 unit tests; 628 Chromium tests (10 skipped); 287
Firefox and WebKit tests (7 skipped); type, content and private-path
checks clean. axe: 132 of 132 clean. Lighthouse mobile: homepage 96, AGDA
98, methodology 98, services 98; desktop homepage 100. No overflow, console
error or failed request on twelve pages at five widths in both themes.

One existing test was made more robust without changing what it asserts:
a signature test could end with a stubbed image request still in flight
and fail intermittently; it now waits for the artwork to load.

**Not done.** No VoiceOver session. No mail client. No physical device.
Procedures for the first two are in `docs/manual-test-procedures.md`.

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

Ninth pass:

- `/services/`: the opening section is headed "Where to begin. Any of the
  three." and now shows each engagement's fee and boundary. The compact
  fork's "Appropriate when" lines are gone from that section; each sheet
  keeps "Start here when".
- `/sectors/`: two labels added per sector, "What is expected" and "Where it
  can fail". The sentences beneath them are unchanged.
- `/verify/`: one label added, "Established by a successful check".
- `/sample-report/`: the cover links "Evidence, Finding, Decision,
  Limitations" are replaced by the reading path "Conclusion, Findings,
  Evidence, Qualifications" with a line under each. The Intervene row reads
  "assumed by the source to propagate a halt if instructed. No duration is
  assessed for this stage."
- Evidence trace: "matched by description" on E-01 and E-04; "It does not
  cite this record by its identifier."; "A solid line is a link the register
  states; a dashed line is a match by description."
- Dial: the figure's accessible name is "Intervention dial. Its reading is
  given in the sentence that follows the stage list."

No price, scope, deliverable, exclusion, methodology statement or
verification claim was changed.


Tenth pass:

- SEDI chain on the homepage: "Carried from the dial · illustrative"; the
  scenario's label, its sentence and the dial's outcome sentence; per stage
  "N% of the window" and one of "Inside the window", "Window closes here",
  "After the window"; "Window closes" on the boundary.
- Evidence trace: "Executive reading · select a question to mark its answer
  on the trace"; the four questions "What was examined", "What the example
  establishes", "What remains uncertain", "Why the conclusion follows", with
  answers assembled from the sample's existing values; "Marked on the trace
  below: ...".
- Engagements: "Depth of examination"; "Covers ..." and "Outside it: ..."
  built from "authority to halt, evidence for each step, timings in your
  records, a window set from your records, the verdict".
- Dial centre, when a stage is picked: the stage name and "N% of the
  window".

No price, scope, deliverable, exclusion, methodology statement or
verification claim was changed.

Eleventh pass:

- `/agda/`: new section "How a conclusion is reached." with the labels
  Scope, Evidence, Intervention chain, Conclusion; "Four stages, read
  against the available time."; "The available time agreed in scope is what
  the chain is read against."; "The conclusion applies to the assessed
  conditions." The remaining statements are the page's own.
- `/methodology/`: new section "Four layers, kept apart." with the layer
  names Operational dependencies, Timing, Evidence, Conclusion; "The stages
  run against the available time, which is set in scope."; "Diagrams of the
  method, not measurements."
- SEDI chain: "Takes N% of the window" (was "N% of the window"); "Complete
  at N% elapsed"; "Whole chain", "Window remaining", "Beyond the window";
  the key sentence beginning "Each bar is one stage on the same scale";
  "Scenario"; "Shown on the dial".
- Dial: "This scenario is carried into the chain below"; centre caption
  "Takes N% of the window".
- Evidence trace: "Show the first on the trace".
- Insights: "Latest", "Earlier notes", "Read the note", "N minute read",
  "Later note", "Earlier note", "All notes". Card kickers show the note's
  date in place of "Note".

No price, scope, deliverable, exclusion, methodology statement or
verification claim was changed. No comparison cell was changed.

Twelfth pass:

- `/agda/`: the stage explorer is replaced by one sentence, "How each stage
  is examined, what it depends on and what evidence it needs is set out in
  the methodology."
- `/methodology/`: the fourth layer is "Judgement" (was "Conclusion"), with
  "Repeatable engine computation supports the assessment. Intervene remains
  responsible for evidence interpretation and the final conclusion." The
  introduction adds "What an assessment covers and establishes is on the
  AGDA® page."
- SEDI chain: "More measurements and how to read the bars".
- Email signature: no wording change. Link text colour and underline only.

No price, scope, deliverable, exclusion, methodology statement or
verification claim was changed.

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
