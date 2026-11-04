import { createEffect, createSignal, For, on, onCleanup } from "solid-js";
import { formatDate, mount, useSettings, useSize, useStorage } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, type Palette, Txt, shadeOf, usePalette, uses12h } from "../shared/ui";
import { type Cache, type Kind, REFRESH_MS, describe, load } from "../shared/meteo";
import { t } from "../shared/i18n";

const SUN = "#FFC83D";
const CLOUD = "M 7.2 19 L 17 19 C 19.8 19 21.6 17.1 21.6 14.8 C 21.6 12.6 19.9 10.8 17.7 10.7 C 17 8.1 14.7 6.4 12.1 6.4 C 9 6.4 6.6 8.7 6.3 11.6 C 4.2 11.9 2.6 13.6 2.6 15.4 C 2.6 17.4 4.5 19 7.2 19 Z";

function Glyph(props: { kind: Kind; size: number; p: Palette; shade?: string }) {
  const col = (c: string) => props.shade ?? c;
  const cloudFill = () => col(props.p.dark ? "#C8CDD6" : "#7D8796");
  const cloudBack = () => col(props.p.dark ? "#8C939E" : "#A9B2BE");
  const rays = (cx: number, cy: number, r1: number, r2: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `M ${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L ${cx + Math.cos(a) * r2} ${cy + Math.sin(a) * r2}`;
    }).join(" ");
  const k = () => props.kind;
  const drops = (d: string, color: string) => <path d={d} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />;
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24">
      {k() === "sun" ? (
        <g>
          <path d={rays(12, 12, 7, 9.6)} stroke={col(SUN)} strokeWidth={1.7} strokeLinecap="round" />
          <circle cx={12} cy={12} r={4.8} fill={col(SUN)} />
        </g>
      ) : k() === "moon" ? (
        <path d="M 15.5 3.5 C 11 4 7.6 7.8 7.6 12.4 C 7.6 17.3 11.6 21.2 16.4 21.2 C 17.9 21.2 19.3 20.8 20.6 20.2 C 15.8 19.1 12.8 15.4 12.8 11 C 12.8 8.1 13.8 5.4 15.5 3.5 Z" fill={col("#E8D9A8")} transform="translate(-2 -0.5)" />
      ) : k() === "partly" || k() === "partly-night" ? (
        <g>
          {k() === "partly" ? (
            <g>
              <path d={rays(9, 8.5, 5.2, 7)} stroke={col(SUN)} strokeWidth={1.4} strokeLinecap="round" />
              <circle cx={9} cy={8.5} r={3.8} fill={col(SUN)} />
            </g>
          ) : (
            <path d="M 9.5 2.5 C 6.6 3 4.4 5.5 4.4 8.5 C 4.4 11.8 7.1 14.5 10.4 14.5 C 11.4 14.5 12.3 14.3 13.2 13.8 C 10.1 13.1 8 10.6 8 7.6 C 8 5.7 8.6 3.9 9.5 2.5 Z" fill={col("#E8D9A8")} />
          )}
          <path d={CLOUD} fill={cloudFill()} transform="translate(2 1.5) scale(0.86)" />
        </g>
      ) : k() === "cloud" ? (
        <g>
          <path d={CLOUD} fill={cloudBack()} transform="translate(8 -1.5) scale(0.62)" />
          <path d={CLOUD} fill={cloudFill()} transform="translate(0 1)" />
        </g>
      ) : k() === "fog" ? (
        <g>
          <path d={CLOUD} fill={cloudFill()} transform="translate(1 -3) scale(0.92)" />
          {drops("M 4 18.5 L 20 18.5 M 6.5 21.5 L 17.5 21.5", cloudBack())}
        </g>
      ) : (
        <g>
          <path d={CLOUD} fill={k() === "storm" ? cloudBack() : cloudFill()} transform="translate(0.5 -3.5)" />
          {k() === "drizzle"
            ? drops("M 8 18.5 L 7.5 20 M 12.5 18.5 L 12 20 M 17 18.5 L 16.5 20", col(props.p.dark ? "#4CC2FF" : "#0A8BD6"))
            : k() === "rain"
              ? drops("M 8 18 L 6.8 21.5 M 12.5 18 L 11.3 21.5 M 17 18 L 15.8 21.5", col(props.p.dark ? "#4CC2FF" : "#0A8BD6"))
              : k() === "snow"
                ? (
                  <g fill={col(props.p.dark ? "#FFFFFF" : "#7A8594")}>
                    <circle cx={7.5} cy={19.2} r={1.2} />
                    <circle cx={12} cy={21.2} r={1.2} />
                    <circle cx={16.5} cy={19.2} r={1.2} />
                  </g>
                )
                : <path d="M 13 14.5 L 9.5 19.5 L 12 19.5 L 10.8 23 L 15 17.6 L 12.5 17.6 L 13.8 14.5 Z" fill={col(SUN)} />}
        </g>
      )}
    </svg>
  );
}

/** A weather glyph; on the bare background a soft copy underneath keeps it readable. */
function WeatherIcon(props: { kind: Kind; size: number; p: Palette }) {
  return (
    <view style={{ width: props.size, height: props.size }}>
      {props.p.bare ? (
        <view style={{ position: "absolute", left: 0, top: 1, opacity: 0.35 }}>
          <Glyph kind={props.kind} size={props.size} p={props.p} shade={`rgb(${props.p.shade})`} />
        </view>
      ) : null}
      <Glyph kind={props.kind} size={props.size} p={props.p} />
    </view>
  );
}

