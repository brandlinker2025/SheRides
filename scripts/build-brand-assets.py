#!/usr/bin/env python3
"""Build SheRides brand assets from the official JPGs.

Free tools only: Pillow Lanczos resampling (2x) and edge flood-fill
background removal. Originals are copied, never modified.
"""

from __future__ import annotations

import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
UPLOADS = Path("/home/ubuntu/.cursor/projects/workspace/uploads")
ORIGINAL = ROOT / "public" / "brand" / "original"
BRAND = ROOT / "public" / "brand"
ICONS = ROOT / "public" / "icons"
ANDROID = ROOT / "android" / "app" / "src" / "main" / "res"

SOURCES = {
    "logo-black.jpg": "1-logo-black_d7a7.jpg",
    "badge-white.jpg": "2-badge-white_2049.jpg",
    "badge-black.jpg": "3-badge-black_0f01.jpg",
    "logo-tagline-black.jpg": "4-logo-tagline-black_67bd.jpg",
    "logo-tagline-white.jpg": "5-logo-tagline-white_0e49.jpg",
}

# Deep purple from the wordmark, pink helmet, scooter yellow.
PURPLE = (76, 29, 149, 255)  # refined after sampling if needed
PINK = (244, 184, 212, 255)
YELLOW = (255, 196, 64, 255)
INK = (27, 19, 36, 255)  # Night Ink #1B1324
# Light text for logos that sit on Night Ink. Illustration pixels are not recolored.
WORDMARK_ON_DARK = (240, 235, 246)  # Lavender Mist #F0EBF6
TAGLINE_ON_DARK = (255, 184, 4)  # Scooter Yellow #FFB804


def upscale(im: Image.Image, factor: int = 2) -> Image.Image:
    w, h = im.size
    return im.convert("RGBA").resize((w * factor, h * factor), Image.Resampling.LANCZOS)


