import { createSignal, For } from "solid-js";
import { formatDate, localeInfo, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, HoverLayer, type Palette, Txt, shadeOf, usePalette, usePress } from "../shared/ui";

/** ISO-8601 week number. */
function isoWeek(d: Date): number {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(t.getFullYear(), 0, 4);
  return 1 + Math.round(((t.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
}

const sameDay = (a: Date | null, b: Date) =>
  !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function NavButton(props: { p: Palette; dir: -1 | 1; size: number; onClick: () => void }) {
  const press = usePress();
  const c = () => props.size / 2;
  const d = () =>
    props.dir < 0
      ? `M ${c() + 2} ${c() - 4.5} L ${c() - 2.5} ${c()} L ${c() + 2} ${c() + 4.5}`
      : `M ${c() - 2} ${c() - 4.5} L ${c() + 2.5} ${c()} L ${c() - 2} ${c() + 4.5}`;
  return (
    <view
      onClick={props.onClick}
      {...press.handlers}
      style={{ width: props.size, height: props.size, alignItems: "center", justifyContent: "center" }}
    >
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={4} />
      <svg width={props.size} height={props.size} viewBox={`0 0 ${props.size} ${props.size}`}>
        {props.p.bare ? (
          <path d={d()} fill="none" stroke={shadeOf(props.p, 0.45)} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 1)" />
        ) : null}
        <path
          d={d()}
          fill="none"
          stroke={props.p.text2}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={press.down() ? 0.7 : 1}
        />
      </svg>
    </view>
  );
}

function Day(props: {
  p: Palette;
  day: Date;
  today: boolean;
  selected: boolean;
  inMonth: boolean;
  dot: number;
  fontSize: number;
  onClick: () => void;
}) {
  const press = usePress();
  const color = () => (props.today ? props.p.onAccent : props.inMonth ? props.p.text : props.p.text3);
  return (
    <view style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <view
        onClick={props.onClick}
        {...press.handlers}
        style={{
          width: props.dot,
          height: props.dot,
          borderRadius: props.dot / 2,
          alignItems: "center",
          justifyContent: "center",
          background: props.today ? props.p.accent : "rgba(0,0,0,0)",
          border: props.selected && !props.today ? `1.5px solid ${props.p.accent}` : undefined,
          boxShadow: props.today && props.p.bare ? `0 1px 4px ${shadeOf(props.p, 0.45)}` : undefined,
        }}
      >
        {props.today ? null : <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={props.dot / 2} />}
        {props.today ? (
          <text style={{ fontSize: props.fontSize, fontWeight: 600, color: color() }}>{String(props.day.getDate())}</text>
        ) : (
          <Txt
            p={props.p}
            lite
            style={{
              fontSize: props.fontSize,
              fontWeight: props.selected ? 600 : 400,
              color: color(),
              opacity: props.inMonth || props.p.bare ? 1 : 0.75,
            }}
          >
            {() => String(props.day.getDate())}
          </Txt>
        )}
      </view>
    </view>
  );
}

function Calendar() {
  const s = useSettings({ background: "card", theme: "auto", accent: "system", firstDayOfWeek: "auto", showWeekNumbers: false });
  const p = usePalette(s);
  const now = useClock("minute");
  const size = useSize();
  const [offset, setOffset] = createSignal(0); // months from the current one
  const [selected, setSelected] = createSignal<Date | null>(null);

  const first = () => (s().firstDayOfWeek === "auto" ? localeInfo().firstDayOfWeek : Number(s().firstDayOfWeek)) || 0;
  const shown = () => new Date(now().getFullYear(), now().getMonth() + offset(), 1);
  const big = () => size().width >= 270;
  const cellH = () => Math.floor((size().height - 16 - 32 - 8 - 16) / 6);
  const dot = () => Math.min(cellH(), big() ? 32 : 24);

  const weeks = () => {
    const m = shown();
    const lead = (m.getDay() - first() + 7) % 7;
    const start = new Date(m.getFullYear(), m.getMonth(), 1 - lead);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
    );
  };
  const weekdays = () => Array.from({ length: 7 }, (_, i) => localeInfo().daysShort[(first() + i) % 7]);
  const pick = (day: Date) => {
    const months = (day.getFullYear() - now().getFullYear()) * 12 + day.getMonth() - now().getMonth();
    setOffset(months);
    setSelected(sameDay(selected(), day) ? null : day);
  };
  const header = (label: string) => (
    <view style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Txt p={p()} lite style={{ fontSize: 11, fontWeight: 600, color: p().text3, textTransform: "capitalize" }}>
        {() => label}
      </Txt>
    </view>
  );

  return (
    <Card p={p()} style={{ flexDirection: "column", padding: 8, paddingHorizontal: 12 }}>
      <view style={{ flexDirection: "row", alignItems: "center", height: 32, marginBottom: 8 }}>
        <view
          style={{ flex: 1, flexDirection: "row", alignItems: "center", height: 32, paddingHorizontal: 4 }}
          onClick={() => (setOffset(0), setSelected(null))}
        >
          <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: big() ? 18 : 16, fontWeight: 600, color: p().text, textTransform: "capitalize" }}>
            {(t) => (
              <>
                {formatDate(shown(), "MMMM")}
                <span style={{ fontWeight: 400, color: t(offset() === 0 ? p().accent : p().text2) }}>{" " + formatDate(shown(), "YYYY")}</span>
              </>
            )}
          </Txt>
        </view>
        <NavButton p={p()} dir={-1} size={32} onClick={() => setOffset(offset() - 1)} />
        <NavButton p={p()} dir={1} size={32} onClick={() => setOffset(offset() + 1)} />
      </view>

      <view style={{ flexDirection: "row", height: 16 }}>
        {s().showWeekNumbers ? header("#") : null}
        <For each={weekdays()}>{(d) => header(d.slice(0, 2))}</For>
      </view>

      <view style={{ flex: 1, flexDirection: "column" }}>
        <For each={weeks()}>
          {(week) => (
            <view style={{ flex: 1, flexDirection: "row" }}>
              {s().showWeekNumbers ? header(String(isoWeek(week[0]))) : null}
              <For each={week}>
                {(day) => (
                  <Day
                    p={p()}
                    day={day}
                    today={sameDay(now(), day)}
                    selected={sameDay(selected(), day)}
                    inMonth={day.getMonth() === shown().getMonth()}
                    dot={dot()}
                    fontSize={big() ? 13 : 12}
                    onClick={() => pick(day)}
                  />
                )}
              </For>
            </view>
          )}
        </For>
      </view>
    </Card>
  );
}

mount(() => <Calendar />);
