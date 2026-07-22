'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const E = require('../data/engine.js');
const { SCALES, BANDS } = require('../data/scales.js');
const { HELPLINES } = require('../data/helplines.js');

const BUILD_DATE = '2026-07-22';

/* ---- Helpline integrity ---- */
test('every helpline has required fields and a parseable verified_on <= build date', () => {
  assert.ok(HELPLINES.length >= 12, 'expected at least 12 helplines');
  const buildMs = Date.parse(BUILD_DATE);
  for (const h of HELPLINES) {
    for (const f of ['country', 'service', 'phone', 'official_url', 'source_url', 'verified_on']) {
      assert.ok(typeof h[f] === 'string' && h[f].length > 0, `${h.service || '?'} missing ${f}`);
    }
    const v = Date.parse(h.verified_on);
    assert.ok(!isNaN(v), `${h.service} verified_on not a date`);
    assert.ok(v <= buildMs, `${h.service} verified_on is after build date`);
    assert.ok(/^https?:\/\//.test(h.official_url), `${h.service} official_url not a url`);
    assert.ok(/^https?:\/\//.test(h.source_url), `${h.service} source_url not a url`);
  }
});

test('India-first: the first helpline entries are Indian', () => {
  assert.equal(HELPLINES[0].iso2, 'IN');
  const india = HELPLINES.filter(h => h.iso2 === 'IN');
  assert.ok(india.length >= 4, 'expected at least 4 India entries');
  // Tele-MANAS 14416 present and correct
  const tm = HELPLINES.find(h => h.phone === '14416');
  assert.ok(tm, 'Tele-MANAS 14416 present');
  assert.match(tm.official_url, /telemanas\.mohfw\.gov\.in/);
});

/* ---- Every band row carries a source (provenance is mandatory) ---- */
test('every severity band row carries a non-empty source', () => {
  for (const id of ['phq9', 'gad7']) {
    for (const b of BANDS[id]) {
      assert.ok(typeof b.source === 'string' && b.source.length > 0, `${id} band missing source`);
      assert.equal(typeof b.label, 'string');
      assert.ok(b.min <= b.max);
    }
  }
});

/* ---- CSV round-trip (RFC-4180) ---- */
test('CSV round-trips history with commas, quotes and newlines', () => {
  const headers = ['ts', 'scale', 'total', 'band', 'note'];
  const rows = [
    ['2026-07-01T09:00:00.000Z', 'phq9', 13, 'Moderate', 'felt "off", tired'],
    ['2026-07-08T09:00:00.000Z', 'gad7', 6, 'Mild', 'line one\nline two'],
    ['2026-07-15T09:00:00.000Z', 'phq9', 2, 'Minimal', 'ok, calm']
  ];
  const csv = E.toCSV(headers, rows);
  const parsed = E.parseCSV(csv);
  assert.equal(parsed[0].join('|'), headers.join('|'));
  assert.equal(parsed.length, rows.length + 1);
  // values survive quoting exactly (parsed cells are strings)
  assert.equal(parsed[1][4], 'felt "off", tired');
  assert.equal(parsed[2][4], 'line one\nline two');
  assert.equal(parsed[3][2], '2');
});

/* ---- History sorts stably by ISO timestamp ---- */
test('history sorts stably by ISO timestamp', () => {
  const entries = [
    { ts: '2026-07-15T00:00:00.000Z', id: 'c' },
    { ts: '2026-07-01T00:00:00.000Z', id: 'a' },
    { ts: '2026-07-01T00:00:00.000Z', id: 'b' }, // same ts as 'a' -> keep order
    { ts: '2026-07-08T00:00:00.000Z', id: 'x' }
  ];
  const sorted = E.sortByTimestamp(entries);
  assert.deepEqual(sorted.map(e => e.id), ['a', 'b', 'x', 'c']);
});

test('daysSince floors and clamps at zero', () => {
  const now = Date.parse('2026-07-22T12:00:00.000Z');
  assert.equal(E.daysSince('2026-07-20T12:00:00.000Z', now), 2);
  assert.equal(E.daysSince('2026-07-22T13:00:00.000Z', now), 0); // future -> clamped
  assert.equal(E.daysSince('not-a-date', now), null);
});

/* ---- Property/fuzz: scored total is always in [0, maxScore] and
   equals the arithmetic sum; band always matches for valid totals ---- */
test('property fuzz: 5000 random administrations score correctly and band', () => {
  let seed = 0x9e3779b1 >>> 0;
  const rnd = () => { // mulberry32
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let k = 0; k < 5000; k++) {
    const id = rnd() < 0.5 ? 'phq9' : 'gad7';
    const n = E.scoredCount(id);
    const ans = [];
    let expected = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(rnd() * 4); // 0..3
      ans.push(v); expected += v;
    }
    const total = E.scoreScale(id, ans);
    assert.equal(total, expected);
    assert.ok(total >= 0 && total <= SCALES[id].maxScore);
    const band = E.bandFor(id, total);
    assert.ok(band && total >= band.min && total <= band.max);
    assert.ok(!Number.isNaN(total));
  }
});

test('property fuzz: any single out-of-range or missing answer yields null', () => {
  for (const id of ['phq9', 'gad7']) {
    const n = E.scoredCount(id);
    for (let pos = 0; pos < n; pos++) {
      const ans = new Array(n).fill(0);
      ans[pos] = 4; // out of range
      assert.equal(E.scoreScale(id, ans), null);
      const ans2 = new Array(n).fill(0);
      ans2[pos] = undefined;
      assert.equal(E.scoreScale(id, ans2), null);
    }
  }
});
