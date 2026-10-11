# Intervene email signature

The website maintains James Saint’s signature at `/signature/`, with a standalone email document at `/signature/email.html`. The page uses the existing site layout, typography and tokens. It is marked `noindex` and excluded from the sitemap.

## Maintenance

`src/lib/email-signature.ts` holds the signature fragment, plain text, approved positioning, company details and the notices James supplied. Preserve notice wording verbatim. Contact details come from `src/lib/social.ts`: `hello@intervene.uk` and James’s existing LinkedIn profile. No personal email address or telephone number has been inferred.

`markAgdaEmail()` in `src/lib/marks.ts` supplies the email rendition of the approved mark, including the bronze registration symbol. The website’s existing mark renderer is unchanged.

The four email PNGs under `public/assets/brand/` are byte-for-byte copies of the approved brand kit v3.0.0 transparent 600-pixel exports. Their SHA-256 hashes are recorded in the signature browser test. Do not redraw, recolour or re-export them. The copied HTML uses absolute URLs under `https://intervene.uk/assets/brand/`. Page previews resolve the same public assets locally so they can be reviewed before deployment.

## Appearance and email compatibility

The email fragment uses ordinary blocks for its single-column layout, with 24-pixel vertical padding and no horizontal padding. Mail supplies the message gutter, so the signature's name, contacts, dividers and notices align with normal body text. This follows James's alignment correction over the original request for approximately 24-pixel internal padding. Essential formatting is inline, with no script. Mail freezes imported table column widths, including tables with percentage widths. Blocks let the saved signature reflow to the message width when the compose window changes. A table is unnecessary for this layout. It has no opaque canvas, fixed maximum width, card, shadow or gradient. Each website preview spans the full viewport width without a maximum width. Preview content and captions use the site's default `--gutter`, with `--gutter-tight` at the existing 720-pixel breakpoint. The surrounding previews supply white and charcoal canvases, which are excluded from copying.

James's previous signature supplies the visual reference: a bronze vertical header rule, full-width bronze dividers around the product band, compact identity sizing, a wrapping contact line and bold notice labels. The current rendition uses a 16-pixel name, 13-pixel role and contacts, and 11-pixel legal text. Artwork and registration details remain current. The environmental notice uses accessible bronze `#7a6c55` on light previews and the established accent `#c9b694` on dark previews. Its inline fallback uses the light bronze; stripped styles or client recolouring can change its contrast on dark backgrounds.

The current request takes precedence over the brand specification's default email maximum width, table layout and prohibition on gold text: this signature stays full-width, uses blocks to preserve Mail reflow, and restores the requested bronze treatment. The header uses the website's current “Intervention Readiness, assessed.” wording, with the approved product tagline and four capabilities in the divider band.

The standalone email document supports `prefers-color-scheme` to select black or white artwork and the approved text colours. The Copy Signature button deliberately copies the fragment with inline formatting only, excluding embedded CSS. Browser editors can flatten styles and discard hidden artwork during paste; keeping both variants visible in the clipboard payload protects that fallback. A manual selection from the standalone document may preserve only its visible variant.

In the copied fallback, both transparent logo variants survive and body text inherits the message colour. Contact links use the approved muted grey inline, avoiding an editor’s default blue links. One logo variant contrasts on white or charcoal, although the black variant can still be faintly visible on charcoal. Both may be visible on intermediate backgrounds. The duplicate variants occupy space, and a client that recolours images or forces text colours may alter the result. There is no universal transparent-logo solution across email clients using only fixed black and white artwork.

The primary copy operation supplies `text/html` and `text/plain` through the Clipboard API during the click gesture. If unavailable or rejected, a legacy rich-copy path sets both formats on the copy event. If both paths fail, the page directs the user to select the standalone rendered signature manually. Only the email fragment is copied. The complete text version remains available on the page.

Recipients can block remote images. Montserrat falls back to Helvetica or Arial when it is unavailable. Pasting software may normalise spaces or discard styles. Existing installed signatures do not update automatically when this source changes.

## Apple Mail

On macOS, open the page in Safari, copy, create a signature under Mail → Settings → Signatures, deselect **Always match my default message font**, paste and assign it to the account. Send a test email and inspect it on light and dark backgrounds. See [Apple’s settings guide](https://support.apple.com/en-gb/guide/mail/-cpmlprefsig/mac).

For an update, use a fresh signature entry and retain the old one under a distinct name. Pasting over an existing formatted signature can retain its first block's border and indent around the replacement. Select the new entry as the account default after saving.

On iPhone, try copying the rendered signature from this page or a received test email, then paste under Settings → Apps → Mail → Signature and send a test. Apple’s [iPhone Mail guide](https://support.apple.com/en-gb/guide/iphone/iph80dabb18b/ios) documents text-only signatures. Rich formatting and images may not survive; use the complete text signature if needed.

On 11 October 2026, the Safari Copy Signature action was tested in actual macOS Mail by saving the result in Settings and inserting that saved signature into a fresh, unsent Intervene-account draft. The notices used the full available message width and reflowed when the compose window was narrowed from approximately 1,230 to 780 pixels. The existing **Intervene Signature** entry was updated with the corrected fragment. A separate **intervene-width-test** entry remains from the earlier table experiment. No email was sent. Sending, receipt, dark-mode behaviour in Mail and iOS installation remain to be verified.

The production Intervene black PNG URL returned HTTP 404 during that check. Local previews have the assets, but Mail cannot load the unpublished production artwork. Publication and subsequent checks of all four URLs are still required.

The subsequent bronze refinement was also saved to **Intervene Signature** through Safari copy and Mail Settings. A fresh Intervene-account draft preserved the vertical header rule, both horizontal rules, compact typography and bold notice labels. Expanding its window from approximately 780 to 1,215 pixels extended the dividers and reflowed the notices. The logo URLs remain unpublished; no email was sent.

The horizontal-padding correction was installed as a fresh **Intervene Signature** and selected as the Intervene account default. A normal body paragraph above it in an unsent draft confirmed that the body text, name, dividers and notices share the same left edge. The earlier entries remain as **Intervene Signature (indented)**, **Intervene Signature (previous)** and **intervene-width-test**. Remote logos, sending and receipt remain pending.

## Verification and deployment

Run the existing checks:

```sh
npm run content-check
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The signature tests cover both clipboard formats, independent browser paste, the rich-copy fallback and blocked-copy feedback, notice fidelity, white and charcoal previews, standalone rendering without embedded CSS and asset hashes. The site-wide appearance and metadata tests treat the standalone email document as an export rather than a website page. Absolute image URLs are tested against the local production build before publishing.

Screenshots are saved in `.playwright/signature-review/`. That folder is ignored by Git.

After James explicitly approves publication, commit the reviewed changes using his configured identity and follow the repository’s existing deployment workflow. A push to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist` to GitHub Pages. Publish the page and its four PNGs together. Then check `https://intervene.uk/signature/`, `/signature/email.html` and all four production image URLs before installing the signature. Do not push or deploy without approval.
