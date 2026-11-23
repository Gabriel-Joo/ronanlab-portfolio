"""Build the four portfolio posters into ../../posters (svg + 1600x2400 png).

    python3 tools/posters/build.py            # all four
    python3 tools/posters/build.py runshoes   # one

Base drawings: base/poster-*.svg — a frozen snapshot (2026-11-20) holding what this script does not
redraw: backgrounds, the shared title / credit faces, and all of PETMINT's art.
On top of the base it rebuilds, from assets read out of the four repos:
  foreman  — pixel-office characters (Ninja Adventure sprites + role names / colours from the repo)
  infra    — the Grafana dashboard photo in ronanlab-infra/portfolio/img
  runshoes — a shoe photo served by the site's public API, with the spec callouts on top
  petmint  — nothing in the art; only the shared type block (tech line, production line)
Needs: fonttools, pillow, numpy, brotli (brotli is vendored under .cache/pylib) and a Playwright
headless Chromium for the png render. See README.md here.
"""
import base64, glob, io, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(SRC, 'posters')
# 다른 저장소가 있는 곳. 기본은 홈 아래이고, 환경 변수로 바꿀 수 있다.
HOME = os.path.expanduser('~')
FOREMAN = os.environ.get('FOREMAN_REPO', f'{HOME}/AI_programming/foreman') + '/bridge/static/themes'
INFRA_SHOT = os.environ.get('INFRA_REPO', f'{HOME}/ronanlab-infra') + '/portfolio/img/08_grafana_dashboard.png'
SHOE_API = 'https://runshoes.ronanlab.dev/api/shoes'
SHOE = dict(id=131, brand='호카', model='시엘로 X1 3.0', model_en='Cielo X1 3.0', purpose='레이스',
            stack='38mm', drop='7mm', midsole='PEBA', carbon='있음',
            file=os.path.join(HERE, 'assets', 'shoe-131-cielo-x1-3.webp'))

TAGLINES = {
    'foreman': ('여러 AI 세션을 한 화면에서 보고 지시한다', ['noto7']),
    'infra': ('서버 한 대 위에 쿠버네티스를 직접 세웠다', ['inter6', 'noto7']),
    'petmint': ('약관을 찾아 읽고 근거와 함께 답한다', ['wanted7']),
    'runshoes': ('러닝화 스펙과 리뷰를 용어 풀이와 함께', ['noto7']),
}
TECHS = {
    'infra': ['KUBEADM', 'ARGOCD', 'JENKINS', 'HARBOR', 'GRAFANA'],
    'petmint': ['RAG', 'MILVUS', 'QLORA'],
    'foreman': ['CLAUDE CODE', 'TMUX', 'GIT WORKTREE'],
    'runshoes': ['SPRING BOOT', 'RAG CHATBOT', 'MYSQL'],
}


def tech_line(name):
    return '   /   '.join(TECHS[name])


def load(name):
    return open(f'{HERE}/base/poster-{name}.svg', encoding='utf-8').read()


def old_type(svg):
    """Pull title size/fill and colours out of the original type block."""
    i = svg.rindex('<g class="type">')
    blk = svg[i:]
    t = re.search(r'font-size="([\d.]+)" fill="([^"]+)" >([A-Z ]+)</text>', blk)
    tech = re.search(r'font-family="PosterCredit[^>]*fill="([^"]+)"', blk)
    tag = re.search(r'<text x="400\.0" y="100\.0"[^>]*fill="([^"]+)"', blk)
    return i, dict(title=t.group(3), title_size=t.group(1), title_fill=t.group(2),
                   c_credit=tech.group(1), c_tag=tag.group(1))


def shared_sizes():
    """One tagline / tech / footer size for the whole set, as large as the longest line allows."""
    tag = 44.0
    for n, (s, st) in TAGLINES.items():
        w = Poster(n).measure(s, st, 1, 0)
        tag = min(tag, (704 - len(s)) / w)
    tech = 30.0
    _, f = legacy_faces(load('infra'))
    for n in TAGLINES:
        s = tech_line(n)
        tech = min(tech, (688 - 3 * len(s)) / legacy_width(f['PosterCredit'], s, 1))
    return round(tag, 1), round(tech, 1), 21.0


