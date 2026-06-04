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
}

const BOT_CONFIG_KEY = 'sr12_bot_config';

export const DEFAULT_BOT_CONFIG: BotConfig = {
  enabled: true,
  botName: 'Bella',
  delayMs: 1200,
  fallbackReply:
    'Maaf, saya belum bisa menjawab pertanyaan itu. 😅\n\nSilakan hubungi CS kami untuk bantuan lebih lanjut:\n• **WhatsApp**: +62 811-xxx-xxxx\n• **Jam Layanan**: Senin–Sabtu 08.00–17.00 WIB\n\nAtau coba tanyakan dengan kata kunci lain!',
  fallbackQuickReplies: ['Cara Order 🛍️', 'Info Produk 💄', 'Hubungi CS 📞', 'Info Pengiriman 🚚'],
  categories: [
    {
      id: 'greeting',
      label: 'Sapaan / Greeting',
      keywords: ['halo', 'hai', 'hi', 'hello', 'hey', 'selamat', 'apa kabar', 'assalamu', 'pagi', 'siang', 'sore', 'malam', 'hei'],
      reply: 'Halo! 👋 Saya **{botName}**, asisten virtual SR12 Beauty Hub.\n\nAda yang bisa saya bantu hari ini?',
      quickReplies: ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'],
    },
    {
      id: 'produk',
      label: 'Info Produk',
      keywords: ['produk', 'sr12', 'skincare', 'cream', 'krim', 'serum', 'moisturizer', 'toner', 'sabun', 'rangkaian', 'perawatan', 'kulit', 'facial', 'lotion', 'sunscreen'],
      reply: 'SR12 Beauty Hub menyediakan rangkaian skincare berkualitas tinggi! 🌿\n\nKoleksi kami meliputi:\n• Facial Wash\n• Toner\n• Serum\n• Moisturizer\n• Sunscreen\n\nLihat semua produk di halaman **Produk**. Ada yang ingin ditanyakan?',
      quickReplies: ['Cara Order 🛍️', 'Info Harga 💰', 'Cara Pakai', 'Hubungi CS 📞'],
    },
    {
      id: 'order',
      label: 'Cara Order / Pembelian',
      keywords: ['pesan', 'order', 'beli', 'cara order', 'pembelian', 'checkout', 'keranjang', 'cart', 'bagaimana beli'],
      reply: 'Cara berbelanja di SR12 Beauty Hub sangat mudah! 🛍️\n\n1️⃣ Pilih produk yang diinginkan\n2️⃣ Klik **Tambah ke Keranjang**\n3️⃣ Buka halaman **Cart**\n4️⃣ Klik **Checkout**\n5️⃣ Isi alamat pengiriman\n6️⃣ Pilih metode pembayaran\n7️⃣ Selesaikan pembayaran ✅\n\nPesananmu langsung diproses! 🎉',
      quickReplies: ['Metode Pembayaran 💳', 'Info Pengiriman 🚚', 'Pakai Voucher 🎁'],
    },
    {
      id: 'pengiriman',
      label: 'Info Pengiriman',
      keywords: ['ongkir', 'pengiriman', 'kirim', 'ekspedisi', 'tracking', 'resi', 'estimasi', 'lama', 'tiba', 'sampai', 'jne', 'jnt', 'sicepat', 'pos'],
      reply: 'Info pengiriman SR12 Beauty Hub 🚚\n\n• **Ekspedisi**: JNE, J&T, SiCepat, Pos Indonesia\n• **Estimasi**: 2–5 hari kerja\n• **Tracking**: Cek resi di halaman **Pesanan Saya**\n• **Gratis ongkir** untuk pembelian di atas nominal tertentu\n\nAda pertanyaan lain?',
      quickReplies: ['Status Pesanan 📦', 'Ganti Alamat', 'Hubungi CS 📞'],
    },
    {
      id: 'voucher',
      label: 'Voucher & Promo',
      keywords: ['voucher', 'diskon', 'promo', 'kode', 'kupon', 'potongan', 'cashback', 'hemat', 'gratis'],
      reply: 'Info voucher & promo SR12 Beauty Hub 🎁\n\n• Lihat voucher di halaman **Voucher Saya**\n• Masukkan kode voucher saat **Checkout**\n• Promo terbaru selalu update di halaman utama\n\n💡 Daftarkan akun untuk mendapatkan voucher selamat datang!',
      quickReplies: ['Cara Pakai Voucher', 'Cara Order 🛍️', 'Info Produk 💄'],
    },
    {
      id: 'pembayaran',
      label: 'Metode Pembayaran',
      keywords: ['bayar', 'payment', 'pembayaran', 'transfer', 'midtrans', 'metode', 'kartu', 'kredit', 'debit', 'gopay', 'ovo', 'dana', 'qris', 'cod'],
      reply: 'Metode pembayaran SR12 Beauty Hub 💳\n\n• **Transfer Bank** (BCA, BNI, BRI, Mandiri)\n• **E-Wallet** (GoPay, OVO, Dana, ShopeePay)\n• **QRIS**\n• **Kartu Kredit/Debit**\n\n🔒 Pembayaran aman via Midtrans yang terpercaya.',
      quickReplies: ['Cara Order 🛍️', 'Bayar Gagal?', 'Info Pengiriman 🚚'],
    },
    {
      id: 'bayar_gagal',
      label: 'Pembayaran Gagal',
      keywords: ['gagal', 'tidak bisa bayar', 'error bayar', 'pembayaran gagal'],
      reply: 'Maaf ada kendala pembayaran! 😥 Berikut langkah yang bisa dicoba:\n\n1️⃣ Refresh halaman dan coba ulang\n2️⃣ Pastikan saldo/limit mencukupi\n3️⃣ Coba metode pembayaran lain\n4️⃣ Hubungi CS kami jika masih gagal\n\n📞 WA CS: **+62 811-xxx-xxxx**',
      quickReplies: ['Hubungi CS 📞', 'Metode Pembayaran 💳'],
    },
    {
      id: 'retur',
      label: 'Retur & Komplain',
      keywords: ['retur', 'komplain', 'refund', 'rusak', 'salah', 'kecewa', 'keluhan', 'problem', 'masalah', 'tidak sesuai', 'cacat', 'pecah'],
      reply: 'Kami mohon maaf atas ketidaknyamanannya! 🙏\n\nLangkah pengajuan retur/komplain:\n1️⃣ Foto kondisi produk yang bermasalah\n2️⃣ Pastikan produk masih dalam kondisi asli\n3️⃣ Hubungi CS kami via WhatsApp\n4️⃣ Tim kami akan segera membantu\n\n📞 WA CS: **+62 811-xxx-xxxx**',
      quickReplies: ['Hubungi WhatsApp 📱', 'Status Pesanan 📦'],
    },
    {
      id: 'kontak',
      label: 'Kontak & Jam Operasional',
      keywords: ['kontak', 'contact', 'whatsapp', 'wa', 'hubungi', 'telepon', 'phone', 'email', 'jam', 'buka', 'tutup', 'operasional', 'layanan', 'cs'],
      reply: 'Informasi kontak SR12 Beauty Hub 📞\n\n• **WhatsApp**: +62 811-xxx-xxxx\n• **Email**: cs@sr12beautyhub.com\n• **Instagram**: @sr12beautyhub\n• **Jam Layanan**: Senin–Sabtu, 08.00–17.00 WIB\n\n💬 Respons tercepat via WhatsApp!',
      quickReplies: ['Hubungi WhatsApp 📱', 'Cara Order 🛍️', 'Info Produk 💄'],
    },
    {
      id: 'status',
      label: 'Status Pesanan',
      keywords: ['status', 'cek', 'lacak', 'track', 'pesanan saya', 'order saya', 'mana pesanan', 'belum sampai', 'sudah bayar'],
      reply: 'Cara cek status pesanan 📦\n\n1️⃣ Login ke akun SR12 Beauty Hub\n2️⃣ Buka halaman **Pesanan Saya**\n3️⃣ Pilih pesanan yang ingin dicek\n4️⃣ Gunakan nomor resi untuk tracking di website ekspedisi\n\nAda kendala? Hubungi CS kami! 😊',
      quickReplies: ['Info Pengiriman 🚚', 'Hubungi CS 📞'],
    },
    {
      id: 'ganti_alamat',
      label: 'Ganti Alamat Pengiriman',
      keywords: ['ganti alamat', 'ubah alamat', 'salah alamat', 'edit alamat'],
      reply: 'Untuk mengubah alamat pengiriman 🏠\n\n• Jika pesanan **belum diproses**: hubungi CS kami segera\n• Jika pesanan **sudah dikirim**: sayangnya alamat tidak bisa diubah\n\nSaran: Cek ulang alamat sebelum konfirmasi checkout ya! ✅\n\n📞 WA CS: **+62 811-xxx-xxxx**',
      quickReplies: ['Hubungi CS 📞', 'Status Pesanan 📦'],
    },
    {
      id: 'terima_kasih',
      label: 'Terima Kasih',
      keywords: ['terima kasih', 'makasih', 'thanks', 'thank you', 'tq', 'thx', 'mantap', 'bagus', 'oke banget', 'helpful'],
      reply: 'Sama-sama! 😊✨ Senang bisa membantu kamu.\n\nJika ada pertanyaan lain, saya selalu siap. Selamat berbelanja di SR12 Beauty Hub! 🌸',
      quickReplies: ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'],
    },
    {
      id: 'pamit',
      label: 'Pamit / Selesai',
      keywords: ['bye', 'dadah', 'pamit', 'selesai', 'sudah', 'cukup', 'gitu aja', 'sampai jumpa'],
      reply: 'Terima kasih sudah menghubungi SR12 Beauty Hub! 🌸\n\nSampai jumpa lagi! Jangan lupa kunjungi kami kembali. 👋',
      quickReplies: ['Info Produk 💄', 'Cara Order 🛍️'],
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
      };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_BOT_CONFIG, categories: [...DEFAULT_BOT_CONFIG.categories] };
}

