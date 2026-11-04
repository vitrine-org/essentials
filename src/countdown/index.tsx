import { formatDate, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, LOOK, Txt, clamp, usePalette } from "../shared/ui";

const DAY = 86_400_000;

/** The target from "YYYY-MM-DD" and "HH:mm"; with no date, the next New Year. */
function target(date: string, time: string, now: Date): Date {
  const [hh, mm] = /^\d{1,2}:\d{2}$/.test(time) ? time.split(":").map(Number) : [0, 0];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hh, mm);
  return new Date(now.getFullYear() + 1, 0, 1, hh, mm);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Countdown() {
  const s = useSettings({ ...LOOK, title: "", date: "", time: "00:00", showProgress: true });
  const p = usePalette(s);
  const size = useSize();
  const now = useClock("minute");

  const when = () => target(s().date, s().time, now());
  const title = () => s().title.trim() || (s().date ? formatDate(when(), "D MMMM YYYY") : `New Year ${when().getFullYear()}`);
  const left = () => when().getTime() - now().getTime();
  const past = () => left() <= 0;
  const abs = () => Math.abs(left());
  // Calendar days between the two dates (not 24-hour blocks), as people count them.
  const days = () => {
    const a = new Date(now().getFullYear(), now().getMonth(), now().getDate());
    const b = new Date(when().getFullYear(), when().getMonth(), when().getDate());
    return Math.round(Math.abs(b.getTime() - a.getTime()) / DAY);
  };
  const big = () => {
    if (days() >= 1) return { n: String(days()), unit: days() === 1 ? "day" : "days" };
    const h = Math.floor(abs() / 3_600_000);
    if (h >= 1) return { n: String(h), unit: h === 1 ? "hour" : "hours" };
    return { n: String(Math.max(past() ? 0 : 1, Math.ceil(abs() / 60_000))), unit: "min" };
  };
  const detail = () => {
    if (past() && abs() < DAY) return "Today";
    const h = Math.floor((abs() % DAY) / 3_600_000);
    const m = Math.floor((abs() % 3_600_000) / 60_000);
    const rest = days() >= 1 ? `${plural(h, "hour", "hours")} ${m} min` : `${m} min`;
    return past() ? `${rest} ago` : `${formatDate(when(), "ddd D MMM")}${s().time !== "00:00" ? formatDate(when(), " · HH:mm") : ""}`;
  };
  // Progress from when the countdown was most plausibly set: a year before the target, at most.
  const progress = () => clamp(1 - left() / (365 * DAY), 0, 1);

  const tall = () => size().height >= 120;
  const numSize = () => Math.floor(clamp(Math.min(size().height * (tall() ? 0.36 : 0.44), (size().width - 40) / (big().n.length * 0.62 + 1.6)), 20, 76));

  return (
    <Card p={p()} style={{ flexDirection: "column", justifyContent: "center", paddingHorizontal: 16, paddingVertical: tall() ? 14 : 8, gap: tall() ? 4 : 0 }}>
      <Txt p={p()} lite style={{ fontSize: tall() ? 13 : 11, fontWeight: 600, color: p().accent, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {() => title()}
      </Txt>
      <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: numSize(), fontWeight: 600, lineHeight: 1.05, color: p().text, whiteSpace: "nowrap" }}>
        {(t) => (
          <>
            {big().n}
            <span style={{ fontSize: Math.round(numSize() * 0.34), fontWeight: 500, color: t(p().text2) }}>
              {" " + big().unit + (past() && abs() >= DAY ? " ago" : "")}
            </span>
          </>
        )}
      </Txt>
      {tall() ? (
        <Txt p={p()} lite style={{ fontSize: 12, color: p().text3, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {() => detail()}
        </Txt>
      ) : null}
      {tall() && s().showProgress && !past() ? (
        <view style={{ height: 3, borderRadius: 2, background: p().track, marginTop: 8 }}>
          <view style={{ width: Math.max(3, Math.round(progress() * (size().width - 32))), height: 3, borderRadius: 2, background: p().accent }} />
        </view>
      ) : null}
    </Card>
  );
}

mount(() => <Countdown />);
