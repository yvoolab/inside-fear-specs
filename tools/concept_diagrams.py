"""Textbook-style 2D concept diagrams (brain / amygdala / neuron) -> devpost/concept/*.svg + .png.

Run: python3 tools/concept_diagrams.py   (PNG via headless Chrome)
"""
import math, os, random, subprocess, pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "devpost" / "concept"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
INK = "#3d302b"
ORANGE, ORANGE_DK = "#ff7a1a", "#a8410a"

STYLE = f"""
<style>
 text {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; fill: {INK}; font-size: 17px; }}
 .title {{ font-size: 26px; font-weight: 700; }}
 .cap {{ font-size: 15px; font-style: italic; fill: #6b5d57; }}
 .lobe {{ font-size: 19px; font-weight: 600; fill: #2c2522; opacity: .75; }}
 .key {{ font-weight: 700; fill: {ORANGE_DK}; font-size: 19px; }}
 .small {{ font-size: 14px; fill: #6b5d57; }}
 .lead {{ stroke: {INK}; stroke-width: 1.1; fill: none; }}
 .keylead {{ stroke: {ORANGE_DK}; stroke-width: 1.8; fill: none; }}
 .ol {{ stroke: {INK}; stroke-width: 2.5; stroke-linejoin: round; }}
 .sul {{ stroke: #5a4842; stroke-width: 1.6; fill: none; opacity: .55; stroke-linecap: round; }}
</style>
<defs>
 <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
  <feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
 </filter>
 <marker id="arrB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2f6db5"/></marker>
 <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#c4361b"/></marker>
 <marker id="arrK" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{INK}"/></marker>
</defs>
"""


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'{STYLE}<rect width="{w}" height="{h}" fill="#fdfbf7"/>{body}</svg>')


def text(x, y, s, cls="", anchor="start"):
    lines = s.split("\n")
    sp = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else 1.15}em">{l}</tspan>' for i, l in enumerate(lines))
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{sp}</text>'


def label(x, y, s, tx, ty, anchor="start", key=False):
    """Text at (x,y) with a leader line to target (tx,ty)."""
    sx = x + (6 if anchor == "end" else -6 if anchor == "start" else 0)
    sy = y - 6 if anchor != "middle" else (y + 8 if ty > y else y - 22)
    lc = "keylead" if key else "lead"
    dot = ORANGE_DK if key else INK
    return (f'<path class="{lc}" d="M{sx},{sy} L{tx},{ty}"/><circle cx="{tx}" cy="{ty}" r="{3 if key else 2.4}" fill="{dot}"/>'
            + text(x, y, s, "key" if key else "", anchor))


ALMOND = "M-26,0 C-18,-17 14,-19 26,-2 C19,14 -14,17 -26,0 Z"

# ---------------------------------------------------------------- Figure 1
# Panel A: lateral view of left hemisphere (anterior = left), limbic structures in projection.
BRAIN = ("M140,330 C90,280 95,170 170,120 C250,60 420,50 530,80 C640,110 710,200 700,300 "
         "C695,340 670,370 630,375 L560,380 C520,420 470,440 420,445 C340,452 262,442 236,402 "
         "C222,378 228,352 250,342 C215,350 170,348 140,330 Z")


def lateral_brain(detail=True):
    lobes = [
        ("#a9c8ea", "0,0 445,0 440,62 380,295 250,342 0,420"),                       # frontal
        ("#f5e19a", "445,0 605,0 600,92 610,300 480,262 380,295 440,62"),           # parietal
        ("#f3c0cc", "605,0 820,0 820,520 622,380 610,300 600,92"),                  # occipital
        ("#c6e3b4", "250,342 380,295 480,262 610,300 622,380 600,520 180,520"),    # temporal
    ]
    g = ['<clipPath id="brainclip"><path d="%s"/></clipPath>' % BRAIN]
    # cerebellum + brainstem sit behind the cerebrum
    g.append('<path class="ol" fill="#e6d3b8" d="M455,385 C450,430 440,470 450,520 L455,575 L503,575 L506,520 C518,470 515,420 505,385 Z"/>')
    g.append('<ellipse class="ol" cx="468" cy="448" rx="30" ry="34" fill="#e6d3b8"/>')
    g.append('<clipPath id="cbclip"><ellipse cx="605" cy="447" rx="90" ry="58"/></clipPath>')
    g.append('<ellipse class="ol" cx="605" cy="447" rx="90" ry="58" fill="#dccbea"/>')
    if detail:
        g.append('<g clip-path="url(#cbclip)">' + "".join(
            f'<path class="sul" d="M512,{y} C560,{y + 9} 650,{y + 9} 700,{y - 5}"/>' for y in range(398, 505, 12)) + "</g>")
    g.append('<g clip-path="url(#brainclip)">' + "".join(
        f'<polygon points="{p}" fill="{c}"/>' for c, p in lobes) + "</g>")
    if detail:
        sulci = ["M180,150 C230,120 300,110 382,104", "M150,240 C200,215 270,200 360,188",
                 "M392,78 C372,150 352,220 334,292", "M482,74 C462,150 442,220 424,272",
                 "M470,170 C520,158 570,150 612,172", "M290,376 C360,350 450,322 560,322",
                 "M302,414 C380,398 470,384 584,366", "M624,148 C652,200 662,250 652,330",
                 "M120,300 C150,290 190,285 230,290", "M540,110 C560,140 575,200 560,240"]
        g.append("".join(f'<path class="sul" d="{d}"/>' for d in sulci))
        g.append(f'<path d="M440,62 C430,110 410,140 415,170 C420,200 390,240 380,295" stroke="{INK}" stroke-width="2.6" fill="none"/>')
        g.append(f'<path d="M250,342 C320,320 400,290 480,262" stroke="{INK}" stroke-width="2.8" fill="none"/>')
    g.append(f'<path class="ol" fill="none" d="{BRAIN}"/>')
    if detail:
        # deep structures (projected)
        g.append('<g opacity=".92">')
        g.append('<ellipse cx="465" cy="250" rx="48" ry="28" fill="#c7b3dd" stroke="#6d5a88" stroke-width="1.6" stroke-dasharray="5 3"/>')
        g.append('<path d="M545,322 C540,260 500,214 452,212 C410,212 390,250 393,300" stroke="#8a7a66" stroke-width="9" fill="none" stroke-linecap="round"/>')
        g.append('<path d="M545,322 C540,260 500,214 452,212 C410,212 390,250 393,300" stroke="#efe6d2" stroke-width="5.5" fill="none" stroke-linecap="round"/>')
        g.append('<ellipse cx="395" cy="318" rx="22" ry="15" fill="#9fd3cf" stroke="#3f7f7a" stroke-width="1.6" stroke-dasharray="5 3"/>')
        g.append('<path d="M392,332 L388,362" stroke="#3f7f7a" stroke-width="3"/><ellipse cx="388" cy="372" rx="12" ry="9" fill="#9fd3cf" stroke="#3f7f7a" stroke-width="1.6"/>')
        hip = "M335,392 C400,396 470,386 520,360 C540,348 548,335 545,322"
        g.append(f'<path d="{hip}" stroke="#a8566a" stroke-width="25" fill="none" stroke-linecap="round"/>')
        g.append(f'<path d="{hip}" stroke="#f2a7b8" stroke-width="20" fill="none" stroke-linecap="round"/>')
        g.append('</g>')
    g.append(f'<path transform="translate(305,386) rotate(-12)" d="{ALMOND}" fill="{ORANGE}" stroke="{ORANGE_DK}" stroke-width="2" filter="url(#glow)"/>')
    return "".join(g)


