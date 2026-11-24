/* newtab builder — setup modal, live editor, download. No dependencies, works from file:// too. */
(() => {
"use strict";

const T = window.NEWTAB_TEMPLATES || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const OUT = "cubic-bezier(.16,1,.3,1)", IO = "cubic-bezier(.7,0,.2,1)", SPRING = "cubic-bezier(.34,1.45,.64,1)", IN = "cubic-bezier(.4,0,1,1)";
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const anim = (el, kf, o) => still || !el ? { finished: Promise.resolve(), cancel() {} } : el.animate(kf, o);
const hostOf = u => { try { return new URL(u.replace("%s", "x")).hostname.replace(/^www\./, ""); } catch { return u; } };
const originOf = u => { try { return new URL(u.replace("%s", "x")).origin; } catch { return u; } };

/* ── data ── */
const ICONS = {
  gh: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  yt: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  m: "M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z",
  d: "M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z",
  w: "M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.023-.313-.05-.313-.149v-.468l.06-.045h4.292l.113.037v.451c0 .105-.076.15-.227.15l-.308.047c-.792.061-.661.381-.136 1.422l1.582 3.252 1.758-3.504c.293-.64.233-.801.111-.947-.07-.084-.305-.22-.812-.24l-.201-.021c-.052 0-.098-.015-.145-.051-.045-.031-.067-.076-.067-.129v-.427l.061-.045c1.247-.008 4.043 0 4.043 0l.059.045v.436c0 .121-.059.178-.193.178-.646.03-.782.095-1.023.439-.12.186-.375.589-.646 1.039l-2.301 4.273-.065.135 2.792 5.712.17.048 4.396-10.438c.154-.422.129-.722-.064-.895-.197-.172-.346-.273-.857-.295l-.42-.016c-.061 0-.105-.014-.152-.045-.043-.029-.072-.075-.072-.119v-.436l.059-.045h4.961l.041.045v.437c0 .119-.074.18-.209.18-.648.03-1.127.18-1.443.421-.314.255-.557.616-.736 1.067 0 0-4.043 9.258-5.426 12.339-.525 1.007-1.053.917-1.503-.031-.571-1.171-1.773-3.786-2.646-5.71l.053-.036z",
  map: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  cal: "M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zM5 9h14v10H5V9z"
};
const PRESETS = [
  { id: "ember", name: "Ember", c: ["#f76203", "#ff9a40", "#e0400a"] },
  { id: "dusk",  name: "Dusk",  c: ["#263f8c", "#4e6cb8", "#1a2768"] },
  { id: "moss",  name: "Moss",  c: ["#3e7a3a", "#9cc75e", "#1f4d2a"] },
  { id: "rose",  name: "Rose",  c: ["#c2356b", "#f08aa8", "#7a1f4a"] },
  { id: "slate", name: "Slate", c: ["#55606e", "#8e9aab", "#323a45"] }
];
const SHORTCUTS = [
  { key: "gh", name: "GitHub", sub: "Search repos and code", home: "https://github.com", search: "https://github.com/search?q=%s", icon: "gh" },
  { key: "yt", name: "YouTube", sub: "Search videos", home: "https://www.youtube.com", search: "https://www.youtube.com/results?search_query=%s", icon: "yt" },
  { key: "m", name: "Gmail", sub: "Search your inbox", home: "https://mail.google.com", search: "https://mail.google.com/mail/u/0/#search/%s", icon: "m" },
  { key: "d", name: "Drive", sub: "Search Google Drive", home: "https://drive.google.com", search: "https://drive.google.com/drive/search?q=%s", icon: "d", alias: "google drive" },
  { key: "w", name: "Wikipedia", sub: "Search articles", home: "https://en.wikipedia.org", search: "https://en.wikipedia.org/w/index.php?search=%s", icon: "w" },
  { key: "ma", name: "Maps", sub: "Search Google Maps", home: "https://www.google.com/maps", search: "https://www.google.com/maps/search/%s", icon: "map" }
];
const LINKS = [
  { name: "Gmail", url: "https://mail.google.com", icon: "m" },
  { name: "Drive", url: "https://drive.google.com", icon: "d" },
  { name: "Calendar", url: "https://calendar.google.com", icon: "cal" },
  { name: "GitHub", url: "https://github.com", icon: "gh" },
  { name: "YouTube", url: "https://www.youtube.com", icon: "yt" },
  { name: "Wikipedia", url: "https://en.wikipedia.org", icon: "w" }
];
const SVG = {
  x: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  plus: '<svg class="plus" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5v7M1.5 5h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};
const iconHTML = (icon, name, cls = "") =>
  ICONS[icon] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[icon]}"/></svg>`
  : /^data:image\/(png|jpeg|gif|webp);/.test(icon || "") ? `<img src="${esc(icon)}" alt="">`
  : `<span class="letter" aria-hidden="true">${esc((name || "?").trim().charAt(0) || "?")}</span>`;

/* ── state: everything you choose, kept in this browser only ── */
const STORE = "newtab-builder";
const fresh = () => ({
  v: 1, name: "", grain: .4, shortcuts: [], links: [], toolbar: true, focus: true, done: false,
  glow: { normal: [...PRESETS[0].c], private: [...PRESETS[1].c] },
  preset: { normal: "ember", private: "dusk" },
  os: /Win/i.test(navigator.userAgent) ? "win" : "mac"
});
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.v === 1) return { ...fresh(), ...s }; } catch {}
  return null;
}
let saveTimer;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch {} }, 150); }
const S = load() || fresh();
const ui = { step: 0, win: "normal", tab: "keys", open: "glow", preview: "normal", busy: false, setup: false, editor: false };
const views = [];
const commit = (o = {}) => { save(); views.forEach(v => v(o)); };

/* ── colour helpers ── */
const hex3 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const swatch = c => `radial-gradient(circle at 70% 25%, ${c[1]}, ${c[0]} 55%, ${c[2]})`;
const paintRoot = c => ["--c1", "--c2", "--c3"].forEach((k, i) => document.documentElement.style.setProperty(k, c[i]));

