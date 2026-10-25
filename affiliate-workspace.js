/* BIMA affiliate workspace engine.
   Satu instance per platform (TikTok / Shopee): storage, DOM, tema, dan menu sidebar sepenuhnya terpisah.
   Tidak ada simulasi publikasi atau koneksi platform; semua angka performa diisi manual oleh pemilik. */
(() => {
'use strict';
if (window.BimaAffiliate) return;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
const rp = n => n == null ? '—' : 'Rp' + Math.round(n).toLocaleString('id-ID');
const pct = n => n == null ? '—' : (Math.round(n * 10) / 10).toLocaleString('id-ID') + '%';
const STAGES = [['research','Riset'],['production','Produksi'],['review','Review'],['ready','Siap unggah'],['published','Tayang']];
const SECTIONS = ['ringkasan','kalender','desk','publishing'];
const PERF = ['views','clicks','orders','earned'];
const LIVE_ONLY = new Set([...PERF, 'publishedUrl', 'basketChecked']);

/* Global (sekali): sembunyikan hero/metrik YouTube di semua channel non-YouTube agar tidak tercampur. */
const globalCss = document.createElement('style');
globalCss.textContent = `body[data-channel]:not([data-channel="youtube"]) header.head{display:none!important}
body[data-channel="tiktok"] #futureWorkspace,body[data-channel="shopee"] #futureWorkspace{display:none!important}`;
document.head.append(globalCss);

function pipelineOf(d) {
  if (/^Tayang/.test(d.stage || '')) return 'published';
  if (d.stage === 'Siap unggah manual') return 'ready';
  if (d.mediaName) return 'review';
  if (d.prompt) return 'production';
  return 'research';
}

/* Skor kelayakan uji: transparan, hanya memakai angka yang diisi pemilik. Bukan jaminan hasil. */
function economics(d, cfg) {
  const price = num(d.price), ret = num(d.returnRate);
  const base = num(d.commission), extra = cfg.hasXtra ? num(d.xtra) : null;
  const rate = base == null && extra == null ? null : (base || 0) + (extra || 0);
  const gross = price != null && rate != null ? price * rate / 100 : null;
  const net = gross != null ? gross * (1 - (ret || 0) / 100) : null;
  const sales = num(d.sales), rating = num(d.rating);
  const parts = [];
  const add = (label, got, max, known) => parts.push({ label, got: known ? got : 0, max, known });
  add('Momentum penjualan', sales >= 1000 ? 30 : sales >= 300 ? 24 : sales >= 100 ? 16 : sales >= 20 ? 8 : 0, 30, sales != null);
  add('Komisi bersih / order', net >= 5000 ? 25 : net >= 2500 ? 18 : net >= 1000 ? 10 : net > 0 ? 4 : 0, 25, net != null);
  add('Rating produk', rating >= 4.8 ? 15 : rating >= 4.6 ? 11 : rating >= 4.3 ? 6 : 0, 15, rating != null);
  add('Risiko refund / retur', ret <= 3 ? 15 : ret <= 8 ? 9 : ret <= 15 ? 4 : 0, 15, ret != null);
  add('Mudah didemokan di video', d.demoChecked ? 15 : 0, 15, true);
  const numericKnown = parts.slice(0, 4).filter(p => p.known).length;
  const maxKnown = parts.filter(p => p.known).reduce((a, p) => a + p.max, 0);
  const got = parts.reduce((a, p) => a + p.got, 0);
  const score = numericKnown >= 2 && maxKnown ? Math.round(got / maxKnown * 100) : null;
  const tone = score == null ? 'na' : score >= 70 ? 'good' : score >= 50 ? 'mid' : 'low';
  const verdict = { na: 'Lengkapi data', good: 'Layak diuji', mid: 'Pertimbangkan', low: 'Lemah' }[tone];
  return { price, rate, gross, net, parts, numericKnown, score, tone, verdict, ordersTo1M: net > 0 ? Math.ceil(1000000 / net) : null };
}

function mount(cfg) {
  const P = cfg.id;
  const $ = id => document.getElementById(`aff-${P}-${id}`);
  let data = { drafts: [], selected: '', imported: [] };
  try { const s = JSON.parse(localStorage.getItem(cfg.storeKey) || 'null'); if (s && Array.isArray(s.drafts)) data = Object.assign(data, s); } catch {}
  if (!Array.isArray(data.imported)) data.imported = [];
  let sec = 'ringkasan', videoURL = '', mediaSerial = 0;

  /* ---------- Template ---------- */
  const fieldHTML = f => {
    const id = `aff-${P}-f-${f.k}`, full = f.full ? ' aff-full' : '';
    if (f.t === 'check') return `<label class="aff-check${full}"><input id="${id}" type="checkbox" data-k="${f.k}"><span>${esc(f.l)}</span></label>`;
    if (f.t === 'textarea') return `<label class="${full.trim()}">${esc(f.l)}<textarea id="${id}" data-k="${f.k}" rows="${f.rows || 3}" placeholder="${esc(f.ph || '')}"></textarea>${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
    if (f.t === 'select') return `<label class="${full.trim()}">${esc(f.l)}<select id="${id}" data-k="${f.k}">${f.opts.map(o => `<option value="${esc(o)}">${esc(o || '— pilih —')}</option>`).join('')}</select></label>`;
    return `<label class="${full.trim()}">${esc(f.l)}<input id="${id}" data-k="${f.k}" type="${f.t || 'text'}" ${f.attrs || ''} placeholder="${esc(f.ph || '')}">${f.hint ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
  };
  const group = (title, hint, list) => `<section class="aff-card"><h3>${title}</h3>${hint ? `<p class="aff-muted">${hint}</p>` : ''}<div class="aff-fields">${list.map(fieldHTML).join('')}</div></section>`;

  const root = document.createElement('section');
  root.id = `${P}Workspace`; root.hidden = true; root.className = 'aff-ws'; root.dataset.platform = P; root.dataset.sec = sec;
  root.style.setProperty('--a', cfg.theme.accent); root.style.setProperty('--a2', cfg.theme.accent2); root.style.setProperty('--a-soft', cfg.theme.soft);
  root.innerHTML = `
<header class="aff-head"><div><span class="aff-eyebrow">${esc(cfg.eyebrow)}</span><h2>${esc(cfg.title)}</h2><p>${esc(cfg.tagline)}</p></div><span class="aff-badge">${esc(cfg.badge)}</span></header>
<nav class="aff-tabs" aria-label="Bagian ${esc(cfg.name)}">${SECTIONS.map(s => `<button type="button" data-sec-go="${s}">${esc(cfg.menu[s])}</button>`).join('')}</nav>
<div class="aff-notice"><strong>${esc(cfg.notice.title)}</strong><p>${esc(cfg.notice.text)}</p></div>

<div data-secs="ringkasan"><div class="aff-kpis" id="aff-${P}-kpis"></div><section class="aff-card"><div class="aff-row"><h3>Pipeline ${esc(cfg.name)}</h3><button type="button" class="aff-primary" data-act="new">+ Video baru</button></div><div class="aff-board" id="aff-${P}-board"></div></section></div>

<div data-secs="kalender"><section class="aff-card"><div class="aff-row"><div><h3>Jadwal produksi · WIB</h3><p class="aff-muted">Urut tanggal. Hanya konten ${esc(cfg.name)}.</p></div><div class="aff-actions"><button type="button" data-act="backup">Backup JSON</button><button type="button" class="aff-primary" data-act="new">+ Video baru</button></div></div><div id="aff-${P}-agenda"></div></section></div>

<div data-secs="desk publishing"><div class="aff-picker" id="aff-${P}-picker"></div></div>
<div data-secs="desk publishing" id="aff-${P}-empty" class="aff-card aff-empty"><h3>Mulai dari produk pertama</h3><p class="aff-muted">${esc(cfg.emptyText)}</p><button type="button" class="aff-primary" data-act="new">+ Video baru</button></div>

<form id="aff-${P}-form" hidden novalidate>
 <div class="aff-split" data-secs="desk"><div class="aff-stack">
  ${group('01 · Produk & jadwal', '', cfg.fields.product)}
  ${group('02 · Ekonomi produk', 'Isi dari data listing/dashboard. Skor hanya memakai angka yang kamu isi.', cfg.fields.economics)}
  <section class="aff-card"><div class="aff-row"><h3>03 · Video AI produk</h3><button type="button" data-act="build">Buat brief & caption</button></div><p class="aff-muted">Gunakan foto produk asli sebagai referensi agar bentuk, label, warna, dan varian sesuai barang yang dijual.</p>
   <div class="aff-fields"><label class="aff-full">Brief Gemini / Flow<textarea id="aff-${P}-f-prompt" data-k="prompt" rows="9" placeholder="Isi fakta produk, lalu buat brief."></textarea></label><div class="aff-full"><button type="button" data-act="copy" data-target="prompt">Copy brief</button></div>
   <label class="aff-full">Caption affiliate<textarea id="aff-${P}-f-caption" data-k="caption" rows="3"></textarea></label><div class="aff-full"><button type="button" data-act="copy" data-target="caption">Copy caption</button></div></div></section>
 </div><aside class="aff-side"><div id="aff-${P}-score"></div><details class="aff-card aff-guide" open><summary>Panduan profit ${esc(cfg.name)}</summary><ul>${cfg.guide.map(g => `<li>${esc(g)}</li>`).join('')}</ul><small>Panduan dari riset publik, bukan jaminan hasil. Cek angka terbaru di dashboard resmi.</small></details></aside></div>

 <div class="aff-split" data-secs="publishing"><div class="aff-stack">
  <section class="aff-card"><h3>Review MP4 & ${esc(cfg.publishWord)}</h3>
   <label>Video final · MP4<input id="aff-${P}-video-file" type="file" accept="video/mp4"></label><p id="aff-${P}-media-state" class="aff-muted">Belum ada video.</p><video id="aff-${P}-video" controls playsinline hidden></video>
   <div class="aff-checks">${cfg.checks.map(c => fieldHTML({ k: c.k, l: c.l, t: 'check' })).join('')}</div>
   <button type="button" class="aff-primary" data-act="ready">Tandai siap unggah manual</button>
   <p class="aff-muted">${esc(cfg.uploadHint)}</p></section>
  <section class="aff-card"><h3>Catat tayang</h3><div class="aff-fields">
   <label class="aff-full">${esc(cfg.publishedLabel)}<input id="aff-${P}-f-publishedUrl" data-k="publishedUrl" type="url" placeholder="${esc(cfg.publishedPh)}"></label>
   ${fieldHTML({ k: cfg.record.k, l: cfg.record.l, t: 'check', full: true })}</div>
   <button type="button" data-act="record">Catat sudah tayang</button><p class="aff-muted">Pencatatan ini berdasarkan konfirmasi pemilik, bukan verifikasi API ${esc(cfg.name)}.</p></section>
 </div><aside class="aff-side"><section class="aff-card"><h3>Performa tayang · input manual</h3><p class="aff-muted">Salin angka dari dashboard ${esc(cfg.name)} setelah video berjalan beberapa hari.</p>
  <div class="aff-fields">${cfg.fields.perf.map(fieldHTML).join('')}</div><div id="aff-${P}-perfstats" class="aff-perf"></div></section></aside></div>

 <div class="aff-save" data-secs="desk publishing"><button type="submit" class="aff-primary">Simpan draft</button><span id="aff-${P}-msg" role="status" aria-live="polite">Perubahan tersimpan otomatis di browser ini.</span></div>
</form>`;
  document.getElementById('futureWorkspace').insertAdjacentElement('afterend', root);

  /* ---------- Style (tercakup per platform) ---------- */
  if (!document.getElementById('aff-ws-css')) {
    const css = document.createElement('style'); css.id = 'aff-ws-css';
    css.textContent = `
.aff-ws{--a:#6be6d7;--a2:#fe2c55;--a-soft:rgba(107,230,215,.12);max-width:1480px;margin:0 auto;padding:22px 24px 40px;color:var(--fg,#eef1ff);font-family:var(--font,system-ui)}
.aff-ws[hidden],.aff-ws [hidden]{display:none!important}
.aff-ws[data-sec="ringkasan"] [data-secs]:not([data-secs~="ringkasan"]),.aff-ws[data-sec="kalender"] [data-secs]:not([data-secs~="kalender"]),.aff-ws[data-sec="desk"] [data-secs]:not([data-secs~="desk"]),.aff-ws[data-sec="publishing"] [data-secs]:not([data-secs~="publishing"]){display:none!important}
.aff-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--line,rgba(148,163,255,.14))}
.aff-head h2{margin:6px 0 4px;font-size:clamp(24px,3vw,34px);letter-spacing:-.02em;text-align:left}.aff-head p{margin:0;color:var(--muted,#a6b3d9);font-size:13.5px}
.aff-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.16em;color:var(--a)}
.aff-badge{font-size:11px;font-weight:700;border:1px solid var(--a);color:var(--a);background:var(--a-soft);border-radius:999px;padding:7px 12px;white-space:nowrap}
.aff-tabs{display:none;gap:6px;overflow-x:auto;margin-bottom:14px;padding-bottom:4px}.aff-tabs button{flex:0 0 auto}
.aff-tabs button[aria-current=true]{background:var(--a-soft);border-color:var(--a);color:#fff}
.aff-notice{border:1px solid var(--a);background:var(--a-soft);border-radius:12px;padding:12px 15px;margin-bottom:16px}.aff-notice strong{color:var(--a);font-size:13px}.aff-notice p{margin:5px 0 0;font-size:12.5px;line-height:1.6;color:var(--fg,#eef1ff);text-align:left}
.aff-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px}
.aff-kpi{background:var(--panel,#0d1530);border:1px solid var(--line,rgba(148,163,255,.14));border-radius:14px;padding:14px 16px}.aff-kpi span{display:block;font-size:11px;color:var(--soft,#7f8dbd);font-weight:700;letter-spacing:.04em}.aff-kpi strong{display:block;font-size:24px;margin-top:5px;letter-spacing:-.01em}.aff-kpi small{display:block;font-size:11px;color:var(--muted,#a6b3d9);margin-top:3px}.aff-kpi.hl{border-color:var(--a)}.aff-kpi.hl strong{color:var(--a)}
.aff-card{background:var(--panel,#0d1530);border:1px solid var(--line,rgba(148,163,255,.14));border-radius:14px;padding:18px;margin-bottom:14px}
.aff-card h3{margin:0 0 10px;font-size:15px;text-align:left}.aff-muted{color:var(--muted,#a6b3d9);font-size:12.5px;line-height:1.6;margin:4px 0 10px;text-align:left}
.aff-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px}.aff-actions{display:flex;gap:8px;flex-wrap:wrap}
.aff-board{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:8px}
.aff-col{background:rgba(255,255,255,.02);border:1px solid var(--line,rgba(148,163,255,.14));border-radius:12px;padding:10px;min-height:120px}.aff-col h4{margin:0 0 8px;font-size:11.5px;letter-spacing:.06em;color:var(--muted,#a6b3d9);display:flex;justify-content:space-between;text-transform:uppercase}
.aff-col h4 b{color:var(--a)}
.aff-item{display:block;width:100%;text-align:left;margin-bottom:8px;padding:9px 10px;background:var(--panel2,#121c3d);border:1px solid var(--line,rgba(148,163,255,.14));border-radius:10px;color:inherit;font:600 12.5px/1.4 var(--font,system-ui);cursor:pointer}
.aff-item:hover{border-color:var(--a)}.aff-item small{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px;font-weight:500;color:var(--muted,#a6b3d9);font-size:11px}
.aff-chip{display:inline-block;border-radius:999px;padding:2px 8px;font-size:10.5px;font-weight:800;border:1px solid var(--line2,rgba(148,163,255,.26))}
.aff-chip[data-tone=good]{color:#4fd6a8;border-color:#2f8f73;background:rgba(79,214,168,.1)}.aff-chip[data-tone=mid]{color:#ffc978;border-color:#8f7a3f;background:rgba(255,201,120,.1)}.aff-chip[data-tone=low]{color:#ff8a9a;border-color:#8f4552;background:rgba(255,138,154,.1)}.aff-chip[data-tone=na]{color:var(--soft,#7f8dbd)}
.aff-agenda-day{margin:14px 0 6px;font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--a)}
.aff-picker{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-bottom:14px}.aff-picker label{flex:1 1 320px;margin:0}
.aff-split{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}.aff-stack{min-width:0}.aff-side{position:sticky;top:12px;min-width:0}
.aff-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.aff-full{grid-column:1/-1}
.aff-ws label{display:block;font-size:12px;color:var(--muted,#a6b3d9);font-weight:600;text-align:left}
.aff-ws input:not([type=checkbox]),.aff-ws textarea,.aff-ws select{display:block;width:100%;margin-top:6px;background:#0a1129;border:1px solid var(--line2,rgba(148,163,255,.26));border-radius:9px;padding:10px 11px;color:var(--fg,#eef1ff);font:13px/1.5 var(--font,system-ui)}
.aff-ws input:focus,.aff-ws textarea:focus,.aff-ws select:focus{outline:2px solid var(--a);outline-offset:1px}.aff-ws textarea{resize:vertical}
.aff-ws label small{display:block;margin-top:4px;font-weight:400;color:var(--soft,#7f8dbd)}
.aff-check{display:flex!important;gap:9px;align-items:flex-start;line-height:1.55;color:var(--fg,#eef1ff)!important;font-weight:500!important}.aff-check input{margin-top:3px;accent-color:var(--a)}
.aff-checks{margin:10px 0}
.aff-ws button{cursor:pointer;background:var(--panel3,#19254c);color:#e9eeff;border:1px solid var(--line2,rgba(148,163,255,.26));border-radius:9px;padding:9px 13px;font:700 12px var(--font,system-ui)}
.aff-ws button:hover{border-color:var(--a)}.aff-ws .aff-primary{background:var(--a);border-color:var(--a);color:#06101c}.aff-ws button:disabled{opacity:.5}
.aff-ws video{width:100%;max-height:420px;margin:10px 0;background:#050b15;border-radius:10px}
.aff-save{display:flex;gap:14px;align-items:center;padding:14px 16px;background:var(--panel2,#121c3d);border:1px solid var(--line,rgba(148,163,255,.14));border-radius:12px;position:sticky;bottom:10px;z-index:5}.aff-save span{font-size:12px;color:var(--muted,#a6b3d9)}
.aff-score{border-radius:14px;padding:16px;margin-bottom:14px;background:var(--panel,#0d1530);border:1px solid var(--line,rgba(148,163,255,.14))}
.aff-score-top{display:flex;gap:14px;align-items:center;margin-bottom:12px}.aff-score-n{font-size:40px;font-weight:800;letter-spacing:-.03em;line-height:1;min-width:64px}
.aff-score[data-tone=good] .aff-score-n{color:#4fd6a8}.aff-score[data-tone=mid] .aff-score-n{color:#ffc978}.aff-score[data-tone=low] .aff-score-n{color:#ff8a9a}.aff-score[data-tone=na] .aff-score-n{color:var(--soft,#7f8dbd)}
.aff-score-top b{display:block;font-size:14px}.aff-score-top small{color:var(--muted,#a6b3d9);font-size:11.5px}
.aff-econ{display:grid;gap:6px;margin:0 0 12px}.aff-econ div{display:flex;justify-content:space-between;gap:10px;font-size:12.5px}.aff-econ dt{color:var(--muted,#a6b3d9)}.aff-econ dd{margin:0;font-weight:800}
.aff-meter{margin-top:8px}.aff-meter div{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted,#a6b3d9)}.aff-meter i{display:block;height:5px;border-radius:4px;background:rgba(255,255,255,.07);margin-top:3px;overflow:hidden}.aff-meter i u{display:block;height:100%;background:var(--a);text-decoration:none}.aff-meter .off{opacity:.45}
.aff-guide summary{cursor:pointer;font-weight:800;font-size:13.5px}.aff-guide ul{margin:10px 0 8px;padding-left:18px;font-size:12.5px;line-height:1.65;color:var(--fg,#eef1ff);text-align:left}.aff-guide small{color:var(--soft,#7f8dbd);font-size:11px}
.aff-perf{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}.aff-perf div{background:var(--panel2,#121c3d);border-radius:10px;padding:9px 10px}.aff-perf span{display:block;font-size:10.5px;color:var(--soft,#7f8dbd)}.aff-perf b{font-size:15px}
.aff-empty{text-align:left}
@media(max-width:1100px){.aff-board{grid-template-columns:repeat(2,minmax(0,1fr))}.aff-split{grid-template-columns:1fr}.aff-side{position:static}}
@media(max-width:900px){.aff-tabs{display:flex}}
@media(max-width:600px){.aff-ws{padding:14px 12px 30px}.aff-fields{grid-template-columns:1fr}.aff-board{grid-template-columns:1fr}.aff-head{flex-direction:column}.aff-perf{grid-template-columns:1fr 1fr}}`;
    document.head.append(css);
  }

  /* ---------- Data ---------- */
  const selected = () => data.drafts.find(d => d.id === data.selected);
  const say = s => { $('msg').textContent = s; };
  const allFields = [...cfg.fields.product, ...cfg.fields.economics, ...cfg.fields.perf, ...cfg.checks.map(c => ({ k: c.k, t: 'check' })), { k: cfg.record.k, t: 'check' }, { k: 'prompt' }, { k: 'caption' }, { k: 'publishedUrl' }];
  const fieldEl = k => document.getElementById(`aff-${P}-f-${k}`);
  function save() { try { localStorage.setItem(cfg.storeKey, JSON.stringify(data)); return true; } catch { say('Penyimpanan gagal. Gunakan Backup JSON.'); return false; } }
  function collect() {
    const d = selected(); if (!d) return;
    for (const f of allFields) { const el = fieldEl(f.k); if (!el) continue; d[f.k] = el.type === 'checkbox' ? el.checked : el.value.trim(); }
    d.updatedAt = new Date().toISOString();
  }
  function importLegacy() {
    let rows; try { rows = JSON.parse(localStorage.getItem('bima_affiliate_campaigns_v1') || '[]'); } catch { return false; }
    if (!Array.isArray(rows)) return false;
    let changed = false;
    for (const r of rows) {
      const mine = r && (r.platform === P || (!r.platform && (P === 'shopee' ? r.shopeeUrl : r.tiktokUrl)));
      if (!mine || !r.id || data.imported.includes(r.id)) continue;
      const st = r.status || r[P];
      data.imported.push(r.id);
      data.drafts.push({ id: `${P}-imp-${r.id}`, product: r.name || '', productUrl: r.productUrl || r.shopeeUrl || r.tiktokUrl || '', price: r.price || '', commission: r.commission || '', sales: r.sales || '', rating: r.rating || '', date: r.date || '', time: '19:00', facts: r.angle || '', prompt: r.script || '', caption: r.caption || '', mediaName: r.video || '', stage: st === 'published' ? 'Tayang · konfirmasi pemilik' : st === 'ready' ? 'Siap unggah manual' : 'Draft', importedFrom: 'bima_affiliate_campaigns_v1' });
      changed = true;
    }
    return changed;
  }
  if (importLegacy()) save();

  /* ---------- Render ---------- */
  const draftLabel = d => `${d.date || 'Belum dijadwalkan'} · ${d.product || 'Produk baru'}`;
  function itemBtn(d) {
    const e = economics(d, cfg);
    return `<button type="button" class="aff-item" data-open="${esc(d.id)}">${esc(d.product || 'Produk baru')}<small><span>${esc(d.date || 'Belum dijadwalkan')}${d.time ? ' · ' + esc(d.time) : ''}</span>${e.score != null ? `<span class="aff-chip" data-tone="${e.tone}">${e.score}</span>` : ''}${e.net != null ? `<span>${rp(e.net)}/order</span>` : ''}</small></button>`;
  }
  function paintOverview() {
    const ds = data.drafts, cols = {}; STAGES.forEach(([k]) => cols[k] = []);
    ds.forEach(d => cols[pipelineOf(d)].push(d));
    const pub = cols.published, earned = pub.reduce((a, d) => a + (num(d.earned) || 0), 0);
    const clicks = pub.reduce((a, d) => a + (num(d.clicks) || 0), 0), orders = pub.reduce((a, d) => a + (num(d.orders) || 0), 0);
    const scores = ds.map(d => economics(d, cfg).score).filter(s => s != null);
    const kpi = (l, v, s, hl) => `<div class="aff-kpi${hl ? ' hl' : ''}"><span>${l}</span><strong>${v}</strong><small>${s}</small></div>`;
    $('kpis').innerHTML = kpi('Total komisi', rp(earned), 'Dari video tayang (input manual)', true)
      + kpi('Komisi / video tayang', pub.length ? rp(earned / pub.length) : '—', pub.length + ' video tayang')
      + kpi('Konversi klik → order', clicks ? pct(orders / clicks * 100) : '—', orders + ' order · ' + clicks + ' klik')
      + kpi('Dalam produksi', cols.production.length + cols.review.length + cols.ready.length, 'Produksi · review · siap unggah')
      + kpi('Kandidat riset', cols.research.length, 'Belum punya brief video')
      + kpi('Rata-rata skor', scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : '—', scores.length + ' produk berskor');
    $('board').innerHTML = STAGES.map(([k, l]) => `<div class="aff-col"><h4>${l}<b>${cols[k].length}</b></h4>${(k === 'research' ? [...cols[k]].sort((a, b) => (economics(b, cfg).score ?? -1) - (economics(a, cfg).score ?? -1)) : cols[k]).map(itemBtn).join('') || '<p class="aff-muted">—</p>'}</div>`).join('');
  }
  function paintAgenda() {
    const el = $('agenda');
    if (!data.drafts.length) { el.innerHTML = '<p class="aff-muted">Belum ada draft. Tekan “+ Video baru”.</p>'; return; }
    const sorted = [...data.drafts].sort((a, b) => ((a.date || '9999') + (a.time || '')).localeCompare((b.date || '9999') + (b.time || '')));
    let day = null, html = '';
    for (const d of sorted) {
      const key = d.date || 'Belum dijadwalkan';
      if (key !== day) { day = key; html += `<div class="aff-agenda-day">${esc(key)}</div>`; }
      html += itemBtn(d).replace('</small>', `<span class="aff-chip">${esc(STAGES.find(s => s[0] === pipelineOf(d))[1])}</span></small>`);
    }
    el.innerHTML = html;
  }
  function paintPicker() {
    $('picker').innerHTML = `<label>Draft aktif<select data-act="pick">${data.drafts.length ? '' : '<option value="">Belum ada draft</option>'}${[...data.drafts].sort((a, b) => ((a.date || '') + (a.time || '')).localeCompare((b.date || '') + (b.time || ''))).map(d => `<option value="${esc(d.id)}"${d.id === data.selected ? ' selected' : ''}>${esc(draftLabel(d))}</option>`).join('')}</select></label><button type="button" data-act="new">+ Video baru</button>`;
  }
  function paintScore(d) {
    const e = economics(d, cfg);
    $('score').innerHTML = `<div class="aff-score" data-tone="${e.tone}"><div class="aff-score-top"><div class="aff-score-n">${e.score ?? '—'}</div><div><b>${e.verdict}</b><small>${e.numericKnown}/4 angka riset terisi</small></div></div>
<dl class="aff-econ"><div><dt>Komisi kotor / order</dt><dd>${rp(e.gross)}</dd></div><div><dt>Setelah estimasi refund</dt><dd>${rp(e.net)}</dd></div><div><dt>Order untuk Rp1 juta</dt><dd>${e.ordersTo1M == null ? '—' : e.ordersTo1M.toLocaleString('id-ID')}</dd></div></dl>
<div class="aff-meter">${e.parts.map(p => `<div class="${p.known ? '' : 'off'}" style="margin-top:7px"><span>${p.label}</span><span>${p.known ? p.got : '–'}/${p.max}</span></div><i class="${p.known ? '' : 'off'}"><u style="width:${p.known ? Math.round(p.got / p.max * 100) : 0}%"></u></i>`).join('')}</div></div>`;
  }
  function paintPerf(d) {
    const v = num(d.views), c = num(d.clicks), o = num(d.orders), e = num(d.earned);
    const cell = (l, x) => `<div><span>${l}</span><b>${x}</b></div>`;
    $('perfstats').innerHTML = cell('Klik / views', v && c != null ? pct(c / v * 100) : '—') + cell('Order / klik', c && o != null ? pct(o / c * 100) : '—') + cell('Komisi / order', o && e != null ? rp(e / o) : '—');
  }
  async function paintMedia(d) {
    const serial = ++mediaSerial, vid = $('video');
    if (videoURL) URL.revokeObjectURL(videoURL); videoURL = '';
    vid.pause(); vid.removeAttribute('src'); vid.hidden = true; $('video-file').value = '';
    $('media-state').textContent = d.mediaName ? 'Membaca video tersimpan…' : 'Belum ada video.';
    try {
      const blob = await mediaDB('get', d.id);
      if (serial !== mediaSerial) return;
      if (blob instanceof Blob) { videoURL = URL.createObjectURL(blob); vid.src = videoURL; vid.hidden = false; $('media-state').textContent = d.mediaName + ' · tersimpan di browser ini'; }
      else if (d.mediaName) $('media-state').textContent = 'File tidak ditemukan di browser ini. Pilih ulang MP4.';
    } catch { $('media-state').textContent = 'Penyimpanan video tidak tersedia.'; }
  }
  function paintForm() {
    const d = selected(), has = !!d;
    $('empty').hidden = has; $('form').hidden = !has;
    if (!has) return;
    for (const f of allFields) { const el = fieldEl(f.k); if (!el) continue; if (el.type === 'checkbox') el.checked = !!d[f.k]; else el.value = d[f.k] ?? ''; }
    paintScore(d); paintPerf(d); paintMedia(d);
  }
  function paintAll() {
    root.dataset.sec = sec;
    root.querySelectorAll('[data-sec-go]').forEach(b => b.setAttribute('aria-current', String(b.dataset.secGo === sec)));
    paintOverview(); paintAgenda(); paintPicker(); paintForm();
  }

  /* ---------- Navigasi bagian (menu sidebar) ---------- */
  function go(next, skipCollect) {
    if (!skipCollect) collect();
    save();
    sec = P === 'shopee' && next === 'analytics' ? 'analytics' : SECTIONS.includes(next) ? next : 'ringkasan';
    paintAll();
    if (!skipCollect) say('Perubahan tersimpan otomatis di browser ini.');
    document.dispatchEvent(new CustomEvent('bima:channel-section', { detail: sec }));
    if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: 'start' });
  }
  document.addEventListener('click', e => {
    if (state.active !== P) return;
    const b = e.target.closest('.menu-item[data-go]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation(); go(b.dataset.go);
  }, true);
  root.addEventListener('click', e => { const b = e.target.closest('[data-sec-go]'); if (b) go(b.dataset.secGo); });

  /* ---------- Aksi ---------- */
  function newDraft() {
    collect();
    const d = { id: `${P}-${crypto.randomUUID()}`, date: today(), time: '19:00', stage: 'Draft' };
    data.drafts.push(d); data.selected = d.id; save();
    go('desk', true);
  }
  function missing(d) {
    const m = []; if (!d.product) m.push('nama produk'); if (!d.productUrl) m.push('link produk'); if (!d.date || !d.time) m.push('jadwal'); if (!d.facts) m.push('fakta produk');
    return m;
  }
  async function copyText(k) {
    const el = fieldEl(k); if (!el.value) return say('Belum ada teks untuk disalin.');
    try { await navigator.clipboard.writeText(el.value); say('Teks disalin.'); } catch { el.focus(); el.select(); say('Copy otomatis diblokir. Tekan Ctrl+C pada teks terpilih.'); }
  }
  root.addEventListener('click', async e => {
    const open = e.target.closest('[data-open]');
    if (open) { collect(); data.selected = open.dataset.open; save(); go(['desk', 'publishing'].includes(sec) ? sec : 'desk', true); return; }
    const a = e.target.closest('[data-act]'); if (!a || a.tagName === 'SELECT') return;
    const act = a.dataset.act, d = selected();
    if (act === 'new') return newDraft();
    if (act === 'copy') return copyText(a.dataset.target);
    if (act === 'backup') { collect(); const u = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })), l = document.createElement('a'); l.href = u; l.download = cfg.backupName; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); return; }
    if (!d) return;
    if (act === 'build') {
      collect();
      if (!d.product || !d.facts || !d.productUrl) return say('Isi nama produk, link, dan fakta produk terlebih dahulu.');
      const out = cfg.build(d); d.prompt = out.prompt; d.caption = out.caption; save(); paintForm(); say('Brief dan caption siap. Review sebelum generate.');
    }
    if (act === 'ready') {
      collect(); const m = missing(d);
      if (m.length) { go('desk'); return say('Lengkapi dulu: ' + m.join(', ') + '.'); }
      if (!cfg.readyGate(d)) return say(cfg.readyMessage);
      try { if (!(await mediaDB('get', d.id) instanceof Blob)) return say('Tambahkan MP4 final terlebih dahulu.'); } catch { return say('Tidak dapat membaca MP4.'); }
      d.stage = 'Siap unggah manual'; if (save()) { paintAll(); say(cfg.readySuccess); }
    }
    if (act === 'record') {
      collect(); let url; try { url = new URL(d.publishedUrl); } catch { return say(cfg.recordMessage); }
      if (!cfg.recordGate(d, url)) return say(cfg.recordMessage);
      d.stage = 'Tayang · konfirmasi pemilik'; d.confirmedAt = new Date().toISOString();
      if (save()) { paintAll(); say('Tayang dicatat berdasarkan konfirmasi kamu; belum diverifikasi API.'); }
    }
  });
  root.addEventListener('change', e => {
    if (e.target.dataset.act === 'pick') { collect(); data.selected = e.target.value; save(); paintForm(); }
  });
  $('form').addEventListener('input', e => {
    const d = selected(); if (!d || e.target.type === 'file') return;
    collect();
    if (!LIVE_ONLY.has(e.target.dataset.k) && !/^Tayang/.test(d.stage || '')) d.stage = 'Draft';
    save(); paintScore(d); paintPerf(d);
    if (e.target.dataset.k === 'product' || e.target.dataset.k === 'date') { const o = $('picker').querySelector('option:checked'); if (o) o.textContent = draftLabel(d); }
  });
  $('form').addEventListener('submit', e => { e.preventDefault(); collect(); if (save()) { paintAll(); say('Draft tersimpan di browser ini.'); } });
  $('video-file').addEventListener('change', async e => {
    const file = e.target.files[0], d = selected(); if (!file || !d) return;
    if (!/\.mp4$/i.test(file.name) || file.size > 150000000) return say('Pilih MP4 maksimal 150 MB.');
    try { await mediaDB('put', d.id, file); d.mediaName = file.name; d.visualChecked = false; if (!/^Tayang/.test(d.stage || '')) d.stage = 'Draft'; save(); if (selected()?.id === d.id) { paintAll(); say('Video tersimpan. Review visual produk terlebih dahulu.'); } }
    catch { say('Video gagal disimpan. Periksa kapasitas browser.'); }
  });

  /* ---------- Hubungan ke aplikasi utama ---------- */
  PLATFORM_COPY[P].label = 'WORKSPACE';
  const prev = renderFuture;
  renderFuture = function () {
    prev();
    const on = state.active === P; root.hidden = !on;
    if (on) { document.getElementById('futureWorkspace').classList.add('hidden'); paintAll(); }
  };
  renderChannels(); renderFuture();
  if (new URLSearchParams(location.search).get('channel') === P) document.querySelector(`[data-channel="${P}"]`)?.click();
  return { go, data: () => data };
}

window.BimaAffiliate = { mount, economics };
})();
