# Manual test procedures

Two checks that cannot be run from an automated environment. Neither has
been done. Each is recorded as incomplete until a person has run it and
filled in the result table.

## 1. VoiceOver review

Status: **not done**. Screen-reader behaviour has only been tested through
roles, accessible names and live regions in the browser's accessibility
tree. That is not the same as hearing it.

Set-up: macOS, Safari, the local preview at `http://127.0.0.1:4173`.
Turn VoiceOver on with Command-F5. Use Control-Option (VO) with the arrow
keys to move, VO-Space to activate, VO-U for the rotor.

| # | Page | Steps | Expected | Result |
|---|------|-------|----------|--------|
| 1 | `/` | Load the page and wait ten seconds without touching anything. | The dial's run is not announced stage by stage. At most one sentence is spoken when it settles. | |
| 2 | `/` | VO-Right through the hero. | Heading "Can you stop it in time?" once. The dial is announced once as "Intervention dial. Its reading is given in the sentence that follows the stage list." Its stage names are not read from the drawing. | |
| 3 | `/` | Continue to the stage list. | Four buttons, each with its name, what it does and its state, for example "Intervene, Put it into effect, Window closes here". | |
| 4 | `/` | Activate "Escalate". | Announced as pressed. Nothing else is read out unprompted. Activate again: not pressed. | |
| 5 | `/` | Move to "Illustrative scenario" and choose "The chain holds". | The select announces its label and the new value. One sentence follows: "Illustrative scenario, The chain holds: In time. Intervention takes effect before the window closes." It is spoken once, not twice. | |
| 6 | `/` | Open "Adjust the model" and move the Decide slider. | Slider announced as "Decide: time taken", with a value such as "3 of 6". The outcome sentence is spoken once after each change. | |
| 7 | `/` | Follow "This scenario is carried into the chain below". | Focus moves to the chain section. The heading "Assess the ability to intervene." can be reached with VO-Command-H. | |
| 8 | `/` | In the chain header, change "Scenario". | The select announces its new value. The chain's figures change silently; the outcome is spoken once (by the dial's sentence), not a second time by the chain. | |
| 9 | `/` at 390 px wide (Responsive Design Mode) | Find "More measurements and how to read the bars". | Announced as a button, collapsed. Activate: announced expanded, and the next items are "Window remaining" and "Beyond the window" with their values. | |
| 10 | `/` | VO-Right through one stage of the chain. | In order: "Takes N% of the window", "Complete at N% elapsed", the state, the stage name, what it needs, its question. The bars themselves are skipped. | |
| 11 | `/` | Open and close a stage. | Announced as expanded and collapsed. Opening one closes the previous one without a spurious announcement. | |
| 12 | `/` | In the evidence section, move through the four questions. | Each is a toggle button with its question and its answer read together. | |
| 13 | `/` | Activate "What remains uncertain". | Announced as pressed. One status sentence is spoken: "Marked on the trace below: 2 stages, 4 records, one stage with no record." | |
| 14 | `/` | Activate "Show the first on the trace". | The page scrolls. Confirm whether focus position still makes sense; note it if VoiceOver's cursor is left behind. | |
| 15 | `/` | Open record E-01. | Announced as expanded. Its type is read as "Incident, matched by description". | |
| 16 | `/` | Through the three engagements. | Each reads question, name, scope, "Depth of examination", the "Covers ... Outside it ..." sentence, "Commissioned on its own", fee and boundary. The five-segment bar is skipped. | |
| 17 | `/agda/` | Through "How a conclusion is reached". | A list of four items. The rail drawing is skipped; the stage names are not read twice. All three states are read; none is announced as selected. | |
| 18 | `/methodology/` | Through "Four layers, kept apart". | A list of four items, each heading, sentence and link. The diagrams are skipped. | |
| 19 | `/intervention-readiness/vs-audit/` | Enter the table with VO-Right; move with VO-arrow keys. | Announced as a table with 3 columns and 6 rows. Moving across a row announces the column header ("Audit", "Intervention Readiness") and the row header. | |
| 20 | `/insights/accountability-theatre/` | Rotor, headings. | One level-1 heading, then the note's own level-2 headings. "More notes" is a navigation landmark. | |
| 21 | `/verify/` | Through "Coverage". | "Covered by the signature" and "Not covered by the signature" are headings; each list reads as a list. | |
| 22 | Any | Turn on Reduce Motion in System Settings and reload `/`. | The dial shows its result at once; no Replay or Pause control is offered. | |

Record anything spoken twice, anything silent that should speak, and any
place the VoiceOver cursor is lost.

## 2. Email signature in real clients

Status: **not done**. The signature has only been rendered in browser
engines. No mail client has been tested and no compatibility is claimed.

What is known from automated tests:

- Rendered directly, with no stylesheet, on seven representative light and
  dark canvases, link text takes the message's text colour and meets 4.5:1
  on each. The gold underline is present on each.
- **Pasted into a rich-text editor in Chromium, the editor discards
  `color: inherit`.** The pasted link then takes the editor's own link
  colour (default blue in an unstyled editor), with the gold underline.
  Every non-literal colour value tried was discarded the same way. A mail
  client that composes in such an editor may therefore show blue link text.
  This is the point most in need of a real test.

Procedure, for each client below. Install or paste the signature as the
`/signature/` page describes, send a message to yourself and to an account
on another service, and view the received message in light and in dark
appearance.

| Client | How the signature gets in | Check when composing | Check when received, light | Check when received, dark | Result |
|--------|---------------------------|----------------------|----------------------------|---------------------------|--------|
| Apple Mail, macOS | Direct install | | | | |
| Apple Mail, iOS | Synced or pasted | | | | |
| Gmail, web (Chrome) | Pasted into Settings, Signature | | | | |
| Gmail, iOS and Android apps | Received only | n/a | | | |
| Outlook, web | Pasted | | | | |
| Outlook, Windows desktop | Pasted | | | | |
| Outlook, macOS | Pasted | | | | |

For each cell record: the colour of the three link texts (message text
colour, blue, or other); whether the gold underline is present, and whether
it is one line or doubled with the client's own underline; whether the
links are legible; and whether the logos switch with the appearance.

If any client shows blue link text, the options are to accept it (blue on a
light canvas is legible; on a dark canvas it depends on the client's own
link colour) or to return to a literal colour, which cannot meet contrast
on both light and dark. The previous treatment, gold link text, is in the
history at commit `f7a13c4`.
