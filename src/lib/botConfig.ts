// ─── Bot Config: shared between ChatWidget & AdminBotSettings ───────────────

export interface BotCategory {
  id: string;
  label: string;
  keywords: string[];
  reply: string;
  quickReplies: string[];
}

export interface BotConfig {
  enabled: boolean;
  botName: string;
  delayMs: number;
  fallbackReply: string;
  fallbackQuickReplies: string[];
  categories: BotCategory[];
  useGemini?: boolean;
  geminiApiKey?: string;
}

const BOT_CONFIG_KEY = 'sr12_bot_config';

export const DEFAULT_BOT_CONFIG: BotConfig = {
  enabled: true,
  botName: 'Bella',
  delayMs: 1000,
  fallbackReply:
    'Maaf, saya belum bisa menjawab pertanyaan itu. 😅\n\nCoba ketik dengan kata kunci seperti:\n• **"cara order"** – panduan belanja\n• **"info produk"** – rangkaian skincare kami\n• **"status pesanan"** – cek pesananmu\n• **"promo"** – voucher & diskon\n• **"hubungi CS"** – kontak langsung\n\nAtau hubungi admin kami langsung! 💬',
  fallbackQuickReplies: ['Cara Order 🛍️', 'Info Produk 💄', 'Hubungi CS 📞', 'Lihat Promo 🎁'],
  useGemini: true,
  geminiApiKey: '',
  categories: [
    // ── 1. SAPAAN ──────────────────────────────────────────────────────────
    {
      id: 'greeting',
      label: 'Sapaan / Greeting',
      keywords: [
        'halo', 'hai', 'hi', 'hello', 'hey', 'hei', 'halooo', 'haloo',
        'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
        'pagi', 'siang', 'sore', 'malam', 'assalamu', 'assalamualaikum',
        'apa kabar', 'gimana kabar', 'hows', 'permisi', 'excuse', 'numpang tanya',
        'ada orang', 'ada yang bisa', 'mau tanya', 'boleh tanya', 'min', 'kak',
        'mbak', 'mas', 'selamat datang', 'ada disini', 'masih buka',
      ],
      reply:
        'Halo! 👋 Saya **{botName}**, asisten virtual SR12 Beauty Hub.\n\nSelamat datang! Saya siap membantu kamu seputar:\n🛍️ Cara berbelanja & order\n💄 Info produk skincare SR12\n📦 Status & tracking pesanan\n💳 Metode pembayaran\n🎁 Promo & voucher menarik\n\nAda yang bisa saya bantu hari ini? 😊',
      quickReplies: ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'],
    },

    // ── 2. INFO PRODUK ─────────────────────────────────────────────────────
    {
      id: 'produk',
      label: 'Info Produk',
      keywords: [
        'produk', 'sr12', 'skincare', 'skin care', 'perawatan kulit', 'perawatan wajah',
        'cream', 'krim', 'serum', 'moisturizer', 'pelembab', 'toner', 'sabun wajah',
        'facial wash', 'pembersih', 'sunscreen', 'tabir surya', 'spf', 'lotion',
        'rangkaian', 'paket', 'bundle', 'kulit', 'wajah', 'jerawat', 'flek', 'komedo',
        'kulit kusam', 'kulit kering', 'kulit berminyak', 'mencerahkan', 'glowing',
        'anti aging', 'pori', 'bpom', 'halal', 'original', 'asli', 'aman', 'cocok',
        'rekomendasi', 'saran produk', 'untuk kulit', 'kulit sensitif', 'ingredients',
        'bahan', 'kandungan', 'manfaat', 'fungsi', 'kegunaan', 'efek',
      ],
      reply:
        'SR12 Beauty Hub menghadirkan rangkaian skincare berkualitas tinggi, aman & BPOM! 🌿✨\n\n**Koleksi Produk SR12:**\n• 🧴 **Facial Wash** – membersihkan optimal tanpa kesat\n• 💧 **Toner** – menyeimbangkan & melembabkan\n• ✨ **Serum** – solusi target jerawat, flek & anti-aging\n• 🌸 **Moisturizer** – melembabkan sepanjang hari\n• ☀️ **Sunscreen SPF** – perlindungan UV setiap hari\n• 🧖 **Paket Lengkap** – harga lebih hemat!\n\n💡 Semua produk **BPOM & Halal** – aman untuk semua jenis kulit.\n\nLihat lengkap di halaman **Produk** ya! 👇',
      quickReplies: ['Cara Order 🛍️', 'Info Harga 💰', 'Cocok untuk Kulit Apa?', 'Lihat Promo 🎁'],
    },

    // ── 3. HARGA ───────────────────────────────────────────────────────────
    {
      id: 'harga',
      label: 'Info Harga',
      keywords: [
        'harga', 'price', 'berapa', 'murah', 'mahal', 'budget', 'biaya', 'tarif',
        'kisaran harga', 'range harga', 'harga produk', 'harga serum', 'harga cream',
        'harga paket', 'harga normal', 'harga asli', 'harga resmi', 'bayar berapa',
        'cost', 'total harga', 'info harga',
      ],
      reply:
        'Info harga produk SR12 Beauty Hub 💰\n\n**Kisaran Harga:**\n• Facial Wash: mulai **Rp 45.000**\n• Toner: mulai **Rp 55.000**\n• Serum: mulai **Rp 75.000**\n• Moisturizer: mulai **Rp 65.000**\n• Sunscreen: mulai **Rp 70.000**\n• Paket Bundle: **lebih hemat hingga 20%**\n\n💡 Harga sudah termasuk PPN. Cek harga lengkap & terkini langsung di halaman **Produk**!\n\nMau cari produk dengan budget tertentu? 😊',
      quickReplies: ['Lihat Semua Produk', 'Cara Order 🛍️', 'Pakai Voucher 🎁', 'Metode Pembayaran 💳'],
    },

    // ── 4. CARA ORDER ──────────────────────────────────────────────────────
    {
      id: 'order',
      label: 'Cara Order / Pembelian',
      keywords: [
        'pesan', 'order', 'beli', 'cara order', 'cara beli', 'cara belanja', 'pembelian',
        'checkout', 'keranjang', 'cart', 'bagaimana beli', 'gimana beli', 'mau beli',
        'ingin beli', 'mau pesan', 'langkah', 'tutorial', 'panduan', 'petunjuk',
        'step', 'proses beli', 'proses order', 'belanja', 'tambah keranjang',
        'add to cart', 'lanjut bayar', 'gimana caranya', 'cara nya', 'bisa beli',
      ],
      reply:
        'Belanja di SR12 Beauty Hub gampang banget! 🛍️\n\n**Cara Order:**\n1️⃣ Pilih produk yang kamu suka\n2️⃣ Klik **"Tambah ke Keranjang"** 🛒\n3️⃣ Buka halaman **Keranjang/Cart**\n4️⃣ Masukkan kode voucher (jika ada)\n5️⃣ Klik **"Checkout"**\n6️⃣ Isi & pilih **alamat pengiriman**\n7️⃣ Pilih **metode pembayaran**\n8️⃣ Selesaikan pembayaran ✅\n\n🎉 Pesananmu langsung diproses setelah pembayaran berhasil!\n\nAda kendala saat order? Hubungi CS kami ya 😊',
      quickReplies: ['Metode Pembayaran 💳', 'Info Pengiriman 🚚', 'Pakai Voucher 🎁', 'Hubungi CS 📞'],
    },

    // ── 5. PENGIRIMAN ──────────────────────────────────────────────────────
    {
      id: 'pengiriman',
      label: 'Info Pengiriman',
      keywords: [
        'ongkir', 'ongkos kirim', 'pengiriman', 'kirim', 'dikirim', 'ekspedisi',
        'tracking', 'resi', 'lacak', 'estimasi', 'lama kirim', 'berapa lama',
        'kapan tiba', 'kapan sampai', 'tiba', 'sampai', 'jne', 'jnt', 'j&t',
        'sicepat', 'pos indonesia', 'anteraja', 'shopee express', 'gratis ongkir',
        'free ongkir', 'cek resi', 'nomor resi', 'pengiriman ke', 'bisa dikirim',
        'daerah', 'luar kota', 'luar pulau', 'luar negeri', 'seluruh indonesia',
      ],
      reply:
        'Info pengiriman SR12 Beauty Hub 🚚\n\n**Ekspedisi Tersedia:**\n• JNE, J&T Express\n• SiCepat, AnterAja\n• Pos Indonesia\n\n**Estimasi Pengiriman:**\n• Pulau Jawa: 1–3 hari kerja\n• Luar Jawa: 3–7 hari kerja\n\n**Ongkos Kirim:**\n• Dihitung otomatis saat checkout berdasarkan berat & lokasi\n• 🎉 **Gratis ongkir** untuk pembelian minimal tertentu\n\n**Cara Tracking:**\n1️⃣ Buka **Pesanan Saya**\n2️⃣ Pilih pesanan → lihat nomor resi\n3️⃣ Tracking di website ekspedisi\n\nAda pertanyaan lain? 😊',
      quickReplies: ['Status Pesanan 📦', 'Ganti Alamat Pengiriman', 'Hubungi CS 📞'],
    },

    // ── 6. VOUCHER & PROMO ─────────────────────────────────────────────────
    {
      id: 'voucher',
      label: 'Voucher & Promo',
      keywords: [
        'voucher', 'diskon', 'promo', 'kode promo', 'kode voucher', 'kupon', 'potongan',
        'cashback', 'hemat', 'gratis', 'promo hari ini', 'promo terbaru', 'flash sale',
        'sale', 'obral', 'murah banget', 'lebih hemat', 'penghematan', 'harbolnas',
        '11.11', '12.12', 'promo ramadan', 'promo lebaran', 'double day', 'cuci gudang',
        'reward', 'poin', 'loyalty', 'member', 'referral', 'undang teman', 'kode referral',
      ],
      reply:
        'Info voucher & promo SR12 Beauty Hub 🎁✨\n\n**Cara Dapatkan Voucher:**\n• 🆕 Daftar akun baru → **voucher selamat datang**\n• 📱 Ikuti Instagram @sr12beautyhub → update promo terbaru\n• 🛍️ Belanja minimal tertentu → diskon otomatis\n• 🎂 Promo ulang tahun untuk member setia!\n\n**Cara Pakai Voucher:**\n1️⃣ Tambah produk ke keranjang\n2️⃣ Klik **Checkout**\n3️⃣ Masukkan kode voucher di kolom yang tersedia\n4️⃣ Klik **"Gunakan"** – diskon langsung terpotong! ✅\n\n💡 Cek semua vouchermu di halaman **Voucher Saya** ya!',
      quickReplies: ['Cara Order 🛍️', 'Lihat Semua Produk', 'Info Promo Flash Sale ⚡'],
    },

    // ── 7. PEMBAYARAN ──────────────────────────────────────────────────────
    {
      id: 'pembayaran',
      label: 'Metode Pembayaran',
      keywords: [
        'bayar', 'payment', 'pembayaran', 'transfer', 'midtrans', 'metode', 'metode bayar',
        'kartu kredit', 'kartu debit', 'gopay', 'go pay', 'ovo', 'dana', 'qris', 'cod',
        'cash on delivery', 'bayar di tempat', 'virtual account', 'va', 'bank', 'bca',
        'bni', 'bri', 'mandiri', 'cimb', 'permata', 'shopeepay', 'linkaja',
        'indomaret', 'alfamart', 'minimarket', 'bisa bayar', 'cara bayar',
      ],
      reply:
        'Metode pembayaran SR12 Beauty Hub 💳\n\n**Transfer Bank (Virtual Account):**\n• BCA, BNI, BRI, Mandiri, CIMB, Permata\n\n**E-Wallet:**\n• 💚 GoPay\n• 💜 OVO\n• 💙 Dana\n• 🟠 ShopeePay\n• LinkAja\n\n**Pembayaran Lain:**\n• 📱 QRIS (scan & bayar)\n• 🏪 Gerai Indomaret / Alfamart\n• 💳 Kartu Kredit & Debit (Visa/Mastercard)\n\n🔒 Semua transaksi **aman & terenkripsi** via **Midtrans**.\n\nButuh bantuan proses pembayaran? 😊',
      quickReplies: ['Cara Order 🛍️', 'Bayar Gagal? 😥', 'Info Pengiriman 🚚'],
    },

    // ── 8. PEMBAYARAN GAGAL ────────────────────────────────────────────────
    {
      id: 'bayar_gagal',
      label: 'Pembayaran Gagal / Error',
      keywords: [
        'gagal bayar', 'pembayaran gagal', 'tidak bisa bayar', 'error bayar', 'bayar error',
        'tidak berhasil', 'pending', 'expired', 'kadaluarsa', 'waktu habis', 'timeout',
        'transaksi gagal', 'double charge', 'kena charge dua kali', 'uang terpotong',
        'sudah bayar belum masuk', 'konfirmasi bayar', 'bukti bayar', 'payment failed',
        'order hilang', 'pesanan tidak muncul', 'bayar tapi pesanan', 'uang sudah keluar',
      ],
      reply:
        'Aduh, ada kendala pembayaran ya! 😥 Jangan khawatir, coba langkah ini:\n\n**Jika Pembayaran Gagal/Error:**\n1️⃣ Refresh halaman & coba bayar ulang\n2️⃣ Pastikan saldo/limit mencukupi\n3️⃣ Coba metode pembayaran lain\n4️⃣ Bersihkan cache browser & coba lagi\n\n**Jika Sudah Bayar tapi Order Tidak Muncul:**\n• Tunggu 5–10 menit, sistem masih memproses\n• Cek email konfirmasi di inbox/spam\n• Kirim **bukti transfer** ke CS kami\n\n**Hubungi CS segera:**\n📞 WA: **+62 811-xxx-xxxx**\n🕐 Siap membantu Senin–Sabtu 08.00–17.00 WIB',
      quickReplies: ['Hubungi CS via WA 📱', 'Metode Pembayaran 💳', 'Status Pesanan 📦'],
    },

    // ── 9. STATUS PESANAN ──────────────────────────────────────────────────
    {
      id: 'status',
      label: 'Status Pesanan',
      keywords: [
        'status', 'status pesanan', 'cek pesanan', 'lacak pesanan', 'track', 'tracking',
        'pesanan saya', 'order saya', 'mana pesanan', 'belum sampai', 'sudah bayar',
        'sudah dikirim', 'kapan dikirim', 'pesanan diproses', 'diproses', 'dalam proses',
        'pesanan diterima', 'konfirmasi order', 'nomor order', 'invoice', 'lihat pesanan',
        'riwayat pesanan', 'history pesanan', 'belum ada update', 'lama sekali',
      ],
      reply:
        'Cara cek status pesananmu 📦\n\n**Langkah Mudah:**\n1️⃣ Login ke akun SR12 Beauty Hub\n2️⃣ Klik **"Pesanan Saya"** di menu profil\n3️⃣ Pilih pesanan yang ingin dicek\n4️⃣ Lihat status & nomor resi pengiriman\n\n**Arti Status Pesanan:**\n• ⏳ **Menunggu Pembayaran** – selesaikan pembayaran\n• ✅ **Diproses** – pesanan sedang dikemas\n• 🚚 **Dikirim** – dalam perjalanan (ada nomor resi)\n• ✔️ **Selesai** – pesanan sudah diterima\n\n💡 Gunakan nomor resi untuk tracking di website ekspedisi!\n\nPesanan bermasalah? Hubungi CS kami! 😊',
      quickReplies: ['Info Pengiriman 🚚', 'Hubungi CS 📞', 'Retur & Komplain 🔄'],
    },

    // ── 10. GANTI ALAMAT ───────────────────────────────────────────────────
    {
      id: 'ganti_alamat',
      label: 'Ganti Alamat Pengiriman',
      keywords: [
        'ganti alamat', 'ubah alamat', 'salah alamat', 'edit alamat', 'update alamat',
        'alamat berubah', 'alamat salah', 'typo alamat', 'pindah', 'kirim ke tempat lain',
        'alamat sementara', 'alamat kantor', 'bisa ganti alamat', 'mau ganti alamat',
      ],
      reply:
        'Mau ganti alamat pengiriman? 🏠\n\n**Jika Pesanan BELUM Diproses:**\n✅ Hubungi CS kami SEGERA\n📞 WA: **+62 811-xxx-xxxx**\n(Sertakan nomor order & alamat baru)\n\n**Jika Pesanan SUDAH Dikirim:**\n❌ Alamat tidak dapat diubah\nSilakan hubungi pihak ekspedisi langsung\n\n**Tips Agar Tidak Salah Alamat:**\n• Cek ulang alamat sebelum klik Checkout ✅\n• Pastikan nama penerima & no. HP benar\n• Tambahkan patokan/catatan untuk kurir\n\nAda pertanyaan lain? 😊',
      quickReplies: ['Hubungi CS 📞', 'Status Pesanan 📦', 'Info Pengiriman 🚚'],
    },

    // ── 11. RETUR & KOMPLAIN ───────────────────────────────────────────────
    {
      id: 'retur',
      label: 'Retur & Komplain',
      keywords: [
        'retur', 'return', 'komplain', 'complain', 'refund', 'pengembalian', 'kembali',
        'rusak', 'salah produk', 'kecewa', 'keluhan', 'problem', 'masalah', 'tidak sesuai',
        'cacat', 'pecah', 'bocor', 'kurang', 'tidak lengkap', 'beda', 'palsu',
        'tidak original', 'penipuan', 'kedaluwarsa', 'expired', 'barang tidak sampai',
        'hilang', 'lost', 'garansi', 'jaminan', 'ganti rugi', 'kompensasi',
        'klaim', 'dispute', 'mediasi', 'minta refund', 'kembalikan uang',
      ],
      reply:
        'Kami mohon maaf atas ketidaknyamanannya! 🙏\n\n**Syarat Retur Produk:**\n• Produk dalam kondisi asli (belum digunakan)\n• Kemasan tidak rusak\n• Pengajuan dalam 3 hari setelah terima\n• Sertakan foto/video produk bermasalah\n\n**Langkah Pengajuan:**\n1️⃣ Foto/video produk yang bermasalah\n2️⃣ Chat CS kami via WhatsApp\n3️⃣ Kirim bukti (foto + nomor order)\n4️⃣ Tim kami akan proses dalam 1×24 jam\n\n📞 WA CS: **+62 811-xxx-xxxx**\n🕐 Senin–Sabtu, 08.00–17.00 WIB\n\nKami siap bantu selesaikan! 💪',
      quickReplies: ['Hubungi CS via WA 📱', 'Status Pesanan 📦', 'Info Pengiriman 🚚'],
    },

    // ── 12. CARA PAKAI PRODUK ──────────────────────────────────────────────
    {
      id: 'cara_pakai',
      label: 'Cara Pakai Produk',
      keywords: [
        'cara pakai', 'cara pemakaian', 'cara menggunakan', 'gimana pakai', 'urutan pakai',
        'rutinitas', 'skincare routine', 'kapan dipakai', 'pagi atau malam', 'berapa kali',
        'seberapa banyak', 'takaran', 'step by step', 'tutorial pakai', 'panduan pakai',
        'efek samping', 'reaksi', 'purging', 'cocok', 'tidak cocok', 'ketahuan cocok',
        'cara simpan', 'penyimpanan', 'expired produk', 'tanda kadaluarsa',
      ],
      reply:
        'Panduan pemakaian produk SR12 Beauty Hub 💄✨\n\n**Urutan Skincare Pagi:**\n1️⃣ Facial Wash\n2️⃣ Toner\n3️⃣ Serum\n4️⃣ Moisturizer\n5️⃣ Sunscreen ☀️\n\n**Urutan Skincare Malam:**\n1️⃣ Facial Wash (double cleanse)\n2️⃣ Toner\n3️⃣ Serum\n4️⃣ Moisturizer 🌙\n\n💡 **Tips Penting:**\n• Gunakan secara konsisten 2× sehari\n• Mulai dengan sedikit untuk uji kecocokan\n• **Purging** (jerawat awal) normal di 1–2 minggu pertama\n• Simpan produk di tempat sejuk & kering\n\nMau rekomendasi produk untuk jenis kulitmu? 😊',
      quickReplies: ['Info Produk 💄', 'Cocok untuk Kulit Sensitif?', 'Cara Order 🛍️'],
    },

    // ── 13. AKUN & REGISTRASI ──────────────────────────────────────────────
    {
      id: 'akun',
      label: 'Akun & Registrasi',
      keywords: [
        'daftar', 'register', 'registrasi', 'buat akun', 'bikin akun', 'login',
        'masuk', 'lupa password', 'lupa sandi', 'reset password', 'ganti password',
        'ubah password', 'email tidak ada', 'akun tidak bisa login', 'akun terkunci',
        'verifikasi email', 'konfirmasi email', 'tidak terima email', 'akun baru',
        'sign up', 'sign in', 'log out', 'keluar akun', 'hapus akun', 'nonaktifkan akun',
        'ganti email', 'ubah profil', 'edit profil', 'nama akun',
      ],
      reply:
        'Info akun SR12 Beauty Hub 👤\n\n**Cara Daftar Akun:**\n1️⃣ Klik **"Daftar"** di pojok kanan atas\n2️⃣ Isi email & password\n3️⃣ Cek email untuk verifikasi ✉️\n4️⃣ Akun siap digunakan! 🎉\n\n**Lupa Password?**\n• Klik **"Lupa Password"** di halaman login\n• Masukkan email terdaftar\n• Cek email untuk link reset password\n\n**Keuntungan Punya Akun:**\n✅ Simpan alamat pengiriman\n✅ Lacak status pesanan\n✅ Kumpulkan poin & reward\n✅ Dapatkan voucher eksklusif member\n\nMasih ada kendala? Hubungi CS kami! 😊',
      quickReplies: ['Cara Order 🛍️', 'Hubungi CS 📞', 'Info Voucher 🎁'],
    },

    // ── 14. KONTAK & JAM OPERASIONAL ──────────────────────────────────────
    {
      id: 'kontak',
      label: 'Kontak & Jam Operasional',
      keywords: [
        'kontak', 'contact', 'whatsapp', 'wa', 'hubungi', 'telepon', 'phone', 'email',
        'jam operasional', 'jam layanan', 'jam buka', 'jam tutup', 'buka hari apa',
        'hari apa saja', 'hari libur', 'sabtu', 'minggu', 'cs', 'customer service',
        'instagram', 'ig', 'sosmed', 'social media', 'tiktok', 'facebook', 'youtube',
        'alamat toko', 'lokasi', 'offline', 'toko fisik', 'offline store',
        'bicarakan', 'mau ngobrol', 'chat langsung', 'respon cepat',
      ],
      reply:
        'Informasi kontak SR12 Beauty Hub 📞\n\n**Hubungi Kami:**\n• 📱 **WhatsApp**: +62 811-xxx-xxxx\n• 📧 **Email**: cs@sr12beautyhub.com\n• 📸 **Instagram**: @sr12beautyhub\n\n**Jam Layanan CS:**\n🕗 Senin – Sabtu: **08.00 – 17.00 WIB**\n🔴 Minggu & Hari Libur: Tutup\n\n💬 **Respons tercepat via WhatsApp!**\nRata-rata dibalas dalam < 30 menit saat jam layanan.\n\n*Di luar jam layanan? Tinggalkan pesan, kami balas besok pagi! 🌅*',
      quickReplies: ['Hubungi WA Sekarang 📱', 'Cara Order 🛍️', 'Info Produk 💄'],
    },

    // ── 15. ULASAN & REVIEW ────────────────────────────────────────────────
    {
      id: 'review',
      label: 'Ulasan & Review Produk',
      keywords: [
        'ulasan', 'review', 'bintang', 'rating', 'testimoni', 'testi', 'komentar',
        'feedback', 'pendapat', 'pengalaman pakai', 'hasil pakai', 'efektif',
        'berhasil', 'ampuh', 'bagus', 'tidak bagus', 'worth it', 'recommended',
        'penilaian', 'beri nilai', 'kasih review', 'cara review', 'tulis ulasan',
      ],
      reply:
        'Terima kasih ingin berbagi pengalaman! ⭐\n\n**Cara Memberikan Ulasan:**\n1️⃣ Login ke akun kamu\n2️⃣ Buka **"Pesanan Saya"**\n3️⃣ Pilih produk yang sudah diterima\n4️⃣ Klik **"Tulis Ulasan"**\n5️⃣ Beri bintang & ceritakan pengalamanmu!\n\n💡 Ulasanmu sangat membantu pembeli lain loh! 🙏\n\n*Produk SR12 yang paling sering mendapat ⭐⭐⭐⭐⭐ adalah Serum & Moisturizer-nya!*\n\nIngin lihat ulasan sebelum beli? Kunjungi halaman produk! 👇',
      quickReplies: ['Lihat Semua Produk', 'Cara Order 🛍️', 'Info Produk 💄'],
    },

    // ── 16. TERIMA KASIH ───────────────────────────────────────────────────
    {
      id: 'terima_kasih',
      label: 'Terima Kasih',
      keywords: [
        'terima kasih', 'makasih', 'makasi', 'thanks', 'thank you', 'tq', 'thx',
        'tks', 'ty', 'helpful', 'membantu', 'sangat membantu', 'mantap', 'bagus',
        'oke banget', 'super', 'keren', 'good', 'great', 'nice', 'awesome',
        'top', 'the best', 'luar biasa', 'bermanfaat', 'jelas', 'paham',
      ],
      reply:
        'Sama-sama! 😊✨ Senang bisa membantu kamu.\n\nJika ada pertanyaan lain, saya **{botName}** selalu siap melayani!\n\n🌸 Selamat berbelanja di SR12 Beauty Hub!\n💄 Tampil cantik & percaya diri dengan skincare terbaik!',
      quickReplies: ['Lihat Semua Produk', 'Cara Order 🛍️', 'Lihat Promo 🎁', 'Status Pesanan 📦'],
    },

    // ── 17. PAMIT / SELESAI ────────────────────────────────────────────────
    {
      id: 'pamit',
      label: 'Pamit / Selesai',
      keywords: [
        'bye', 'dadah', 'da da', 'pamit', 'selesai', 'sudah cukup', 'gitu aja',
        'sampai jumpa', 'see you', 'cu', 'later', 'goodbye', 'good bye', 'cukup',
        'tidak ada', 'ga ada lagi', 'nanti aja', 'kapan-kapan', 'oke deh', 'oke makasih',
        'yasudah', 'ya sudah', 'baik', 'oke terima kasih',
      ],
      reply:
        'Terima kasih sudah menghubungi SR12 Beauty Hub! 🌸\n\nSampai jumpa lagi ya! 👋\nJangan lupa kunjungi kami untuk promo & produk terbaru. ✨\n\n*Saya **{botName}** selalu siap membantu kapan pun kamu butuh!* 💕',
      quickReplies: ['Info Produk 💄', 'Lihat Promo 🎁'],
    },
  ],
};

