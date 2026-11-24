import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import ICONS from "./icons.json";

// A tour of every feature: liquid glow, rim light, shortcut chips (in and out), the shortcut list,
// link underlines, the greeting through the day, and the private window (slid in like a new Space).
// Everything is driven by the output frame (30 fps). Sound effects are placed on the same frames
// in audio/make_tour_audio.py, so keep the two in step when moving a moment.
export const TOUR_DURATION = 1154;

// ───────────────────────── timeline (output frames) ─────────────────────────
export const T = {
  // A · open
  arrive: 0, ignite: 10, words: 30, bar: 46, links: 56,
  // B · search
  pushIn: 108, cursorIn: 132, sweep: 160, click: 180, y: 186, t: 191, space: 204, chip: 206, query: 216,
  // C · chip out, list
  erase: 290, select: 316, chipOut: 328, g: 354, list: 356, down1: 372, down2: 384, esc: 412,
  // D · links: one continuous glide over all four
  pullBack: 418, glide: 470, glideEnd: 565,
  // E · the greeting through the day
  times: 580, timeStep: 38,
  // F · private window, slid in like a new Space
  shortcut: 830, slide: 836, privIgnite: 850, privWords: 872,
  // G · end (the card waits until the window has fully gone)
  exit: 954, endIn: 972,
  // H · outro: the text holds, leaves (sub-line first), the grid stays alone, then fades to black
  subOut: 1066, titleOut: 1072, gridOut: 1120,
};
const QUERY = "Hugh Masekela";
const TYPE_RATE = 3; // frames per typed character
const ERASE_RATE = 1.6; // frames per erased character

// every greeting the page has, in the order of a day
const DAY = [
  { clock: "Tuesday 24 November  ·  08:12", greet: "Good morning, Sam" },
  { clock: "Saturday 28 November  ·  09:30", greet: "Slow morning, Sam" },
  { clock: "Tuesday 24 November  ·  13:40", greet: "Good afternoon, Sam" },
  { clock: "Tuesday 24 November  ·  19:05", greet: "Good evening, Sam" },
  { clock: "Tuesday 24 November  ·  23:48", greet: "Working late, Sam?" },
  { clock: "Wednesday 25 November  ·  02:15", greet: "Still up, Sam?" },
];
const NOW = { clock: "Tuesday 24 November  ·  21:40", greet: "Good evening, Sam" };

// ───────────────────────── palette + geometry ─────────────────────────
const ORANGE = { c1: "#f76203", c2: "#ff9a40", c3: "#e0400a" };
const BLUE = { c1: "#263f8c", c2: "#4e6cb8", c3: "#1a2768" };
type Palette = typeof ORANGE;
const BASE = "#1d1b19";
const WARM = "#f1eeea";
const MUTED = "rgba(255,246,238,0.78)";
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const WIN_W = 1600, WIN_H = 960, WIN_X = 160, WIN_Y = 60, CHROME_H = 98;
const BAR_W = 620, BAR_H = 56, BAR_TOP = 430;
const BAR_X = WIN_X + (WIN_W - BAR_W) / 2; // 650, in camera space
const BAR_Y = WIN_Y + CHROME_H + BAR_TOP; // 588
const FOCUS = { x: 960, y: BAR_Y + BAR_H / 2 }; // camera zooms around the search bar
const SPACE_GAP = 2000; // distance between the two "Spaces"

// ───────────────────────── easing helpers ─────────────────────────
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const OVER = Easing.bezier(0.34, 1.56, 0.64, 1); // entrance with a slight overshoot
const IN = Easing.bezier(0.55, 0, 1, 0.45); // exits
const IN_OUT = Easing.bezier(0.45, 0, 0.55, 1); // camera
const SLIDE_EASE = Easing.bezier(0.76, 0, 0.24, 1); // the Spaces swipe
const ramp = (f: number, a: number, b: number, e = OUT, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });
const enter = (f: number, a: number, d = 30) => ramp(f, a, a + d, OVER); // ~0.5 s with overshoot
const leaveP = (f: number, a: number, d = 18) => ramp(f, a, a + d, IN); // ~60% of an entrance, ease-in

// glow pulses: chip appears, list drops
const PULSES: [number, number][] = [[T.chip, 1], [T.list, 0.5]];
const pulseAt = (f: number) => PULSES.reduce((s, [at, k]) => (f >= at ? s + k * Math.exp(-(f - at) / 14) : s), 0);

// ───────────────────────── small pieces ─────────────────────────
type IconKey = "yt" | "gh" | "m" | "d" | "w";
const ENGINES: Record<IconKey, { name: string; sub: string; w: number }> = {
  gh: { name: "GitHub", sub: "Search repos and code", w: 104 },
  yt: { name: "YouTube", sub: "Search videos", w: 116 },
  m: { name: "Gmail", sub: "Search your inbox", w: 96 },
  d: { name: "Drive", sub: "Search Google Drive", w: 92 },
  w: { name: "Wikipedia", sub: "Search articles", w: 130 },
};
const Icon: React.FC<{ k: IconKey; size?: number; color?: string }> = ({ k, size = 16, color = WARM }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ flex: "none", display: "block" }} aria-hidden>
    <path d={(ICONS as Record<string, string>)[k]} fill={color} />
  </svg>
);
const Stroke: React.FC<{ d: string; size?: number; color?: string; w?: number }> = ({ d, size = 16, color = "rgba(251,251,254,0.86)", w = 1.5 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={w}
    strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", display: "block" }} aria-hidden>
    <path d={d} />
  </svg>
);
const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 7px", borderRadius: 5, background: "rgba(255,246,238,0.12)", color: MUTED, fontSize: 12 }}>{children}</span>
);

