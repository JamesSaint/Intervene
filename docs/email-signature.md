# Intervene email signature

The website maintains James Saint’s signature at `/signature/`, with a standalone email document at `/signature/email.html`. The page uses the existing site layout, typography and tokens. It is marked `noindex` and excluded from the sitemap.

## Maintenance

`src/lib/email-signature.ts` holds the signature fragment, plain text, approved positioning, company details and the notices James supplied. Preserve notice wording verbatim. Contact details come from `src/lib/social.ts`: `hello@intervene.uk` and James’s existing LinkedIn profile. No personal email address or telephone number has been inferred.

`markAgdaEmail()` in `src/lib/marks.ts` supplies the email rendition of the approved mark, including the bronze registration symbol. The website’s existing mark renderer is unchanged.

The four email PNGs under `public/assets/brand/` are byte-for-byte copies of the approved brand kit v3.0.0 transparent 600-pixel exports. Their SHA-256 hashes are recorded in the signature browser test. Do not redraw, recolour or re-export them. The copied HTML uses absolute URLs under `https://intervene.uk/assets/brand/`. Page previews resolve the same public assets locally so they can be reviewed before deployment.

## Appearance and email compatibility

The email fragment uses ordinary blocks for its single-column layout, with 24-pixel vertical padding and no horizontal padding. Mail supplies the message gutter, so the signature's name, contacts, dividers and notices align with normal body text. This follows James's alignment correction over the original request for approximately 24-pixel internal padding. Essential formatting is inline, with no script. Mail freezes imported table column widths, including tables with percentage widths. Blocks let the saved signature reflow to the message width when the compose window changes. A table is unnecessary for this layout. It has no opaque canvas, fixed maximum width, card, shadow or gradient. Each website preview spans the full viewport width without a maximum width. Preview content and captions use the site's default `--gutter`, with `--gutter-tight` at the existing 720-pixel breakpoint. The surrounding previews supply white and charcoal canvases, which are excluded from copying.

James's previous signature supplies the visual reference: a bronze vertical header rule, full-width bronze dividers around the product band, compact identity sizing, a wrapping contact line and bold notice labels. The current rendition uses a 16-pixel name, 13-pixel role and contacts, and 11-pixel legal text. Artwork and registration details remain current. The environmental notice uses accessible bronze `#7a6c55` on light previews and the established accent `#c9b694` on dark previews. Its inline fallback uses the light bronze; stripped styles or client recolouring can change its contrast on dark backgrounds.

The current request takes precedence over the brand specification's default email maximum width, table layout and prohibition on gold text: this signature stays full-width, uses blocks to preserve Mail reflow, and restores the requested bronze treatment. The header uses the website's current “Intervention Readiness, assessed.” wording. The divider band contains the AGDA® artwork, followed by “Assess the ability to intervene.” on a separate line. The capability list is omitted.

Each brand has one `img` inside a `picture` element. Its dark `source` selects the approved white artwork through `prefers-color-scheme`, without depending on embedded CSS. An editor that discards the picture or source element retains the single black fallback image. It cannot expose duplicate variants. The standalone document also adapts text colours through embedded CSS where supported. Copy Signature excludes those styles and keeps essential formatting inline.

Images have fixed inline widths and heights at the approved aspect ratios: 120×13.4 pixels for Intervene and 80×17.8667 pixels for AGDA®. A failed fetch therefore leaves a compact placeholder instead of a square that stretches the signature. Image URLs include a stable version based on each approved asset's hash, prompting fresh requests after the earlier failed loads. The assets themselves are unchanged. The tagline has 2 pixels of top padding and contact links have no underlines.

Body text inherits the message colour. Contact links use muted grey inline. A client that removes image source selection retains black artwork, which can lose contrast on a dark canvas; clients can also recolour text or images. There is no universal transparent-logo solution across email clients using only fixed black and white artwork. The previews show each intended appearance, rather than promising that every installed client will switch automatically.

The primary copy operation supplies `text/html` and `text/plain` through the Clipboard API during the click gesture. If unavailable or rejected, a legacy rich-copy path sets both formats on the copy event. If both paths fail, the page directs the user to select the standalone rendered signature manually. Only the email fragment is copied. The complete text version remains available on the page.

Recipients can block remote images. Montserrat falls back to Helvetica or Arial when it is unavailable. Pasting software may normalise spaces or discard styles. Existing installed signatures do not update automatically when this source changes.

## Apple Mail

On macOS, open the page in Safari, copy, create a signature under Mail → Settings → Signatures, deselect **Always match my default message font**, paste and assign it to the account. Send a test email and inspect it on light and dark backgrounds. See [Apple’s settings guide](https://support.apple.com/en-gb/guide/mail/-cpmlprefsig/mac).

For an update, use a fresh signature entry and retain the old one under a distinct name. Pasting over an existing formatted signature can retain its first block's border and indent around the replacement. Select the new entry as the account default after saving.

On iPhone, try copying the rendered signature from this page or a received test email, then paste under Settings → Apps → Mail → Signature and send a test. Apple’s [iPhone Mail guide](https://support.apple.com/en-gb/guide/iphone/iph80dabb18b/ios) documents text-only signatures. Rich formatting and images may not survive; use the complete text signature if needed.

On 11 October 2026, a received test exposed duplicate black/white images and oversized placeholders in the original fallback. That implementation was replaced with the single-image picture rendition and fixed dimensions described above.

The corrected fragment was copied through the actual Safari button, installed in a fresh **Intervene Signature** entry and selected as the Intervene account default. The previous entry remains as **Intervene Signature (old images)**. Earlier test and backup entries were retained. A fresh draft loaded one logo per brand, with full-width bronze dividers, the 2-pixel tagline gap, no link underlines and a left edge aligned with normal body text.

James explicitly authorised one test email from `hello@intervene.uk` to `james@jamessaint.com`, titled **Intervene signature rendering check**, and a temporary Dark appearance check. It was sent and received at 16:32 BST. The received email displayed both approved logos, compact dimensions, the bronze registration symbol and dividers, and the supplied text. Its raw HTML preserved both `picture` elements, their dark sources and the fixed image dimensions. All four versioned production URLs returned HTTP 200, `image/png` and hashes identical to the approved masters.

In macOS Dark appearance, Mail kept this received HTML email on a white message canvas, including during attempts to select **Show with Dark Background**. The logos remained visible there. This does not verify the received email on a charcoal canvas. Automatic source selection on white and charcoal was verified in browser tests, including without embedded CSS. James's original **Auto** appearance was restored. No Mail privacy settings were changed. iOS installation remains unverified.

## Verification and deployment

Run the existing checks:

```sh
npm run content-check
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The signature tests cover both clipboard formats, independent browser paste, the rich-copy fallback and blocked-copy feedback, notice fidelity, white and charcoal previews, standalone rendering without embedded CSS and asset hashes. A regression test blocks image requests and removes picture sources and styles, then checks that exactly two images retain their compact dimensions. The site-wide appearance and metadata tests treat the standalone email document as an export rather than a website page. Absolute image URLs are tested against the local production build before publishing.

Screenshots are saved in `.playwright/signature-review/`. That folder is ignored by Git.

After James explicitly approves publication, commit the reviewed changes using his configured identity and follow the repository’s existing deployment workflow. A push to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes `dist` to GitHub Pages. Publish the page and its four PNGs together. Then check `https://intervene.uk/signature/`, `/signature/email.html` and all four production image URLs before installing the signature. Do not push or deploy without approval.
