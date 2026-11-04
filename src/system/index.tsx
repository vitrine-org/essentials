import { Index } from "solid-js";
import { formatBytes, mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, Txt, clamp, shadeOf, usePalette } from "../shared/ui";
import { t } from "../shared/i18n";

interface Gauge {
  label: string;
  value: number | null; // 0..1
  detail: string;
}

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const tone = (p: Palette, v: number | null) => (v !== null && v >= 0.9 ? p.critical : p.accent);
const gb = (b: number) => formatBytes(b, b >= 100 * 2 ** 30 ? 0 : 1).replace(" GB", "");

function Ring(props: { p: Palette; g: Gauge; d: number }) {
  const stroke = () => Math.max(4, Math.round(props.d / 11));
  const r = () => (props.d - stroke() - 2) / 2;
  const c = () => props.d / 2;
  const circ = () => 2 * Math.PI * r();
  const v = () => props.g.value ?? 0;
  return (
    <view style={{ flex: 1, flexDirection: "column", alignItems: "center", gap: 8 }}>
      <view style={{ width: props.d, height: props.d }}>
        <svg width={props.d} height={props.d} viewBox={`0 0 ${props.d} ${props.d}`}>
          {props.p.bare ? (
            <circle cx={c()} cy={c() + 1} r={r()} fill="none" stroke={shadeOf(props.p, 0.3)} strokeWidth={stroke() + 2} />
          ) : null}
          <circle cx={c()} cy={c()} r={r()} fill="none" stroke={props.p.track} strokeWidth={stroke()} />
          <circle
            cx={c()}
            cy={c()}
            r={r()}
            fill="none"
            stroke={tone(props.p, props.g.value)}
            strokeWidth={stroke()}
            strokeLinecap="round"
            strokeDasharray={`${(v() * circ()).toFixed(2)} ${circ().toFixed(2)}`}
            transform={`rotate(-90 ${c()} ${c()})`}
            opacity={v() > 0.004 ? 1 : 0}
            style={{ transition: "stroke-dasharray 700ms ease" }}
          />
        </svg>
        <view style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(props.d * 0.26), fontWeight: 600, color: props.p.text }}>
            {(tint) => (
              <>
                {props.g.value === null ? "–" : String(Math.round(v() * 100))}
                <span style={{ fontSize: Math.round(props.d * 0.16), fontWeight: 400, color: tint(props.p.text2) }}>%</span>
              </>
            )}
          </Txt>
        </view>
      </view>
      <view style={{ flexDirection: "column", alignItems: "center" }}>
        <Txt p={props.p} lite style={{ fontSize: 12, fontWeight: 600, color: props.p.text2, whiteSpace: "nowrap" }}>
          {() => props.g.label}
        </Txt>
        <Txt p={props.p} lite style={{ fontSize: 10, color: props.p.text3, whiteSpace: "nowrap" }}>
          {() => props.g.detail}
        </Txt>
      </view>
    </view>
  );
}

function Bar(props: { p: Palette; g: Gauge; width: number }) {
  return (
    <view style={{ flex: 1, flexDirection: "column", justifyContent: "center", gap: 6 }}>
      <view style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Txt p={props.p} lite style={{ fontSize: 12, fontWeight: 600, color: props.p.text2, whiteSpace: "nowrap" }}>
          {() => props.g.label}
        </Txt>
        <Txt p={props.p} lite box={{ flex: 1, marginLeft: 8 }} style={{ fontSize: 10, color: props.p.text3, whiteSpace: "nowrap", textOverflow: "ellipsis", marginBottom: 1 }}>
          {() => props.g.detail}
        </Txt>
        <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: props.p.text }}>
          {() => pct(props.g.value)}
        </Txt>
      </view>
      <view
        style={{
          height: 4,
          borderRadius: 2,
          background: props.p.track,
          boxShadow: props.p.bare ? `0 1px 2px ${shadeOf(props.p, 0.4)}` : undefined,
        }}
      >
        <view
          style={{
            width: Math.round(clamp(props.g.value ?? 0, 0, 1) * props.width),
            height: 4,
            borderRadius: 2,
            background: tone(props.p, props.g.value),
            transition: "width 700ms ease",
          }}
        />
      </view>
    </view>
  );
}

function System() {
  const s = useSettings({ background: "card", theme: "auto", accent: "system", style: "rings", drive: "C", interval: 2 });
  const p = usePalette(s);
  const size = useSize();
  const snap = useSystem(["cpu", "memory", "drives"], s().interval * 1000);

  const gauges = (): Gauge[] => {
    const { cpu, memory, drives } = snap();
    const letter = (s().drive || "C").toUpperCase();
    const drive = drives?.find((d) => d.name.toUpperCase().startsWith(letter + ":"));
    return [
      { label: t("cpu"), value: cpu ? clamp(cpu.usage / 100, 0, 1) : null, detail: cpu ? t("cores", { n: cpu.cores }) : "" },
      {
        label: t("memory"),
        value: memory ? clamp(memory.used / memory.total, 0, 1) : null,
        detail: memory ? `${gb(memory.used)} / ${formatBytes(memory.total, 0)}` : "",
      },
      {
        label: t("disk", { l: letter }),
        value: drive && drive.total > 0 ? clamp(drive.used / drive.total, 0, 1) : null,
        detail: drive ? t("freeAmt", { a: formatBytes(drive.free, 0) }) : "",
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
        paddingVertical: s().style === "bars" ? 12 : 16,
        gap: s().style === "bars" ? 4 : 8,
      }}
    >
      <Index each={gauges()}>
        {(g) => (s().style === "bars" ? <Bar p={p()} g={g()} width={size().width - 32} /> : <Ring p={p()} g={g()} d={ringD()} />)}
      </Index>
    </Card>
  );
}

mount(() => <System />);
