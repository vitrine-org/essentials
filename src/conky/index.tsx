// Conky: a tall column of readings (time, system, CPU, memory, drives, network, battery and an
// optional weather line), label left and value right, under small uppercase section rules.
import { createEffect, createSignal, For, type JSX, on, onCleanup } from "solid-js";
import { formatBytes, formatDate, mount, useClock, useSettings, useSize, useStorage, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, FONT_SMALL, FONT_TEXT, LOOK, type Palette, clamp, shadeOf, usePalette, uses12h } from "../shared/ui";
import { t } from "../shared/i18n";
import { type Cache, REFRESH_MS, describe, load } from "../shared/meteo";

const HISTORY = 48;
// Vertical rhythm, in DIPs: every height below is fixed so the layout can be planned to fit.
const ROW = 18;
const TITLE = 14;
const INNER = 6; // title → first row
const BAR = 3;
const BAR_GAP = 4; // row → its bar
const SPARK = 24;
const SPARK_GAP = 5; // bar or rows → chart
const DRIVE_GAP = 7;

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
function Title(props: { p: Palette; text: string }) {
  return (
    <view style={{ flexDirection: "row", alignItems: "center", gap: 8, height: TITLE, flexShrink: 0 }}>
      <text
        style={{
          fontFamily: FONT_SMALL,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.3,
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
const Key = (props: { color: string }) => (
  <view style={{ width: 6, height: 6, borderRadius: 3, background: props.color, marginRight: -3, flexShrink: 0 }} />
);

/** Label left, value right, one line. `note` is a quieter suffix of the label. */
function Row(props: { p: Palette; label: JSX.Element; note?: string; value: string; strong?: boolean; dot?: string }) {
  return (
    <view style={{ flexDirection: "row", alignItems: "center", height: ROW, gap: 10, flexShrink: 0 }}>
      {props.dot ? <Key color={props.dot} /> : null}
      <text style={{ fontFamily: FONT_TEXT, fontSize: 12, color: props.p.text2, flexShrink: 0, ...nowrap }}>
        {props.label}
        {props.note ? <span style={{ color: props.p.text3 }}>{"  " + props.note}</span> : null}
      </text>
      <view style={{ flex: 1, minWidth: 0, flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
        <text
          style={{
            fontFamily: FONT_TEXT,
            fontSize: 12,
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

function Bar(props: { p: Palette; value: number; width: number; color?: string }) {
  const v = () => clamp(props.value, 0, 1);
  return (
    <view
      style={{
        height: BAR,
        borderRadius: 2,
        marginTop: BAR_GAP,
        flexShrink: 0,
        background: props.p.track,
        boxShadow: props.p.bare ? `0 1px 2px ${shadeOf(props.p, 0.4)}` : undefined,
      }}
    >
      <view
        style={{
          width: Math.max(v() > 0 ? 3 : 0, Math.round(v() * props.width)),
          height: BAR,
          borderRadius: 2,
          background: props.color ?? (v() >= 0.9 ? props.p.critical : props.p.accent),
          transition: "width 700ms ease",
        }}
      />
    </view>
  );
}

/** History chart: a filled area (`area`) and an optional second series drawn as a line. */
function Spark(props: { p: Palette; area: number[]; line?: number[]; max?: number; width: number }) {
  const h = SPARK;
  const top = () => props.max ?? Math.max(1, ...props.area, ...(props.line ?? []));
  const pts = (v: number[]) => {
    const step = props.width / (HISTORY - 1);
    const x0 = props.width - (v.length - 1) * step;
    return v.map((y, i) => [x0 + i * step, h - 1 - clamp(y / top(), 0, 1) * (h - 3)] as const);
  };
  const line = (v: number[]) =>
    v.length < 2 ? "" : "M " + pts(v).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  const area = () => {
    const v = props.area;
    if (v.length < 2) return "";
    const p = pts(v);
    return `M ${p[0][0].toFixed(1)} ${h} L ` + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ") + ` L ${props.width} ${h} Z`;
  };
  const last = () => {
    const v = props.area;
    return v.length ? pts(v)[v.length - 1] : null;
  };
  return (
    <view style={{ height: h, marginTop: SPARK_GAP, flexShrink: 0 }}>
      <svg width={props.width} height={h} viewBox={`0 0 ${props.width} ${h}`}>
        <path d={`M 0 ${h - 0.5} L ${props.width} ${h - 0.5}`} stroke={props.p.track} strokeWidth={1} />
        <path d={`M 0 ${(h / 2).toFixed(1)} L ${props.width} ${(h / 2).toFixed(1)}`} stroke={props.p.track} strokeWidth={1} strokeDasharray="2 3" />
        {props.p.bare ? <path d={line(props.area)} fill="none" stroke={shadeOf(props.p, 0.35)} strokeWidth={3} strokeLinejoin="round" /> : null}
        <path d={area()} fill={props.p.accent} fillOpacity={props.p.bare ? 0.22 : 0.16} />
        {props.line ? (
          <path d={line(props.line)} fill="none" stroke={props.p.text3} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
        <path d={line(props.area)} fill="none" stroke={props.p.accent} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {props.area.length > 1 ? <circle cx={last()![0] - 1.5} cy={last()![1]} r={2} fill={props.p.accent} /> : null}
      </svg>
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

  const W = () => size().width || 280;
  const H = () => size().height || 568;
  const padX = () => (W() >= 300 ? 22 : 18);
  const inner = () => W() - 2 * padX();
  const h12 = () => uses12h(s().hourFormat);
  const timeSize = () => Math.round(clamp(W() * 0.17, 34, 60));

  const drives = (): Drive[] => (snap().drives ?? []).filter((d) => d.total > 0).sort((a, b) => a.name.localeCompare(b.name));
  const battery = () => {
    const b = snap().battery;
    return b && b.hasBattery && b.level !== undefined ? b : null;
  };
  const weather = () => (s().showWeather && fresh(wx()) ? wx() : null);

  // Plan which sections and charts fit: drop the charts first, then trailing drives.
  const headerH = () => Math.round(timeSize() * 1.02) + 4 + 18 + (weather() ? 18 : 0);
  type Part = "system" | "cpu" | "memory" | "drives" | "network" | "battery";
  type Plan = { sparks: boolean; drives: number; gap: number; show: Set<Part> };
  const plan = (): Plan => {
    const sec = (rows: number, bars = 0, sparks = 0) => TITLE + INNER + rows * ROW + bars * (BAR + BAR_GAP) + sparks * (SPARK + SPARK_GAP);
    const list = (sparks: boolean, nd: number): [Part, number][] =>
      (
        [
          ["system", s().showSystem ? sec(3) : 0],
          ["cpu", s().showCpu ? sec(1, 1, sparks ? 1 : 0) : 0],
          ["memory", s().showMemory ? sec(1, 1) : 0],
          ["drives", s().showDrives && nd > 0 ? sec(nd, nd) + (nd - 1) * DRIVE_GAP : 0],
          ["network", s().showNetwork ? sec(2, 0, sparks ? 1 : 0) : 0],
          ["battery", s().showBattery && battery() ? sec(1, 1) : 0],
        ] as [Part, number][]
      ).filter(([, h]) => h > 0);
    const avail = H() - 2 * 16 - headerH();
    const total = (l: [Part, number][], gap: number) => l.reduce((a, [, h]) => a + h + gap, 0);
    let nd = Math.min(drives().length, 4);
    let sparks = true;
    let l = list(sparks, nd);
    // Drop the charts, then trailing drives, then whole sections from the bottom.
    while (l.length && total(l, 10) > avail) {
      if (sparks) sparks = false;
      else if (nd > 1) nd--;
      else {
        l.pop();
        continue;
      }
      l = list(sparks, nd);
    }
    const spare = avail - total(l, 0);
    return { sparks, drives: nd, gap: Math.floor(clamp(spare / Math.max(1, l.length), 10, 28)), show: new Set(l.map(([k]) => k)) };
  };
  const shown = (k: Part) => plan().show.has(k);

  const sys = () => snap().system;
  const cpu = () => snap().cpu;
  const mem = () => snap().memory;
  const net = () => snap().network;

  return (
    <Card p={p()} style={{ flexDirection: "column", paddingHorizontal: padX(), paddingVertical: 16 }}>
      {/* Header: time, date, weather */}
      <view style={{ flexDirection: "column", flexShrink: 0 }}>
        <text
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: timeSize(),
            fontWeight: 600,
            lineHeight: 1.02,
            color: p().text,
            whiteSpace: "nowrap",
            letterSpacing: -0.5,
          }}
        >
          {formatDate(now(), h12() ? "h:mm" : "HH:mm")}
          {h12() ? (
            <span style={{ fontSize: Math.round(timeSize() * 0.34), fontWeight: 600, color: p().text2, letterSpacing: 0 }}>
              {" " + (formatDate(now(), "A") || (now().getHours() < 12 ? "AM" : "PM"))}
            </span>
          ) : null}
        </text>
        <view style={{ height: 18, marginTop: 4, flexDirection: "row", alignItems: "center" }}>
          <text style={{ fontFamily: FONT_TEXT, fontSize: 13, color: p().text2, ...nowrap }}>
            <span style={{ color: p().accent, fontWeight: 600 }}>{formatDate(now(), "dddd")}</span>
            {formatDate(now(), ", D MMMM YYYY")}
          </text>
        </view>
        {weather() ? (
          <view style={{ height: 18, flexDirection: "row", alignItems: "center" }}>
            <text style={{ fontFamily: FONT_TEXT, fontSize: 12, color: p().text3, ...nowrap }}>
              <span style={{ color: p().text, fontWeight: 600 }}>{`${weather()!.current.temp}°`}</span>
              {`  ${describe(weather()!.current.code, weather()!.current.isDay)[1]}  ·  ${weather()!.place}`}
            </text>
          </view>
        ) : null}
      </view>

      {shown("system") ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("system")} />
          <view style={{ height: INNER }} />
          <Row p={p()} label={t("host")} value={sys()?.hostname || "–"} />
          <Row p={p()} label={t("os")} value={sys()?.os ? sys()!.os.replace(/\s*\(build [^)]*\)/i, "") : "–"} strong={false} />
          <Row p={p()} label={t("uptime")} value={sys() ? uptime(sys()!.uptime) : "–"} />
        </view>
      ) : null}

      {shown("cpu") ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("cpu")} />
          <view style={{ height: INNER }} />
          <Row p={p()} label={t("usage")} note={cpu() ? t("cores", { n: cpu()!.cores }) : undefined} value={cpu() ? `${Math.round(cpu()!.usage)}%` : "–"} />
          <Bar p={p()} value={(cpu()?.usage ?? 0) / 100} width={inner()} />
          {plan().sparks ? <Spark p={p()} area={cpuH()} max={100} width={inner()} /> : null}
        </view>
      ) : null}

      {shown("memory") ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("memory")} />
          <view style={{ height: INNER }} />
          <Row
            p={p()}
            label={t("used")}
            note={mem() ? `${Math.round((mem()!.used / mem()!.total) * 100)}%` : undefined}
            value={mem() ? `${bytesNum(mem()!.used)} / ${formatBytes(mem()!.total, 0)}` : "–"}
          />
          <Bar p={p()} value={mem() ? mem()!.used / mem()!.total : 0} width={inner()} />
        </view>
      ) : null}

      {shown("drives") ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("drives")} />
          <view style={{ height: INNER }} />
          <view style={{ flexDirection: "column", gap: DRIVE_GAP }}>
            <For each={drives().slice(0, plan().drives)}>
              {(d) => (
                <view style={{ flexDirection: "column" }}>
                  <Row
                    p={p()}
                    label={<span style={{ color: p().text, fontWeight: 600 }}>{d.name.replace(/\\$/, "")}</span>}
                    note={inner() >= 220 ? d.label || t("localDisk") : undefined}
                    value={t("freeAmt", { a: one(d.free) })}
                  />
                  <Bar p={p()} value={d.used / d.total} width={inner()} />
                </view>
              )}
            </For>
          </view>
        </view>
      ) : null}

      {shown("network") ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("network")} />
          <view style={{ height: INNER }} />
          <Row
            p={p()}
            label={t("download")}
            dot={plan().sparks ? p().accent : undefined}
            value={rate(net()?.rxPerSec, s().units)}
          />
          <Row p={p()} label={t("upload")} dot={plan().sparks ? p().text3 : undefined} value={rate(net()?.txPerSec, s().units)} />
          {plan().sparks ? <Spark p={p()} area={rxH()} line={txH()} width={inner()} /> : null}
        </view>
      ) : null}

      {shown("battery") && battery() ? (
        <view style={{ flexDirection: "column", marginTop: plan().gap, flexShrink: 0 }}>
          <Title p={p()} text={t("battery")} />
          <view style={{ height: INNER }} />
          <Row
            p={p()}
            label={battery()!.charging ? t("charging") : battery()!.powerSource === "ac" ? t("pluggedIn") : t("onBattery")}
            note={!battery()!.charging && battery()!.remainingSeconds ? t("timeLeft", { t: duration(battery()!.remainingSeconds!) }) : undefined}
            value={`${Math.round(battery()!.level!)}%`}
          />
          <Bar
            p={p()}
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
