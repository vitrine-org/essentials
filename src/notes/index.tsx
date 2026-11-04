import { createEffect } from "solid-js";
import { formatDate, mount, useSettings, useSize, useStorage } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, HoverLayer, LOOK, type Palette, Txt, ask, canAsk, clamp, usePalette, usePress } from "../shared/ui";
import { t } from "../shared/i18n";

// Sticky-note tints from the brand colours, laid over the glass: [r, g, b].
const TINTS: Record<string, [number, number, number]> = {
  sun: [255, 204, 92],
  mint: [110, 226, 206],
  coral: [255, 140, 160],
  sky: [120, 176, 255],
};

function tinted(p: Palette, tint: string): string | undefined {
  const c = TINTS[tint];
  if (!c || p.bare) return undefined;
  const [r, g, b] = c;
  // Paper-like: opaque enough to read on any wallpaper, still lit by the blur behind it.
  const dim = (k: number) => `${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)}`;
  return p.dark
    ? `linear-gradient(160deg, rgba(${dim(0.52)}, 0.72), rgba(${dim(0.28)}, 0.70))`
    : `linear-gradient(160deg, rgba(${r}, ${g}, ${b}, 0.88), rgba(${dim(0.95)}, 0.78))`;
}

function Notes() {
  const s = useSettings({ ...LOOK, text: "", tint: "sun", fontSize: "auto" });
  const p = usePalette(s);
  const size = useSize();
  const press = usePress();
  const [note, setNote] = useStorage<{ text: string; edited: number } | null>("note", null);
  const [seed, setSeed] = useStorage<string>("seed", "");

  // The settings text replaces the note when it changes (and is the only way in without the flyout).
  createEffect(() => {
    const raw = String(s().text ?? "");
    if (raw === seed()) return;
    setSeed(raw);
    if (raw.trim()) setNote({ text: raw.trim(), edited: Date.now() });
  });

  const text = () => note()?.text ?? "";
  const editable = canAsk();
  const edit = async () => {
    const t = await ask({ title: t("note"), placeholder: t("notePlaceholder"), value: text() });
    if (t === null || t === undefined) return;
    setNote({ text: t.trim(), edited: Date.now() });
  };

  const fs = () => {
    if (s().fontSize !== "auto") return Number(s().fontSize) || 15;
    const area = size().width * size().height;
    const len = Math.max(20, text().length);
    // Big for a short line, smaller as the note grows.
    return Math.round(clamp(Math.sqrt(area / len) * 0.62, 12, size().height >= 130 ? 24 : 17));
  };
  const accent = () => (TINTS[s().tint] && !p().bare ? (p().dark ? "#FFFFFF" : "#141414") : p().accent);

  return (
    <Card
      p={p()}
      style={{
        flexDirection: "column",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 6,
        ...(tinted(p(), s().tint) ? { background: tinted(p(), s().tint) } : {}),
      }}
    >
      <view style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <view style={{ width: 3, height: 12, borderRadius: 2, background: accent(), opacity: 0.8 }} />
        <Txt p={p()} lite style={{ fontSize: 11, fontWeight: 600, color: p().text2, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {() => t("note")}
        </Txt>
      </view>
      <view style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <Txt
          p={p()}
          style={{
            fontFamily: fs() >= 18 ? FONT_DISPLAY : undefined,
            fontSize: fs(),
            fontWeight: fs() >= 18 ? 600 : 400,
            lineHeight: 1.35,
            color: text() ? p().text : p().text3,
            whiteSpace: "normal",
          }}
        >
          {() => text() || (editable ? t("clickToWrite") : t("noteInSettings"))}
        </Txt>
      </view>
      {note() && size().height >= 130 ? (
        <Txt p={p()} lite style={{ fontSize: 10, color: p().text3 }}>
          {() => t("edited", { d: formatDate(note()!.edited, "D MMM, HH:mm") })}
        </Txt>
      ) : null}
      {/* On top, so the whole note is one click target. */}
      <view onClick={editable ? edit : undefined} {...(editable ? press.handlers : {})} style={{ position: "absolute", inset: 0 }}>
        {editable ? <HoverLayer p={p()} hover={press.hover()} down={press.down()} radius={11} /> : null}
      </view>
    </Card>
  );
}

mount(() => <Notes />);