export function loadBotConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(BOT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BotConfig>;
      // Merge field-per-field supaya nilai undefined tidak menimpa default
      return {
        enabled: parsed.enabled ?? DEFAULT_BOT_CONFIG.enabled,
        botName: parsed.botName || DEFAULT_BOT_CONFIG.botName,
        delayMs: typeof parsed.delayMs === 'number' ? parsed.delayMs : DEFAULT_BOT_CONFIG.delayMs,
        fallbackReply: parsed.fallbackReply || DEFAULT_BOT_CONFIG.fallbackReply,
        fallbackQuickReplies: Array.isArray(parsed.fallbackQuickReplies) && parsed.fallbackQuickReplies.length
          ? parsed.fallbackQuickReplies
          : DEFAULT_BOT_CONFIG.fallbackQuickReplies,
        categories: Array.isArray(parsed.categories) && parsed.categories.length
          ? parsed.categories
          : DEFAULT_BOT_CONFIG.categories,
        useGemini: parsed.useGemini ?? DEFAULT_BOT_CONFIG.useGemini,
        geminiApiKey: parsed.geminiApiKey ?? DEFAULT_BOT_CONFIG.geminiApiKey,
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_BOT_CONFIG, categories: [...DEFAULT_BOT_CONFIG.categories] };
}

