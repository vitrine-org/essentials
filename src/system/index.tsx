import { Index } from "solid-js";
import { formatBytes, mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, clamp, usePalette } from "../shared/ui";

interface Gauge {
  label: string;
  value: number | null; // 0..1
  detail: string;
}

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const tone = (p: Palette, v: number | null) => (v !== null && v >= 0.9 ? p.critical : p.accent);
const gb = (b: number) => formatBytes(b, b >= 100 * 2 ** 30 ? 0 : 1).replace(" GB", "");

/** A clockwise arc from 12 o'clock covering `v` (0..1) of the circle. */
function arc(c: number, r: number, v: number): string {
  const a = Math.min(v, 0.9999) * 2 * Math.PI;
  const x = c + r * Math.sin(a);
  const y = c - r * Math.cos(a);
  return `M ${c} ${c - r} A ${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

function Ring(props: { p: Palette; g: Gauge; d: number }) {
  const stroke = () => Math.max(4, Math.round(props.d / 11));
  const r = () => (props.d - stroke()) / 2;
  const c = () => props.d / 2;
  return (
    <view style={{ flex: 1, flexDirection: "column", alignItems: "center", gap: 6 }}>
      <view style={{ width: props.d, height: props.d }}>
        <svg width={props.d} height={props.d} viewBox={`0 0 ${props.d} ${props.d}`}>
          <circle cx={c()} cy={c()} r={r()} fill="none" stroke={props.p.track} strokeWidth={stroke()} />
          {props.g.value !== null && props.g.value > 0.002 ? (
            <path d={arc(c(), r(), props.g.value)} fill="none" stroke={tone(props.p, props.g.value)} strokeWidth={stroke()} strokeLinecap="round" />
          ) : null}
        </svg>
        <view style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <text style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(props.d * 0.25), fontWeight: 600, color: props.p.text }}>
            {pct(props.g.value)}
          </text>
        </view>
      </view>
      <view style={{ flexDirection: "column", alignItems: "center" }}>
        <text style={{ fontSize: 12, fontWeight: 600, color: props.p.text2, whiteSpace: "nowrap" }}>{props.g.label}</text>
        <text style={{ fontSize: 10, color: props.p.text3, whiteSpace: "nowrap" }}>{props.g.detail}</text>
      </view>
    </view>
  );
}

function Bar(props: { p: Palette; g: Gauge }) {
  return (
    <view style={{ flex: 1, flexDirection: "column", justifyContent: "center", gap: 5 }}>
      <view style={{ flexDirection: "row", alignItems: "baseline" }}>
        <text style={{ fontSize: 12, fontWeight: 600, color: props.p.text2 }}>{props.g.label}</text>
        <text style={{ flex: 1, fontSize: 10, color: props.p.text3, marginLeft: 6, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {props.g.detail}
        </text>
        <text style={{ fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 600, color: props.p.text }}>{pct(props.g.value)}</text>
      </view>
      <view style={{ height: 4, borderRadius: 2, background: props.p.track }}>
        <view
          style={{
            width: `${clamp((props.g.value ?? 0) * 100, 0, 100)}%`,
            height: 4,
            borderRadius: 2,
            background: tone(props.p, props.g.value),
            transition: "width 400ms ease",
          }}
        />
      </view>
    </view>
  );
}

function System() {
  const s = useSettings({ theme: "auto", accent: "system", style: "rings", drive: "C", interval: 2 });
  const p = usePalette(s);
  const size = useSize();
  const snap = useSystem(["cpu", "memory", "drives"], s().interval * 1000);

  const gauges = (): Gauge[] => {
    const { cpu, memory, drives } = snap();
    const letter = (s().drive || "C").toUpperCase();
    const drive = drives?.find((d) => d.name.toUpperCase().startsWith(letter + ":"));
    return [
      { label: "CPU", value: cpu ? clamp(cpu.usage / 100, 0, 1) : null, detail: cpu ? `${cpu.cores} cores` : "" },
      {
        label: "Memory",
        value: memory ? clamp(memory.used / memory.total, 0, 1) : null,
        detail: memory ? `${gb(memory.used)} / ${formatBytes(memory.total, 0)}` : "",
      },
      {
        label: `Disk ${letter}:`,
        value: drive && drive.total > 0 ? clamp(drive.used / drive.total, 0, 1) : null,
        detail: drive ? `${formatBytes(drive.free, 0)} free` : "",
      },
    ];
  };
  const ringD = () => Math.floor(clamp(Math.min((size().width - 48) / 3 - 4, size().height - 64), 40, 72));

  return (
    <Card
      p={p()}
      style={{
        flexDirection: s().style === "bars" ? "column" : "row",
        alignItems: s().style === "bars" ? "stretch" : "center",
        paddingHorizontal: 16,
        paddingVertical: s().style === "bars" ? 12 : 14,
        gap: s().style === "bars" ? 4 : 8,
      }}
    >
      <Index each={gauges()}>
        {(g) => (s().style === "bars" ? <Bar p={p()} g={g()} /> : <Ring p={p()} g={g()} d={ringD()} />)}
      </Index>
    </Card>
  );
}

mount(() => <System />);
