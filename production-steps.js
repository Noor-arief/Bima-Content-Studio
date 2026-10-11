/* BIMA Shorts Production workflow — navigation and status only.
   Never sends or approves media automatically. */
(() => {
  'use strict';
  const stepper = document.getElementById('productionStepper');
  const hint = document.getElementById('stepperHint');
  const buttons = stepper ? [...stepper.querySelectorAll('button[data-production-step]')] : [];
  if (!stepper || !hint || buttons.length !== 3 || typeof getSelected !== 'function') return;

  let serverItems = [];
  let lastSelectedId = null;
  function currentServerItem(id) {
    return serverItems.find(item => item.id === id) || null;
  }
  function updateSteps() {
    const item = getSelected();
    const id = item?.id || '';
    if (lastSelectedId !== id) lastSelectedId = id;
    const media = !!item?.mediaName;
    const approved = !!item?.approved;
    const server = currentServerItem(id);
    const uploaded = !!server && ['private_uploaded', 'scheduled', 'published'].includes(server.status);
    const stage = !media ? 1 : !approved ? 2 : 3;
    const messages = {
      1:'Tahap 1: pilih dan simpan MP4 final di browser, lalu review videonya.',
      2:'Tahap 2: periksa judul, deskripsi, video dan suara. Klik Mark Approved setelah siap.',
      3:'Tahap 3: draft sudah Approved secara lokal. Buka Publishing untuk menyimpan MP4 ke Railway, lalu approve jadwal di server. YouTube belum di-upload.'
    };
    let message = messages[stage];
    if (server?.status === 'draft_with_video') message = 'Video sudah tersimpan di Railway. Lanjutkan Approve server-side schedule pada menu Publishing.';
    if (server?.status === 'approved') message = 'Server-side approval selesai. Private upload tetap harus diaktifkan dan dijalankan secara terpisah oleh pemilik.';
    if (server?.status === 'private_uploaded') message = 'Video sudah ter-upload sebagai Private. Periksa hasilnya di YouTube Studio.';
    if (server?.status === 'scheduled') message = 'Jadwal tersimpan di server. Verifikasi status sesungguhnya di YouTube Studio.';
    if (server?.status === 'published') message = 'Video terkonfirmasi Published oleh backend YouTube.';
    if (server?.status === 'needs_review') message = 'Perlu pemeriksaan manual di YouTube Studio sebelum mencoba upload apa pun lagi.';
    hint.textContent = message;
    buttons.forEach(button => {
      const n = Number(button.dataset.productionStep);
      const done = n === 1 ? media : n === 2 ? approved : uploaded;
      const active = n === stage && !done;
      button.classList.toggle('done', done);
      button.classList.toggle('active', active);
      button.removeAttribute('aria-current');
      if (active) button.setAttribute('aria-current','step');
      const label = n === 1 ? 'Upload MP4' : n === 2 ? 'Review & approve' : 'Publishing';
      button.textContent = (done ? '✓' : String(n).padStart(2,'0')) + ' · ' + label;
      button.title = n === 1 ? 'Lihat file MP4 yang dipilih' :
        n === 2 ? 'Ke formulir review dan approval' : 'Buka menu Publishing tanpa mengunggah video';
    });
  }
  function scrollToId(id) {
    const node = document.getElementById(id);
    if (node) node.scrollIntoView({behavior:'smooth',block:'start'});
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    const step = Number(button.dataset.productionStep);
    if (step === 1) {
      scrollToId('dropzone');
    } else if (step === 2) {
      scrollToId('fTitle');
    } else if (step === 3) {
      const item = getSelected();
      const banner = document.getElementById('apiServerMessage');
      if (banner) banner.textContent = item?.approved ?
        'Approved lokal ✓. Berikutnya Save selected video to server → Approve server-side schedule. Jangan upload ke YouTube sebelum Private Upload diaktifkan untuk pengujian.' :
        'Langkah sebelumnya belum selesai: pilih MP4 dan klik Mark Approved di Production Desk. Jangan upload sebelum disetujui.';
      document.querySelector('.menu-item[data-go="publishing"]')?.click();
    }
    updateSteps();
  }));

  document.addEventListener('bima:render-status', updateSteps);
  document.addEventListener('bima:server-state', event => {
    const data = event.detail || {};
    serverItems = Array.isArray(data.items) ? data.items.filter(item =>
      item && typeof item.id === 'string' && typeof item.status === 'string'
    ) : [];
    updateSteps();
  });
  updateSteps();
})();