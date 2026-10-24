import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export type DeepSapphireProps = {
  width?: number;
  height?: number;
  starCount?: number;
  meteorStarts?: number[];
  meteorDurationFrames?: number;
  twinklePeriodFrames?: number;
};

const random = (seed: number) => {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** Deterministic star positions and sparse meteors; all timing is in frames. */
export const DeepSapphire: React.FC<DeepSapphireProps> = ({
  width = 1920, height = 1080, starCount = 110,
  meteorStarts = [74, 407, 778], meteorDurationFrames = 32,
  twinklePeriodFrames = 180,
}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
    background: 'radial-gradient(ellipse 85% 100% at 70% 40%, #10334a 0%, #082338 35%, #041423 65%, #020a14 100%)'}}>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 55% at 20% 90%, rgba(13,65,85,.22), transparent 80%)'}} />
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sapphire-meteor" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#77bded" stopOpacity="0" />
          <stop offset=".6" stopColor="#a4d9ff" stopOpacity=".3" />
          <stop offset="1" stopColor="#eefaff" stopOpacity=".95" />
        </linearGradient>
      </defs>
      {Array.from({length: starCount}, (_, i) => {
        const x = random(i * 7 + 1) * width;
        const y = random(i * 11 + 2) * height;
        const bright = random(i * 3 + 9) > .9;
        const radius = bright ? 1.45 : .45 + random(i + 5) * .65;
        const twinkle = .68 + .32 * Math.sin(frame / Math.max(1,twinklePeriodFrames) * Math.PI * 2 + i * 1.7);
        const opacity = (bright ? .64 : .12 + random(i + 8) * .25) * twinkle;
        return <g key={i} opacity={opacity}>
          {bright && <circle cx={x} cy={y} r={4} fill="#7cc4f3" opacity={.3} style={{filter: 'blur(2px)'}} />}
          <circle cx={x} cy={y} r={radius} fill={bright ? '#c7e8ff' : '#88b6ce'} />
        </g>;
      })}
      {meteorStarts.map((start, i) => {
        const age = frame - start;
        if (age < 0 || age >= meteorDurationFrames) return null;
        const t = age / Math.max(1, meteorDurationFrames);
        const x = width * (.78 - .12 * (i % 3) - t * .25);
        const y = height * (.1 + .07 * (i % 2) + t * .16);
        const opacity = interpolate(t, [0,.18,.7,1], [0,.8,.6,0]);
        return <g key={start} opacity={opacity}>
          <line x1={x + width*.095} y1={y-height*.061} x2={x} y2={y}
            stroke="url(#sapphire-meteor)" strokeWidth={1.3} strokeLinecap="round" />
          <circle cx={x} cy={y} r={1.8} fill="#e3f7ff" style={{filter:'drop-shadow(0 0 5px #72c8ff)'}} />
        </g>;
      })}
    </svg>
  </AbsoluteFill>;
};
