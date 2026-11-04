import { For } from "solid-js";
import { mount, openUrl, useSettings, useSize } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, HoverLayer, LOOK, type Palette, Txt, clamp, shadeOf, usePalette, usePress } from "../shared/ui";

interface Link {
  name: string;
  url: string;
}

// Icon gradients from the Vitrine brand colours.
const TINTS = [
  ["#2B4DE0", "#00B8F5"],
  ["#FF4D73", "#FFB23E"],
  ["#00A5C9", "#6BF2E2"],
  ["#7A4DE0", "#FF4D73"],
  ["#E07A00", "#FFD23E"],
  ["#1F8F5F", "#6BE2A0"],
  ["#2B4DE0", "#9A6BFF"],
  ["#C43B6A", "#FF8FAB"],
];

/** "Name | https://…" or a bare URL (named after its host). */
function parse(raw: unknown): Link | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const bar = s.lastIndexOf("|");
  let name = bar >= 0 ? s.slice(0, bar).trim() : "";
  let url = (bar >= 0 ? s.slice(bar + 1) : s).trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  if (!name) name = url.replace(/^https?:\/\/(www\.)?/i, "").split(/[/?#]/)[0].split(".")[0];
  if (!name) return null;
  return { name: name[0].toUpperCase() + name.slice(1), url };
}

function Tile(props: { p: Palette; link: Link; i: number; d: number; width: number; label: boolean }) {
  const press = usePress();
  const tint = () => TINTS[props.i % TINTS.length];
  return (
    <view
      onClick={() => openUrl(props.link.url)}
      {...press.handlers}
      style={{ width: props.width, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 }}
    >
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={8} />
      <view
        style={{
          width: props.d,
          height: props.d,
          borderRadius: Math.round(props.d * 0.3),
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${tint()[0]}, ${tint()[1]})`,
          border: "1px solid rgba(255, 255, 255, 0.28)",
          boxShadow: props.p.bare ? `0 2px 6px ${shadeOf(props.p, props.p.dark ? 0.45 : 0.25)}` : undefined,
          transform: press.down() ? "scale(0.94)" : "scale(1)",
          transition: "transform 120ms ease",
        }}
      >
        <text style={{ fontFamily: FONT_DISPLAY, fontSize: Math.round(props.d * 0.46), fontWeight: 600, color: "#FFFFFF", textShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" }}>
          {props.link.name[0]}
        </text>
      </view>
      {props.label ? (
        <Txt p={props.p} lite box={{ maxWidth: props.width - 6 }} style={{ fontSize: 11, color: props.p.text2, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {() => props.link.name}
        </Txt>
      ) : null}
    </view>
  );
}

function Links() {
  const s = useSettings({
    ...LOOK,
    link1: "GitHub | https://github.com",
    link2: "Outlook | https://outlook.live.com",
    link3: "YouTube | https://www.youtube.com",
    link4: "Maps | https://www.google.com/maps",
    link5: "",
    link6: "",
    link7: "",
    link8: "",
  });
  const p = usePalette(s);
  const size = useSize();
  const links = () =>
    [s().link1, s().link2, s().link3, s().link4, s().link5, s().link6, s().link7, s().link8].map(parse).filter((l): l is Link => !!l);

  const inner = () => ({ w: size().width - 16, h: size().height - 12 });
  const label = () => size().height >= 64;
  // Pick the column count that gives the largest icons while every link fits.
  const layout = () => {
    const n = Math.max(1, links().length);
    let best = { cols: n, rows: 1, d: 0 };
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const d = Math.min(inner().w / cols - 16, inner().h / rows - (label() ? 30 : 10), 44);
      if (d > best.d) best = { cols, rows, d };
    }
    return { ...best, d: Math.floor(clamp(best.d, 20, 44)) };
  };

  return (
    <Card p={p()} style={{ flexDirection: "row", flexWrap: "wrap", alignContent: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 6 }}>
      {links().length === 0 ? (
        <Txt p={p()} lite style={{ fontSize: 12, color: p().text3 }}>
          {() => "Add links in settings"}
        </Txt>
      ) : null}
      <For each={links()}>
        {(l, i) => <Tile p={p()} link={l} i={i()} d={layout().d} width={Math.floor(inner().w / layout().cols)} label={label()} />}
      </For>
    </Card>
  );
}

mount(() => <Links />);
