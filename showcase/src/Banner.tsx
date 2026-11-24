import React from "react";
import { AbsoluteFill } from "remotion";

// YouTube channel banner (2560 × 1440), image only, in the new tab page's language: warm charcoal,
// the grainy orange glow and the faint grid. The heart of the glow sits in the 1546 × 423 strip
// every device shows; the wider desktop and TV crops get the falloff and a quiet blue light far right.
export const BANNER = { width: 2560, height: 1440 };

const BASE = "#1d1b19";

export const Banner: React.FC<{ guides?: boolean }> = ({ guides = false }) => (
  <AbsoluteFill style={{ background: BASE, overflow: "hidden" }}>
    <AbsoluteFill style={{ filter: "blur(90px)" }}>
      {/* the main orange body, centred on the phone-safe strip */}
      <div style={{ position: "absolute", borderRadius: "50%", width: 1500, height: 820, left: 520, top: 300, background: "#f76203", transform: "rotate(-6deg)" }} />
      {/* hot highlight, up and right */}
      <div style={{ position: "absolute", borderRadius: "50%", width: 760, height: 440, left: 1320, top: 330, background: "#ff9a40", opacity: 0.85 }} />
      {/* deeper red-orange along the lower left */}
      <div style={{ position: "absolute", borderRadius: "50%", width: 900, height: 400, left: 600, top: 800, background: "#e0400a", opacity: 0.75 }} />
      {/* the private window's blue, far right: only on wide screens */}
      <div style={{ position: "absolute", borderRadius: "50%", width: 700, height: 620, left: 2200, top: 420, background: "#263f8c", opacity: 0.9 }} />
      <div style={{ position: "absolute", borderRadius: "50%", width: 380, height: 300, left: 2250, top: 540, background: "#4e6cb8", opacity: 0.55 }} />
    </AbsoluteFill>

    {/* darker edges, like the page's vignette */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 62% 70% at 50% 50%, transparent 45%, rgba(29,27,25,0.7) 100%)" }} />

    {/* faint grid, fading towards the edges */}
    <AbsoluteFill style={{
      backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      backgroundSize: "72px 72px", backgroundPosition: "center",
      WebkitMaskImage: "radial-gradient(ellipse 48% 42% at 50% 50%, #000 20%, transparent 100%)",
      maskImage: "radial-gradient(ellipse 48% 42% at 50% 50%, #000 20%, transparent 100%)",
    }} />

    {/* film grain */}
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.42 }} aria-hidden>
      <filter id="bgrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" seed={3} />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={3} intercept={-1} /><feFuncG type="linear" slope={3} intercept={-1} /><feFuncB type="linear" slope={3} intercept={-1} />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#bgrain)" />
    </svg>

    {guides && (
      <AbsoluteFill>
        {[
          { w: 2560, h: 423, c: "rgba(120,200,255,0.9)" },
          { w: 1546, h: 423, c: "rgba(120,255,160,0.95)" },
        ].map((g) => (
          <div key={g.w} style={{ position: "absolute", left: (2560 - g.w) / 2, top: (1440 - g.h) / 2, width: g.w, height: g.h, boxSizing: "border-box", border: `5px dashed ${g.c}` }} />
        ))}
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);

export const BannerGuides: React.FC = () => <Banner guides />;
