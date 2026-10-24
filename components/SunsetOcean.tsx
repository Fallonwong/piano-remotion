import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

export type SunsetOceanProps = {
  width?: number;
  height?: number;
  sunX?: number;
  sunY?: number;
  sunRadius?: number;
  horizonY?: number;
  emberCount?: number;
  emberSpeed?: number;
  waveSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
};

const pseudoRandom = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/**
 * Procedural Sunset Ocean background inspired by coastal runway references.
 * Features a glowing sun, atmospheric amber haze, shimmering ocean specular column,
 * a silhouetted breakwater ridge, and floating warm ember particles.
 */
export const SunsetOcean: React.FC<SunsetOceanProps> = ({
  width = 1080,
  height = 1920,
  sunX,
  sunY,
  sunRadius,
  horizonY,
  emberCount = 42,
  emberSpeed = 0.8,
  waveSpeed = 0.05,
  className,
  style,
}) => {
  const frame = useCurrentFrame();

  const sx = sunX ?? width * 0.43;
  const sy = sunY ?? height * 0.17;
  const sr = sunRadius ?? width * 0.11;
  const hy = horizonY ?? height * 0.30;

  // Gentle atmospheric breathing
  const sunPulse = 1 + 0.02 * Math.sin(frame * 0.04);
  const glowRadius = sr * 2.8 * sunPulse;

  // Generate deterministic wave shimmer glints on the water column
  const waveRows = 48;
  const waves = Array.from({length: waveRows}, (_, i) => {
    // Relative depth along the ocean (0 at horizon, 1 at bottom of water visible area)
    const normY = i / (waveRows - 1);
    const rowY = hy + Math.pow(normY, 1.45) * (height * 0.72 - hy);
    // Ocean perspective spread: narrower near horizon, wider toward foreground
    const columnSpread = width * (0.16 + 0.38 * normY);
    const waveCount = 5 + Math.floor(normY * 7);

    return Array.from({length: waveCount}, (__, j) => {
      const seed = i * 29 + j * 13;
      const xOffset = (pseudoRandom(seed) - 0.5) * columnSpread;
      const waveX = sx + xOffset;
      const waveW = width * (0.04 + 0.11 * normY) * (0.6 + 0.8 * pseudoRandom(seed + 1));
      const waveH = Math.max(1.8, 1.2 + 4.2 * normY);

      // Wave shimmer undulating phase
      const phase = frame * waveSpeed * (0.9 + 0.4 * pseudoRandom(seed + 2)) + normY * 12 + j * 1.5;
      const shimmer = Math.max(0, Math.sin(phase) * 0.5 + 0.5);
      const intensity = Math.pow(shimmer, 2.2);

      // Gold-orange specular color
      const isCore = Math.abs(xOffset) < columnSpread * 0.38;
      const opacity = intensity * (isCore ? 0.85 : 0.45) * (0.3 + 0.7 * (1 - Math.abs(xOffset) / (columnSpread * 0.55)));

      return {
        key: `${i}-${j}`,
        x: waveX - waveW / 2,
        y: rowY + Math.sin(phase * 0.7) * (1.5 + 3 * normY),
        w: waveW,
        h: waveH,
        opacity: Math.max(0, Math.min(1, opacity)),
        color: isCore ? '#ffe875' : '#ff9d2e',
      };
    });
  }).flat();

  // Floating warm ember particles
  const embers = Array.from({length: emberCount}, (_, i) => {
    const seed = i * 43 + 7;
    const period = 140 + Math.floor(pseudoRandom(seed) * 120);
    const birth = (frame * emberSpeed + pseudoRandom(seed + 1) * period) % period;
    const progress = birth / period;

    const startX = width * (0.1 + 0.75 * pseudoRandom(seed + 2));
    const driftX = Math.sin(progress * Math.PI * 2 + i) * 35 + progress * 40;
    const x = startX + driftX;
    const y = height * (0.95 - progress * 0.75);

    const radius = 1.2 + pseudoRandom(seed + 3) * 2.2;
    const alpha = Math.sin(progress * Math.PI) * (0.35 + 0.65 * pseudoRandom(seed + 4));
    const isBright = pseudoRandom(seed + 5) > 0.7;

    return {
      key: i,
      x,
      y,
      r: radius,
      opacity: alpha,
      color: isBright ? '#fffae0' : '#ffaa3b',
      glow: isBright,
    };
  });

  return (
    <AbsoluteFill
      className={className}
      style={{
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#160802',
        ...style,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}
      >
        <defs>
          {/* Sky background gradient */}
          <radialGradient
            id="sunset-sky"
            cx={`${(sx / width) * 100}%`}
            cy={`${(sy / height) * 100}%`}
            r="85%"
          >
            <stop offset="0%" stopColor="#ffb814" />
            <stop offset="18%" stopColor="#f58002" />
            <stop offset="38%" stopColor="#c43e00" />
            <stop offset="65%" stopColor="#571701" />
            <stop offset="100%" stopColor="#1a0601" />
          </radialGradient>

          {/* Sun outer atmospheric glow */}
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8b3" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#ffb814" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#ff6f00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
          </radialGradient>

          {/* Sun core fill */}
          <linearGradient id="sun-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffae6" />
            <stop offset="40%" stopColor="#ffea75" />
            <stop offset="100%" stopColor="#ffa000" />
          </linearGradient>

          {/* Ocean base depth gradient */}
          <linearGradient id="ocean-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b1104" />
            <stop offset="25%" stopColor="#210c02" />
            <stop offset="70%" stopColor="#150601" />
            <stop offset="100%" stopColor="#0c0300" />
          </linearGradient>

          {/* Seawall breakwater gradient */}
          <linearGradient id="breakwater-rock" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d0402" />
            <stop offset="45%" stopColor="#1a0a04" />
            <stop offset="85%" stopColor="#2d1307" />
            <stop offset="100%" stopColor="#4d1f0b" />
          </linearGradient>

          {/* Soft blur filter for atmospheric elements */}
          <filter id="sun-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* 1. Sky Base */}
        <rect x="0" y="0" width={width} height={height} fill="url(#sunset-sky)" />

        {/* 2. Ocean Water Area (Left & center beneath horizon) */}
        <rect
          x="0"
          y={hy}
          width={width}
          height={height - hy}
          fill="url(#ocean-water)"
        />

        {/* 2.1 Water Golden Specular Reflection Column under the sun */}
        <ellipse
          cx={sx}
          cy={hy + (height - hy) * 0.35}
          rx={width * 0.38}
          ry={(height - hy) * 0.45}
          fill="url(#sun-glow)"
          opacity="0.32"
          style={{mixBlendMode: 'screen', filter: 'blur(16px)'}}
        />

        {/* 3. Ocean Water Horizon Line & Specular Column */}
        <line
          x1="0"
          y1={hy}
          x2={width}
          y2={hy}
          stroke="#ff981a"
          strokeWidth="1.5"
          opacity="0.45"
        />

        {/* 4. Dynamic Water Specular Shimmer Waves */}
        <g style={{mixBlendMode: 'screen'}}>
          {waves.map((w) =>
            w.opacity > 0.01 ? (
              <ellipse
                key={w.key}
                cx={w.x + w.w / 2}
                cy={w.y}
                rx={w.w / 2}
                ry={w.h / 2}
                fill={w.color}
                opacity={w.opacity}
              />
            ) : null
          )}
        </g>

        {/* 5. Left Breakwater Rocks / Reef Ridge */}
        <path
          d={`
            M 0,${hy + 20}
            Q ${width * 0.08},${hy + 60} ${width * 0.16},${hy + 130}
            T ${width * 0.28},${hy + 320}
            T ${width * 0.36},${hy + 650}
            T ${width * 0.44},${height}
            L 0,${height}
            Z
          `}
          fill="url(#breakwater-rock)"
          opacity="0.85"
        />
        {/* Breakwater warm sunset rim light */}
        <path
          d={`
            M 0,${hy + 20}
            Q ${width * 0.08},${hy + 60} ${width * 0.16},${hy + 130}
            T ${width * 0.28},${hy + 320}
            T ${width * 0.36},${hy + 650}
            T ${width * 0.44},${height}
          `}
          fill="none"
          stroke="#cf6217"
          strokeWidth="3.5"
          opacity="0.55"
          style={{filter: 'blur(1.5px)'}}
        />

        {/* 6. Giant Radiant Sun & Glow */}
        {/* Outermost warm bloom */}
        <circle
          cx={sx}
          cy={sy}
          r={glowRadius * 1.5}
          fill="url(#sun-glow)"
          opacity="0.5"
          style={{mixBlendMode: 'screen'}}
        />
        {/* Core glow */}
        <circle
          cx={sx}
          cy={sy}
          r={glowRadius}
          fill="url(#sun-glow)"
          opacity="0.85"
          style={{mixBlendMode: 'screen'}}
        />
        {/* Solid Sun Disc */}
        <circle
          cx={sx}
          cy={sy}
          r={sr * sunPulse}
          fill="url(#sun-core)"
          style={{filter: 'drop-shadow(0 0 35px #ffb300)'}}
        />

        {/* 7. Floating Ambient Embers */}
        <g style={{mixBlendMode: 'screen'}}>
          {embers.map((e) => (
            <g key={e.key} opacity={e.opacity}>
              {e.glow && (
                <circle
                  cx={e.x}
                  cy={e.y}
                  r={e.r * 2.8}
                  fill="#ff7700"
                  opacity="0.35"
                  style={{filter: 'blur(2px)'}}
                />
              )}
              <circle cx={e.x} cy={e.y} r={e.r} fill={e.color} />
            </g>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