export function saveBotConfig(config: BotConfig): void {
  localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Cari balasan bot berdasarkan pesan user dan config aktif.
 * Menggunakan multi-level matching:
 * 1. Exact keyword match (kata persis ada dalam pesan)
 * 2. Partial token match (tiap kata kunci dicek per token)
 * 3. Fallback reply jika tidak ada yang cocok
 */
export function getBotReplyFromConfig(
  userMessage: string,
  config: BotConfig,
): { reply: string; quickReplies: string[] } {
  const raw = (userMessage || '').trim();
  const msg = raw.toLowerCase();
  const botName = config.botName || DEFAULT_BOT_CONFIG.botName;

  const categories = Array.isArray(config.categories) ? config.categories : [];

  // ── Pass 1: full substring match (keyword ada persis di dalam pesan) ──
  for (const cat of categories) {
    const kws = Array.isArray(cat?.keywords) ? cat.keywords : [];
    const matched = kws.some((kw) => {
      if (!kw) return false;
      return msg.includes(String(kw).toLowerCase());
    });
    if (matched) {
      return buildReply(cat, botName, config);
    }
  }

  // ── Pass 2: token-based match (kata per kata cocok dengan keyword) ──
  // Berguna untuk kalimat panjang seperti "mau tanya soal pengiriman nya"
  const tokens = msg.split(/\s+/).filter(Boolean);
  for (const cat of categories) {
    const kws = Array.isArray(cat?.keywords) ? cat.keywords : [];
    const matched = kws.some((kw) => {
      if (!kw) return false;
      const kwNorm = String(kw).toLowerCase();
      // Keyword multi-kata: semua token keyword harus ada di pesan
      const kwTokens = kwNorm.split(/\s+/);
      return kwTokens.every((kwT) => tokens.includes(kwT));
    });
    if (matched) {
      return buildReply(cat, botName, config);
    }
  }

  // ── Pass 3: Fallback ──
  const fallbackReply = (config.fallbackReply || DEFAULT_BOT_CONFIG.fallbackReply)
    .replace(/\{botName\}/g, botName);
  const fallbackQR = Array.isArray(config.fallbackQuickReplies) && config.fallbackQuickReplies.length
    ? config.fallbackQuickReplies
    : DEFAULT_BOT_CONFIG.fallbackQuickReplies;
  return { reply: fallbackReply, quickReplies: fallbackQR };
}

/** Helper: build reply object dari kategori */
function buildReply(
  cat: BotCategory,
  botName: string,
  config: BotConfig,
): { reply: string; quickReplies: string[] } {
  const reply = (cat.reply || config.fallbackReply || DEFAULT_BOT_CONFIG.fallbackReply)
    .replace(/\{botName\}/g, botName);
  const quickReplies =
    Array.isArray(cat.quickReplies) && cat.quickReplies.length
      ? cat.quickReplies
      : DEFAULT_BOT_CONFIG.fallbackQuickReplies;
  return { reply, quickReplies };
}
