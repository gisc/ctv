// Rain Reader - a CTV activity. Plain client-side JavaScript, no dependencies.
// Version A reads weather charts. Version B reads the same data as Python code.
// Data: Meteorological Service Singapore, Changi climate station, 1991-2020
// long-term means (weather.gov.sg/climate-climate-of-singapore).
// Rainfall rounded to the nearest 10 mm so it reads cleanly from the chart.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RAINFALL = [220, 110, 150, 160, 160, 140, 150, 150, 120, 170, 250, 330]; // mm, nearest 10
const RAINDAYS = [13, 9, 12, 15, 15, 13, 14, 14, 13, 15, 19, 19]; // days

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
const pickDistinct = (values, n) => shuffle(Array.from(new Set(values))).slice(0, n);
function monthFor(values, v) {
  const options = MONTHS.filter((m, i) => values[i] === v);
  return options[Math.floor(Math.random() * options.length)];
}
function newRound() {
  const qs = [];
  pickDistinct(RAINFALL, 2).forEach((v, k) => qs.push({ slot: k + 1, table: 'rain', month: monthFor(RAINFALL, v), value: v, unit: 'mm' }));
  pickDistinct(RAINDAYS, 2).forEach((v, k) => qs.push({ slot: k + 3, table: 'days', month: monthFor(RAINDAYS, v), value: v, unit: 'days' }));
  const tiles = shuffle([1, 2, 3, 4]);
  const tileFor = {};
  qs.forEach((q, i) => { tileFor[q.value] = tiles[i]; });
  return {
    qs, tileFor,
    keyOrder: shuffle(qs.map(q => q.value)),
    whichMonth: MONTHS[Math.floor(Math.random() * 12)],
    whichAsks: Math.random() < 0.5 ? 'rain' : 'days',
    bSlot: 1 + Math.floor(Math.random() * 4),
  };
}
const qBySlot = (r, s) => r.qs.find(q => q.slot === s);
const tableName = (t, py) => (py ? (t === 'rain' ? 'rainfall_mm' : 'rain_days') : (t === 'rain' ? 'rainfall chart' : 'rain days chart'));

