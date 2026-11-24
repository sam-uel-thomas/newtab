import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import ICONS from "./icons.json";

export const DURATION = 960; // 56 beats of the track at 105 bpm = 32s

// ── music sync ──
// The film is authored on an internal timeline (0–870). Output frames are warped so key moments land on beats.
// Music starts at 128.396s (a downbeat in the breakdown); the drums drop back in at beat 16.
export const BEAT = (60 / 105) * 30; // ≈17.14 frames (fitted to this section of the track)
const SYNC: [number, number][] = [ // [internal frame, beat]
  [0, 0], [168, 12], [230, 16], [300, 20], [330, 22], [349, 24], [400, 27], [432, 29],
  [482, 32], [560, 38], [628, 41], [664, 43], [700, 45], [736, 47], [780, 49], [804, 51], [870, 56],
];
export const warp = (out: number) =>
  interpolate(out, SYNC.map((x) => x[1] * BEAT), SYNC.map((x) => x[0]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// ── palette (matches newtab.html + userChrome.css) ──
const BASE = "#1d1b19";
const RAISED = "#282522";
const TEXT = "#ece8e3";
const WARM = "#f6f1ea";
const MUTED_T = "rgba(236,232,227,0.6)";
const MUTED_P = "rgba(255,246,238,0.78)";
const FONT = "Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif";

// ── window geometry ──
const WIN_W = 1600;
const WIN_H = 960;
const WIN_X = (1920 - WIN_W) / 2;
const WIN_Y = (1080 - WIN_H) / 2;
const CHROME_H = 98; // real Firefox toolbar (88px) at the window's 1600/1440 scale
const DY = CHROME_H - 92; // shift for cursor targets laid out against the old toolbar
const BAR_W = 620;
const BAR_H = 56;
const BAR_TOP = 430; // within page area
const BAR_CX = WIN_X + WIN_W / 2;
const BAR_CY = WIN_Y + CHROME_H + BAR_TOP + BAR_H / 2;

const ease = Easing.bezier(0.2, 0.7, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ramp = (f: number, a: number, b: number, from = 0, to = 1, e = ease) =>
  interpolate(f, [a, b], [from, to], { ...clamp, easing: e });

type IconKey = "yt" | "gh" | "m" | "d" | "w";
const Icon: React.FC<{ k: IconKey; size?: number; color?: string }> = ({ k, size = 16, color = WARM }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={{ flex: "none" }} aria-hidden>
    <path d={(ICONS as Record<string, string>)[k]} fill={color} />
  </svg>
);

const Stroke: React.FC<{ d: string; size?: number; color?: string }> = ({ d, size = 16, color = MUTED_T }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }} aria-hidden>
    <path d={d} />
  </svg>
);

const ENGINES: Record<IconKey, { name: string; sub: string }> = {
  gh: { name: "GitHub", sub: "Search repos and code" },
  yt: { name: "YouTube", sub: "Search videos" },
  m: { name: "Gmail", sub: "Search your inbox" },
  d: { name: "Drive", sub: "Search Google Drive" },
  w: { name: "Wikipedia", sub: "Search articles" },
};

// ───────────────────────── storyboard ─────────────────────────
// 0–90     window arrives, page staggers in
// 150–190  camera pushes in on the search bar
// 195–300  "yt" → preview → Tab → chip → "lofi house mix"
// 330–420  Esc, "g" → list, ↓ ↓, Tab → Drive chip
// 430–470  camera pulls back
// 470–590  greeting cycles through the day
// 590–690  end card

const typed = (f: number, start: number, text: string, perChar = 4) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor((f - start) / perChar) + 1)));