def fig1():
    S, OX, OY = 0.85, 60, 70
    T = lambda x, y: (round(OX + S * x, 1), round(OY + S * y, 1))
    a = [f'<g transform="translate({OX},{OY}) scale({S})">{lateral_brain()}</g>']
    a += [text(OX + S * 205, OY + S * 215, "Frontal lobe", "lobe", "middle"),
          text(OX + S * 525, OY + S * 165, "Parietal lobe", "lobe", "middle"),
          text(OX + S * 662, OY + S * 290, "Occipital\nlobe", "lobe", "middle")]
    L, R = 128, 668
    for s, tgt, y, side in [
        ("Central sulcus", (418, 160), 108, "L"), ("Lateral sulcus", (330, 314), 330, "L"),
        ("Hypothalamus", (390, 318), 380, "L"), ("Pituitary gland", (384, 375), 430, "L"),
        ("Temporal lobe", (270, 425), 540, "L"),
        ("Fornix", (500, 225), 180, "R"), ("Thalamus", (480, 255), 245, "R"),
        ("Hippocampus", (500, 370), 370, "R"), ("Cerebellum", (640, 455), 455, "R"),
        ("Brainstem", (492, 520), 520, "R")]:
        tx, ty = T(*tgt)
        a.append(label(L if side == "L" else R, y, s, tx, ty, "end" if side == "L" else "start"))
    tx, ty = T(300, 388)
    a.append(label(L, 485, "AMYGDALA", tx, ty, "end", key=True))
    a.append(text(8, 505, "medial temporal lobe,\nin front of hippocampus", "small"))
    a.append(text(410, 650, "A · Lateral view of the left hemisphere — deep limbic structures drawn in projection", "cap", "middle"))
    a.append(f'<path d="M260,612 L200,612" stroke="{INK}" stroke-width="1.4" marker-end="url(#arrK)"/>{text(270,617,"Anterior","small")}'
             f'<path d="M560,612 L620,612" stroke="{INK}" stroke-width="1.4" marker-end="url(#arrK)"/>{text(550,617,"Posterior","small","end")}')
    panel_a = "".join(a)

    # Panel B: coronal section through the amygdala (mirror axis x=440)
    HEMI = ("M435,95 C350,60 210,100 188,220 C180,280 175,330 185,390 C195,450 240,475 290,470 "
            "C335,465 360,440 365,405 C370,385 390,378 410,380 L435,386 Z")
    WM = ("M425,130 C355,108 245,132 228,225 C221,275 218,328 228,382 C238,428 266,438 294,434 "
          "C322,430 336,410 338,388 C340,372 370,357 410,356 L425,356 Z")
    half = [f'<path class="ol" fill="#cdb6ab" d="{HEMI}"/>', f'<path fill="#f7f0e8" d="{WM}"/>']
    half += [f'<path class="sul" style="opacity:.7" d="M{a_},{b} L{c},{d}"/>' for a_, b, c, d in
             [(300, 74, 306, 108), (238, 96, 254, 128), (200, 160, 230, 172), (186, 250, 220, 252),
              (198, 425, 230, 412), (255, 468, 260, 438), (435, 160, 405, 168), (186, 360, 222, 352)]]
    half.append(f'<path d="M183,300 L262,292" stroke="{INK}" stroke-width="3.2"/>')                 # lateral sulcus
    half.append('<path d="M262,262 C272,280 272,305 262,322" stroke="#a88f84" stroke-width="10" fill="none" stroke-linecap="round"/>')  # insula
    half.append('<path fill="#9cc3e0" stroke="#4d7da3" stroke-width="1.4" d="M432,226 C405,224 388,233 380,250 C398,252 418,258 432,266 Z"/>')  # lat. ventricle
    half.append('<ellipse cx="366" cy="258" rx="15" ry="22" fill="#bba398" stroke="#7d665c" stroke-width="1.2"/>')  # caudate
    half.append('<ellipse transform="rotate(10 303 300)" cx="303" cy="300" rx="22" ry="42" fill="#bba398" stroke="#7d665c" stroke-width="1.2"/>')  # putamen
    half.append('<ellipse transform="rotate(10 334 306)" cx="334" cy="306" rx="11" ry="27" fill="#d9cbc0" stroke="#7d665c" stroke-width="1.2"/>')  # globus pallidus
    half.append('<path fill="#9fd3cf" stroke="#3f7f7a" stroke-width="1.2" d="M435,340 C420,342 405,352 404,368 C404,378 418,384 435,386 Z"/>')  # hypothalamus
    half.append('<ellipse transform="rotate(-20 282 404)" cx="282" cy="404" rx="12" ry="4" fill="#9cc3e0" stroke="#4d7da3" stroke-width="1"/>')  # temporal horn
    half.append(f'<path transform="translate(322,386) scale(1.25) rotate(-8)" d="{ALMOND}" fill="{ORANGE}" stroke="{ORANGE_DK}" stroke-width="1.8" filter="url(#glow)"/>')
    h = "".join(half)
    b = [f'<rect x="435" y="290" width="10" height="96" fill="#9cc3e0"/>', h,
         f'<g transform="translate(880,0) scale(-1,1)">{h}</g>',
         f'<path fill="#fbf8f4" stroke="{INK}" stroke-width="1.2" d="M362,206 C400,190 480,190 518,206 L518,224 C480,209 400,209 362,224 Z"/>',
         '<rect x="437" y="222" width="6" height="45" fill="#e9ddd3"/>']
    lab = [("Cerebral cortex\n(gray matter)", (200, 160), 110, "L"), ("White matter", (262, 200), 205, "L"),
           ("Lateral sulcus", (205, 297), 280, "L"), ("Insula", (266, 300), 335, "L"),
           ("Temporal lobe", (215, 440), 455, "L"),
           ("Corpus callosum", (500, 208), 160, "R"), ("Lateral ventricle", (470, 248), 220, "R"),
           ("Caudate nucleus", (515, 258), 265, "R"), ("Globus pallidus", (546, 306), 305, "R"),
           ("Putamen", (578, 300), 345, "R"), ("Third ventricle", (440, 320), 385, "R"),
           ("Hypothalamus", (458, 372), 425, "R")]
    for s, (tx, ty), y, side in lab:
        b.append(label(175 if side == "L" else 712, y, s, tx, ty, "end" if side == "L" else "start"))
    b.append(label(440, 38, "Longitudinal fissure", 440, 112, "middle"))
    b.append(f'<path class="keylead" d="M400,525 L325,402"/><path class="keylead" d="M480,525 L555,402"/>'
             f'<circle cx="325" cy="402" r="3" fill="{ORANGE_DK}"/><circle cx="555" cy="402" r="3" fill="{ORANGE_DK}"/>'
             + text(440, 548, "AMYGDALA (left and right)", "key", "middle"))
    b.append(text(440, 650, "B · Coronal section at the level of the amygdala (front view)", "cap", "middle"))
    b.append(text(130, 600, "Left", "small", "middle") + text(750, 600, "Right", "small", "middle"))
    panel_b = f'<g transform="translate(820,0)">{"".join(b)}</g>'

    body = (text(40, 44, "Figure 1 · Where fear lives — the amygdala in the human brain", "title")
            + f'<g transform="translate(0,30)">{panel_a}</g><g transform="translate(0,30)">{panel_b}</g>'
            + '<line x1="830" y1="90" x2="830" y2="640" stroke="#e3d9d0" stroke-width="1.5"/>')
    return svg(1700, 720, body)


# ---------------------------------------------------------------- Figure 2
def fig2():
    CX, CY = 700, 440
    ALM = "M-260,40 C-220,-150 120,-200 250,-60 C290,-10 250,90 150,150 C20,220 -230,190 -260,40 Z"
    nuclei = [  # fill, polygon (almond-local), label, label pos
        ("#ffb36b", "-300,-250 -40,-250 -60,-60 -130,40 -300,40", "Lateral\nnucleus (LA)", (-165, -45)),
        ("#ff9a45", "-300,40 -130,40 -60,-60 20,40 -20,260 -300,260", "Basal\nnucleus (BA)", (-140, 85)),
        ("#ffc995", "-60,-60 120,-20 110,80 150,260 -20,260 20,40", "Accessory\nbasal (AB)", (50, 70)),
        ("#e2581a", "-40,-250 400,-250 400,-30 120,-20 -60,-60", "Central\nnucleus (CeA)", (95, -95)),
        ("#f6a98c", "120,-20 400,-30 400,260 150,260 110,80", "Medial\nnucleus\n(MeA)", (195, 15)),
    ]
    g = [f'<clipPath id="alm"><path d="{ALM}"/></clipPath>',
         f'<path d="{ALM}" fill="{ORANGE}" filter="url(#glow)" opacity=".55"/>',
         '<g clip-path="url(#alm)">' + "".join(
             f'<polygon points="{p}" fill="{c}" stroke="#a8410a" stroke-width="1.6" stroke-linejoin="round"/>' for c, p, *_ in nuclei) + "</g>",
         f'<path d="{ALM}" fill="none" stroke="{ORANGE_DK}" stroke-width="3"/>']
    for c, p, s, (x, y) in nuclei:
        g.append(text(x, y, s, "", "middle").replace("<text ", '<text style="font-weight:600;font-size:17px" '))
    g += [f'<path d="M-160,5 C-165,25 -160,40 -150,52" stroke="{INK}" stroke-width="2" fill="none" marker-end="url(#arrK)"/>',
          f'<path d="M-100,-95 C-60,-130 0,-130 40,-118" stroke="{INK}" stroke-width="2" fill="none" marker-end="url(#arrK)"/>',
          f'<path d="M-80,60 C-40,20 0,-20 40,-55" stroke="{INK}" stroke-width="2" fill="none" marker-end="url(#arrK)"/>']
    almond = f'<g transform="translate({CX},{CY})">{"".join(g)}</g>'

    def box(x, y, w, title, sub, col):
        return (f'<rect x="{x}" y="{y}" width="{w}" height="66" rx="10" fill="#fff" stroke="{col}" stroke-width="2.2"/>'
                + text(x + w / 2, y + 28, title, "", "middle").replace("<text ", '<text style="font-weight:700" ')
                + text(x + w / 2, y + 50, sub, "small", "middle"))

    def arrow(d, col):
        m = "arrB" if col == "#2f6db5" else "arrR"
        return f'<path d="{d}" stroke="{col}" stroke-width="3" fill="none" marker-end="url(#{m})"/>'

    B, Rd = "#2f6db5", "#c4361b"
    parts = [
        almond,
        box(40, 150, 260, "Sensory thalamus", "fast, rough “low road”", B),
        box(40, 300, 260, "Sensory cortex", "slower, detailed “high road”", B),
        box(40, 620, 260, "Hippocampus", "context: where &amp; when", B),
        box(560, 100, 280, "Prefrontal cortex", "top-down regulation, extinction", "#6d5a88"),
        box(1100, 130, 270, "Hypothalamus", "stress hormones (cortisol)", Rd),
        box(1100, 290, 270, "Periaqueductal gray", "freezing", Rd),
        box(1100, 450, 270, "Brainstem nuclei", "heart rate ↑ · breathing ↑ · startle", Rd),
        arrow("M300,183 C400,190 450,300 505,365", B),
        arrow("M300,333 C380,338 430,360 500,390", B),
        arrow("M300,653 C420,650 500,600 545,548", B),
        f'<path d="M700,168 L700,292" stroke="#6d5a88" stroke-width="3" fill="none" marker-start="url(#arrK)" marker-end="url(#arrK)"/>',
        arrow("M885,335 C960,300 1000,180 1098,165", Rd),
        arrow("M905,370 C980,350 1020,325 1098,323", Rd),
        arrow("M895,405 C980,420 1020,470 1098,482", Rd),
        text(700, 660, "Fear learning: a tone/sight (LA) paired with danger → CeA drives the body’s fear response", "small", "middle"),
        text(350, 566, "lateral", "small", "middle") + text(1015, 566, "medial", "small", "middle"),
        f'<path d="M385,561 L430,561" stroke="#6b5d57" stroke-width="1.2" marker-start="url(#arrK)"/><path d="M925,561 L970,561" stroke="#6b5d57" stroke-width="1.2" marker-end="url(#arrK)"/>',
        # legend
        f'<path d="M1100,640 L1150,640" stroke="{B}" stroke-width="3" marker-end="url(#arrB)"/>' + text(1160, 646, "input to amygdala"),
        f'<path d="M1100,675 L1150,675" stroke="{Rd}" stroke-width="3" marker-end="url(#arrR)"/>' + text(1160, 681, "output from amygdala"),
        f'<path d="M1100,710 L1150,710" stroke="{INK}" stroke-width="2" marker-end="url(#arrK)"/>' + text(1160, 716, "flow inside amygdala"),
    ]
    # locator inset (reuse lateral outline)
    inset = (f'<g transform="translate(400,700) scale(0.17)">{lateral_brain(detail=False)}</g>'
             + text(470, 812, "location: medial temporal lobe", "small", "middle"))
    body = (text(40, 44, "Figure 2 · The amygdala up close — its nuclei and the fear circuit", "title")
            + text(40, 72, "Left amygdala, front (coronal) view. Each side of the brain has one, about the size of an almond (~1.5 cm).", "cap")
            + "".join(parts) + inset)
    return svg(1400, 830, body)


