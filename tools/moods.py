"""Cut the 3 x 3 "Sumi moods" sheet into nine stickers.

Each cell becomes a transparent WebP: the blue lines in the site blue, the face and cap
filled white (like the other Sumi drawings), everything outside transparent.

  python3 tools/moods.py <sheet.webp> assets/graphics/sumi/moods
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

BLUE = (33, 60, 151)
NAMES = ["happy", "excited", "in-love", "chill", "focused", "sleepy", "sad", "angry", "surprised"]

def drop_edge_marks(line):
    """Remove ink blobs that touch the cell's top or bottom edge (they belong to the next row)."""
    mask = line > .2
    h, w = mask.shape
    seen = np.zeros_like(mask)
    for y0 in (0, 1, h - 2, h - 1):
        for x0 in range(w):
            if mask[y0, x0] and not seen[y0, x0]:
                stack = [(y0, x0)]
                while stack:
                    y, x = stack.pop()
                    if 0 <= y < h and 0 <= x < w and mask[y, x] and not seen[y, x]:
                        seen[y, x] = True
                        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    out = line.copy()
    out[seen] = 0
    return out

def main(src, out):
    os.makedirs(out, exist_ok=True)
    im = Image.open(src).convert("RGB")
    W, H = im.size
    xs, ys = [0, W * 1 // 3, W * 2 // 3, W], [0, 438, 828, H]   # rows cut in the empty bands
    for r in range(3):
        for c in range(3):
            cell = im.crop((xs[c], ys[r], xs[c + 1], ys[r + 1]))
            red = np.asarray(cell)[..., 0].astype(float)
            line = np.clip((255 - red - 24) / 206, 0, 1)               # 0 white .. 1 blue ink (paper noise cut)
            line = drop_edge_marks(line)                                 # bits of the neighbouring heads
            ink = Image.fromarray((line > .35).astype(np.uint8) * 255)
            closed = ink.filter(ImageFilter.MaxFilter(11))               # seal small gaps in the outline
            fill = Image.eval(closed, lambda v: 0 if v else 255)         # 255 where not ink
            fill = fill.convert("L")
            pad = Image.new("L", (fill.width + 2, fill.height + 2), 255)
            pad.paste(fill, (1, 1))
            ImageDraw.floodfill(pad, (0, 0), 0)                          # outside -> 0
            inside = pad.crop((1, 1, fill.width + 1, fill.height + 1))
            inside = inside.filter(ImageFilter.MaxFilter(11))            # grow back to meet the lines
            sticker = Image.new("RGBA", cell.size, (0, 0, 0, 0))
            sticker.paste((255, 255, 255, 255), mask=inside)
            ink_layer = Image.new("RGBA", cell.size, BLUE + (0,))
            ink_layer.putalpha(Image.fromarray((line * 255).astype(np.uint8)))
            sticker = Image.alpha_composite(sticker, ink_layer)
            sticker = sticker.crop(sticker.getbbox())
            name = NAMES[r * 3 + c]
            sticker.save(f"{out}/{name}.webp", quality=90, method=6)
            print(name, sticker.size)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
