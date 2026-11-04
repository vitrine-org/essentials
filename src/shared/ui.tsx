// Shared look for the essentials widgets: palette, surface, legible text, hover layer.
import { createSignal, type JSX } from "solid-js";
import { localeInfo, prompt, useAppearance, useSize, type PromptOptions, type Style } from "@vitrine/sdk";

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
  /** Inner top highlight and bottom shade of the acrylic card. */
  highlight: string;
  lowlight: string;
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
 * Light and dark tokens. Theme "auto" (System) and accent "system" follow Windows, live.
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
  const common = { dark, bare, accent: acc, onAccent, surface: "rgba(0,0,0,0)", border: "rgba(0,0,0,0)", highlight: "rgba(0,0,0,0)", lowlight: "rgba(0,0,0,0)" };
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
  // Acrylic in the Windows 11 flyout manner: a flat, mostly opaque tint over the blurred
  // wallpaper (readable on any picture), a hairline edge and a 1 px inner top highlight.
  return dark
    ? {
        ...common,
        surface: "rgba(30, 30, 32, 0.84)",
        border: "rgba(255, 255, 255, 0.13)",
        highlight: "rgba(255, 255, 255, 0.10)",
        lowlight: "rgba(0, 0, 0, 0)",
        text: "#F4F4F4",
        text2: "rgba(255, 255, 255, 0.80)",
        text3: "rgba(255, 255, 255, 0.58)",
        track: "rgba(255, 255, 255, 0.13)",
        hover: "rgba(255, 255, 255, 0.08)",
        pressed: "rgba(255, 255, 255, 0.05)",
        divider: "rgba(255, 255, 255, 0.10)",
        critical: "#FF99A4",
        success: "#6CCB5F",
        caution: "#FCE100",
        shade: "0, 0, 0",
      }
    : {
        ...common,
        surface: "rgba(250, 250, 250, 0.86)",
        border: "rgba(0, 0, 0, 0.08)",
        highlight: "rgba(255, 255, 255, 0.9)",
        lowlight: "rgba(0, 0, 0, 0)",
        text: "#141414",
        text2: "rgba(20, 20, 20, 0.74)",
        text3: "rgba(20, 20, 20, 0.54)",
        track: "rgba(20, 32, 70, 0.11)",
        hover: "rgba(0, 0, 0, 0.05)",
        pressed: "rgba(0, 0, 0, 0.03)",
        divider: "rgba(20, 32, 70, 0.09)",
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

export const RADIUS = 12;

/**
 * The widget surface. Card: acrylic glass (backdrop blur + saturation of the wallpaper behind the
 * widget, a flat tint, hairline edge, inner top highlight). Bare: nothing, text shadows only.
 */
export function Card(props: { p: Palette; style?: Style; children?: JSX.Element }) {
  const size = useSize();
  // The renderer has no inset box-shadow and only %-stops, so the 1px inner highlight and the
  // lower shade are a gradient overlay sized from the widget height.
  const edges = () => {
    const h = Math.max(24, size().height || 100);
    const px = (v: number) => ((v / h) * 100).toFixed(2) + "%";
    const p = props.p;
    return `linear-gradient(180deg, ${p.highlight} 0%, ${p.highlight} ${px(1)}, rgba(255, 255, 255, 0) ${px(1.5)}, rgba(255, 255, 255, 0) 100%)`;
  };
  return (
    <view
      style={
        {
          width: "100%",
          height: "100%",
          borderRadius: RADIUS,
          background: props.p.surface,
          backdropFilter: props.p.bare ? undefined : "blur(24px) saturate(1.2)",
          border: props.p.bare ? undefined : `1px solid ${props.p.border}`,
          color: props.p.text,
          fontFamily: FONT_TEXT,
          overflow: props.p.bare ? "visible" : "hidden",
          textShadow: props.p.bare ? textShadowOf(props.p) : "none",
          ...props.style,
        } as Style
      }
    >
      {props.p.bare ? null : (
        <view style={{ position: "absolute", inset: 0, borderRadius: RADIUS - 1, background: edges() }} />
      )}
      {props.children}
    </view>
  );
}

/** `rgba()` of the palette's shadow tone. */
export const shadeOf = (p: Palette, a: number) => `rgba(${p.shade}, ${a})`;

/** The legibility shadow for bare widgets: a dark blur under light text, a light glow under dark text. */
export const textShadowOf = (p: Palette) =>
  p.dark ? `0 1px 4px ${shadeOf(p, 0.8)}` : `0 0 6px ${shadeOf(p, 0.75)}`;

/** Colour helper handed to `Txt` content: identity for the text, the shadow tone for copies. */
export type Tint = (color: string) => string;

/**
 * Text that stays legible on any wallpaper. The shadow itself is inherited from the bare
 * Card (`textShadow`); `children` receives a tint function kept for span colours.
 */
export function Txt(props: {
  p: Palette;
  style: Style;
  box?: Style;
  lite?: boolean;
  children: (tint: Tint) => JSX.Element;
}) {
  return (
    <view style={{ flexDirection: "column", ...props.box }}>
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

export type { PromptOptions } from "@vitrine/sdk";

/** True when the engine can show its text-input flyout (widgets get no keyboard focus). */
export const canAsk = () => typeof (globalThis as any).__vitrine?.prompt === "function";

/**
 * Asks the user for a line of text in the host's Fluent flyout (the SDK's `prompt()`). Resolves to
 * the text, `null` when cancelled, or `undefined` when this engine has no prompt, so widgets fall
 * back to their settings.
 */
export async function ask(opts: PromptOptions): Promise<string | null | undefined> {
  if (!canAsk()) return undefined;
  return prompt(opts);
}

/** The Appearance settings every widget shares (used as `useSettings` defaults). */
export const LOOK = { background: "card", theme: "auto", accent: "system" } as const;
