/* Shopee Affiliate / Shopee Video workspace. Konfigurasi khusus Shopee; mesin tampilan ada di affiliate-workspace.js.
   Data tersimpan terpisah (bima-shopee-affiliate-v1). Tidak ada simulasi publikasi atau koneksi akun Shopee. */
(() => {
'use strict';
const T = (k, l, o = {}) => Object.assign({ k, l, t: 'text' }, o);
window.BimaAffiliate.mount({
  id: 'shopee', name: 'Shopee Video', hasXtra: true, storeKey: 'bima-shopee-affiliate-v1', backupName: 'bima-shopee-affiliate-backup.json',
  theme: { accent: '#ff7a45', accent2: '#ee4d2d', soft: 'rgba(238,77,45,.13)' },
  eyebrow: 'BIMA · SHOPEE AFFILIATE', title: 'Shopee Video, made to convert.', tagline: 'Riset produk · video AI 9:16 · tag produk Shopee. Alur produksi khusus Shopee.',
  badge: 'Workspace aktif · Shopee belum terhubung',
  notice: { title: 'Link & tag produk', text: 'Buat link afiliasi dari produk yang memenuhi syarat program Shopee Affiliate (umumnya Shopee Mall, Supermarket, Star+, dan Star Seller), lalu tambahkan produk di Shopee Video. BIMA belum terhubung ke akun Shopee.' },
  menu: { ringkasan: 'Ringkasan', kalender: 'Jadwal Shopee Video', desk: 'Riset & Produksi', publishing: 'Publikasi & Performa' },
  emptyText: 'Tambahkan kandidat produk Shopee untuk riset, brief video AI, dan persiapan unggah ke Shopee Video.',
  publishWord: 'tag produk', publishedLabel: 'URL Shopee Video setelah tayang', publishedPh: 'https://…',
  uploadHint: 'Saat unggah di Shopee Video: tambahkan produk yang sama dengan link afiliasi, cek caption dan tag produk, lalu posting. Upload otomatis belum terhubung.',
  fields: {
    product: [
      T('product', 'Nama produk', { attrs: 'maxlength="150"', ph: 'Nama sesuai listing Shopee' }), T('shop', 'Toko / brand', { attrs: 'maxlength="120"', ph: 'Nama toko atau brand' }),
      T('productUrl', 'Link produk Shopee', { t: 'url', ph: 'https://shopee.co.id/…' }), T('affLink', 'Link afiliasi Shopee', { t: 'url', ph: 'Hasil Generate Link di Shopee Affiliate' }),
      { k: 'sellerType', l: 'Tipe penjual', t: 'select', opts: ['', 'Shopee Mall', 'Star+', 'Star Seller', 'Supermarket', 'Lainnya / belum dicek'] }, T('account', 'Akun Shopee', { attrs: 'maxlength="80"', ph: 'Username Shopee' }),
      T('date', 'Tanggal produksi', { t: 'date' }), T('time', 'Jam · WIB', { t: 'time' }),
      T('reference', 'Referensi visual produk', { t: 'url', ph: 'Link foto / aset dari seller', full: true })
    ],
    economics: [
      T('price', 'Harga (Rp)', { t: 'number', attrs: 'min="0" step="any"' }), T('commission', 'Komisi dasar (%)', { t: 'number', attrs: 'min="0" max="100" step="0.01"' }),
      T('xtra', 'Komisi XTRA (%)', { t: 'number', attrs: 'min="0" max="100" step="0.01"', hint: 'Isi bila produk bertanda Komisi XTRA' }), T('sales', 'Terjual', { t: 'number', attrs: 'min="0" step="1"' }),
      T('rating', 'Rating produk (0–5)', { t: 'number', attrs: 'min="0" max="5" step="0.1"' }), T('returnRate', 'Estimasi retur (%)', { t: 'number', attrs: 'min="0" max="100" step="0.1"', hint: 'Komisi dihitung dari transaksi yang tervalidasi' }),
      { k: 'demoChecked', l: 'Fungsi produk bisa didemokan jelas di video', t: 'check', full: true },
      { k: 'facts', l: 'Bukti riset & fakta produk', t: 'textarea', full: true, rows: 4, ph: 'Data penjualan, review, dan fakta listing beserta sumbernya. Tidak ada klaim winning otomatis.' }
    ],
    perf: [
      T('views', 'Views', { t: 'number', attrs: 'min="0" step="1"' }), T('clicks', 'Klik produk', { t: 'number', attrs: 'min="0" step="1"' }),
      T('orders', 'Order', { t: 'number', attrs: 'min="0" step="1"' }), T('earned', 'Komisi diterima (Rp)', { t: 'number', attrs: 'min="0" step="any"' })
    ]
  },
  checks: [
    { k: 'visualChecked', l: 'Visual video cocok dengan produk/varian pada listing Shopee.' },
    { k: 'tagChecked', l: 'Produk yang sama sudah punya link afiliasi dan siap ditambahkan di Shopee Video.' },
    { k: 'policyChecked', l: 'Saya sudah cek ketentuan terbaru Shopee untuk konten promosi dan konten AI.' }
  ],
  record: { k: 'tagConfirmed', l: 'Saya sudah membuka video tayang dan mengecek tag produk menuju produk yang benar.' },
  guide: [
    'Fokus ke Shopee Video; konten video pendek adalah prioritas Shopee saat ini.',
    'Komisi dasar biasanya satu digit persen dan bisa naik lewat produk bertanda Komisi XTRA. Cek rate tiap produk.',
    'Harga tinggi memberi komisi per order lebih besar; harga rendah butuh volume. Skor di samping menghitung keduanya.',
    'Hanya produk dari penjual yang memenuhi syarat program yang menghasilkan komisi. Cek tipe penjual sebelum produksi.',
    'Produk yang unik dan terjangkau lebih mudah ditonton sampai habis; uji beberapa video per produk sebelum menyerah.'
  ],
  readyGate: d => !!(d.affLink && d.visualChecked && d.tagChecked && d.policyChecked),
  readyMessage: 'Isi link afiliasi Shopee dan selesaikan tiga pemeriksaan sebelum siap unggah.',
  readySuccess: 'Siap. Tambahkan produk dengan link afiliasi saat unggah di Shopee Video. Belum dipublikasikan oleh BIMA.',
  recordGate: (d, url) => url.protocol === 'https:' && /(shopee|shp\.ee)/.test(url.hostname) && !!d.tagConfirmed && !!d.affLink,
  recordMessage: 'URL Shopee Video, link afiliasi, dan konfirmasi tag produk wajib diisi.',
  build: d => ({
    prompt: `VIDEO AFFILIATE AI · 24 DETIK · PORTRAIT 9:16 · SHOPEE VIDEO\nPRODUK: ${d.product}\nTOKO: ${d.shop || 'Sesuai listing'}\nLISTING: ${d.productUrl}\nREFERENSI: ${d.reference || 'Lampirkan foto produk asli dari listing Shopee sebelum generate.'}\nFAKTA YANG BOLEH DISEBUT: ${d.facts}\n\nKONSISTENSI: Gunakan produk pada foto referensi. Pertahankan bentuk, warna, ukuran relatif, label, kemasan, dan varian. Jangan mengganti produk dengan desain rekaan. Jangan membuat testimoni pengalaman pribadi, klaim hasil, harga, atau diskon yang tidak diberikan.\n\nSCENE 1 · 0–8s: Hook visual dalam 2 detik pertama: tunjukkan masalah atau kebutuhan yang relevan dengan fakta produk, lalu hero shot produk asli.\nSCENE 2 · 8–16s: Perlihatkan satu fungsi dari fakta terverifikasi. AI boleh menata latar; jangan memalsukan demonstrasi performa atau before/after.\nSCENE 3 · 16–24s: Close-up detail produk dan akhir yang bersih. Sisakan 2 detik untuk penutup. CTA: Cek produknya di tag produk video ini.\n\nNARASI: Bahasa Indonesia, santai dan jelas; selesai sebelum detik 22. Susun hanya dari fakta di atas. Musik pelan. Jangan gambar tombol/tag produk palsu di dalam video; produk ditambahkan lewat Shopee Video saat publikasi.\nPUBLIKASI: Review visual, tambahkan produk yang sama dengan link afiliasi, cek caption dan tag produk sebelum posting.`,
    caption: `Kenali ${d.product}. ${d.facts}\n\nCek detail dan varian lewat tag produk di video ini. Konten affiliate; saya dapat menerima komisi dari pembelian. Visual dibuat dengan bantuan AI. #ShopeeVideo #Affiliate`
  })
});
})();
