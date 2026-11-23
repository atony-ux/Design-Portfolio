"""Turn walkthrough recordings (henningtee.mjs) into one looping video's frames.
  python3 compose.py <desk-dir> <mob-dir> <out-frames-dir> [speed] [fps]
Desktop in a browser window, then the phone, with eased camera zooms from the
recorded marks, a drawn cursor (desktop) or touch dots (phone), and a crossfade
back to the first frame so the clip loops."""
import sys, json, bisect, math, os
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFilter

OW, OH = 1920, 1080
BG = (232, 232, 230)
desk_dir, mob_dir, out_dir = sys.argv[1:4]
SPEED = float(sys.argv[4]) if len(sys.argv) > 4 else 1.5
FPS = int(sys.argv[5]) if len(sys.argv) > 5 else 30
FADE = 0.6
SS = 2  # static layers are drawn at 2x and scaled with the camera

def ease(u): u = max(0.0, min(1.0, u)); return 4*u*u*u if u < .5 else 1 - (-2*u + 2)**3 / 2

class Seg:
    def __init__(self, d, kind):
        self.d, self.kind = d, kind
        L = json.load(open(os.path.join(d, "log.json")))
        self.L = L; vp = L["vp"]; self.W, self.H = vp["w"], vp["h"]
        self.ts = [f["t"] for f in L["frames"]]; self.fs = [f["f"] for f in L["frames"]]
        self.ct = [c["t"] for c in L["cursor"]]
        self.t0, self.t1 = L["t0"], L["t1"]
        self.dur = (self.t1 - self.t0) / SPEED
        fw, fh = Image.open(os.path.join(d, self.fs[0])).size
        self.fw, self.fh = fw, fh
        if kind == "desk":
            pw = 1536; self.s = pw / self.W; ph = self.H * self.s; bar = 38
            x0 = (OW - pw) / 2; y0 = (OH - ph - bar) / 2 + bar
            self.page = (x0, y0, x0 + pw, y0 + ph); self.rad = 14
            self.body = (x0, y0 - bar, x0 + pw, y0 + ph)
        else:
            ph = 880; self.s = ph / self.H; pw = self.W * self.s
            x0 = (OW - pw) / 2; y0 = (OH - ph) / 2
            self.page = (x0, y0, x0 + pw, y0 + ph); self.rad = 46
            b = 13; self.body = (x0 - b, y0 - b, x0 + pw + b, y0 + ph + b)
        self.static = None; self.mask = None

    def build(self):
        if self.static: return
        img = Image.new("RGB", (OW*SS, OH*SS), BG)
        sh = Image.new("L", (OW*SS, OH*SS), 0); d = ImageDraw.Draw(sh)
        bx0, by0, bx1, by1 = [v*SS for v in self.body]
        r = (self.rad + (13 if self.kind == "mob" else 0)) * SS
        d.rounded_rectangle((bx0, by0 + 18*SS, bx1, by1 + 18*SS), r, fill=70)
        sh = sh.filter(ImageFilter.GaussianBlur(30*SS))
        img.paste((40, 40, 50), (0, 0), sh)
        d = ImageDraw.Draw(img)
        if self.kind == "desk":
            d.rounded_rectangle((bx0, by0, bx1, by1), self.rad*SS, fill=(255, 255, 255), outline=(214, 214, 214), width=SS)
            cy = by0 + 19*SS
            for i, c in enumerate([(255, 95, 87), (254, 188, 46), (40, 200, 64)]):
                cx = bx0 + (22 + i*20)*SS; d.ellipse((cx - 6*SS, cy - 6*SS, cx + 6*SS, cy + 6*SS), fill=c)
            ux0, ux1 = (bx0 + bx1)/2 - 210*SS, (bx0 + bx1)/2 + 210*SS
            d.rounded_rectangle((ux0, cy - 13*SS, ux1, cy + 13*SS), 8*SS, fill=(241, 241, 240))
            try:
                from PIL import ImageFont
                f = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 14*SS)
            except Exception: f = None
            d.text(((ux0 + ux1)/2, cy), "henningtee.vercel.app", fill=(110, 110, 110), font=f, anchor="mm")
        else:
            d.rounded_rectangle((bx0, by0, bx1, by1), (self.rad + 13)*SS, fill=(18, 18, 20))
            d.rounded_rectangle((bx0 + 2*SS, by0 + 2*SS, bx1 - 2*SS, by1 - 2*SS), (self.rad + 11)*SS, outline=(70, 70, 74), width=2*SS)
        self.static = img
        m = Image.new("L", (self.fw, self.fh), 0); k = self.fw / (self.page[2] - self.page[0])
        r = self.rad * k
        ImageDraw.Draw(m).rounded_rectangle((0, -r if self.kind == "desk" else 0, self.fw - 1, self.fh - 1), r, fill=255)
        self.mask = m

    def rt(self, T): return self.t0 + T * SPEED      # output seconds -> recorded clock

    def frame_at(self, t):
        i = max(0, bisect.bisect_right(self.ts, t) - 1)
        return Image.open(os.path.join(self.d, self.fs[i])).convert("RGB")

    def cam_for(self, m):
        x, y, w, h = m["rect"]
        if x <= 1 and y <= 1 and w >= self.W - 1 and h >= self.H - 1: return (OW/2, OH/2, 1.0)
        px0, py0 = self.page[0], self.page[1]
        wx, wy, ww, wh = px0 + x*self.s, py0 + y*self.s, w*self.s, h*self.s
        z = min(OW/ww, OH/wh, m.get("zoomMax") or 2.4); z = max(1.0, z)
        cx, cy = wx + ww/2, wy + wh/2
        vw, vh = OW/z/2, OH/z/2
        # keep the view on the page (or the phone)
        lo_x, hi_x = min(self.body[0], OW/2) , max(self.body[2], OW/2)
        lo_y, hi_y = min(self.body[1] - 20, OH/2), max(self.body[3] + 20, OH/2)
        cx = min(max(cx, lo_x + vw), hi_x - vw) if hi_x - lo_x > 2*vw else (lo_x + hi_x)/2
        cy = min(max(cy, lo_y + vh), hi_y - vh) if hi_y - lo_y > 2*vh else (lo_y + hi_y)/2
        return (cx, cy, z)

    def camera(self, t):
        cam = (OW/2, OH/2, 1.0)
        for m in self.L["marks"]:
            if m["t"] > t: break
            tgt = self.cam_for(m); dur = max(0.01, m.get("ease") or 0.9) * 1.25
            u = ease((t - m["t"]) / dur)
            # zoom in log space so it feels even
            z = math.exp(math.log(cam[2]) + (math.log(tgt[2]) - math.log(cam[2])) * u)
            cam = (cam[0] + (tgt[0] - cam[0]) * u, cam[1] + (tgt[1] - cam[1]) * u, z)
        return cam

    def pointer(self, t):
        C = self.L["cursor"]
        if not C: return None
        i = bisect.bisect_right(self.ct, t) - 1
        if i < 0: c = C[0]; return (c["x"], c["y"], None, 99, 99)
        c = C[i]
        if i + 1 < len(C) and C[i+1]["t"] - c["t"] < 0.2:
            n = C[i+1]; u = (t - c["t"]) / max(1e-6, n["t"] - c["t"]); x = c["x"] + (n["x"] - c["x"])*u; y = c["y"] + (n["y"] - c["y"])*u
        else: x, y = c["x"], c["y"]
        # touch state: seconds since last down / up
        last_down = max((C[j]["t"] for j in range(i, -1, -1) if C[j]["kind"] == "down"), default=None) if True else None
        sd = su = 99
        for j in range(i, -1, -1):
            if C[j]["kind"] == "down": sd = t - C[j]["t"]; break
        for j in range(i, -1, -1):
            if C[j]["kind"] == "up": su = t - C[j]["t"]; break
        touching = sd < su
        return (x, y, touching, sd, su)

    def render(self, T):
        self.build(); t = self.rt(T)
        cx, cy, z = self.camera(t)
        vx0, vy0 = cx - OW/2/z, cy - OH/2/z
        out = self.static.resize((OW, OH), Image.BICUBIC, box=(vx0*SS, vy0*SS, (vx0 + OW/z)*SS, (vy0 + OH/z)*SS))
        P = self.page
        ox0, oy0, ox1, oy1 = (P[0]-vx0)*z, (P[1]-vy0)*z, (P[2]-vx0)*z, (P[3]-vy0)*z
        cx0, cy0, cx1, cy1 = max(0, ox0), max(0, oy0), min(OW, ox1), min(OH, oy1)
        if cx1 > cx0 and cy1 > cy0:
            k = self.fw / (ox1 - ox0)
            box = ((cx0-ox0)*k, (cy0-oy0)*k, (cx1-ox0)*k, (cy1-oy0)*k)
            size = (round(cx1) - round(cx0), round(cy1) - round(cy0))
            fr = self.frame_at(t).resize(size, Image.LANCZOS if z > 1.3 else Image.BICUBIC, box=box)
            mk = self.mask.resize(size, Image.BILINEAR, box=box)
            out.paste(fr, (round(cx0), round(cy0)), mk)
        p = self.pointer(t)
        if p:
            x, y, touching, sd, su = p
            sx, sy = (P[0] + x*self.s - vx0)*z, (P[1] + y*self.s - vy0)*z
            out = out.convert("RGBA")
            if self.kind == "desk": draw_cursor(out, sx, sy, z, sd)
            else: draw_touch(out, sx, sy, z*self.s, touching, sd, su)
            out = out.convert("RGB")
        return out

