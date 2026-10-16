"""Builds every icon PNG + the social preview image from simple shapes.
Run: python3 tools/make_icons.py   (needs Pillow). A GitHub Action runs this for you."""
import os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")
S = 4  # supersample

def bez(p0, p1, p2, p3, n=40):
    return [((1-t)**3*p0[0]+3*(1-t)**2*t*p1[0]+3*(1-t)*t*t*p2[0]+t**3*p3[0],
             (1-t)**3*p0[1]+3*(1-t)**2*t*p1[1]+3*(1-t)*t*t*p2[1]+t**3*p3[1]) for t in [i/n for i in range(n+1)]]

def pick_points():
    pts = []
    pts += bez((256,92),(340,92),(406,118),(406,170))
    pts += bez((406,170),(406,242),(318,366),(276,408))
    pts += bez((276,408),(265,419),(247,419),(236,408))
    pts += bez((236,408),(194,366),(106,242),(106,170))
    pts += bez((106,170),(106,118),(172,92),(256,92))
    return pts

def gradient(w, h, a=(0x8f,0xf0,0xd6), b=(0x2f,0xb5,0x96)):
    g = Image.new("RGB", (w, h))
    px = g.load()
    for y in range(h):
        for x in range(w):
            t = (x + y) / (w + h - 2)
            px[x, y] = tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))
    return g

def draw_icon(size, rounded=True, pad=0.0):
    big = 512 * S
    bg = gradient(64, 64).resize((big, big), Image.BILINEAR)
    img = Image.new("RGBA", (big, big), (0,0,0,0))
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,big-1,big-1], radius=(112*S if rounded else 0), fill=255)
    img.paste(bg, (0,0), mask)
    d = ImageDraw.Draw(img)
    sc = (1 - pad)
    off = 256 * S * pad
    tf = lambda x, y: (off + x*S*sc, off + y*S*sc)
    d.polygon([tf(x,y) for x,y in pick_points()], fill=(0xff,0xf8,0xee,255))
    red = (0x17,0x6b,0x59,255)
    d.rounded_rectangle([*tf(246,150), *tf(268,300)], radius=4*S*sc, fill=red)
    d.polygon([tf(246,150), tf(318,174), tf(318,214), tf(268,198)], fill=red)
    # rotated note head
    head = Image.new("RGBA", (big, big), (0,0,0,0))
    hd = ImageDraw.Draw(head)
    cx, cy = tf(232,300); rx, ry = 40*S*sc, 31*S*sc
    hd.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill=red)
    head = head.rotate(20, center=(cx, cy), resample=Image.BICUBIC)
    img = Image.alpha_composite(img, head)
    return img.resize((size, size), Image.LANCZOS)

def main():
    os.makedirs(OUT, exist_ok=True)
    draw_icon(32).save(os.path.join(OUT, "favicon-32.png"))
    draw_icon(48).save(os.path.join(OUT, "favicon-48.png"))
    draw_icon(180, rounded=False).convert("RGB").save(os.path.join(OUT, "apple-touch-icon.png"))
    draw_icon(192).save(os.path.join(OUT, "icon-192.png"))
    draw_icon(512).save(os.path.join(OUT, "icon-512.png"))
    draw_icon(512, rounded=False, pad=0.18).save(os.path.join(OUT, "icon-maskable-512.png"))
    draw_icon(48).save(os.path.join(OUT, "favicon.ico"), sizes=[(16,16),(32,32),(48,48)])
    # social preview 1200x630
    og = Image.new("RGB", (1200, 630), (0x0a,0x12,0x14))
    d = ImageDraw.Draw(og)
    for i in range(630):
        c = int(15 + 10 * i / 630)
        d.line([(0,i),(1200,i)], fill=(10+int(30*i/630), 18+int(8*i/630), 20))
    og.paste(draw_icon(300), (110, 165), draw_icon(300))
    def font(sz, bold=True):
        for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                  "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"]:
            if os.path.exists(p): return ImageFont.truetype(p, sz)
        return ImageFont.load_default()
    d.text((470, 220), "Music Space", font=font(84), fill=(0xe9,0xf3,0xef))
    d.text((474, 330), "Campfire guitar, songs, games", font=font(36, False), fill=(0xa8,0xc7,0xbd))
    d.text((474, 380), "and a tuner. Works offline.", font=font(36, False), fill=(0xa8,0xc7,0xbd))
    d.rectangle([474, 450, 640, 456], fill=(0x5f,0xd3,0xb5))
    og.save(os.path.join(OUT, "og-image.png"), optimize=True)
    print("icons written to", os.path.abspath(OUT))

if __name__ == "__main__":
    main()
