#!/usr/bin/env python3
"""Regenerate favicon.ico, apple-touch-icon.png and the 1200x630 OG images.

Run from the repo root:  python3 scripts/make_images.py
Needs Pillow and the Plus Jakarta Sans variable font (falls back to DejaVu Sans).
The logo is drawn from the same shapes as icon.svg (viewBox 0 0 64 64).
"""
import glob
import os
from PIL import Image, ImageDraw, ImageFont

GREEN, GREEN_700 = (11, 110, 79), (8, 85, 61)
CREAM, AMBER, INK = (255, 248, 236), (245, 165, 36), (15, 31, 26)
SS = 4  # supersampling factor


def find_font():
    pats = [
        "/usr/share/fonts/**/PlusJakartaSans-VariableFont_wght.ttf",
        "/usr/share/fonts/**/DejaVuSans-Bold.ttf",
    ]
    for p in pats:
        hits = glob.glob(p, recursive=True)
        if hits:
            return hits[0]
    return None


FONT_PATH = find_font()


def font(size, weight="Bold"):
    if not FONT_PATH:
        return ImageFont.load_default()
    f = ImageFont.truetype(FONT_PATH, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def draw_logo(d, x, y, s, bubble=GREEN, fg=CREAM):
    """Draw icon.svg's chat-bubble plug at (x, y) with size s (px for 64 units)."""
    k = s / 64.0
    P = lambda px, py: (x + px * k, y + py * k)
    # bubble body (ellipse approximating the path) + tail
    d.ellipse([P(4, 4), P(60, 56)], fill=bubble)
    d.polygon([P(10.1, 44), P(7, 59), P(22, 52)], fill=bubble)
    # prongs
    d.rounded_rectangle([P(24, 15), P(28.5, 25)], radius=2.25 * k, fill=fg)
    d.rounded_rectangle([P(35.5, 15), P(40, 25)], radius=2.25 * k, fill=fg)
    # plug head: rect 19..45 x 24..30 + half circle r=13 centred (32,30)
    d.rectangle([P(19, 24), P(45, 30)], fill=fg)
    d.pieslice([P(19, 17), P(45, 43)], 0, 180, fill=fg)
    # spark
    d.ellipse([P(27.5, 27.5), P(36.5, 36.5)], fill=AMBER)


def icon(size, bg=None, pad=0.0):
    big = size * SS
    im = Image.new("RGBA", (big, big), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    off = big * pad
    draw_logo(d, off, off, big - 2 * off)
    return im.resize((size, size), Image.LANCZOS)


def gradient(w, h):
    im = Image.new("RGB", (w, h), GREEN)
    px = im.load()
    for yy in range(h):
        for xx in range(w):
            t = (xx / w + yy / h) / 2
            px[xx, yy] = tuple(int(GREEN[i] + (GREEN_700[i] - GREEN[i]) * t) for i in range(3))
    return im


def og(path, pill, line1, line2, sub):
    W, H = 1200, 630
    im = gradient(W * 2, H * 2).convert("RGBA")
    d = ImageDraw.Draw(im)
    S = 2
    # logo tile + wordmark
    d.rounded_rectangle([80 * S, 90 * S, 200 * S, 210 * S], radius=26 * S, fill=CREAM)
    draw_logo(d, 88 * S, 98 * S, 104 * S)
    d.text((228 * S, 150 * S), "PlugPage", font=font(64 * S, "ExtraBold"), fill="white", anchor="lm")
    y = 262
    if pill:
        f = font(26 * S, "ExtraBold")
        tw = d.textlength(pill, font=f)
        d.rounded_rectangle([80 * S, y * S, 80 * S + tw + 44 * S, (y + 46) * S], radius=23 * S, fill=AMBER)
        d.text((80 * S + 22 * S, (y + 23) * S), pill, font=f, fill=INK, anchor="lm")
        y += 72
    fbig = font(64 * S, "ExtraBold")
    d.text((80 * S, y * S), line1, font=fbig, fill="white")
    y += 78
    d.text((80 * S, y * S), line2, font=fbig, fill=AMBER)
    y += 104
    d.text((80 * S, y * S), sub, font=font(28 * S, "Medium"), fill=(215, 237, 227))
    im.resize((W, H), Image.LANCZOS).convert("RGB").save(path, optimize=True)


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    base = icon(256)
    base.save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    icon(180, bg=CREAM + (255,), pad=0.12).convert("RGB").save("apple-touch-icon.png", optimize=True)
    og("og.png", None, "Your WhatsApp shop,", "found and trusted.",
       "A shop page Google can find, with WhatsApp order buttons \u00b7 Made in Nigeria")
    og("og-tools.png", "FREE \u00b7 NO SIGN-UP", "WhatsApp order links,", "QR codes & price lists",
       "Free tools for Nigerian sellers \u00b7 plugpage.pages.dev/tools")
    og("og-blog.png", "BLOG", "Guides for WhatsApp", "& Instagram sellers",
       "Pricing, Google, payments and more \u00b7 plugpage.pages.dev/blog")
    print("wrote favicon.ico, apple-touch-icon.png, og.png, og-tools.png, og-blog.png")