function rainChart(qs, hlSlot, guide) {
  const W = 560, L = 40, R = 8, T = 18, B = 216, MAXV = 350;
  const x = i => L + (i * (W - L - R)) / 11;
  const y = v => B - (v * (B - T)) / MAXV;
  let s = `<svg class="rr-chart" viewBox="0 0 ${W} 250" role="img" aria-label="Line chart of mean monthly rainfall in millimetres across the twelve months">`;
  for (let v = 0; v <= MAXV; v += 10) {
    const major = v % 50 === 0;
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#585254' : major ? '#ddd7cb' : '#f0ebe1'}" stroke-width="${v === 0 ? 1.5 : 1}"/>`;
    if (major) s += `<text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="#585254">${v}</text>`;
  }
  s += `<text x="12" y="${(T + B) / 2}" font-size="11" fill="#585254" transform="rotate(-90 12 ${(T + B) / 2})" text-anchor="middle">Rainfall (mm)</text>`;
  s += `<polyline points="${RAINFALL.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="#2d6cdf" stroke-width="2.5"/>`;
  RAINFALL.forEach((v, i) => { s += `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#2d6cdf"/>`; });
  MONTHS.forEach((m, i) => { s += `<text x="${x(i)}" y="${B + 18}" text-anchor="middle" font-size="11" fill="#585254">${m}</text>`; });
  qs.forEach(q => {
    const i = MONTHS.indexOf(q.month), cx = x(i), cy = y(q.value), on = hlSlot === q.slot;
    if (on && guide) s += `<line x1="${L}" x2="${cx}" y1="${cy}" y2="${cy}" stroke="#111" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (on) s += `<circle cx="${cx}" cy="${cy}" r="8" fill="none" stroke="#111" stroke-width="2.5"/>`;
    s += `<g transform="translate(${cx},${cy - 20})"><rect x="-11" y="-11" width="22" height="22" rx="5" fill="${on ? '#f5d76e' : '#fffdf5'}" stroke="#251f21" stroke-width="${on ? 2.5 : 1.5}"/><text y="4.5" text-anchor="middle" font-size="13" font-weight="700" fill="#b03a2e">${q.slot}</text></g>`;
  });
  return s + '</svg>';
}

function daysChart(qs, hlSlot, guide) {
  const W = 560, L = 34, R = 8, T = 18, B = 216, MAXV = 20, BW = 26;
  const step = (W - L - R) / 12;
  const x = i => L + i * step + (step - BW) / 2;
  const y = v => B - (v * (B - T)) / MAXV;
  let s = `<svg class="rr-chart" viewBox="0 0 ${W} 250" role="img" aria-label="Bar chart of mean rain days per month">`;
  for (let v = 0; v <= MAXV; v += 1) {
    const major = v % 5 === 0;
    s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? '#555' : major ? '#ddd7cb' : '#f0ebe1'}" stroke-width="${v === 0 ? 1.5 : 1}"/>`;
    if (major) s += `<text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="#585254">${v}</text>`;
  }
  s += `<text x="12" y="${(T + B) / 2}" font-size="11" fill="#585254" transform="rotate(-90 12 ${(T + B) / 2})" text-anchor="middle">Rain days</text>`;
  RAINDAYS.forEach((v, i) => { s += `<rect x="${x(i)}" y="${y(v)}" width="${BW}" height="${B - y(v)}" rx="3" fill="#73a89a"/>`; });
  MONTHS.forEach((m, i) => { s += `<text x="${x(i) + BW / 2}" y="${B + 18}" text-anchor="middle" font-size="11" fill="#585254">${m}</text>`; });
  qs.forEach(q => {
    const i = MONTHS.indexOf(q.month), cx = x(i) + BW / 2, cy = y(q.value), on = hlSlot === q.slot;
    if (on && guide) s += `<line x1="${L}" x2="${cx}" y1="${cy}" y2="${cy}" stroke="#111" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (on) s += `<rect x="${x(i) - 3}" y="${cy - 3}" width="${BW + 6}" height="${B - cy + 3}" rx="4" fill="none" stroke="#111" stroke-width="2.5"/>`;
    s += `<g transform="translate(${cx},${cy - 16})"><rect x="-11" y="-11" width="22" height="22" rx="5" fill="${on ? '#f5d76e' : '#fffdf5'}" stroke="#251f21" stroke-width="${on ? 2.5 : 1.5}"/><text y="4.5" text-anchor="middle" font-size="13" font-weight="700" fill="#b03a2e">${q.slot}</text></g>`;
  });
  return s + '</svg>';
}

function pyCode(round, hlSlot, hint) {
  const m = (on, txt) => (on ? `<span class="hl">${txt}</span>` : txt);
  const dict = (name, values, table) => {
    let s = `${name} = {\n`;
    MONTHS.forEach((mo, i) => {
      const q = round.qs.find(q => q.table === table && q.month === mo);
      const on = !!q && hlSlot === q.slot && hint >= 2;
      s += '    ' + m(on, `"${mo}": ${values[i]},`) + '\n';
    });
    return s + '}';
  };
  const tf = round.keyOrder.map(v => {
    const q = round.qs.find(x => x.value === v);
    const on = !!q && hlSlot === q.slot && hint >= 2;
    return m(on, `${v}: ${round.tileFor[v]}`);
  }).join(', ');
  const quest = round.qs.map(q => '    ' + m(hlSlot === q.slot && hint >= 1, `${q.slot}: (${q.table === 'rain' ? 'rainfall_mm' : 'rain_days'}, "${q.month}"),`)).join('\n');
  return `<pre class="rr-code" aria-label="Python code"># Changi climate station, 1991-2020
${dict('rainfall_mm', RAINFALL, 'rain')}
${dict('rain_days', RAINDAYS, 'days')}
tile_for = {
    ${tf}
}
questions = {
${quest}
}

tray = {}
for slot, pair in questions.items():
    table, point = pair
    tray[slot] = tile_for[table[point]]</pre>`;
}

const CSS = `
.rr{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#222;line-height:1.45}
.rr *{box-sizing:border-box}
.rr h2{font-size:1.05rem;margin:22px 0 6px}
.rr p{margin:0 0 8px}
.rr .rr-card{background:#fff;border:1px solid #e3dece;border-radius:14px;padding:8px}
.rr-chart{width:100%;height:auto;display:block}
.rr-cap{font-size:.85rem;color:#6b6550;margin:6px 0 0}
.rr-code{margin:0;background:#1f2430;color:#e8eaf0;border-radius:12px;padding:12px;overflow-x:auto;font:clamp(.66rem,3.3vw,.82rem)/1.55 ui-monospace,Menlo,Consolas,monospace;white-space:pre}
.rr-code .hl{background:#f5d76e;color:#111;border-radius:3px;padding:0 2px}
.rr-key{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 0;padding:0;list-style:none}
.rr-key li{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff7e0;border:1px solid #ecd9a0;border-radius:10px;padding:8px 10px;font-size:.9rem}
.rr-key li.hl{background:#f5d76e;border-color:#111}
.rr-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border:2px solid #e3dece;border-radius:12px;padding:8px 10px;margin-bottom:8px;flex-wrap:wrap}
.rr-row.ok{border-color:#3d9a45;background:#f1faf1}
.rr-row.no{border-color:#d94a3d;background:#fff3f1}
.rr-row .lab{flex:1;min-width:130px;font-weight:600}
.rr-row .lab small{display:block;font-weight:400;color:#6b6550}
.rr-tiles{display:flex;gap:8px;flex-wrap:wrap}
.rr-tile{width:46px;height:46px;border-radius:10px;border:2px solid #222;background:#fffdf5;font:inherit;font-size:1.15rem;font-weight:700;color:#b03a2e;cursor:pointer;touch-action:manipulation}
.rr-tile.sel{background:#f5d76e;box-shadow:0 0 0 3px #d9d4c7}
.rr-choices2{display:flex;gap:8px;flex-wrap:wrap}
.rr-choice2{border:2px solid #c9c2ac;background:#fff;border-radius:12px;font:inherit;padding:8px 12px;min-height:44px;cursor:pointer;touch-action:manipulation}
.rr-choice2.py{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem}
.rr-choice2.sel{border-color:#222;box-shadow:0 0 0 3px #d9d4c7;background:#fff7e0}
.rr-step{display:flex;align-items:center;gap:6px}
.rr-step button{width:44px;height:44px;border-radius:10px;border:2px solid #222;background:#fff;font:inherit;font-size:1.4rem;font-weight:700;line-height:1;cursor:pointer;touch-action:manipulation}
.rr-step output{min-width:84px;text-align:center;font-size:1.05rem;font-weight:700}
.rr-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.rr-btn{font:inherit;font-weight:600;min-height:46px;padding:0 18px;border-radius:12px;border:2px solid #222;background:#222;color:#fff;cursor:pointer;touch-action:manipulation}
.rr-btn.sec{background:#fff;color:#222}
.rr-btn:disabled{opacity:.4;cursor:not-allowed}
.rr-msg{min-height:1.5em;margin-top:12px;font-weight:600}
.rr-msg.ok{color:#256b2a}.rr-msg.no{color:#9a3226}
.rr-inv{margin-top:16px;border:2px solid #2d6cdf;border-radius:14px;padding:12px;background:#f2f6ff}
.rr-inv h3{margin:0 0 6px;font-size:1rem}
.rr-inv .q{font-weight:600;margin:10px 0 6px}
.rr-inv ul{margin:6px 0;padding-left:20px}
.rr .tiny,.rr-inv .tiny{font-size:.85rem;color:#555}
.rr button:focus-visible{outline:3px solid #2d6cdf;outline-offset:2px}
.rr-conf{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}
.rr-conf span{position:absolute;top:-30px;font-size:1.6rem;animation:rr-fall 2.4s ease-in forwards}
@keyframes rr-fall{to{transform:translateY(110vh) rotate(360deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){.rr-conf{display:none}}
`;

export function mount(root, opts) {
  const V = (opts && opts.variant) === 'b' ? 'b' : 'a';
  const py = V === 'b';
  let round = newRound();
  let placed = { 1: null, 2: null, 3: null, 4: null };
  let whichSel = null, checks = 0, marks = false, result = null, noteFirst = false, msg = null, inv = null;
  let wins = 0;
  if (!document.getElementById('rr-style')) {
    const el = document.createElement('style'); el.id = 'rr-style'; el.textContent = CSS; document.head.appendChild(el);
  }
  const whichAnswer = () => (py ? qBySlot(round, round.bSlot).table : round.whichAsks);
  const evaluate = () => {
    const ok = {};
    round.qs.forEach(q => { ok[q.slot] = placed[q.slot] === round.tileFor[q.value]; });
    return { ok, whichOk: whichSel === whichAnswer() };
  };
  const badCount = r => Object.values(r.ok).filter(v => !v).length + (r.whichOk ? 0 : 1);
  const rowCls = ok => (result && marks ? (ok ? ' ok' : ' no') : '');
  const mark = ok => (result && marks ? (ok ? ' â' : ' â') : '');
  const tileChoices = (sel, slot) => `<span class="rr-tiles" role="group" aria-label="Tile choices">${[1, 2, 3, 4].map(t =>
    `<button type="button" data-place="${slot}:${t}" class="rr-tile${sel === t ? ' sel' : ''}" aria-pressed="${sel === t}">${t}</button>`).join('')}</span>`;

  function invPanel() {
    if (!inv) return '';
    if (inv.stage === 'trace') {
      if (inv.kind === 'slot') {
        const q = qBySlot(round, inv.slot);
        const hi = q.table === 'rain' ? 340 : 20;
        return `<div class="rr-inv" role="region" aria-label="Investigation"><h3>Let's investigate slot ${inv.slot}</h3>
          <p class="tiny">Show your steps first. Nothing is corrected until you submit them.</p>
          <p class="q">${py ? `a) When the loop reaches slot ${inv.slot}, what does <code>table[point]</code> hold? (${q.unit})` : `a) What value do you read at badge ${inv.slot}? (${q.unit})`}</p>
          <div class="rr-row" style="margin:0"><span class="lab">Your reading</span>
            <span class="rr-step"><button type="button" data-ivdec data-hi="${hi}" aria-label="Decrease reading">&minus;</button><output>${inv.v} ${q.unit}</output><button type="button" data-ivinc data-hi="${hi}" aria-label="Increase reading">+</button></span></div>
          <p class="q">${py ? `b) What is <code>tile_for[${inv.v}]</code> for that reading?` : `b) Which tile does the key give for ${inv.v} ${q.unit}?`}</p>
          ${tileChoices(inv.tile, 'inv')}
          <p class="tiny">You placed ${placed[inv.slot] ? `tile ${placed[inv.slot]}` : 'no tile'} in slot ${inv.slot}.</p>
          <div class="rr-actions"><button type="button" class="rr-btn" data-act="isubmit" ${inv.tile === null ? 'disabled' : ''}>Submit my steps</button>
          <button type="button" class="rr-btn sec" data-act="iclose">Back to the tray</button></div></div>`;
      }
      return `<div class="rr-inv" role="region" aria-label="Investigation"><h3>Let's investigate the last question</h3>
        <p class="tiny">Show your steps first. Nothing is corrected until you submit them.</p>
        <p class="q">a) The question is really about&hellip;</p>
        <div class="rr-choices2">
          <button type="button" class="rr-choice2${inv.part === 'rain' ? ' sel' : ''}" data-part="rain">${py ? 'an amount of rain (<code>rainfall_mm</code>)' : 'how much rain (mm)'}</button>
          <button type="button" class="rr-choice2${inv.part === 'days' ? ' sel' : ''}" data-part="days">${py ? 'a count of days (<code>rain_days</code>)' : 'how many days'}</button>
        </div>
        <div class="rr-actions"><button type="button" class="rr-btn" data-act="isubmit" ${inv.part === null ? 'disabled' : ''}>Submit my steps</button>
        <button type="button" class="rr-btn sec" data-act="iclose">Back to the tray</button></div></div>`;
    }
    const facts = [];
    let workedText = '';
    const okS = c => (c ? 'â' : 'â');
    if (inv.kind === 'slot') {
      const q = qBySlot(round, inv.slot);
      const readOk = inv.v === q.value;
      const keyTile = Object.prototype.hasOwnProperty.call(round.tileFor, inv.v) ? round.tileFor[inv.v] : null;
      const lookupOk = keyTile !== null && inv.tile === keyTile;
      const placedOk = placed[q.slot] === inv.tile;
      facts.push(`${okS(readOk)} ${readOk ? `Your reading of ${inv.v} ${q.unit} matches the ${tableName(q.table, py)}.` : `Your reading (${inv.v} ${q.unit}) differs from the ${tableName(q.table, py)}.`}`);
      facts.push(`${okS(lookupOk)} ${keyTile === null ? `The key has no row for ${inv.v} ${q.unit} - a sign the reading needs another look.` : lookupOk ? `The key gives tile ${keyTile} for ${inv.v} ${q.unit}; that matches your choice.` : `For ${inv.v} ${q.unit} the key gives tile ${keyTile}, not tile ${inv.tile}.`}`);
      facts.push(`${okS(placedOk)} ${placedOk ? `You placed tile ${inv.tile}, matching your lookup.` : `You placed ${placed[q.slot] ? `tile ${placed[q.slot]}` : 'no tile'}, but your lookup gave tile ${inv.tile}.`}`);
      workedText = py
        ? `Slot ${q.slot}: questions[${q.slot}] is (${q.table === 'rain' ? 'rainfall_mm' : 'rain_days'}, "${q.month}"), so table[point] is ${q.value}. tile_for[${q.value}] is ${round.tileFor[q.value]}, so tray[${q.slot}] holds ${round.tileFor[q.value]}.`
        : `Badge ${q.slot} sits at ${q.month} on the ${tableName(q.table, false)}: ${q.value} ${q.unit}. The key gives tile ${round.tileFor[q.value]} for ${q.value} ${q.unit}, so slot ${q.slot} takes tile ${round.tileFor[q.value]}.`;
    } else {
      const want = whichAnswer();
      const okPart = inv.part === want;
      facts.push(`${okS(okPart)} ${py
        ? (okPart ? 'You matched the slot to the right dictionary.' : `For slot ${round.bSlot}, questions[${round.bSlot}] starts with ${want === 'rain' ? 'rainfall_mm' : 'rain_days'}.`)
        : (okPart ? 'You matched the question to the right chart.' : `This question asks about ${want === 'rain' ? 'an amount of rain (mm)' : 'a count of days'}.`)}`);
      workedText = py
        ? `questions[${round.bSlot}] is (${want === 'rain' ? 'rainfall_mm' : 'rain_days'}, "${qBySlot(round, round.bSlot).month}"), so in the loop table is ${want === 'rain' ? 'rainfall_mm' : 'rain_days'}.`
        : `"${round.whichAsks === 'rain' ? 'How much rain' : 'How many days'}" is answered by the ${tableName(want, false)} - its axis measures ${want === 'rain' ? 'millimetres' : 'days'}.`;
    }
    let extra = '';
    if (inv.hint >= 1) extra += `<p><b>Hint 1.</b> ${inv.kind === 'slot'
      ? (py ? `The line for slot ${inv.slot} in <code>questions</code> is highlighted.` : `Badge ${inv.slot} is highlighted on its chart.`)
      : (py ? `Read the first item of the pair in <code>questions[${round.bSlot}]</code>.` : "Read each chart's axis label: one measures millimetres, the other counts days.")}</p>`;
    if (inv.hint >= 2 && inv.kind === 'slot') extra += `<p><b>Hint 2.</b> ${py ? 'The matching entries in the dictionaries and in <code>tile_for</code> are highlighted.' : 'Follow the dashed line across to the axis. The matching key row is highlighted below.'}</p>`;
    if (inv.worked) extra += `<p><b>Worked example.</b> ${workedText}</p>`;
    return `<div class="rr-inv" role="region" aria-label="Investigation result"><h3>What your steps show</h3>
      <ul>${facts.map(f => `<li>${f}</li>`).join('')}</ul>
      <p class="tiny">This describes your recheck. It cannot prove what went wrong the first time.</p>${extra}
      <div class="rr-actions">
        ${inv.kind === 'slot' && inv.hint < 2 ? '<button type="button" class="rr-btn sec" data-act="ihint">Give me a hint</button>' : ''}
        ${inv.kind === 'which' && inv.hint < 1 ? '<button type="button" class="rr-btn sec" data-act="ihint">Give me a hint</button>' : ''}
        ${!inv.worked && (inv.hint >= 2 || inv.kind === 'which') ? '<button type="button" class="rr-btn sec" data-act="iworked">Show worked example</button>' : ''}
        ${inv.worked ? '<button type="button" class="rr-btn" data-act="new">Try a fresh round</button>' : ''}
        <button type="button" class="rr-btn sec" data-act="iclose">Back to the tray</button></div></div>`;
  }

  function render() {
    const hlSlot = inv && inv.kind === 'slot' && inv.stage === 'feedback' ? inv.slot : undefined;
    const guide = !!inv && inv.hint >= 2;
    const hlValue = inv && inv.kind === 'slot' && inv.stage === 'feedback' && inv.hint >= 2 ? qBySlot(round, inv.slot).value : null;
    const whichQuestion = py
      ? `When the loop reaches slot ${round.bSlot}, <code>table</code> is which dictionary?`
      : (round.whichAsks === 'rain'
        ? `A friend asks: &ldquo;About how much rain falls in ${round.whichMonth}?&rdquo; Which chart answers it?`
        : `A friend asks: &ldquo;On about how many days does it rain in ${round.whichMonth}?&rdquo; Which chart answers it?`);
    root.innerHTML = `<div class="rr">
      <p>${py
        ? 'The same umbrella-board task, written as Python. Read the code, work out what tray holds when the loop finishes, and answer the question about it.'
        : 'You run the school umbrella board. Four numbered badges sit on the weather charts. For each badge: read the value, find it in the station key, and place the tile the key names.'}</p>
      ${py ? `<h2>The code</h2>
      ${pyCode(round, hlSlot, inv ? inv.hint : 0)}
      <p class="tiny" style="margin-top:8px">The loop runs once for each of the four questions. Work out what <code>tray</code> holds when it finishes.</p>`
      : `<h2>The weather charts</h2>
      <div class="rr-card">${rainChart(round.qs.filter(q => q.table === 'rain'), hlSlot, guide)}</div>
      <p class="rr-cap">Mean monthly rainfall, Changi climate station, 1991-2020 (Meteorological Service Singapore). Rounded to the nearest 10 mm.</p>
      <div class="rr-card" style="margin-top:10px">${daysChart(round.qs.filter(q => q.table === 'days'), hlSlot, guide)}</div>
      <p class="rr-cap">Mean rain days per month, same station and period. A rain day has at least 0.2 mm of rain.</p>
      <h2>1. The station key</h2>
      <ul class="rr-key">${round.keyOrder.map(v => {
        const q = round.qs.find(x => x.value === v);
        return `<li class="${hlValue === v ? 'hl' : ''}"><span>${v} ${q.unit}</span><b>tile ${round.tileFor[v]}</b></li>`;
      }).join('')}</ul>`}
      <h2>${py ? '1' : '2'}. ${py ? 'What does <code>tray</code> hold?' : 'Place the tiles'}</h2>
      ${round.qs.map(q => `<div class="rr-row${rowCls(result ? result.ok[q.slot] : true)}">
        <span class="lab">${py ? `<code>tray[${q.slot}]</code>` : `Slot ${q.slot}`}${mark(result ? result.ok[q.slot] : true)}
          <small>${py ? 'value stored by the loop' : `find badge ${q.slot} on the charts`}</small></span>
        ${tileChoices(placed[q.slot], q.slot)}</div>`).join('')}
      <h2>${py ? '2' : '3'}. ${py ? 'Which dictionary?' : 'Which chart?'}</h2>
      <div class="rr-row${rowCls(result ? result.whichOk : true)}">
        <span class="lab">${whichQuestion}${mark(result ? result.whichOk : true)}</span>
        <span class="rr-choices2">
          <button type="button" class="rr-choice2${py ? ' py' : ''}${whichSel === 'rain' ? ' sel' : ''}" data-which="rain" aria-pressed="${whichSel === 'rain'}">${py ? 'rainfall_mm' : 'Rainfall chart'}</button>
          <button type="button" class="rr-choice2${py ? ' py' : ''}${whichSel === 'days' ? ' sel' : ''}" data-which="days" aria-pressed="${whichSel === 'days'}">${py ? 'rain_days' : 'Rain days chart'}</button>
        </span></div>
      <div class="rr-actions">
        <button type="button" class="rr-btn" data-act="check">Check my answers</button>
        ${noteFirst ? '<button type="button" class="rr-btn sec" data-act="tryagain">Try again myself</button>' : ''}
        ${result && !inv && badCount(result) > 0 ? '<button type="button" class="rr-btn sec" data-act="investigate">Help me investigate</button>' : ''}
        <button type="button" class="rr-btn sec" data-act="new">New round</button>
      </div>
      <div class="rr-msg ${msg ? msg.cls : ''}" role="status" aria-live="polite">${msg ? msg.text : ''}</div>
      ${invPanel()}
      <p style="font-size:.85rem;color:#585254">${wins ? `Rounds solved this visit: ${wins}` : ''}</p>
    </div>`;
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const d = document.createElement('div'); d.className = 'rr-conf'; d.setAttribute('aria-hidden', 'true');
    const bits = ['ð§ï¸', 'ð§', 'â', 'ð¦ï¸', 'â¨'];
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.8 + 's';
      d.appendChild(s);
    }
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 3600);
  }

  function touch() { result = null; marks = false; noteFirst = false; }
  function reset() {
    round = newRound();
    placed = { 1: null, 2: null, 3: null, 4: null };
    whichSel = null; checks = 0; marks = false; result = null; noteFirst = false; msg = null; inv = null;
  }
  function check() {
    const n = checks + 1; checks = n;
    const r = evaluate(); result = r;
    const bad = badCount(r);
    if (!bad) {
      marks = true; noteFirst = false; inv = null;
      wins += 1;
      msg = { text: py ? "All correct. The program's tray is exactly right." : 'All correct. The umbrella board is ready.', cls: 'ok' };
      render(); confetti();
    } else if (n === 1) {
      marks = false; noteFirst = true;
      msg = { text: `${bad} ${bad === 1 ? 'answer needs' : 'answers need'} another look. Try to find which yourself, or ask for help.`, cls: 'no' };
      render();
    } else {
      marks = true; noteFirst = false;
      msg = { text: `${bad} ${bad === 1 ? 'answer still needs' : 'answers still need'} another look. The marked rows are the ones to check.`, cls: 'no' };
      render();
    }
  }
  function investigate() {
    const r = result || evaluate(); result = r; noteFirst = false;
    const badSlot = [1, 2, 3, 4].find(s => !r.ok[s]);
    if (badSlot) inv = { kind: 'slot', slot: badSlot, stage: 'trace', v: 0, tile: null, part: null, hint: 0, worked: false };
    else if (!r.whichOk) inv = { kind: 'which', slot: 0, stage: 'trace', v: 0, tile: null, part: null, hint: 0, worked: false };
    render();
    const el = root.querySelector('.rr-inv');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' });
  }

  root.addEventListener('click', e => {
    const el = e.target.closest('button');
    if (!el || !root.contains(el)) return;
    if (el.dataset.place) {
      const [slot, t] = el.dataset.place.split(':');
      if (slot === 'inv') { if (inv) inv.tile = +t; }
      else { placed[+slot] = +t; touch(); }
      render(); return;
    }
    if (el.dataset.which) { whichSel = el.dataset.which; touch(); render(); return; }
    if (el.dataset.part !== undefined && inv) { inv.part = el.dataset.part; render(); return; }
    if (el.dataset.ivdec !== undefined && inv) {
      const q = qBySlot(round, inv.slot); const step = q.table === 'rain' ? 10 : 1;
      inv.v = Math.max(0, inv.v - step); render(); return;
    }
    if (el.dataset.ivinc !== undefined && inv) {
      const q = qBySlot(round, inv.slot); const step = q.table === 'rain' ? 10 : 1;
      const hi = q.table === 'rain' ? 340 : 20;
      inv.v = Math.min(hi, inv.v + step); render(); return;
    }
    switch (el.dataset.act) {
      case 'check': check(); return;
      case 'new': reset(); render(); return;
      case 'tryagain': noteFirst = false; result = null; msg = null; render(); return;
      case 'investigate': investigate(); return;
      case 'isubmit': if (inv) { inv.stage = 'feedback'; render(); } return;
      case 'iclose': inv = null; render(); return;
      case 'ihint': if (inv) { inv.hint = inv.kind === 'which' ? 1 : Math.min(2, inv.hint + 1); render(); } return;
      case 'iworked': if (inv) { inv.worked = true; render(); } return;
    }
  });

  render();
}
