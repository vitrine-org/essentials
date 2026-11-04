import { Index } from "solid-js";
import { formatBytes, mount, useSettings, useSize, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, LOOK, type Palette, Txt, clamp, shadeOf, usePalette } from "../shared/ui";

type Drive = { name: string; label: string; total: number; free: number; used: number };

const size0 = (b: number) => formatBytes(b, b >= 100 * 2 ** 30 ? 0 : 1);

function Row(props: { p: Palette; d: Drive; show: string; width: number; compact: boolean; wide: boolean; pct: boolean }) {
  const used = () => (props.d.total > 0 ? clamp(props.d.used / props.d.total, 0, 1) : 0);
  const tone = () => (used() >= 0.9 ? props.p.critical : props.p.accent);
  const letter = () => props.d.name.replace(/\\$/, "");
  const detail = () =>
    (props.show === "used" ? `${size0(props.d.used)} used` : `${size0(props.d.free)} free`) + (props.wide ? ` of ${size0(props.d.total)}` : "");
  return (
    <view style={{ flexDirection: "column", gap: props.compact ? 4 : 6, flexShrink: 0 }}>
      <view style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        <Txt p={props.p} style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: props.p.text, whiteSpace: "nowrap" }}>
          {() => letter()}
        </Txt>
        <Txt
          p={props.p}
          lite
          box={{ flex: 1, minWidth: 0 }}
          style={{ fontSize: 12, color: props.p.text3, whiteSpace: "nowrap", textOverflow: "ellipsis", marginBottom: 1 }}
        >
          {() => (props.compact ? "" : props.d.label || "Local Disk")}
        </Txt>
        <Txt p={props.p} lite style={{ fontSize: 11, color: props.p.text2, whiteSpace: "nowrap", marginBottom: 1 }}>
          {() => (props.compact || props.pct ? `${Math.round(used() * 100)}% used` : detail())}
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
            width: Math.max(4, Math.round(used() * props.width)),
            height: 4,
            borderRadius: 2,
            background: tone(),
            transition: "width 700ms ease",
          }}
        />
      </view>
    </view>
  );
}

function Drives() {
  const s = useSettings({ ...LOOK, show: "free", interval: 30 });
  const p = usePalette(s);
  const size = useSize();
  const snap = useSystem(["drives"], s().interval * 1000);

  const compact = () => size().width < 200;
  const wide = () => size().width >= 270;
  const rowH = 30;
  const all = () => (snap().drives ?? []).filter((d) => d.total > 0).sort((a, b) => a.name.localeCompare(b.name));
  const header = () => size().height >= 120;
  const drives = () => {
    const fit = Math.max(1, Math.floor((size().height - 24 - (header() ? 40 : 0) + 10) / (rowH + 10)));
    return all().slice(0, fit);
  };
  const free = () => all().reduce((a, d) => a + d.free, 0);
  const total = () => all().reduce((a, d) => a + d.total, 0);

  return (
    <Card p={p()} style={{ flexDirection: "column", justifyContent: header() ? "flex-start" : "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
      {header() && all().length ? (
        <view style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 30, flexShrink: 0 }}>
          <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, lineHeight: 1.1, color: p().text, whiteSpace: "nowrap" }}>
            {(t) => (
              <>
                {formatBytes(free(), 0).split(" ")[0]}
                <span style={{ fontSize: 13, fontWeight: 500, color: t(p().text2) }}>{" " + formatBytes(free(), 0).split(" ")[1] + " free"}</span>
              </>
            )}
          </Txt>
          <Txt p={p()} lite box={{ flex: 1, minWidth: 0, alignItems: "flex-end" }} style={{ fontSize: 11, color: p().text3, whiteSpace: "nowrap", marginBottom: 3 }}>
            {() => `${all().length === 1 ? "1 drive" : `${all().length} drives`} · ${formatBytes(total(), 0)}`}
          </Txt>
        </view>
      ) : null}
      {drives().length === 0 ? (
        <Txt p={p()} lite style={{ fontSize: 12, color: p().text3 }}>
          {() => "Reading drives…"}
        </Txt>
      ) : null}
      <Index each={drives()}>{(d) => <Row p={p()} d={d()} show={s().show} width={size().width - 32} compact={compact()} wide={wide()} pct={header() && all().length === 1} />}</Index>
    </Card>
  );
}

mount(() => <Drives />);