// the tab icon: the page's glow in miniature
const Orb: React.FC<{ p: Palette; id: string; size?: number }> = ({ p, id, size = 16 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ flex: "none", display: "block" }} aria-hidden>
    <defs>
      <filter id={`b${id}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" /></filter>
      <radialGradient id={`f${id}`}><stop offset=".68" stopColor="#fff" /><stop offset="1" stopColor="#000" /></radialGradient>
      <mask id={`m${id}`}><circle cx="32" cy="32" r="32" fill={`url(#f${id})`} /></mask>
    </defs>
    <g mask={`url(#m${id})`}>
      <rect width="64" height="64" fill={p.c1} />
      <g filter={`url(#b${id})`}>
        <ellipse cx="42" cy="17" rx="19" ry="16" fill={p.c2} />
        <ellipse cx="21" cy="50" rx="23" ry="16" fill={p.c3} opacity=".85" />
      </g>
    </g>
  </svg>
);

const place = (x: number, y: number, el: React.ReactNode, key?: string) => (
  <div key={key} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", display: "flex" }}>{el}</div>
);

// ───────────────────────── toolbar (drawn at 1440px, scaled to the window) ─────────────────────────
const FX = "#fbfbfe", FX_DIM = "rgba(251,251,254,0.62)";
const Toolbar: React.FC<{ priv: boolean; p: Palette; tabsIn: number }> = ({ priv, p, tabsIn }) => (
  <div style={{ height: CHROME_H, background: "#1c1b1a", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 88, transform: `scale(${WIN_W / 1440})`, transformOrigin: "0 0", fontFamily: FONT }}>
      <div style={{ opacity: tabsIn, transform: `translateY(${(1 - tabsIn) * 5}px)` }}>
        <div style={{
          position: "absolute", left: 14, top: 8, width: 221, height: 28, borderRadius: 8, background: "#2b2a29",
          display: "flex", alignItems: "center", gap: 8, padding: "0 9px 0 10px", boxSizing: "border-box",
        }}>
          <Orb p={p} id={priv ? "p1" : "n1"} size={16} />
          <span style={{ fontSize: 12.5, color: FX, letterSpacing: "0.005em" }}>New Tab</span>
          <span style={{ marginLeft: "auto", display: "flex" }}><Stroke d="M6.5 6.5l11 11M17.5 6.5l-11 11" size={14} color={FX} w={1.7} /></span>
        </div>
        {place(253, 22, <Stroke d="M12 4.5v15M4.5 12h15" size={17} color={FX} w={1.6} />)}
      </div>
      {priv && place(1395, 22, (
        <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="10" fill="#7338e2" />
          <path d="M3.6 8.6c1.9-1.6 4.2-1.6 6.4 0 2.2-1.6 4.5-1.6 6.4 0-.4 3-2.3 4.4-4.2 4.4-1 0-1.7-.6-2.2-1.4-.5.8-1.2 1.4-2.2 1.4-1.9 0-3.8-1.4-4.2-4.4z" fill="#fff" />
          <circle cx="7" cy="10" r="1" fill="#7338e2" /><circle cx="13" cy="10" r="1" fill="#7338e2" />
        </svg>
      ))}
      {place(1423, 22, <Stroke d="M3.5 18.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3 M3.5 8.5h16 M15 19.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z M17.4 18.8l2.6 2.6" size={17} />)}
      {place(27, 62, <Stroke d="M20 12H4.5M10.5 18l-6-6 6-6" size={17} color={FX_DIM} />)}
      {place(60, 62, <Stroke d="M4 12h15.5M13.5 6l6 6-6 6" size={17} color={FX_DIM} />)}
      <div style={{
        position: "absolute", left: 84, top: 48, width: 1143, height: 28, borderRadius: 10, background: "#272625",
        display: "flex", alignItems: "center", padding: "0 0 0 12px", boxSizing: "border-box",
      }}>
        <span style={{ fontSize: 14, color: "rgba(251,251,254,0.72)" }}>Search with Google or enter address</span>
      </div>
      {place(1250, 62, <Stroke d="M12 3.5v11M8 7.5l4-4 4 4M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" size={16} />)}
      {(["d", "gh", "m", "yt"] as IconKey[]).map((k, i) => place([1282, 1305, 1328, 1351][i], 62, <Icon k={k} size={15} color="rgba(251,251,254,0.42)" />, k))}
      {/* VPN as a shield: outlined while off */}
      {place(1380, 62, <Stroke d="M12 3l7.5 2.7v6c0 4.8-3.2 8.1-7.5 9.9-4.3-1.8-7.5-5.1-7.5-9.9v-6z" size={16} color="rgba(236,232,227,0.62)" w={1.7} />)}
      {place(1412, 62, <Stroke d="M4.5 7h15M4.5 12h15M4.5 17h15" size={17} color={FX} w={1.7} />)}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "rgba(0,0,0,0.35)" }} />
  </div>
);

