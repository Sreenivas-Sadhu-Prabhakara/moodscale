/* ============================================================
   moodscale — engine.js
   The pure scoring core. Zero DOM, zero state. Imported by both
   app.js (browser) and test/*.test.js (Node). Every constant it
   uses is read from data/scales.js — nothing is duplicated.
   ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    const scales = require('./scales.js');
    module.exports = factory(scales);
  } else {
    // Browser: scales.js runs first as a classic script, so its top-level
    // const bindings (SCALES, BANDS, PHQ9, GAD7) share this lexical scope.
    root.MoodEngine = factory({
      SCALES: SCALES, BANDS: BANDS, PHQ9: PHQ9, GAD7: GAD7
    });
  }
})(typeof self !== 'undefined' ? self : this, function (data) {
  const { SCALES, BANDS } = data;

  /* Count the scored items a scale expects. */
  function scoredCount(scaleId) {
    return SCALES[scaleId].items.filter(function (it) { return it.scored; }).length;
  }

  /* scoreScale(scaleId, answers)
     answers: array indexed by scored-item position (0-based), each 0..3.
     Returns the integer total, or null if ANY scored item is missing /
     undefined / out of range. Never silently zero-fills or prorates.
     Unscored follow-up answers are ignored (they are not passed here). */
  function scoreScale(scaleId, answers) {
    const scale = SCALES[scaleId];
    if (!scale) return null;
    const n = scoredCount(scaleId);
    if (!Array.isArray(answers) || answers.length !== n) return null;
    let total = 0;
    for (let i = 0; i < n; i++) {
      const v = answers[i];
      if (v === undefined || v === null || typeof v !== 'number') return null;
      if (!Number.isInteger(v) || v < 0 || v > 3) return null;
      total += v;
    }
    return total;
  }

  /* Convenience wrappers used by the fixtures. */
  function scorePHQ9(answers) { return scoreScale('phq9', answers); }
  function scoreGAD7(answers) { return scoreScale('gad7', answers); }

  /* bandFor(scaleId, total) -> the matching band row {min,max,label,source}
     or null if the total is out of the instrument's range. Ranges are
     inclusive and read straight from BANDS. */
  function bandFor(scaleId, total) {
    if (typeof total !== 'number' || !Number.isInteger(total)) return null;
    const rows = BANDS[scaleId];
    if (!rows) return null;
    for (let i = 0; i < rows.length; i++) {
      if (total >= rows[i].min && total <= rows[i].max) return rows[i];
    }
    return null;
  }

  /* crisisFlag(scaleId, answers): true iff PHQ-9 item 9 (self-harm) >= 1.
     GAD-7 never sets it. Reads the crisis item position from the scale. */
  function crisisFlag(scaleId, answers) {
    const scale = SCALES[scaleId];
    if (!scale || scale.crisisItemOrder == null) return false;
    if (!Array.isArray(answers)) return false;
    const idx = scale.crisisItemOrder - 1; // orders are 1-based
    const v = answers[idx];
    return typeof v === 'number' && v >= 1;
  }

  /* ---------------- RFC-4180 CSV ---------------- */
  function csvField(s) {
    s = String(s == null ? '' : s);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  /* toCSV(headers, rows) -> RFC-4180 string. rows = array of arrays. */
  function toCSV(headers, rows) {
    const lines = [headers.map(csvField).join(',')];
    for (const r of rows) lines.push(r.map(csvField).join(','));
    return lines.join('\r\n');
  }

  /* parseCSV(text) -> array of arrays (RFC-4180: quotes, embedded
     commas/newlines, doubled quotes). Used by the round-trip test. */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', i = 0, inQ = false;
    while (i < text.length) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQ = false; i++; continue;
        }
        field += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++;
    }
    row.push(field); rows.push(row);
    return rows;
  }

  /* Stable sort of history entries by ISO timestamp (ascending). */
  function sortByTimestamp(entries) {
    return entries
      .map(function (e, i) { return { e: e, i: i }; })
      .sort(function (a, b) {
        if (a.e.ts < b.e.ts) return -1;
        if (a.e.ts > b.e.ts) return 1;
        return a.i - b.i; // stable
      })
      .map(function (x) { return x.e; });
  }

  /* Days since an ISO timestamp, floored, clamped at >= 0. */
  function daysSince(isoTs, nowMs) {
    const then = Date.parse(isoTs);
    if (isNaN(then)) return null;
    const ms = (nowMs == null ? Date.now() : nowMs) - then;
    return Math.max(0, Math.floor(ms / 86400000));
  }

  return {
    scoredCount: scoredCount,
    scoreScale: scoreScale,
    scorePHQ9: scorePHQ9,
    scoreGAD7: scoreGAD7,
    bandFor: bandFor,
    crisisFlag: crisisFlag,
    toCSV: toCSV,
    parseCSV: parseCSV,
    sortByTimestamp: sortByTimestamp,
    daysSince: daysSince
  };
});
