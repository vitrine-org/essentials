import { createEffect, createSignal, For } from "solid-js";
import { mount, useSettings, useSize, useStorage } from "@vitrine/sdk";
import { Card, FONT_DISPLAY, HoverLayer, LOOK, type Palette, Txt, ask, canAsk, clamp, shadeOf, usePalette, usePress } from "../shared/ui";

interface Item {
  id: string;
  text: string;
  done: boolean;
}

const ROW = 30;
const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
/** Seed items from the settings text: one per line or separated by ";", "[x] " marks one done. */
const splitSeed = (raw: string) =>
  raw
    .split(/[;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);

function Check(props: { p: Palette; done: boolean }) {
  const d = 18;
  return (
    <view style={{ width: d, height: d, flexShrink: 0 }}>
      <view
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: d / 2,
          border: `1.5px solid ${props.p.text3}`,
          opacity: props.done ? 0 : 1,
          transition: "opacity 200ms ease",
        }}
      />
      <view
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: d / 2,
          background: props.p.accent,
          boxShadow: props.p.bare ? `0 1px 3px ${shadeOf(props.p, 0.4)}` : undefined,
          opacity: props.done ? 1 : 0,
          transform: props.done ? "scale(1)" : "scale(0.6)",
          transition: "opacity 200ms ease, transform 220ms ease",
        }}
      >
        <svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
          <path d="M 5.2 9.4 L 7.8 12 L 12.8 6.6" fill="none" stroke={props.p.onAccent} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </view>
    </view>
  );
}

function Pencil(props: { p: Palette; show: boolean; onClick: () => void }) {
  const press = usePress();
  return (
    <view
      onClick={(e) => (e.stopPropagation(), props.onClick())}
      {...press.handlers}
      style={{ width: 24, height: 24, flexShrink: 0, alignItems: "center", justifyContent: "center", opacity: props.show ? 1 : 0, transition: "opacity 150ms ease" }}
    >
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={4} />
      <svg width={14} height={14} viewBox="0 0 14 14">
        <path d="M 2.5 11.5 L 3.1 8.9 L 9.4 2.6 Q 10.2 1.8 11 2.6 L 11.4 3 Q 12.2 3.8 11.4 4.6 L 5.1 10.9 Z" fill="none" stroke={props.p.text2} strokeWidth={1.1} strokeLinejoin="round" />
      </svg>
    </view>
  );
}

