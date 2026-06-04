import { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, Bot, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { type BotConfig, loadBotConfig, getBotReplyFromConfig } from '@/lib/botConfig';

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
  const [quickReplies, setQuickReplies] = useState<string[]>(() => {
    try {
      const cfg = loadBotConfig();
      const first = cfg.categories?.[0]?.quickReplies;
      return Array.isArray(first) && first.length
        ? first
        : ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'];
    } catch {
      return ['Cara Order 🛍️', 'Info Produk 💄', 'Status Pesanan 📦', 'Promo & Voucher 🎁'];
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Reload bot config setiap kali chat dibuka (agar perubahan admin langsung terasa)
  useEffect(() => {
    if (open) setBotConfig(loadBotConfig());
  }, [open]);

  const isOnAdminPage = location.pathname.startsWith('/admin');
  const shouldHideCompletely = authLoading || isAdmin || isOnAdminPage;
  const isLoggedIn = !!user;

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);

  // ── Muat thread & pesan ─────────────────────────────────────────────
  const ensureThread = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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
  }, [user]);

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
                  if (m.sender_role === 'admin') {
                    supabase.from('chat_messages').update({ is_read: true }).eq('id', m.id).then(() => {});
                  }
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

      let reply: string;
      let qr: string[];

      if (!botConfig.enabled) {
        // Bot dinonaktifkan — kirim balasan offline standar
        reply = `Halo! 👋 Terima kasih sudah menghubungi **SR12 Beauty Hub**.\n\nPesan kamu sudah kami terima. Admin kami akan segera membalas.\n\n• **Jam Layanan**: Senin–Sabtu, 08.00–17.00 WIB\n• **WhatsApp**: +62 811-xxx-xxxx`;
        qr = botConfig.fallbackQuickReplies?.length
          ? botConfig.fallbackQuickReplies
          : ['Cara Order 🛍️', 'Info Produk 💄', 'Hubungi CS 📞'];
      } else {
        const result = getBotReplyFromConfig(userText, botConfig);
        reply = result.reply;
        qr = result.quickReplies;
      }

      setIsTyping(true);
      scrollToBottom();

      const delay = Math.max(500, Number(botConfig.delayMs) || 1200);
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
        console.error('[ChatWidget] bot reply insert error:', error);
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
      setMessages((prev) => [...prev, data]);
      await supabase.from('chat_threads').update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
        unread_admin: (thread.unread_admin || 0) + 1,
      }).eq('id', thread.id);

      triggerBotReply(thread.id, messageText);
    }

    setSending(false);
    scrollToBottom();
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
                placeholder="Tulis pesan..."
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
