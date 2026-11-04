// Texts shown inside the Essentials widgets, in Vitrine's languages, picked from the Windows
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
  // Weather widget
  offline: ["Offline · {t}", "Offline · {t}", "Hors ligne · {t}", "Offline · {t}", "Sin conexión · {t}", "Offline · {t}", "离线 · {t}", "Нет сети · {t}", "オフライン · {t}", "오프라인 · {t}"],
  hiLo: ["H {a}  L {b}", "Max {a}  Min {b}", "Max {a}  Min {b}", "H {a}  T {b}", "Máx {a}  Mín {b}", "Máx {a}  Mín {b}", "最高 {a}  最低 {b}", "Макс {a}  Мин {b}", "最高 {a}  最低 {b}", "최고 {a}  최저 {b}"],
  cityNotFound: ["City not found", "Città non trovata", "Ville introuvable", "Stadt nicht gefunden", "Ciudad no encontrada", "Cidade não encontrada", "未找到城市", "Город не найден", "都市が見つかりません", "도시를 찾을 수 없음"],
  noCity: ["No city set", "Nessuna città", "Aucune ville", "Keine Stadt festgelegt", "Sin ciudad", "Nenhuma cidade", "未设置城市", "Город не задан", "都市が未設定です", "도시가 설정되지 않음"],
  weatherUnavailable: ["Weather unavailable", "Meteo non disponibile", "Météo indisponible", "Wetter nicht verfügbar", "Tiempo no disponible", "Clima indisponível", "天气不可用", "Погода недоступна", "天気を取得できません", "날씨를 사용할 수 없음"],
  loadingWeather: ["Loading weather…", "Caricamento meteo…", "Chargement de la météo…", "Wetter wird geladen…", "Cargando el tiempo…", "Carregando o clima…", "正在加载天气…", "Загрузка погоды…", "天気を読み込み中…", "날씨 불러오는 중…"],
  noMatch: ["No match for “{q}”", "Nessun risultato per “{q}”", "Aucun résultat pour « {q} »", "Kein Treffer für „{q}“", "Sin resultados para «{q}»", "Nenhum resultado para “{q}”", "找不到“{q}”", "Нет результатов для «{q}»", "「{q}」は見つかりません", "'{q}'에 대한 결과 없음"],
  chooseCity: ["Choose a city in the settings", "Scegli una città nelle impostazioni", "Choisissez une ville dans les paramètres", "Wähle in den Einstellungen eine Stadt", "Elige una ciudad en la configuración", "Escolha uma cidade nas configurações", "请在设置中选择城市", "Выберите город в настройках", "設定で都市を選んでください", "설정에서 도시를 선택하세요"],
  checkConnection: ["Check your connection", "Controlla la connessione", "Vérifiez votre connexion", "Prüfe deine Verbindung", "Comprueba tu conexión", "Verifique sua conexão", "请检查网络连接", "Проверьте подключение", "接続を確認してください", "연결을 확인하세요"],
  // Battery
  battery: ["Battery", "Batteria", "Batterie", "Akku", "Batería", "Bateria", "电池", "Батарея", "バッテリー", "배터리"],
  readingBattery: ["Reading battery…", "Lettura batteria…", "Lecture de la batterie…", "Akku wird gelesen…", "Leyendo la batería…", "Lendo a bateria…", "正在读取电池…", "Чтение батареи…", "バッテリーを確認中…", "배터리 확인 중…"],
  pluggedIn: ["Plugged in", "Collegato", "Branché", "Angeschlossen", "Conectado", "Conectado", "已接通电源", "От сети", "電源接続中", "전원 연결됨"],
  charging: ["Charging", "In carica", "En charge", "Wird geladen", "Cargando", "Carregando", "正在充电", "Заряжается", "充電中", "충전 중"],
  fullyCharged: ["Fully charged", "Carica completa", "Chargée", "Voll geladen", "Carga completa", "Carga completa", "已充满", "Заряжено", "充電完了", "충전 완료"],
  saverOn: ["Battery saver on", "Risparmio batteria attivo", "Économiseur activé", "Energiesparen an", "Ahorro de batería activado", "Economia de bateria ativada", "节电模式已开启", "Экономия заряда", "バッテリー節約機能オン", "절전 모드 켜짐"],
  timeLeft: ["{t} left", "{t} rimanenti", "{t} restantes", "noch {t}", "quedan {t}", "{t} restantes", "剩余 {t}", "осталось {t}", "残り {t}", "{t} 남음"],
  lowBattery: ["Low battery", "Batteria scarica", "Batterie faible", "Akku schwach", "Batería baja", "Bateria fraca", "电量不足", "Низкий заряд", "残量低下", "배터리 부족"],
  onBattery: ["On battery", "A batteria", "Sur batterie", "Akkubetrieb", "Con batería", "Na bateria", "使用电池", "От батареи", "バッテリー駆動", "배터리 사용 중"],
  // System, Conky, Drives, Network
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
  disk: ["Disk {l}:", "Disco {l}:", "Disque {l}:", "Laufwerk {l}:", "Disco {l}:", "Disco {l}:", "磁盘 {l}:", "Диск {l}:", "ディスク {l}:", "디스크 {l}:"],
  localDisk: ["Local Disk", "Disco locale", "Disque local", "Lokaler Datenträger", "Disco local", "Disco local", "本地磁盘", "Локальный диск", "ローカル ディスク", "로컬 디스크"],
  free: ["free", "liberi", "libres", "frei", "libres", "livres", "可用", "свободно", "空き", "사용 가능"],
  freeAmt: ["{a} free", "{a} liberi", "{a} libres", "{a} frei", "{a} libres", "{a} livres", "可用 {a}", "свободно {a}", "空き {a}", "{a} 사용 가능"],
  usedAmt: ["{a} used", "{a} usati", "{a} utilisés", "{a} belegt", "{a} usados", "{a} usados", "已用 {a}", "занято {a}", "使用 {a}", "{a} 사용 중"],
  freeOf: ["{a} free of {b}", "{a} liberi su {b}", "{a} libres sur {b}", "{a} von {b} frei", "{a} libres de {b}", "{a} livres de {b}", "可用 {a}，共 {b}", "свободно {a} из {b}", "空き {a} / {b}", "{b} 중 {a} 사용 가능"],
  usedOf: ["{a} used of {b}", "{a} usati su {b}", "{a} utilisés sur {b}", "{a} von {b} belegt", "{a} usados de {b}", "{a} usados de {b}", "已用 {a}，共 {b}", "занято {a} из {b}", "使用 {a} / {b}", "{b} 중 {a} 사용 중"],
  pctUsed: ["{p}% used", "{p}% usato", "{p} % utilisé", "{p} % belegt", "{p} % usado", "{p}% usado", "已用 {p}%", "занято {p}%", "{p}% 使用", "{p}% 사용 중"],
  drivesN: [["{n} drive", "{n} drives"], "{n} unità", ["{n} lecteur", "{n} lecteurs"], ["{n} Laufwerk", "{n} Laufwerke"], ["{n} unidad", "{n} unidades"], ["{n} unidade", "{n} unidades"], "{n} 个驱动器", ["{n} диск", "{n} диска", "{n} дисков"], "{n} ドライブ", "드라이브 {n}개"],
  readingDrives: ["Reading drives…", "Lettura unità…", "Lecture des lecteurs…", "Laufwerke werden gelesen…", "Leyendo unidades…", "Lendo unidades…", "正在读取驱动器…", "Чтение дисков…", "ドライブを確認中…", "드라이브 확인 중…"],
  network: ["Network", "Rete", "Réseau", "Netzwerk", "Red", "Rede", "网络", "Сеть", "ネットワーク", "네트워크"],
  download: ["Download", "Download", "Réception", "Download", "Descarga", "Download", "下载", "Загрузка", "ダウンロード", "다운로드"],
  upload: ["Upload", "Upload", "Envoi", "Upload", "Subida", "Upload", "上传", "Отдача", "アップロード", "업로드"],
  // Links, Note, To Do
  addLinks: ["Add links in settings", "Aggiungi i link nelle impostazioni", "Ajoutez des liens dans les paramètres", "Links in den Einstellungen hinzufügen", "Añade enlaces en la configuración", "Adicione links nas configurações", "在设置中添加链接", "Добавьте ссылки в настройках", "設定でリンクを追加", "설정에서 링크 추가"],
  note: ["Note", "Nota", "Note", "Notiz", "Nota", "Nota", "便笺", "Заметка", "メモ", "메모"],
  notePlaceholder: ["Write something to remember", "Scrivi qualcosa da ricordare", "Écrivez quelque chose à retenir", "Schreib etwas, das du dir merken willst", "Escribe algo que recordar", "Escreva algo para lembrar", "写下要记住的事", "Запишите, что нужно запомнить", "覚えておきたいことを書く", "기억할 내용을 적으세요"],
  clickToWrite: ["Click to write a note", "Fai clic per scrivere una nota", "Cliquez pour écrire une note", "Klicke, um eine Notiz zu schreiben", "Haz clic para escribir una nota", "Clique para escrever uma nota", "点击写便笺", "Щёлкните, чтобы написать заметку", "クリックしてメモを書く", "클릭하여 메모 작성"],
  noteInSettings: ["Write your note in the widget settings", "Scrivi la nota nelle impostazioni del widget", "Écrivez votre note dans les paramètres du widget", "Schreib deine Notiz in den Widget-Einstellungen", "Escribe tu nota en la configuración del widget", "Escreva sua nota nas configurações do widget", "在小组件设置中写便笺", "Напишите заметку в настройках виджета", "ウィジェットの設定でメモを書いてください", "위젯 설정에서 메모를 작성하세요"],
  edited: ["Edited {d}", "Modificata {d}", "Modifiée {d}", "Bearbeitet {d}", "Editada {d}", "Editada {d}", "编辑于 {d}", "Изменено {d}", "{d} に編集", "{d} 편집됨"],
  todo: ["To Do", "Attività", "À faire", "Aufgaben", "Tareas", "Tarefas", "待办事项", "Задачи", "タスク", "할 일"],
  addTask: ["Add a task", "Aggiungi un’attività", "Ajouter une tâche", "Aufgabe hinzufügen", "Añadir una tarea", "Adicionar uma tarefa", "添加任务", "Добавить задачу", "タスクを追加", "작업 추가"],
  newTask: ["New task", "Nuova attività", "Nouvelle tâche", "Neue Aufgabe", "Nueva tarea", "Nova tarefa", "新任务", "Новая задача", "新しいタスク", "새 작업"],
  whatNeedsDoing: ["What needs doing?", "Cosa c’è da fare?", "Que faut-il faire ?", "Was ist zu tun?", "¿Qué hay que hacer?", "O que precisa ser feito?", "要做什么？", "Что нужно сделать?", "何をしますか?", "무엇을 해야 하나요?"],
  editTask: ["Edit task", "Modifica attività", "Modifier la tâche", "Aufgabe bearbeiten", "Editar tarea", "Editar tarefa", "编辑任务", "Изменить задачу", "タスクを編集", "작업 편집"],
  emptyToDelete: ["Leave empty to delete", "Lascia vuoto per eliminare", "Laissez vide pour supprimer", "Leer lassen zum Löschen", "Déjalo vacío para eliminar", "Deixe vazio para excluir", "留空则删除", "Оставьте пустым, чтобы удалить", "空欄にすると削除", "비워 두면 삭제"],
  allDone: ["All done", "Tutto fatto", "Tout est fait", "Alles erledigt", "Todo hecho", "Tudo feito", "全部完成", "Всё сделано", "すべて完了", "모두 완료"],
  nLeft: ["{n} left", "{n} da fare", "{n} à faire", "{n} offen", ["{n} pendiente", "{n} pendientes"], ["{n} pendente", "{n} pendentes"], "剩 {n} 项", "осталось: {n}", "残り {n}", "{n}개 남음"],
  clearDone: ["Clear done", "Rimuovi fatte", "Effacer", "Erledigte löschen", "Borrar hechas", "Limpar feitas", "清除已完成", "Убрать готовые", "完了を消去", "완료 지우기"],
  tasksInSettings: ["Add tasks in the widget settings", "Aggiungi le attività nelle impostazioni del widget", "Ajoutez des tâches dans les paramètres du widget", "Aufgaben in den Widget-Einstellungen hinzufügen", "Añade tareas en la configuración del widget", "Adicione tarefas nas configurações do widget", "在小组件设置中添加任务", "Добавьте задачи в настройках виджета", "ウィジェットの設定でタスクを追加", "위젯 설정에서 작업 추가"],
  // Countdown, Progress
  newYear: ["New Year {y}", "Capodanno {y}", "Nouvel An {y}", "Neujahr {y}", "Año Nuevo {y}", "Ano-Novo {y}", "{y} 新年", "Новый год {y}", "{y} 年元日", "{y} 새해"],
  day: [["day", "days"], ["giorno", "giorni"], ["jour", "jours"], ["Tag", "Tage"], ["día", "días"], ["dia", "dias"], "天", ["день", "дня", "дней"], "日", "일"],
  hour: [["hour", "hours"], ["ora", "ore"], ["heure", "heures"], ["Stunde", "Stunden"], ["hora", "horas"], ["hora", "horas"], "小时", ["час", "часа", "часов"], "時間", "시간"],
  min: ["min", "min", "min", "Min.", "min", "min", "分钟", "мин", "分", "분"],
  ago: ["{t} ago", "{t} fa", "il y a {t}", "vor {t}", "hace {t}", "há {t}", "{t}前", "{t} назад", "{t}前", "{t} 전"],
  today: ["Today", "Oggi", "Aujourd’hui", "Heute", "Hoy", "Hoje", "今天", "Сегодня", "今日", "오늘"],
  week: ["Week", "Settimana", "Semaine", "Woche", "Semana", "Semana", "本周", "Неделя", "今週", "이번 주"],
  dayOf: ["Day {a} of {b}", "Giorno {a} di {b}", "Jour {a} sur {b}", "Tag {a} von {b}", "Día {a} de {b}", "Dia {a} de {b}", "第 {a}/{b} 天", "День {a} из {b}", "{b} 日中 {a} 日目", "{b}일 중 {a}일째"],
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