function searchState(f: number) {
  // returns what the search bar shows at frame f
  let chip: IconKey | null = null;
  let value = "";
  let ghost: IconKey | null = null;
  let list: IconKey[] = [];
  let sel = 0;
  let chipBorn = 0;

  if (f >= 199 && f < 230) {
    value = typed(f, 199, "yt", 7.75);
    if (value === "yt") ghost = "yt";
  } else if (f >= 230 && f < 332) {
    chip = "yt";
    chipBorn = 230;
    if (f >= 238.7) value = typed(f, 238.7, "lofi house mix", 4.375);
  } else if (f >= 345 && f < 400) {
    value = "g";
    if (f >= 349) list = ["gh", "m", "d"];
    // highlight follows the row under the cursor (rows centred at y 673 / 717 / 761)
    const cy = f >= 350 ? cursorAt(f).y : 0;
    sel = cy >= 739 + DY ? 2 : cy >= 695 + DY ? 1 : 0;
  } else if (f >= 400 && f < 440) {
    chip = "d";
    chipBorn = 400;
  }
  return { chip, value, ghost, list, sel, chipBorn };
}

const KEY_EVENTS: { at: number; label: string }[] = [
  { at: 222, label: "Tab" },
  { at: 300, label: "↵" },
  { at: 330, label: "Esc" },
];

const TIMES = [
  { at: 628, clock: "Tuesday 24 November  ·  08:12", greet: "Good morning, Sam" },
  { at: 664, clock: "Tuesday 24 November  ·  13:40", greet: "Good afternoon, Sam" },
  { at: 700, clock: "Tuesday 24 November  ·  19:05", greet: "Good evening, Sam" },
  { at: 736, clock: "Tuesday 24 November  ·  23:48", greet: "Working late, Sam?" },
];
const BASE_TIME = { clock: "Tuesday 24 November  ·  23:48", greet: "Working late, Sam?" };

// ───────────────────────── pieces ─────────────────────────

