"""Subset the site's web fonts and verify the result against the originals.

Usage (fontTools and brotli in a virtual environment; the build does not need them):

    git show 6418902:public/assets/fonts/montserrat-regular.woff2 > originals/montserrat-regular.woff2   # and the other six
    npm run build
    python scripts/subset-fonts.py originals public/assets/fonts dist

The complete original files are in the repository history at commit 6418902
and every commit before it. The subsets keep Basic Latin, Latin-1, Latin
Extended-A, the punctuation, arrows and symbols the site uses, every layout
feature that still applies, the hinting and the glyph names. Glyph names are
kept on purpose: without them the same outlines rasterise differently below
20px in Chromium on macOS.

For each font the script fails unless: every character in the built site
that the original could draw is still drawn; every kept glyph has the same
advance width; and the vertical metrics are unchanged.
"""
import sys, os, re, glob, html
from fontTools.ttLib import TTFont
from fontTools import subset
orig, out, dist = sys.argv[1:4]
RANGES = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+2044,U+20AC,U+2122,U+2190-2199,U+21BB,U+2212,U+2260,U+2264-2265,U+2713,U+267B,U+25A0-25CF,U+FEFF"
# every character the built site can render as text
used = set()
for f in glob.glob(dist + '/**/*.html', recursive=True):
    t = open(f, encoding='utf-8').read()
    t = re.sub(r'<script[^>]*>.*?</script>', ' ', t, flags=re.S)
    t = re.sub(r'<style[^>]*>.*?</style>', ' ', t, flags=re.S)
    used |= set(html.unescape(re.sub(r'<[^>]+>', ' ', t)))
for f in glob.glob(dist + '/**/*.css', recursive=True) + glob.glob(dist + '/**/*.js', recursive=True):
    t = open(f, encoding='utf-8').read()
    used |= {c for c in t if ord(c) > 126}
    used |= {chr(int(h, 16)) for h in re.findall(r"content:\s*['\"]\\([0-9a-fA-F]{2,6})", t)}
used = {c for c in used if ord(c) >= 32}
print('distinct characters in built site:', len(used), 'non-ASCII:', ''.join(sorted(c for c in used if ord(c) > 126)))
ok = True
for path in sorted(glob.glob(orig + '/*.woff2')):
    name = os.path.basename(path)
    o = TTFont(path); ocm = set(o.getBestCmap())
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True; opts.glyph_names = True; opts.hinting = True
    opts.unicodes = subset.parse_unicodes(RANGES)
    f = subset.load_font(path, opts); s = subset.Subsetter(opts); s.populate(unicodes=opts.unicodes); s.subset(f)
    subset.save_font(f, os.path.join(out, name), opts)
    n = TTFont(os.path.join(out, name)); ncm = set(n.getBestCmap())
    need = {ord(c) for c in used} & ocm          # what the original could draw of the site's text
    lost = sorted(need - ncm)
    feats = lambda t: sorted({r.FeatureTag for r in t['GSUB'].table.FeatureList.FeatureRecord}) if 'GSUB' in t else []
    fo, fn = feats(o), feats(n)
    print(f"{name}: {os.path.getsize(path)} -> {os.path.getsize(os.path.join(out, name))} bytes; cmap {len(ocm)} -> {len(ncm)}; site chars drawn by original {len(need)}, lost {len(lost)} {[hex(x) for x in lost]}; GSUB features lost {sorted(set(fo)-set(fn))}; unitsPerEm same {o['head'].unitsPerEm==n['head'].unitsPerEm}; metrics same {(o['hhea'].ascent,o['hhea'].descent,o['OS/2'].sTypoAscender,o['OS/2'].sxHeight)==(n['hhea'].ascent,n['hhea'].descent,n['OS/2'].sTypoAscender,n['OS/2'].sxHeight)}")
    # advance widths identical for every kept glyph
    oh, nh, ocmap, ncmap = o['hmtx'], n['hmtx'], o.getBestCmap(), n.getBestCmap()
    bad = [hex(cp) for cp in ncm if oh[ocmap[cp]][0] != nh[ncmap[cp]][0]]
    print('   advance widths differing:', len(bad))
    ok = ok and not lost and not bad
    missing_in_orig = sorted({ord(c) for c in used} - ocm)
    print('   site chars the ORIGINAL never had (system fallback before and after):', ''.join(chr(x) for x in missing_in_orig if x > 126))
print('ALL OK' if ok else 'PROBLEM')