function Row(props: { p: Palette; item: Item; editable: boolean; onToggle: () => void; onEdit: () => void }) {
  const press = usePress();
  const fs = 13;
  return (
    <view
      onClick={props.onToggle}
      {...press.handlers}
      style={{ height: ROW, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 8, paddingRight: 2 }}
    >
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={6} />
      <Check p={props.p} done={props.item.done} />
      <view style={{ flex: 1, minWidth: 0, flexDirection: "row" }}>
        <view style={{ flexShrink: 1, minWidth: 0, opacity: props.item.done ? 0.5 : 1, transition: "opacity 250ms ease" }}>
          <Txt p={props.p} style={{ fontSize: fs, lineHeight: 1.3, color: props.p.text, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {() => props.item.text}
          </Txt>
          {/* The strike: a hairline that fades in over the text (no text-decoration in the renderer). */}
          <view
            style={{
              position: "absolute",
              left: -1,
              right: -1,
              top: Math.round(fs * 0.68),
              height: 1,
              background: props.p.text,
              opacity: props.item.done ? 0.9 : 0,
              transition: "opacity 250ms ease",
            }}
          />
        </view>
      </view>
      {props.editable ? <Pencil p={props.p} show={press.hover()} onClick={props.onEdit} /> : null}
    </view>
  );
}

function AddRow(props: { p: Palette; onClick: () => void }) {
  const press = usePress();
  return (
    <view
      onClick={props.onClick}
      {...press.handlers}
      style={{ height: ROW, flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 8 }}
    >
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={6} />
      <view style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
        <svg width={18} height={18} viewBox="0 0 18 18">
          <path d="M 9 4 L 9 14 M 4 9 L 14 9" stroke={props.p.accent} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      </view>
      <Txt p={props.p} style={{ fontSize: 13, fontWeight: 600, color: props.p.accent }}>
        {() => "Add a task"}
      </Txt>
    </view>
  );
}

function TextButton(props: { p: Palette; label: string; onClick: () => void }) {
  const press = usePress();
  return (
    <view onClick={props.onClick} {...press.handlers} style={{ paddingHorizontal: 8, paddingVertical: 3 }}>
      <HoverLayer p={props.p} hover={press.hover()} down={press.down()} radius={4} />
      <Txt p={props.p} lite style={{ fontSize: 11, fontWeight: 600, color: props.p.accent, whiteSpace: "nowrap" }}>
        {() => props.label}
      </Txt>
    </view>
  );
}

function Todo() {
  const s = useSettings({ ...LOOK, title: "To Do", items: "", hideDone: false });
  const p = usePalette(s);
  const size = useSize();
  const [items, setItems] = useStorage<Item[] | null>("items", null);
  const [seed, setSeed] = useStorage<string>("seed", "");
  const [scroll, setScroll] = createSignal(0);

  // Tasks typed into the settings are added once; the list itself lives in widget storage.
  createEffect(() => {
    const raw = String(s().items ?? "");
    if (raw === seed() && items() !== null) return;
    const have = new Set((items() ?? []).map((i) => i.text.toLowerCase()));
    const added = splitSeed(raw)
      .filter((t) => !have.has(t.replace(/^\[x\]\s*/i, "").toLowerCase()) && !splitSeed(seed()).includes(t))
      .map((t) => ({ id: newId(), text: t.replace(/^\[x\]\s*/i, ""), done: /^\[x\]/i.test(t) }));
    setSeed(raw);
    if (added.length || items() === null) setItems([...(items() ?? []), ...added]);
  });

  const all = () => items() ?? [];
  const visible = () => (s().hideDone ? all().filter((i) => !i.done) : all());
  const left = () => all().filter((i) => !i.done).length;
  const doneCount = () => all().length - left();
  const editable = canAsk();

  const headH = 28;
  const capacity = () => Math.max(1, Math.floor((size().height - 24 - headH - (editable ? ROW : 0)) / ROW));
  const maxScroll = () => Math.max(0, visible().length - capacity());
  const shown = () => visible().slice(clamp(scroll(), 0, maxScroll()), clamp(scroll(), 0, maxScroll()) + capacity());

  const byId = (id: string) => all().find((i) => i.id === id) ?? { id, text: "", done: false };
  const toggle = (id: string) => setItems(all().map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const clearDone = () => setItems(all().filter((i) => !i.done));
  const add = async () => {
    const text = await ask({ title: "New task", placeholder: "What needs doing?" });
    if (text && text.trim()) {
      setItems([...all(), { id: newId(), text: text.trim(), done: false }]);
      setScroll(Number.MAX_SAFE_INTEGER);
    }
  };
  const edit = async (item: Item) => {
    const text = await ask({ title: "Edit task", placeholder: "Leave empty to delete", value: item.text });
    if (text === null || text === undefined) return;
    const t = text.trim();
    setItems(t ? all().map((i) => (i.id === item.id ? { ...i, text: t } : i)) : all().filter((i) => i.id !== item.id));
  };

  return (
    <Card p={p()} style={{ flexDirection: "column", paddingHorizontal: 8, paddingTop: 10, paddingBottom: 10 }}>
      <view style={{ height: headH, flexShrink: 0, flexDirection: "row", alignItems: "center", paddingLeft: 8, gap: 8 }}>
        <Txt p={p()} style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: p().text, whiteSpace: "nowrap" }}>
          {() => s().title || "To Do"}
        </Txt>
        <Txt p={p()} lite box={{ flex: 1, minWidth: 0 }} style={{ fontSize: 11, color: p().text3, whiteSpace: "nowrap", marginTop: 2 }}>
          {() => (all().length === 0 ? "" : left() === 0 ? "All done" : `${left()} left`)}
        </Txt>
        {doneCount() > 0 ? <TextButton p={p()} label="Clear done" onClick={clearDone} /> : null}
      </view>
      <view
        onWheel={(e) => setScroll(clamp(clamp(scroll(), 0, maxScroll()) + ((e.deltaY ?? 0) > 0 ? 1 : -1), 0, maxScroll()))}
        style={{ flex: 1, flexDirection: "column", minHeight: 0 }}
      >
        {/* Keyed by id so a row keeps its node (and animates) when its item changes. */}
        <For each={shown().map((i) => i.id)}>
          {(id) => <Row p={p()} item={byId(id)} editable={editable} onToggle={() => toggle(id)} onEdit={() => edit(byId(id))} />}
        </For>
        {all().length === 0 && !editable ? (
          <Txt p={p()} lite box={{ paddingLeft: 8, paddingTop: 6 }} style={{ fontSize: 12, color: p().text3 }}>
            {() => "Add tasks in the widget settings"}
          </Txt>
        ) : null}
        {editable && shown().length < capacity() + 1 ? <AddRow p={p()} onClick={add} /> : null}
      </view>
    </Card>
  );
}

mount(() => <Todo />);
