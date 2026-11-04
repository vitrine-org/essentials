import { mount, useSettings, useSystem } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, Txt, clamp, usePalette } from "../shared/ui";
import { t } from "../shared/i18n";

function duration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function BatteryIcon(props: { p: Palette; level: number | null; color: string; charging: boolean }) {
  const fillW = () => 19 * clamp((props.level ?? 0) / 100, 0, 1);
  return (
    <svg width={30} height={17} viewBox="0 0 30 17">
      {props.p.bare ? (
        <g transform="translate(0 1)" opacity={0.4}>
          <rect x={0.75} y={1.25} width={24.5} height={13.5} rx={3.5} fill="none" stroke={`rgb(${props.p.shade})`} strokeWidth={2.4} />
          <rect x={26.5} y={5.5} width={2.2} height={5} rx={1.1} fill={`rgb(${props.p.shade})`} />
        </g>
      ) : null}
      <rect x={0.75} y={1.25} width={24.5} height={13.5} rx={3.5} fill="none" stroke={props.p.text2} strokeWidth={1.3} />
      <rect x={26.5} y={5.5} width={2.2} height={5} rx={1.1} fill={props.p.text2} />
      <rect
        x={3.5}
        y={4}
        width={Math.max(fillW(), props.level ? 1.5 : 0)}
        height={8}
        rx={1.5}
        fill={props.color}
        style={{ transition: "width 700ms ease" }}
      />
      {props.charging ? (
        <path
          d="M 14.6 2.2 L 9.4 8.8 L 12.8 8.8 L 11.2 13.8 L 16.6 7 L 13.2 7 Z"
          fill={props.p.text}
          stroke={props.p.bare ? `rgba(${props.p.shade}, 0.6)` : props.p.dark ? "#202020" : "#F3F3F3"}
          strokeWidth={0.9}
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}

function PlugIcon(props: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20">
      <path
        d="M 7 2.5 L 7 6 M 13 2.5 L 13 6 M 4.5 6 L 15.5 6 L 15.5 9 C 15.5 12 13 14 10 14 C 7 14 4.5 12 4.5 9 Z M 10 14 L 10 17.5"
        fill="none"
        stroke={props.color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Battery() {
  const s = useSettings({ background: "card", theme: "auto", accent: "system", lowThreshold: 20, showTime: true });
  const p = usePalette(s);
  const snap = useSystem(["battery"], 10_000);

  const b = () => snap().battery;
  const level = () => b()?.level ?? null;
  const ac = () => b()?.powerSource === "ac";
  const low = () => !ac() && level() !== null && level()! <= s().lowThreshold;
  const color = () => (b()?.charging ? p().success : low() ? p().critical : b()?.saver ? p().caution : p().text);
  const status = () => {
    const x = b();
    if (!x) return t("readingBattery");
    if (!x.hasBattery) return t("pluggedIn");
    if (x.charging) return t("charging");
    if (ac()) return level() === 100 ? t("fullyCharged") : t("pluggedIn");
    if (x.saver) return t("saverOn");
    if (s().showTime && x.remainingSeconds) return t("timeLeft", { t: duration(x.remainingSeconds) });
    return low() ? t("lowBattery") : t("onBattery");
  };

  return (
    <Card p={p()} style={{ flexDirection: "column", justifyContent: "center", paddingHorizontal: 16, gap: 0 }}>
      {b() && !b()!.hasBattery ? (
        <view style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <PlugIcon color={p().accent} />
          <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: p().text }}>
            {() => "AC"}
          </Txt>
        </view>
      ) : (
        <view style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BatteryIcon p={p()} level={level()} color={color()} charging={!!b()?.charging} />
          <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, lineHeight: 1.1, color: low() ? p().critical : p().text }}>
            {(tint) => (
              <>
                {level() === null ? "–" : String(level())}
                <span style={{ fontSize: 14, fontWeight: 400, color: tint(p().text2) }}>%</span>
              </>
            )}
          </Txt>
        </view>
      )}
      <Txt p={p()} lite style={{ fontSize: 12, color: p().text2, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {() => status()}
      </Txt>
    </Card>
  );
}

mount(() => <Battery />);
