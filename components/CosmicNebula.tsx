import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

export type CosmicNebulaProps = {
  width?: number;
  height?: number;
  starCount?: number;
  starburstCount?: number;
  twinklePeriodFrames?: number;
  nebulaOpacity?: number;
  style?: React.CSSProperties;
  className?: string;
};

// Deterministic pseudorandom generator
const hash = (seed: number): number => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const CosmicNebula: React.FC<CosmicNebulaProps> = ({
  width = 1080,
  height = 1920,
  starCount = 220,
  starburstCount = 22,
  twinklePeriodFrames = 90,
  nebulaOpacity = 1.0,
  style,
  className,
}) => {
  const frame = useCurrentFrame();

  // Pre-generate deterministic stars
  const stars = useMemo(() => {
    const list = [];
    const colors = ['#ffffff', '#e2f0ff', '#d8e5ff', '#ebd8ff', '#ffeec9'];
    for (let i = 0; i < starCount; i++) {
      const x = hash(i * 13 + 7) * width;
      const y = hash(i * 19 + 11) * height;
      const r = 0.5 + hash(i * 23 + 17) * 1.8;
      const col = colors[Math.floor(hash(i * 29 + 31) * colors.length)];
      const baseAlpha = 0.25 + hash(i * 37 + 41) * 0.65;
      const speed = 0.03 + hash(i * 43 + 47) * 0.05;
      const phase = hash(i * 53 + 59) * Math.PI * 2;
      list.push({x, y, r, col, baseAlpha, speed, phase});
    }
    return list;
  }, [starCount, width, height]);

  // Pre-generate prominent diffraction diamond starbursts (星芒)
  const starbursts = useMemo(() => {
    const list = [];
    for (let i = 0; i < starburstCount; i++) {
      const x = (0.06 + hash(i * 61 + 3) * 0.88) * width;
      const y = (0.05 + hash(i * 67 + 5) * 0.85) * height;
      const size = 18 + hash(i * 71 + 7) * 36; // spike length
      const color = i % 3 === 0 ? '#b8dcff' : i % 3 === 1 ? '#d6c4ff' : '#ffffff';
      const speed = 0.04 + hash(i * 73 + 11) * 0.04;
      const phase = hash(i * 79 + 13) * Math.PI * 2;
      const hasSecondary = hash(i * 83 + 17) > 0.35; // 8-point spike
      list.push({x, y, size, color, speed, phase, hasSecondary});
    }
    return list;
  }, [starburstCount, width, height]);

  return (
    <AbsoluteFill
      className={className}
      style={{
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        background:
          'radial-gradient(ellipse 95% 85% at 50% 28%, #080e28 0%, #05081b 50%, #02030a 100%)',
        ...style,
      }}
    >
      {/* Layer 1: Celestial Cyan Nebula Cloud */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 50% at 30% 25%, rgba(0, 195, 255, 0.16) 0%, rgba(0, 140, 235, 0.07) 45%, transparent 75%)',
          opacity: nebulaOpacity,
          mixBlendMode: 'screen',
        }}
      />

      {/* Layer 2: Interstellar Violet Nebula Cloud */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 75% 36%, rgba(168, 85, 247, 0.18) 0%, rgba(139, 92, 246, 0.08) 50%, transparent 80%)',
          opacity: nebulaOpacity,
          mixBlendMode: 'screen',
        }}
      />

      {/* Layer 3: Soft Deep Turquoise Atmosphere */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 45% 72%, rgba(20, 184, 166, 0.10) 0%, transparent 60%)',
          opacity: nebulaOpacity,
          mixBlendMode: 'screen',
        }}
      />

      {/* SVG Multi-Spectral Starfield & Diamond Starbursts */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      >
        <defs>
          <radialGradient id="star-soft-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#b8dcff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6aa7ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Twinkling Field Stars */}
        {stars.map((s, idx) => {
          const twinkle =
            0.45 + 0.55 * Math.sin(frame * s.speed + s.phase);
          const opacity = s.baseAlpha * twinkle;
          return (
            <circle
              key={idx}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={s.col}
              opacity={opacity}
            />
          );
        })}

        {/* 2. Soft Natural Celestial Breathing Stars (杜绝生硬十字硬线) */}
        {starbursts.map((sb, idx) => {
          const breath =
            0.7 + 0.3 * Math.sin(frame * sb.speed + sb.phase);
          const s = sb.size * breath;
          const coreR = Math.max(1.5, s * 0.08);

          return (
            <g
              key={`sb-${idx}`}
              transform={`translate(${sb.x}, ${sb.y})`}
              opacity={0.88 * breath}
            >
              {/* Soft ethereal outer halo */}
              <circle
                cx={0}
                cy={0}
                r={coreR * 8}
                fill={sb.color}
                opacity={0.25 * breath}
                style={{filter: 'blur(4px)'}}
              />

              {/* Natural soft anamorphic bloom (soft elliptical gradient, no hard cross lines) */}
              <ellipse
                rx={s * 0.85}
                ry={Math.max(1.2, s * 0.12)}
                fill={sb.color}
                opacity={0.45 * breath}
                style={{filter: 'blur(2px)'}}
              />
              <ellipse
                rx={Math.max(1.2, s * 0.12)}
                ry={s * 0.65}
                fill={sb.color}
                opacity={0.38 * breath}
                style={{filter: 'blur(2px)'}}
              />

              {/* Brilliant stellar core */}
              <circle cx={0} cy={0} r={coreR * 2.2} fill={sb.color} opacity={0.7} />
              <circle cx={0} cy={0} r={coreR} fill="#ffffff" />
            </g>
          );
        })}

        {/* 3. Cinematic Meteors (真实流星划空动效) */}
        {(() => {
          const meteorData = [
            {start: 15, dur: 22, x0: 960, y0: 80, vx: -460, vy: 290, len: 210},
            {start: 72, dur: 24, x0: 1040, y0: 130, vx: -520, vy: 340, len: 240},
            {start: 140, dur: 20, x0: 860, y0: 60, vx: -430, vy: 280, len: 190},
            {start: 205, dur: 25, x0: 1050, y0: 170, vx: -560, vy: 360, len: 250},
            {start: 280, dur: 22, x0: 910, y0: 90, vx: -450, vy: 300, len: 210},
            {start: 355, dur: 24, x0: 1020, y0: 120, vx: -510, vy: 330, len: 230},
            {start: 430, dur: 22, x0: 880, y0: 70, vx: -440, vy: 290, len: 200},
            {start: 515, dur: 25, x0: 1060, y0: 160, vx: -570, vy: 370, len: 250},
            {start: 605, dur: 23, x0: 930, y0: 100, vx: -460, vy: 310, len: 220},
            {start: 690, dur: 24, x0: 1000, y0: 130, vx: -500, vy: 330, len: 240},
            {start: 770, dur: 22, x0: 870, y0: 60, vx: -430, vy: 280, len: 200},
            {start: 845, dur: 24, x0: 1030, y0: 150, vx: -520, vy: 340, len: 240},
          ];

          return meteorData.map((m, mIdx) => {
            if (frame < m.start || frame >= m.start + m.dur) return null;
            const p = (frame - m.start) / m.dur;
            const hx = m.x0 + m.vx * p;
            const hy = m.y0 + m.vy * p;
            const vDist = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
            const dx = m.vx / vDist;
            const dy = m.vy / vDist;
            const tx = hx - dx * m.len;
            const ty = hy - dy * m.len;
            const alpha = p < 0.2 ? p / 0.2 : p > 0.7 ? (1 - p) / 0.3 : 1.0;

            return (
              <g key={`meteor-${mIdx}`}>
                <defs>
                  <linearGradient id={`mGrad-${mIdx}`} x1={hx} y1={hy} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={alpha} />
                    <stop offset="15%" stopColor="#d4e8ff" stopOpacity={alpha * 0.85} />
                    <stop offset="50%" stopColor="#a3ceff" stopOpacity={alpha * 0.45} />
                    <stop offset="85%" stopColor="#c89eff" stopOpacity={alpha * 0.15} />
                    <stop offset="100%" stopColor="#7a9eff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Trail line */}
                <line
                  x1={hx}
                  y1={hy}
                  x2={tx}
                  y2={ty}
                  stroke={`url(#mGrad-${mIdx})`}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {/* Incandescent head */}
                <circle cx={hx} cy={hy} r={8} fill="#c8e4ff" opacity={alpha * 0.55} style={{filter: 'blur(3px)'}} />
                <circle cx={hx} cy={hy} r={2.5} fill="#ffffff" opacity={alpha} />
              </g>
            );
          });
        })()}
      </svg>
    </AbsoluteFill>
  );
};