export function saveBotConfig(config: BotConfig): void {
  localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(config));
}

/** Cari balasan bot berdasarkan pesan user dan config aktif */
export function getBotReplyFromConfig(
  userMessage: string,
  config: BotConfig,
): { reply: string; quickReplies: string[] } {
  const msg = (userMessage || '').toLowerCase();
  const botName = config.botName || DEFAULT_BOT_CONFIG.botName;

  const categories = Array.isArray(config.categories) ? config.categories : [];
  for (const cat of categories) {
    const kws = Array.isArray(cat?.keywords) ? cat.keywords : [];
    if (kws.some((kw) => kw && msg.includes(String(kw).toLowerCase()))) {
      const reply = (cat.reply || DEFAULT_BOT_CONFIG.fallbackReply).replace(/\{botName\}/g, botName);
      const quickReplies = Array.isArray(cat.quickReplies) && cat.quickReplies.length
        ? cat.quickReplies
        : DEFAULT_BOT_CONFIG.fallbackQuickReplies;
      return { reply, quickReplies };
    }
  }

  const fallbackReply = (config.fallbackReply || DEFAULT_BOT_CONFIG.fallbackReply).replace(/\{botName\}/g, botName);
  const fallbackQR = Array.isArray(config.fallbackQuickReplies) && config.fallbackQuickReplies.length
    ? config.fallbackQuickReplies
    : DEFAULT_BOT_CONFIG.fallbackQuickReplies;
  return { reply: fallbackReply, quickReplies: fallbackQR };
}
