#!/usr/bin/env python3
"""Generate a paint-splatter SVG for a case study thumbnail background.

  python3 tools/splatgen.py <out.svg> [seed]

Aims at thrown paint rather than coloured blobs, which means:
  - a SMALL core relative to its spread; splatter is mostly negative space
  - lobes of uneven depth, so the core silhouette is spiky, not egg shaped
  - tendrils that curve and taper to an actual point, each ending in a droplet
  - droplet sizes on a steep power law: a few big, mostly tiny
  - a throw DIRECTION per cluster, so satellites sit in a cone instead of a ring

Transparent background, so it needs no blend mode. The centre is kept clear
because the thumbnail's main frame sits on top of it.
"""
import math, random, sys

W, H = 800, 520
CLEAR_RX, CLEAR_RY = 170, 104


def catmull_closed(pts, tension=1.0):
    out = ["M %.1f %.1f" % pts[0]]
    n = len(pts)
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension)
        out.append("C %.1f %.1f %.1f %.1f %.1f %.1f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    out.append("Z")
    return " ".join(out)


def core(cx, cy, r, throw):
    """Small, spiky, asymmetric. Lobe depth varies hard from point to point."""
    n = random.randint(16, 20)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = random.random()
        if k < .30:
            rr = r * random.uniform(.52, .68)      # bitten in
        elif k < .72:
            rr = r * random.uniform(.80, 1.0)
        else:
            rr = r * random.uniform(1.18, 1.52)    # pushed out
        rr *= 1 + .20 * math.cos(a - throw)        # fatter along the throw
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return catmull_closed(pts, tension=.85)


def flick(cx, cy, ang, r0, length, w):
    """Curved, tapering to a point. Sags off-axis so it is not a wedge."""
    px, py = -math.sin(ang), math.cos(ang)
    bend = random.uniform(-.34, .34)
    ax, ay = cx + math.cos(ang) * r0, cy + math.sin(ang) * r0
    tx = cx + math.cos(ang) * (r0 + length) + px * bend * length
    ty = cy + math.sin(ang) * (r0 + length) + py * bend * length
    m1x, m1y = cx + math.cos(ang) * (r0 + length * .45) + px * bend * length * .30, \
               cy + math.sin(ang) * (r0 + length * .45) + py * bend * length * .30
    return ("M %.1f %.1f Q %.1f %.1f %.1f %.1f Q %.1f %.1f %.1f %.1f Z" % (
        ax + px * w / 2, ay + py * w / 2,
        m1x + px * w * .34, m1y + py * w * .34, tx, ty,
        m1x - px * w * .30, m1y - py * w * .30,
        ax - px * w / 2, ay - py * w / 2))


def clear_of_centre(x, y, pad=0.0):
    dx = (x - W / 2) / (CLEAR_RX + pad)
    dy = (y - H / 2) / (CLEAR_RY + pad)
    return dx * dx + dy * dy > 1.0


def cluster(cx, cy, r, colour, throw, drops=34, flicks=7, spread=3.4):
    p = ['<path fill="%s" d="%s"/>' % (colour, core(cx, cy, r, throw))]
    for _ in range(flicks):
        a = throw + random.gauss(0, .85)
        ln = r * random.uniform(.7, 2.3)
        p.append('<path fill="%s" d="%s"/>' % (
            colour, flick(cx, cy, a, r * .72, ln, r * random.uniform(.07, .15))))
        tipd = r * .72 + ln
        p.append('<circle fill="%s" cx="%.1f" cy="%.1f" r="%.1f"/>' % (
            colour, cx + math.cos(a) * tipd, cy + math.sin(a) * tipd,
            r * random.uniform(.05, .13)))
    for _ in range(drops):
        a = throw + random.gauss(0, 1.15)
        d = r * (1.05 + random.random() ** 1.7 * spread)
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d
        if not (-20 < x < W + 20 and -20 < y < H + 20) or not clear_of_centre(x, y, 8):
            continue
        # steep power law: mostly specks, a few real drops
        rad = r * (.035 + (random.random() ** 3.2) * .30) * max(.35, 1 - d / (r * spread * 1.5))
        rad = max(rad, .6)
        if random.random() < .40 and rad > 1.4:
            p.append('<ellipse fill="%s" cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" transform="rotate(%.0f %.1f %.1f)"/>'
                     % (colour, x, y, rad * random.uniform(1.6, 2.6), rad * .72,
                        math.degrees(a) + random.uniform(-20, 20), x, y))
        else:
            p.append('<circle fill="%s" cx="%.1f" cy="%.1f" r="%.1f"/>' % (colour, x, y, rad))
    return p


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "splatter.svg"
    random.seed(int(sys.argv[2]) if len(sys.argv) > 2 else 3)
    GREEN, ORANGE, PURPLE, PINK = "#8bd46a", "#f5a623", "#a78bea", "#e879b8"
    b = []
    #                cx    cy    r   colour  throw (radians, points into frame)
    b += cluster(34, 82, 46, GREEN, throw=0.55, drops=38, flicks=8)
    b += cluster(768, 60, 50, ORANGE, throw=2.35, drops=38, flicks=8)
    b += cluster(52, 470, 40, PURPLE, throw=-0.75, drops=32, flicks=7)
    b += cluster(756, 478, 46, PINK, throw=3.75, drops=34, flicks=8)
    b += cluster(330, 6, 15, PINK, throw=1.4, drops=14, flicks=3, spread=4.2)
    b += cluster(505, 514, 14, GREEN, throw=-1.5, drops=14, flicks=3, spread=4.2)
    b += cluster(716, 250, 12, ORANGE, throw=3.0, drops=12, flicks=2, spread=3.0)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">%s</svg>'
           % (W, H, W, H, "".join(b)))
    open(out, "w").write(svg)
    print("wrote", out, len(svg), "bytes,", len(b), "shapes")


main()
