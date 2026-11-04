// Shared look for the essentials widgets: palette, surface, legible text, hover layer.
import { createSignal, For, type JSX } from "solid-js";
import { localeInfo, useAppearance, type Style } from "@vitrine/sdk";

export const FONT_DISPLAY = "Segoe UI Variable Display";
export const FONT_TEXT = "Segoe UI Variable Text";
export const FONT_SMALL = "Segoe UI Variable Small";

export const DEFAULT_ACCENT = "#60CDFF";

export interface Palette {
  dark: boolean;
  /** No card: content is drawn straight on the wallpaper, with shadows for legibility. */
  bare: boolean;
  surface: string;
  border: string;
  text: string;
  text2: string;
  text3: string;
  track: string;
  hover: string;
  pressed: string;
  divider: string;
  accent: string;
  onAccent: string;
  critical: string;
  success: string;
  caution: string;
  /** "r, g, b" of the legibility shadow (dark under light text, light under dark text). */
  shade: string;
}

export interface LookSettings {
  theme: string;
  accent: string;
  background: string;
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Mixes `hex` toward white (t > 0) or black (t < 0). */
function mix(hex: string, t: number): string {
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - a) + to * a).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Windows 11 dark/light tokens. Theme "auto" and accent "system" follow Windows.
 * The Windows accent is a mid tone: like Fluent, it is lightened on dark surfaces
 * and darkened on light ones so text and rings stay readable.
 */
export function palette(look: LookSettings, system = { dark: true, accent: "#0078D4" }): Palette {
  const dark = look.theme === "auto" ? system.dark : look.theme !== "light";
  const bare = look.background === "none";
  const valid = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);
  let acc: string;
  if (look.accent === "system" || !valid(look.accent)) {
    const base = valid(system.accent) ? system.accent : "#0078D4";
    acc = dark ? mix(base, bare ? 0.5 : 0.45) : mix(base, -0.2);
  } else {
    acc = look.accent;
    // The default custom accent is the dark-theme variant; light theme uses Fluent's darker shade.
    if (!dark && acc.toUpperCase() === DEFAULT_ACCENT) acc = "#005FB8";
  }
  const onAccent = luminance(acc) > 0.35 ? "#000000" : "#FFFFFF";
  const common = { dark, bare, accent: acc, onAccent, surface: "rgba(0,0,0,0)", border: "rgba(0,0,0,0)" };
  if (bare) {
    return dark
      ? {
          ...common,
          text: "#FFFFFF",
          text2: "rgba(255, 255, 255, 0.92)",
          text3: "rgba(255, 255, 255, 0.84)",
          track: "rgba(255, 255, 255, 0.30)",
          hover: "rgba(255, 255, 255, 0.18)",
          pressed: "rgba(255, 255, 255, 0.10)",
          divider: "rgba(255, 255, 255, 0.40)",
          critical: "#FF99A4",
          success: "#8EE07F",
          caution: "#FCE100",
          shade: "0, 0, 0",
        }
      : {
          ...common,
          text: "#111111",
          text2: "rgba(0, 0, 0, 0.80)",
          text3: "rgba(0, 0, 0, 0.70)",
          track: "rgba(0, 0, 0, 0.24)",
          hover: "rgba(0, 0, 0, 0.10)",
          pressed: "rgba(0, 0, 0, 0.06)",
          divider: "rgba(0, 0, 0, 0.30)",
          critical: "#C42B1C",
          success: "#0F7B0F",
          caution: "#9D5D00",
          shade: "255, 255, 255",
        };
  }
  return dark
    ? {
        ...common,
        surface: "linear-gradient(160deg, rgba(48, 48, 48, 0.86), rgba(30, 30, 30, 0.80))",
        border: "rgba(255, 255, 255, 0.09)",
        text: "#FFFFFF",
        text2: "rgba(255, 255, 255, 0.79)",
        text3: "rgba(255, 255, 255, 0.54)",
        track: "rgba(255, 255, 255, 0.10)",
        hover: "rgba(255, 255, 255, 0.07)",
        pressed: "rgba(255, 255, 255, 0.04)",
        divider: "rgba(255, 255, 255, 0.08)",
        critical: "#FF99A4",
        success: "#6CCB5F",
        caution: "#FCE100",
        shade: "0, 0, 0",
      }
    : {
        ...common,
        surface: "linear-gradient(160deg, rgba(252, 252, 252, 0.88), rgba(240, 240, 240, 0.82))",
        border: "rgba(0, 0, 0, 0.07)",
        text: "rgba(0, 0, 0, 0.90)",
        text2: "rgba(0, 0, 0, 0.61)",
        text3: "rgba(0, 0, 0, 0.45)",
        track: "rgba(0, 0, 0, 0.08)",
        hover: "rgba(0, 0, 0, 0.05)",
        pressed: "rgba(0, 0, 0, 0.03)",
        divider: "rgba(0, 0, 0, 0.07)",
        critical: "#C42B1C",
        success: "#0F7B0F",
        caution: "#9D5D00",
        shade: "255, 255, 255",
      };
}