// Toolbar measured from Sam's real Firefox (1440px-wide window), drawn at that size and scaled to the frame
const FX = "#fbfbfe";
const FX_ICON = "rgba(251,251,254,0.86)";
const FX_DIM = "rgba(251,251,254,0.62)";
const FxStroke: React.FC<{ d: string; size?: number; color?: string; w?: number }> = ({ d, size = 16, color = FX_ICON, w = 1.5 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={w}
    strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", display: "block" }} aria-hidden>
    <path d={d} />
  </svg>
);
const at = (x: number, y: number, el: React.ReactNode, key?: string) => (
  <div key={key} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", display: "flex" }}>{el}</div>
);

const Toolbar: React.FC<{ f: number }> = ({ f }) => {
  const tabIn = ramp(f, 14, 34);
  return (
    <div style={{ height: CHROME_H, background: "#1c1b1a", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1440, height: 88, transform: `scale(${WIN_W / 1440})`, transformOrigin: "0 0", fontFamily: FONT }}>
        {/* tab */}
        <div style={{
          position: "absolute", left: 14, top: 8, width: 221, height: 28, borderRadius: 7, background: "#2b2a29",
          display: "flex", alignItems: "center", padding: "0 9px 0 16px", boxSizing: "border-box",
          opacity: tabIn, transform: `translateY(${(1 - tabIn) * 5}px)`,
        }}>
          <span style={{ fontSize: 12.5, color: FX, letterSpacing: "0.005em" }}>New Tab</span>
          <span style={{ marginLeft: "auto", display: "flex" }}><FxStroke d="M6.5 6.5l11 11M17.5 6.5l-11 11" size={14} color={FX} w={1.7} /></span>
        </div>
        {at(253, 22, <FxStroke d="M12 4.5v15M4.5 12h15" size={17} color={FX} w={1.6} />)}
        {/* list-all-tabs */}
        {at(1423, 22, <FxStroke d="M3.5 18.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3 M3.5 8.5h16 M15 19.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z M17.4 18.8l2.6 2.6" size={17} color={FX_ICON} w={1.5} />)}

        {/* back / forward */}
        {at(27, 62, <FxStroke d="M20 12H4.5M10.5 18l-6-6 6-6" size={17} color={FX_DIM} />)}
        {at(60, 62, <FxStroke d="M4 12h15.5M13.5 6l6 6-6 6" size={17} color={FX_DIM} />)}

        {/* address bar */}
        <div style={{
          position: "absolute", left: 84, top: 48, width: 1143, height: 28, borderRadius: 7, background: "#272625",
          display: "flex", alignItems: "center", padding: "0 0 0 8px", boxSizing: "border-box",
        }}>
          <span style={{ fontSize: 14, color: "rgba(251,251,254,0.72)", letterSpacing: "0.005em" }}>Search with Google or enter address</span>
        </div>
        {at(1213, 62, <FxStroke d="M12 3.5v11M8 7.5l4-4 4 4M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" size={16} color={FX_ICON} />)}

        {/* bookmark shortcuts (monochrome) */}
        {(["d", "gh", "m", "yt"] as IconKey[]).map((k, i) =>
          at([1248, 1271, 1295, 1318][i], 62, <Icon k={k} size={15} color={k === "gh" ? "rgba(251,251,254,0.78)" : "rgba(251,251,254,0.42)"} />, k))}

        {/* VPN */}
        <div style={{ position: "absolute", left: 1340, top: 53, height: 18, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={13} height={13} viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill={FX} /><path d="M8 8l8 8M16 8l-8 8" stroke="#1c1b1a" strokeWidth={3} strokeLinecap="round" /></svg>
          <span style={{ fontSize: 14.5, fontWeight: 500, color: FX, letterSpacing: "0.02em" }}>VPN</span>
        </div>
        {at(1412, 62, <FxStroke d="M4.5 7h15M4.5 12h15M4.5 17h15" size={17} color={FX} w={1.7} />)}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "rgba(0,0,0,0.35)" }} />
    </div>
  );
};

const Background: React.FC<{ f: number }> = ({ f }) => {
  const t = f / 30;
  const glowIn = ramp(f, 8, 60);
  const blob = (base: React.CSSProperties, dx: number, dy: number, s: number): React.CSSProperties => ({
    position: "absolute", borderRadius: "50%", ...base,
    transform: `translate(${dx}px, ${dy}px) scale(${s})`,
  });
  return (
    <AbsoluteFill style={{ background: BASE, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "blur(54px)", opacity: glowIn }}>
        <div style={blob({ width: WIN_W * 0.78, height: 1040, left: WIN_W * 0.08, top: -330, background: "#f76203" },
          Math.sin(t * 0.35) * 40, Math.cos(t * 0.3) * 24, 1 + Math.sin(t * 0.25) * 0.03)} />
        <div style={blob({ width: WIN_W * 0.42, height: 520, left: WIN_W * 0.42, top: -190, background: "#ff9a40", opacity: 0.9 },
          Math.sin(t * 0.5 + 1) * -70, Math.cos(t * 0.45) * 30, 1 + Math.sin(t * 0.4) * 0.06)} />
        <div style={blob({ width: WIN_W * 0.5, height: 480, left: WIN_W * 0.1, top: 330, background: "#e0400a", opacity: 0.75 },
          Math.sin(t * 0.4 + 2) * 60, Math.cos(t * 0.35 + 1) * -26, 1 + Math.cos(t * 0.3) * 0.05)} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 80% at 50% 40%, transparent 50%, rgba(29,27,25,0.6) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px", backgroundPosition: "center",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, #000 15%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 45%, #000 15%, transparent 100%)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.4 }} aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} stitchTiles="stitch" seed={Math.floor(f / 2) % 8} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={3} intercept={-1} />
            <feFuncG type="linear" slope={3} intercept={-1} />
            <feFuncB type="linear" slope={3} intercept={-1} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const KeyCap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", height: 22, padding: "0 7px", borderRadius: 5,
    background: "rgba(255,246,238,0.12)", color: MUTED_P, fontSize: 12,
  }}>{children}</span>
);