def knock_out(im: Image.Image, background: str) -> Image.Image:
    """Remove a solid black or white field that touches the canvas edge.

    Pillow's flood fill is C-speed. A second NumPy pass feathers the
    anti-aliased fringe so the cut-out does not keep a dark or white halo.
    """
    im = im.convert("RGBA")
    thresh = 32 if background == "black" else 12
    seed = (0, 0, 0, 0)
    w, h = im.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)):
        r, g, b, a = im.getpixel(xy)
        if a == 0:
            continue
        if background == "black" and max(r, g, b) > 40:
            continue
        if background == "white" and min(r, g, b) < 230:
            continue
        ImageDraw.floodfill(im, xy, seed, thresh=thresh)

    arr = np.asarray(im).copy()
    alpha = arr[:, :, 3]
    zero = alpha == 0
    neighbor = np.zeros_like(zero)
    neighbor[1:, :] |= zero[:-1, :]
    neighbor[:-1, :] |= zero[1:, :]
    neighbor[:, 1:] |= zero[:, :-1]
    neighbor[:, :-1] |= zero[:, 1:]
    fringe = (alpha > 0) & neighbor
    if background == "black":
        peak = arr[:, :, :3].max(axis=2)
        fade = (peak < 96) & fringe
        softened = np.clip((peak.astype(np.int16) - 24) * 255 // 72, 0, 255).astype(np.uint8)
        arr[:, :, 3] = np.where(fade, softened, alpha)
    else:
        floor = arr[:, :, :3].min(axis=2)
        spread = arr[:, :, :3].max(axis=2) - floor
        fade = (floor > 200) & (spread < 30) & fringe
        softened = np.clip((246 - floor.astype(np.int16)) * 255 // 46, 0, 255).astype(np.uint8)
        arr[:, :, 3] = np.where(fade, softened, alpha)
    return Image.fromarray(arr, "RGBA")


def drop_tagline(im: Image.Image) -> Image.Image:
    """Crop the official curly lockup above the tagline for compact headers."""
    alpha = np.array(im.convert("RGBA"))[:, :, 3]
    content = (alpha > 30).sum(axis=1) > 12
    y = len(content) - 1
    while y > 0 and not content[y]:
        y -= 1
    while y > 0 and content[y]:
        y -= 1
    while y > 0 and not content[y]:
        y -= 1
    return trim(im.crop((0, 0, im.width, min(im.height, y + 8))), pad=16)


def trim(im: Image.Image, pad: int = 12) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.width, x1 + pad)
    y1 = min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def save_pair(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "PNG", optimize=True)
    im.save(path.with_suffix(".webp"), "WEBP", quality=86, method=6)
    print(f"{path.relative_to(ROOT)} {im.size[0]}x{im.size[1]}")


def contain(im: Image.Image, size: int, pad_ratio: float = 0.08) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = int(size * (1 - pad_ratio * 2))
    scale = min(inner / im.width, inner / im.height)
    resized = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def maskable(badge: Image.Image, size: int, bg: tuple[int, int, int, int]) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    # Keep the badge inside the 80% maskable safe zone.
    inner = int(size * 0.72)
    scale = min(inner / badge.width, inner / badge.height)
    resized = badge.resize((max(1, int(badge.width * scale)), max(1, int(badge.height * scale))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def opaque_launcher(badge: Image.Image, size: int) -> Image.Image:
    """White circular badge on a deep-purple field so the launcher tile stays opaque."""
    canvas = Image.new("RGBA", (size, size), PURPLE)
    inset = int(size * 0.04)
    inner = size - inset * 2
    scale = min(inner / badge.width, inner / badge.height)
    resized = badge.resize((max(1, int(badge.width * scale)), max(1, int(badge.height * scale))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas.convert("RGB")


def content_bands(alpha: np.ndarray) -> list[tuple[int, int]]:
    content = (alpha > 30).sum(axis=1) > 12
    bands: list[tuple[int, int]] = []
    start = None
    for y, on in enumerate(content):
        if on and start is None:
            start = y
        elif not on and start is not None:
            bands.append((start, y - 1))
            start = None
    if start is not None:
        bands.append((start, len(content) - 1))
    return bands


def paint_text_band(arr: np.ndarray, y0: int, y1: int, color: tuple[int, int, int]) -> None:
    """Replace RGB of existing text pixels. Alpha stays so the edges stay sharp."""
    band = arr[y0 : y1 + 1]
    mask = band[:, :, 3] > 0
    band[:, :, 0][mask] = color[0]
    band[:, :, 1][mask] = color[1]
    band[:, :, 2][mask] = color[2]


def recolor_stacked_text(im: Image.Image) -> Image.Image:
    """Lockup and mark: the lower content bands are the wordmark and tagline."""
    arr = np.array(im.convert("RGBA"))
    bands = content_bands(arr[:, :, 3])
    if len(bands) >= 3:
        paint_text_band(arr, *bands[-2], WORDMARK_ON_DARK)
        paint_text_band(arr, *bands[-1], TAGLINE_ON_DARK)
    elif len(bands) == 2:
        paint_text_band(arr, *bands[-1], WORDMARK_ON_DARK)
    return Image.fromarray(arr, "RGBA")


def recolor_badge_text(im: Image.Image) -> Image.Image:
    """Dark badge: recolor only the wordmark and tagline inside the ring."""
    arr = np.array(im.convert("RGBA"))
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 128)
    if len(xs) == 0:
        return im
    cx = (xs.min() + xs.max()) / 2
    cy = (ys.min() + ys.max()) / 2
    rad = (xs.max() - xs.min()) / 2
    height, width = alpha.shape
    yy, xx = np.mgrid[0:height, 0:width]
    inside = np.hypot(xx - cx, yy - cy) < rad * 0.86
    red, green, blue = arr[:, :, 0].astype(np.int16), arr[:, :, 1].astype(np.int16), arr[:, :, 2].astype(np.int16)
    purple_ink = (alpha > 16) & (green < 40) & (blue + 8 >= red) & (np.maximum(red, blue) > 10) & (red < 140)
    wordmark = inside & purple_ink & (yy > cy + rad * 0.32) & (yy < cy + rad * 0.62)
    tagline = inside & purple_ink & (yy >= cy + rad * 0.62) & (yy < cy + rad * 0.78)
    for mask, color in ((wordmark, WORDMARK_ON_DARK), (tagline, TAGLINE_ON_DARK)):
        arr[:, :, 0][mask] = color[0]
        arr[:, :, 1][mask] = color[1]
        arr[:, :, 2][mask] = color[2]
    return Image.fromarray(arr, "RGBA")


def open_graph(lockup: Image.Image) -> Image.Image:
    w, h = 1200, 630
    canvas = Image.new("RGBA", (w, h), INK)
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse((-120, -160, 520, 480), fill=(244, 184, 212, 46))
    draw.ellipse((760, 220, 1320, 780), fill=(124, 58, 237, 70))
    draw.ellipse((860, -80, 1280, 340), fill=(255, 196, 64, 36))
    overlay = overlay.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(overlay)
    target_h = 520
    scale = target_h / lockup.height
    resized = lockup.resize((int(lockup.width * scale), target_h), Image.Resampling.LANCZOS)
    if resized.width > 760:
        scale = 760 / lockup.width
        resized = lockup.resize((760, int(lockup.height * scale)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((w - resized.width) // 2, (h - resized.height) // 2))
    return canvas.convert("RGB")


def main() -> None:
    ORIGINAL.mkdir(parents=True, exist_ok=True)
    for name, upload in SOURCES.items():
        src = UPLOADS / upload
        dest = ORIGINAL / name
        shutil.copy2(src, dest)
        with Image.open(dest) as im:
            print(f"original {name} {im.size[0]}x{im.size[1]} mode={im.mode}")

    jobs = [
        # logo-black.jpg uses a different bold wordmark. It is preserved in original/ only.
        ("logo-tagline-black.jpg", "black", "lockup-on-dark"),
        ("logo-tagline-white.jpg", "white", "lockup-on-light"),
        ("badge-white.jpg", "black", "badge-on-light"),
        ("badge-black.jpg", "black", "badge-on-dark"),
    ]
    # badge-white.jpg is a white disc on a black field, so the field to remove is black.
    # badge-black.jpg is a black disc; flood-fill stops at the purple ring.

    built: dict[str, Image.Image] = {}
    for filename, background, stem in jobs:
        with Image.open(ORIGINAL / filename) as raw:
            large = upscale(raw, 2)
        cut = trim(knock_out(large, background), pad=16)
        save_pair(cut, BRAND / f"{stem}.png")
        built[stem] = cut

    # Dark surfaces need a light wordmark. Only the text bands change.
    lockup_dark = recolor_stacked_text(built["lockup-on-dark"])
    save_pair(lockup_dark, BRAND / "lockup-on-dark.png")
    built["lockup-on-dark"] = lockup_dark
    save_pair(recolor_badge_text(built["badge-on-dark"]), BRAND / "badge-on-dark.png")
    save_pair(drop_tagline(lockup_dark), BRAND / "mark-on-dark.png")
    save_pair(drop_tagline(built["lockup-on-light"]), BRAND / "mark-on-light.png")

    badge = built["badge-on-light"]
    for size, name in (
        (16, "icon-16.png"),
        (32, "icon-32.png"),
        (48, "icon-48.png"),
        (180, "icon-180.png"),
        (192, "icon-192.png"),
        (512, "icon-512.png"),
    ):
        icon = contain(badge, size, 0.04 if size >= 48 else 0.0)
        icon.save(ICONS / name, "PNG", optimize=True)
        print(f"public/icons/{name} {size}x{size}")

    for size, name in ((192, "icon-192-maskable.png"), (512, "icon-512-maskable.png")):
        icon = maskable(badge, size, PURPLE)
        icon.save(ICONS / name, "PNG", optimize=True)
        print(f"public/icons/{name} {size}x{size}")

    apple = contain(badge, 180, 0.02).convert("RGB")
    # Apple touch icons are opaque. Sit the badge on white so the ring stays visible.
    apple_bg = Image.new("RGB", (180, 180), (255, 255, 255))
    apple_bg.paste(contain(badge, 180, 0.0), (0, 0), contain(badge, 180, 0.0))
    apple_bg.save(ROOT / "public" / "apple-touch-icon.png", "PNG", optimize=True)
    apple_bg.save(ROOT / "public" / "apple-touch-icon-precomposed.png", "PNG", optimize=True)
    apple_bg.save(ICONS / "apple-touch-icon.png", "PNG", optimize=True)
    print("public/apple-touch-icon.png 180x180")

    ico_base = contain(badge, 256, 0.0)
    ico_base.save(
        ROOT / "public" / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("public/favicon.ico 16+32+48")

    og = open_graph(built["lockup-on-dark"])
    og.save(BRAND / "og.jpg", "JPEG", quality=90, optimize=True)
    og.save(ROOT / "public" / "og.jpg", "JPEG", quality=90, optimize=True)
    og.save(BRAND / "og.png", "PNG", optimize=True)
    print(f"public/brand/og.png {og.size[0]}x{og.size[1]}")

    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in densities.items():
        out = ANDROID / folder
        out.mkdir(parents=True, exist_ok=True)
        opaque_launcher(badge, size).save(out / "ic_launcher.png", "PNG", optimize=True)
        print(f"android {folder}/ic_launcher.png {size}x{size}")

    # Sample the wordmark so the theme can cite the real purple.
    mark = built["mark"]
    # Bottom band of the mark is the wordmark.
    band = mark.crop((0, int(mark.height * 0.72), mark.width, mark.height))
    colors: dict[tuple[int, int, int], int] = {}
    for r, g, b, a in band.getdata():
        if a < 200:
            continue
        key = (r // 8 * 8, g // 8 * 8, b // 8 * 8)
        colors[key] = colors.get(key, 0) + 1
    top = sorted(colors.items(), key=lambda item: item[1], reverse=True)[:6]
    print("wordmark samples", top)


if __name__ == "__main__":
    main()