// ───────────────────────── the glow ─────────────────────────
// The page's three colour fields, plus a highlight and a shadow that wander through them, so the light flows.
const Glow: React.FC<{ f: number; p: Palette; energy: number; pulse: number; lean: { x: number; y: number }; id: string }> = ({ f, p, energy, pulse, lean, id }) => {
  const t = f / 30;
  const s = (0.76 + 0.24 * energy) * (1 + 0.035 * pulse);
  const blob = (st: React.CSSProperties, dx: number, dy: number, sc: number): React.CSSProperties => ({
    position: "absolute", borderRadius: "50%", ...st, transform: `translate(${dx}px, ${dy}px) scale(${sc * s})`,
  });
  return (
    <AbsoluteFill style={{ background: BASE, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(54px)", opacity: energy }}>
        <div style={blob({ width: 1250, height: 1040, left: 128, top: -330, background: p.c1 },
          Math.sin(t * 0.35) * 46 + lean.x * 40, Math.cos(t * 0.3) * 28 + lean.y * 26, 1 + Math.sin(t * 0.25) * 0.03)} />
        <div style={blob({ width: 670, height: 520, left: 672, top: -190, background: p.c2, opacity: 0.78 + 0.18 * Math.min(1, pulse) },
          Math.sin(t * 0.5 + 1) * -80 + lean.x * 70, Math.cos(t * 0.45) * 34 + lean.y * 40, 1 + Math.sin(t * 0.4) * 0.07)} />
        <div style={blob({ width: 800, height: 480, left: 160, top: 330, background: p.c3, opacity: 0.75 },
          Math.sin(t * 0.4 + 2) * 70 - lean.x * 30, Math.cos(t * 0.35 + 1) * -30 - lean.y * 20, 1 + Math.cos(t * 0.3) * 0.05)} />
        {/* liquid flow: a light and a shadow drifting through the orb */}
        <div style={blob({ width: 420, height: 300, left: 560, top: 60, background: p.c2, opacity: 0.4 },
          Math.sin(t * 0.62) * 260, Math.sin(t * 0.47 + 1.3) * 120, 1 + Math.sin(t * 0.8) * 0.12)} />
        <div style={blob({ width: 460, height: 320, left: 420, top: 240, background: p.c3, opacity: 0.42 },
          Math.cos(t * 0.55 + 0.6) * 240, Math.sin(t * 0.58) * 110, 1 + Math.cos(t * 0.7) * 0.1)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 80% at 50% 40%, transparent 50%, rgba(29,27,25,0.6) 100%)" }} />
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "56px 56px", backgroundPosition: "center",
        WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, #000 15%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, #000 15%, transparent 100%)",
      }} />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.4 }} aria-hidden>
        <filter id={`grain${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} stitchTiles="stitch" seed={Math.floor(f / 2) % 8} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={3} intercept={-1} /><feFuncG type="linear" slope={3} intercept={-1} /><feFuncB type="linear" slope={3} intercept={-1} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ───────────────────────── greeting: words rise in, and leave ─────────────────────────
const Words: React.FC<{ text: string; f: number; start: number; out?: number; stagger?: number; dur?: number; outDur?: number; size?: number }> = ({ text, f, start, out, stagger = 4, dur = 30, outDur = 18, size = 54 }) => {
  const words = text.split(" ");
  const gone = out === undefined ? 0 : leaveP(f, out, outDur);
  return (
    <div style={{ fontSize: size, fontWeight: 400, letterSpacing: "-0.025em", color: WARM, whiteSpace: "nowrap",
      opacity: 1 - gone, transform: `translateY(${-10 * gone}px)`, filter: `blur(${gone * 4}px)` }}>
      {words.map((w, i) => {
        const p = enter(f, start + i * stagger, dur);
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", padding: "0.14em 0.03em", margin: "-0.14em -0.03em" }}>
              <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 112}%)` }}>{w}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// the normal window's greeting and clock: "now", then a run through the day.
// Each change: the old line leaves (8 frames), then the new one rises — they never overlap.
const OUT_D = 8;
function dayGreeting(f: number) {
  const steps = [NOW, ...DAY];
  const starts = [T.words, ...DAY.map((_, i) => T.times + i * T.timeStep)];
  let i = 0;
  while (i + 1 < steps.length && f >= starts[i + 1]) i++;
  const nextAt = starts[i + 1];
  const enterAt = i === 0 ? T.words : starts[i] + OUT_D;
  const greeting = (
    <Words text={steps[i].greet} f={f} start={enterAt} stagger={i === 0 ? 4 : 2} dur={i === 0 ? 30 : 18}
      out={nextAt !== undefined && f >= nextAt - OUT_D ? nextAt - OUT_D : undefined} outDur={OUT_D} />
  );
  const cIn = i === 0 ? enter(f, 24) : ramp(f, enterAt, enterAt + 12);
  const cOut = nextAt !== undefined ? leaveP(f, nextAt - OUT_D, OUT_D) : 0;
  const clock = (
    <div style={{ opacity: cIn * (1 - cOut), transform: `translateY(${(1 - cIn) * 7 - cOut * 4}px)` }}>{steps[i].clock}</div>
  );
  return { greeting, clock };
}

