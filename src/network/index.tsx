import { createEffect, createSignal } from "solid-js";
import { mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, Txt, shadeOf, usePalette } from "../shared/ui";
import { t } from "../shared/i18n";

const HISTORY = 30;

/** Splits a byte rate into a number and a unit, in bits or bytes per second. */
function rate(bytesPerSec: number | undefined, units: string): [string, string] {
  if (bytesPerSec === undefined) return ["–", ""];
  const bits = units !== "bytes";
  let v = bits ? bytesPerSec * 8 : bytesPerSec;
  const names = bits ? ["bps", "Kbps", "Mbps", "Gbps"] : ["B/s", "KB/s", "MB/s", "GB/s"];
  let i = 0;
  while (v >= 1000 && i < names.length - 1) {
    v /= bits ? 1000 : 1024;
    i++;
  }
  return [v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1), names[i]];
}

function Arrow(props: { up: boolean; color: string; shade?: string }) {
  const d = () => (props.up ? "M 8 13 L 8 3 M 3.5 7.5 L 8 3 L 12.5 7.5" : "M 8 3 L 8 13 M 3.5 8.5 L 8 13 L 12.5 8.5");
  return (
    <svg width={16} height={18} viewBox="0 0 16 18">
      {props.shade ? (
        <path d={d()} fill="none" stroke={props.shade} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" transform="translate(0 1)" />
      ) : null}
      <path d={d()} fill="none" stroke={props.color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A faint area chart of the recent samples, drawn behind a reading. */
function Spark(props: { values: number[]; w: number; h: number; color: string }) {
  const path = () => {
    const v = props.values;
    if (v.length < 2) return "";
    const max = Math.max(...v, 1);
    const step = props.w / (HISTORY - 1);
    const x0 = props.w - (v.length - 1) * step;
    const pts = v.map((y, i) => `${(x0 + i * step).toFixed(1)} ${(props.h - (y / max) * props.h * 0.9).toFixed(1)}`);
    return `M ${x0.toFixed(1)} ${props.h} L ${pts.join(" L ")} L ${props.w} ${props.h} Z`;
  };
  return (
    <svg width={props.w} height={props.h} viewBox={`0 0 ${props.w} ${props.h}`} style={{ position: "absolute", left: 0, bottom: 0 }}>
      <path d={path()} fill={props.color} fillOpacity={0.14} />
    </svg>
  );
}

function Reading(props: { p: Palette; up: boolean; value: [string, string]; label: string; history: number[]; w: number; h: number }) {
  return (
    <view style={{ flex: 1, height: "100%" }}>
      {props.p.bare ? null : <Spark values={props.history} w={props.w} h={props.h} color={props.up ? props.p.text2 : props.p.accent} />}
      <view style={{ height: "100%", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
        <view style={{ alignSelf: "flex-start", marginTop: Math.round((props.h - 38) / 2) + 2 }}>
          <Arrow up={props.up} color={props.up ? props.p.text2 : props.p.accent} shade={props.p.bare ? shadeOf(props.p, 0.4) : undefined} />
        </view>
        <view style={{ flexDirection: "column" }}>
          <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: props.p.text, whiteSpace: "nowrap", lineHeight: 1.15 }}>
            {(tint) => (
              <>
                {props.value[0]}
                <span style={{ fontSize: 11, fontWeight: 400, color: tint(props.p.text2) }}>{" " + props.value[1]}</span>
              </>
            )}
          </Txt>
          <Txt p={props.p} lite style={{ fontSize: 11, color: props.p.text3, whiteSpace: "nowrap" }}>
            {() => props.label}
          </Txt>
        </view>
      </view>
    </view>
  );
}

function Network() {
  const s = useSettings({ background: "card", theme: "auto", accent: "system", units: "bits", interval: 1 });
  const p = usePalette(s);
  const size = useSize();
  const snap = useSystem(["network"], s().interval * 1000);
  const [rx, setRx] = createSignal<number[]>([]);
  const [tx, setTx] = createSignal<number[]>([]);

  createEffect(() => {
    const n = snap().network;
    if (!n) return;
    setRx((h) => [...h, n.rxPerSec].slice(-HISTORY));
    setTx((h) => [...h, n.txPerSec].slice(-HISTORY));
  });

  const half = () => Math.floor((size().width - 2) / 2);
  return (
    <Card p={p()} style={{ flexDirection: "row", alignItems: "center" }}>
      <Reading p={p()} up={false} value={rate(snap().network?.rxPerSec, s().units)} label={t("download")} history={rx()} w={half()} h={size().height} />
      <view style={{ width: 1, flexShrink: 0, height: "56%", background: p().divider, boxShadow: p().bare ? `1px 0 1px ${shadeOf(p(), 0.25)}` : undefined }} />
      <Reading p={p()} up value={rate(snap().network?.txPerSec, s().units)} label={t("upload")} history={tx()} w={half()} h={size().height} />
    </Card>
  );
}

mount(() => <Network />);
