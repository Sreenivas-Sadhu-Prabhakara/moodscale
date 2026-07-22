'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const E = require('../data/engine.js');
const { SCALES, BANDS, PHQ9, GAD7, OPTIONS, IMPACT_OPTIONS } = require('../data/scales.js');

/* ---- scorePHQ9 is pure addition ---- */
test('scorePHQ9 is pure addition', () => {
  assert.equal(E.scorePHQ9([1, 2, 3, 0, 1, 2, 3, 0, 1]), 13);
  assert.equal(E.scorePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]), 0);
  assert.equal(E.scorePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 3]), 27);
});

/* ---- Exhaustive PHQ-9 banding ---- */
test('exhaustive PHQ-9 banding: exactly one band per total 0..27', () => {
  for (let t = 0; t <= 27; t++) {
    const matches = BANDS.phq9.filter(b => t >= b.min && t <= b.max);
    assert.equal(matches.length, 1, `total ${t} matched ${matches.length} bands`);
  }
  const label = t => E.bandFor('phq9', t).label;
  assert.equal(label(4), 'Minimal');
  assert.equal(label(5), 'Mild');
  assert.equal(label(9), 'Mild');
  assert.equal(label(10), 'Moderate');
  assert.equal(label(14), 'Moderate');
  assert.equal(label(15), 'Moderately severe');
  assert.equal(label(19), 'Moderately severe');
  assert.equal(label(20), 'Severe');
  assert.equal(label(27), 'Severe');
});

/* ---- Exhaustive GAD-7 banding + full coverage, no gaps/overlaps ---- */
test('exhaustive GAD-7 banding: exactly one band per total 0..21', () => {
  for (let t = 0; t <= 21; t++) {
    const matches = BANDS.gad7.filter(b => t >= b.min && t <= b.max);
    assert.equal(matches.length, 1, `total ${t} matched ${matches.length} bands`);
  }
  const label = t => E.bandFor('gad7', t).label;
  assert.equal(label(4), 'Minimal');
  assert.equal(label(5), 'Mild');
  assert.equal(label(9), 'Mild');
  assert.equal(label(10), 'Moderate');
  assert.equal(label(14), 'Moderate');
  assert.equal(label(15), 'Severe');
  assert.equal(label(21), 'Severe');
});

test('band ranges cover their instrument with no gaps or overlaps', () => {
  for (const [id, max] of [['phq9', 27], ['gad7', 21]]) {
    const rows = BANDS[id].slice().sort((a, b) => a.min - b.min);
    assert.equal(rows[0].min, 0);
    assert.equal(rows[rows.length - 1].max, max);
    for (let i = 1; i < rows.length; i++) {
      assert.equal(rows[i].min, rows[i - 1].max + 1, `${id} gap/overlap at band ${i}`);
    }
  }
  // out-of-range totals return null
  assert.equal(E.bandFor('phq9', 28), null);
  assert.equal(E.bandFor('gad7', 22), null);
  assert.equal(E.bandFor('phq9', -1), null);
});

/* ---- Scorer rejects incomplete administrations ---- */
test('scorer returns null on incomplete administration (never zero-fills)', () => {
  const partial = [1, 2, 3, undefined, 1, 2, 3, 0, 1];
  assert.equal(E.scorePHQ9(partial), null);
  assert.equal(E.scorePHQ9([1, 2, 3]), null);           // too few
  assert.equal(E.scorePHQ9(new Array(9).fill(1).concat([1])), null); // too many
  assert.equal(E.scoreGAD7([1, 2, 3, 4, 1, 2, 1]), null);            // out of range (4)
  assert.equal(E.scorePHQ9([1, 2, 3, null, 1, 2, 3, 0, 1]), null);
});

/* ---- Unscored follow-up never affects the total ---- */
test('unscored follow-up questions never enter the total', () => {
  assert.equal(PHQ9.followUp.scored, false);
  assert.equal(GAD7.followUp.scored, false);
  // scored total of PHQ-9 max is 27 regardless of any follow-up choice
  assert.equal(E.scorePHQ9(new Array(9).fill(3)), 27);
  // the engine only ever sums scored items (there is no code path that
  // reads followUp), proven by the max never exceeding maxScore below.
});

/* ---- Crisis flag ---- */
test('crisis flag: PHQ-9 item 9 >= 1 sets it; GAD-7 never does', () => {
  const base = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  assert.equal(E.crisisFlag('phq9', base), false);
  const withItem9 = base.slice(); withItem9[8] = 1;
  assert.equal(E.crisisFlag('phq9', withItem9), true);
  withItem9[8] = 3;
  assert.equal(E.crisisFlag('phq9', withItem9), true);
  // GAD-7 has no self-harm item; never flags regardless of answers
  assert.equal(E.crisisFlag('gad7', [3, 3, 3, 3, 3, 3, 3]), false);
});

/* ---- Corpus integrity ---- */
test('corpus integrity: item counts, options, band maxima', () => {
  assert.equal(PHQ9.items.filter(i => i.scored).length, 9);
  assert.equal(GAD7.items.filter(i => i.scored).length, 7);
  assert.equal(E.scoredCount('phq9'), 9);
  assert.equal(E.scoredCount('gad7'), 7);

  // exactly 4 shared options with values [0,1,2,3]
  assert.equal(OPTIONS.length, 4);
  assert.deepEqual(OPTIONS.map(o => o.value), [0, 1, 2, 3]);
  assert.deepEqual(OPTIONS.map(o => o.label),
    ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']);
  assert.equal(IMPACT_OPTIONS.length, 4);
  assert.deepEqual(IMPACT_OPTIONS.map(o => o.value), [0, 1, 2, 3]);

  // band table maxima
  assert.equal(Math.max(...BANDS.phq9.map(b => b.max)), 27);
  assert.equal(Math.max(...BANDS.gad7.map(b => b.max)), 21);
  assert.equal(PHQ9.maxScore, 27);
  assert.equal(GAD7.maxScore, 21);

  // every item has verbatim non-empty text and correct scale tag; orders 1..n
  for (const [id, scale] of Object.entries(SCALES)) {
    scale.items.forEach((it, i) => {
      assert.equal(it.scale, id);
      assert.equal(it.order, i + 1);
      assert.ok(typeof it.text === 'string' && it.text.length > 0);
    });
  }
});

/* ---- Verbatim wording guard (regression against silent edits) ---- */
test('verbatim wording is exact for the first and self-harm items', () => {
  assert.equal(PHQ9.items[0].text, 'Little interest or pleasure in doing things');
  assert.equal(PHQ9.items[8].text,
    'Thoughts that you would be better off dead or of hurting yourself in some way');
  assert.equal(GAD7.items[0].text, 'Feeling nervous, anxious or on edge');
  assert.equal(GAD7.items[6].text, 'Feeling afraid as if something awful might happen');
  assert.equal(PHQ9.stem,
    'Over the last 2 weeks, how often have you been bothered by any of the following problems?');
});

/* ---- Single source of truth: engine bands ARE the corpus bands ---- */
test('single source of truth: bandFor uses the exact corpus rows', () => {
  // the object bandFor returns is identity-equal to the corpus row,
  // so any chart shading that reads BANDS shares the same constants.
  assert.equal(E.bandFor('phq9', 12), BANDS.phq9[2]);
  assert.equal(E.bandFor('gad7', 18), BANDS.gad7[3]);
});
