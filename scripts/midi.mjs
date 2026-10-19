// Strict SMF format 0/1 reader. PPQN timing and tempo map; no inferred hand/layout.
export function parseMidi(buffer) {
  let offset = 0;
  const fail = (message) => { throw new Error(`MIDI: ${message}`); };
  const readChunk = (expected) => {
    if (offset + 8 > buffer.length) fail(`missing ${expected} chunk`);
    const tag = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if (tag !== expected || length > buffer.length - offset) fail(`invalid/truncated ${expected} chunk`);
    const chunk = buffer.subarray(offset, offset + length);
    offset += length;
    return chunk;
  };
  const header = readChunk('MThd');
  if (header.length !== 6) fail('header must have length 6');
  const format = header.readUInt16BE(0), tracks = header.readUInt16BE(2), ppqn = header.readUInt16BE(4);
  if (![0, 1].includes(format)) fail('only synchronous SMF formats 0 and 1 are supported');
  if (!tracks || (format === 0 && tracks !== 1)) fail('invalid track count');
  if (!ppqn || ppqn & 0x8000) fail('only positive PPQN division is supported (no SMPTE)');
  const tempos = [], notes = [];
  let endTick = 0;
  for (let track = 0; track < tracks; track++) {
    const data = readChunk('MTrk');
    let p = 0, tick = 0, running = null, ended = false;
    const active = new Map();
    const byte = () => { if (p >= data.length) fail(`truncated track ${track}`); return data[p++]; };
    const vlq = () => {
      let value = 0;
      for (let i = 0; i < 4; i++) { const b = byte(); value = value * 128 + (b & 127); if (!(b & 128)) return value; }
      fail('VLQ longer than four bytes');
    };
    const skip = (length) => { if (length > data.length - p) fail('truncated event payload'); p += length; };
    const datum = () => { const value = byte(); if (value > 127) fail('channel data byte has status bit'); return value; };
    while (p < data.length) {
      tick += vlq();
      if (!Number.isSafeInteger(tick)) fail('tick exceeds safe integer range');
      let status = byte();
      if (status < 128) { if (running === null) fail('running status without channel status'); p--; status = running; }
      else running = status < 0xf0 ? status : null;
      if (status === 0xff) {
        const type = byte(), length = vlq();
        if (type === 0x51) {
          if (length !== 3 || p + 3 > data.length) fail('invalid tempo event');
          const microsecondsPerQuarter = data.readUIntBE(p, 3);
          if (!microsecondsPerQuarter) fail('tempo must be positive');
          tempos.push({ tick, microsecondsPerQuarter });
        }
        skip(length);
        if (type === 0x2f) { if (length !== 0 || p !== data.length) fail('invalid end-of-track'); ended = true; break; }
      } else if (status === 0xf0 || status === 0xf7) skip(vlq());
      else if (status >= 0x80 && status <= 0xef) {
        const kind = status >> 4, channel = status & 15;
        const a = datum(), b = kind === 0xc || kind === 0xd ? 0 : datum();
        const key = `${channel}:${a}`;
        if (kind === 9 && b > 0) {
          const queue = active.get(key) || [];
          queue.push({ track, channel, pitch: a, velocity: b, startTick: tick }); active.set(key, queue);
        } else if (kind === 8 || (kind === 9 && b === 0)) {
          const queue = active.get(key);
          if (!queue?.length) fail(`unmatched note-off in track ${track}, channel ${channel}, pitch ${a}`);
          notes.push({ ...queue.shift(), endTick: tick });
          if (!queue.length) active.delete(key);
        }
      } else fail(`unsupported system status 0x${status.toString(16)}`);
    }
    if (!ended) fail(`track ${track} has no end-of-track event`);
    if (active.size) fail(`track ${track} contains notes without note-off`);
    endTick = Math.max(endTick, tick);
  }
  if (offset !== buffer.length) fail('unexpected trailing chunks/bytes');
  tempos.sort((a, b) => a.tick - b.tick);
  const tempoMap = [{ tick: 0, microsecondsPerQuarter: 500000, seconds: 0 }];
  let priorExplicit = null;
  for (const tempo of tempos) {
    if (priorExplicit?.tick === tempo.tick && priorExplicit.microsecondsPerQuarter !== tempo.microsecondsPerQuarter) fail('conflicting tempo events at the same tick');
    const previous = tempoMap.at(-1);
    const seconds = previous.seconds + (tempo.tick - previous.tick) * previous.microsecondsPerQuarter / ppqn / 1e6;
    const segment = { ...tempo, seconds };
    if (previous.tick === tempo.tick) tempoMap[tempoMap.length - 1] = segment;
    else tempoMap.push(segment);
    priorExplicit = tempo;
  }
  const secondsAt = (tick) => {
    let lo = 0, hi = tempoMap.length - 1;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (tempoMap[mid].tick <= tick) lo = mid; else hi = mid - 1; }
    const segment = tempoMap[lo];
    return segment.seconds + (tick - segment.tick) * segment.microsecondsPerQuarter / ppqn / 1e6;
  };
  const timed = notes.sort((a, b) => a.startTick - b.startTick || a.track - b.track || a.pitch - b.pitch).map((note) => {
    const startSeconds = secondsAt(note.startTick), endSeconds = secondsAt(note.endTick);
    return { ...note, startSeconds, endSeconds, durationSeconds: endSeconds - startSeconds };
  });
  return { schemaVersion: 1, status: 'needs_review', source: 'standard-midi-file', format, ppqn,
    durationSeconds: secondsAt(endTick), tempoMap, notes: timed,
    limitations: ['Key attack/release timing only; sustain pedal is not applied.',
      'No hand assignment, score coordinates or alignment to performance audio is inferred.',
      'Overlapping same-channel/pitch notes within a track are paired FIFO; cross-track note pairs are unsupported.'] };
}
