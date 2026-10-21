// Crate Counter - game 1 of the CTV series. Plain client-side JavaScript, no dependencies.
// Version A reads a bar chart. Version B reads the same data as Python code.
const FRUITS = [
  { id: 'apple', name: 'Apple', emoji: '🍎', color: '#d94a3d' },
  { id: 'banana', name: 'Banana', emoji: '🍌', color: '#e8b923' },
  { id: 'grapes', name: 'Grapes', emoji: '🍇', color: '#7b4fb0' },
  { id: 'orange', name: 'Orange', emoji: '🍊', color: '#ee8420' },
];
const MAXV = 5;
const fruit = id => FRUITS.find(f => f.id === id);
const lc = id => id; // Python keys are the lowercase ids

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
const ids = () => FRUITS.map(f => f.id);

function newRound() {
  const nums = shuffle([1, 2, 3, 4, 5]).slice(0, 4);
  const sold = {};
  FRUITS.forEach((f, i) => { sold[f.id] = nums[i]; });
  const ranked = ids().sort((a, b) => sold[b] - sold[a]);
  const pair = shuffle(ids()).slice(0, 2).sort((a, b) => sold[b] - sold[a]);
  const letters = shuffle('ABCDEFGHJKMNPRSTW'.split('')).slice(0, 4);
  const codes = {};
  FRUITS.forEach((f, i) => { codes[f.id] = letters[i] + (2 + Math.floor(Math.random() * 8)); });
  let sheet = ids().sort((a, b) => codes[a].localeCompare(codes[b]));
  if (sheet.every((id, i) => id === FRUITS[i].id)) sheet.reverse();
  let keyOrder; do { keyOrder = shuffle(ids()); } while (keyOrder.every((id, i) => id === FRUITS[i].id));
  return {
    sold, codes, sheet, keyOrder, best: ranked[0], more: pair[0], less: pair[1],
    order: { apple: 0, banana: 0, grapes: 0, orange: 0 }, pickBest: null, diff: 0,
    result: null, checks: 0, marks: false, inv: null, note: null,
  };
}

function chart(sold, hl) {
  const L = 38, B = 190, U = 30, W = 48, gap = 14;
  const bars = (hl && hl.bars) || [];
  let s = `<svg class="cc-chart" viewBox="0 0 320 250" role="img" aria-label="Bar chart of crates sold today for each fruit">`;
  for (let y = 0; y <= MAXV; y++) {
    const py = B - y * U;
    s += `<line x1="${L}" x2="312" y1="${py}" y2="${py}" stroke="${y === 0 ? '#555' : '#d9d4c7'}" stroke-width="${y === 0 ? 1.5 : 1}"/>`;
    s += `<text x="${L - 8}" y="${py + 4}" text-anchor="end" font-size="12" fill="#555">${y}</text>`;
  }
  s += `<text x="10" y="${B - 2.5 * U}" font-size="11" fill="#555" transform="rotate(-90 10 ${B - 2.5 * U})" text-anchor="middle">Crates sold today</text>`;
  FRUITS.forEach((f, i) => {
    const x = L + gap + i * (W + gap), h = sold[f.id] * U, on = bars.includes(f.id);
    s += `<rect x="${x}" y="${B - h}" width="${W}" height="${h}" rx="4" fill="${f.color}" ${on ? 'stroke="#111" stroke-width="3"' : ''}/>`;
    if (on && hl.guide) s += `<line x1="${L}" x2="${x + W}" y1="${B - h}" y2="${B - h}" stroke="#111" stroke-width="2" stroke-dasharray="5 4"/>`;
    s += `<text x="${x + W / 2}" y="${B + 24}" text-anchor="middle" font-size="22">${f.emoji}</text>`;
    s += `<text x="${x + W / 2}" y="${B + 42}" text-anchor="middle" font-size="11" fill="#333" ${on ? 'font-weight="700"' : ''}>${f.name}</text>`;
  });
  return s + '</svg>';
}

function pyCode(st, hl) {
  const m = (id, txt, kind) => `<span class="${(hl[kind] || []).includes(id) ? 'hl' : ''}">${txt}</span>`;
  const sales = st.keyOrder.map(id => '    ' + m(id, `"${id}": ${st.sold[id]},`, 'sales')).join('\n');
  const codes = st.keyOrder.slice().reverse().map(id => '    ' + m(id, `"${id}": "${st.codes[id]}",`, 'codes')).join('\n');
  return `<pre class="cc-code" aria-label="Python code"><code>sales = {
${sales}
}
codes = {
${codes}
}
order = {}
for fruit in sales:
    order[codes[fruit]] = sales[fruit]</code></pre>`;
}

