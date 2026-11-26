# Collateral sources

Editable sources of the PDFs served from `/insights/pdf/`. Each HTML file here renders to the PDF of the same name in `public/insights/pdf/`. Published file names never change (see `src/lib/insight-downloads.ts`), so a revision replaces the file in place; earlier versions stay in git history.

The sources were first held in the November 2026 CRO campaign pack (`cro-campaign-2026-11`), where they carried campaign file names. They were copied here on 26 November 2026 and revised as recorded below. The campaign pack's copies were not updated and are marked superseded; the pack is archived unchanged in Drive (`business/intervene/_archive/cro-campaign-2026-11.zip`). These are now the authoritative sources.

## Inventory

| PDF | Listed on /insights/ | Pages | Version |
|---|---|---|---|
| `intervene-agda-cro-white-paper` | White paper, CROs | 6 | 1.1, 26 Nov 2026 |
| `intervene-agda-ciso-white-paper` | White paper, CISOs | 4 | 1.1, 26 Nov 2026 |
| `intervene-agda-fraud-white-paper` | White paper, fraud and risk leaders | 4 | 1.1, 26 Nov 2026 |
| `intervene-agda-one-pager` | Overview, AGDA® | 1 | 26 Nov 2026 |
| `intervene-agda-fraud-overview` | Overview, AGDA® FRAUD | 1 | 26 Nov 2026 |
| `intervene-agda-overview` | Unlisted (no prices) | 1 | 26 Nov 2026 |
| `intervene-agda-obligation-map` | Reference | 2 | 15 Nov 2026 |
| `intervene-agda-sample-verdict` | Reference, constructed example | 2 | 15 Nov 2026 |

## Revision of 26 November 2026

- The three white papers gain a final section, "Research foundations and validation status", after the call to action. It separates the research (theoretical and retrospective), what is implemented, synthetic testing and planned prospective evaluation, and links to `/research/`. In the CRO paper the section ends page 5, and the limits and references move to a new sixth page.
- The fraud paper's status reflects the AGDA® FRAUD product repository as of 2 November 2026: fraud-specific components, including an uncalibrated probabilistic window estimate, are built and tested on synthetic data only and have not been used with client data.
- The fraud white paper and the AGDA® FRAUD overview no longer say AGDA® FRAUD is "in development with design partners", which read as if partners were already engaged. They now say it is in research and development and that design partners are sought.
- The unlisted overview lists all three entry points (Authority Check, Review, Assessment), as the warm one-pager does, still without prices.
- The two AGDA® one-pagers no longer say validation against real-world outcomes is "to follow", which presumed a result. They state that AGDA® is not yet validated against real-world outcomes.

## Rebuild

Requires Node 24 with the repository's dependencies installed, Python 3 with `pypdf`, and the brand kit's static Montserrat TTFs (Regular, Medium, SemiBold, Bold).

```sh
BRAND_FONTS=<brand kit fonts folder> node collateral/tools/render.mjs \
  collateral/source/intervene-agda-cro-white-paper.html /tmp/cro.pdf
python3 collateral/tools/stamp.py /tmp/cro.pdf \
  public/insights/pdf/intervene-agda-cro-white-paper.pdf \
  "You are accountable. Show us the evidence. | AGDA® white paper for Chief Risk Officers"
```

`render.mjs` exits with code 2 if any page overflows its A4 box. Keep the existing PDF title (`pdfinfo` shows it). After a rebuild, update `pages` in `src/lib/insight-downloads.ts` if the page count changed, and inspect every page.