const SearchBar: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const s = searchState(f);
  const barIn = ramp(f, 52, 76);
  const focused = f >= 174 && f < 445;
  const chipPop = s.chip ? spring({ frame: f - s.chipBorn, fps, config: { damping: 14, stiffness: 220 } }) : 0;
  const caretOn = focused && Math.floor(f / 16) % 2 === 0;
  const listPop = s.list.length ? spring({ frame: f - 349, fps, config: { damping: 18, stiffness: 200 } }) : 0;
  const hint = s.ghost ? <><KeyCap>Space</KeyCap><KeyCap>Tab</KeyCap></>
    : s.list.length ? <><KeyCap>↑↓</KeyCap><KeyCap>Tab</KeyCap></>
    : s.chip && s.value ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>Search <KeyCap>↵</KeyCap></span>
    : null;
  const placeholder = s.chip ? `Search ${ENGINES[s.chip].name}` : "Search";

  return (
    <div style={{
      position: "absolute", left: (WIN_W - BAR_W) / 2, top: BAR_TOP, width: BAR_W,
      opacity: barIn, transform: `translateY(${(1 - barIn) * 10}px)`,
    }}>
      {/* focus halo */}
      <div style={{
        position: "absolute", inset: "-34px -70px", borderRadius: "50%", zIndex: -1,
        background: "radial-gradient(closest-side, rgba(255,255,255,0.10), transparent)",
        opacity: ramp(f, 174, 194) * (1 - ramp(f, 440, 460)),
      }} />
      <div style={{
        height: BAR_H, boxSizing: "border-box", padding: "0 12px 0 12px", borderRadius: 14,
        background: `rgba(29,27,25,${focused ? 0.55 : 0.45})`, backdropFilter: "blur(16px)",
        border: `1px solid rgba(255,255,255,${focused ? 0.18 : 0.08})`,
        display: "flex", alignItems: "center", gap: 8, fontFamily: FONT,
      }}>
        {s.chip && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7, height: 32, padding: "0 11px 0 10px", borderRadius: 8,
            background: "rgba(255,246,238,0.16)", color: WARM, fontSize: 16, flex: "none",
            transform: `scale(${0.85 + chipPop * 0.15})`, opacity: chipPop,
          }}>
            <Icon k={s.chip} size={15} />{ENGINES[s.chip].name}
          </span>
        )}
        <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: 17, color: WARM, paddingLeft: s.chip ? 2 : 9, whiteSpace: "pre" }}>
          {s.value ? <span>{s.value}</span> : null}
          <span style={{ width: 1.5, height: 21, background: WARM, marginLeft: 1, opacity: caretOn ? 1 : 0 }} />
          {!s.value && <span style={{ color: MUTED_P, marginLeft: -2.5 }}>{placeholder}</span>}
          {s.ghost && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED_P, marginLeft: 8, opacity: ramp(f, 205, 212) }}>
              → <Icon k={s.ghost} size={14} color={MUTED_P} /> {ENGINES[s.ghost].name}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, color: MUTED_P }}>{hint}</div>
      </div>

      {s.list.length > 0 && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: BAR_H + 8, padding: 6, borderRadius: 14,
          background: "rgba(29,27,25,0.78)", backdropFilter: "blur(16px)",
          display: "flex", flexDirection: "column", gap: 2, fontFamily: FONT,
          opacity: listPop, transform: `translateY(${(1 - listPop) * -6}px)`,
        }}>
          {s.list.map((k, i) => (
            <div key={k} style={{
              height: 42, padding: "0 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10,
              background: i === s.sel ? "rgba(255,246,238,0.12)" : "transparent", fontSize: 15, color: WARM,
            }}>
              <span style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,246,238,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon k={k} size={15} />
              </span>
              {ENGINES[k].name}
              <span style={{ color: MUTED_P, fontSize: 13 }}>{ENGINES[k].sub}</span>
              <span style={{ marginLeft: "auto" }}><KeyCap>{k}</KeyCap></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Greeting: React.FC<{ f: number }> = ({ f }) => {
  // pick current + previous time-of-day for crossfade
  let cur = BASE_TIME, prev: typeof BASE_TIME | null = null, born = 0;
  TIMES.forEach((tm, i) => {
    if (f >= tm.at) { cur = tm; prev = i === 0 ? BASE_TIME : TIMES[i - 1]; born = tm.at; }
  });
  const x = prev ? ramp(f, born, born + 12) : 1;
  const intro = ramp(f, 30, 60);
  const greetIntro = ramp(f, 38, 78);
  const line = (t: typeof BASE_TIME, o: number, blur: number, dy: number, key: string) => (
    <div key={key} style={{ position: "absolute", left: 0, right: 0, textAlign: "center", opacity: o }}>
      <div style={{ fontSize: 16, color: MUTED_P, letterSpacing: "0.01em", marginBottom: 14, opacity: intro, whiteSpace: "pre" }}>{t.clock}</div>
      <div style={{
        fontSize: 54, fontWeight: 400, letterSpacing: "-0.025em", color: WARM,
        opacity: greetIntro, filter: `blur(${(1 - greetIntro) * 8 + blur}px)`, transform: `translateY(${(1 - greetIntro) * 8 + dy}px)`,
      }}>{t.greet}</div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, fontFamily: FONT }}>
      {prev && x < 1 && line(prev, 1 - x, x * 6, -x * 8, "prev")}
      {line(cur, x, (1 - x) * 6, (1 - x) * 8, "cur")}
    </div>
  );
};

const Links: React.FC<{ f: number }> = ({ f }) => {
  const s = searchState(f);
  const hide = s.list.length ? 0 : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: BAR_TOP + BAR_H + 38, display: "flex", justifyContent: "center", gap: 32, fontFamily: FONT, opacity: hide }}>
      {["Drive", "GitHub", "Gmail", "YouTube"].map((l, i) => {
        const o = ramp(f, 66 + i * 4, 90 + i * 4);
        const [hs, he] = LINK_HOVER[i];
        const h = ramp(f, hs, hs + 9) * (1 - ramp(f, he, he + 8));
        const c = Math.round(255 - (255 - 246) * h);
        return (
          <span key={l} style={{ position: "relative", fontSize: 15, opacity: o, transform: `translateY(${(1 - o) * 8}px)`,
            color: `rgba(255,${c},${Math.round(238 + (234 - 238) * h)},${0.78 + 0.22 * h})` }}>
            {l}
            <span style={{ position: "absolute", left: 0, right: 0, bottom: -5, height: 1, background: "currentColor",
              transform: `scaleX(${h})`, transformOrigin: "left" }} />
          </span>
        );
      })}
    </div>
  );
};