const CSS = `
.cc{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#222;max-width:560px;margin:0 auto;line-height:1.45}
.cc *{box-sizing:border-box}
.cc h2{font-size:1.05rem;margin:22px 0 6px}
.cc p{margin:0 0 8px}
.cc .cc-card{background:#fff;border:1px solid #e3dece;border-radius:14px;padding:12px}
.cc-chart{width:100%;height:auto;display:block}
.cc-code{margin:0;background:#1f2430;color:#e8eaf0;border-radius:12px;padding:12px;overflow-x:auto;font:clamp(.66rem,3.3vw,.82rem)/1.55 ui-monospace,Menlo,Consolas,monospace;white-space:pre}
.cc-code .hl{background:#f5d76e;color:#111;border-radius:3px;padding:0 2px}
.cc-row{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #e3dece;border-radius:12px;padding:8px 10px;margin-bottom:8px}
.cc-row.ok{border-color:#3d9a45;background:#f1faf1}.cc-row.no{border-color:#d94a3d;background:#fff3f1}
.cc-row .e{font-size:1.8rem;line-height:1}
.cc-row .lab{flex:1;font-weight:600}
.cc-row .lab small{display:block;font-weight:400;color:#6b6550}
.cc-row .code{min-width:52px;text-align:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;font-size:1.25rem;background:#eee8d6;border-radius:8px;padding:8px 4px}
.cc-row .code.py{font-size:.78rem;min-width:84px;padding:8px 2px}
.cc-step{display:flex;align-items:center;gap:6px}
.cc-step button{width:44px;height:44px;border-radius:10px;border:2px solid #222;background:#fff;font:inherit;font-size:1.4rem;font-weight:700;line-height:1;cursor:pointer;touch-action:manipulation}
.cc-step output{min-width:28px;text-align:center;font-size:1.2rem;font-weight:700}
.cc-choices{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.cc-choice{border:2px solid #c9c2ac;background:#fff;border-radius:12px;font:inherit;padding:6px 2px;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;touch-action:manipulation}
.cc-choice .e{font-size:1.7rem;line-height:1}.cc-choice .n{font-size:.75rem}
.cc-choice.py .n{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.8rem}
.cc-choice.sel{border-color:#222;box-shadow:0 0 0 3px #d9d4c7;background:#fff7e0}
.cc-codes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0;padding:0;list-style:none}
.cc-codes li{display:flex;align-items:center;gap:8px;background:#fff7e0;border:1px solid #ecd9a0;border-radius:10px;padding:8px 10px;font-size:.9rem}
.cc-codes li.hl{background:#f5d76e;border-color:#111}
.cc-codes .e{font-size:1.5rem;line-height:1}.cc-codes b{margin-left:auto;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.1rem}
.cc-truck{display:flex;gap:4px;flex-wrap:wrap;min-height:34px;margin:4px 0 0}
.cc-truck span{font-size:1.2rem}
.cc-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.cc-btn{font:inherit;font-weight:600;min-height:46px;padding:0 18px;border-radius:12px;border:2px solid #222;background:#222;color:#fff;cursor:pointer;touch-action:manipulation}
.cc-btn.sec{background:#fff;color:#222}
.cc-btn:disabled{opacity:.4;cursor:not-allowed}
.cc-msg{min-height:3em;margin-top:12px;font-weight:600}
.cc-msg.ok{color:#256b2a}.cc-msg.no{color:#9a3226}
.cc-inv{margin-top:16px;border:2px solid #2d6cdf;border-radius:14px;padding:12px;background:#f2f6ff}
.cc-inv h3{margin:0 0 6px;font-size:1rem}
.cc-inv .q{font-weight:600;margin:10px 0 6px}
.cc-inv ul{margin:6px 0;padding-left:20px}
.cc-inv .tiny{font-size:.85rem;color:#555}
.cc button:focus-visible{outline:3px solid #2d6cdf;outline-offset:2px}
.cc-conf{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}
.cc-conf span{position:absolute;top:-30px;font-size:1.6rem;animation:cc-fall 2.4s ease-in forwards}
@keyframes cc-fall{to{transform:translateY(110vh) rotate(360deg);opacity:.9}}
@media (prefers-reduced-motion:reduce){.cc-conf{display:none}}
`;

