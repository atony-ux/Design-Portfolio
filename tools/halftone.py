"""Turn one of the flat blue doodles into a soft halftone (dots in the site blue).

The doodles are flat silhouettes, so a straight halftone would be one even field of
dots. This shades them first (darker toward the middle and the lower right, a little
low-frequency noise), then draws a dot grid where each dot's size follows the tone.

  python3 tools/halftone.py assets/graphics/headphones.webp assets/graphics/halftone-headphones.webp
"""
import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

BLUE = (33, 60, 151, 255)          # --blue #213c97
SIZE = 640                          # output width/height box
STEP = 17                           # dot pitch at output size (about 35 dots across)
SS = 3                              # supersampling for smooth dots

def halftone(src, dst, angle=18, seed=4):
    random.seed(seed)
    im = Image.open(src).convert("RGBA")
    im.thumbnail((SIZE - 80, SIZE - 80))
    mask = Image.new("L", (SIZE, SIZE), 0)
    mask.paste(im.split()[-1], ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    # soften the silhouette and shade it: denser toward the interior and lower right
    soft = mask.filter(ImageFilter.GaussianBlur(6))
    inner = mask.filter(ImageFilter.GaussianBlur(34))
    noise = Image.effect_noise((SIZE // 24, SIZE // 24), 90).resize((SIZE, SIZE), Image.BICUBIC)
    sp, ip, npx = soft.load(), inner.load(), noise.load()
    out = Image.new("RGBA", (SIZE * SS, SIZE * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    ca, sa = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    R = int(SIZE * 0.75)
    for gy in range(-R, R, STEP):
        for gx in range(-R, R, STEP):
            x = SIZE / 2 + gx * ca - gy * sa
            y = SIZE / 2 + gx * sa + gy * ca
            if not (0 <= x < SIZE and 0 <= y < SIZE):
                continue
            a = sp[int(x), int(y)] / 255
            if a <= 0.02:
                continue
            light = 0.18 + 0.82 * ((x + y) / (2 * SIZE)) ** 1.3   # darker toward the lower right
            t = a * (0.15 + 0.85 * ip[int(x), int(y)] / 255) * light
            t *= 0.55 + 0.9 * (npx[int(x), int(y)] / 255)
            t = max(0.0, min(1.0, t))
            r = STEP * 0.56 * math.sqrt(t)
            if r < 0.7:
                continue
            cx, cy, rr = x * SS, y * SS, r * SS
            d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), fill=BLUE)
    out = out.resize((SIZE, SIZE), Image.LANCZOS)
    out = out.crop(out.getbbox())
    out.save(dst, quality=90, method=6)
    print(dst, out.size)

if __name__ == "__main__":
    halftone(sys.argv[1], sys.argv[2], *(int(v) for v in sys.argv[3:]))