# ---------------------------------------------------------------- Figure 3
def fig3():
    rnd = random.Random(7)
    SOMA = (300, 340)
    out, fill = [], []

    def branch(x, y, ang, length, w, depth):
        ex, ey = x + length * math.cos(ang), y + length * math.sin(ang)
        mx = (x + ex) / 2 + rnd.uniform(-10, 10)
        my = (y + ey) / 2 + rnd.uniform(-10, 10)
        d = f"M{x:.1f},{y:.1f} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f}"
        out.append(f'<path d="{d}" stroke="{INK}" stroke-width="{w + 2.6:.1f}" fill="none" stroke-linecap="round"/>')
        fill.append(f'<path d="{d}" stroke="#f3b9a2" stroke-width="{w:.1f}" fill="none" stroke-linecap="round"/>')
        if depth:
            for s in (-1, 1):
                branch(ex, ey, ang + s * rnd.uniform(0.3, 0.6), length * rnd.uniform(0.6, 0.8), max(w * 0.62, 1.4), depth - 1)

    for deg in (100, 135, 165, 195, 228, 262, 300, 62):
        a = math.radians(deg)
        branch(SOMA[0] + 45 * math.cos(a), SOMA[1] + 45 * math.sin(a), a, rnd.uniform(70, 95), 11, 3)

    soma = (f'<path d="M300,282 C335,282 352,312 362,332 C352,352 335,392 300,396 C262,398 244,370 242,340 '
            f'C242,308 262,282 300,282 Z" fill="#f3b9a2" stroke="{INK}" stroke-width="2.6"/>')
    hillock = f'<path d="M352,322 L398,334 L398,346 L352,358 Z" fill="#f3b9a2" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>'
    nucleus = '<circle cx="296" cy="338" r="25" fill="#b9a0d8" stroke="#5c4590" stroke-width="2"/><circle cx="302" cy="333" r="8" fill="#5c4590"/>'
    axon = f'<path d="M396,340 L1090,340" stroke="{INK}" stroke-width="11"/><path d="M396,340 L1090,340" stroke="#f3b9a2" stroke-width="7"/>'
    myelin = "".join(f'<rect x="{x}" y="323" width="88" height="34" rx="16" fill="#f7efcf" stroke="{INK}" stroke-width="2"/>'
                     for x in range(420, 1040, 102))
    schwann = '<ellipse cx="566" cy="327" rx="18" ry="6" fill="#d7c38a" stroke="#8a7440" stroke-width="1.4"/>'
    term = []
    for ey in (250, 300, 350, 400, 445):
        d = f"M1088,340 C1130,340 1150,{ey} 1205,{ey}"
        term.append(f'<path d="{d}" stroke="{INK}" stroke-width="8" fill="none"/><path d="{d}" stroke="#f3b9a2" stroke-width="4.5" fill="none"/>')
        term.append(f'<circle cx="1214" cy="{ey}" r="13" fill="#f3b9a2" stroke="{INK}" stroke-width="2.2"/>')
    pulse = (f'<path d="M520,262 L860,262" stroke="{ORANGE}" stroke-width="4" marker-end="url(#arrR)"/>'
             + text(690, 250, "direction of the nerve impulse (electrical signal)", "small", "middle"))

    # synapse inset
    IX, IY, IR = 860, 600, 150
    vesicles = "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="#fff6e0" stroke="#a8410a" stroke-width="1.6"/>'
                       f'<circle cx="{x - 3}" cy="{y - 2}" r="2.4" fill="{ORANGE}"/><circle cx="{x + 3}" cy="{y + 3}" r="2.4" fill="{ORANGE}"/>'
                       for x, y in [(800, 540), (830, 560), (865, 548), (900, 562), (935, 545), (850, 590), (915, 595)])
    nts = "".join(f'<circle cx="{x}" cy="{y}" r="3" fill="{ORANGE}"/>' for x, y in
                  [(820, 612), (838, 616), (856, 611), (872, 617), (889, 612), (905, 618), (928, 613)])
    recs = "".join(f'<rect x="{x}" y="622" width="9" height="12" rx="2" fill="#2f6db5"/>' for x in range(780, 950, 24))
    inset = (f'<clipPath id="ins"><circle cx="{IX}" cy="{IY}" r="{IR}"/></clipPath>'
             f'<g clip-path="url(#ins)"><rect x="{IX - IR}" y="{IY - IR}" width="{2 * IR}" height="{2 * IR}" fill="#fff"/>'
             f'<path d="M690,450 L1030,450 L1030,520 C1000,590 960,604 860,604 C760,604 720,590 690,520 Z" fill="#f3b9a2" stroke="{INK}" stroke-width="2.4"/>'
             f'<ellipse cx="790" cy="490" rx="34" ry="15" fill="#f6d27a" stroke="#9a7a20" stroke-width="1.6"/>'
             f'<path d="M762,490 C770,480 774,500 782,490 C790,480 794,500 802,490 C810,480 814,500 820,490" stroke="#9a7a20" stroke-width="1.4" fill="none"/>'
             f'{vesicles}<path d="M690,628 C760,622 960,622 1030,628 L1030,760 L690,760 Z" fill="#cfe0f3" stroke="{INK}" stroke-width="2.4"/>'
             f'{recs}{nts}</g><circle cx="{IX}" cy="{IY}" r="{IR}" fill="none" stroke="{INK}" stroke-width="2.6"/>')
    zoom = f'<path d="M1214,413 L985,520" stroke="#8c7d76" stroke-width="1.4" stroke-dasharray="6 4"/><circle cx="1214" cy="400" r="20" fill="none" stroke="#8c7d76" stroke-width="1.4" stroke-dasharray="6 4"/>'

    labs = [label(130, 130, "Dendrites", 190, 210, "end"),
            label(160, 470, "Cell body (soma)", 270, 385, "end"),
            label(400, 470, "Nucleus", 300, 350, "start"),
            label(440, 440, "Axon hillock", 384, 348, "start"),
            label(560, 405, "Schwann cell", 566, 331, "middle"),
            label(700, 405, "Myelin sheath", 690, 357, "middle"),
            label(800, 200, "Node of Ranvier", 820, 340, "middle"),
            label(1000, 200, "Axon", 990, 340, "middle"),
            label(1260, 200, "Axon terminals", 1214, 250, "middle"),
            label(660, 520, "Mitochondrion", 770, 492, "end"),
            label(660, 575, "Synaptic vesicle", 800, 552, "end"),
            label(660, 640, "Synaptic cleft", 735, 616, "end"),
            label(660, 700, "Postsynaptic neuron", 760, 680, "end"),
            label(1060, 560, "Presynaptic terminal", 1000, 500, "start"),
            label(1060, 625, "Neurotransmitter", 905, 616, "start"),
            label(1060, 690, "Receptor", 932, 628, "start"),
            text(IX, IY + IR + 30, "Synapse (magnified)", "", "middle").replace("<text ", '<text style="font-weight:700" ')]
    body = (text(40, 44, "Figure 3 · A neuron — how a fear signal travels", "title")
            + text(40, 72, "The amygdala is made of millions of these cells; a signal passes dendrite → cell body → axon → synapse → next neuron.", "cap")
            + "".join(out) + "".join(fill) + soma + hillock + nucleus + axon + myelin + schwann + "".join(term)
            + pulse + zoom + inset + "".join(labs))
    return svg(1400, 800, body)


# ---------------------------------------------------------------- Figure 4 (anime cel style)
OL = "#3a1020"


def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    x = u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3
    y = u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3
    dx = 3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2)
    dy = 3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2)
    return x, y, math.degrees(math.atan2(dy, dx))


def cpath(p):
    (a, b), (c, d), (e, f), (g, h) = p
    return f"M{a},{b} C{c},{d} {e},{f} {g},{h}"


