import { createSignal, For, type JSX } from "solid-js";
import { formatDate, localeInfo, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, usePalette } from "../shared/ui";

/** ISO-8601 week number. */
function isoWeek(d: Date): number {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

function NavButton(props: { p: Palette; dir: -1 | 1; size: number; onClick: () => void }) {
  const [hover, setHover] = createSignal(false);
  const [down, setDown] = createSignal(false);
  const c = () => props.size / 2;
  return (
    <view
      onClick={props.onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => (setHover(false), setDown(false))}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      style={{
        width: props.size,
        height: props.size,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        background: down() ? props.p.pressed : hover() ? props.p.hover : "rgba(0,0,0,0)",
      }}
    >
      <svg width={props.size} height={props.size} viewBox={`0 0 ${props.size} ${props.size}`}>
        <path
          d={
            props.dir < 0
              ? `M ${c() + 2} ${c() - 4.5} L ${c() - 2.5} ${c()} L ${c() + 2} ${c() + 4.5}`
              : `M ${c() - 2} ${c() - 4.5} L ${c() + 2.5} ${c()} L ${c() - 2} ${c() + 4.5}`
          }
          fill="none"
          stroke={props.p.text2}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </view>
  );
}

function Calendar() {
  const s = useSettings({ theme: "auto", accent: "system", firstDayOfWeek: "auto", showWeekNumbers: false });
  const p = usePalette(s);
  const now = useClock("minute");
  const size = useSize();
  const [offset, setOffset] = createSignal(0); // months from the current one

  const first = () => (s().firstDayOfWeek === "auto" ? localeInfo().firstDayOfWeek : Number(s().firstDayOfWeek)) || 0;
  const shown = () => new Date(now().getFullYear(), now().getMonth() + offset(), 1);
  const big = () => size().width >= 270;
  const cellH = () => Math.floor((size().height - 24 - 28 - 6 - 18) / 6);
  const dot = () => Math.min(cellH(), big() ? 30 : 24);

  const weeks = () => {
    const m = shown();
    const lead = (m.getDay() - first() + 7) % 7;
    const start = new Date(m.getFullYear(), m.getMonth(), 1 - lead);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
    );
  };
  const weekdays = () => Array.from({ length: 7 }, (_, i) => localeInfo().daysShort[(first() + i) % 7]);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const cell = (children: JSX.Element, extra: object = {}) => (
    <view style={{ flex: 1, alignItems: "center", justifyContent: "center", ...extra }}>{children}</view>
  );
  const fs = () => (big() ? 13 : 12);

  return (
    <Card p={p()} style={{ flexDirection: "column", padding: 12, paddingTop: 10 }}>
      <view style={{ flexDirection: "row", alignItems: "center", height: 28, marginBottom: 6 }}>
        <view
          style={{ flex: 1, flexDirection: "row", alignItems: "baseline", paddingLeft: 4 }}
          onClick={() => setOffset(0)}
        >
          <text style={{ fontFamily: FONT_DISPLAY, fontSize: big() ? 17 : 15, fontWeight: 600, color: p().text, textTransform: "capitalize" }}>
            {formatDate(shown(), "MMMM")}
            <span style={{ fontWeight: 400, color: offset() === 0 ? p().accent : p().text2 }}>{" " + formatDate(shown(), "YYYY")}</span>
          </text>
        </view>
        <NavButton p={p()} dir={-1} size={28} onClick={() => setOffset(offset() - 1)} />
        <NavButton p={p()} dir={1} size={28} onClick={() => setOffset(offset() + 1)} />
      </view>

      <view style={{ flexDirection: "row", height: 18 }}>
        {s().showWeekNumbers ? cell(<text style={{ fontSize: 10, color: p().text3 }}>#</text>) : null}
        <For each={weekdays()}>
          {(d) => cell(<text style={{ fontSize: 11, fontWeight: 600, color: p().text3 }}>{d.slice(0, 2)}</text>)}
        </For>
      </view>

      <view style={{ flex: 1, flexDirection: "column" }}>
        <For each={weeks()}>
          {(week) => (
            <view style={{ flex: 1, flexDirection: "row" }}>
              {s().showWeekNumbers
                ? cell(<text style={{ fontSize: 10, color: p().text3 }}>{String(isoWeek(week[0]))}</text>)
                : null}
              <For each={week}>
                {(day) => {
                  const today = () => sameDay(day, now());
                  const inMonth = () => day.getMonth() === shown().getMonth();
                  return cell(
                    <view
                      style={{
                        width: dot(),
                        height: dot(),
                        borderRadius: dot() / 2,
                        alignItems: "center",
                        justifyContent: "center",
                        background: today() ? p().accent : "rgba(0,0,0,0)",
                      }}
                    >
                      <text
                        style={{
                          fontSize: fs(),
                          fontWeight: today() ? 600 : 400,
                          color: today() ? p().onAccent : inMonth() ? p().text : p().text3,
                          opacity: inMonth() || today() ? 1 : 0.7,
                        }}
                      >
                        {String(day.getDate())}
                      </text>
                    </view>,
                  );
                }}
              </For>
            </view>
          )}
        </For>
      </view>
    </Card>
  );
}

mount(() => <Calendar />);
