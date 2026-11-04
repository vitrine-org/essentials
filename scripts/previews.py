# Regenerates every widget preview (src/<widget>/preview.png) the same way, for the gallery, the
# store and the website, which show previews on one neutral solid tile.
#
#   npm run build && py scripts/previews.py [--exe path\to\vitrine.exe] [widget ...]
#
# Essentials widgets are acrylic cards. They render over a solid #2a2a2a backdrop, so the glass
# becomes a flat, even card, and are cut to the card's rounded shape on a transparent
# background. Every widget uses the dark theme, the same accent and its default size from
# vitrine.json, at scale 2, with realistic sample content where the default is empty. Weather
# renders with live data from Open-Meteo.

SETTINGS = {"theme": "dark", "background": "card", "accent": "#60CDFF"}
EXTRA = {
    "todo": {"items": "Book flights to Lisbon;[x] Renew passport;Call the dentist;[x] Water the plants;Send the March invoice"},
    "notes": {"text": "Pick up the cake at 6, Giulia’s party starts at 8"},
    "countdown": {"title": "Christmas", "date": "2026-12-25"},
}
CARD_RADIUS = 12  # RADIUS in src/shared/ui.tsx
BACKDROP = "#2a2a2a"


# ---------------------------------------------------------------------------------------------
import argparse, json, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCALE = 2
CELL, GAP = 64, 8


def find_exe(arg):
    for c in (arg, os.environ.get("VITRINE_EXE"), shutil.which("vitrine"),
              os.path.join(os.environ.get("LOCALAPPDATA", ""), "Programs", "Vitrine", "vitrine.exe")):
        if c and os.path.isfile(c):
            return c
    sys.exit("vitrine.exe not found: pass --exe or set VITRINE_EXE")


def rounded_mask(size, radius):
    # 4x supersampled rounded rectangle, for smooth corners.
    k = 4
    m = Image.new("L", (size[0] * k, size[1] * k), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] * k - 1, size[1] * k - 1), radius=radius * k, fill=255)
    return m.resize(size, Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser(description="Regenerate every src/<widget>/preview.png (run `npm run build` first).")
    ap.add_argument("--exe", help="vitrine.exe to render with")
    ap.add_argument("widgets", nargs="*", help="only these widget ids")
    a = ap.parse_args()
    exe = find_exe(a.exe)
    man = json.load(open(os.path.join(ROOT, "vitrine.json"), encoding="utf-8"))
    tmp = tempfile.mkdtemp()
    ok = True
    for w in man["widgets"]:
        wid = w["id"]
        if a.widgets and wid not in a.widgets:
            continue
        cw, ch = w["size"]["default"]
        px = ((cw * CELL + (cw - 1) * GAP) * SCALE, (ch * CELL + (ch - 1) * GAP) * SCALE)
        settings = {**SETTINGS, **EXTRA.get(wid, {})}
        raw = os.path.join(tmp, wid + ".png")
        cmd = [exe, "render", os.path.join(ROOT, "dist"), wid, "--cells", f"{cw}x{ch}", "--scale", str(SCALE),
               "--settings", json.dumps(settings), "--out", raw]
        if any(p.startswith("net:") for p in w.get("permissions", [])):
            cmd += ["--network", "--wait", "2500"]
        else:
            cmd += ["--wait", "1500"]
        if CARD_RADIUS:
            # A solid neutral backdrop: the acrylic glass becomes a flat, even card.
            bd = os.path.join(tmp, "backdrop.png")
            Image.new("RGB", px, BACKDROP).save(bd)
            cmd += ["--backdrop", bd]
        for _ in range(3):  # the renderer fails now and then on a busy machine: retry
            r = subprocess.run(cmd, capture_output=True, text=True)
            if r.returncode == 0:
                break
        if r.returncode != 0:
            print(wid, "FAILED", r.returncode, r.stdout.strip(), r.stderr.strip())
            ok = False
            continue
        img = Image.open(raw).convert("RGBA")
        if CARD_RADIUS:
            alpha = Image.composite(img.getchannel("A"), Image.new("L", img.size, 0), rounded_mask(img.size, CARD_RADIUS * SCALE))
            img.putalpha(alpha)
        out = os.path.join(ROOT, w["preview"])
        img.save(out, optimize=True)
        print(wid, img.size, "->", os.path.relpath(out, ROOT))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