// ───────────────────────── search state for the normal window ─────────────────────────
function searchState(f: number) {
  let value = "";
  let chip: IconKey | null = null;
  let chipBorn = 0;
  let chipSel = false;
  let chipExit: number | null = null;
  let ghost = false;
  let list = false;
  if (f >= T.y && f < T.space) {
    value = f >= T.t ? "yt" : "y";
    ghost = f >= T.t + 2;
  } else if (f >= T.space && f < T.chipOut + 18) {
    chip = "yt"; chipBorn = T.chip;
    if (f < T.erase) value = QUERY.slice(0, Math.max(0, Math.min(QUERY.length, Math.floor((f - T.query) / TYPE_RATE) + 1)));
    else value = QUERY.slice(0, Math.max(0, QUERY.length - Math.floor((f - T.erase) / ERASE_RATE)));
    if (f < T.query) value = "";
    chipSel = f >= T.select;
    if (f >= T.chipOut) chipExit = T.chipOut;
  } else if (f >= T.g && f < T.esc) {
    value = "g";
    list = f >= T.list;
  }
  const listOut = f >= T.esc && f < T.esc + 18;
  const sel = f < T.list ? 0
    : spring({ frame: f - T.down1, fps: 30, config: { damping: 14, stiffness: 220 } }) + spring({ frame: f - T.down2, fps: 30, config: { damping: 14, stiffness: 220 } });
  return { value, chip, chipBorn, chipSel, chipExit, ghost, list, listOut, sel };
}

