/* Reuse Production data for TikTok Ads. This is a brief export, not an API connection. */
(function (scope) {
'use strict';
function makeBrief(item, baseUrl, edits = {}) {
 const webUrl = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const url = new URL(value, baseUrl); return /^https?:$/.test(url.protocol) ? url.href : null; }
  catch { return null; }
 };
 const references = (item.sceneImages || []).map((url, index) => ({scene: index + 1, url: webUrl(url)})).filter(x => x.url);
 return {
  format: 'bima-tiktok-ads-brief-v1', contentId: item.id, title: item.title,
  schedule: {date: item.date, time: item.time || null, timezone: 'Asia/Jakarta'},
  product: item.product || null,
  creative: {prompt: edits.prompt ?? item.prompt ?? '', caption: edits.caption ?? item.caption ?? '', scenes: item.scenes || [], references},
  campaign: {budget: null, targetCountry: null, landingPage: null, advertiserId: null},
  requirements: ['Review storyboard in TikTok Ads before generating video', 'Attach original product/model reference images; preserve identity and branding', 'Confirm product facts and landing page before campaign planning', 'Approve budget and campaign plan separately; publishing requires explicit approval'],
  integration: {mode: 'brief_export', apiConnected: false, videoGenerated: false, campaignCreated: false, published: false, yellowCartAttached: false},
  instruction: 'Use this existing BIMA content as the brief for TikTok Ads. Preserve all creative constraints. Do not invent product claims, price or budget. Review storyboard first; do not publish without explicit owner approval.'
 };
}
if (typeof module !== 'undefined' && module.exports) module.exports = {makeBrief};
if (!scope.document) return;
const root = document.getElementById('productionCards');
if (!root) return;
const key = 'bima-tiktok-market-intel-v1';
function mount() {
 for (const save of root.querySelectorAll('[data-save-id]')) {
  const article = save.closest('article');
  if (!article || article.querySelector('[data-ads-brief]')) continue;
  const area = document.createElement('details');
  area.style.cssText = 'margin:18px 0;padding:12px;border:1px solid #344b63;border-radius:10px';
  const summary = document.createElement('summary'); summary.textContent = 'TikTok Ads · Paket brief';
  const description = document.createElement('p');
  description.textContent = 'Gunakan konten ini untuk menyiapkan storyboard dan video iklan di TikTok Ads melalui ChatGPT. Ekspor brief belum menghubungkan API, membuat video, atau memasang keranjang kuning.';
  const button = document.createElement('button'); button.type = 'button'; button.dataset.adsBrief = save.dataset.saveId; button.textContent = 'Download brief & referensi';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  area.append(summary, description, button, status); article.append(area);
 }
}
root.addEventListener('click', async event => {
 const button = event.target.closest('[data-ads-brief]'); if (!button) return;
 const status = button.nextElementSibling; button.disabled = true;
 try {
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const item = data.content?.find(x => x.id === button.dataset.adsBrief);
  if (!item) throw Error('Konten tidak ditemukan.');
  const article = button.closest('article'); const edits = {};
  for (const input of article.querySelectorAll('[data-edit-field]')) edits[input.dataset.editField] = input.value;
  const brief = makeBrief(item, document.baseURI, edits);
  // Local uploads take precedence over public seed images, as in Production previews.
  const db = await new Promise((resolve, reject) => {
   const request = indexedDB.open('bima-tiktok-production-media-v1', 1);
   request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('files')) request.result.createObjectStore('files'); };
   request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
   for (let i = 1; i <= Math.max(3, item.scenes?.length || 3); i++) {
    const file = await new Promise((resolve, reject) => {
     const request = db.transaction('files').objectStore('files').get(item.id + ':scene' + i);
     request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    if (!file) continue;
    if (!file.type?.startsWith('image/')) throw Error('File referensi tidak valid untuk scene ' + i);
    if (file.size > 8 * 1024 * 1024) throw Error('Foto scene ' + i + ' lebih dari 8 MB; gunakan file asli secara terpisah.');
    const dataUri = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
    brief.creative.references = brief.creative.references.filter(x => x.scene !== i);
    brief.creative.references.push({scene: i, name: file.name || 'scene-' + i, dataUri});
   }
  } finally { db.close(); }
  brief.creative.references.sort((a, b) => a.scene - b.scene);
  brief.missing = [];
  if (!brief.creative.references.length) brief.missing.push('Original product/model reference images');
  brief.missing.push('Campaign landing page', 'Budget', 'Target country', 'Advertiser and TikTok identity');
  const blob = new Blob([JSON.stringify(brief, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'tiktok-ads-' + String(item.id).replace(/[^a-zA-Z0-9_-]/g, '_') + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Brief diunduh dengan ' + brief.creative.references.length + ' referensi. Lampirkan di percakapan TikTok Ads untuk review storyboard. Belum ada video atau kampanye yang dibuat.';
 } catch (error) { status.textContent = 'Brief gagal: ' + error.message; }
 finally { button.disabled = false; }
});
new MutationObserver(mount).observe(root, {childList: true});
mount();
})(typeof window === 'undefined' ? globalThis : window);
