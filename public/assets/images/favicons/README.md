# Intervene favicon pack

The active favicon set uses the AGDA® A artwork from brand kit v3.0, as selected by James. Browser SVGs and PNGs have transparent backgrounds; light browser chrome uses the black A and dark browser chrome uses the white A. The ICO uses the supplied white tiles at 16, 32 and 48 pixels.

Apple touch, Android, app and Microsoft tile icons use black artwork on white backgrounds. These variants preserve the supplied platform geometry and transparency, including the maskable icon's safe area. Numbered files retain their existing URLs.

Artwork masters come from the brand kit's `assets/icons/favicon-agda/` and `assets/icons/png/light/agda-icon-light-*.png`. SVGs are copied directly. Browser PNGs are rendered from the static SVGs. Platform PNG colours are inverted from the kit's dark tiles, mapping #0A0A0A to #FFFFFF and #FFFFFF to #0A0A0A. Legacy sizes are resized from the corresponding platform asset.

`BaseLayout.astro` links to `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` and `site.webmanifest`. `manifest.json` mirrors `site.webmanifest`; Intervene's app identity and existing icon URLs are retained.