def tower(uid, cx, by, s, col, shade, hi, rnd):
    """Neuron as a cel-shaded building: dome soma + branching dendrite antennae."""
    top = by - 170 * s
    soma = (f"M{cx - 75 * s},{by} C{cx - 85 * s},{by - 110 * s} {cx - 35 * s},{top} {cx},{top} "
            f"C{cx + 35 * s},{top} {cx + 85 * s},{by - 110 * s} {cx + 75 * s},{by} Z")
    outs, fills, his, tips = [], [], [], []

    def br(x, y, ang, L, w, d):
        ex, ey = x + L * math.cos(ang), y + L * math.sin(ang)
        mx, my = (x + ex) / 2 + rnd.uniform(-8, 8) * s, (y + ey) / 2 + rnd.uniform(-8, 8) * s
        dd = f"M{x:.1f},{y:.1f} Q{mx:.1f},{my:.1f} {ex:.1f},{ey:.1f}"
        outs.append(f'<path d="{dd}" stroke="{OL}" stroke-width="{w + 5:.1f}" fill="none" stroke-linecap="round"/>')
        fills.append(f'<path d="{dd}" stroke="{col}" stroke-width="{w:.1f}" fill="none" stroke-linecap="round"/>')
        his.append(f'<path d="{dd}" transform="translate({-w * .22:.1f},0)" stroke="{hi}" stroke-width="{max(w * .25, 1):.1f}" fill="none" stroke-linecap="round" opacity=".9"/>')
        if d:
            for k in (-1, 1):
                br(ex, ey, ang + k * rnd.uniform(.3, .55), L * rnd.uniform(.62, .78), max(w * .62, 2.2), d - 1)
        else:
            tips.append((ex, ey))

    for deg, L in ((-90, 105), (-122, 95), (-58, 95), (-155, 80), (-25, 80)):
        a = math.radians(deg + rnd.uniform(-6, 6))
        br(cx + 55 * s * math.cos(a), by - 95 * s + 75 * s * math.sin(a), a, L * s, 16 * s, 3)
    g = outs + fills + his
    g += [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{6.5 * s:.1f}" fill="#fff4c8" stroke="{OL}" stroke-width="2" filter="url(#glow)"/>' for x, y in tips]
    g += [f'<clipPath id="sc{uid}"><path d="{soma}"/></clipPath>',
          f'<path d="{soma}" fill="{col}"/>',
          f'<g clip-path="url(#sc{uid})"><ellipse cx="{cx + 70 * s}" cy="{by - 40 * s}" rx="{80 * s}" ry="{170 * s}" fill="{shade}"/>'
          f'<path d="M{cx - 50 * s},{by - 40 * s} C{cx - 55 * s},{by - 110 * s} {cx - 30 * s},{top + 25 * s} {cx - 8 * s},{top + 18 * s}" stroke="{hi}" stroke-width="{7 * s}" fill="none" stroke-linecap="round"/></g>',
          f'<path d="{soma}" fill="none" stroke="{OL}" stroke-width="4" stroke-linejoin="round"/>',
          # nucleus = glowing round window
          f'<circle cx="{cx}" cy="{by - 88 * s}" r="{30 * s}" fill="#fff0b8" stroke="{OL}" stroke-width="3.5" filter="url(#glow)"/>',
          f'<circle cx="{cx + 7 * s}" cy="{by - 93 * s}" r="{11 * s}" fill="#ffb347" stroke="{OL}" stroke-width="2"/>',
          f'<path d="M{cx - 18 * s},{by - 100 * s} A{22 * s},{22 * s} 0 0 1 {cx - 2 * s},{by - 112 * s}" stroke="#fff" stroke-width="{4 * s}" fill="none" stroke-linecap="round"/>',
          # door / axon hillock at base
          f'<path d="M{cx - 20 * s},{by} L{cx - 20 * s},{by - 30 * s} A{20 * s},{20 * s} 0 0 1 {cx + 20 * s},{by - 30 * s} L{cx + 20 * s},{by} Z" fill="{shade}" stroke="{OL}" stroke-width="3"/>']
    return "".join(g)


def cable(p, core="#ffd166"):
    d = cpath(p)
    return (f'<path d="{d}" stroke="{core}" stroke-width="11" fill="none" filter="url(#glow)"/>'
            f'<path d="{d}" stroke="{OL}" stroke-width="24" fill="none" stroke-dasharray="48 36" stroke-linecap="round"/>'
            f'<path d="{d}" stroke="#ffe9cf" stroke-width="18" fill="none" stroke-dasharray="48 36" stroke-linecap="round"/>'
            f'<path d="{d}" transform="translate(0,-4)" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="40 44" stroke-dashoffset="-4" stroke-linecap="round" opacity=".8"/>')


def comet(p, t, flip=False):
    x, y, a = bez(p, t)
    if flip:
        a += 180
    return (f'<g transform="translate({x:.1f},{y - 2:.1f}) rotate({a:.1f})">'
            f'<path d="M-70,0 L0,-7 L0,7 Z" fill="#fff7c2" opacity=".85"/>'
            f'<path d="M-45,-14 L-10,-10 M-55,12 L-12,9" stroke="#fff7c2" stroke-width="2.5" stroke-linecap="round"/>'
            f'<circle r="11" fill="#fffbe6" stroke="#ff9d2e" stroke-width="3" filter="url(#glow)"/></g>')


def callout(x, y, w, lines, tx, ty, rot=0):
    h = 18 + 24 * len(lines)
    body = "".join(f'<text x="{x + 16}" y="{y + 30 + 24 * i}" style="font-size:{19 if i == 0 else 16}px;font-weight:{800 if i == 0 else 500};fill:#1d0b12">{l}</text>' for i, l in enumerate(lines))
    return (f'<g transform="rotate({rot} {x} {y})"><path d="M{x + w * .3},{y + h - 2} L{tx},{ty} L{x + w * .45},{y + h - 2}" fill="#fff" stroke="#1d0b12" stroke-width="3" stroke-linejoin="round"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#fff" stroke="#1d0b12" stroke-width="3.5"/>'
            f'<rect x="{x + 3}" y="{y + 3}" width="{w - 6}" height="{h - 6}" rx="11" fill="none" stroke="#ffd2dc" stroke-width="2"/>{body}</g>')


def face(mood, uid):
    """Chibi face per emotion: cheer · startled · scared · panic · easing · calm (narrator-local coords)."""
    SK = "#ffe1cf"

    def eye(ex, shock=False, teary=False, closed=False):
        if closed:
            return f'<path d="M{ex - 16},-248 Q{ex},-266 {ex + 16},-248" stroke="{OL}" stroke-width="5" fill="none" stroke-linecap="round"/>'
        r = (19, 23) if shock else (17, 21)
        e = f'<ellipse cx="{ex}" cy="-252" rx="{r[0]}" ry="{r[1]}" fill="#fff" stroke="{OL}" stroke-width="3"/>'
        if shock:
            e += f'<ellipse cx="{ex}" cy="-250" rx="6" ry="8" fill="#4b6cd6"/><circle cx="{ex}" cy="-250" r="3" fill="#1d1840"/>'
        else:
            e += (f'<ellipse cx="{ex}" cy="-249" rx="13" ry="17" fill="#4b6cd6"/><ellipse cx="{ex}" cy="-244" rx="10" ry="9" fill="#7fa0ff"/>'
                  f'<ellipse cx="{ex}" cy="-251" rx="6" ry="9" fill="#1d1840"/>'
                  f'<circle cx="{ex - 5}" cy="-259" r="5" fill="#fff"/><circle cx="{ex + 5}" cy="-242" r="2.5" fill="#fff"/>')
        e += f'<path d="M{ex - 19},-264 Q{ex},-280 {ex + 19},-266" stroke="{OL}" stroke-width="5" fill="none" stroke-linecap="round"/>'
        if teary:
            sx = -1 if ex < 0 else 1
            e += (f'<ellipse cx="{ex}" cy="-236" rx="15" ry="5" fill="#8fd3ff" opacity=".9"/>'
                  f'<path d="M{ex + 12 * sx},-236 C{ex + 16 * sx},-222 {ex + 12 * sx},-212 {ex + 18 * sx},-198" stroke="#8fd3ff" stroke-width="6" fill="none" stroke-linecap="round"/>')
        return e

    def brows(lift):  # lift = how much the inner ends rise (worry)
        return "".join(f'<path d="M{48 * k},-284 Q{30 * k},{-288 - lift / 2} {14 * k},{-284 - lift}" stroke="{OL}" stroke-width="4.5" fill="none" stroke-linecap="round"/>' for k in (-1, 1))

    def sweat(x, y, sc=1.0):
        return (f'<path transform="translate({x},{y}) scale({sc})" d="M0,0 C10,14 10,24 0,26 C-10,24 -10,14 0,0 Z" fill="#8fd3ff" stroke="{OL}" stroke-width="2"/>'
                f'<circle cx="{x - 2}" cy="{y + 17}" r="2.5" fill="#fff"/>')

    blush = '<ellipse cx="-52" cy="-226" rx="12" ry="6" fill="#ff8fa6" opacity=".7"/><ellipse cx="52" cy="-226" rx="12" ry="6" fill="#ff8fa6" opacity=".7"/>'
    mouths = {
        "cheer": f'<path d="M-13,-224 Q0,-206 13,-224 Z" fill="#b0304a" stroke="{OL}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-6,-214 Q0,-209 6,-214" stroke="#ff8fa6" stroke-width="3" fill="none"/>',
        "o": f'<ellipse cx="0" cy="-218" rx="7" ry="9" fill="#b0304a" stroke="{OL}" stroke-width="2.5"/>',
        "wavy": f'<path d="M-15,-219 L-8,-224 L-1,-218 L6,-224 L13,-219" stroke="{OL}" stroke-width="3" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
        "shout": f'<ellipse cx="0" cy="-216" rx="15" ry="12" fill="#b0304a" stroke="{OL}" stroke-width="2.5"/><ellipse cx="0" cy="-210" rx="8" ry="4" fill="#ff8fa6"/>',
        "soft": f'<path d="M-10,-220 Q0,-214 10,-220" stroke="{OL}" stroke-width="3" fill="none" stroke-linecap="round"/>',
    }
    f = []
    if mood == "cheer":
        f += [eye(-30), eye(30), blush, mouths["cheer"]]
    elif mood == "startled":
        f += [eye(-30, shock=True), eye(30, shock=True), mouths["o"], sweat(74, -310),
              f'<text x="110" y="-350" style="font-size:78px;font-weight:900;fill:#ff3b30;stroke:{OL};stroke-width:5px;paint-order:stroke">!</text>'
              f'<path d="M96,-392 L82,-410 M118,-400 L122,-422 M140,-386 L154,-400" stroke="{OL}" stroke-width="4" stroke-linecap="round"/>']
    elif mood == "scared":
        f += [eye(-30), eye(30), brows(14), mouths["wavy"], sweat(74, -312), sweat(-86, -290, .8)]
    elif mood == "panic":
        f += [f'<clipPath id="fc{uid}"><ellipse cx="0" cy="-272" rx="76" ry="66"/></clipPath>'
              f'<g clip-path="url(#fc{uid})"><rect x="-80" y="-345" width="160" height="60" fill="#6f8fe8" opacity=".45"/>'
              + "".join(f'<path d="M{x},-338 L{x},-296" stroke="#3f5fc8" stroke-width="3" opacity=".7"/>' for x in (-40, -24, -8, 8, 24, 40)) + '</g>',
              eye(-30, shock=True, teary=True), eye(30, shock=True, teary=True), brows(18), mouths["shout"],
              sweat(76, -318), sweat(-90, -300), sweat(92, -270, .7),
              "".join(f'<path d="M{k * 92},-190 q{k * 10},-14 0,-28 M{k * 104},-180 q{k * 12},-20 0,-44" stroke="{OL}" stroke-width="3.5" fill="none" stroke-linecap="round"/>' for k in (-1, 1))]
    elif mood == "easing":
        f += [eye(-30), eye(30), brows(6), blush, mouths["soft"], sweat(76, -310, .8),
              f'<g fill="#fff" stroke="{OL}" stroke-width="2.5"><circle cx="40" cy="-206" r="9"/><circle cx="54" cy="-212" r="12"/><circle cx="70" cy="-206" r="9"/></g>']
    else:  # calm
        f += [eye(-30, closed=True), eye(30, closed=True), blush, blush, mouths["cheer"]]
        f += [f'<path transform="translate({x},{y}) scale({sc})" d="M0,-14 L4,-4 L14,0 L4,4 L0,14 L-4,4 L-14,0 L-4,-4 Z" fill="#fff36b" stroke="{OL}" stroke-width="2"/>'
              for x, y, sc in ((104, -330, 1.2), (-110, -300, 1), (120, -240, .8))]
    return '<g transform="translate(0,6)">' + "".join(f) + "</g>"


def narrator(x, y, s, rnd, hair="#d4a017", hair_hi="#f6dc7a", tip="#ffb347", uid="n", ant=None, mood="cheer"):
    """Original chibi tour-guide neuron: dendrite hair, headset mic, almond flag. Origin = feet."""
    SK, NV, NVD = "#ffe1cf", "#1fcf9c", "#0e8a6c"
    g = ['<ellipse cx="0" cy="0" rx="64" ry="12" fill="#000" opacity=".22"/>']
    # flag pole (behind hand)
    g.append(f'<path d="M-100,-30 L-100,-440" stroke="{OL}" stroke-width="10" stroke-linecap="round"/><path d="M-100,-30 L-100,-440" stroke="#d9b27a" stroke-width="5" stroke-linecap="round"/>')
    g.append(f'<path d="M-100,-438 L-30,-416 L-100,-392 Z" fill="#ff8a3d" stroke="{OL}" stroke-width="3.5" stroke-linejoin="round"/>'
             f'<path transform="translate(-76,-415) scale(.42) rotate(-12)" d="{ALMOND}" fill="#fff" stroke="{OL}" stroke-width="4"/>')
    # legs + boots
    for lx in (-30, 10):
        g.append(f'<rect x="{lx}" y="-74" width="20" height="66" rx="8" fill="#2a2f4a" stroke="{OL}" stroke-width="3"/>')
    for bx in (-21, 21):
        g.append(f'<path d="M{bx - 17},-2 Q{bx - 17},-22 {bx},-22 Q{bx + 17},-22 {bx + 17},-2 Z" fill="#6b2f1e" stroke="{OL}" stroke-width="3"/>')
    # jacket
    body = "M-46,-198 C-60,-150 -64,-110 -64,-62 L64,-62 C64,-110 60,-150 46,-198 Q0,-212 -46,-198 Z"
    g.append(f'<clipPath id="nb{uid}"><path d="{body}"/></clipPath><path d="{body}" fill="{NV}"/>'
             f'<g clip-path="url(#nb{uid})"><ellipse cx="58" cy="-120" rx="34" ry="100" fill="{NVD}"/><rect x="-70" y="-86" width="140" height="11" fill="{NVD}"/></g>'
             f'<path d="{body}" fill="none" stroke="{OL}" stroke-width="4" stroke-linejoin="round"/>'
             f'<path d="M0,-176 L0,-64" stroke="{NVD}" stroke-width="3"/>'
             f'<path d="M-32,-202 L0,-172 L32,-202 Q0,-212 -32,-202 Z" fill="#fff" stroke="{OL}" stroke-width="3" stroke-linejoin="round"/>'
             f'<path d="M-8,-188 L8,-188 L5,-152 L0,-144 L-5,-152 Z" fill="#ff8a3d" stroke="{OL}" stroke-width="2.5" stroke-linejoin="round"/>'
             f'<rect x="-50" y="-150" width="34" height="17" rx="3" fill="#ffd166" stroke="{OL}" stroke-width="2.5"/>'
             f'<text x="-33" y="-138" text-anchor="middle" style="font-size:9px;font-weight:900;fill:{OL}">GUIDE</text>')
    # arms: pointing (viewer's right) + flag hand
    g.append(f'<path d="M40,-186 Q92,-200 126,-250" stroke="{OL}" stroke-width="30" fill="none" stroke-linecap="round"/>'
             f'<path d="M40,-186 Q92,-200 126,-250" stroke="{NV}" stroke-width="23" fill="none" stroke-linecap="round"/>'
             f'<path d="M134,-258 L156,-284" stroke="{OL}" stroke-width="12" stroke-linecap="round"/><path d="M134,-258 L156,-284" stroke="{SK}" stroke-width="7" stroke-linecap="round"/>'
             f'<circle cx="132" cy="-256" r="14" fill="{SK}" stroke="{OL}" stroke-width="3"/>')
    g.append(f'<path d="M-42,-186 Q-80,-160 -94,-126" stroke="{OL}" stroke-width="30" fill="none" stroke-linecap="round"/>'
             f'<path d="M-42,-186 Q-80,-160 -94,-126" stroke="{NV}" stroke-width="23" fill="none" stroke-linecap="round"/>'
             f'<circle cx="-98" cy="-118" r="14" fill="{SK}" stroke="{OL}" stroke-width="3"/>')
    # dendrite hair antennae (behind hair mass)
    tips, outs, fills = [], [], []

    def br(bx, by, ang, L, w, d):
        ex, ey = bx + L * math.cos(ang), by + L * math.sin(ang)
        dd = f"M{bx:.1f},{by:.1f} Q{(bx + ex) / 2 + rnd.uniform(-5, 5):.1f},{(by + ey) / 2:.1f} {ex:.1f},{ey:.1f}"
        outs.append(f'<path d="{dd}" stroke="{OL}" stroke-width="{w + 4:.1f}" fill="none" stroke-linecap="round"/>')
        fills.append(f'<path d="{dd}" stroke="{ant or hair}" stroke-width="{w:.1f}" fill="none" stroke-linecap="round"/>')
        if d:
            for k in (-1, 1):
                br(ex, ey, ang + k * .5, L * .7, max(w * .6, 2.5), d - 1)
        else:
            tips.append((ex, ey))

    for bx, deg in ((-34, -118), (0, -90), (34, -62)):
        br(bx, -352, math.radians(deg), 46, 10, 2)
    g += outs + ([f'<g filter="url(#glow)">{"".join(fills)}</g>'] if ant else fills)
    g += [f'<circle cx="{tx:.1f}" cy="{ty:.1f}" r="{10 if ant else 7}" fill="{tip}" stroke="{OL}" stroke-width="2" filter="url(#glow)"/>' for tx, ty in tips]
    # head
    g.append(f'<ellipse cx="0" cy="-298" rx="88" ry="74" fill="{hair}" stroke="{OL}" stroke-width="4"/>'
             f'<path d="M-84,-300 C-96,-260 -90,-230 -78,-212 L-62,-236 Z M84,-300 C96,-260 90,-230 78,-212 L62,-236 Z" fill="{hair}" stroke="{OL}" stroke-width="3.5" stroke-linejoin="round"/>'
             f'<rect x="-11" y="-218" width="22" height="24" fill="{SK}" stroke="{OL}" stroke-width="3"/>'
             f'<ellipse cx="0" cy="-272" rx="76" ry="66" fill="{SK}" stroke="{OL}" stroke-width="4"/>')
    # bangs
    g.append(f'<path d="M-80,-282 C-78,-350 -30,-366 0,-363 C30,-366 78,-350 80,-282 L66,-298 L56,-280 L44,-304 L28,-286 L14,-310 L0,-290 L-14,-310 L-28,-286 L-44,-304 L-56,-280 L-66,-298 Z" fill="{hair}" stroke="{OL}" stroke-width="4" stroke-linejoin="round"/>'
             f'<path d="M-52,-334 Q-22,-352 12,-346" stroke="{hair_hi}" stroke-width="6" fill="none" stroke-linecap="round"/>')
    g.append(face(mood, uid))
    # headset mic
    g.append(f'<ellipse cx="76" cy="-262" rx="9" ry="14" fill="#3b3b4a" stroke="{OL}" stroke-width="2.5"/>'
             f'<path d="M74,-250 Q70,-218 24,-220" stroke="#3b3b4a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="22" cy="-220" r="6" fill="#3b3b4a"/>')
    return f'<g transform="translate({x},{y}) scale({s})">{"".join(g)}</g>'


def bubble(x, y, w, lines, tx, ty):
    h = 22 + 27 * len(lines)
    body = "".join(f'<text x="{x + 22}" y="{y + 36 + 27 * i}" style="font-size:{22 if i == 0 else 19}px;font-weight:{800 if i == 0 else 600};fill:#1d0b12">{l}</text>' for i, l in enumerate(lines))
    return (f'<path d="M{x + w * .25},{y + h - 4} L{tx},{ty} L{x + w * .42},{y + h - 4}" fill="#fff" stroke="#1d0b12" stroke-width="4" stroke-linejoin="round"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2.2:.0f}" fill="#fff" stroke="#1d0b12" stroke-width="4"/>'
            f'<path d="M{x + w * .25 + 4},{y + h - 4} L{x + w * .42 - 4},{y + h - 4}" stroke="#fff" stroke-width="6"/>{body}')


def scene_base(rnd, W=1600, H=900, HZ=560):
    d = ['<defs>'
         '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d0b23"/><stop offset=".55" stop-color="#9c2b4b"/><stop offset="1" stop-color="#f08a98"/></linearGradient>'
         '<linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e07a8c"/><stop offset="1" stop-color="#8e2344"/></linearGradient>'
         '<radialGradient id="beam" cx="0" cy="0.5" r="1"><stop offset="0" stop-color="#ff5a36" stop-opacity=".55"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient>'
         '<filter id="bokeh"><feGaussianBlur stdDeviation="6"/></filter></defs>',
         f'<rect width="{W}" height="{H}" fill="url(#sky)"/>']
    # far tissue: soft cell bubbles on the horizon
    for i in range(60):
        x, y, r = rnd.uniform(0, W), rnd.uniform(HZ - 140, HZ + 10), rnd.uniform(18, 60)
        d.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="#f3a3b1" opacity="{rnd.uniform(.12, .3):.2f}"/>')
    # far neurons (silhouettes)
    for x, s in ((200, .38), (560, .32), (1050, .34), (1390, .4), (700, .26), (1530, .3)):
        d.append(f'<g opacity=".45">{tower(f"f{x}", x, HZ + 8, s, "#f7b6c4", "#e58ea2", "#ffe0e7", rnd)}</g>')
    # ceiling membrane
    d.append(f'<path d="M0,0 L{W},0 L{W},95 C1450,150 1300,60 1150,112 C1000,165 850,70 700,122 C550,172 400,82 250,132 C150,162 60,112 0,142 Z" fill="#5a1230" stroke="{OL}" stroke-width="4"/>')
    d.append("".join(f'<path d="M{x},0 C{x + 20},40 {x - 10},80 {x + 15},{110 + (x % 3) * 12}" stroke="#7d2245" stroke-width="5" fill="none" stroke-linecap="round"/>' for x in range(60, W, 110)))
    # ground of packed cells, perspective rows
    d.append(f'<rect x="0" y="{HZ}" width="{W}" height="{H - HZ}" fill="url(#gnd)"/>')
    rows = []
    t = 0.02
    while t < 1.05:
        y = HZ + (H - HZ) * t ** 1.5
        rx = 16 + 120 * t
        off = rnd.uniform(0, rx * 2)
        x = -rx + off
        while x < W + rx:
            c = rnd.choice(["#ec8d9d", "#e27b8e", "#f39fac"])
            rows.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rx * .92:.0f}" ry="{rx * .26:.0f}" fill="{c}" stroke="#a83a58" stroke-width="{1 + 2.2 * t:.1f}"/>'
                        f'<path d="M{x - rx * .5:.0f},{y - rx * .1:.0f} Q{x - rx * .1:.0f},{y - rx * .2:.0f} {x + rx * .2:.0f},{y - rx * .14:.0f}" stroke="#ffd6de" stroke-width="{1 + 2 * t:.1f}" fill="none" stroke-linecap="round"/>')
            x += rx * 2
        t += 0.045 + 0.09 * t
    d.append("".join(rows))
    return d