def finish(name, svg, P, body_until_type, sizes, desc='', keep_css=False):
    css_legacy, _ = legacy_faces(svg)
    i, o = old_type(svg)
    tagline, stack = TAGLINES[name]
    tb = type_block(P, tagline, o['title'], o['title_size'], o['title_fill'], tech_line(name),
                    (o['c_tag'], o['c_credit'], o['c_credit']), stack, sizes)
    out = body_until_type + tb + '\n</svg>\n'
    # font block: keep the set's title/credit faces, drop the old KR face, add the site's faces
    if not keep_css:   # keep_css: the art is baked in the base, and so are the faces its text needs
        a = out.index('<defs><style>') + len('<defs><style>')
        b = out.index('#poster-foreman .px')
        out = out[:a] + '\n' + css_legacy + '\n' + P.font_css() + '\n' + out[b:]
    if desc:
        out = out.replace('<defs><style>', f'<desc>{desc}</desc>\n<defs><style>', 1)
    assert 'PosterKR' not in out, 'old KR face still referenced'
    if not keep_css:   # house rule: no em dash, no middle dot in poster text
        for t in re.findall(r'<text[^>]*>([^<]*)</text>', out):
            assert '—' not in t and '·' not in t, t
    os.makedirs(OUT, exist_ok=True)
    path = f'{OUT}/poster-{name}.svg'
    open(path, 'w', encoding='utf-8').write(out)
    return path


def data_uri(img, fmt, **kw):
    buf = io.BytesIO()
    img.save(buf, fmt, **kw)
    return f'data:image/{fmt.lower()};base64,' + base64.b64encode(buf.getvalue()).decode()


# =====================================================================================
# FOREMAN — the pixel office's own characters, every square on the background's 5px grid
# =====================================================================================
# js/roles.js: ROLE_LABEL, ROLE_COLOR. Six roles only.
ROLE = {'coder': ('코더', '#5b9be6'), 'manager': ('관리자', '#e0604f'), 'scribe': ('서기', '#d08b4f'),
        'inspector': ('조사', '#3fbf85'), 'designer': ('디자이너', '#e8619f'),
        'foreman': ('교장', '#c9a227')}   # 교장 = the magic theme's name for the foreman character
GRID = 5   # the background is drawn at scale(5); sprites use multiples of it so no square is ever split


PAD = 3   # empty squares added round a 16x16 sprite so a raised arm or a spread leg has room


def padded(im):
    out = Image.new('RGBA', (16 + 2 * PAD, 16 + 2 * PAD), (0, 0, 0, 0))
    out.paste(im, (PAD, PAD))
    return out


def arms_up(im, sleeve, hand, clear, sides='lr'):
    """New pose drawn from the repo sprite: lower arm squares are lifted beside the head.
    Same palette only: sleeve and hand colours are the sprite's own. clear = how many outer
    columns of the two bottom rows are the hanging arm (removed on the raised side)."""
    px = im.load()
    W = im.width
    row = lambda r: [x for x in range(W) if px[x, r + PAD][3] > 127]
    for side in sides:
        for r in (14, 15):
            xs = row(r)
            if not xs or not clear:
                continue
            cols = range(xs[0], xs[0] + clear) if side == 'l' else range(xs[-1] - clear + 1, xs[-1] + 1)
            for x in cols:
                px[x, r + PAD] = (0, 0, 0, 0)
        edge = {}
        for r in range(9, 14):
            xs = row(r)
            edge[r] = (xs[0] if side == 'l' else xs[-1]) if xs else (PAD + 8)
        step = -1 if side == 'l' else 1
        pick = min if side == 'l' else max
        ax = lambda r: pick(edge[k] for k in range(r, 14)) + step
        for r in (12, 11):
            px[ax(r), r + PAD] = sleeve
        hx = pick(ax(9), ax(10))
        for r in (10, 9):
            for x in (hx, hx + step):
                px[x, r + PAD] = hand
    return im


