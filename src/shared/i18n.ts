// Texts shown inside the Conky widget, in Vitrine's languages, picked from the Windows
// locale the SDK reports (localeInfo().locale); English for any other language.
import { localeInfo } from "@vitrine/sdk";

type Lang = "en" | "it" | "fr" | "de" | "es" | "pt-BR" | "zh" | "ru" | "ja" | "ko";
const ORDER: Lang[] = ["en", "it", "fr", "de", "es", "pt-BR", "zh", "ru", "ja", "ko"];

/** A text, or its plural forms ([one, other]; Russian [one, few, many]), chosen by `{n}`. */
type Text = string | string[];
type Row = [Text, Text, Text, Text, Text, Text, Text, Text, Text, Text];

const T = {
  // Weather conditions
  sunny: ["Sunny", "Soleggiato", "Ensoleillé", "Sonnig", "Soleado", "Ensolarado", "晴", "Солнечно", "晴れ", "맑음"],
  clear: ["Clear", "Sereno", "Dégagé", "Klar", "Despejado", "Céu limpo", "晴", "Ясно", "晴れ", "맑음"],
  mostlyClear: ["Mostly clear", "Poco nuvoloso", "Plutôt dégagé", "Überwiegend klar", "Mayormente despejado", "Predominantemente limpo", "大致晴朗", "Малооблачно", "おおむね晴れ", "대체로 맑음"],
  partlyCloudy: ["Partly cloudy", "Parzialmente nuvoloso", "Partiellement nuageux", "Teilweise bewölkt", "Parcialmente nublado", "Parcialmente nublado", "局部多云", "Переменная облачность", "晴れ時々曇り", "구름 조금"],
  cloudy: ["Cloudy", "Nuvoloso", "Nuageux", "Bewölkt", "Nublado", "Nublado", "多云", "Облачно", "曇り", "흐림"],
  fog: ["Fog", "Nebbia", "Brouillard", "Nebel", "Niebla", "Nevoeiro", "雾", "Туман", "霧", "안개"],
  drizzle: ["Drizzle", "Pioviggine", "Bruine", "Nieselregen", "Llovizna", "Garoa", "毛毛雨", "Морось", "霧雨", "이슬비"],
  showers: ["Showers", "Rovesci", "Averses", "Schauer", "Chubascos", "Pancadas de chuva", "阵雨", "Ливни", "にわか雨", "소나기"],
  heavyRain: ["Heavy rain", "Pioggia forte", "Forte pluie", "Starkregen", "Lluvia intensa", "Chuva forte", "大雨", "Сильный дождь", "大雨", "폭우"],
  rain: ["Rain", "Pioggia", "Pluie", "Regen", "Lluvia", "Chuva", "雨", "Дождь", "雨", "비"],
  snow: ["Snow", "Neve", "Neige", "Schnee", "Nieve", "Neve", "雪", "Снег", "雪", "눈"],
  storm: ["Thunderstorm", "Temporale", "Orage", "Gewitter", "Tormenta", "Tempestade", "雷暴", "Гроза", "雷雨", "뇌우"],
  // Battery
  battery: ["Battery", "Batteria", "Batterie", "Akku", "Batería", "Bateria", "电池", "Батарея", "バッテリー", "배터리"],
  pluggedIn: ["Plugged in", "Collegato", "Branché", "Angeschlossen", "Conectado", "Conectado", "已接通电源", "От сети", "電源接続中", "전원 연결됨"],
  charging: ["Charging", "In carica", "En charge", "Wird geladen", "Cargando", "Carregando", "正在充电", "Заряжается", "充電中", "충전 중"],
  timeLeft: ["{t} left", "{t} rimanenti", "{t} restantes", "noch {t}", "quedan {t}", "{t} restantes", "剩余 {t}", "осталось {t}", "残り {t}", "{t} 남음"],
  onBattery: ["On battery", "A batteria", "Sur batterie", "Akkubetrieb", "Con batería", "Na bateria", "使用电池", "От батареи", "バッテリー駆動", "배터리 사용 중"],
  // Conky sections and rows
  system: ["System", "Sistema", "Système", "System", "Sistema", "Sistema", "系统", "Система", "システム", "시스템"],
  host: ["Host", "Host", "Hôte", "Host", "Host", "Host", "主机", "Хост", "ホスト", "호스트"],
  os: ["OS", "SO", "OS", "BS", "SO", "SO", "系统版本", "ОС", "OS", "OS"],
  uptime: ["Uptime", "Attivo da", "Activité", "Laufzeit", "Activo", "Ativo há", "运行时间", "Работает", "稼働時間", "가동 시간"],
  cpu: ["CPU", "CPU", "Processeur", "CPU", "CPU", "CPU", "CPU", "ЦП", "CPU", "CPU"],
  usage: ["Usage", "Utilizzo", "Utilisation", "Auslastung", "Uso", "Uso", "使用率", "Загрузка", "使用率", "사용률"],
  cores: [["{n} core", "{n} cores"], "{n} core", ["{n} cœur", "{n} cœurs"], ["{n} Kern", "{n} Kerne"], ["{n} núcleo", "{n} núcleos"], ["{n} núcleo", "{n} núcleos"], "{n} 核", ["{n} ядро", "{n} ядра", "{n} ядер"], "{n} コア", "{n}코어"],
  memory: ["Memory", "Memoria", "Mémoire", "Speicher", "Memoria", "Memória", "内存", "Память", "メモリ", "메모리"],
  used: ["Used", "In uso", "Utilisée", "Belegt", "En uso", "Em uso", "已用", "Занято", "使用中", "사용 중"],
  drives: ["Drives", "Unità", "Lecteurs", "Laufwerke", "Unidades", "Unidades", "驱动器", "Диски", "ドライブ", "드라이브"],
  localDisk: ["Local Disk", "Disco locale", "Disque local", "Lokaler Datenträger", "Disco local", "Disco local", "本地磁盘", "Локальный диск", "ローカル ディスク", "로컬 디스크"],
  freeAmt: ["{a} free", "{a} liberi", "{a} libres", "{a} frei", "{a} libres", "{a} livres", "可用 {a}", "свободно {a}", "空き {a}", "{a} 사용 가능"],
  network: ["Network", "Rete", "Réseau", "Netzwerk", "Red", "Rede", "网络", "Сеть", "ネットワーク", "네트워크"],
  download: ["Download", "Download", "Réception", "Download", "Descarga", "Download", "下载", "Загрузка", "ダウンロード", "다운로드"],
  upload: ["Upload", "Upload", "Envoi", "Upload", "Subida", "Upload", "上传", "Отдача", "アップロード", "업로드"],
} satisfies Record<string, Row>;

