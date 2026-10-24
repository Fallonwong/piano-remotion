import type {ScoreAttack} from './ScoreNoteLeap';

type Point = {x: number; y: number};
export type ChordFlightGeometry = {
  heads: Point[];
  tails: Point[][];
  segments: {p1: Point; p2: Point; t: number}[];
};

// Geometric ordering only: this does not infer pitches, voices or hand assignments.
const notesOf = (e: ScoreAttack): Point[] => {
  const notes = e.notes ?? [e];
  return [...new Map(notes.map(n => [`${n.x}:${n.y}`, {x: n.x, y: n.y}])).values()]
    .sort((a, b) => a.y - b.y || a.x - b.x);
};
const connected = (a: ScoreAttack, b: ScoreAttack) => {
  const sa = (a as ScoreAttack & {systemId?: string | number}).systemId;
  const sb = (b as ScoreAttack & {systemId?: string | number}).systemId;
  return !(sa !== undefined && sb !== undefined && sa !== sb)
    && b.x >= a.x - 200 && Math.abs(b.y - a.y) <= 200;
};
const pairsOf = (a: Point[], b: Point[]) => {
  if (!a.length || !b.length) return [];
  const count = Math.max(a.length, b.length);
  return Array.from({length: count}, (_, i) => ({
    a: a[count === 1 ? 0 : Math.round(i * (a.length - 1) / (count - 1))],
    b: b[count === 1 ? 0 : Math.round(i * (b.length - 1) / (count - 1))],
  }));
};
const position = (a: Point, b: Point, t: number, arc: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t - 4 * arc * t * (1 - t),
});
// Once incoming cores touch, render ONE fused core/glow at their centroid.
// Apply the same position to the tail tips, so both paths truly join that core.
const flightPoints = (pairs: ReturnType<typeof pairsOf>, t: number, arc: number, fusionDistance: number) => {
  const points = pairs.map(p => position(p.a, p.b, t, arc));
  const targets = new Map<Point, number[]>();
  pairs.forEach((p, i) => targets.set(p.b, [...(targets.get(p.b) ?? []), i]));
  for (const indices of targets.values()) {
    if (indices.length < 2) continue;
    const diameter = Math.max(...indices.flatMap(i => indices.map(j => Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y))));
    if (diameter > fusionDistance) continue;
    const center = {x: indices.reduce((sum, i) => sum + points[i].x, 0) / indices.length,
      y: indices.reduce((sum, i) => sum + points[i].y, 0) / indices.length};
    indices.forEach(i => {points[i] = center;});
  }
  return points;
};

/** One path per chord branch. Split/merge at real noteheads; never bridge a line break.
 * Tail age is global, so incoming branches survive a merge and fade out naturally.
 * Inputs are ordered attacks for ONE hand, with all coordinates in score pixels.
 */
export const scoreChordGeometry = (
  events: ScoreAttack[] = [], frame = 0, arcHeight = 42, trailFrames = 16, fusionDistance = 18,
): ChordFlightGeometry => {
  const result: ChordFlightGeometry = {heads: [], tails: [], segments: []};
  if (!events.length || frame < events[0].frame) return result;
  let current = events.findIndex(e => e.frame > frame);
  current = current < 0 ? events.length - 1 : current - 1;
  const a = events[current], b = events[current + 1];
  if (!b || frame === a.frame) result.heads = notesOf(a);
  else if (connected(a, b)) {
    const t = (frame - a.frame) / (b.frame - a.frame);
    const points = flightPoints(pairsOf(notesOf(a), notesOf(b)), t, arcHeight, fusionDistance);
    result.heads = [...new Map(points.map(p => [`${p.x}:${p.y}`, p])).values()];
  }
  if (trailFrames <= 0) return result;
  const start = frame - trailFrames;
  for (let i = current; i >= 0; i--) {
    // Stop after the first segment crossing the start of the visible tail window.
    const from = events[i], to = events[i + 1];
    if (to && !connected(from, to)) break;
    if (to && to.frame > start && connected(from, to)) {
      const lo = Math.max(start, from.frame), hi = Math.min(frame, to.frame);
      const pairs = pairsOf(notesOf(from), notesOf(to));
      if (hi > lo) for (let branch = 0; branch < pairs.length; branch++) {
        const count = Math.max(2, Math.ceil((hi - lo) * 3) + 1);
        const tail: Point[] = [];
        for (let j = 0; j < count; j++) {
          const time = lo + (hi - lo) * j / (count - 1);
          const p = flightPoints(pairs, (time - from.frame) / (to.frame - from.frame), arcHeight, fusionDistance)[branch];
          if (j) result.segments.push({p1: tail[j - 1], p2: p,
            t: Math.max(0, Math.min(1, (time - (hi - lo) / (count - 1) / 2 - start) / trailFrames))});
          tail.push(p);
        }
        result.tails.push(tail);
      }
    }
    if (from.frame <= start) break;
  }
  // Shared portions after fusion must not get a second layer of brightness.
  result.segments = [...new Map(result.segments.map(s => [
    `${s.p1.x}:${s.p1.y}:${s.p2.x}:${s.p2.y}:${s.t}`, s,
  ])).values()];
  return result;
};
