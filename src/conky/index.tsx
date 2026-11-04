// Conky: a tall column of readings (time, system, CPU, memory, drives, network, battery and an
// optional weather line), label left and value right, under small uppercase section rules.
import { createEffect, createMemo, createSignal, For, type JSX, on, onCleanup } from "solid-js";
import { formatBytes, formatDate, mount, useClock, useSettings, useSize, useStorage, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, FONT_SMALL, FONT_TEXT, LOOK, type Palette, clamp, shadeOf, usePalette, uses12h } from "../shared/ui";
import { t } from "../shared/i18n";
import { type Cache, REFRESH_MS, describe, load } from "../shared/meteo";

const HISTORY = 48;
// Reference design at 280 DIPs wide (4 cells), in DIPs at scale k = 1. Every length is multiplied
// by k, the largest scale at which every enabled section fits; text keeps a legible floor and
// rows, rules, bars and charts span the whole width of the column.
const REF_W = 280;
const PAD_X = 20;
const PAD_Y = 16;
const TIME = 48;
const DATE = 13;
const ROW = 18;
const TITLE = 14;
const TITLE_TEXT = 10;
const TEXT = 12;
const INNER = 6; // title → first row
const BAR = 3;
const BAR_GAP = 4; // row → its bar
const SPARK = 24;
const SPARK_GAP = 5; // bar or rows → chart
const DRIVE_GAP = 7;
const GAP = 10; // between sections, grows with spare height
const MAX_GAP = 28;
const MAX_DRIVES = 4;

/** Sizes in DIPs at scale k. */
function metrics(k: number) {
  const value = Math.max(TEXT * k, 12);
  const label = Math.max(TEXT * k, 11);
  const title = Math.max(TITLE_TEXT * k, 11);
  return {
    k,
    value,
    label,
    title,
    date: Math.max(DATE * k, 11),
    time: TIME * k,
    row: Math.max(ROW * k, value * 1.35),
    titleH: Math.max(TITLE * k, title * 1.3),
    inner: INNER * k,
    bar: Math.max(2, BAR * k),
    barGap: BAR_GAP * k,
    spark: SPARK * k,
    sparkGap: SPARK_GAP * k,
    driveGap: DRIVE_GAP * k,
    gap: GAP * k,
    padX: PAD_X * k,
    padY: PAD_Y * k,
  };
}
type M = ReturnType<typeof metrics>;

type Drive = { name: string; label: string; total: number; free: number; used: number };

const one = (b: number) => formatBytes(b, b >= 100 * 2 ** 30 ? 0 : 1);
const bytesNum = (b: number) => one(b).split(" ")[0];

function uptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function rate(bytesPerSec: number | undefined, units: string): string {
  if (bytesPerSec === undefined) return "–";
  const bits = units !== "bytes";
  let v = bits ? bytesPerSec * 8 : bytesPerSec;
  const names = bits ? ["bps", "Kbps", "Mbps", "Gbps"] : ["B/s", "KB/s", "MB/s", "GB/s"];
  let i = 0;
  while (v >= 1000 && i < names.length - 1) {
    v /= bits ? 1000 : 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${names[i]}`;
}

function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const nowrap = { whiteSpace: "nowrap", textOverflow: "ellipsis" } as const;

/** Small uppercase title followed by a hairline rule. */
function Title(props: { p: Palette; m: M; text: string }) {
  return (
    <view style={{ flexDirection: "row", alignItems: "center", gap: 8 * props.m.k, height: props.m.titleH, flexShrink: 0 }}>
      <text
        style={{
          fontFamily: FONT_SMALL,
          fontSize: props.m.title,
          fontWeight: 600,
          letterSpacing: props.m.title * 0.13,
          textTransform: "uppercase",
          color: props.p.accent,
          whiteSpace: "nowrap",
        }}
      >
        {props.text}
      </text>
      <view
        style={{
          flex: 1,
          height: 1,
          background: props.p.divider,
          boxShadow: props.p.bare ? `0 1px 2px ${shadeOf(props.p, 0.35)}` : undefined,
        }}
      />
    </view>
  );
}

/** A coloured dot that keys a row to its series in the chart below. */
const Key = (props: { m: M; color: string }) => (
  <view
    style={{
      width: 6 * props.m.k,
      height: 6 * props.m.k,
      borderRadius: 3 * props.m.k,
      background: props.color,
      marginRight: -3 * props.m.k,
      flexShrink: 0,
    }}
  />
);

/** Label left, value right, one line. `note` is a quieter suffix of the label. */
function Row(props: { p: Palette; m: M; label: JSX.Element; note?: string; value: string; strong?: boolean; dot?: string }) {
  return (
    <view style={{ flexDirection: "row", alignItems: "center", height: props.m.row, gap: 10 * props.m.k, flexShrink: 0 }}>
      {props.dot ? <Key m={props.m} color={props.dot} /> : null}
      <text style={{ fontFamily: FONT_TEXT, fontSize: props.m.label, color: props.p.text2, flexShrink: 1, minWidth: 0, ...nowrap }}>
        {props.label}
        {props.note ? <span style={{ color: props.p.text3 }}>{"  " + props.note}</span> : null}
      </text>
      <view style={{ flex: 1, minWidth: 0, flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
        <text
          style={{
            fontFamily: FONT_TEXT,
            fontSize: props.m.value,
            fontWeight: props.strong === false ? 400 : 600,
            color: props.p.text,
            maxWidth: "100%",
            ...nowrap,
          }}
        >
          {props.value}
        </text>
      </view>
    </view>
  );
}

function Bar(props: { p: Palette; m: M; value: number; width: number; color?: string }) {
  const v = () => clamp(props.value, 0, 1);
  return (
    <view
      style={{
        height: props.m.bar,
        borderRadius: props.m.bar,
        marginTop: props.m.barGap,
        flexShrink: 0,
        background: props.p.track,
        boxShadow: props.p.bare ? `0 1px 2px ${shadeOf(props.p, 0.4)}` : undefined,
      }}
    >
      <view
        style={{
          width: Math.max(v() > 0 ? props.m.bar : 0, v() * props.width),
          height: props.m.bar,
          borderRadius: props.m.bar,
          background: props.color ?? (v() >= 0.9 ? props.p.critical : props.p.accent),
          transition: "width 700ms ease",
        }}
      />
    </view>
  );
}

/**
 * History chart: a filled area (`area`) and an optional second series drawn as a line. Until
 * there are two samples to draw it keeps its space but stays empty, frame included.
 */
function Spark(props: { p: Palette; m: M; area: number[]; line?: number[]; max?: number; width: number }) {
  const h = () => props.m.spark;
  const k = () => props.m.k;
  const ready = () => props.area.length > 1;
  const top = () => props.max ?? Math.max(1, ...props.area, ...(props.line ?? []));
  const pts = (v: number[]) => {
    const step = props.width / (HISTORY - 1);
    const x0 = props.width - (v.length - 1) * step;
    return v.map((y, i) => [x0 + i * step, h() - k() - clamp(y / top(), 0, 1) * (h() - 3 * k())] as const);
  };
  const line = (v: number[]) =>
    v.length < 2 ? "" : "M " + pts(v).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  const area = () => {
    const v = props.area;
    if (v.length < 2) return "";
    const p = pts(v);
    return `M ${p[0][0].toFixed(1)} ${h()} L ` + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ") + ` L ${props.width} ${h()} Z`;
  };
  const last = () => {
    const v = props.area;
    return v.length ? pts(v)[v.length - 1] : null;
  };
  return (
    <view style={{ height: h(), marginTop: props.m.sparkGap, flexShrink: 0 }}>
      {ready() ? (
        <svg width={props.width} height={h()} viewBox={`0 0 ${props.width} ${h()}`}>
          <path d={`M 0 ${h() - 0.5} L ${props.width} ${h() - 0.5}`} stroke={props.p.track} strokeWidth={1} />
          <path
            d={`M 0 ${(h() / 2).toFixed(1)} L ${props.width} ${(h() / 2).toFixed(1)}`}
            stroke={props.p.track}
            strokeWidth={1}
            strokeDasharray={`${2 * k()} ${3 * k()}`}
          />
          {props.p.bare ? <path d={line(props.area)} fill="none" stroke={shadeOf(props.p, 0.35)} strokeWidth={3 * k()} strokeLinejoin="round" /> : null}
          <path d={area()} fill={props.p.accent} fillOpacity={props.p.bare ? 0.22 : 0.16} />
          {props.line ? (
            <path d={line(props.line)} fill="none" stroke={props.p.text3} strokeWidth={1.2 * k()} strokeLinejoin="round" strokeLinecap="round" />
          ) : null}
          <path d={line(props.area)} fill="none" stroke={props.p.accent} strokeWidth={1.5 * k()} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={last()![0] - 1.5 * k()} cy={last()![1]} r={2 * k()} fill={props.p.accent} />
        </svg>
      ) : null}
    </view>
  );
}

function Conky() {
  const s = useSettings({
    ...LOOK,
    showSystem: true,
    showCpu: true,
    showMemory: true,
    showDrives: true,
    showNetwork: true,
    showBattery: true,
    showWeather: false,
    hourFormat: "auto",
    units: "bits",
    interval: 2,
    city: "Rome",
    temperature: "celsius",
  });
  const p = usePalette(s);
  const size = useSize();
  const now = useClock("minute");
  const snap = useSystem(["system", "cpu", "memory", "drives", "network", "battery"], Math.max(1, s().interval) * 1000);

  const [cpuH, setCpuH] = createSignal<number[]>([]);
  const [rxH, setRxH] = createSignal<number[]>([]);
  const [txH, setTxH] = createSignal<number[]>([]);
  createEffect(() => {
    const { cpu, network } = snap();
    if (cpu) setCpuH((h) => [...h, cpu.usage].slice(-HISTORY));
    if (network) {
      setRxH((h) => [...h, network.rxPerSec].slice(-HISTORY));
      setTxH((h) => [...h, network.txPerSec].slice(-HISTORY));
    }
  });

  // Weather one-liner, cached like the Weather widget.
  const [wx, setWx] = useStorage<Cache | null>("weather", null);
  const city = () => (s().city || "").trim();
  const fresh = (c: Cache | null) => !!c && c.query.toLowerCase() === city().toLowerCase() && c.units === s().temperature;
  const refresh = async () => {
    if (!s().showWeather || !city()) return;
    const c = wx();
    if (fresh(c) && Date.now() - c!.fetchedAt < REFRESH_MS) return;
    try {
      setWx(await load(city(), s().temperature, c && c.query.toLowerCase() === city().toLowerCase() ? c : null));
    } catch {
      /* keep the last reading; the line hides when there is none */
    }
  };
  createEffect(on([city, () => s().temperature, () => s().showWeather], () => void refresh()));
  const timer = setInterval(() => void refresh(), REFRESH_MS);
  onCleanup(() => clearInterval(timer));

  const W = () => size().width || REF_W;
  const H = () => size().height || 568;
  const h12 = () => uses12h(s().hourFormat);

  const drives = (): Drive[] =>
    (snap().drives ?? [])
      .filter((d) => d.total > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, MAX_DRIVES);
  const battery = () => {
    const b = snap().battery;
    return b && b.hasBattery && b.level !== undefined ? b : null;
  };
  const weather = () => (s().showWeather && fresh(wx()) ? wx() : null);

  // Every enabled section always shows: the column scales down to fit them all.
  type Part = "system" | "cpu" | "memory" | "drives" | "network" | "battery";
  const parts = (m: M): [Part, number][] => {
    const sec = (rows: number, bars = 0, sparks = 0) =>
      m.titleH + m.inner + rows * m.row + bars * (m.bar + m.barGap) + sparks * (m.spark + m.sparkGap);
    const nd = drives().length;
    return (
      [
        ["system", s().showSystem ? sec(3) : 0],
        ["cpu", s().showCpu ? sec(1, 1, 1) : 0],
        ["memory", s().showMemory ? sec(1, 1) : 0],
        ["drives", s().showDrives && nd > 0 ? sec(nd, nd) + (nd - 1) * m.driveGap : 0],
        ["network", s().showNetwork ? sec(2, 0, 1) : 0],
        ["battery", s().showBattery && battery() ? sec(1, 1) : 0],
      ] as [Part, number][]
    ).filter(([, h]) => h > 0);
  };
  const headerH = (m: M) => m.time * 1.02 + 4 * m.k + Math.max(18 * m.k, m.date * 1.35) + (weather() ? m.row : 0);
  const height = (m: M) => {
    const l = parts(m);
    return 2 * m.padY + headerH(m) + l.reduce((a, [, h]) => a + h + m.gap, 0);
  };
  // The largest scale at which the column fits the box (text floors make height(k) non-linear).
  const m = createMemo(() => {
    let lo = 0.3;
    let hi = W() / REF_W;
    if (height(metrics(hi)) <= H()) lo = hi;
    else
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (height(metrics(mid)) <= H()) lo = mid;
        else hi = mid;
      }
    return metrics(lo);
  });
  // Spare height opens up the gaps between sections, then centres the column.
  const gap = () => {
    const l = parts(m());
    const spare = H() - height(m());
    return Math.min(m().gap + spare / Math.max(1, l.length), MAX_GAP * m().k);
  };
  const shown = (k: Part) => parts(m()).some(([x]) => x === k);
  const inner = () => W() - 2 * m().padX;

  const sys = () => snap().system;
  const cpu = () => snap().cpu;
  const mem = () => snap().memory;
  const net = () => snap().network;
  const section = () => ({ flexDirection: "column" as const, marginTop: gap(), flexShrink: 0 });

  return (
    <Card p={p()} style={{ flexDirection: "column", justifyContent: "center", paddingHorizontal: m().padX, paddingVertical: m().padY }}>
      {/* Header: time, date, weather */}
      <view style={{ flexDirection: "column", flexShrink: 0 }}>
        <text
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: m().time,
            fontWeight: 600,
            lineHeight: 1.02,
            color: p().text,
            whiteSpace: "nowrap",
            letterSpacing: -0.5 * m().k,
          }}
        >
          {formatDate(now(), h12() ? "h:mm" : "HH:mm")}
          {h12() ? (
            <span style={{ fontSize: m().time * 0.34, fontWeight: 600, color: p().text2, letterSpacing: 0 }}>
              {" " + (formatDate(now(), "A") || (now().getHours() < 12 ? "AM" : "PM"))}
            </span>
          ) : null}
        </text>
        <view style={{ height: Math.max(18 * m().k, m().date * 1.35), marginTop: 4 * m().k, flexDirection: "row", alignItems: "center" }}>
          <text style={{ fontFamily: FONT_TEXT, fontSize: m().date, color: p().text2, ...nowrap }}>
            <span style={{ color: p().accent, fontWeight: 600 }}>{formatDate(now(), "dddd")}</span>
            {formatDate(now(), ", D MMMM YYYY")}
          </text>
        </view>
        {weather() ? (
          <view style={{ height: m().row, flexDirection: "row", alignItems: "center" }}>
            <text style={{ fontFamily: FONT_TEXT, fontSize: m().label, color: p().text3, ...nowrap }}>
              <span style={{ color: p().text, fontWeight: 600 }}>{`${weather()!.current.temp}°`}</span>
              {`  ${describe(weather()!.current.code, weather()!.current.isDay)[1]}  ·  ${weather()!.place}`}
            </text>
          </view>
        ) : null}
      </view>

      {shown("system") ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("system")} />
          <view style={{ height: m().inner }} />
          <Row p={p()} m={m()} label={t("host")} value={sys()?.hostname || "–"} />
          <Row p={p()} m={m()} label={t("os")} value={sys()?.os ? sys()!.os.replace(/\s*\(build [^)]*\)/i, "") : "–"} strong={false} />
          <Row p={p()} m={m()} label={t("uptime")} value={sys() ? uptime(sys()!.uptime) : "–"} />
        </view>
      ) : null}

      {shown("cpu") ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("cpu")} />
          <view style={{ height: m().inner }} />
          <Row
            p={p()}
            m={m()}
            label={t("usage")}
            note={cpu() ? t("cores", { n: cpu()!.cores }) : undefined}
            value={cpu() ? `${Math.round(cpu()!.usage)}%` : "–"}
          />
          <Bar p={p()} m={m()} value={(cpu()?.usage ?? 0) / 100} width={inner()} />
          <Spark p={p()} m={m()} area={cpuH()} max={100} width={inner()} />
        </view>
      ) : null}

      {shown("memory") ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("memory")} />
          <view style={{ height: m().inner }} />
          <Row
            p={p()}
            m={m()}
            label={t("used")}
            note={mem() ? `${Math.round((mem()!.used / mem()!.total) * 100)}%` : undefined}
            value={mem() ? `${bytesNum(mem()!.used)} / ${formatBytes(mem()!.total, 0)}` : "–"}
          />
          <Bar p={p()} m={m()} value={mem() ? mem()!.used / mem()!.total : 0} width={inner()} />
        </view>
      ) : null}

      {shown("drives") ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("drives")} />
          <view style={{ height: m().inner }} />
          <view style={{ flexDirection: "column", gap: m().driveGap }}>
            <For each={drives()}>
              {(d) => (
                <view style={{ flexDirection: "column" }}>
                  <Row
                    p={p()}
                    m={m()}
                    label={<span style={{ color: p().text, fontWeight: 600 }}>{d.name.replace(/\\$/, "")}</span>}
                    note={inner() >= 220 ? d.label || t("localDisk") : undefined}
                    value={t("freeAmt", { a: one(d.free) })}
                  />
                  <Bar p={p()} m={m()} value={d.used / d.total} width={inner()} />
                </view>
              )}
            </For>
          </view>
        </view>
      ) : null}

      {shown("network") ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("network")} />
          <view style={{ height: m().inner }} />
          <Row p={p()} m={m()} label={t("download")} dot={p().accent} value={rate(net()?.rxPerSec, s().units)} />
          <Row p={p()} m={m()} label={t("upload")} dot={p().text3} value={rate(net()?.txPerSec, s().units)} />
          <Spark p={p()} m={m()} area={rxH()} line={txH()} width={inner()} />
        </view>
      ) : null}

      {shown("battery") && battery() ? (
        <view style={section()}>
          <Title p={p()} m={m()} text={t("battery")} />
          <view style={{ height: m().inner }} />
          <Row
            p={p()}
            m={m()}
            label={battery()!.charging ? t("charging") : battery()!.powerSource === "ac" ? t("pluggedIn") : t("onBattery")}
            note={!battery()!.charging && battery()!.remainingSeconds ? t("timeLeft", { t: duration(battery()!.remainingSeconds!) }) : undefined}
            value={`${Math.round(battery()!.level!)}%`}
          />
          <Bar
            p={p()}
            m={m()}
            value={battery()!.level! / 100}
            width={inner()}
            color={battery()!.charging ? p().success : battery()!.level! <= 20 ? p().critical : p().accent}
          />
        </view>
      ) : null}
    </Card>
  );
}

mount(() => <Conky />);
