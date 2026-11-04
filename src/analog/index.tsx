import { For } from "solid-js";
import { formatDate, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, LOOK, shadeOf, usePalette } from "../shared/ui";

const TICKS = Array.from({ length: 60 }, (_, i) => i);
const NUMERALS = [12, 3, 6, 9];

function Analog() {
  const s = useSettings({ ...LOOK, showSeconds: true, face: "ticks", showDate: true });
  const p = usePalette(s);
  const size = useSize();
  const now = useClock(s().showSeconds ? "second" : "minute");

  const d = () => Math.max(60, Math.min(size().width, size().height) - (p().bare ? 8 : 20));
  const c = () => d() / 2;
  const r = () => d() / 2 - 2;

  const angles = () => {
    const t = now();
    const sec = t.getSeconds();
    const min = t.getMinutes() + (s().showSeconds ? sec / 60 : 0);
    return { h: ((t.getHours() % 12) + min / 60) * 30, m: min * 6, s: sec * 6 };
  };

  /** A point at `radius` and `deg` clockwise from 12. */
  const at = (deg: number, radius: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [c() + Math.cos(a) * radius, c() + Math.sin(a) * radius];
  };

  const hand = (deg: number, len: number, tail: number, width: number, color: string) => {
    const [x1, y1] = at(deg + 180, tail);
    const [x2, y2] = at(deg, len);
    return (
      <>
        {p().bare ? (
          <line x1={x1} y1={y1 + 1.5} x2={x2} y2={y2 + 1.5} stroke={shadeOf(p(), 0.35)} strokeWidth={width + 2} strokeLinecap="round" />
        ) : null}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      </>
    );
  };

  return (
    <Card p={p()} style={{ alignItems: "center", justifyContent: "center" }}>
      <view style={{ width: d(), height: d() }}>
        <svg width={d()} height={d()} viewBox={`0 0 ${d()} ${d()}`}>
          {/* Dial: a faint inner disc on the card, a soft ring on the wallpaper. */}
          <circle cx={c()} cy={c()} r={r()} fill={p().bare ? "none" : p().hover} stroke={p().divider} strokeWidth={1} />
          <For each={TICKS}>
            {(i) => <>{(() => {
              const hour = i % 5 === 0;
              const show = () => s().face !== "minimal" || i % 15 === 0;
              const numeral = () => s().face === "numbers" && i % 15 === 0;
              const inner = () => r() - (hour ? Math.max(6, d() * 0.07) : Math.max(3, d() * 0.03)) - 4;
              const [x1, y1] = at(i * 6, r() - 4);
              const [x2, y2] = at(i * 6, inner());
              return show() && !numeral() ? (
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={hour ? p().text2 : p().text3}
                  strokeWidth={hour ? Math.max(1.5, d() * 0.016) : 1}
                  strokeLinecap="round"
                  opacity={hour ? 1 : 0.6}
                />
              ) : null;
            })()}</>}
          </For>
          {hand(angles().h, r() * 0.5, r() * 0.08, Math.max(3, d() * 0.035), p().text)}
          {hand(angles().m, r() * 0.76, r() * 0.08, Math.max(2, d() * 0.024), p().text)}
          {s().showSeconds ? hand(angles().s, r() * 0.84, r() * 0.18, Math.max(1, d() * 0.01), p().accent) : null}
          <circle cx={c()} cy={c()} r={Math.max(2.5, d() * 0.028)} fill={p().accent} />
          <circle cx={c()} cy={c()} r={Math.max(1, d() * 0.01)} fill={p().dark ? "#1b1b1b" : "#ffffff"} />
        </svg>
        {s().face === "numbers" ? (
          <For each={NUMERALS}>
            {(n) => <>{(() => {
              const fs = () => Math.round(d() * 0.11);
              const pos = () => at((n % 12) * 30, r() - 6 - fs() * 0.7);
              return (
                <view
                  style={{
                    position: "absolute",
                    left: pos()[0] - fs(),
                    top: pos()[1] - fs() * 0.7,
                    width: fs() * 2,
                    height: fs() * 1.4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <text style={{ fontFamily: FONT_DISPLAY, fontSize: fs(), fontWeight: 600, color: p().text2 }}>{String(n)}</text>
                </view>
              );
            })()}</>}
          </For>
        ) : null}
        {s().showDate && d() >= 100 ? (
          <view
            style={{
              position: "absolute",
              left: c() - d() * 0.2,
              top: c() + r() * 0.3,
              width: d() * 0.4,
              alignItems: "center",
            }}
          >
            <text style={{ fontSize: Math.max(9, Math.round(d() * 0.075)), fontWeight: 600, color: p().text3, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {formatDate(now(), "ddd D")}
            </text>
          </view>
        ) : null}
      </view>
    </Card>
  );
}

mount(() => <Analog />);