def fig4():
    W, H, HZ = 1600, 900, 560
    rnd = random.Random(11)
    d = scene_base(rnd, W, H, HZ)
    # side tissue walls
    lw = "M0,900 L0,0 L170,0 C110,150 165,300 120,450 C85,600 150,760 240,900 Z"
    d.append(f'<path d="{lw}" fill="#b23656" stroke="{OL}" stroke-width="5"/>'
             f'<path d="M150,0 C95,150 148,300 104,450 C70,600 132,760 218,900" stroke="#7f2040" stroke-width="22" fill="none"/>'
             + "".join(f'<path d="M0,{y} C40,{y - 18} 80,{y - 10} {120 - abs(450 - y) * .05:.0f},{y - 30}" stroke="#d65b79" stroke-width="5" fill="none" stroke-linecap="round"/>' for y in range(80, 900, 95)))
    d.append(f'<g transform="translate({W},0) scale(-1,1)"><path d="{lw}" fill="#b23656" stroke="{OL}" stroke-width="5"/>'
             f'<path d="M150,0 C95,150 148,300 104,450 C70,600 132,760 218,900" stroke="#7f2040" stroke-width="22" fill="none"/>'
             + "".join(f'<path d="M0,{y} C40,{y - 18} 80,{y - 10} {120 - abs(450 - y) * .05:.0f},{y - 30}" stroke="#d65b79" stroke-width="5" fill="none" stroke-linecap="round"/>' for y in range(60, 900, 95)) + "</g>")
    # axon cables
    R_IN = ((-40, 720), (90, 650), (230, 640), (365, 662))      # from auditory thalamus into LA
    R1 = ((440, 662), (540, 790), (690, 780), (745, 668))        # LA -> CeA
    R2 = ((862, 668), (960, 840), (1280, 860), (1640, 770))      # CeA -> body
    for p in (R_IN, R1, R2):
        d.append(cable(p))
    # alarm beams behind the central tower
    for a in (-160, -120, -60, -20):
        d.append(f'<path transform="translate(800,345) rotate({a})" d="M0,-6 L520,-70 L520,70 L0,6 Z" fill="url(#beam)"/>')
    # towers
    d.append(tower("L", 400, 668, 1.0, "#8fb4ff", "#6a8fe0", "#d6e4ff", rnd))
    d.append(tower("R", 1235, 668, 1.05, "#8fb4ff", "#6a8fe0", "#d6e4ff", rnd))
    d.append(tower("C", 803, 672, 1.5, "#ff8a3d", "#e0602a", "#ffd0a3", rnd))
    # siren beacon on CeA
    d.append(f'<path d="M772,428 L772,404 A31,31 0 0 1 834,404 L834,428 Z" fill="#ff3b30" stroke="{OL}" stroke-width="4" filter="url(#glow)"/>'
             f'<rect x="762" y="426" width="82" height="14" rx="4" fill="#4a4a5a" stroke="{OL}" stroke-width="3"/>'
             f'<path d="M786,398 A14,14 0 0 1 800,388" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>'
             + "".join(f'<path d="M{803 + 48 * math.cos(math.radians(a)):.0f},{405 + 48 * math.sin(math.radians(a)):.0f} L{803 + 70 * math.cos(math.radians(a)):.0f},{405 + 70 * math.sin(math.radians(a)):.0f}" stroke="#ffe066" stroke-width="6" stroke-linecap="round"/>' for a in (-160, -130, -90, -50, -20)))
    # synapse bridge: right neuron's axon terminal -> CeA dendrite
    pre = ((1180, 560), (1120, 470), (1060, 440), (1012, 430))
    post = ((900, 540), (930, 470), (940, 445), (968, 432))
    d.append(f'<path d="{cpath(pre)}" stroke="{OL}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="{cpath(pre)}" stroke="#8fb4ff" stroke-width="10" fill="none" stroke-linecap="round"/>'
             f'<path d="{cpath(post)}" stroke="{OL}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="{cpath(post)}" stroke="#ff8a3d" stroke-width="10" fill="none" stroke-linecap="round"/>'
             f'<circle cx="1018" cy="430" r="22" fill="#8fb4ff" stroke="{OL}" stroke-width="4"/><circle cx="1012" cy="424" r="5" fill="#fff"/>'
             f'<path d="M958,410 A24,24 0 0 1 958,452 L966,452 A22,22 0 0 0 966,410 Z" fill="#ff8a3d" stroke="{OL}" stroke-width="4"/>'
             + "".join(f'<circle cx="{x}" cy="{y}" r="4.5" fill="#fff36b" stroke="#ff7a1a" stroke-width="1.5" filter="url(#glow)"/>' for x, y in ((990, 420), (982, 434), (994, 441), (976, 424), (986, 449))))
    # pulses
    d += [comet(R_IN, .55), comet(R1, .35), comet(R1, .8), comet(R2, .3), comet(R2, .62)]
    # street sign
    d.append(f'<rect x="1012" y="560" width="12" height="150" fill="#9aa0ad" stroke="{OL}" stroke-width="3"/>'
             f'<rect x="900" y="500" width="300" height="78" rx="8" fill="#2f6db5" stroke="{OL}" stroke-width="4"/>'
             f'<rect x="907" y="507" width="286" height="64" rx="5" fill="none" stroke="#fff" stroke-width="2.5"/>'
             f'<text x="1050" y="542" text-anchor="middle" style="font-size:30px;font-weight:900;fill:#fff;letter-spacing:3px">AMYGDALA</text>'
             f'<text x="1050" y="564" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#dbe8ff;letter-spacing:1px">CENTRAL NUCLEUS · FEAR ALARM</text>')
    # foreground floating vesicles
    for x, y, r in ((150, 820, 46), (1480, 180, 38), (1330, 840, 60), (90, 230, 30), (560, 190, 22)):
        d.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffd0dc" opacity=".35" filter="url(#bokeh)"/>')
    # callouts
    d.append(narrator(215, 885, 1.18, random.Random(5)))
    d.append(bubble(40, 150, 470, ["Hi! I'm Neuri, your guide.", "You're inside the amygdala now —", "follow me: fear starts right here!"], 200, 405))
    d.append(callout(1300, 300, 230, ["SYNAPSE", "messengers jump the gap"], 1000, 425, 2))
    d.append(callout(500, 800, 265, ["AXON CABLE", "the fear signal races along it"], 610, 768, -1))
    d.append(callout(1290, 690, 250, ["ALARM OUT → BODY", "heart pounds · you freeze"], 1450, 805, 1))
    d.append(f'<rect x="0" y="0" width="{W}" height="54" fill="#1d0b12" opacity=".75"/>'
             f'<text x="24" y="36" style="font-size:24px;font-weight:800;fill:#fff">Concept · Inside the amygdala — follow the guide</text>'
             f'<text x="{W - 24}" y="36" text-anchor="end" style="font-size:16px;fill:#ffd2dc">calm neurons blue · firing neurons orange · glowing beads = nerve impulses</text>')
    return svg(W, H, "".join(d))


# ---------------------------------------------------------------- Figure 5: storyboard
BLUE = ("#8fb4ff", "#6a8fe0", "#d6e4ff")
ORNG = ("#ff8a3d", "#e0602a", "#ffd0a3")
PURP = ("#b28cff", "#8d63e0", "#e6d9ff")


def sign(x, y, w, t1, t2=None, col="#2f6db5"):
    h = 92 if t2 else 70
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{col}" stroke="{OL}" stroke-width="5"/>'
           f'<rect x="{x + 8}" y="{y + 8}" width="{w - 16}" height="{h - 16}" rx="6" fill="none" stroke="#fff" stroke-width="3"/>'
           f'<text x="{x + w / 2}" y="{y + 50}" text-anchor="middle" style="font-size:40px;font-weight:900;fill:#fff;letter-spacing:2px">{t1}</text>')
    if t2:
        out += f'<text x="{x + w / 2}" y="{y + 78}" text-anchor="middle" style="font-size:22px;font-weight:700;fill:#e6efff">{t2}</text>'
    return out