export type TextKey = keyof typeof T;

function detect(): Lang {
  const tag = (localeInfo().locale || "en").replace(/_/g, "-").toLowerCase();
  const base = tag.split("-")[0];
  if (base === "zh") return /-(hant|tw|hk|mo)\b/.test(tag) ? "en" : "zh";
  if (base === "pt") return "pt-BR";
  return (ORDER as string[]).includes(base) ? (base as Lang) : "en";
}

let current: Lang | null = null;
/** The widget language: Vitrine's language closest to the Windows locale, else English. */
export const lang = (): Lang => (current ??= detect());

function pluralIndex(l: Lang, n: number, forms: number): number {
  if (forms === 3) {
    const a = n % 10;
    const b = n % 100;
    return a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 1 : 2;
  }
  return (l === "fr" || l === "pt-BR" ? n > 1 : n !== 1) ? 1 : 0;
}

/** The text for `key` in the widget language, with `{name}` placeholders filled from `vars`. */
export function t(key: TextKey, vars: Record<string, string | number> = {}): string {
  const l = lang();
  let s: Text = (T[key] as Row)[ORDER.indexOf(l)];
  if (Array.isArray(s)) {
    const n = Number(vars.n ?? 0);
    s = s[Math.min(s.length - 1, pluralIndex(l, n, s.length))];
  }
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
