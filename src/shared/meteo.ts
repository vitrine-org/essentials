// Open-Meteo current conditions and forecast, shared by the Weather and Conky widgets.
import { localeInfo } from "@vitrine/sdk";
import { t } from "./i18n";

export const REFRESH_MS = 30 * 60 * 1000;

export interface Day {
  date: string;
  code: number;
  max: number;
  min: number;
}
export interface Cache {
  query: string;
  units: string;
  place: string;
  lat: number;
  lon: number;
  fetchedAt: number;
  current: { temp: number; code: number; isDay: boolean };
  today: Day;
  days: Day[];
}

export type Kind = "sun" | "moon" | "partly" | "partly-night" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** WMO weather code → icon kind and label. */
export function describe(code: number, day = true): [Kind, string] {
  if (code === 0) return [day ? "sun" : "moon", t(day ? "sunny" : "clear")];
  if (code === 1) return [day ? "sun" : "moon", t("mostlyClear")];
  if (code === 2) return [day ? "partly" : "partly-night", t("partlyCloudy")];
  if (code === 3) return ["cloud", t("cloudy")];
  if (code === 45 || code === 48) return ["fog", t("fog")];
  if (code >= 51 && code <= 57) return ["drizzle", t("drizzle")];
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ["rain", t(code >= 80 ? "showers" : code >= 65 ? "heavyRain" : "rain")];
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ["snow", t("snow")];
  if (code >= 95) return ["storm", t("storm")];
  return ["cloud", t("cloudy")];
}

const day = (d: Day): Day => ({ date: d.date, code: d.code, max: Math.round(d.max), min: Math.round(d.min) });

export async function load(query: string, units: string, prev: Cache | null): Promise<Cache> {
  let place = prev?.place ?? "";
  let lat = prev?.lat ?? 0;
  let lon = prev?.lon ?? 0;
  if (!prev || prev.query !== query) {
    const g = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=${localeInfo().locale.slice(0, 2) || "en"}&format=json`,
    );
    if (!g.ok) throw new Error(`geocoding ${g.status}`);
    const hit = (await g.json()).results?.[0];
    if (!hit) throw new Error("notfound");
    place = hit.name;
    lat = hit.latitude;
    lon = hit.longitude;
  }
  const r = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&timezone=auto&forecast_days=4&temperature_unit=${units === "fahrenheit" ? "fahrenheit" : "celsius"}`,
  );
  if (!r.ok) throw new Error(`forecast ${r.status}`);
  const j = await r.json();
  const d = j.daily;
  const days: Day[] = d.time.map((date: string, i: number) =>
    day({ date, code: d.weather_code[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min[i] }),
  );
  return {
    query,
    units,
    place,
    lat,
    lon,
    fetchedAt: Date.now(),
    current: { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, isDay: !!j.current.is_day },
    today: days[0],
    days: days.slice(1, 4),
  };
}