def thalamus(x, y):
    return (f'<rect x="{x - 130}" y="{y - 200}" width="260" height="200" rx="18" fill="#b9a7e0" stroke="{OL}" stroke-width="5"/>'
            f'<rect x="{x + 40}" y="{y - 200}" width="90" height="200" rx="18" fill="#9886c8"/>'
            f'<rect x="{x - 130}" y="{y - 200}" width="260" height="200" rx="18" fill="none" stroke="{OL}" stroke-width="5"/>'
            + "".join(f'<rect x="{x - 100 + 60 * i}" y="{y - 160}" width="38" height="38" rx="6" fill="#fff0b8" stroke="{OL}" stroke-width="3"/>' for i in range(4))
            + f'<path d="M{x},{y - 200} L{x},{y - 250}" stroke="{OL}" stroke-width="8"/>'
            f'<path d="M{x - 60},{y - 300} Q{x},{y - 220} {x + 60},{y - 300}" fill="#e6e0f5" stroke="{OL}" stroke-width="5"/>'
            f'<circle cx="{x}" cy="{y - 290}" r="9" fill="#ff5a36"/>')


def synapse_big(cx, cy, pre_from, post_to, pre_col, post_col):
    pre = (pre_from, (pre_from[0] + 40, cy + 60), (cx - 120, cy), (cx - 40, cy))
    post = (post_to, (post_to[0] - 40, cy + 60), (cx + 120, cy), (cx + 44, cy))
    out = ""
    for pth, col in ((pre, pre_col), (post, post_col)):
        out += f'<path d="{cpath(pth)}" stroke="{OL}" stroke-width="30" fill="none" stroke-linecap="round"/><path d="{cpath(pth)}" stroke="{col}" stroke-width="22" fill="none" stroke-linecap="round"/>'
    out += (f'<circle cx="{cx - 40}" cy="{cy}" r="48" fill="{pre_col}" stroke="{OL}" stroke-width="5"/>'
            + "".join(f'<circle cx="{cx - 52 + dx}" cy="{cy + dy}" r="11" fill="#fff6e0" stroke="{OL}" stroke-width="2"/>' for dx, dy in ((-10, -18), (8, 10), (-14, 20), (12, -12)))
            + f'<path d="M{cx + 22},{cy - 52} A52,52 0 0 1 {cx + 22},{cy + 52} L{cx + 40},{cy + 52} A50,50 0 0 0 {cx + 40},{cy - 52} Z" fill="{post_col}" stroke="{OL}" stroke-width="5"/>'
            + "".join(f'<circle cx="{cx + dx}" cy="{cy + dy}" r="7" fill="#fff36b" stroke="#ff7a1a" stroke-width="2" filter="url(#glow)"/>'
                      for dx, dy in ((0, -30), (10, -6), (-4, 16), (14, 34), (6, -46), (-6, 40), (16, 8))))
    return out