/* ── the glow: the page's own shader, drawn into the cards ── */
const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FS = `precision highp float;
uniform vec2 uRes,uP;uniform float uT,uE,uK,uF;uniform vec3 uA,uB,uC,uBase;
float h(vec2 p){p=fract(p*vec2(127.1,311.7));p+=dot(p,p+34.5);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+7.3;a*=.5;}return v/.875;}
float blob(vec2 q,vec2 c,vec2 r,float a){q-=c;float s=sin(a),k=cos(a);q=mat2(k,-s,s,k)*q;return smoothstep(1.14,.42,length(q/r));}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y,t=uT;vec2 q=vec2(uv.x*asp,1.-uv.y);
  vec2 w=vec2(fbm(q*1.35+vec2(0.,t*.075)),fbm(q*1.35+vec2(5.2,1.3-t*.06)));
  vec2 w2=vec2(fbm(q*1.1+w*1.7+vec2(1.7-t*.05,9.2)),fbm(q*1.1+w*1.7+vec2(8.3,2.8+t*.045)));
  vec2 f=q+(w2-.5)*(.22+.07*uK);
  float s=mix(.76,1.,uE)*(1.+.018*sin(t*.42)+.03*uF+.035*uK);
  float a=blob(f,vec2(.47*asp+.035*sin(t*.19)+uP.x*.035,.22+.025*cos(t*.16)+uP.y*.024),vec2(.41*asp,.64)*s,-.14+.05*sin(t*.11));
  float b=blob(f,vec2(.63*asp+.06*cos(t*.23)+uP.x*.06,.1+.04*sin(t*.2)+uP.y*.04),vec2(.23*asp,.36)*s,.2*sin(t*.09));
  float c=blob(f,vec2(.35*asp+.05*sin(t*.17+1.4)-uP.x*.028,.655+.035*cos(t*.14)-uP.y*.02),vec2(.28*asp,.33)*s,.25*cos(t*.1));
  float flow=fbm(f*2.1+w2*1.4+vec2(t*.04,-t*.03));
  vec3 col=mix(uBase,uA,a);
  col=mix(col,uB,b*(.62+.12*sin(t*.31)+.12*uK));
  col=mix(col,uC,c*.75);
  col=mix(col,uB,a*smoothstep(.5,.82,flow)*.2);
  col=mix(col,uC,a*smoothstep(.5,.24,flow)*.24);
  col=mix(uBase,col,smoothstep(0.,1.,uE));
  col+=(h(gl_FragCoord.xy+fract(t))-.5)*1.5/255.;
  gl_FragColor=vec4(col,1.);
}`;
const BASE = hex3("#1d1b19");
const pointer = { x: 0, y: 0 };
addEventListener("pointermove", e => { pointer.x = (e.clientX / innerWidth - .5) * 2; pointer.y = (e.clientY / innerHeight - .5) * 2; }, { passive: true });