const KeyOverlay: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const ev = [...KEY_EVENTS].reverse().find((e) => f >= e.at && f < e.at + 22);
  if (!ev) return null;
  const p = spring({ frame: f - ev.at, fps, config: { damping: 12, stiffness: 260 } });
  const out = ramp(f, ev.at + 14, ev.at + 22);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center" }}>
      <div style={{
        minWidth: 76, height: 64, padding: "0 22px", boxSizing: "border-box", borderRadius: 14,
        background: "rgba(29,27,25,0.82)", border: "1px solid rgba(255,255,255,0.1)", borderBottomWidth: 3,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT, fontSize: 26, fontWeight: 500, color: WARM,
        opacity: p * (1 - out), transform: `translateY(${(1 - p) * 12}px) scale(${0.9 + p * 0.1})`,
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.7)",
      }}>{ev.label}</div>
    </div>
  );
};

// ── cursor ──
// link hover windows [start, end] for Drive, GitHub, Gmail, YouTube (aligned to cursor arrivals)
const LINK_HOVER: [number, number][] = [[479, 499], [504, 523], [528, 549], [556, 579]];

type Move = { a: number; b: number; x: number; y: number; bend?: number };
const START = { x: 1540, y: 1010 };
// each move: travel from the previous resting point to (x, y) between frames a → b
const MOVES: Move[] = [
  { a: 92, b: 164, x: 1010, y: 612, bend: 1 },     // in, to the search bar
  { a: 172, b: 190, x: 1180, y: 660, bend: -1 },   // drifts aside (hidden while typing)
  { a: 350, b: 364, x: 905, y: 718, bend: 1 },     // over Gmail
  { a: 370, b: 384, x: 890, y: 762, bend: -1 },    // over Drive, click at 396
  { a: 410, b: 440, x: 1040, y: 700, bend: 1 },    // out of the way while the camera pulls back
  { a: 466, b: 482, x: 836, y: 692, bend: -1 },    // Drive link
  { a: 496, b: 508, x: 912, y: 692, bend: 1 },     // GitHub
  { a: 520, b: 532, x: 988, y: 692, bend: -1 },    // Gmail
  { a: 546, b: 560, x: 1072, y: 692, bend: 1 },    // YouTube
  { a: 584, b: 612, x: 1330, y: 930, bend: -1 },   // away, before the greeting section
].map((m) => ({ ...m, y: m.y + DY }));
const CLICKS = [168, 396];
const inOut = Easing.bezier(0.45, 0, 0.25, 1);

