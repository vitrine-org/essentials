import { formatDate, mount, useClock, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, clamp, usePalette, uses12h } from "../shared/ui";

function Clock() {
  const s = useSettings({ theme: "auto", accent: "system", hourFormat: "auto", showSeconds: false, showDate: true });
  const now = useClock(s().showSeconds ? "second" : "minute");
  const size = useSize();
  const p = usePalette(s);
  const h12 = () => uses12h(s().hourFormat);

  // Scale the time to the card: limited by height (with the date line) and by width.
  const tall = () => size().height >= 120;
  const dateSize = () => (tall() ? 15 : 12);
  const chars = () => (s().showSeconds ? 3.9 : 2.6) + (h12() ? 1.1 : 0);
  const timeSize = () => {
    const pad = tall() ? 40 : 24;
    const byH = (size().height - pad - (s().showDate ? dateSize() * 1.4 + 2 : 0)) / 1.05;
    const byW = (size().width - pad) / chars();
    return Math.floor(clamp(Math.min(byH, byW), 16, 120));
  };
  const time = () => formatDate(now(), (h12() ? "h:mm" : "HH:mm") + (s().showSeconds ? ":ss" : ""));

  return (
    <Card
      p={p()}
      style={{
        flexDirection: "column",
        justifyContent: "center",
        paddingHorizontal: tall() ? 20 : 12,
        paddingVertical: tall() ? 16 : 8,
        gap: tall() ? 4 : 1,
      }}
    >
      <text
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: timeSize(),
          fontWeight: 600,
          lineHeight: 1.05,
          color: p().text,
          whiteSpace: "nowrap",
        }}
      >
        {time()}
        {h12() ? (
          <span style={{ fontSize: Math.round(timeSize() * 0.36), fontWeight: 500, color: p().text2 }}>
            {" " + (formatDate(now(), "A") || (now().getHours() < 12 ? "AM" : "PM"))}
          </span>
        ) : null}
      </text>
      {s().showDate ? (
        <text style={{ fontSize: dateSize(), color: p().text2, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          <span style={{ color: p().accent, fontWeight: 600 }}>{formatDate(now(), tall() ? "dddd" : "ddd")}</span>
          {formatDate(now(), tall() ? ", D MMMM YYYY" : " D MMM")}
        </text>
      ) : null}
    </Card>
  );
}

mount(() => <Clock />);