function OfflineIcon(props: { p: Palette }) {
  return (
    <svg width={32} height={32} viewBox="0 0 24 24">
      <path d={CLOUD} fill="none" stroke={props.p.text3} strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M 3 3.5 L 21 21.5" stroke={props.p.text3} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
}

function Weather() {
  const s = useSettings({ background: "card", theme: "auto", accent: "system", city: "Rome", units: "celsius", hourFormat: "auto" });
  const p = usePalette(s);
  const size = useSize();
  const [cache, setCache] = useStorage<Cache | null>("cache", null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const query = () => (s().city || "").trim();
  const matches = (c: Cache | null) => !!c && c.query.toLowerCase() === query().toLowerCase() && c.units === s().units;
  const data = () => (matches(cache()) ? cache() : null);

  const refresh = async (force = false) => {
    const c = cache();
    if (!query()) return setError("nocity");
    if (!force && matches(c) && Date.now() - c!.fetchedAt < REFRESH_MS) return setError(null);
    setLoading(true);
    try {
      setCache(await load(query(), s().units, c && c.query.toLowerCase() === query().toLowerCase() ? c : null));
      setError(null);
    } catch (e) {
      setError(String((e as Error)?.message ?? e) === "notfound" ? "notfound" : "offline");
    } finally {
      setLoading(false);
    }
  };

  createEffect(on([query, () => s().units], () => void refresh()));
  const timer = setInterval(() => void refresh(), REFRESH_MS);
  onCleanup(() => clearInterval(timer));

  const wide = () => size().width >= 270;
  const deg = (v: number) => `${v}°`;
  const updated = () => formatDate(data()!.fetchedAt, uses12h(s().hourFormat) ? "h:mm A" : "HH:mm");

  return (
    <Card p={p()} style={{ flexDirection: "column", paddingHorizontal: 16, paddingVertical: 12 }}>
      {data() ? (
        <>
          <view style={{ flexDirection: "row", alignItems: "center", height: 46 }}>
            <WeatherIcon kind={describe(data()!.current.code, data()!.current.isDay)[0]} size={wide() ? 44 : 40} p={p()} />
            <Txt p={p()} box={{ marginLeft: 8 }} style={{ fontFamily: FONT_DISPLAY, fontSize: wide() ? 40 : 34, fontWeight: 600, color: p().text, lineHeight: 1.1 }}>
              {() => deg(data()!.current.temp)}
            </Txt>
            <view style={{ flex: 1, flexDirection: "column", alignItems: "flex-end", marginLeft: 8 }}>
              <Txt p={p()} lite style={{ fontSize: 14, fontWeight: 600, color: p().text, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {() => data()!.place}
              </Txt>
              <Txt p={p()} lite style={{ fontSize: 12, color: error() ? p().caution : p().text2, whiteSpace: "nowrap" }}>
                {() => (error() ? t("offline", { t: updated() }) : describe(data()!.current.code, data()!.current.isDay)[1])}
              </Txt>
              <Txt p={p()} lite style={{ fontSize: 11, color: p().text3, whiteSpace: "nowrap" }}>
                {() => t("hiLo", { a: deg(data()!.today.max), b: deg(data()!.today.min) })}
              </Txt>
            </view>
          </view>
          <view style={{ height: 1, flexShrink: 0, background: p().divider, marginVertical: 8, boxShadow: p().bare ? `0 1px 1px ${shadeOf(p(), 0.25)}` : undefined }} />
          <view style={{ flex: 1, flexDirection: "row" }}>
            <For each={data()!.days}>
              {(d) => (
                <view style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                  <Txt p={p()} lite style={{ fontSize: 11, fontWeight: 600, color: p().text2, textTransform: "capitalize" }}>
                    {() => formatDate(new Date(`${d.date}T12:00:00`), "ddd")}
                  </Txt>
                  <WeatherIcon kind={describe(d.code)[0]} size={20} p={p()} />
                  <Txt p={p()} lite style={{ fontSize: 12, fontWeight: 600, color: p().text, whiteSpace: "nowrap" }}>
                    {(tint) => (
                      <>
                        {deg(d.max)}
                        <span style={{ fontWeight: 400, color: tint(p().text3) }}>{"  " + deg(d.min)}</span>
                      </>
                    )}
                  </Txt>
                </view>
              )}
            </For>
          </view>
        </>
      ) : (
        <view style={{ flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {error() ? <OfflineIcon p={p()} /> : null}
          <Txt p={p()} lite style={{ fontSize: 13, fontWeight: 600, color: p().text2 }}>
            {() => (error() === "notfound" ? t("cityNotFound") : error() === "nocity" ? t("noCity") : error() ? t("weatherUnavailable") : t("loadingWeather"))}
          </Txt>
          <Txt p={p()} lite style={{ fontSize: 11, color: p().text3, textAlign: "center" }}>
            {() => (error() === "notfound"
              ? t("noMatch", { q: query() })
              : error() === "nocity"
                ? t("chooseCity")
                : error()
                  ? t("checkConnection")
                  : loading()
                    ? query()
                    : "")}
          </Txt>
        </view>
      )}
    </Card>
  );
}

mount(() => <Weather />);