_cur = {}
def cursor_img(scale):
    key = round(scale, 2)
    if key in _cur: return _cur[key]
    S = 8; pts = [(0, 0), (0, 18), (4.6, 13.8), (7.6, 20.6), (10.4, 19.4), (7.4, 12.8), (13.2, 12.8)]
    img = Image.new("RGBA", (int(24*S*scale) + 8, int(28*S*scale) + 8), (0, 0, 0, 0))
    o = 2*S*scale
    poly = [(o + px*S*scale, o + py*S*scale) for px, py in pts]
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).polygon([(a + S*scale*.6, b + S*scale*1.2) for a, b in poly], fill=(0, 0, 0, 90))
    img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(S*scale*1.2)))
    d = ImageDraw.Draw(img); d.polygon(poly, fill=(255, 255, 255)); 
    inner = [(o + px*S*scale, o + py*S*scale) for px, py in [(1.4, 3.2), (1.4, 14.6), (4.9, 11.4), (8.1, 18.3), (9.1, 17.9), (5.9, 11.3), (10.4, 11.3)]]
    d.polygon(inner, fill=(10, 10, 10))
    img = img.resize((img.width // S, img.height // S), Image.LANCZOS)
    _cur[key] = (img, o / S); return _cur[key]

def draw_cursor(out, x, y, z, sd):
    sc = 1.25 * (z ** 0.6)
    if sd < 0.5:   # click ring
        u = sd / 0.5; r = (10 + 26*u) * sc; a = int(150 * (1 - u))
        ov = Image.new("RGBA", out.size, (0, 0, 0, 0)); ImageDraw.Draw(ov).ellipse((x - r, y - r, x + r, y + r), outline=(29, 68, 210, a), width=max(2, int(3*sc)))
        out.alpha_composite(ov)
    press = 0.86 if sd < 0.12 else 1.0
    img, o = cursor_img(sc * press)
    out.alpha_composite(img, (int(x - o), int(y - o)))

def draw_touch(out, x, y, k, touching, sd, su):
    r = 21 * k
    if touching: a = min(1, sd / 0.08)
    elif su < 0.3: a = 1 - su / 0.3
    else: return
    ov = Image.new("RGBA", out.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    rr = r * (1 + (0 if touching else su * 0.8))
    d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(40, 40, 48, int(70*a)), outline=(255, 255, 255, int(200*a)), width=max(2, int(2.5*k)))
    out.alpha_composite(ov)

SEGS = None
def init():
    global SEGS; SEGS = [Seg(desk_dir, "desk"), Seg(mob_dir, "mob")]

def job(n):
    T = n / FPS; a, b = SEGS
    total = a.dur + b.dur - FADE
    if T < a.dur - FADE: im = a.render(T)
    elif T < a.dur: u = ease((T - (a.dur - FADE)) / FADE); im = Image.blend(a.render(T), b.render(0), u)
    else:
        Tb = T - a.dur
        im = b.render(Tb)
        if T > total - FADE: u = ease((T - (total - FADE)) / FADE); im = Image.blend(im, a.render(0), u)
    im.save(os.path.join(out_dir, f"{n:05d}.jpg"), quality=93)
    return n

if __name__ == "__main__":
    os.makedirs(out_dir, exist_ok=True); init()
    a, b = SEGS; total = a.dur + b.dur - FADE
    N = int(total * FPS)
    only = os.environ.get("ONLY")
    idx = [int(v) for v in only.split(",")] if only else range(N)
    print("seconds", round(total, 1), "frames", N, flush=True)
    with Pool(os.cpu_count(), initializer=init) as p:
        for _ in p.imap_unordered(job, idx, chunksize=4): pass
