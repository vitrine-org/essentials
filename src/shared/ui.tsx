// Shared Fluent look for the essentials widgets: palette, card surface, hour format.
import type { JSX } from "solid-js";
import { localeInfo, type Style } from "@vitrine/sdk";

export const FONT_DISPLAY = "Segoe UI Variable Display";
export const FONT_TEXT = "Segoe UI Variable Text";
export const FONT_SMALL = "Segoe UI Variable Small";

export const DEFAULT_ACCENT = "#60CDFF";

export interface Palette {
  dark: boolean;
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
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * Windows 11 dark/light tokens. "auto" follows dark: the engine does not expose the
 * system theme yet, and translucent dark cards read well on most wallpapers.
 */
export function palette(theme: string, accent: string): Palette {
  const dark = theme !== "light";
  let acc = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : DEFAULT_ACCENT;
  // The default accent is the dark-theme variant; light theme uses Fluent's darker shade.
  if (!dark && acc.toUpperCase() === DEFAULT_ACCENT) acc = "#005FB8";
  const onAccent = luminance(acc) > 0.35 ? "#000000" : "#FFFFFF";
  return dark
    ? {
        dark,
        surface: "linear-gradient(160deg, rgba(48, 48, 48, 0.86), rgba(30, 30, 30, 0.80))",
        border: "rgba(255, 255, 255, 0.09)",
        text: "#FFFFFF",
        text2: "rgba(255, 255, 255, 0.79)",
        text3: "rgba(255, 255, 255, 0.54)",
        track: "rgba(255, 255, 255, 0.10)",
        hover: "rgba(255, 255, 255, 0.07)",
        pressed: "rgba(255, 255, 255, 0.04)",
        divider: "rgba(255, 255, 255, 0.08)",
        accent: acc,
        onAccent,
        critical: "#FF99A4",
        success: "#6CCB5F",
        caution: "#FCE100",
      }
    : {
        dark,
        surface: "linear-gradient(160deg, rgba(252, 252, 252, 0.88), rgba(240, 240, 240, 0.82))",
        border: "rgba(0, 0, 0, 0.07)",
        text: "rgba(0, 0, 0, 0.90)",
        text2: "rgba(0, 0, 0, 0.61)",
        text3: "rgba(0, 0, 0, 0.45)",
        track: "rgba(0, 0, 0, 0.08)",
        hover: "rgba(0, 0, 0, 0.05)",
        pressed: "rgba(0, 0, 0, 0.03)",
        divider: "rgba(0, 0, 0, 0.07)",
        accent: acc,
        onAccent,
        critical: "#C42B1C",
        success: "#0F7B0F",
        caution: "#9D5D00",
      };
}

/** Resolves the "hourFormat" setting (auto / 12 / 24) against the Windows locale. */
export function uses12h(hourFormat: string): boolean {
  if (hourFormat === "12") return true;
  if (hourFormat === "24") return false;
  return localeInfo().hour12;
}

/** The widget surface: a translucent, acrylic-like card filling the widget. */
export function Card(props: { p: Palette; style?: Style; children?: JSX.Element }) {
  return (
    <view
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 8,
        background: props.p.surface,
        border: `1px solid ${props.p.border}`,
        color: props.p.text,
        fontFamily: FONT_TEXT,
        overflow: "hidden",
        ...props.style,
      }}
    >
      {props.children}
    </view>
  );
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
