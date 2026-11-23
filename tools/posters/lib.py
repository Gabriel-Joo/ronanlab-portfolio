"""Shared helpers: fonts (measure / subset / embed), text, pixel sprites, svg surgery."""
import base64, io, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, '.cache')          # downloaded fonts, static instances, vendored brotli (safe to delete)
sys.path.insert(0, os.path.join(S, 'pylib'))
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset as ftsubset
from PIL import Image

FD = os.path.join(S, 'fonts')
CACHE = os.path.join(S, 'fontcache')
os.makedirs(CACHE, exist_ok=True)
os.makedirs(FD, exist_ok=True)

# Where each source font comes from when .cache/fonts is empty.
_GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
_PM = os.environ.get('PETMINT_REPO', os.path.expanduser('~/AI_programming/petmint-rag-chatbot'))
FONT_ORIGIN = {
    'NotoSansKR.ttf': _GF + 'notosanskr/NotoSansKR%5Bwght%5D.ttf',
    'Inter.ttf': _GF + 'inter/Inter%5Bopsz%2Cwght%5D.ttf',
    'ArchivoBlack.ttf': _GF + 'archivoblack/ArchivoBlack-Regular.ttf',
    'PlexMono.ttf': _GF + 'ibmplexmono/IBMPlexMono-Medium.ttf',
    'WantedSansVariable.woff2': _PM + '/web/src/assets/fonts/WantedSansVariable.woff2',
    'WanjuDaedunsan-Bold.woff2': _PM + '/web/src/assets/fonts/WanjuDaedunsan-Bold.woff2',
}


def font_file(name):
    path = os.path.join(FD, name)
    if not os.path.exists(path):
        src = FONT_ORIGIN[name]
        if src.startswith('http'):
            import urllib.request
            urllib.request.urlretrieve(src, path)
        else:
            import shutil
            shutil.copy(src, path)
    return path

# key -> (source file, axis location or None)
FACE_SRC = {
    'noto4': ('NotoSansKR.ttf', {'wght': 400}),
    'noto5': ('NotoSansKR.ttf', {'wght': 500}),
    'noto7': ('NotoSansKR.ttf', {'wght': 700}),
    'noto9': ('NotoSansKR.ttf', {'wght': 900}),
    'inter4': ('Inter.ttf', {'wght': 400, 'opsz': 14}),
    'inter5': ('Inter.ttf', {'wght': 500, 'opsz': 14}),
    'inter6': ('Inter.ttf', {'wght': 600, 'opsz': 14}),
    'wanted5': ('WantedSansVariable.woff2', {'wght': 500}),
    'wanted7': ('WantedSansVariable.woff2', {'wght': 700}),
    'wanted8': ('WantedSansVariable.woff2', {'wght': 800}),
    'wanju': ('WanjuDaedunsan-Bold.woff2', None),
    'archivo': ('ArchivoBlack.ttf', None),
    'plex': ('PlexMono.ttf', None),
}
_faces = {}


class Face:
    def __init__(self, key):
        src, loc = FACE_SRC[key]
        self.key = key
        path = os.path.join(CACHE, key + '.ttf')
        if not os.path.exists(path):
            f = TTFont(font_file(src))
            if loc:
                axes = {a.axisTag for a in f['fvar'].axes}
                f = instancer.instantiateVariableFont(f, {k: v for k, v in loc.items() if k in axes})
            f.flavor = None
            f.save(path)
        self.path = path
        self.font = TTFont(path)
        self.cmap = self.font.getBestCmap()
        self.upm = self.font['head'].unitsPerEm
        self.hmtx = self.font['hmtx']

    def has(self, ch):
        return ord(ch) in self.cmap

    def adv(self, ch):
        return self.hmtx[self.cmap[ord(ch)]][0] / self.upm


def face(key):
    if key not in _faces:
        _faces[key] = Face(key)
    return _faces[key]


class Poster:
    """Collects which characters each face must carry, then emits @font-face rules."""

    def __init__(self, name):
        self.name = name
        self.used = defaultdict(set)

    def _assign(self, s, stack):
        out = []
        for ch in s:
            for k in stack:
                if face(k).has(ch):
                    out.append(k)
                    break
            else:
                raise ValueError(f'no glyph for {ch!r} (U+{ord(ch):04X}) in {stack}')
        return out

    def measure(self, s, stack, size, ls=0):
        if isinstance(stack, str):
            stack = [stack]
        ks = self._assign(s, stack)
        return sum(face(k).adv(ch) for ch, k in zip(s, ks)) * size + ls * len(s)

    def text(self, x, y, s, stack, size, fill, anchor='start', ls=0, extra=''):
        if isinstance(stack, str):
            stack = [stack]
        for ch, k in zip(s, self._assign(s, stack)):
            self.used[k].add(ch)
        fam = ','.join(f"'P-{k}'" for k in stack) + ',sans-serif'
        a = '' if anchor == 'start' else f' text-anchor="{anchor}"'
        l = f' letter-spacing="{ls}"' if ls else ''
        s = s.replace('&', '&amp;').replace('<', '&lt;')
        return (f'<text x="{x:.1f}" y="{y:.1f}"{a} font-family="{fam}" font-size="{size:g}"{l} '
                f'fill="{fill}" xml:space="preserve"{(" " + extra) if extra else ""}>{s}</text>')

    def font_css(self):
        css = []
        for k in sorted(self.used):
            opts = ftsubset.Options()
            opts.flavor = 'woff2'
            opts.layout_features = ['kern', 'liga', 'ccmp', 'locl', 'mark', 'mkmk']
            opts.notdef_outline = True
            opts.name_IDs = [1, 2]
            f = TTFont(face(k).path)
            sub = ftsubset.Subsetter(opts)
            sub.populate(text=''.join(sorted(self.used[k])))
            sub.subset(f)
            f.flavor = 'woff2'
            buf = io.BytesIO()
            f.save(buf)
            b64 = base64.b64encode(buf.getvalue()).decode()
            css.append(f"@font-face{{font-family:'P-{k}';src:url(data:font/woff2;base64,{b64}) format('woff2');}}")
        return '\n'.join(css)