const SearchBar: React.FC<{ f: number; interactive: boolean; barIn: number; cursor: { x: number; y: number; vis: number } }> = ({ f, interactive, barIn, cursor }) => {
  const s = interactive ? searchState(f) : searchState(-1);
  const focused = interactive && f >= T.click && f < T.pullBack;
  const caret = focused && Math.floor(f / 16) % 2 === 0;
  const chipPop = s.chip ? spring({ frame: f - s.chipBorn, fps: 30, config: { damping: 14, stiffness: 220 } }) : 0;
  const ex = s.chipExit !== null ? leaveP(f, s.chipExit) : 0;
  const hint = s.ghost ? <><KeyCap>Space</KeyCap><KeyCap>Tab</KeyCap></>
    : s.list ? <><KeyCap>↑↓</KeyCap><KeyCap>Tab</KeyCap></>
    : s.chip && s.value && !s.chipSel ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Search <KeyCap>↵</KeyCap></span>
    : s.chipSel && !s.chipExit ? <span>⌫ again to remove</span> : null;
  const placeholder = s.chip && !s.chipExit ? `Search ${ENGINES[s.chip].name}` : "Search";
  // rim light follows the cursor around the border
  const rx = cursor.x - BAR_X, ry = cursor.y - BAR_Y;
  const near = Math.max(0, 1 - Math.max(0, Math.max(-rx, rx - BAR_W, -ry, ry - BAR_H)) / 90);
  const rim = interactive && f < T.pullBack ? cursor.vis * near : 0;
  // the list keeps its full size when Esc is pressed and eases out from there (no snap)
  const listP = s.list ? ramp(f, T.list, T.list + 12) : s.listOut ? 1 : 0;
  const listX = s.listOut ? leaveP(f, T.esc) : 0;
  const listO = s.listOut ? 1 - listX : listP;
  const rows: IconKey[] = ["gh", "m", "d"];

  return (
    <div style={{ position: "absolute", left: (WIN_W - BAR_W) / 2, top: BAR_TOP, width: BAR_W, opacity: Math.min(1, barIn), transform: `translateY(${(1 - barIn) * 10}px) scaleX(${0.965 + 0.035 * barIn})` }}>
      <div style={{ position: "absolute", inset: "-34px -70px", borderRadius: "50%", zIndex: -1, background: "radial-gradient(closest-side, rgba(255,255,255,0.10), transparent)", opacity: focused ? ramp(f, T.click, T.click + 20) * (1 - ramp(f, T.pullBack - 20, T.pullBack)) : 0 }} />
      <div style={{
        position: "relative", height: BAR_H, boxSizing: "border-box", padding: "0 12px", borderRadius: 14,
        background: `rgba(29,27,25,${focused ? 0.55 : 0.45})`, backdropFilter: "blur(16px)",
        border: `1px solid rgba(255,255,255,${focused ? 0.18 : 0.08})`,
        boxShadow: focused ? "0 22px 60px -30px rgba(0,0,0,0.65)" : "none",
        display: "flex", alignItems: "center", gap: 8, fontFamily: FONT,
      }}>
        {/* rim light */}
        <div style={{
          position: "absolute", inset: -1.5, padding: 1.5, borderRadius: 14.5, pointerEvents: "none", opacity: rim,
          background: `radial-gradient(220px circle at ${rx}px ${ry}px, rgba(255,255,255,0.95), rgba(255,255,255,0.25) 45%, transparent 75%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)", WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }} />
        {s.chip && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7, height: 32, padding: `0 ${11 * (1 - ex)}px 0 ${10 * (1 - ex)}px`, borderRadius: 8,
            background: `rgba(255,246,238,${s.chipSel ? 0.34 : 0.16})`, color: WARM, fontSize: 16, flex: "none", overflow: "hidden", whiteSpace: "nowrap",
            maxWidth: ENGINES[s.chip].w * (1 - ex), marginRight: -9 * ex,
            transform: `scale(${(0.82 + chipPop * 0.18) * (1 - 0.14 * ex)})`, transformOrigin: "left center",
            opacity: chipPop * (1 - ramp(f, s.chipExit ?? 1e9, (s.chipExit ?? 1e9) + 11, IN)), filter: `blur(${3 * ex}px)`,
          }}>
            <Icon k={s.chip} size={15} />{ENGINES[s.chip].name}
          </span>
        )}
        <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 17, color: WARM, paddingLeft: s.chip ? 2 + 7 * ex : 9, whiteSpace: "pre" }}>
          {s.value ? <span>{s.value}</span> : null}
          <span style={{ width: 1.5, height: 21, background: WARM, marginLeft: 1, opacity: caret ? 1 : 0 }} />
          {!s.value && <span style={{ color: MUTED, marginLeft: -2.5 }}>{placeholder}</span>}
          {s.ghost && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, marginLeft: 8, opacity: ramp(f, T.t + 2, T.t + 10), transform: `translateX(${(1 - ramp(f, T.t + 2, T.t + 12)) * -6}px)` }}>
              → <Icon k="yt" size={14} color={MUTED} /> YouTube
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: MUTED }}>{hint}</div>
      </div>

      {(s.list || s.listOut) && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: BAR_H + 8, padding: 6, borderRadius: 14,
          background: "rgba(29,27,25,0.78)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: 2, fontFamily: FONT,
          opacity: listO, transform: `translateY(${(1 - listP) * -6 - listX * 6}px) scale(${0.985 + 0.015 * listP - 0.015 * listX})`, transformOrigin: "50% 0",
        }}>
          {/* the highlight slides between rows */}
          <div style={{ position: "absolute", left: 6, right: 6, top: 6, height: 42, borderRadius: 8, background: "rgba(255,246,238,0.13)", transform: `translateY(${s.sel * 44}px)` }} />
          {rows.map((k, i) => {
            const r = ramp(f, T.list + i * 3, T.list + i * 3 + 12);
            return (
              <div key={k} style={{ position: "relative", height: 42, padding: "0 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: WARM, opacity: r, transform: `translateY(${(1 - r) * 5}px)` }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,246,238,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon k={k} size={15} /></span>
                {ENGINES[k].name}
                <span style={{ color: MUTED, fontSize: 13 }}>{ENGINES[k].sub}</span>
                <span style={{ marginLeft: "auto" }}><KeyCap>{k}</KeyCap></span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ───────────────────────── links ─────────────────────────
// approximate x-extent of each link in camera space (15px Inter, 32px gaps, centred on 960)
const LINKS: { label: string; x0: number; x1: number }[] = [
  { label: "Drive", x0: 822, x1: 856 },
  { label: "GitHub", x0: 888, x1: 938 },
  { label: "Gmail", x0: 970, x1: 1012 },
  { label: "YouTube", x0: 1044, x1: 1104 },
];

const Links: React.FC<{ f: number; interactive: boolean; linksIn: (i: number) => number }> = ({ f, interactive, linksIn }) => {
  const s = interactive ? searchState(f) : searchState(-1);
  // links step aside for the list and only come back once it has fully gone
  const hide = s.list ? ramp(f, T.list, T.list + 8) : interactive && f >= T.esc && f < T.esc + 32 ? 1 - ramp(f, T.esc + 18, T.esc + 32) : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: BAR_TOP + BAR_H + 38, display: "flex", justifyContent: "center", gap: 32, fontFamily: FONT, opacity: 1 - hide }}>
      {LINKS.map((l, i) => {
        const o = linksIn(i);
        const hv = interactive ? HOVER[i] : null;
        const hin = hv ? ramp(f, hv[0], hv[0] + 14) : 0;
        const hout = hv ? ramp(f, hv[1], hv[1] + 16) : 0;
        const h = hin * (1 - hout);
        return (
          <span key={l.label} style={{ position: "relative", fontSize: 15, opacity: Math.min(1, o), transform: `translateY(${(1 - o) * 7}px)`, color: `rgba(255,246,238,${0.78 + 0.22 * h})` }}>
            {l.label}
            {/* underline draws in from the left and leaves to the right */}
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -5, height: 1, background: "currentColor",
              transform: `scaleX(${hout > 0 ? 1 - hout : hin})`, transformOrigin: hout > 0 ? "right" : "left" }} />
          </span>
        );
      })}
    </div>
  );
};

// ───────────────────────── a browser window ─────────────────────────
const Window: React.FC<{
  f: number; priv: boolean; energy: number; pulse: number; lean: { x: number; y: number };
  greeting: React.ReactNode; clock: React.ReactNode; tabsIn: number; barIn: number; linksIn: (i: number) => number;
  cursor: { x: number; y: number; vis: number };
}> = ({ f, priv, energy, pulse, lean, greeting, clock, tabsIn, barIn, linksIn, cursor }) => {
  const p = priv ? BLUE : ORANGE;
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 14, overflow: "hidden", boxShadow: "0 50px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)" }}>
      <Toolbar priv={priv} p={p} tabsIn={tabsIn} />
      <div style={{ position: "relative", height: WIN_H - CHROME_H }}>
        <Glow f={f} p={p} energy={energy} pulse={pulse} lean={lean} id={priv ? "p" : "n"} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: FONT }}>
          <div style={{ position: "relative", height: 20, marginBottom: 14, fontSize: 16, color: MUTED, letterSpacing: "0.02em", whiteSpace: "pre" }}>{clock}</div>
          <div style={{ position: "relative", height: 66, display: "flex", justifyContent: "center" }}>{greeting}</div>
        </div>
        <SearchBar f={f} interactive={!priv} barIn={barIn} cursor={cursor} />
        <Links f={f} interactive={!priv} linksIn={linksIn} />
      </div>
    </div>
  );
};

// ───────────────────────── cursor ─────────────────────────
type Move = { a: number; b: number; x: number; y: number; bend?: number };
const START = { x: 1700, y: 1010 };
// Moves take as long as a real hand would: shorter for shorter distances (roughly 8 frames
// plus 1 per 45px, Fitts-style), with a quick start and a long, gentle landing.
const MOVES: Move[] = [
  { a: T.cursorIn, b: T.cursorIn + 23, x: 1150, y: 618, bend: 1 }, // in, onto the right of the search bar
  { a: T.sweep, b: T.sweep + 14, x: 870, y: 616, bend: -0.5 }, // sweeps left along it, the rim light follows
  { a: 188, b: 203, x: 640, y: 800, bend: 1 }, // out of the way while typing, below-left of the links
];
// the link glide: one smooth, unbroken curve that passes over all four links
// (a point on each link, so the cursor spends an even share of the time over every one)
const GLIDE_PTS: [number, number][] = [[640, 800], [780, 714], [839, 699], [913, 697], [991, 697], [1074, 699], [1150, 718], [1250, 790]];
const GLIDE_EASE = Easing.bezier(0.42, 0, 0.58, 1);
const CLICKS = [T.click];
const ARC = Easing.bezier(0.3, 0.1, 0.12, 1); // fast off the mark, long deceleration onto the target

function catmull(pts: [number, number][], u: number) {
  const n = pts.length - 1;
  const x = Math.min(n - 1e-6, Math.max(0, u * n));
  const i = Math.floor(x), t = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const c = (a: number, b: number, cc: number, d: number) =>
    0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t * t + (-a + 3 * b - 3 * cc + d) * t * t * t);
  return { x: c(p0[0], p1[0], p2[0], p3[0]), y: c(p0[1], p1[1], p2[1], p3[1]) };
}

function cursorAt(f: number) {
  if (f >= T.glide) {
    const u = ramp(f, T.glide, T.glideEnd, GLIDE_EASE);
    const p = catmull(GLIDE_PTS, u);
    return { x: p.x + Math.sin(f * 0.07) * 1.2, y: p.y + Math.cos(f * 0.055) * 1 };
  }
  let px = START.x, py = START.y;
  for (const m of MOVES) {
    if (f < m.a) break;
    const dx = m.x - px, dy = m.y - py;
    const dist = Math.hypot(dx, dy) || 1;
    if (f <= m.b) {
      // quadratic bezier arc, control point offset 15% of the distance
      const t = ARC((f - m.a) / (m.b - m.a));
      const cx = (px + m.x) / 2 + (-dy / dist) * dist * 0.15 * (m.bend ?? 1);
      const cy = (py + m.y) / 2 + (dx / dist) * dist * 0.15 * (m.bend ?? 1);
      const u = 1 - t;
      return { x: u * u * px + 2 * u * t * cx + t * t * m.x, y: u * u * py + 2 * u * t * cy + t * t * m.y };
    }
    // settles with a tiny overshoot, like a real hand
    const since = f - m.b;
    const amp = Math.min(5, dist * 0.02) * Math.exp(-since / 4) * Math.sin(since / 2.2);
    px = m.x; py = m.y;
    if (since < 14) { px += (dx / dist) * amp; py += (dy / dist) * amp; }
  }
  return { x: px + Math.sin(f * 0.07) * 1.2, y: py + Math.cos(f * 0.055) * 1 };
}
const cursorVis = (f: number) => ramp(f, T.cursorIn, T.cursorIn + 10) * (1 - ramp(f, 198, 208, IN)) + ramp(f, T.pullBack + 24, T.pullBack + 36) * (1 - ramp(f, T.glideEnd - 12, T.glideEnd, IN));

// when the glide enters and leaves each link (worked out from the path itself)
const HOVER: [number, number][] = LINKS.map((l) => {
  let tin = -1, tout = -1;
  for (let f = T.glide; f <= T.glideEnd; f++) {
    const c = cursorAt(f);
    const over = c.x >= l.x0 - 4 && c.x <= l.x1 + 4 && Math.abs(c.y - 698) < 16;
    if (over && tin < 0) tin = f;
    if (!over && tin >= 0 && tout < 0) tout = f;
  }
  return [tin < 0 ? 1e9 : tin, tout < 0 ? T.glideEnd : tout];
});

function cursorShape(f: number): "arrow" | "ibeam" | "hand" {
  if (f >= 150 && f < 188) return "ibeam";
  if (HOVER.some(([a, b]) => f >= a && f < b)) return "hand";
  return "arrow";
}

const Cursor: React.FC<{ f: number }> = ({ f }) => {
  const vis = cursorVis(f);
  if (vis <= 0.001) return null;
  const { x, y } = cursorAt(f);
  const click = CLICKS.find((c) => f >= c && f < c + 16);
  const pt = click !== undefined ? (f - click) / 8 : 1; // 8-frame press: 1 → 0.96 → 1
  const sc = pt < 1 ? 1 - 0.04 * Math.sin(Math.PI * pt) : 1;
  const rp = click !== undefined ? (f - click) / 16 : 0;
  const shape = cursorShape(f);
  const shadow = "drop-shadow(0 3px 5px rgba(0,0,0,0.35))";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${x}px, ${y}px)`, opacity: vis }}>
      {click !== undefined && (
        <div style={{ position: "absolute", left: -22 * rp, top: -22 * rp, width: 44 * rp, height: 44 * rp, borderRadius: "50%", border: "1.5px solid rgba(255,246,238,0.8)", opacity: 0.55 * (1 - rp) }} />
      )}
      <div style={{ transform: `scale(${sc})`, transformOrigin: "0 0" }}>
        {shape === "arrow" && (
          <svg width={26} height={34} viewBox="0 0 18 24" style={{ filter: shadow, overflow: "visible" }} aria-hidden>
            <path d="M1 1 L1 18.5 L5.4 14.4 L8.6 21.6 L11.4 20.4 L8.3 13.3 L14.4 13.3 Z" fill="#fff" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
          </svg>
        )}
        {shape === "hand" && (
          <svg width={28} height={32} viewBox="0 0 20 24" style={{ filter: shadow, overflow: "visible", transform: "translate(-10px, -2px)" }} aria-hidden>
            <path d="M7 1.5c-.9 0-1.6.7-1.6 1.6V12l-1.3-1.3c-.7-.7-1.8-.7-2.4 0-.6.6-.6 1.5-.1 2.2l3.9 5.4C6.6 20.6 8.4 22.5 11 22.5h2.4c3 0 5.1-2.4 5.1-5.4v-4.6c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v-.6c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v-.4c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6V3.1C8.6 2.2 7.9 1.5 7 1.5z" fill="#fff" stroke="#111" strokeWidth={1.1} strokeLinejoin="round" />
          </svg>
        )}
        {shape === "ibeam" && (
          <svg width={14} height={30} viewBox="0 0 14 30" style={{ filter: shadow, overflow: "visible", transform: "translate(-7px, -15px)" }} aria-hidden>
            <path d="M3 2h2.6c.8 0 1.4.5 1.4.5s.6-.5 1.4-.5H11 M7 2.6v24.8 M3 28h2.6c.8 0 1.4-.5 1.4-.5s.6.5 1.4.5H11" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
            <path d="M3 2h2.6c.8 0 1.4.5 1.4.5s.6-.5 1.4-.5H11 M7 2.6v24.8 M3 28h2.6c.8 0 1.4-.5 1.4-.5s.6.5 1.4.5H11" fill="none" stroke="#111" strokeWidth={1.4} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

// ───────────────────────── key overlay ─────────────────────────
const KEYS: { at: number; label: string; caption?: string }[] = [
  { at: T.space, label: "Space" }, { at: T.erase, label: "⌫" }, { at: T.select, label: "⌫" }, { at: T.chipOut, label: "⌫" },
  { at: T.down1, label: "↓" }, { at: T.down2, label: "↓" }, { at: T.esc, label: "Esc" },
  { at: T.shortcut, label: "⇧ ⌘ P", caption: "New private window" },
];
const KeyOverlay: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const ev = [...KEYS].reverse().find((e) => f >= e.at && f < e.at + (e.caption ? 60 : 30));
  if (!ev) return null;
  const life = ev.caption ? 60 : 30;
  const next = KEYS.find((e) => e.at > ev.at);
  const end = Math.min(ev.at + life, next ? next.at : 1e9);
  const p = spring({ frame: f - ev.at, fps, config: { damping: 14, stiffness: 240 } });
  const out = next && next.at <= ev.at + life ? 0 : leaveP(f, end - 18);
  const cap = ev.caption ? enter(f, ev.at + 6) : 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 62, display: "flex", justifyContent: "center", alignItems: "center", gap: 18,
      opacity: Math.min(1, p) * (1 - out), transform: `translateY(${(1 - p) * 12 + out * 8}px)` }}>
      <div style={{
        minWidth: 76, height: 64, padding: "0 22px", boxSizing: "border-box", borderRadius: 14,
        background: "rgba(29,27,25,0.82)", border: "1px solid rgba(255,255,255,0.1)", borderBottomWidth: 3,
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 26, fontWeight: 500, color: WARM,
        transform: `scale(${0.9 + p * 0.1})`, boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
      }}>{ev.label}</div>
      {ev.caption && (
        <div style={{ fontFamily: FONT, fontSize: 24, color: "rgba(241,238,234,0.85)", opacity: Math.min(1, cap), transform: `translateX(${(1 - cap) * -10}px)`, whiteSpace: "nowrap" }}>{ev.caption}</div>
      )}
    </div>
  );
};