export function mount(root, opts) {
  const V = (opts && opts.variant) === 'b' ? 'b' : 'a';
  const py = V === 'b';
  let st = newRound();
  let wins = 0;
  if (!document.getElementById('cc-style')) {
    const el = document.createElement('style'); el.id = 'cc-style'; el.textContent = CSS; document.head.appendChild(el);
  }
  const nm = id => (py ? `"${id}"` : fruit(id).name);
  const rowCls = k => (st.result && st.marks ? (st.result[k] ? ' ok' : ' no') : '');
  const mark = k => (st.result && st.marks ? (st.result[k] ? ' ✓' : ' ✗') : '');
  const evaluate = () => {
    const r = {};
    FRUITS.forEach(f => { r['o_' + f.id] = st.order[f.id] === st.sold[f.id]; });
    r.best = st.pickBest === st.best;
    r.diff = st.diff === st.sold[st.more] - st.sold[st.less];
    return r;
  };
  const firstWrong = r => {
    for (const id of st.sheet) if (!r['o_' + id]) return { kind: 'order', fruit: id };
    if (!r.best) return { kind: 'best' };
    if (!r.diff) return { kind: 'diff' };
    return null;
  };
  const stepper = (name, val, label) => `<span class="cc-step"><button data-${name}-dec aria-label="Decrease ${label}">&minus;</button><output>${val}</output><button data-${name}-inc aria-label="Increase ${label}">+</button></span>`;

  function invPanel() {
    const inv = st.inv; if (!inv) return '';
    const it = inv.item;
    if (inv.stage === 'trace') {
      let body = '';
      if (it.kind === 'order') {
        const code = st.codes[it.fruit];
        body = `<p class="q">a) ${py ? `Which key of <code>codes</code> has the value "${code}"?` : `Which fruit has supplier code ${code}?`}</p>
          <div class="cc-choices" role="group" aria-label="Fruit for the code">${FRUITS.map(f => `<button class="cc-choice${py ? ' py' : ''}${inv.fruit === f.id ? ' sel' : ''}" data-ifruit="${f.id}"><span class="e">${f.emoji}</span><span class="n">${nm(f.id)}</span></button>`).join('')}</div>
          <p class="q">b) ${py ? `What does <code>sales[${inv.fruit ? nm(inv.fruit) : 'that key'}]</code> hold?` : `How many crates does ${inv.fruit ? 'that fruit' : 'it'} show on the chart?`}</p>
          <div class="cc-row" style="margin:0"><span class="lab">Your reading</span>${stepper('iv0', inv.v[0], 'reading')}</div>
          <p class="tiny">Your sheet entry for ${py ? `<code>order["${code}"]</code>` : `code ${code}`} is ${st.order[it.fruit]}.</p>`;
      } else if (it.kind === 'best') {
        body = `<p class="q">Read each ${py ? 'value in <code>sales</code>' : 'bar'} again:</p>` + FRUITS.map((f, i) => `<div class="cc-row" style="margin-bottom:6px"><span class="lab">${py ? nm(f.id) : f.emoji + ' ' + f.name}</span>${stepper('iv' + i, inv.v[i], f.name)}</div>`).join('');
      } else {
        const a = fruit(st.more), b = fruit(st.less);
        body = `<p class="q">First read the two ${py ? 'values' : 'bars'}:</p>
          <div class="cc-row" style="margin-bottom:6px"><span class="lab">${py ? nm(a.id) : a.emoji + ' ' + a.name}</span>${stepper('iv0', inv.v[0], a.name)}</div>
          <div class="cc-row" style="margin-bottom:6px"><span class="lab">${py ? nm(b.id) : b.emoji + ' ' + b.name}</span>${stepper('iv1', inv.v[1], b.name)}</div>
          <p class="tiny">Your answer to the comparison was ${st.diff}.</p>`;
      }
      const ready = it.kind !== 'order' || inv.fruit;
      return `<div class="cc-inv" role="region" aria-label="Investigation"><h3>Let's investigate one answer</h3>
        <p class="tiny">Show your steps first. Nothing is corrected until you submit them.</p>${body}
        <div class="cc-actions"><button class="cc-btn" data-act="isubmit" ${ready ? '' : 'disabled'}>Submit my steps</button><button class="cc-btn sec" data-act="iclose">Back to the sheet</button></div></div>`;
    }
    // feedback stage
    const facts = [];
    const ok = c => (c ? '✓' : '✗');
    if (it.kind === 'order') {
      const code = st.codes[it.fruit], fOk = inv.fruit === it.fruit, vOk = inv.v[0] === st.sold[it.fruit];
      facts.push(`${ok(fOk)} ${fOk ? `You matched ${code} to ${nm(it.fruit)}.` : `${nm(inv.fruit)} is not the item that goes with ${code}.`}`);
      facts.push(`${ok(vOk)} ${vOk ? `Your reading of ${nm(inv.fruit)} matches the ${py ? 'code' : 'chart'}.` : `Your reading of ${nm(inv.fruit)} (${inv.v[0]}) differs from the ${py ? 'code' : 'chart'}.`}`);
      const e = st.order[it.fruit];
      facts.push(`${ok(e === inv.v[0])} ${e === inv.v[0] ? `The row you filled in matches your reading.` : `The row you filled in (${e}) differs from your own reading (${inv.v[0]}).`}`);
    } else if (it.kind === 'best') {
      FRUITS.forEach((f, i) => { const o = inv.v[i] === st.sold[f.id]; facts.push(`${ok(o)} ${nm(f.id)}: ${o ? 'reading matches' : 'reading differs (' + inv.v[i] + ')'}.`); });
      const mine = ids().reduce((m, id, i) => (inv.v[i] > inv.v[ids().indexOf(m)] ? id : m), ids()[0]);
      facts.push(`Of your readings, the largest is ${nm(mine)}. ${st.pickBest === mine ? 'That matches' : 'That differs from'} the fruit you chose (${st.pickBest ? nm(st.pickBest) : 'none'}).`);
    } else {
      const a = st.more, b = st.less;
      [a, b].forEach((id, i) => { const o = inv.v[i] === st.sold[id]; facts.push(`${ok(o)} ${nm(id)}: ${o ? 'reading matches' : 'reading differs (' + inv.v[i] + ')'}.`); });
      const d = inv.v[0] - inv.v[1];
      facts.push(`${ok(d === st.diff)} The difference of your readings is ${d}; you entered ${st.diff}. ${d === st.diff ? 'These agree.' : 'These differ.'}`);
    }
    let hint = '';
    if (inv.hint >= 1) hint += `<p><b>Hint 1.</b> ${it.kind === 'order' ? `Look at the highlighted ${py ? 'entry in <code>codes</code>' : 'supplier-code entry'}.` : `The ${py ? 'values' : 'bars'} involved are highlighted.`}</p>`;
    if (inv.hint >= 2) hint += `<p><b>Hint 2.</b> ${py ? 'Find the key in <code>sales</code> and read the number after it.' : 'Follow the dashed line from the top of the bar across to the scale.'}</p>`;
    if (inv.worked) {
      const w = it.kind === 'order' ? `${nm(it.fruit)} has code ${st.codes[it.fruit]} and ${py ? '<code>sales[' + nm(it.fruit) + ']</code> is' : 'sold'} ${st.sold[it.fruit]}, so the ${py ? `<code>order["${st.codes[it.fruit]}"]</code> value` : `${st.codes[it.fruit]} row`} is ${st.sold[it.fruit]}.`
        : it.kind === 'best' ? `The values are ${ids().map(id => nm(id) + ' ' + st.sold[id]).join(', ')}. The largest is ${nm(st.best)}.`
        : `${nm(st.more)} is ${st.sold[st.more]} and ${nm(st.less)} is ${st.sold[st.less]}, so the difference is ${st.sold[st.more] - st.sold[st.less]}.`;
      hint += `<p><b>Worked example.</b> ${w}</p>`;
    }
    return `<div class="cc-inv" role="region" aria-label="Investigation result"><h3>What your steps show</h3>
      <ul>${facts.map(f => `<li>${f}</li>`).join('')}</ul>
      <p class="tiny">This describes your recheck. It cannot prove what went wrong the first time.</p>${hint}
      <div class="cc-actions">
        ${inv.hint < 2 ? '<button class="cc-btn sec" data-act="ihint">Give me a hint</button>' : (inv.worked ? '' : '<button class="cc-btn sec" data-act="iworked">Show worked example</button>')}
        ${inv.worked ? '<button class="cc-btn" data-act="new">Try a fresh round</button>' : ''}
        <button class="cc-btn sec" data-act="iclose">Back to the sheet</button></div></div>`;
  }

  function render(msg, msgCls) {
    const inv = st.inv, it = inv && inv.item, hint = inv && inv.stage === 'feedback' ? inv.hint : 0;
    const hl = { bars: [], guide: false, codes: [], sales: [] };
    if (it && hint >= 1) {
      if (it.kind === 'order') { hl.codes = [it.fruit]; if (hint >= 2) { hl.bars = [it.fruit]; hl.sales = [it.fruit]; hl.guide = true; } }
      else { hl.bars = it.kind === 'best' ? ids() : [st.more, st.less]; hl.sales = hl.bars; hl.guide = hint >= 2; }
    }
    const total = Object.values(st.order).reduce((a, b) => a + b, 0);
    const orders = st.sheet.map(id => { const f = fruit(id), c = st.codes[id]; return `<div class="cc-row${rowCls('o_' + id)}"><span class="code${py ? ' py' : ''}">${py ? `order["${c}"]` : c}</span><span class="lab">${py ? 'value stored' : 'Code ' + c}${mark('o_' + id)}<small>${py ? 'enter the number' : 'crates to order'}</small></span>
      <span class="cc-step"><button data-dec="${id}" aria-label="One fewer for ${c}">&minus;</button><output aria-live="polite">${st.order[id]}</output><button data-inc="${id}" aria-label="One more for ${c}">+</button></span></div>`; }).join('');
    const truck = st.sheet.map(id => `<span>${fruit(id).emoji.repeat(st.order[id])}</span>`).join('');
    const codeList = FRUITS.map(f => `<li class="${hl.codes.includes(f.id) ? 'hl' : ''}"><span class="e">${f.emoji}</span><span>${f.name}</span><b>${st.codes[f.id]}</b></li>`).join('');
    const choices = FRUITS.map(f => `<button class="cc-choice${py ? ' py' : ''}${st.pickBest === f.id ? ' sel' : ''}" data-best="${f.id}" aria-pressed="${st.pickBest === f.id}"><span class="e">${f.emoji}</span><span class="n">${nm(f.id)}</span></button>`).join('');
    const a = fruit(st.more), b = fruit(st.less);
    const cmpQ = py ? `What is <code>sales["${a.id}"] - sales["${b.id}"]</code>?` : `${a.emoji} ${a.name} sold how many more crates than ${b.emoji} ${b.name}?`;
    const bestQ = py ? 'Which key does <code>max(sales, key=sales.get)</code> return?' : 'Which fruit sold the most crates?';
    const dataBlock = py
      ? `<h2>The code</h2>${pyCode(st, hl)}<p class="tiny" style="margin-top:8px">The loop runs once for each fruit. Work out what <code>order</code> holds when it finishes.</p>`
      : `<h2>Today's sales</h2><div class="cc-card">${chart(st.sold, hl)}</div><h2>1. Supplier codes</h2><p style="font-size:.9rem">Your supplier only takes orders by product code.</p><ul class="cc-codes">${codeList}</ul>`;
    const intro = py
      ? 'This is the fruit-stall order task written as Python. Read the code, then fill in the values it stores and answer two questions about it.'
      : 'You run a fruit stall and today is stocktaking. The chart shows how many crates of each fruit sold. Use it to fill in tomorrow\'s order sheet and answer two quick questions.';
    const sheetHead = py
      ? `<h2>1. What does <code>order</code> hold?</h2><p style="font-size:.9rem">Each row is one entry of <code>order</code>. Enter the value stored under that key.</p>`
      : `<h2>2. Tomorrow's order sheet</h2><p style="font-size:.9rem">For each fruit, order the same number of crates as it sold today. Put the quantity on the row with that fruit's code.</p>`;
    const n = (x) => (py ? x - 1 : x);
    root.innerHTML = `<div class="cc"><p>${intro}</p>${dataBlock}
      ${sheetHead}${orders}
      <p style="font-size:.9rem;margin-top:6px">${py ? 'Total of the stored values' : 'Truck load'}: <b>${total}</b></p>${py ? '' : `<div class="cc-truck" aria-hidden="true">${truck}</div>`}
      <h2>${py ? '2' : '3'}. ${py ? 'Which key?' : 'Best seller'}</h2>
      <p style="font-size:.9rem">${bestQ}${mark('best')}</p>
      <div class="cc-choices" role="group" aria-label="Best seller">${choices}</div>
      <h2>${py ? '3' : '4'}. ${py ? 'Subtract' : 'Compare'}</h2>
      <div class="cc-row${rowCls('diff')}"><span class="lab">${cmpQ}${mark('diff')}</span>${stepper('d', st.diff, 'answer')}</div>
      <div class="cc-actions">
        <button class="cc-btn" data-act="check">Check my answers</button>
        ${st.note === 'first' ? '<button class="cc-btn sec" data-act="tryagain">Try again myself</button>' : ''}
        ${st.result && !st.inv && Object.values(st.result).some(v => !v) ? '<button class="cc-btn sec" data-act="investigate">Help me investigate</button>' : ''}
        <button class="cc-btn sec" data-act="new">New day</button>
      </div>
      <div class="cc-msg ${msgCls || ''}" role="status" aria-live="polite">${msg || ''}</div>
      ${invPanel()}
      <p style="font-size:.85rem;color:#666">${wins ? 'Days solved this visit: ' + wins : ''}</p>
    </div>`;
  }

  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('div'); c.className = 'cc-conf';
    const bits = ['🍎', '🍌', '🍇', '🍊', '✨'];
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('span'); s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + '%'; s.style.animationDelay = Math.random() * 0.8 + 's'; c.appendChild(s);
    }
    document.body.appendChild(c); setTimeout(() => c.remove(), 3600);
  }

  const touch = () => { st.result = null; st.marks = false; st.note = null; };
  root.addEventListener('click', e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    const d = t.dataset;
    let msg = '', cls = '';
    const ivKey = Object.keys(d).find(k => /^iv\d(Inc|Dec)$/.test(k));
    if (d.inc) { st.order[d.inc] = Math.min(MAXV, st.order[d.inc] + 1); touch(); }
    else if (d.dec) { st.order[d.dec] = Math.max(0, st.order[d.dec] - 1); touch(); }
    else if (d.best) { st.pickBest = d.best; touch(); }
    else if (d.dInc !== undefined) { st.diff = Math.min(MAXV, st.diff + 1); touch(); }
    else if (d.dDec !== undefined) { st.diff = Math.max(0, st.diff - 1); touch(); }
    else if (ivKey) { const i = +ivKey[2]; st.inv.v[i] = Math.max(0, Math.min(MAXV, st.inv.v[i] + (ivKey.endsWith('Inc') ? 1 : -1))); }
    else if (d.ifruit) { st.inv.fruit = d.ifruit; }
    else if (d.act === 'new') { st = newRound(); }
    else if (d.act === 'tryagain') { st.note = null; st.result = null; }
    else if (d.act === 'check') {
      st.checks++; const r = evaluate(); st.result = r;
      const bad = Object.values(r).filter(v => !v).length;
      if (!bad) { wins++; st.marks = true; st.note = null; msg = 'All correct. The stall is stocked for tomorrow.'; cls = 'ok'; confetti(); }
      else if (st.checks === 1) { st.marks = false; st.note = 'first'; msg = bad + (bad === 1 ? ' answer needs' : ' answers need') + ' another look. Try to find which yourself, or ask for help.'; cls = 'no'; }
      else { st.marks = true; st.note = null; msg = bad + (bad === 1 ? ' answer still needs' : ' answers still need') + ' another look. The marked rows are the ones to check.'; cls = 'no'; }
    } else if (d.act === 'investigate') {
      const r = st.result || evaluate(); st.result = r; st.note = null;
      const item = firstWrong(r);
      if (item) st.inv = { item, stage: 'trace', fruit: null, v: [0, 0, 0, 0], hint: 0, worked: false };
    } else if (d.act === 'isubmit') { st.inv.stage = 'feedback'; }
    else if (d.act === 'ihint') { st.inv.hint = Math.min(2, st.inv.hint + 1); }
    else if (d.act === 'iworked') { st.inv.worked = true; }
    else if (d.act === 'iclose') { st.inv = null; }
    render(msg, cls);
  });
  render();
        }