class Glow {
  constructor(card) {
    this.card = card; this.canvas = $("canvas", card);
    this.cur = null; this.tgt = null; this.energy = still ? 1 : 0; this.pulse = 0;
    this.time = Math.random() * 120; this.p = { x: 0, y: 0 }; this.alive = true; this.last = performance.now();
    const gl = this.canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(pr, 0, "p"); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.gl = gl;
    this.u = Object.fromEntries(["uRes", "uP", "uT", "uE", "uK", "uF", "uA", "uB", "uC", "uBase"].map(k => [k, gl.getUniformLocation(pr, k)]));
    new ResizeObserver(() => this.size()).observe(this.canvas);
    this.size();
    const loop = now => { if (!this.alive) return; this.frame(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  size() {
    if (!this.gl) return;
    const r = this.canvas.getBoundingClientRect(); if (!r.width) return;
    const w = Math.max(2, Math.min(960, Math.round(r.width * .7))), h = Math.max(2, Math.round(w * r.height / r.width));
    if (w !== this.canvas.width || h !== this.canvas.height) { this.canvas.width = w; this.canvas.height = h; }
    this.gl.viewport(0, 0, w, h);
    this.draw();                       // resizing clears the canvas, so paint straight away
  }
  set(colors, instant) {
    const t = colors.map(hex3);
    if (!this.cur || instant) this.cur = t.map(c => [...c]);
    this.tgt = t;
  }
  kick(a = .7) { this.pulse = Math.min(this.pulse + a, 1.2); }
  frame(now) {
    const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
    if (!this.cur || document.hidden || !this.card.getClientRects().length) return;
    const e = r => 1 - Math.exp(-dt * r);
    if (!still) this.time += dt * (1 + this.pulse * .9);
    this.energy += (1 - this.energy) * e(2.2);
    this.pulse *= Math.exp(-dt * 2);
    this.p.x += (pointer.x - this.p.x) * e(1.8); this.p.y += (pointer.y - this.p.y) * e(1.8);
    this.cur.forEach((c, i) => c.forEach((v, j) => c[j] = v + (this.tgt[i][j] - v) * e(4.5)));
    this.draw();
  }
  draw() {
    const gl = this.gl, u = this.u;
    if (!gl || !this.cur) return;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uP, this.p.x, this.p.y);
    gl.uniform1f(u.uT, this.time); gl.uniform1f(u.uE, this.energy); gl.uniform1f(u.uK, this.pulse); gl.uniform1f(u.uF, 0);
    gl.uniform3fv(u.uA, this.cur[0]); gl.uniform3fv(u.uB, this.cur[1]); gl.uniform3fv(u.uC, this.cur[2]); gl.uniform3fv(u.uBase, BASE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!this.card.classList.contains("gl")) this.card.classList.add("gl");
  }
}

/* ── greeting ── */
function dayPart(priv) {
  if (priv) return ["Being sneaky", "?"];
  const d = new Date(), h = d.getHours(), weekend = d.getDay() === 0 || d.getDay() === 6;
  if (h >= 5 && h < 12) return [weekend ? "Slow morning" : "Good morning", ""];
  if (h >= 12 && h < 17) return ["Good afternoon", ""];
  if (h >= 17 && h < 22) return ["Good evening", ""];
  if (h >= 22 || h < 2) return ["Working late", "?"];
  return ["Still up", "?"];
}
class Greeter {
  constructor(el) { this.el = el; this.key = null; }
  show([base, end], name, dots) {
    if (base + end !== this.key) {
      this.key = base + end;
      this.el.innerHTML = base.split(" ").map((w, n) => `<span class="w"><span style="--n:${n}">${esc(w)}</span></span>`).join(" ")
        + '<span class="gname"></span><span class="gend"></span><span class="dots" hidden aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>';
    }
    $(".gname", this.el).textContent = name ? ", " + name : dots ? "," : "";
    $(".gend", this.el).textContent = name || !dots ? end : "";
    $(".dots", this.el).hidden = !dots;
  }
}

/* ── small parts ── */
function seg(el, get, set) {
  const ind = $(".ind", el), btns = $$("button", el);
  const attr = btns[0].getAttribute("role") === "radio" ? "aria-checked" : "aria-selected";
  const place = () => {
    const v = get();
    btns.forEach(b => { b.setAttribute(attr, b.dataset.v === v); b.tabIndex = b.dataset.v === v ? 0 : -1; });
    const b = btns.find(b => b.dataset.v === v);
    if (!b || !b.offsetWidth) return;
    ind.style.width = b.offsetWidth + "px";
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
  };
  btns.forEach(b => b.addEventListener("click", () => { if (get() !== b.dataset.v) set(b.dataset.v); }));
  el.addEventListener("keydown", e => {
    if (!/^Arrow(Left|Right)$/.test(e.key)) return;
    e.preventDefault();
    const i = btns.findIndex(b => b.dataset.v === get()), n = btns[(i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length];
    set(n.dataset.v); n.focus();
  });
  new ResizeObserver(() => { el.classList.add("no-anim"); place(); requestAnimationFrame(() => el.classList.remove("no-anim")); }).observe(el);
  views.push(place); place();
}

function words(h) {
  if (h.dataset.split) return;
  h.dataset.split = 1;
  h.innerHTML = h.textContent.split(" ").map(w => `<span class="w"><span>${esc(w)}</span></span>`).join(" ");
}
function reveal(step, dir = 1, delay = 0) {
  const h = $("h2", step); words(h);
  $$(".w > span", h).forEach((s, i) => anim(s, [{ transform: "translateY(110%)" }, { transform: "none" }], { duration: 950, delay: delay + i * 55, easing: OUT, fill: "backwards" }));
  [...step.children].filter(c => c !== h).forEach((c, i) => anim(c,
    [{ opacity: 0, transform: `translateY(${14 * dir}px)`, filter: "blur(5px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
    { duration: 900, delay: delay + 90 + i * 70, easing: OUT, fill: "backwards" }));
}

let toastTimer;
function toast(msg) {
  $("#toastText").textContent = msg;
  $("#toast").classList.add("on");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $("#toast").classList.remove("on"), 2800);
}

async function copy(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = Object.assign(document.createElement("textarea"), { value: text }); document.body.append(t); t.select();
    try { document.execCommand("copy"); } catch {} t.remove();
  }
  if (btn) { btn.classList.add("done"); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove("done"), 1800); }
}

async function loadImage(file) {
  const url = URL.createObjectURL(file), img = new Image();
  img.src = url;
  try { await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

async function iconFrom(file) {
  const img = await loadImage(file), c = document.createElement("canvas"); c.width = c.height = 64;
  const w = img.naturalWidth || 64, h = img.naturalHeight || 64, r = Math.min(64 / w, 64 / h);
  c.getContext("2d").drawImage(img, (64 - w * r) / 2, (64 - h * r) / 2, w * r, h * r);
  return c.toDataURL("image/png");
}

/* ── presets: five glows, with a ring that slides to the choice ── */
function presets(root, getWin, onPick) {
  root.innerHTML = PRESETS.map(p =>
    `<button type="button" class="preset" role="radio" data-id="${p.id}" style="--a:${p.c[0]};--b:${p.c[1]};--c:${p.c[2]}"><span class="sw"></span><span>${p.name}</span></button>`).join("")
    + `<span class="ring" aria-hidden="true"></span>`;
  const ring = $(".ring", root);
  root.addEventListener("click", e => {
    const b = e.target.closest(".preset"); if (!b) return;
    const win = getWin(), p = PRESETS.find(p => p.id === b.dataset.id);
    S.glow[win] = [...p.c]; S.preset[win] = p.id;
    onPick(); commit();
  });
  const place = () => {
    const id = S.preset[getWin()];
    $$(".preset", root).forEach(b => b.setAttribute("aria-checked", b.dataset.id === id));
    const b = $(`.preset[data-id="${id}"]`, root), s = b && $(".sw", b);
    if (!s || !s.offsetWidth) return ring.classList.remove("on");
    ring.style.width = s.offsetWidth + 6 + "px"; ring.style.height = s.offsetHeight + 6 + "px";
    ring.style.transform = `translate(${b.offsetLeft + s.offsetLeft - 3}px, ${b.offsetTop + s.offsetTop - 3}px)`;
    ring.classList.add("on");
  };
  new ResizeObserver(() => { const t = ring.style.transition; ring.style.transition = "none"; place(); requestAnimationFrame(() => ring.style.transition = t); }).observe(root);
  views.push(place); place();
}

/* ── switches ── */
function toggles(root) {
  const items = [
    ["toolbar", "Restyle the toolbar to match", "Warm charcoal tabs and address bar", "Firefox keeps its usual toolbar"],
    ["focus", "Start typing straight away", "New tabs put the cursor in your search bar", "New tabs start in the address bar"]
  ];
  root.innerHTML = `<div class="toggles">${items.map(([k, t]) =>
    `<button type="button" class="tg" role="switch" data-k="${k}"><span class="t">${t}<small></small></span><span class="knob" aria-hidden="true"></span></button>`).join("")}</div>`;
  root.addEventListener("click", e => { const b = e.target.closest(".tg"); if (!b) return; S[b.dataset.k] = !S[b.dataset.k]; commit(); });
  views.push(() => $$(".tg", root).forEach((b, i) => {
    const on = !!S[b.dataset.k], small = $("small", b), text = items[i][on ? 2 : 3];
    b.setAttribute("aria-checked", on);
    if (small.textContent !== text) {
      const first = !small.textContent; small.textContent = text;
      if (!first) anim(small, [{ opacity: 0, transform: "translateY(3px)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: OUT });
    }
  }));
}

/* ── shortcuts and links: one set of chips you switch on and off, plus your own ── */
function sites(root, getKind) {
  root.innerHTML = `
    <div class="collapse open chips-wrap"><div><div class="chips" role="group"></div></div></div>
    <div class="collapse custom"><div>
      <form class="custom-in" novalidate>
        <div class="row">
          <button type="button" class="icon-pick k" aria-label="Icon, optional: pick a square PNG"><span class="ico"></span></button>
          <input class="input sm" name="name" maxlength="24" autocomplete="off" aria-label="Name" placeholder="Name">
          <input class="input sm k key" name="key" maxlength="4" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Shortcut letters" placeholder="Shortcut">
        </div>
        <div class="row wrap">
          <input class="input sm url" name="url" autocomplete="off" autocapitalize="off" spellcheck="false">
          <span class="acts"><button type="button" class="btn quiet" data-cancel>Cancel</button><button type="submit" class="btn raised quiet">Add</button></span>
        </div>
        <p class="err" role="alert" hidden></p>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>
      </form>
    </div></div>`;
  const chipsWrap = $(".chips-wrap", root), chips = $(".chips", root), custom = $(".custom", root);
  const form = $("form", root), err = $(".err", root), file = $("input[type=file]", root);
  let open = false, icon = null, lastKind = null;
  const keysOf = () => getKind() === "keys";
  const same = (a, b, keys) => keys ? a.key === b.key && a.search === b.search : a.url === b.url;

  const setOpen = v => {
    open = v;
    custom.classList.toggle("open", v); custom.inert = !v;
    chipsWrap.classList.toggle("open", !v); chipsWrap.inert = v;
    if (v) setTimeout(() => form.elements.name.focus({ preventScroll: true }), 80);
    else { form.reset(); icon = null; err.hidden = true; paintIcon(); $$(".bad", form).forEach(i => i.classList.remove("bad")); }
  };
  const paintIcon = () => {
    $(".icon-pick .ico", form).innerHTML = icon ? iconHTML(icon, "") : iconHTML(null, form.elements.name.value || "+");
    $(".icon-pick", form).title = icon ? "Change the icon" : "Add an icon (optional PNG)";
  };
  const bad = (input, msg) => {
    err.textContent = msg; err.hidden = false;
    input.classList.remove("bad"); void input.offsetWidth; input.classList.add("bad"); input.focus();
  };
  form.elements.name.addEventListener("input", paintIcon);
  form.addEventListener("input", e => e.target.classList.remove("bad"));
  $(".icon-pick", form).addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    const f = file.files[0]; file.value = ""; if (!f) return;
    try { icon = await iconFrom(f); paintIcon(); } catch { toast("Couldn't read that image"); }
  });
  $("[data-cancel]", form).addEventListener("click", () => { setOpen(false); setTimeout(() => $(".own", chips)?.focus({ preventScroll: true }), 80); });
  form.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); $("[data-cancel]", form).click(); } });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const f = form.elements, name = f.name.value.trim();
    let url = f.url.value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    if (keysOf()) {
      const key = f.key.value.trim().toLowerCase();
      if (!name) return bad(f.name, "Give it a name");
      if (!/^[a-z0-9]{1,4}$/.test(key)) return bad(f.key, "Use 1 to 4 letters or numbers");
      if (S.shortcuts.some(s => s.key === key)) return bad(f.key, `“${key}” is already a shortcut`);
      if (!url) return bad(f.url, "Add the search address");
      if (!url.includes("%s")) return bad(f.url, "Put %s where your search words go");
      try { new URL(url.replace("%s", "x")); } catch { return bad(f.url, "That address doesn't look right"); }
      const s = { key, name, sub: "Search " + name, home: originOf(url), search: url };
      if (icon) s.icon = icon;
      S.shortcuts.push(s);
    } else {
      if (!url) return bad(f.url, "Add the address");
      try { new URL(url); } catch { return bad(f.url, "That address doesn't look right"); }
      if (S.links.some(l => l.url === url)) return bad(f.url, "That link is already there");
      S.links.push({ name: name || hostOf(url), url });
    }
    setOpen(false); commit();
  });

  const toggle = (it, keys) => {
    const list = keys ? S.shortcuts : S.links, i = list.findIndex(x => same(x, it, keys));
    if (i >= 0) list.splice(i, 1);
    else if (keys && list.some(s => s.key === it.key)) return toast(`“${it.key}” is already one of your shortcuts`);
    else list.push({ ...it });
    commit();
  };
  const chip = (e, keys) => {
    const el = document.createElement("button");
    el.type = "button"; el.className = "chip"; el.dataset.key = e.id;
    el.innerHTML = `<span class="cic">${iconHTML(e.item.icon, e.item.name, "ci")}</span><span class="cn">${esc(e.item.name)}</span>`
      + (keys ? `<span class="ctok">${esc(e.item.key)}</span>` : "") + SVG.plus;
    el.addEventListener("click", () => toggle(e.item, keys));
    return el;
  };
  const flip = (box, mutate) => {
    const before = new Map([...box.children].map(k => [k, k.getBoundingClientRect()]));
    mutate();
    [...box.children].forEach(k => {
      const a = before.get(k); if (!a) return;
      const b = k.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) anim(k, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 550, easing: OUT });
    });
  };

  const render = () => {
    const kind = getKind(), keys = kind === "keys", items = keys ? S.shortcuts : S.links, pool = keys ? SHORTCUTS : LINKS;
    const switched = lastKind && kind !== lastKind, quiet = !lastKind || switched, first = !lastKind;
    lastKind = kind;
    // whatever changes below, the height glides to its new size instead of jumping
    const h0 = root.offsetHeight;
    const settle = () => {
      const h1 = root.offsetHeight;
      if (first || !h0 || !h1 || h0 === h1 || still) return;
      root.getAnimations().filter(a => a.id === "h").forEach(a => a.cancel());
      Object.assign(root.style, { overflow: "clip", overflowClipMargin: "8px" });
      const a = root.animate([{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 560, easing: OUT });
      a.id = "h";
      a.finished.then(() => { root.style.overflow = ""; root.style.overflowClipMargin = ""; }, () => {});
    };
    if (switched) {
      chips.textContent = ""; if (open) setOpen(false);
      anim(root, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: OUT });
    }
    form.elements.url.placeholder = keys ? "Search address, with %s for your search" : "Address, like example.com";
    form.elements.url.setAttribute("aria-label", keys ? "Search address, with %s where your search words go" : "Address");
    form.elements.name.placeholder = keys ? "Name" : "Name (optional)";
    $$(".k", form).forEach(k => k.hidden = !keys);

    // suggestions keep their place and switch on and off; your own sit after them
    const entries = [
      ...pool.map(p => ({ id: keys ? "k:" + p.key : "l:" + p.url, item: p, on: items.some(it => same(it, p, keys)) })),
      ...items.filter(it => !pool.some(p => same(it, p, keys))).map(it => ({ id: "c:" + (keys ? it.key : it.url), item: it, on: true }))
    ];
    const have = new Map($$(":scope > [data-key]", chips).map(el => [el.dataset.key, el]));
    const gone = [...have].filter(([k]) => !entries.some(e => e.id === k)).map(([, el]) => el);
    const place = () => {
      gone.forEach(el => el.remove());
      let prev = null;
      entries.forEach(e => {
        let el = have.get(e.id);
        if (!el) {
          el = chip(e, keys);
          if (!quiet) anim(el, [{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: SPRING });
        }
        el.setAttribute("aria-pressed", e.on);
        el.setAttribute("aria-label", `${e.item.name}${keys ? `, shortcut ${e.item.key}` : ""}`);
        if (prev ? prev.nextElementSibling !== el : chips.firstElementChild !== el) prev ? prev.after(el) : chips.prepend(el);
        prev = el;
      });
      let own = $(".own", chips);
      if (!own) {
        own = document.createElement("button"); own.type = "button"; own.className = "chip own";
        own.textContent = "+ Your own";
        own.addEventListener("click", () => setOpen(true));
      }
      own.setAttribute("aria-label", keys ? "Add your own shortcut" : "Add your own link");
      chips.append(own);
      settle();
    };
    if (gone.length && !quiet && !still) {
      gone.forEach(el => anim(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.8)" }], { duration: 180, easing: IN, fill: "forwards" }));
      setTimeout(() => flip(chips, place), 170);
    } else place();
  };
  custom.inert = true;
  views.push(render);
}

/* ── setup ── */
const card = $("#card"), modal = $("#modal"), cardGlow = new Glow(card), greeter = new Greeter($("#greet"));
const LABELS = ["Get started", "Continue", "Continue", "Continue", "Finish"];

function syncMini(box, items, cls) {
  const want = items.join("\u0001");
  if (box.dataset.v === want) return;
  const old = (box.dataset.v || "").split("\u0001").filter(Boolean);
  box.dataset.v = want;
  box.innerHTML = items.map((t, i) => `<span class="${cls}" style="${old.includes(t) ? "animation:none" : `animation-delay:${i * 30}ms`}">${esc(t)}</span>`).join("");
}

function renderSetup() {
  if (!ui.setup) return;
  const st = ui.step, priv = st === 1 && ui.win === "private", colors = S.glow[priv ? "private" : "normal"];
  cardGlow.set(colors); paintRoot(colors);
  card.classList.toggle("is-private", priv);
  card.classList.toggle("with-chrome", st >= 4);
  card.classList.toggle("plain", st >= 4 && !S.toolbar);
  $("#extra").classList.toggle("open", st >= 3);
  greeter.show(dayPart(priv), S.name.trim(), st === 2 && !S.name.trim());
  syncMini($("#toks"), S.shortcuts.slice(0, 3).map(s => s.key), "mtok");
  syncMini($("#miniLinks"), S.links.slice(0, 5).map(l => l.name), "");
  $("#progressWrap").classList.toggle("on", st > 0);
  $$(".segs span").forEach((s, i) => s.classList.toggle("on", i < st));
  $("#count").textContent = `Step ${Math.max(1, st)} of 4`;
  $("#back").hidden = st === 0;
  $("#skip").hidden = st !== 0;
  $("#nextLabel").textContent = LABELS[st];
  $$("[data-n]").forEach(n => { const c = (n.dataset.n === "keys" ? S.shortcuts : S.links).length; n.textContent = c || ""; });
  const nm = $("#nameSetup"); if (document.activeElement !== nm && nm.value !== S.name) nm.value = S.name;
}

async function goStep(n) {
  if (ui.busy || n === ui.step || n < 0) return;
  if (n > 4) return finish();
  ui.busy = true;
  const dir = n > ui.step ? 1 : -1, stepsEl = $("#steps"), from = $(".step.active"), to = $(`.step[data-step="${n}"]`);
  const h0 = stepsEl.offsetHeight;
  await anim(from, [{ opacity: 1, transform: "none", filter: "blur(0px)" }, { opacity: 0, transform: `translateY(${-10 * dir}px)`, filter: "blur(6px)" }],
    { duration: 220, easing: IN, fill: "forwards" }).finished;
  from.getAnimations().forEach(a => a.cancel());
  from.classList.remove("active"); to.classList.add("active");
  ui.step = n; commit();
  const h1 = stepsEl.offsetHeight;
  anim(stepsEl, [{ height: h0 + "px" }, { height: h1 + "px" }], { duration: 700, easing: OUT });
  reveal(to, dir);
  if (n === 2) setTimeout(() => $("#nameSetup").focus({ preventScroll: true }), 350);
  if (n === 1 || n === 3) cardGlow.kick(.4);
  ui.busy = false;
}

async function finish() {
  if (ui.busy) return;
  ui.busy = true;
  S.done = true; save();
  if (still) { enterEditor(); ui.busy = false; return; }
  const body = $(".body", modal);
  anim(body, [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(6px)", transform: "translateY(10px)" }], { duration: 320, easing: IN, fill: "forwards" });
  anim(modal, [{ backgroundColor: "#282522" }, { backgroundColor: "rgba(40,37,34,0)", boxShadow: "none" }], { duration: 420, easing: OUT, fill: "forwards" });
  await wait(300);
  const r0 = card.getBoundingClientRect();
  document.body.append(card);
  card.classList.add("flyer"); card.classList.remove("with-chrome");
  Object.assign(card.style, { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: r0.height + "px" });
  enterEditor({ arriving: true });
  const r1 = $("#viewport").getBoundingClientRect();
  const fly = card.animate([
    { left: r0.left + "px", top: r0.top + "px", width: r0.width + "px", height: r0.height + "px", borderRadius: "12px" },
    { left: r1.left + "px", top: r1.top + "px", width: r1.width + "px", height: r1.height + "px", borderRadius: "0px" }
  ], { duration: 1150, easing: IO, fill: "forwards" });
  cardGlow.kick(1);
  editorIntro(380);
  await fly.finished;
  $("#viewport").classList.add("ready");
  postPreview({ replay: true });
  await wait(950);
  card.getAnimations().forEach(a => a.cancel());
  card.classList.remove("flyer"); card.removeAttribute("style");
  modal.prepend(card);
  body.getAnimations().forEach(a => a.cancel()); modal.getAnimations().forEach(a => a.cancel());
  ui.busy = false;
}

function startSetup(step = 0) {
  if (ui.editor) dropFrame();
  ui.setup = true; ui.editor = false; ui.step = step;
  document.body.classList.remove("is-editor", "entering");
  $$(".step").forEach(s => s.classList.toggle("active", +s.dataset.step === step));
  cardGlow.set(S.glow.normal, true);
  commit();
  anim(modal, [{ opacity: 0, transform: "translateY(32px) scale(.96)", filter: "blur(12px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }],
    { duration: 1300, delay: step ? 0 : 350, easing: OUT, fill: "backwards" });
  reveal($(".step.active"), 1, step ? 250 : 700);
}

/* ── editor ── */
let frameReady = false, postQueued = false, pillTimer;
let frame = $("#frame");
// a fresh frame each time the editor opens: a preview that sat hidden behind the setup can stop painting
function newFrame() {
  const f = frame.cloneNode(false);
  f.removeAttribute("srcdoc"); f.style.cssText = frame.style.cssText;
  f.addEventListener("load", () => { frameReady = !!f.srcdoc; postPreview(); });
  frame.replaceWith(f); frame = f;
}
function dropFrame() { frameReady = false; frame.removeAttribute("srcdoc"); frame.src = "about:blank"; }

function enterEditor({ arriving } = {}) {
  ui.setup = false; ui.editor = true; ui.preview = "normal";
  document.body.classList.add("is-editor");
  if (arriving) document.body.classList.add("entering");
  $("#viewport").classList.toggle("ready", !arriving);
  frameReady = false;
  newFrame();
  fitFrame();
  frame.srcdoc = pageHTML(true);
  openAcc(ui.open);
  commit();
  scrollTo(0, 0);
  $("#panel").scrollTop = 0;
  clearTimeout(pillTimer);
  if (arriving) {
    setTimeout(() => $("#donePill").classList.add("on"), 1400);
    pillTimer = setTimeout(() => $("#donePill").classList.remove("on"), 6500);
  } else editorIntro(150);
}
function editorIntro(delay) {
  anim($("#browser"), [{ opacity: 0, transform: "scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 1000, delay, easing: OUT, fill: "backwards" });
  anim($(".stage-bar"), [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: delay + 300, easing: OUT, fill: "backwards" });
  anim($("#panel"), [{ opacity: 0, transform: "translateX(28px)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 1100, delay: delay + 200, easing: OUT, fill: "backwards" });
  $$(".acc", $("#panel")).forEach((a, i) => anim(a, [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 800, delay: delay + 320 + i * 55, easing: OUT, fill: "backwards" }));
  document.body.classList.remove("entering");
}
function postPreview(extra = {}) {
  if (!frameReady || !frame.contentWindow) return;
  frame.contentWindow.postMessage({ type: "newtab-config", config: pageConfig(), private: ui.preview === "private", ...extra }, "*");
}
addEventListener("message", e => {
  if (e.source !== frame.contentWindow || !e.data || e.data.type !== "newtab-go") return;
  toast("Opens " + String(e.data.url).replace(/^https?:\/\/(www\.)?/, "").slice(0, 70));
});
// draw the page at a real desktop size, then scale it into the preview
function fitFrame() {
  const v = $("#viewport"), width = v.clientWidth, height = v.clientHeight; if (!width) return;
  const vw = width < 720 ? 1100 : 1440, s = width / vw;
  Object.assign(frame.style, { width: vw + "px", height: height / s + "px", transform: `scale(${s})` });
}
new ResizeObserver(fitFrame).observe($("#viewport"));

function openAcc(id) {
  ui.open = id;
  $$(".acc").forEach(a => {
    const on = a.dataset.acc === id, c = $(".collapse", a);
    a.classList.toggle("open", on); $(".acc-h", a).setAttribute("aria-expanded", on);
    c.classList.toggle("open", on); c.inert = !on;
  });
}
$$(".acc-h").forEach(h => h.addEventListener("click", () => { const id = h.parentElement.dataset.acc; openAcc(ui.open === id ? null : id); }));

const presetName = win => ({ custom: "Custom" })[S.preset[win]] || PRESETS.find(p => p.id === S.preset[win])?.name || "Custom";
function renderEditor() {
  if (!ui.editor) return;
  const win = ui.preview, colors = S.glow[win];
  paintRoot(colors);
  $("#browser").classList.toggle("plain", !S.toolbar);
  $("#browser").classList.toggle("priv", win === "private");
  const vals = {
    glow: `${presetName("normal")} · ${presetName("private")}`,
    greet: S.name.trim() || "No name",
    keys: S.shortcuts.length ? S.shortcuts.map(s => s.key).join(" ") : "None",
    links: S.links.length ? String(S.links.length) : "None",
    firefox: S.toolbar ? "Matched" : "Firefox default"
  };
  $$("[data-val]").forEach(v => {
    const t = vals[v.dataset.val];
    if (v.textContent !== t) { const had = v.textContent; v.textContent = t; if (had) { v.classList.remove("flash"); void v.offsetWidth; v.classList.add("flash"); } }
  });
  $$("[data-ci]").forEach(i => { const c = colors[+i.dataset.ci]; if (i.value !== c) i.value = c; });
  $$("[data-hex]").forEach(h => h.textContent = colors[+h.dataset.hex]);
  const g = $("#grain"); if (document.activeElement !== g) g.value = S.grain;
  $("#grainOut").textContent = Math.round(S.grain * 100);
  const nm = $("#nameEdit"); if (document.activeElement !== nm && nm.value !== S.name) nm.value = S.name;
  if (!postQueued) { postQueued = true; requestAnimationFrame(() => { postQueued = false; postPreview(); }); }
}

/* ── download: the page with your settings, the Firefox files, the installers ── */
function pageConfig() {
  return {
    name: S.name.trim(),
    glow: { normal: [...S.glow.normal], private: [...S.glow.private] },
    grain: Math.round(S.grain * 100) / 100,
    shortcuts: S.shortcuts.map(({ key, name, sub, home, search, icon, alias }) =>
      Object.fromEntries(Object.entries({ key, name, sub, home, search, icon, alias }).filter(([, v]) => v))),
    links: S.links.map(({ name, url }) => ({ name, url }))
  };
}
function pageHTML(preview) {
  const json = JSON.stringify(pageConfig(), null, 2).replace(/</g, "\\u003c");
  const block = "/* newtab-config:start — your settings, made with the newtab builder. You can also edit them by hand.\n"
    + "   shortcuts: type `key` then Space to search that site. `search` has %s where the search goes.\n"
    + "   icon: a built-in icon name (gh yt m d w map), a data:image/png URL, or leave it out for a letter. */\n"
    + `const NEWTAB = ${json};\n/* newtab-config:end */`;
  let html = T["index.html"].replace(/\/\* newtab-config:start[\s\S]*?\/\* newtab-config:end \*\//, () => block);
  if (preview) html = html
    .replace("<head>", `<head>\n<script>window.NEWTAB_PREVIEW = true; window.NEWTAB_PREVIEW_PRIVATE = ${ui.preview === "private"};</script>`)
    .replace(" autofocus", "");
  return html;
}
const README = `newtab: your new tab page for Firefox
Made with the newtab builder.

Install on a Mac
  1. Move this newtab folder somewhere it can stay, like Documents.
     Firefox loads your page from here.
  2. Quit Firefox (Cmd+Q). Open Terminal and run:
       cd ~/Documents/newtab && bash install.sh
     It asks for your Mac password to add two small files to Firefox.
  3. Open Firefox and press Cmd+T.

Install on Windows
  1. Move this newtab folder somewhere it can stay, like Documents.
  2. Close Firefox. Open PowerShell as administrator and run:
       cd $HOME\\Documents\\newtab; powershell -ExecutionPolicy Bypass -File .\\install.ps1
  3. Open Firefox and press Ctrl+T.

Change it later: edit the settings block at the top of index.html.
If a Firefox update ever resets your new tab, run the installer again.
`;
function bundleFiles() {
  const P = "newtab/";
  const cfg = S.focus ? T["firefox/autoconfig.cfg"] : T["firefox/autoconfig.cfg"].replace(/\/\/ focus:start[\s\S]*?\/\/ focus:end\n?/, "");
  const userJs = S.toolbar ? T["firefox/user.js"]
    : T["firefox/user.js"].split("\n").filter(l => !l.startsWith("user_pref")).join("\n") + "// (the toolbar restyle was left out in the builder)\n";
  return [
    { name: P + "index.html", data: pageHTML(false) },
    S.toolbar && { name: P + "firefox/userChrome.css", data: T["firefox/userChrome.css"] },
    { name: P + "firefox/user.js", data: userJs },
    { name: P + "firefox/autoconfig.js", data: T["firefox/autoconfig.js"] },
    { name: P + "firefox/autoconfig.cfg", data: cfg },
    { name: P + "install.sh", data: T["install.sh"], exec: true },
    { name: P + "install.ps1", data: T["install.ps1"] },
    { name: P + "README.txt", data: README }
  ].filter(Boolean);
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = [], d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = typeof f.data === "string" ? enc.encode(f.data) : f.data, crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(lh, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 0x031E, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(38, ((f.exec ? 0o100755 : 0o100644) * 65536) >>> 0, true); ch.setUint32(42, offset, true);
    central.push(ch, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, c) => n + c.byteLength, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}

/* ── share links: your look in the address, never your name ── */
const b64 = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
function shareLink() {
  const look = {
    g: S.glow, p: S.preset, r: S.grain, t: S.toolbar, f: S.focus,
    s: S.shortcuts.map(({ key, name, sub, home, search, icon, alias }) => ({ key, name, sub, home, search, icon: ICONS[icon] ? icon : undefined, alias })),
    l: S.links.map(({ name, url, icon }) => ({ name, url, icon: ICONS[icon] ? icon : undefined }))
  };
  return location.href.split("#")[0] + "#look=" + b64(JSON.stringify(look));
}
function readLook() {
  const m = location.hash.match(/look=([\w-]+)/);
  if (!m) return null;
  try { return JSON.parse(unb64(m[1])); } catch { return null; }
}
function applyLook(j) {
  const okHex = a => Array.isArray(a) && a.length === 3 && a.every(c => /^#[0-9a-f]{6}$/i.test(c));
  const okUrl = u => typeof u === "string" && /^https?:\/\//i.test(u) && u.length < 400;
  const txt = (v, n) => String(v ?? "").slice(0, n);
  for (const w of ["normal", "private"]) {
    if (j.g && okHex(j.g[w])) {
      S.glow[w] = j.g[w];
      const id = j.p && String(j.p[w]);
      S.preset[w] = PRESETS.some(p => p.id === id) ? id : "custom";
    }
  }
  if (typeof j.r === "number") S.grain = Math.min(.7, Math.max(0, j.r));
  if (typeof j.t === "boolean") S.toolbar = j.t;
  if (typeof j.f === "boolean") S.focus = j.f;
  if (Array.isArray(j.s)) S.shortcuts = j.s.filter(s => s && /^[a-z0-9]{1,4}$/.test(s.key) && okUrl(s.search) && s.search.includes("%s")).slice(0, 24)
    .map(s => Object.fromEntries(Object.entries({
      key: s.key, name: txt(s.name || s.key, 24), sub: txt(s.sub, 60), home: okUrl(s.home) ? s.home : undefined,
      search: s.search, icon: ICONS[s.icon] ? s.icon : undefined, alias: txt(s.alias, 40)
    }).filter(([, v]) => v)));
  if (Array.isArray(j.l)) S.links = j.l.filter(l => l && okUrl(l.url)).slice(0, 12)
    .map(l => ({ name: txt(l.name, 24) || hostOf(l.url), url: l.url, ...(ICONS[l.icon] ? { icon: l.icon } : {}) }));
}

/* ── the download sheet ── */
let exGlow, exGreeter, lastFocus;
const sheet = $("#sheet");
const HOW = {
  mac: [
    "<b>Unzip it</b> and move the <b>newtab</b> folder somewhere it can stay, like Documents. Firefox loads your page from there.",
    "<b>Quit Firefox</b> (⌘Q), open Terminal and run this. It asks for your Mac password to add two small files to Firefox.",
    "<b>Open Firefox</b> and press ⌘T."
  ],
  win: [
    "<b>Unzip it</b> and move the <b>newtab</b> folder somewhere it can stay, like Documents. Firefox loads your page from there.",
    "<b>Close Firefox</b>, open PowerShell as administrator and run this.",
    "<b>Open Firefox</b> and press Ctrl+T."
  ]
};
const CMD = { mac: "cd ~/Documents/newtab && bash install.sh", win: "cd $HOME\\Documents\\newtab; powershell -ExecutionPolicy Bypass -File .\\install.ps1" };
let howOs = null;
function renderHow() {
  if (howOs === S.os) return;
  const first = howOs === null; howOs = S.os;
  const how = $("#how");
  how.innerHTML = HOW[S.os].map((t, i) => `<li>${t}${i === 1 ? `<div class="code"><span>${esc(CMD[S.os])}</span><button type="button" class="btn" data-copy><span class="swap"><span>Copy</span><span>Copied</span></span></button></div>` : ""}</li>`).join("")
;
  if (!first) $$("li", how).forEach((li, i) => anim(li, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 500, delay: i * 50, easing: OUT, fill: "backwards" }));
}
function openSheet() {
  lastFocus = document.activeElement;
  sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false");
  if (!exGlow) { exGlow = new Glow($("#exCard")); exGreeter = new Greeter($("#exGreet")); }
  exGlow.set(S.glow.normal, true); exGlow.energy = 0; exGlow.kick(.8);
  exGreeter.key = null; exGreeter.show(dayPart(false), S.name.trim(), false);
  $("#download").classList.remove("done");
  $("#shareUrl").textContent = shareLink();
  renderHow();
  setTimeout(() => $("#download").focus({ preventScroll: true }), 80);
}
function closeSheet() {
  sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true");
  lastFocus?.focus?.({ preventScroll: true });
}
sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener("keydown", e => {
  if (e.key !== "Tab") return;
  const f = $$("button, [href], input", sheet).filter(el => !el.disabled && el.offsetParent);
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});
$("#openExport").addEventListener("click", openSheet);
$("#closeExport").addEventListener("click", closeSheet);
$("#download").addEventListener("click", () => {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(zip(bundleFiles())), download: "newtab.zip" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  $("#download").classList.add("done");
  exGlow?.kick(1.2);
  toast("newtab.zip downloaded. Now run the installer");
});
document.addEventListener("click", e => {
  const share = e.target.closest("[data-share]");
  if (share) { copy(shareLink(), share); if (!sheet.contains(share)) toast("Share link copied"); return; }
  const c = e.target.closest("[data-copy]");
  if (c) copy(c.previousElementSibling.textContent, c);
});

/* ── wiring ── */
presets($("#setupPresets"), () => ui.win, (a = .8) => cardGlow.kick(a));
presets($("#editPresets"), () => ui.preview, () => {});
seg($("#winCtl"), () => ui.win, v => { ui.win = v; cardGlow.kick(.5); commit(); });
seg($("#sitesCtl"), () => ui.tab, v => { ui.tab = v; commit(); });
seg($("#previewCtl"), () => ui.preview, v => { ui.preview = v; commit(); });
seg($("#glowWinCtl"), () => ui.preview, v => { ui.preview = v; commit(); });
$$("[data-os]").forEach(el => seg(el, () => S.os, v => { S.os = v; commit(); }));
sites($("#setupSites"), () => ui.tab);
sites($("#editKeys"), () => "keys");
sites($("#editLinks"), () => "links");
toggles($("#setupToggles"));
toggles($("#editToggles"));
views.push(() => $$("[data-dot]").forEach(d => d.style.background = swatch(S.glow[d.dataset.dot])));
views.push(renderSetup, renderEditor, () => { if (sheet.classList.contains("open")) renderHow(); });

for (const id of ["#nameSetup", "#nameEdit"]) $(id).addEventListener("input", e => { S.name = e.target.value; commit(); });
$$("[data-ci]").forEach(i => i.addEventListener("input", () => { S.glow[ui.preview][+i.dataset.ci] = i.value; S.preset[ui.preview] = "custom"; commit(); }));
$("#grain").addEventListener("input", e => { S.grain = +e.target.value; commit(); });
$("#next").addEventListener("click", () => goStep(ui.step + 1));
$("#back").addEventListener("click", () => goStep(ui.step - 1));
$("#skip").addEventListener("click", finish);
$("#restart").addEventListener("click", () => { scrollTo(0, 0); startSetup(1); });

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && sheet.classList.contains("open")) return closeSheet();
  if (!ui.setup || e.key !== "Enter" || e.isComposing || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
  const t = e.target;
  if (t.closest("form") || t.tagName === "BUTTON" || t.tagName === "TEXTAREA" || t.tagName === "A") return;
  e.preventDefault(); goStep(ui.step + 1);
});

addEventListener("scroll", () => $(".top").classList.toggle("scrolled", scrollY > 8), { passive: true });

/* ── start ── */
if (!T["index.html"]) {
  document.body.innerHTML = '<p style="padding:96px 32px;color:#d7d2cc">builder/templates.js is missing. Run <code>python3 builder/bundle.py</code> from the repo.</p>';
  return;
}
const look = readLook();
if (look) {
  applyLook(look); S.done = true; save();
  history.replaceState(null, "", location.pathname + location.search);
  enterEditor();
  setTimeout(() => toast("You're starting from a shared look. Make it yours"), 900);
} else if (S.done) enterEditor();
else startSetup(0);
})();