// ───────────────────────── film ─────────────────────────
export const Tour: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // camera (first Space): push in on the search bar, pull back for the links; a slow micro-push throughout
  const zp = ramp(f, T.pushIn, T.pushIn + 48, IN_OUT) * (1 - ramp(f, T.pullBack, T.pullBack + 50, IN_OUT));
  const zoom = (1 + 0.55 * zp) * (1 + 0.03 * ramp(f, 0, T.slide, IN_OUT));

  const cur = cursorAt(f);
  const vis = cursorVis(f);
  const lean = { x: ((cur.x - 960) / 960) * vis, y: ((cur.y - 540) / 540) * vis };

  // the slide between Spaces: a full-width pan over 48 frames with a strong ease-in-out
  // (slow away, fast through the middle, soft landing)
  const slide = ramp(f, T.slide, T.slide + 48, SLIDE_EASE);
  const exitP = leaveP(f, T.exit);
  const arrive = spring({ frame: f - T.arrive, fps, config: { damping: 14, stiffness: 90 } });
  const day = dayGreeting(f);

  const normal = (
    <Window f={f} priv={false} energy={ramp(f, T.ignite, T.ignite + 50)} pulse={pulseAt(f)} lean={lean}
      greeting={day.greeting} clock={day.clock} tabsIn={ramp(f, 14, 34)} barIn={enter(f, T.bar, 26)}
      linksIn={(i) => enter(f, T.links + i * 4)} cursor={{ ...cur, vis }} />
  );
  const priv = f >= T.slide - 4 ? (
    <Window f={f} priv energy={ramp(f, T.privIgnite, T.privIgnite + 50)} pulse={0} lean={{ x: 0.15 * Math.sin(f / 40), y: 0 }}
      greeting={<Words text="Shhhh, this is all private" f={f} start={T.privWords} />}
      clock={<div style={{ opacity: enter(f, T.privWords - 6), transform: `translateY(${(1 - enter(f, T.privWords - 6)) * 7}px)` }}>{NOW.clock}</div>}
      tabsIn={ramp(f, T.privIgnite, T.privIgnite + 20)} barIn={enter(f, T.privWords + 10, 26)}
      linksIn={(i) => enter(f, T.privWords + 18 + i * 4)} cursor={{ x: 0, y: 0, vis: 0 }} />
  ) : null;

  // outro
  const subIn = enter(f, T.endIn + 16);
  const subGone = leaveP(f, T.subOut);
  const textGone = leaveP(f, T.titleOut); // the grid opens out a little as the text leaves
  const gridLife = ramp(f, T.endIn - 6, TOUR_DURATION, Easing.linear);
  const fade = ramp(f, T.gridOut, TOUR_DURATION, IN_OUT);
  const privPush = 1 + 0.02 * ramp(f, T.slide + 48, T.exit, IN_OUT);

  return (
    <AbsoluteFill style={{ background: "#121110", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${-SPACE_GAP * slide}px)` }}>
        {/* Space 1: the normal window */}
        <AbsoluteFill>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 45% at 50% 45%, rgba(247,98,3,0.16), transparent 70%)", opacity: ramp(f, 20, 80) }} />
          <AbsoluteFill style={{ transformOrigin: `${FOCUS.x}px ${FOCUS.y}px`, transform: `translateY(${-(FOCUS.y - 540) * zp}px) scale(${zoom})` }}>
            <div style={{
              position: "absolute", left: WIN_X, top: WIN_Y, width: WIN_W, height: WIN_H,
              opacity: Math.min(1, arrive), transform: `translateY(${(1 - arrive) * 60}px) scale(${0.94 + 0.06 * arrive})`,
            }}>{normal}</div>
            <Cursor f={f} />
          </AbsoluteFill>
        </AbsoluteFill>

        {/* Space 2: the private window, one screen to the right */}
        {priv && (
          <AbsoluteFill style={{ left: SPACE_GAP, right: -SPACE_GAP }}>
            <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 45% at 50% 45%, rgba(78,108,184,0.2), transparent 70%)", opacity: 1 - exitP }} />
            <AbsoluteFill style={{ transform: `scale(${privPush})` }}>
              <div style={{
                position: "absolute", left: WIN_X, top: WIN_Y, width: WIN_W, height: WIN_H,
                opacity: 1 - exitP, transform: `translateY(${-20 * exitP}px) scale(${1 - 0.04 * exitP})`,
              }}>{priv}</div>
            </AbsoluteFill>
          </AbsoluteFill>
        )}
      </AbsoluteFill>

      <KeyOverlay f={f} fps={fps} />

      {/* end card: the page's grid, the line rising word by word, and a quiet sub-line */}
      {f >= T.endIn - 6 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, background: BASE, opacity: ramp(f, T.endIn - 6, T.endIn + 12) }}>
          <AbsoluteFill style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px", backgroundPosition: "center",
            WebkitMaskImage: `radial-gradient(ellipse ${55 + 13 * textGone}% ${55 + 13 * textGone}% at 50% 50%, #000 10%, transparent 100%)`,
            maskImage: `radial-gradient(ellipse ${55 + 13 * textGone}% ${55 + 13 * textGone}% at 50% 50%, #000 10%, transparent 100%)`,
            opacity: 0.85 + 0.15 * textGone,
            transform: `scale(${1.05 - 0.05 * Easing.bezier(0.25, 0.1, 0.25, 1)(gridLife)}) translateY(${-6 * gridLife}px)`,
          }} />
          <div style={{ textAlign: "center", transform: `scale(${1 + 0.02 * ramp(f, T.endIn + 30, T.titleOut + 18, IN_OUT)})` }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Words text="A calmer new tab." f={f} start={T.endIn} size={72} out={T.titleOut} outDur={18} />
            </div>
            <div style={{ fontSize: 24, letterSpacing: "0.01em", color: MUTED, marginTop: 18,
              opacity: Math.min(1, subIn) * (1 - subGone), transform: `translateY(${(1 - subIn) * 12 - 6 * subGone}px)`, filter: `blur(${3 * subGone}px)` }}>Firefox, reskinned.</div>
          </div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