function cursorAt(f: number) {
  let px = START.x, py = START.y;
  for (const m of MOVES) {
    if (f < m.a) break;
    const dx = m.x - px, dy = m.y - py;
    const dist = Math.hypot(dx, dy) || 1;
    if (f <= m.b) {
      // quadratic bezier arc, control point offset 15% of the distance, perpendicular to travel
      const t = inOut((f - m.a) / (m.b - m.a));
      const cx = (px + m.x) / 2 + (-dy / dist) * dist * 0.15 * (m.bend ?? 1);
      const cy = (py + m.y) / 2 + (dx / dist) * dist * 0.15 * (m.bend ?? 1);
      const u = 1 - t;
      return { x: u * u * px + 2 * u * t * cx + t * t * m.x, y: u * u * py + 2 * u * t * cy + t * t * m.y };
    }
    // landed: a tiny overshoot that settles, like a real hand
    const since = f - m.b;
    const amp = Math.min(5, dist * 0.02) * Math.exp(-since / 4) * Math.sin(since / 2.2);
    px = m.x; py = m.y;
    if (since < 14) { px += (dx / dist) * amp; py += (dy / dist) * amp; }
  }
  // never fully still: a slow, tiny drift while resting
  return { x: px + Math.sin(f * 0.07) * 1.2, y: py + Math.cos(f * 0.055) * 1 };
}

function cursorShape(f: number): "arrow" | "ibeam" | "hand" {
  if (f >= 150 && f < 180) return "ibeam";
  if ((f >= 358 && f < 404) || (f >= 476 && f < 584)) return "hand";
  return "arrow";
}