def burst(cx, cy, r, txt):
    pts = " ".join(f"{cx + (r if i % 2 == 0 else r * .72) * math.cos(math.radians(i * 15)) * 1.9:.0f},{cy + (r if i % 2 == 0 else r * .72) * math.sin(math.radians(i * 15)):.0f}" for i in range(24))
    return (f'<polygon points="{pts}" fill="#ff3b30" stroke="{OL}" stroke-width="5" stroke-linejoin="round"/>'
            f'<text x="{cx}" y="{cy + 14}" text-anchor="middle" style="font-size:40px;font-weight:900;fill:#fff">{txt}</text>')


def badge(cx, cy, icon, txt, col):
    return (f'<circle cx="{cx}" cy="{cy}" r="62" fill="#fff" stroke="{OL}" stroke-width="5"/>'
            f'<text x="{cx}" y="{cy + 24}" text-anchor="middle" style="font-size:66px;font-weight:900;fill:{col}">{icon}</text>'
            f'<text x="{cx - 80}" y="{cy + 14}" text-anchor="end" style="font-size:38px;font-weight:900;fill:#fff;stroke:{OL};stroke-width:8px;paint-order:stroke">{txt}</text>')


def scene(i, guide=False):
    rnd = random.Random(30 + i)
    d = scene_base(rnd)
    ant = {1: None, 2: "#ff8a3d", 3: "#ff8a3d", 4: "#ff3b30", 5: "#5ec8ff", 6: None}[i]
    if i == 1:
        rin = ((1010, 650), (900, 720), (760, 720), (690, 668))
        d += [cable(rin), thalamus(1150, 680), tower("a1", 600, 668, 1.1, *BLUE, rnd), comet(rin, .15),
              sign(1000, 330, 300, "THALAMUS", "sensory relay", "#6d5a88"), burst(1240, 150, 70, "“How could you?!”")]
        d += [f'<path d="M1480,{y} A{r},{r} 0 0 0 1480,{y + 2 * r}" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".85"/>'
              for y, r in ((250, 40), (210, 80), (170, 120))]
    elif i == 2:
        rin = ((1180, 650), (1000, 760), (760, 760), (650, 668))
        d += [cable(rin), thalamus(1310, 680), tower("a2", 560, 668, 1.1, *ORNG, rnd),
              comet(rin, .2), comet(rin, .5), comet(rin, .8), sign(820, 250, 380, "LOW ROAD", "fast shortcut", "#c4361b")]
        d.append(f'<circle cx="1010" cy="160" r="70" fill="#fff" stroke="{OL}" stroke-width="6"/><rect x="995" y="70" width="30" height="22" rx="4" fill="{OL}"/>'
                 f'<path d="M1010,160 L1010,108 M1010,160 L1048,180" stroke="#ff3b30" stroke-width="8" stroke-linecap="round"/>'
                 f'<text x="1100" y="175" style="font-size:44px;font-weight:900;fill:#fff;stroke:{OL};stroke-width:8px;paint-order:stroke">split second!</text>')
    elif i == 3:
        d += [tower("a3", 420, 668, 1.1, *ORNG, rnd), tower("c3", 1180, 672, 1.2, *ORNG, rnd),
              synapse_big(800, 430, (470, 560), (1120, 540), "#ff8a3d", "#ff8a3d"),
              sign(610, 210, 380, "GLUTAMATE", "messengers cross the gap", "#c4361b")]
    elif i == 4:
        for a in (-150, -110, -70, -30):
            d.append(f'<path transform="translate(760,330) rotate({a})" d="M0,-6 L520,-80 L520,80 L0,6 Z" fill="url(#beam)"/>')
        d.append(tower("c4", 760, 672, 1.35, *ORNG, rnd))
        d.append(f'<path d="M732,350 L732,326 A28,28 0 0 1 788,326 L788,350 Z" fill="#ff3b30" stroke="{OL}" stroke-width="4" filter="url(#glow)"/>')
        for y, ic, t, c in ((250, "♥", "HEART ↑", "#e0245e"), (450, "≋", "BREATH ↑", "#2f9bd5"), (650, "❄", "FREEZE", "#5b8def")):
            d.append(f'<path d="M860,{560 + (y - 450) * .3:.0f} C1000,{y} 1150,{y} 1300,{y}" stroke="{OL}" stroke-width="20" fill="none"/>'
                     f'<path d="M860,{560 + (y - 450) * .3:.0f} C1000,{y} 1150,{y} 1300,{y}" stroke="#ff3b30" stroke-width="12" fill="none" marker-end="url(#arrR)"/>')
            d.append(badge(1400, y, ic, t, c))
    elif i == 5:
        d += [tower("c5", 620, 672, 1.2, "#ffb07a", "#e38a55", "#ffe0c8", rnd), tower("p5", 1230, 650, 1.35, *PURP, rnd)]
        for k in range(3):
            y0 = 380 + 40 * k
            pts = " ".join(f"{x},{y0 + 18 * math.sin((x - 760) / 38 + k)}" for x in range(1110, 760, -12))
            d.append(f'<polyline points="{pts}" stroke="#8fdcff" stroke-width="9" fill="none" stroke-linecap="round" filter="url(#glow)"/>')
        d.append(sign(950, 190, 560, "PREFRONTAL CORTEX", "“only words, not danger”", "#6d5a88"))
    else:
        d += [tower("a6", 420, 668, 1.0, *BLUE, rnd), tower("c6", 800, 672, 1.3, *BLUE, rnd), tower("b6", 1210, 668, 1.0, *BLUE, rnd),
              sign(560, 200, 480, "CALM AGAIN", "stress hormones clear slowly", "#2f6db5")]
    if guide:
        d.append(narrator(230, 885, 1.1, random.Random(5), tip=ant or "#fff4c8", uid=f"s{i}", ant=ant, mood=STEPS5[i - 1][2]))
    return "".join(d)


