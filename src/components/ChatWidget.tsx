import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, Bot, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { type BotConfig, loadBotConfig, getBotReplyFromConfig } from '@/lib/botConfig';
import { fetchProducts } from '@/lib/supabaseHelpers';

// ─── Component ───────────────────────────────────────────────────────────────

const ChatWidget = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [botConfig, setBotConfig] = useState<BotConfig>(loadBotConfig);
  const [quickReplies, setQuickReplies] = useState<string[]>(
    ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Reload bot config setiap kali chat dibuka (agar perubahan admin langsung terasa)
  useEffect(() => {
    if (open) setBotConfig(loadBotConfig());
  }, [open]);

  const [catalog, setCatalog] = useState<any[]>([]);

  // Load product catalog when widget opens to ground AI responses
  useEffect(() => {
    if (open && catalog.length === 0) {
      fetchProducts().then(res => setCatalog(res || [])).catch(() => {});
    }
  }, [open, catalog]);

  const isOnAdminPage = location.pathname.startsWith('/admin');
  const shouldHideCompletely = authLoading || isAdmin || isOnAdminPage;
  const isLoggedIn = !!user;

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);

  // ── Muat thread & pesan ─────────────────────────────────────────────
  const ensureThread = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let isNewThread = false;
    let { data: t } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!t) {
      const { data: created } = await supabase
        .from('chat_threads')
        .insert({ user_id: user.id })
        .select()
        .single();
      t = created;
      isNewThread = true;
    }

    setThread(t);
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('thread_id', t!.id)
      .order('created_at');
    setMessages(msgs || []);

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('thread_id', t!.id)
      .in('sender_role', ['admin', 'auto'])
      .eq('is_read', false);
    await supabase.from('chat_threads').update({ unread_user: 0 }).eq('id', t!.id);

    setUnread(0);
    setLoading(false);
    scrollToBottom();

    // Kirim pesan sambutan otomatis jika thread baru (belum ada pesan)
    if (isNewThread && t) {
      const cfg = loadBotConfig();
      if (cfg.enabled) {
        setTimeout(() => triggerWelcomeMessage(t!.id, cfg), 800);
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pesan sambutan pertama kali ─────────────────────────────────────
  const triggerWelcomeMessage = async (threadId: string, cfg: any) => {
    if (!user) return;
    const botName = cfg.botName || 'Bella';
    const welcomeMsg = `Halo! 👋 Selamat datang di **SR12 Beauty Hub**!\n\nSaya **${botName}**, asisten virtual yang siap membantu kamu 24/7.\n\nAda yang bisa saya bantu hari ini? Pilih topik di bawah atau ketik pertanyaanmu! 😊`;
    setIsTyping(true);
    scrollToBottom();
    await new Promise((r) => setTimeout(r, 1200));
    const { data: botMsg, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        sender_role: 'auto',
        message: welcomeMsg,
        is_read: true,
      })
      .select()
      .single();
    if (!error && botMsg) {
      setMessages((prev) => {
        if (prev.find((p) => p.id === botMsg.id)) return prev;
        return [...prev, botMsg];
      });
      await supabase.from('chat_threads').update({
        last_message: welcomeMsg,
        last_message_at: new Date().toISOString(),
        unread_user: 0,
      }).eq('id', threadId);
    }
    setIsTyping(false);
    scrollToBottom();
  };

  // ── Realtime subscribe ──────────────────────────────────────────────
  useEffect(() => {
    if (shouldHideCompletely || !user) return;
    (async () => {
      const { data: t } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (t) {
        setUnread(t.unread_user || 0);
        channelRef.current = supabase
          .channel(`thread-${t.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${t.id}` },
            (payload) => {
              const m = payload.new as any;
              // Tampilkan pesan dari admin DAN bot (auto) secara realtime
              if (m.sender_role === 'admin' || m.sender_role === 'auto') {
                if (open) {
                  setMessages((prev) => {
                    // Hindari duplikat (sudah ada di state lokal)
                    if (prev.find((p) => p.id === m.id)) return prev;
                    return [...prev, m];
                  });
                  // Mark as read for admin messages received via realtime
                  if (m.sender_role === 'admin') {
                    supabase.from('chat_messages').update({ is_read: true }).eq('id', m.id).then(() => {});
                  }
                  scrollToBottom();
                } else {
                  setUnread((u) => u + 1);
                }
              }
            },
          )
          .subscribe();
      }
    })();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [shouldHideCompletely, user?.id, open]);

  useEffect(() => {
    if (open && !thread && user) ensureThread();
  }, [open, thread, user, ensureThread]);

  // ── Bot reply ───────────────────────────────────────────────────────
  const triggerBotReply = async (threadId: string, userText: string) => {
    try {
      if (!user) return;

      // Selalu baca config fresh dari localStorage (hindari stale closure)
      const cfg = loadBotConfig();

      let reply: string = '';
      let qr: string[] = [];

      if (!cfg.enabled) {
        // Bot dinonaktifkan — kirim balasan offline standar
        reply = `Halo! 👋 Terima kasih sudah menghubungi **SR12 Beauty Hub**.\n\nPesan kamu sudah kami terima. Admin kami akan segera membalas.\n\n• **Jam Layanan**: Senin–Sabtu, 08.00–17.00 WIB\n• **WhatsApp**: +62 811-xxx-xxxx`;
        qr = cfg.fallbackQuickReplies?.length
          ? cfg.fallbackQuickReplies
          : ['Cara Order 🛍️', 'Info Produk 💄', 'Hubungi CS 📞'];
      } else {
        const apiKey = cfg.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
        
        if (cfg.useGemini && apiKey) {
          try {
            // Prepare alternating chat history for Gemini
            const contents: any[] = [];
            let lastRole: 'user' | 'model' | null = null;
            
            // Limit history to last 10 messages for performance and context limits
            const recentMessages = messages.slice(-10);
            for (const m of recentMessages) {
              const role = m.sender_role === 'customer' ? 'user' : 'model';
              const text = m.message || '';
              if (!text) continue;
              
              if (role === lastRole) {
                const lastMsg = contents[contents.length - 1];
                lastMsg.parts[0].text += '\n' + text;
              } else {
                contents.push({
                  role,
                  parts: [{ text }]
                });
                lastRole = role;
              }
            }
            
            // Ensure the current user message is at the end
            if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
              contents.push({
                role: 'user',
                parts: [{ text: userText }]
              });
            }

            const productListStr = catalog.length > 0 
              ? catalog.map(p => {
                  const catName = p.categories?.name || 'Skincare';
                  const variantsStr = p.variants && p.variants.length > 0 
                    ? p.variants.map((v: any) => `${v.name}: Rp${v.price}`).join(', ')
                    : `Rp${p.price || 0}`;
                  return `- ${p.name} (${catName}) - Varian/Harga: ${variantsStr} - Stok: ${p.stock ?? 0} pcs`;
                }).join('\n')
              : 'Daftar produk tidak tersedia saat ini.';

            const systemInstruction = {
              parts: [{
                text: `SYSTEM PROMPT – AI CUSTOMER SERVICE SR12 STORE PURWAKARTA

IDENTITAS AI
Anda adalah AI Customer Service resmi dari SR12 Store Purwakarta (asisten virtual bernama ${cfg.botName || 'Bella'}), sebuah toko e-commerce yang menjual berbagai produk kecantikan dan perawatan diri berkualitas.
Tugas utama Anda adalah memberikan pelayanan pelanggan selama 24 jam secara profesional, ramah, cepat, informatif, dan membantu pelanggan menemukan solusi terbaik sesuai kebutuhan mereka.
Anda mewakili citra bisnis SR12 Store Purwakarta sehingga setiap jawaban harus mencerminkan pelayanan yang hangat, sopan, terpercaya, dan berorientasi pada kepuasan pelanggan.

PERSONALITY
Karakter yang harus selalu digunakan:
- Sangat ramah dan hangat
- Santai namun tetap profesional
- Sabar menghadapi pelanggan
- Empatik terhadap kebutuhan pelanggan
- Komunikatif dan mudah dipahami
- Tidak kaku seperti robot
- Memberikan penjelasan detail ketika diperlukan
- Menggunakan bahasa yang sopan dan positif

Ketika menyapa pelanggan (Contoh/Panduan):
"Halo Kak 😊, terima kasih sudah menghubungi SR12 Store Purwakarta. Saya ${cfg.botName || 'Bella'}, siap membantu kebutuhan Kakak hari ini. Ada yang bisa saya bantu terkait produk kecantikan atau pesanan Kakak?"

BAHASA
Gunakan bahasa yang sama dengan pelanggan.
- Jika pelanggan menggunakan Bahasa Indonesia: Jawab dalam Bahasa Indonesia.
- Jika pelanggan menggunakan Bahasa Inggris: Jawab dalam Bahasa Inggris.
- Jika pelanggan mencampur kedua bahasa: Sesuaikan secara natural.

TUJUAN UTAMA
- Menjawab pertanyaan pelanggan.
- Memberikan informasi produk secara presisi.
- Membantu pelanggan memilih produk yang sesuai.
- Menangani keluhan pelanggan.
- Membantu proses pembelian (checkout, add to cart).
- Meningkatkan kepuasan pelanggan dan peluang penjualan secara natural tanpa memaksa.
- Memberikan pelayanan 24 jam.

PENGETAHUAN PRODUK (KATALOG NYATA)
Berikut adalah data katalog produk nyata terdaftar di database toko kami saat ini:
${productListStr}

ATURAN PENTING & PROSEDUR MENJAWAB:
1. Prioritaskan data produk nyata di atas. Hanya tawarkan/rekomendasikan produk dan varian yang ada di katalog tersebut secara presisi.
2. Jika stok produk tertulis 0 atau habis, infokan bahwa produk tersebut saat ini sedang habis (out of stock).
3. Jika ditanya mengenai pemesanan, arahkan untuk menambahkannya ke keranjang belanja lalu klik checkout.
4. Jika informasi tidak ditemukan atau berada di luar cakupan katalog:
   Katakan persis: "Maaf Kak, saat ini saya belum menemukan informasi yang akurat terkait pertanyaan tersebut. Agar Kakak mendapatkan informasi yang tepat, saya akan meneruskan pertanyaan ini kepada admin kami ya 😊"
5. PENANGANAN KOMPLAIN:
   Dengarkan dengan empati, jangan menyalahkan pelanggan. Contoh: "Maaf atas ketidaknyamanan yang Kakak alami. Terima kasih sudah menginformasikan hal ini kepada kami. Saya akan membantu mencarikan solusi terbaik dan apabila diperlukan akan saya teruskan kepada tim admin untuk penanganan lebih lanjut."
6. REKOMENDASI PRODUK:
   Analisis keluhan kulit/kebutuhan (misal: kulit berminyak, jerawat), pilih produk yang cocok dari katalog, jelaskan alasannya, dan berikan cara penggunaan.
7. UPSELLING & CROSS-SELLING:
   Lakukan secara natural dan tidak memaksa. Contoh: "Selain produk tersebut, Kakak juga bisa mempertimbangkan serum pendamping agar hasil perawatannya lebih optimal 😊"
8. LARANGAN:
   Jangan mengarang informasi medis/harga/produk palsu yang tidak ada di katalog. Jangan memberikan diagnosis kesehatan. Jangan berdebat dengan pelanggan.
9. FORMAT JAWABAN:
   Gunakan format yang rapi: Sapaan hangat, jawaban utama, informasi tambahan yang relevan, dan tawarkan bantuan lanjutan.`
              }]
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                contents,
                systemInstruction
              })
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData?.error?.message || `Gemini API returned status ${response.status}`);
            }

            const resData = await response.json();
            const geminiText = resData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

            if (geminiText) {
              reply = geminiText;
              qr = cfg.fallbackQuickReplies || ['Cara Order 🛍️', 'Info Produk 💄', 'Hubungi CS 📞'];
            } else {
              throw new Error('Empty response from Gemini');
            }
          } catch (apiErr) {
            console.error('[ChatWidget] Gemini API error, falling back to local botConfig:', apiErr);
            const result = getBotReplyFromConfig(userText, cfg);
            reply = result.reply;
            qr = result.quickReplies;
          }
        } else {
          // Local config category match
          const result = getBotReplyFromConfig(userText, cfg);
          reply = result.reply;
          qr = result.quickReplies;
        }
      }

      setIsTyping(true);
      scrollToBottom();

      const delay = Math.max(500, Number(cfg.delayMs) || 1000);
      await new Promise((r) => setTimeout(r, delay));

      const { data: botMsg, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          sender_role: 'auto',
          message: reply,
          is_read: true,
        })
        .select()
        .single();

      if (!error && botMsg) {
        // Tambah ke state lokal (realtime mungkin sudah handle ini, tapi aman jika duplikat dihindari)
        setMessages((prev) => {
          if (prev.find((p) => p.id === botMsg.id)) return prev;
          return [...prev, botMsg];
        });
        await supabase.from('chat_threads').update({
          last_message: reply,
          last_message_at: new Date().toISOString(),
          unread_user: 0,
        }).eq('id', threadId);
      } else if (error) {
        console.error('[ChatWidget] ❌ bot reply INSERT GAGAL:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        // Tampilkan pesan di UI langsung (tanpa simpan ke DB) agar user tahu bot aktif
        const fallbackMsg = {
          id: `local-${Date.now()}`,
          thread_id: threadId,
          sender_id: user.id,
          sender_role: 'auto',
          message: reply,
          is_read: true,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }

      if (Array.isArray(qr) && qr.length) setQuickReplies(qr);
    } catch (err) {
      console.error('[ChatWidget] triggerBotReply error:', err);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  // ── Kirim pesan ─────────────────────────────────────────────────────
  const send = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || !thread || !user) return;

    setSending(true);
    setInput('');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_id: thread.id,
        sender_id: user.id,
        sender_role: 'customer',
        message: messageText,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => {
        if (prev.find((p) => p.id === data.id)) return prev;
        return [...prev, data];
      });
      scrollToBottom();

      // Update thread stats
      await supabase.from('chat_threads').update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
        unread_admin: (thread.unread_admin || 0) + 1,
      }).eq('id', thread.id);

      // Trigger bot — tidak await agar UI tidak blocking
      triggerBotReply(thread.id, messageText);
    } else if (error) {
      console.error('[ChatWidget] send error:', error);
    }

    setSending(false);
  };

  const handleQuickReply = (qr: string) => {
    if (!isLoggedIn) return;
    send(qr);
  };

  // ── Helper render teks dengan **bold** ──────────────────────────────
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );
  };

  if (shouldHideCompletely) return null;

  return (
    <>
      {/* ── Floating button ── */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="chat-widget-toggle"
            onClick={() => setOpen(true)}
            className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-glow-lg hover:scale-110 transition-transform flex items-center justify-center"
            aria-label="Buka chatbot"
          >
            <Bot className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unread}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[92vw] sm:w-96 h-[75vh] sm:h-[540px] rounded-2xl glass-strong shadow-glow-lg flex flex-col overflow-hidden border border-border/40">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm flex items-center gap-1">
                  {botConfig.botName}
                  <Sparkles className="h-3 w-3 opacity-80" />
                </p>
                <p className="text-xs opacity-75">
                  {botConfig.enabled ? 'Asisten Virtual SR12' : 'Layanan Pesan – Dibalas Admin'}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
            {/* Unauthenticated state */}
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Halo! Saya {botConfig.botName} 👋</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Login dulu untuk mulai chat dengan asisten virtual kami.
                  </p>
                </div>
                <button
                  onClick={() => { setOpen(false); navigate('/login'); }}
                  className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:opacity-90 transition"
                >
                  <LogIn className="h-4 w-4" />
                  Login Sekarang
                </button>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Welcome banner jika belum ada pesan */}
                {messages.length === 0 && (
                  <div className="text-center py-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Halo! Saya {botConfig.botName} 👋</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Asisten virtual SR12 Beauty Hub.<br />Tanyakan apa saja!
                    </p>
                  </div>
                )}

                {/* Pesan */}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender_role !== 'customer' && (
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                        {m.sender_role === 'admin'
                          ? <span className="text-[10px] font-bold text-primary">A</span>
                          : <Bot className="h-3.5 w-3.5 text-primary" />
                        }
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                        m.sender_role === 'customer'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : m.sender_role === 'auto'
                          ? 'bg-card border border-border/60 text-foreground rounded-bl-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm'
                      }`}
                    >
                      {m.sender_role === 'admin' && (
                        <span className="block text-[10px] font-semibold text-primary mb-0.5">Admin</span>
                      )}
                      <span className="leading-relaxed">{renderText(m.message)}</span>
                      <p className="text-[10px] opacity-50 mt-1">
                        {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '160ms' }} />
                        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '320ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Reply chips */}
          {isLoggedIn && !loading && !isTyping && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-border/30 shrink-0 bg-background/20">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => handleQuickReply(qr)}
                  disabled={sending}
                  className="shrink-0 rounded-full border border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary text-xs px-3 py-1.5 transition whitespace-nowrap"
                >
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {isLoggedIn && (
            <div className="flex items-center gap-2 p-3 border-t border-border/40 bg-card/50 shrink-0">
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ketik pertanyaanmu di sini..."
                className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                disabled={sending || isTyping}
                autoComplete="off"
              />
              <button
                onClick={() => send()}
                disabled={sending || !input.trim() || isTyping}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
                aria-label="Kirim pesan"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