const Cursor: React.FC<{ f: number }> = ({ f }) => {
  const vis = ramp(f, 92, 102) * (1 - ramp(f, 184, 190)) + ramp(f, 350, 358) * (1 - ramp(f, 598, 612));
  if (vis <= 0.001) return null;
  const { x, y } = cursorAt(f);
  const click = CLICKS.find((c) => f >= c && f < c + 16);
  // 8-frame press: 1 → 0.96 → 1
  const pt = click !== undefined ? (f - click) / 8 : 1;
  const s = pt < 1 ? 1 - 0.04 * Math.sin(Math.PI * pt) : 1;
  const rp = click !== undefined ? (f - click) / 16 : 0;
  const shape = cursorShape(f);
  const shadow = "drop-shadow(0 3px 5px rgba(0,0,0,0.35))";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `translate(${x}px, ${y}px)`, opacity: vis, pointerEvents: "none" }}>
      {click !== undefined && (
        <div style={{
          position: "absolute", left: -22 * rp, top: -22 * rp, width: 44 * rp, height: 44 * rp, borderRadius: "50%",
          border: "1.5px solid rgba(255,246,238,0.8)", opacity: 0.55 * (1 - rp),
        }} />
      )}
      <div style={{ transform: `scale(${s})`, transformOrigin: "0 0" }}>
        {shape === "arrow" && (
          <svg width={26} height={34} viewBox="0 0 18 24" style={{ filter: shadow, overflow: "visible" }} aria-hidden>
            <path d="M1 1 L1 18.5 L5.4 14.4 L8.6 21.6 L11.4 20.4 L8.3 13.3 L14.4 13.3 Z" fill="#fff" stroke="#111" strokeWidth={1.2} strokeLinejoin="round" />
          </svg>
        )}
        {shape === "hand" && (
          // hotspot at the fingertip
          <svg width={28} height={32} viewBox="0 0 20 24" style={{ filter: shadow, overflow: "visible", transform: "translate(-10px, -2px)" }} aria-hidden>
            <path d="M7 1.5c-.9 0-1.6.7-1.6 1.6V12l-1.3-1.3c-.7-.7-1.8-.7-2.4 0-.6.6-.6 1.5-.1 2.2l3.9 5.4C6.6 20.6 8.4 22.5 11 22.5h2.4c3 0 5.1-2.4 5.1-5.4v-4.6c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v-.6c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6v-.4c0-.9-.7-1.6-1.6-1.6s-1.6.7-1.6 1.6V3.1C8.6 2.2 7.9 1.5 7 1.5z"
              fill="#fff" stroke="#111" strokeWidth={1.1} strokeLinejoin="round" />
          </svg>
        )}
        {shape === "ibeam" && (
          // hotspot at the centre
          <svg width={14} height={30} viewBox="0 0 14 30" style={{ filter: shadow, overflow: "visible", transform: "translate(-7px, -15px)" }} aria-hidden>
            <path d="M3 2h2.6c.8 0 1.4.5 1.4.5s.6-.5 1.4-.5H11 M7 2.6v24.8 M3 28h2.6c.8 0 1.4-.5 1.4-.5s.6.5 1.4.5H11"
              fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" />
            <path d="M3 2h2.6c.8 0 1.4.5 1.4.5s.6-.5 1.4-.5H11 M7 2.6v24.8 M3 28h2.6c.8 0 1.4-.5 1.4-.5s.6.5 1.4.5H11"
              fill="none" stroke="#111" strokeWidth={1.4} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

// ───────────────────────── film ─────────────────────────

export const NewTabFilm: React.FC = () => {
  const out = useCurrentFrame();
  const f = warp(out);
  const { fps } = useVideoConfig();

  // window arrival
  const arrive = spring({ frame: f - 4, fps, config: { damping: 20, stiffness: 90 } });
  // camera push-in and pull-back on the search bar
  const zoom = 1 + 0.75 * ramp(f, 150, 192, 0, 1, Easing.bezier(0.65, 0, 0.35, 1)) * (1 - ramp(f, 432, 472, 0, 1, Easing.bezier(0.65, 0, 0.35, 1)));
  const zoomP = (zoom - 1) / 0.75;
  // slow micro-push while the greeting cycles through the day
  const push = 1 + 0.045 * ramp(f, 612, 790, 0, 1, Easing.bezier(0.45, 0, 0.55, 1));
  // end: window recedes
  const leave = ramp(f, 780, 817, 0, 1, Easing.bezier(0.65, 0, 0.35, 1));
  const endText = ramp(f, 804, 832);
  const fadeOut = ramp(f, 852, 870);

  return (
    <AbsoluteFill style={{ background: "#121110" }}>
      {/* soft spill of light behind the window */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 50% 45% at 50% 45%, rgba(247,98,3,0.16), transparent 70%)",
        opacity: ramp(f, 20, 80) * (1 - leave),
      }} />

      <AbsoluteFill style={{
        transformOrigin: `${BAR_CX}px ${BAR_CY}px`,
        transform: `translateY(${-(BAR_CY - 540) * zoomP}px) scale(${zoom * push})`,
      }}>
        <div style={{
          position: "absolute", left: WIN_X, top: WIN_Y, width: WIN_W, height: WIN_H, borderRadius: 14, overflow: "hidden",
          boxShadow: "0 50px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
          opacity: arrive * (1 - leave),
          transform: `translateY(${(1 - arrive) * 60 + leave * -20}px) scale(${0.94 + arrive * 0.06 - leave * 0.06})`,
        }}>
          <Toolbar f={f} />
          <div style={{ position: "relative", height: WIN_H - CHROME_H }}>
            <Background f={f} />
            <Greeting f={f} />
            <SearchBar f={f} fps={fps} />
            <Links f={f} />
          </div>
        </div>
        <Cursor f={f} />
      </AbsoluteFill>

      <KeyOverlay f={f} fps={fps} />

      {/* end card */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: FONT, opacity: endText }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - endText) * 14}px)` }}>
          <div style={{ fontSize: 64, letterSpacing: "-0.03em", color: WARM }}>A calmer new tab.</div>
          <div style={{ fontSize: 20, color: "rgba(236,232,227,0.55)", marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <span>HTML</span><span style={{ width: 4, height: 4, borderRadius: 2, background: "#f76203" }} />
            <span>CSS</span><span style={{ width: 4, height: 4, borderRadius: 2, background: "#f76203" }} />
            <span>a little JS</span><span style={{ width: 4, height: 4, borderRadius: 2, background: "#f76203" }} />
            <span>Firefox</span>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />
    </AbsoluteFill>
  );
};