def legs_apart(im):
    """Jump: the two bottom rows split at the middle and each half moves one square outward."""
    px = im.load()
    W = im.width
    mid = W // 2
    for r in (14, 15):
        y = r + PAD
        line = [px[x, y] for x in range(W)]
        for x in range(W):
            px[x, y] = (0, 0, 0, 0)
        for x in range(W):
            if line[x][3] > 127:
                px[x - 1 if x < mid else x + 1, y] = line[x]
    return im


def rgb(h):
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


def build_foreman(sizes):
    svg = load('foreman')
    P = Poster('foreman')
    i, _ = old_type(svg)
    body = svg[:i]
    CH, SP = f'{FOREMAN}/_shared/ninja/chars', f'{FOREMAN}/magic/sprites'
    INK = '#141b1b'                             # the sprites' own outline colour
    DOWN, UP, LEFT, RIGHT = 0, 1, 2, 3          # Walk.png columns; rows are the four step frames

    def walk(n, col, row):
        return padded(Image.open(f'{CH}/{n}/Walk.png').convert('RGBA').crop((col * 16, row * 16, col * 16 + 16, row * 16 + 16)))

    def cut(rel, box=None):
        im = Image.open(f'{SP}/{rel}').convert('RGBA')
        return im.crop(box) if box else im

    def snap(v):
        return round(v / GRID) * GRID

    def tag(cx, y, label, color, size):
        w = snap(P.measure(label, ['noto7'], size) + size * 0.9)
        h = snap(size * 1.42)
        x = snap(cx - w / 2)
        return (f'<g class="px"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>'
                f'<rect x="{x + GRID}" y="{y + GRID}" width="{w - 2 * GRID}" height="{h - 2 * GRID}" fill="#0c0808"/></g>'
                + P.text(x + w / 2, y + h * 0.5 + size * 0.36, label, ['noto7'], size, color, 'middle'))

    def mat(cx, cy, rx, ry, color):
        """Role-colour mat (js/aura.js 'mat'), stepped on the 5px grid. Drawn below the feet = the jump."""
        d = ''
        for k in range(-ry // GRID, ry // GRID):
            t = ((k + 0.5) * GRID) / ry
            half = snap(rx * max(0.0, 1 - t * t) ** 0.5)
            if half:
                d += f'M{cx - half} {cy + k * GRID}h{2 * half}v{GRID}h-{2 * half}z'
        return f'<path class="px" fill="{color}" fill-opacity=".5" d="{d}"/>'

    def member(im, role, x, y, s, tsize, lift, gid, tag_y=None):
        """x, y = where the sprite's own 16x16 square starts. lift = gap between feet and mat (a jump)."""
        label, c = ROLE[role]
        cx, feet = x + 8 * s, y + 16 * s
        k = 1 - min(lift, 60) / 150          # higher jump, smaller mat
        return (mat(cx, snap(feet + lift), snap(16 * s * 0.5 * k), snap(16 * s * 0.11 * k), c)
                + sprite(im, x - (PAD + 1) * s, y - (PAD + 1) * s, s, outline=INK, gid=gid)
                + tag(cx, tag_y or snap(feet + lift + 5), label, c, tsize))

    # poses: the repo's walk frames, some redrawn (arms lifted, legs spread) in the sprite's own colours
    master = arms_up(walk('Master', DOWN, 0), rgb('e0394c'), rgb('ef914f'), 3, 'r')          # one arm up, giving the order
    coder1 = legs_apart(arms_up(walk('NinjaMageBlack', DOWN, 0), rgb('5f7160'), rgb('5f7160'), 0, 'l'))   # leaping, one arm out
    designer = legs_apart(walk('Princess', DOWN, 2))                                          # jumping
    scribe = legs_apart(walk('SorcererOrange', DOWN, 1))                                      # mid-air
    monk = arms_up(walk('Monk', DOWN, 0), rgb('d14b34'), rgb('ef914f'), 3, 'r')              # hand up, asking
    noble = arms_up(walk('Noble', DOWN, 0), rgb('4e484a'), rgb('ef914f'), 3)                 # both arms up
    coder2 = walk('NinjaMageOrange', LEFT, 2)                                                 # running in

    spark = lambda k: cut('ninja/fx/spark.png', (30 * k, 0, 30 * k + 30, 35))
    cast = ['<g id="fm-cast">',
            sprite(cut('foreman/owl_perch.png', (0, 0, 16, 32)), 350, 150, 5, gid='prop-owl-perch'),
            sprite(spark(2), 290, 335, 5, gid='fx-spark-1'),
            sprite(spark(6), 455, 330, 5, gid='fx-spark-2'),
            # back row, in the air
            member(scribe, 'scribe', 75, 165, 10, 28, 10, 'char-scribe'),
            sprite(cut('ninja/items/scroll.png'), 250, 235, 5, gid='prop-scroll'),
            member(monk, 'inspector', 560, 170, 10, 28, 5, 'char-inspector'),
            sprite(cut('ninja/fx/emote_question.png'), 715, 135, 5, gid='fx-question'),
            # middle, bigger, either side of the headmaster
            member(coder1, 'coder', 50, 395, 15, 32, 5, 'char-coder-1'),
            member(designer, 'designer', 560, 390, 15, 32, 15, 'char-designer'),
            sprite(cut('ninja/items/potion.png'), 740, 330, 5, gid='prop-potion'),
            # front corners
            member(noble, 'manager', 45, 690, 10, 28, 0, 'char-manager', tag_y=840),
            member(coder2, 'coder', 610, 700, 10, 28, 0, 'char-coder-2', tag_y=845),
            # the headmaster, in front and largest
            member(master, 'foreman', 240, 495, 20, 38, 0, 'char-foreman'),
            '</g>']
    body = replace_group(body, '<g id="fm-cast">', '\n'.join(cast))
    return finish('foreman', svg, P, body, sizes,
                  'FOREMAN 포스터. 캐릭터: foreman 저장소 bridge/static/themes/_shared/ninja/chars 의 Walk.png (Ninja Adventure, CC0). '
                  '팔을 든 모습과 다리를 벌린 모습은 그 그림의 네모를 같은 색으로 옮겨 새로 그린 것. '
                  '소품과 효과: themes/magic/sprites/ninja/items, fx, 부엉이 횃대: themes/magic/sprites/foreman/owl_perch.png')


# =====================================================================================
# INFRA — centre screen = the dashboard photo kept in the infra repo
# =====================================================================================
# Panels cut out of the dashboard photos and floated on the poster, back to front.
# Each window = a title bar set here in large type (the panel's own title, word for word)
# + the chart cut from the photo (title row and legend row left out, so the chart is all that is scaled).
# (name, title, photo, chart crop left/top/right/bottom in photo px, (x, y, width) on the poster, title size, dim 0..1)
INFRA_DIR = os.path.dirname(INFRA_SHOT)
INFRA_PANELS = [
    ('requests', '접속 요청량 (초당, 결과별)', f'{INFRA_DIR}/08_grafana_dashboard.png', (946, 140, 1584, 290), (214, 232, 556), 23, 0.10),
    ('cpu', 'CPU 사용량 (컨테이너별)', f'{INFRA_DIR}/08_grafana_dashboard.png', (817, 368, 1584, 512), (30, 398, 610), 23, 0.05),
    ('answer-time', '답변 걸린 시간 (보통 / 느린 편, 일별)', f'{INFRA_DIR}/08_grafana_petmint.png', (429, 1048, 1001, 1274), (30, 548, 740), 29, 0.0),
]


def build_infra(sizes):
    svg = load('infra')
    P = Poster('infra')
    i, _ = old_type(svg)
    body = svg[:i]
    TITLE = ['inter6', 'noto7']     # Grafana sets panel titles in Inter; Hangul falls to Noto Sans KR
    wins, glows, refl = [], [], []
    front = INFRA_PANELS[-1][0]
    for name, title, src, crop, (x, y, w), tsize, dim in INFRA_PANELS:
        shot = Image.open(src).convert('RGB').crop(crop)
        h = round(w * shot.height / shot.width)
        bar = round(tsize * 1.9)
        uri = data_uri(shot, 'PNG', optimize=True)
        img = f'<image href="{uri}" x="{x}" y="{y + bar}" width="{w}" height="{h}" preserveAspectRatio="none"/>'
        H = bar + h + 10
        wins.append(f'<g id="in-panel-{name}" filter="url(#in-pshadow)">'
                    f'<rect x="{x - 3}" y="{y - 3}" width="{w + 6}" height="{H + 6}" rx="7" fill="#181b1f" '
                    + ('stroke="#7fdcae" stroke-width="2"/>' if name == front else 'stroke="#3f5f55" stroke-width="1.2"/>')
                    + img
                    + P.text(x + 14, y + bar * 0.5 + tsize * 0.36, title, TITLE, tsize, '#e3e4ee')
                    + (f'<rect x="{x - 3}" y="{y - 3}" width="{w + 6}" height="{H + 6}" rx="7" fill="#04060a" opacity="{dim}"/>' if dim else '')
                    + '</g>')
        glows.append(f'<rect x="{x}" y="{y}" width="{w}" height="{H}" fill="#2f6b4a"/>')
        if name == front:
            refl.append(f'<rect x="{x}" y="{y}" width="{w}" height="{H}" fill="#181b1f"/>' + img)
    if 'id="in-pshadow"' not in body:
        body = body.replace('</defs>', '  <filter id="in-pshadow" x="-20%" y="-30%" width="140%" height="170%">'
                            '<feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".75"/></filter>\n</defs>', 1)
    body = replace_group(body, '<g filter="url(#in-glow)" opacity=".9">', '<g filter="url(#in-glow)" opacity=".9">' + ''.join(glows) + '</g>')
    body = replace_group(body, '<g mask="url(#in-reflmask)" opacity=".55">',
                         '<g mask="url(#in-reflmask)" opacity=".55"><g transform="translate(0 1455.4) scale(1 -1)" filter="url(#in-blur)">'
                         + ''.join(refl) + '</g></g>')
    body = replace_group(body, '<g id="in-monitors">', '<g id="in-monitors">' + ''.join(wins) + '</g>')   # after the racks, in front
    return finish('infra', svg, P, body, sizes,
                  'RONANLAB INFRA 포스터. 떠 있는 패널 셋의 그래프: ronanlab-infra/portfolio/img 의 08_grafana_petmint.png (답변 걸린 시간) 와 '
                  '08_grafana_dashboard.png (CPU 사용량, 접속 요청량) 에서 잘라 씀. 패널 제목은 사진의 제목 글을 그대로 크게 다시 앉힌 것')


# =====================================================================================
# RUNSHOES — a real shoe photo from the site, with the detail screen's spec fields on top
# =====================================================================================
def fetch_shoe():
    """Photo of SHOE as the public API serves it. Kept in assets/ so the build works offline."""
    if not os.path.exists(SHOE['file']):
        import urllib.request
        req = urllib.request.Request(SHOE_API + '?size=400', headers={'User-Agent': 'poster-build/0.1'})
        shoes = json.load(urllib.request.urlopen(req, timeout=30))
        url = next(s['image'] for s in shoes if s['id'] == SHOE['id'])
        req = urllib.request.Request(url, headers={'User-Agent': 'poster-build/0.1'})
        open(SHOE['file'], 'wb').write(urllib.request.urlopen(req, timeout=30).read())
    return Image.open(SHOE['file']).convert('RGB')


def white_to_alpha(img):
    """Studio white -> transparent, so the poster's paper and grid show around the shoe."""
    import numpy as np
    a = np.asarray(img).astype('float32') / 255
    alpha = 1 - a.min(axis=2)
    alpha[alpha < 0.03] = 0
    safe = np.where(alpha == 0, 1, alpha)[..., None]
    rgb = np.clip((a - (1 - alpha[..., None])) / safe, 0, 1)
    out = np.dstack([rgb, alpha[..., None]])
    return Image.fromarray((out * 255).round().astype('uint8'), 'RGBA')


def build_runshoes(sizes):
    svg = load('runshoes')
    P = Poster('runshoes')
    i, _ = old_type(svg)
    body = svg[:i]
    INK, ACC, LINE = '#17302e', '#1a7f78', '#0f5550'
    photo = fetch_shoe()
    K, OX, OY = 0.52, 68, 172           # photo px -> poster

    def X(px):
        return OX + K * px

    def Y(py):
        return OY + K * py

    # drop the drawn shoe, keep only the ruler under it
    a = body.index('<g transform="translate(400 452) scale(1.1) translate(-416 -548)">')
    b = body.index('<g id="rs-legend">')
    ruler = ''.join(re.findall(r'<line [^>]*y1="776"[^>]*/>', body[a:b]))
    assert ruler.count('<line') > 20

    halo = 'paint-order="stroke" stroke="#f1f0ec" stroke-width="6" stroke-linejoin="round"'

    def label(x, y, num, name, value, anchor='middle', size=25.5):
        wn = P.measure(num, ['archivo'], size * 0.86, 0.5)
        wt = P.measure(name, ['noto7'], size)
        tot = wn + 8 + wt
        x0 = {'middle': x - tot / 2, 'start': x, 'end': x - tot}[anchor]
        vstack = ['plex', 'noto5']
        vx = {'middle': x, 'start': x0, 'end': x}[anchor]
        return (P.text(x0, y, num, ['archivo'], size * 0.86, ACC, ls=0.5, extra=halo)
                + P.text(x0 + wn + 8, y, name, ['noto7'], size, INK, extra=halo)
                + P.text(vx, y + 28, value, vstack, 21, LINE, anchor, extra=halo))

    def stroke2(d, w=2.2, dash=''):
        da = f' stroke-dasharray="{dash}"' if dash else ''
        return (f'<path d="{d}" fill="none" stroke="#f1f0ec" stroke-width="{w + 3}" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<path d="{d}" fill="none" stroke="{LINE}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"{da}/>')

    def dot(px, py):
        return f'<circle cx="{X(px):.1f}" cy="{Y(py):.1f}" r="6" fill="#fff" stroke="{LINE}" stroke-width="2.2"/>'

    LY = 634                                    # label baseline under the shoe
    top, gnd, fore = Y(545), Y(800), Y(605)      # midsole top at heel, ground, midsole top at forefoot
    dx, bx = X(-22), X(1345)
    art = ['<g id="rs-photo">',
           f'<image id="shoe-photo" href="{data_uri(white_to_alpha(photo), "WEBP", quality=92)}" x="{OX}" y="{OY}" width="{K * photo.width:.1f}" height="{K * photo.height:.1f}"/>',
           # caption: which shoe this is, as the detail screen heads it
           P.text(60, 178, f'NO.{SHOE["id"]}  {SHOE["purpose"]}', ['plex', 'noto5'], 18, ACC),
           P.text(60, 209, f'{SHOE["brand"]} {SHOE["model"]}', ['noto7'], 27, INK),
           # 01 스택하이트 — dimension line beside the heel
           stroke2(f'M{dx - 12:.1f},{top:.1f} H{X(60):.1f} M{dx - 12:.1f},{gnd:.1f} H{X(240):.1f}', 1.8),
           stroke2(f'M{dx:.1f},{top + 2:.1f} V{gnd - 2:.1f} M{dx - 7:.1f},{top + 11:.1f} L{dx:.1f},{top + 2:.1f} L{dx + 7:.1f},{top + 11:.1f} '
                   f'M{dx - 7:.1f},{gnd - 11:.1f} L{dx:.1f},{gnd - 2:.1f} L{dx + 7:.1f},{gnd - 11:.1f}', 2.4),
           label(44, LY, '01', '스택하이트', SHOE['stack'], 'start'),
           # 03 카본 플레이트 — runs inside the midsole; traced along the sidewall line
           stroke2('M' + ' '.join(f'{X(px):.1f},{Y(py):.1f}' for px, py in ((255, 592), (330, 622), (400, 645), (500, 672), (600, 692), (700, 706), (800, 712), (900, 707), (1000, 694), (1065, 672))), 2.4, '10 7'),
           stroke2(f'M{X(860):.1f},{Y(709):.1f} V{LY - 26}', 2.2), dot(860, 709),
           label(X(860) + 14, LY, '03', '카본 플레이트', SHOE['carbon']),
           # 02 미드솔
           stroke2(f'M{X(470):.1f},{Y(740):.1f} V{LY - 26}', 2.2), dot(470, 740),
           label(X(470), LY, '02', '미드솔', SHOE['midsole']),
           '</g>']
    new = (f'<g id="rs-ruler" transform="translate(400 452) scale(1.1) translate(-416 -548)">{ruler}</g>\n' + '\n'.join(art) + '\n')
    body = body[:a] + new + body[b:]

    terms = [('01', '스택하이트', '미드솔 두께: 발밑 쿠션의 양'), ('02', '미드솔', '겉창과 안창 사이의 쿠션층'),
             ('03', '카본 플레이트', '미드솔에 삽입된 탄성판')]
    lg = ['<g id="rs-legend">']
    for k, (num, name, desc) in enumerate(terms):
        x, y = (60, 414)[k % 2], (738, 810)[k // 2]
        wn = P.measure(num, ['archivo'], 23, 0.5)
        lg.append(f'<rect x="{x}" y="{y}" width="3" height="58" fill="{ACC}"/>'
                  + P.text(x + 15, y + 23, num, ['archivo'], 23, ACC, ls=0.5)
                  + P.text(x + 15 + wn + 9, y + 24, name, ['noto7'], 27, INK)
                  # ⓘ = the site's tooltip mark (TermTooltip): every term opens its explanation
                  + P.text(x + 15, y + 53, 'ⓘ', ['noto7'], 19.5, ACC)
                  + P.text(x + 15 + P.measure('ⓘ', ['noto7'], 19.5) + 6, y + 53, desc, ['noto5'], 19.5, '#35504d'))
    lg.append('</g>')
    body = replace_group(body, '<g id="rs-legend">', ''.join(lg))
    return finish('runshoes', svg, P, body, sizes,
                  f'RUNSHOES 포스터. 신발 사진: {SHOE["brand"]} {SHOE["model"]} ({SHOE["model_en"]}), 런슈즈 NO.{SHOE["id"]}, '
                  f'공개 API {SHOE_API} 가 주는 image 주소에서 받음. 스택하이트 {SHOE["stack"]}, 미드솔 {SHOE["midsole"]}, 카본 플레이트 {SHOE["carbon"]}')


# =====================================================================================
# PETMINT — art comes whole from the base (question bubble, 지급 한도, 근거 조항, the three
# characters from petmint-rag-chatbot/web/src/assets/characters). Only the type block changes.
# =====================================================================================
def build_petmint(sizes):
    svg = load('petmint')
    P = Poster('petmint')
    i, _ = old_type(svg)
    return finish('petmint', svg, P, svg[:i], sizes, keep_css=True)


def render(path):
    chrome = glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-*/*/chrome-headless-shell'))[0]
    png = path[:-4] + '.png'
    subprocess.run([chrome, '--no-sandbox', '--hide-scrollbars', '--force-device-scale-factor=2', '--window-size=800,1200',
                    '--virtual-time-budget=4000', f'--screenshot={png}', 'file://' + path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return png


if __name__ == '__main__':
    which = sys.argv[1:] or ['foreman', 'infra', 'runshoes', 'petmint']
    sizes = shared_sizes()
    print('sizes (tagline, tech, footer):', sizes)
    for n in which:
        p = globals()['build_' + n](sizes)
        print(n, os.path.getsize(p) // 1024, 'KB ->', render(p))