/** The widget palette from its theme/accent/background settings, live with Windows appearance changes. */
export function usePalette(settings: () => LookSettings): () => Palette {
  const system = useAppearance();
  return () => palette(settings(), system());
}

/** Resolves the "hourFormat" setting (auto / 12 / 24) against the Windows locale. */
export function uses12h(hourFormat: string): boolean {
  if (hourFormat === "12") return true;
  if (hourFormat === "24") return false;
  return localeInfo().hour12;
}

/** The widget surface: a translucent acrylic-like card, or nothing at all when bare. */
export function Card(props: { p: Palette; style?: Style; children?: JSX.Element }) {
  return (
    <view
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        background: props.p.surface,
        border: props.p.bare ? undefined : `1px solid ${props.p.border}`,
        color: props.p.text,
        fontFamily: FONT_TEXT,
        overflow: props.p.bare ? "visible" : "hidden",
        ...props.style,
      }}
    >
      {props.children}
    </view>
  );
}

/** `rgba()` of the palette's shadow tone. */
export const shadeOf = (p: Palette, a: number) => `rgba(${p.shade}, ${a})`;

interface Offset {
  x: number;
  y: number;
  a: number;
}

/**
 * Shadow copies for a text of `size` px. The renderer has no text-shadow, so a thin outline
 * (four 1-unit copies) plus a soft drop is approximated with offset copies under the text.
 * Dark text on light wallpapers gets a lighter, symmetric glow instead of a drop.
 */
function offsets(size: number, lite: boolean, darkText: boolean): Offset[] {
  const u = size >= 40 ? 1.5 : 1;
  const k = darkText ? 0.75 : 1;
  const ring = [
    { x: u, y: 0, a: 0.28 * k },
    { x: -u, y: 0, a: 0.28 * k },
    { x: 0, y: -u, a: 0.24 * k },
    { x: 0, y: u, a: 0.34 * k },
  ];
  const drop = darkText ? [] : [{ x: 0, y: u * 2, a: 0.22 }];
  return lite && darkText ? ring.slice(0, 2).concat(ring[3]) : [...ring, ...drop];
}

/** Colour helper handed to `Txt` content: identity for the text, the shadow tone for copies. */
export type Tint = (color: string) => string;

/**
 * Text that stays legible on any wallpaper. In card mode it is plain text; when the palette
 * is bare it draws shadow copies beneath. `children` receives a tint function: wrap every
 * span colour in it so the copies are painted in the shadow tone.
 */
export function Txt(props: {
  p: Palette;
  style: Style;
  box?: Style;
  lite?: boolean;
  children: (tint: Tint) => JSX.Element;
}) {
  const size = () => (typeof props.style.fontSize === "number" ? props.style.fontSize : 14);
  return (
    <view style={{ flexDirection: "column", ...props.box }}>
      {props.p.bare ? (
        <For each={offsets(size(), !!props.lite, !props.p.dark)}>
          {(o) => (
            <text
              style={{
                ...props.style,
                position: "absolute",
                left: o.x,
                top: o.y,
                width: "100%",
                color: shadeOf(props.p, o.a),
              }}
            >
              {props.children(() => shadeOf(props.p, o.a))}
            </text>
          )}
        </For>
      ) : null}
      <text style={props.style}>{props.children((c) => c)}</text>
    </view>
  );
}

/** Hover/pressed state for interactive elements. */
export function usePress() {
  const [hover, setHover] = createSignal(false);
  const [down, setDown] = createSignal(false);
  const handlers = {
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => (setHover(false), setDown(false)),
    onPointerDown: () => setDown(true),
    onPointerUp: () => setDown(false),
  };
  return { hover, down, handlers };
}

/**
 * A fill behind an interactive element that fades in on hover. Background colours do not
 * animate, so the layer animates its opacity instead.
 */
export function HoverLayer(props: { p: Palette; hover: boolean; down: boolean; radius: number }) {
  return (
    <view
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: props.radius,
        background: props.down ? props.p.pressed : props.p.hover,
        opacity: props.hover ? 1 : 0,
        transition: "opacity 150ms ease",
      }}
    />
  );
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