# ---------- legacy (shared set) title / credit faces kept from the original posters ----------
def legacy_faces(svg):
    """Return (css_for_title_and_credit, {name: TTFont}) from the original svg."""
    css, fonts = [], {}
    for m in re.finditer(r"@font-face\{font-family:'(Poster\w+)';(?:font-weight:\d+;)?src:url\(data:font/woff;base64,([^)]+)\) format\('woff'\);\}", svg):
        if m.group(1) in ('PosterTitle', 'PosterCredit'):
            css.append(m.group(0))
            fonts[m.group(1)] = TTFont(io.BytesIO(base64.b64decode(m.group(2))))
    return '\n'.join(css), fonts


def legacy_width(font, s, size, ls=0):
    cmap, hm, upm = font.getBestCmap(), font['hmtx'], font['head'].unitsPerEm
    return sum(hm[cmap[ord(c)]][0] for c in s) / upm * size + ls * len(s)


# ---------- svg surgery ----------
def group_span(svg, start_tag):
    i = svg.index(start_tag)
    d = 0
    for m in re.finditer(r'<g\b|</g>', svg[i:]):
        d += 1 if m.group() != '</g>' else -1
        if d == 0:
            return i, i + m.end()
    raise ValueError(start_tag)


def replace_group(svg, start_tag, new):
    i, j = group_span(svg, start_tag)
    return svg[:i] + new + svg[j:]


# ---------- pixel sprites ----------
def sprite(img, x, y, scale, outline='#1a1620', gid=None):
    """PIL RGBA image -> crisp svg group of run-length rects, with the renderer's 1px outer outline."""
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()
    grid = {}
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = px[xx, yy]
            if a > 127:
                grid[(xx + 1, yy + 1)] = '#%02x%02x%02x' % (r, g, b)
    if outline:
        for (xx, yy) in list(grid):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p = (xx + dx, yy + dy)
                if p not in grid:
                    grid[p] = 'OUT'
        for p, c in grid.items():
            if c == 'OUT':
                grid[p] = outline
    bycol = defaultdict(list)
    for yy in range(h + 2):
        xx = 0
        while xx < w + 2:
            c = grid.get((xx, yy))
            if c is None:
                xx += 1
                continue
            x0 = xx
            while grid.get((xx, yy)) == c:
                xx += 1
            bycol[c].append(f'M{x0} {yy}h{xx - x0}v1h-{xx - x0}z')
    paths = ''.join(f'<path fill="{c}" d="{"".join(d)}"/>' for c, d in bycol.items())
    idattr = f' id="{gid}"' if gid else ''
    return f'<g{idattr} class="px" transform="translate({x:g} {y:g}) scale({scale:g})">{paths}</g>'


def type_block(P, tagline, title, title_size, title_fill, techs, colors, tag_stack, sizes):
    """The shared top line + bottom title / tech trio / credit line (same geometry on all four)."""
    c_tag, c_rule, c_credit = colors
    tag_size, tech_size, foot_size = sizes
    out = ['<g class="type">']
    out.append('  ' + P.text(400, 100, tagline, tag_stack, tag_size, c_tag, 'middle', ls=1))
    out.append(f'  <rect x="372" y="124" width="56" height="2.5" fill="{c_tag}" opacity=".6"/>')
    out.append(f'  <text x="400" y="1046" text-anchor="middle" font-family="PosterTitle,Impact,\'Arial Narrow\',sans-serif" font-size="{title_size}" fill="{title_fill}" >{title}</text>')
    out.append(f'  <rect x="56" y="1076" width="688" height="1.5" fill="{c_rule}" opacity=".4"/>')
    out.append(f'  <text x="400" y="1116" text-anchor="middle" font-family="PosterCredit,\'Arial Narrow\',sans-serif" font-size="{tech_size:g}" letter-spacing="3" fill="{c_credit}" xml:space="preserve">{techs}</text>')
    out.append(f'  <text x="400" y="1158" text-anchor="middle" font-family="PosterCredit,\'Arial Narrow\',sans-serif" font-size="{foot_size:g}" letter-spacing="4.5" fill="{c_credit}" opacity=".78" xml:space="preserve">A RONANLAB PRODUCTION</text>')
    out.append('</g>')
    return '\n'.join(out)
