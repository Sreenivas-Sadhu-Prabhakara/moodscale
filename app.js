/* ============================================================
   moodscale — app.js
   All DOM wiring and rendering. No inline handlers (CSP forbids
   them). Pure scoring logic lives in data/engine.js. Corpus lives
   in data/scales.js and data/helplines.js. Everything is same-origin
   and stays in localStorage.
   ============================================================ */
'use strict';

(function () {
  var E = window.MoodEngine;         // from data/engine.js
  var SC = SCALES;                    // lexical global from data/scales.js
  var BD = BANDS;
  var OPT = OPTIONS;
  var IMPACT = IMPACT_OPTIONS;
  var LINES = HELPLINES;              // lexical global from data/helplines.js

  var LS_HISTORY = 'moodscale.history.v1';
  var LS_COUNTRY = 'moodscale.country.v1';

  /* ---------- tiny DOM helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function show(node) { node.hidden = false; }
  function hide(node) { node.hidden = true; }

  /* ---------- state ---------- */
  var state = {
    scaleId: null,        // 'phq9' | 'gad7'
    answers: [],          // scored-item answers (0..3 or undefined)
    impact: undefined,    // unscored follow-up
    lastResult: null      // {scaleId, total, band, ts}
  };

  /* ---------- history persistence ---------- */
  function loadHistory() {
    try {
      var raw = localStorage.getItem(LS_HISTORY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveHistory(arr) {
    try { localStorage.setItem(LS_HISTORY, JSON.stringify(arr)); } catch (e) { /* quota */ }
  }

  /* ---------- questionnaire rendering ---------- */
  function startScale(scaleId) {
    state.scaleId = scaleId;
    state.answers = new Array(E.scoredCount(scaleId));
    state.impact = undefined;
    var scale = SC[scaleId];

    $('quizHeading').textContent = scale.title;
    $('quizStem').textContent = scale.stem;

    var items = $('items');
    items.innerHTML = '';
    scale.items.forEach(function (item, idx) {
      var li = el('li', 'item');
      li.setAttribute('role', 'group');
      li.setAttribute('aria-labelledby', 'itemlabel-' + idx);

      var head = el('div', 'item__head');
      var num = el('span', 'item__num', String(item.order));
      var label = el('span', 'item__text');
      label.id = 'itemlabel-' + idx;
      label.textContent = item.text;
      head.appendChild(num);
      head.appendChild(label);
      li.appendChild(head);

      var opts = el('div', 'opts');
      opts.setAttribute('role', 'radiogroup');
      opts.setAttribute('aria-labelledby', 'itemlabel-' + idx);
      OPT.forEach(function (o) {
        var b = el('button', 'opt');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', 'false');
        b.dataset.item = String(idx);
        b.dataset.value = String(o.value);
        var v = el('span', 'opt__val', String(o.value));
        var t = el('span', 'opt__label', o.label);
        b.appendChild(v);
        b.appendChild(t);
        opts.appendChild(b);
      });
      li.appendChild(opts);
      items.appendChild(li);
    });

    // follow-up (unscored)
    $('followupText').textContent = scale.followUp.text;
    var fo = $('followupOpts');
    fo.innerHTML = '';
    IMPACT.forEach(function (o) {
      var b = el('button', 'opt');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.dataset.impact = String(o.value);
      b.appendChild(el('span', 'opt__label', o.label));
      fo.appendChild(b);
    });

    updateProgress();
    hide($('result'));
    show($('quiz'));
    $('quizHeading').setAttribute('tabindex', '-1');
    $('quizHeading').focus();
    $('quiz').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function updateProgress() {
    var n = state.answers.length;
    var done = state.answers.filter(function (a) { return a !== undefined; }).length;
    $('quizProgress').textContent = done + ' of ' + n + ' answered';
    $('scoreBtn').disabled = (done !== n);
  }

  /* click delegation for option buttons */
  function onQuizClick(ev) {
    var b = ev.target.closest('.opt');
    if (!b) return;
    if (b.dataset.item !== undefined) {
      var idx = parseInt(b.dataset.item, 10);
      var val = parseInt(b.dataset.value, 10);
      state.answers[idx] = val;
      // update radios in this group
      var group = b.parentNode;
      Array.prototype.forEach.call(group.querySelectorAll('.opt'), function (o) {
        var on = (o === b);
        o.classList.toggle('opt--on', on);
        o.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      updateProgress();
    } else if (b.dataset.impact !== undefined) {
      state.impact = parseInt(b.dataset.impact, 10);
      var g = b.parentNode;
      Array.prototype.forEach.call(g.querySelectorAll('.opt'), function (o) {
        var on = (o === b);
        o.classList.toggle('opt--on', on);
        o.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
  }

  /* keyboard: arrow keys move within a radiogroup */
  function onQuizKey(ev) {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' &&
        ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
    var b = ev.target.closest('.opt');
    if (!b) return;
    ev.preventDefault();
    var group = b.parentNode;
    var opts = Array.prototype.slice.call(group.querySelectorAll('.opt'));
    var i = opts.indexOf(b);
    var next = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown')
      ? (i + 1) % opts.length : (i - 1 + opts.length) % opts.length;
    opts[next].focus();
    opts[next].click();
  }

  /* ---------- scoring / result ---------- */
  function onScore(ev) {
    ev.preventDefault();
    var total = E.scoreScale(state.scaleId, state.answers);
    if (total === null) {
      $('quizProgress').textContent = 'Please answer every question — no answer is assumed.';
      return;
    }
    var band = E.bandFor(state.scaleId, total);
    var crisis = E.crisisFlag(state.scaleId, state.answers);
    var ts = new Date().toISOString();

    // persist
    var hist = loadHistory();
    hist.push({
      ts: ts,
      scale: state.scaleId,
      total: total,
      band: band.label,
      answers: state.answers.slice(),
      impact: state.impact
    });
    saveHistory(hist);
    state.lastResult = { scaleId: state.scaleId, total: total, band: band, ts: ts };

    // crisis panel ABOVE the score, unskippable, for PHQ-9 item-9 >= 1
    if (crisis) { openCrisis(true); }

    renderResult();
    renderHistory();
    hide($('quiz'));
  }

  function renderResult() {
    var r = state.lastResult;
    var scale = SC[r.scaleId];
    $('resultHeading').textContent = scale.name + ' result';
    $('resultTotal').textContent = String(r.total);
    $('resultMax').textContent = '/ ' + scale.maxScore;
    var chip = $('resultBand');
    chip.textContent = r.band.label;
    chip.dataset.band = slug(r.band.label);
    $('resultCite').textContent = 'Published band — ' + r.band.source;

    renderRuler(r.scaleId, r.total, r.band);

    $('rulerCap').textContent =
      scale.name + ' score ' + r.total + ' of ' + scale.maxScore +
      ' falls in the published "' + r.band.label + '" band.';

    show($('result'));
    $('resultHeading').setAttribute('tabindex', '-1');
    $('resultHeading').focus();
    if (!$('crisisModal').hidden) {
      // if crisis modal open, keep focus there; result stays below
    } else {
      $('result').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  /* the graduated-band motif: an inline-SVG ruler with band segments
     and one oxblood marker at the score position. */
  function renderRuler(scaleId, total, band) {
    var rows = BD[scaleId];
    var max = SC[scaleId].maxScore;
    var W = 100, H = 16;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
    // band segments as graduated fills (lightness step, not hue — a11y safe)
    rows.forEach(function (b, i) {
      var x0 = (b.min / (max + 1)) * W;
      var x1 = ((b.max + 1) / (max + 1)) * W;
      var lift = (i / (rows.length - 1)); // 0..1 darkness ramp
      svg += '<rect x="' + x0.toFixed(2) + '" y="4" width="' + (x1 - x0).toFixed(2) +
        '" height="8" class="seg" fill-opacity="' + (0.16 + 0.6 * lift).toFixed(3) + '"/>';
    });
    // hairline ticks every unit
    for (var t = 0; t <= max + 1; t++) {
      var x = (t / (max + 1)) * W;
      var major = (t % 5 === 0);
      svg += '<line x1="' + x.toFixed(2) + '" x2="' + x.toFixed(2) +
        '" y1="' + (major ? 1 : 3) + '" y2="' + (major ? 15 : 13) +
        '" class="tick ' + (major ? 'tick--major' : '') + '"/>';
    }
    // the single oxblood score marker
    var mx = ((total + 0.5) / (max + 1)) * W;
    svg += '<line x1="' + mx.toFixed(2) + '" x2="' + mx.toFixed(2) +
      '" y1="0" y2="16" class="marker"/>';
    svg += '<circle cx="' + mx.toFixed(2) + '" cy="8" r="2.4" class="marker-dot"/>';
    svg += '</svg>';
    $('rulerTrack').innerHTML = svg;
    $('rulerTrack').setAttribute('aria-label',
      SC[scaleId].name + ' graduated band, marker at ' + total + ' of ' + max + ', ' + band.label + ' band.');
  }

  /* ---------- history + trend ---------- */
  var historyScale = 'phq9';
  function renderHistory() {
    var hist = E.sortByTimestamp(loadHistory());
    if (hist.length === 0) { hide($('history')); return; }
    show($('history'));

    // tabs reflect selection
    $('tabPHQ9').setAttribute('aria-selected', historyScale === 'phq9' ? 'true' : 'false');
    $('tabGAD7').setAttribute('aria-selected', historyScale === 'gad7' ? 'true' : 'false');
    $('tabPHQ9').classList.toggle('htab--on', historyScale === 'phq9');
    $('tabGAD7').classList.toggle('htab--on', historyScale === 'gad7');

    var forScale = hist.filter(function (h) { return h.scale === historyScale; });
    renderTrend(historyScale, forScale);

    var body = $('historyBody');
    body.innerHTML = '';
    // newest first in the table
    hist.slice().reverse().forEach(function (h) {
      var tr = el('tr');
      tr.appendChild(el('td', null, fmtDate(h.ts)));
      tr.appendChild(el('td', null, SC[h.scale].name));
      var scoreCell = el('td', 'num', h.total + ' / ' + SC[h.scale].maxScore);
      tr.appendChild(scoreCell);
      var bandCell = el('td');
      var chip = el('span', 'bandchip bandchip--sm', h.band);
      chip.dataset.band = slug(h.band);
      bandCell.appendChild(chip);
      tr.appendChild(bandCell);
      var act = el('td', 'act');
      var del = el('button', 'linkbtn', 'Delete');
      del.type = 'button';
      del.dataset.ts = h.ts;
      del.setAttribute('aria-label', 'Delete the ' + SC[h.scale].name + ' entry from ' + fmtDate(h.ts));
      act.appendChild(del);
      tr.appendChild(act);
      body.appendChild(tr);
    });
  }

  function renderTrend(scaleId, entries) {
    var max = SC[scaleId].maxScore;
    var rows = BD[scaleId];
    var W = 320, H = 120, padL = 26, padB = 18, padT = 8, padR = 8;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="' + SC[scaleId].name + ' scores over time">';
    // band background shading (SAME cutoffs as the scorer, via BANDS)
    rows.forEach(function (b, i) {
      var y0 = padT + plotH * (1 - (b.max + 1) / (max + 1));
      var y1 = padT + plotH * (1 - b.min / (max + 1));
      var lift = (i / (rows.length - 1));
      svg += '<rect x="' + padL + '" y="' + y0.toFixed(2) + '" width="' + plotW +
        '" height="' + (y1 - y0).toFixed(2) + '" class="seg" fill-opacity="' +
        (0.10 + 0.34 * lift).toFixed(3) + '"/>';
    });
    // axis
    svg += '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + plotH) + '" class="axis"/>';
    svg += '<text x="2" y="' + (padT + 6) + '" class="axlab">' + max + '</text>';
    svg += '<text x="6" y="' + (padT + plotH) + '" class="axlab">0</text>';

    if (entries.length > 0) {
      var pts = entries.map(function (h, i) {
        var x = entries.length === 1 ? padL + plotW / 2
          : padL + plotW * (i / (entries.length - 1));
        var y = padT + plotH * (1 - h.total / max);
        return [x, y];
      });
      if (pts.length > 1) {
        var d = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        svg += '<path d="' + d + '" class="trendline"/>';
      }
      pts.forEach(function (p) {
        svg += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" class="trenddot"/>';
      });
    }
    svg += '</svg>';
    var chart = $('trendChart');
    if (entries.length === 0) {
      chart.innerHTML = '<p class="trend__empty">No ' + SC[scaleId].name + ' check-ins yet.</p>';
    } else {
      chart.innerHTML = svg;
    }
  }

  function fmtDate(iso) {
    // ISO YYYY-MM-DD portion, locale-neutral
    return iso.slice(0, 10);
  }

  function onHistoryClick(ev) {
    var del = ev.target.closest('button[data-ts]');
    if (!del) return;
    var ts = del.dataset.ts;
    var hist = loadHistory().filter(function (h) { return h.ts !== ts; });
    saveHistory(hist);
    renderHistory();
  }

  /* ---------- CSV export ---------- */
  function onExportCsv() {
    var hist = E.sortByTimestamp(loadHistory());
    var headers = ['timestamp', 'scale', 'score', 'max', 'band', 'item_answers', 'functional_impact'];
    var rows = hist.map(function (h) {
      return [
        h.ts, SC[h.scale].name, h.total, SC[h.scale].maxScore, h.band,
        (h.answers || []).join(' '),
        (h.impact == null ? '' : h.impact)
      ];
    });
    var csv = E.toCSV(headers, rows);
    downloadText(csv, 'moodscale-history.csv', 'text/csv');
  }

  function downloadText(text, name, mime) {
    // data: URL download — no network, satisfies CSP img/default-src 'self'
    // (anchor download of a blob/data URL is a same-doc navigation, allowed)
    var blob = new Blob([text], { type: mime + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- print (build per-item detail then print) ---------- */
  function onPrint() {
    var r = state.lastResult;
    if (!r) { window.print(); return; }
    var scale = SC[r.scaleId];
    var hist = loadHistory().filter(function (h) { return h.scale === r.scaleId; });
    var latest = hist[hist.length - 1];
    var wrap = $('printDetail');
    wrap.innerHTML = '';
    var h = el('h2', 'printdetail__h', scale.title);
    wrap.appendChild(h);
    wrap.appendChild(el('p', 'printdetail__meta',
      'Completed ' + fmtDate(r.ts) + ' — score ' + r.total + ' / ' + scale.maxScore +
      ' (' + r.band.label + '). Screening only; not a diagnosis.'));
    var ol = el('ol', 'printdetail__items');
    scale.items.forEach(function (item, i) {
      var li = el('li');
      var a = latest && latest.answers ? latest.answers[i] : undefined;
      var lab = a == null ? '—' : (a + ' · ' + OPT[a].label);
      var strong = item.order === scale.crisisItemOrder ? ' (self-harm item)' : '';
      li.textContent = item.order + '. ' + item.text + strong + '  →  ' + lab;
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    window.print();
  }

  /* ---------- crisis modal ---------- */
  var lastFocus = null;
  function openCrisis(fromScore) {
    lastFocus = document.activeElement;
    var lines = $('crisisLines');
    lines.innerHTML = '';
    // show the user's country selection first if chosen, else India-first
    var country = getCountry();
    var chosen = LINES.filter(function (l) { return l.country === country; });
    var rest = LINES.filter(function (l) { return l.country !== country; });
    (chosen.concat(rest)).slice(0, 6).forEach(function (l) {
      lines.appendChild(helplineLi(l));
    });
    var modal = $('crisisModal');
    show(modal);
    document.body.classList.add('modal-open');
    $('crisisAck').focus();
    // fromScore: it's unskippable-by-design; ack button is the only way out
  }
  function closeCrisis() {
    hide($('crisisModal'));
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function trapKey(ev) {
    if ($('crisisModal').hidden) return;
    if (ev.key === 'Tab') {
      var f = $('crisisModal').querySelectorAll('a[href],button:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    }
    // Escape intentionally does NOT close the crisis panel — must acknowledge.
  }

  /* ---------- helplines directory ---------- */
  function getCountry() {
    try { return localStorage.getItem(LS_COUNTRY) || guessCountry(); }
    catch (e) { return guessCountry(); }
  }
  function guessCountry() {
    // best-effort, offline: derive from locale region; default India-first.
    try {
      var loc = (navigator.language || 'en-IN');
      var region = loc.split('-')[1];
      var byIso = {};
      LINES.forEach(function (l) { byIso[l.iso2] = l.country; });
      if (region && byIso[region.toUpperCase()]) return byIso[region.toUpperCase()];
    } catch (e) {}
    return 'India';
  }
  function helplineLi(l) {
    var li = el('li', 'helpitem');
    var top = el('div', 'helpitem__top');
    top.appendChild(el('span', 'helpitem__country', l.country));
    top.appendChild(el('span', 'helpitem__verified', 'verified ' + l.verified_on));
    li.appendChild(top);
    li.appendChild(el('div', 'helpitem__service', l.service));
    var phones = el('div', 'helpitem__phones');
    var p = el('span', 'helpitem__phone', l.phone);
    phones.appendChild(p);
    if (l.altphone) phones.appendChild(el('span', 'helpitem__alt', l.altphone));
    li.appendChild(phones);
    var meta = el('div', 'helpitem__meta');
    meta.appendChild(el('span', 'helpitem__hours', l.hours));
    if (l.languages) meta.appendChild(el('span', 'helpitem__lang', l.languages));
    li.appendChild(meta);
    return li;
  }
  function renderHelplines() {
    var sel = $('countrySel');
    var countries = [];
    LINES.forEach(function (l) { if (countries.indexOf(l.country) < 0) countries.push(l.country); });
    // keep India-first, then the rest as authored
    sel.innerHTML = '';
    var optAll = el('option', null, 'All countries');
    optAll.value = '__all__';
    sel.appendChild(optAll);
    countries.forEach(function (c) {
      var o = el('option', null, c);
      o.value = c;
      sel.appendChild(o);
    });
    var cur = getCountry();
    sel.value = countries.indexOf(cur) >= 0 ? cur : '__all__';
    paintHelplist(sel.value);
  }
  function paintHelplist(country) {
    var list = $('helpList');
    list.innerHTML = '';
    var shown = country === '__all__' ? LINES : LINES.filter(function (l) { return l.country === country; });
    shown.forEach(function (l) { list.appendChild(helplineLi(l)); });
  }

  /* ---------- last check-in nudge ---------- */
  function renderNudge() {
    var hist = E.sortByTimestamp(loadHistory());
    if (hist.length === 0) { hide($('lastNudge')); return; }
    var last = hist[hist.length - 1];
    var days = E.daysSince(last.ts);
    var msg;
    if (days === 0) msg = 'Last check-in: today.';
    else if (days === 1) msg = 'Last check-in: yesterday.';
    else msg = 'Last check-in: ' + days + ' days ago.';
    var n = $('lastNudge');
    n.textContent = msg + ' Your history is below.';
    show(n);
  }

  /* ---------- delete all ---------- */
  function onDeleteAll() {
    if (!window.confirm('Delete all saved check-ins from this browser? This cannot be undone.')) return;
    try { localStorage.removeItem(LS_HISTORY); } catch (e) {}
    state.lastResult = null;
    hide($('result'));
    hide($('history'));
    hide($('quiz'));
    renderNudge();
  }

  /* ---------- wire up ---------- */
  function init() {
    $('startPHQ9').addEventListener('click', function () { startScale('phq9'); });
    $('startGAD7').addEventListener('click', function () { startScale('gad7'); });
    $('cancelQuiz').addEventListener('click', function () { hide($('quiz')); });
    $('retake').addEventListener('click', function () { startScale(state.lastResult ? state.lastResult.scaleId : 'phq9'); });

    var form = $('quizForm');
    form.addEventListener('click', onQuizClick);
    form.addEventListener('keydown', onQuizKey);
    form.addEventListener('submit', onScore);

    $('exportCsv').addEventListener('click', onExportCsv);
    $('printResult').addEventListener('click', onPrint);

    $('historyBody').addEventListener('click', onHistoryClick);
    $('tabPHQ9').addEventListener('click', function () { historyScale = 'phq9'; renderHistory(); });
    $('tabGAD7').addEventListener('click', function () { historyScale = 'gad7'; renderHistory(); });

    $('needHelpTop').addEventListener('click', function () { openCrisis(false); });
    $('crisisAck').addEventListener('click', closeCrisis);
    $('crisisBackdrop').addEventListener('click', function () { /* backdrop does not dismiss crisis */ });
    document.addEventListener('keydown', trapKey);

    $('countrySel').addEventListener('change', function (e) {
      var v = e.target.value;
      if (v !== '__all__') { try { localStorage.setItem(LS_COUNTRY, v); } catch (err) {} }
      paintHelplist(v);
    });

    $('deleteAll').addEventListener('click', onDeleteAll);

    renderHelplines();
    renderHistory();
    renderNudge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