STEPS5 = [  # title, when, Neuri's mood, what Neuri says (first person: feeling + what her amygdala is doing)
    ("Sound arrives", "t = 0", "startled",
     "I just heard Mom scold me: “How could you?!” I jumped! Right now the sound is going from my ears to my thalamus, the relay station in my brain."),
    ("The fast shortcut", "a split second", "scared",
     "I'm scared, and I don't even know why yet. A shortcut has already carried the sound straight into my amygdala, faster than I can understand the words."),
    ("Neurons fire", "a split second", "scared",
     "My whole body tenses up. Inside my amygdala, neurons are firing: glutamate jumps across the synapses and the signal races to the central nucleus."),
    ("Alarm goes out", "within seconds", "panic",
     "My heart is pounding, I can't move... I just want to run away! My amygdala's alarm told my hypothalamus and brainstem: adrenaline, fast breathing, freeze!"),
    ("The slow road checks", "a moment later", "easing",
     "Wait... it's only words. Mom isn't dangerous. My prefrontal cortex checks the details and tells my amygdala to calm down. Phew."),
    ("Fear fades", "minutes", "calm",
     "My breathing slows down and I feel calm again. My neurons have settled, but stress hormones take a while to fade, so I still feel a bit shaky."),
]


def child(mood, uid):
    """Neuri herself, outside: the scolded child. Same hair, colours and face set as the inside guide."""
    SK = "#ffe1cf"
    shirt = "M-74,0 C-74,-90 -64,-168 -42,-198 Q0,-212 42,-198 C64,-168 74,-90 74,0 Z"
    return (f'<path d="{shirt}" fill="#1fcf9c" stroke="{OL}" stroke-width="4"/>'
            f'<path d="M-22,-202 Q0,-186 22,-202" stroke="{OL}" stroke-width="3" fill="none"/>'
            f'<ellipse cx="0" cy="-298" rx="86" ry="72" fill="#d4a017" stroke="{OL}" stroke-width="4"/>'
            f'<rect x="-11" y="-218" width="22" height="20" fill="{SK}" stroke="{OL}" stroke-width="3"/>'
            f'<ellipse cx="0" cy="-272" rx="76" ry="66" fill="{SK}" stroke="{OL}" stroke-width="4"/>'
            f'<path d="M-80,-282 C-78,-350 -30,-366 0,-363 C30,-366 78,-350 80,-282 L66,-298 L56,-280 L44,-304 L28,-286 L14,-310 L0,-290 L-14,-310 L-28,-286 L-44,-304 L-56,-280 L-66,-298 Z" fill="#d4a017" stroke="{OL}" stroke-width="4" stroke-linejoin="round"/>'
            + face(mood, uid))


def outside(i):
    mood = STEPS5[i - 1][2]
    d = ['<rect width="800" height="900" fill="#f6e7d3"/><rect y="760" width="800" height="140" fill="#c99a6b"/>'
         f'<path d="M0,760 L800,760" stroke="{OL}" stroke-width="4"/>'
         '<rect x="520" y="120" width="200" height="150" rx="6" fill="#bfe3f2" stroke="#8a6a4a" stroke-width="8"/>',
         f'<g transform="translate(400,850) scale(1.65)">{child(mood, f"o{i}")}</g>']
    if i <= 2:  # the scolding adult: looming arm + angry words
        d.append(f'<path d="M-20,250 L180,300 L240,280 L300,286 L240,306 L190,330 L-20,330 Z" fill="#4a3b52" stroke="{OL}" stroke-width="5" stroke-linejoin="round"/>')
        d.append(burst(330, 125, 95 if i == 1 else 70, "How could you?!").replace("font-size:40px", f"font-size:{44 if i == 1 else 32}px"))
    if i == 4:
        d.append(f'<text x="600" y="520" style="font-size:56px;font-weight:900;fill:#ff3b30;stroke:#fff;stroke-width:8px;paint-order:stroke">RUN?!</text>'
                 f'<path d="M560,560 L700,560 M580,590 L720,590" stroke="{OL}" stroke-width="5" stroke-linecap="round" stroke-dasharray="18 12"/>')
        d.append(f'<text x="470" y="760" style="font-size:90px;fill:#e0245e;stroke:{OL};stroke-width:5px;paint-order:stroke">♥</text>'
                 f'<text x="560" y="690" style="font-size:44px;font-weight:900;fill:#e0245e;stroke:#fff;stroke-width:8px;paint-order:stroke">THUMP</text>'
                 f'<text x="580" y="740" style="font-size:34px;font-weight:900;fill:#e0245e;stroke:#fff;stroke-width:8px;paint-order:stroke">THUMP</text>')
    if i == 5:
        d.append(f'<g fill="#fff" stroke="{OL}" stroke-width="4"><ellipse cx="560" cy="150" rx="200" ry="80"/><circle cx="430" cy="270" r="18"/><circle cx="400" cy="310" r="11"/></g>'
                 f'<text x="560" y="164" text-anchor="middle" style="font-size:40px;font-weight:800;fill:#1d0b12">only words…</text>')
    d.append(f'<rect x="16" y="16" width="230" height="56" rx="10" fill="#1d0b12" opacity=".8"/><text x="131" y="55" text-anchor="middle" style="font-size:32px;font-weight:900;fill:#fff">OUTSIDE</text>')
    return "".join(d)


def fig5():
    import textwrap
    PW, OW, SW, SH, CH = 800, 270, 520, 293, 150
    W, H = 24 * 3 + 2 * PW, 80 + 3 * (SH + CH + 24)
    out = [text(24, 50, "Storyboard · Neuri tells us what she feels (left) while we watch her amygdala (right)", "title")]
    for k, (title, when, mood, quote) in enumerate(STEPS5):
        x = 24 + (k % 2) * (PW + 24)
        y = 80 + (k // 2) * (SH + CH + 24)
        out.append(f'<svg x="{x}" y="{y}" width="{OW}" height="{SH}" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">{outside(k + 1)}</svg>'
                   f'<svg x="{x + PW - SW}" y="{y}" width="{SW}" height="{SH}" viewBox="0 0 1600 900">{scene(k + 1)}'
                   f'<rect x="16" y="16" width="230" height="56" rx="10" fill="#1d0b12" opacity=".8"/><text x="131" y="55" text-anchor="middle" style="font-size:32px;font-weight:900;fill:#fff">INSIDE</text></svg>'
                   f'<rect x="{x + OW}" y="{y}" width="{PW - OW - SW}" height="{SH}" fill="{OL}"/>'
                   f'<rect x="{x}" y="{y}" width="{PW}" height="{SH + CH}" rx="10" fill="none" stroke="{OL}" stroke-width="3"/>'
                   f'<rect x="{x}" y="{y + SH}" width="{PW}" height="{CH}" fill="#fff" stroke="{OL}" stroke-width="3"/>'
                   f'<circle cx="{x + 30}" cy="{y + SH + 30}" r="17" fill="#ff8a3d" stroke="{OL}" stroke-width="2.5"/>'
                   f'<text x="{x + 30}" y="{y + SH + 37}" text-anchor="middle" style="font-size:19px;font-weight:900;fill:#fff">{k + 1}</text>'
                   f'<text x="{x + 56}" y="{y + SH + 37}" style="font-size:20px;font-weight:800">{title}</text>'
                   f'<text x="{x + PW - 14}" y="{y + SH + 37}" text-anchor="end" class="cap">{when} · feeling: {mood}</text>')
        for j, line in enumerate(textwrap.wrap("Neuri: “" + quote + "”", 92)):
            out.append(f'<text x="{x + 16}" y="{y + SH + 68 + 22 * j}" style="font-size:16px">{line}</text>')
    return svg(W, H, "".join(out))


def render(name, s, w, h):
    p = OUT / f"{name}.svg"
    p.write_text(s)
    png = OUT / f"{name}.png"
    tmp = pathlib.Path(os.environ.get("TMPDIR", "/tmp")) / "concept-chrome"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={tmp}",
                    f"--window-size={w},{h}", "--force-device-scale-factor=2", f"--screenshot={png}", p.as_uri()],
                   check=True, capture_output=True)
    print(png)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    render("fig1-brain-amygdala", fig1(), 1700, 720)
    render("fig2-amygdala-closeup", fig2(), 1400, 830)
    render("fig3-neuron", fig3(), 1400, 800)
    render("fig4-inside-amygdala-anime", fig4(), 1600, 900)
    render("fig5-storyboard", fig5(), 1672, 1481)
