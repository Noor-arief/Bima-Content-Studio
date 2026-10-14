/* TikTok Shop affiliate workspace. Konfigurasi khusus TikTok; mesin tampilan ada di affiliate-workspace.js.
   Data tersimpan terpisah (bima-tiktok-affiliate-v1). Tidak ada simulasi publikasi atau koneksi TikTok Shop. */
(() => {
'use strict';
const T = (k, l, o = {}) => Object.assign({ k, l, t: 'text' }, o);
window.BimaAffiliate.mount({
  id: 'tiktok', name: 'TikTok Shop', storeKey: 'bima-tiktok-affiliate-v1', backupName: 'bima-tiktok-affiliate-backup.json',
  theme: { accent: '#6be6d7', accent2: '#fe2c55', soft: 'rgba(107,230,215,.12)' },
  eyebrow: 'BIMA · TIKTOK AFFILIATE', title: 'TikTok, made to shop.', tagline: 'Produk nyata · video AI · keranjang kuning. Alur produksi khusus TikTok.',
  badge: 'Workspace aktif · TikTok belum terhubung',
  notice: { title: 'Keranjang kuning', text: 'Produk harus dipilih dari TikTok Shop/Showcase saat publikasi. Menempel link di caption tidak memasang keranjang. BIMA belum memiliki koneksi TikTok Shop pada akun ini.' },
  menu: { ringkasan: 'Ringkasan', kalender: 'Jadwal TikTok', desk: 'Produk & Video AI', publishing: 'Keranjang & Performa' },
  emptyText: 'Tambahkan produk affiliate untuk membuat brief video AI dan menyiapkan publikasi.',
  publishWord: 'keranjang', publishedLabel: 'URL video TikTok setelah tayang', publishedPh: 'https://www.tiktok.com/@akun/video/…',
  uploadHint: 'Saat unggah di TikTok: pilih Tambahkan tautan → Produk → pilih produk yang sama, cek keranjang, lalu publikasikan. Upload otomatis belum terhubung.',
  fields: {
    product: [
      T('product', 'Nama produk', { attrs: 'maxlength="150"', ph: 'Nama sesuai listing produk' }), T('shop', 'Toko / brand', { attrs: 'maxlength="120"', ph: 'Nama toko atau brand' }),
      T('productUrl', 'Link produk TikTok Shop', { t: 'url', ph: 'https://…' }), T('productId', 'Product ID / ID Showcase', { attrs: 'maxlength="100"', ph: 'ID produk yang akan ditautkan' }),
      T('date', 'Tanggal produksi', { t: 'date' }), T('time', 'Jam · WIB', { t: 'time' }),
      T('account', 'Akun TikTok', { attrs: 'maxlength="80"', ph: '@username' }), T('reference', 'Referensi visual produk', { t: 'url', ph: 'Link foto / aset dari seller' })
    ],
    economics: [
      T('price', 'Harga (Rp)', { t: 'number', attrs: 'min="0" step="any"' }), T('commission', 'Komisi (%)', { t: 'number', attrs: 'min="0" max="100" step="0.01"' }),
      T('sales', 'Terjual (order volume)', { t: 'number', attrs: 'min="0" step="1"', hint: 'Dari Product Marketplace / listing' }), T('rating', 'Rating produk (0–5)', { t: 'number', attrs: 'min="0" max="5" step="0.1"' }),
      T('returnRate', 'Estimasi refund / retur (%)', { t: 'number', attrs: 'min="0" max="100" step="0.1"', hint: 'Komisi = (Revenue − Refund) × rate' }),
      { k: 'demoChecked', l: 'Fungsi produk bisa didemokan jelas di kamera', t: 'check', full: true },
      { k: 'facts', l: 'Fakta & manfaat terverifikasi', t: 'textarea', full: true, rows: 4, ph: 'Bahan, ukuran, fungsi, dan manfaat yang tertulis di listing. Hindari klaim yang belum terbukti.' }
    ],
    perf: [
      T('views', 'Views', { t: 'number', attrs: 'min="0" step="1"' }), T('clicks', 'Klik produk / keranjang', { t: 'number', attrs: 'min="0" step="1"' }),
      T('orders', 'Order', { t: 'number', attrs: 'min="0" step="1"' }), T('earned', 'Komisi diterima (Rp)', { t: 'number', attrs: 'min="0" step="any"' })
    ]
  },
  checks: [
    { k: 'visualChecked', l: 'Visual video cocok dengan produk/varian pada listing.' },
    { k: 'disclosureChecked', l: 'Siap mengaktifkan disclosure promosi dan label AI di TikTok.' },
    { k: 'showcaseChecked', l: 'Produk tersedia di Showcase akun affiliate saya.' }
  ],
  record: { k: 'basketChecked', l: 'Saya sudah membuka video tayang dan mengecek keranjang menuju produk yang benar.' },
  guide: [
    'Pilih produk yang sudah punya momentum penjualan, komisi bermakna, dan fungsi yang jelas saat didemokan.',
    'Distribusi TikTok Shop dipengaruhi klik produk, tambah ke keranjang, dan pembelian, bukan hanya watch time.',
    'Komisi dihitung dari revenue setelah refund. Produk dengan retur tinggi menggerus komisi bersih.',
    'Durasi 21–34 detik dilaporkan optimal untuk konten affiliate; brief BIMA memakai 24 detik.',
    'Uji banyak produk dengan video ringan, lalu gandakan hanya yang klik→order-nya tinggi.'
  ],
  readyGate: d => !!(d.productId && d.visualChecked && d.disclosureChecked && d.showcaseChecked),
  readyMessage: 'Isi Product ID dan selesaikan tiga pemeriksaan sebelum siap unggah.',
  readySuccess: 'Siap. Pasang produk dari Showcase saat unggah di TikTok. Belum dipublikasikan oleh BIMA.',
  recordGate: (d, url) => url.protocol === 'https:' && /(^|\.)tiktok\.com$/.test(url.hostname) && url.pathname.includes('/video/') && !!d.basketChecked && !!d.productId,
  recordMessage: 'URL video TikTok, Product ID, dan konfirmasi keranjang wajib diisi.',
  build: d => ({
    prompt: `VIDEO AFFILIATE AI · 24 DETIK · PORTRAIT 9:16\nPRODUK: ${d.product}\nTOKO: ${d.shop || 'Sesuai listing'}\nLISTING: ${d.productUrl}\nREFERENSI: ${d.reference || 'Lampirkan foto produk asli dari seller sebelum generate.'}\nFAKTA YANG BOLEH DISEBUT: ${d.facts}\n\nKONSISTENSI: Gunakan produk pada foto referensi. Pertahankan bentuk, warna, ukuran relatif, label, kemasan, dan varian. Jangan mengganti produk dengan desain rekaan. Jangan membuat testimoni pengalaman pribadi, klaim hasil, harga, atau diskon yang tidak diberikan.\n\nSCENE 1 · 0–8s: Hero shot produk asli. Perkenalkan satu kebutuhan yang relevan dengan fakta produk. Gerakan kamera halus, latar rapi, fokus pada detail asli.\nSCENE 2 · 8–16s: Perlihatkan satu fungsi dari fakta terverifikasi. AI boleh menata latar; jangan memalsukan demonstrasi performa atau before/after.\nSCENE 3 · 16–24s: Close-up detail produk dan akhir yang bersih. Sisakan 2 detik untuk penutup. CTA: Lihat detail dan pilihan varian di keranjang kuning.\n\nNARASI: Bahasa Indonesia, natural dan jelas; selesai sebelum detik 22. Susun hanya dari fakta di atas. Musik pelan. Jangan gambar tombol/keranjang kuning palsu di dalam video; tautan produk dipasang melalui TikTok Shop saat publikasi.\nPUBLIKASI: Review visual, aktifkan disclosure promosi dan label AI, tautkan produk yang sama dari Showcase.`,
    caption: `Kenali ${d.product}. ${d.facts}\n\nCek detail dan varian di keranjang kuning. Konten affiliate; saya dapat menerima komisi dari pembelian. Visual dibuat dengan bantuan AI. #Affiliate #TikTokShop`
  })
});
})();
