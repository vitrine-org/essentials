import { Index } from "solid-js";
import { formatDate, localeInfo, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, LOOK, type Palette, Txt, clamp, shadeOf, usePalette } from "../shared/ui";
import { t } from "../shared/i18n";

interface Span {
  label: string;
  detail: string;
  value: number;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const frac = (now: Date, a: Date, b: Date) => clamp((now.getTime() - a.getTime()) / (b.getTime() - a.getTime()), 0, 1);

function spans(now: Date, firstDay: number, show: { day: boolean; week: boolean; month: boolean; year: boolean }): Span[] {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const out: Span[] = [];
  if (show.day) out.push({ label: t("today"), detail: cap(formatDate(now, "dddd")), value: frac(now, new Date(y, m, d), new Date(y, m, d + 1)) });
  if (show.week) {
    const back = (now.getDay() - firstDay + 7) % 7;
    const a = new Date(y, m, d - back);
    out.push({ label: t("week"), detail: t("dayOf", { a: back + 1, b: 7 }), value: frac(now, a, new Date(y, m, d - back + 7)) });
  }
  if (show.month) {
    const len = new Date(y, m + 1, 0).getDate();
    out.push({ label: cap(formatDate(now, "MMMM")), detail: t("dayOf", { a: d, b: len }), value: frac(now, new Date(y, m, 1), new Date(y, m + 1, 1)) });
  }
  if (show.year) {
    const a = new Date(y, 0, 1);
    const b = new Date(y + 1, 0, 1);
    const n = Math.floor((new Date(y, m, d).getTime() - a.getTime()) / 86_400_000) + 1;
    out.push({ label: String(y), detail: t("dayOf", { a: n, b: Math.round((b.getTime() - a.getTime()) / 86_400_000) }), value: frac(now, a, b) });
  }
  return out;
}

function Bar(props: { p: Palette; s: Span; width: number }) {
  return (
    <view style={{ flex: 1, flexDirection: "column", justifyContent: "center", gap: 5 }}>
      <view style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Txt p={props.p} lite style={{ fontSize: 12, fontWeight: 600, color: props.p.text2, whiteSpace: "nowrap" }}>
          {() => props.s.label}
        </Txt>
        <Txt p={props.p} lite box={{ flex: 1, marginLeft: 8, minWidth: 0 }} style={{ fontSize: 10, color: props.p.text3, whiteSpace: "nowrap", textOverflow: "ellipsis", marginBottom: 1 }}>
          {() => props.s.detail}
        </Txt>
        <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: props.p.text }}>
          {() => `${Math.floor(props.s.value * 100)}%`}
        </Txt>
      </view>
      <view style={{ height: 4, borderRadius: 2, background: props.p.track, boxShadow: props.p.bare ? `0 1px 2px ${shadeOf(props.p, 0.4)}` : undefined }}>
        <view
          style={{
            width: Math.max(4, Math.round(props.s.value * props.width)),
            height: 4,
            borderRadius: 2,
            background: props.p.accent,
            transition: "width 700ms ease",
          }}
        />
      </view>
    </view>
  );
}

function Ring(props: { p: Palette; s: Span; d: number }) {
  const stroke = () => Math.max(4, Math.round(props.d / 11));
  const r = () => (props.d - stroke() - 2) / 2;
  const c = () => props.d / 2;
  const circ = () => 2 * Math.PI * r();
  return (
    <view style={{ flex: 1, flexDirection: "column", alignItems: "center", gap: 6 }}>
      <view style={{ width: props.d, height: props.d }}>
        <svg width={props.d} height={props.d} viewBox={`0 0 ${props.d} ${props.d}`}>
          {props.p.bare ? <circle cx={c()} cy={c() + 1} r={r()} fill="none" stroke={shadeOf(props.p, 0.3)} strokeWidth={stroke() + 2} /> : null}
          <circle cx={c()} cy={c()} r={r()} fill="none" stroke={props.p.track} strokeWidth={stroke()} />
          <circle
            cx={c()}
            cy={c()}
            r={r()}
            fill="none"
            stroke={props.p.accent}
            strokeWidth={stroke()}
            strokeLinecap="round"
            strokeDasharray={`${(props.s.value * circ()).toFixed(2)} ${circ().toFixed(2)}`}
            transform={`rotate(-90 ${c()} ${c()})`}
            opacity={props.s.value > 0.004 ? 1 : 0}
          />
        </svg>
        <view style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(props.d * 0.26), fontWeight: 600, color: props.p.text }}>
            {(tint) => (
              <>
                {String(Math.floor(props.s.value * 100))}
                <span style={{ fontSize: Math.round(props.d * 0.16), fontWeight: 400, color: tint(props.p.text2) }}>%</span>
              </>
            )}
          </Txt>
        </view>
      </view>
      <Txt p={props.p} lite style={{ fontSize: 12, fontWeight: 600, color: props.p.text2, whiteSpace: "nowrap" }}>
        {() => props.s.label}
      </Txt>
    </view>
  );
}

function Progress() {
  const s = useSettings({ ...LOOK, style: "bars", showDay: true, showWeek: true, showMonth: true, showYear: true, firstDayOfWeek: "auto" });
  const p = usePalette(s);
  const size = useSize();
  const now = useClock("minute");
  const first = () => (s().firstDayOfWeek === "auto" ? localeInfo().firstDayOfWeek : Number(s().firstDayOfWeek)) || 0;
  const list = () => spans(now(), first(), { day: s().showDay, week: s().showWeek, month: s().showMonth, year: s().showYear });
  const rings = () => s().style === "rings";
  const n = () => Math.max(1, list().length);
  const ringD = () => Math.floor(clamp(Math.min((size().width - 32) / n() - 10, size().height - 54), 36, 72));

  return (
    <Card
      p={p()}
      style={{
        flexDirection: rings() ? "row" : "column",
        alignItems: rings() ? "center" : "stretch",
        paddingHorizontal: 16,
        paddingVertical: rings() ? 14 : 10,
        gap: rings() ? 6 : 2,
      }}
    >
      <Index each={list()}>{(x) => (rings() ? <Ring p={p()} s={x()} d={ringD()} /> : <Bar p={p()} s={x()} width={size().width - 32} />)}</Index>
    </Card>
  );
}

mount(() => <Progress />);
