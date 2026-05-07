import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { loadArSettings } from '@/pages/admin/AdminChat';

const ChatWidget = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isTyping, setIsTyping] = useState(false); // typing indicator auto-reply
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null); // simpan channel agar cleanup aman

  // Hanya tampil untuk customer:
  // - Jangan tampil saat auth masih loading (cegah flash untuk admin)
  // - Jangan tampil jika admin/owner
  // - Jangan tampil di halaman admin
  // - Jangan tampil jika belum login
  const shouldHide = authLoading || isAdmin || location.pathname.startsWith('/admin') || !user;

  const ensureThread = async () => {
    if (!user) return;
    setLoading(true);
    let { data: t } = await supabase.from('chat_threads').select('*').eq('user_id', user.id).maybeSingle();
    if (!t) {
      const { data: created } = await supabase.from('chat_threads').insert({ user_id: user.id }).select().single();
      t = created;
    }
    setThread(t);
    const { data: msgs } = await supabase.from('chat_messages').select('*').eq('thread_id', t!.id).order('created_at');
    setMessages(msgs || []);
    // mark admin's & auto messages as read
    await supabase.from('chat_messages').update({ is_read: true }).eq('thread_id', t!.id).in('sender_role', ['admin', 'auto']).eq('is_read', false);
    await supabase.from('chat_threads').update({ unread_user: 0 }).eq('id', t!.id);
    setUnread(0);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  // Realtime subscribe + load unread count
  useEffect(() => {
    if (shouldHide || !user) return;
    (async () => {
      const { data: t } = await supabase.from('chat_threads').select('*').eq('user_id', user.id).maybeSingle();
      if (t) {
        setUnread(t.unread_user || 0);
        channelRef.current = supabase.channel(`thread-${t.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${t.id}` }, (payload) => {
            const m = payload.new as any;
            if (m.sender_role === 'admin' || m.sender_role === 'auto') {
              if (open) {
                setMessages(prev => [...prev, m]);
                supabase.from('chat_messages').update({ is_read: true }).eq('id', m.id).then(() => {});
              } else {
                setUnread(u => u + 1);
              }
            }
          })
          .subscribe();
      }
    })();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [shouldHide, user?.id, open]);

  useEffect(() => { if (open && !thread) ensureThread(); }, [open]);

  // Kirim auto-reply jika diaktifkan admin
  const triggerAutoReply = async (threadId: string, isFirstMessage: boolean) => {
    if (!user) return;
    try {
      // Baca settings dari localStorage (disimpan oleh AdminChat)
      const settings = loadArSettings();

      if (!settings.enabled) return;
      if (settings.triggerMode === 'first_only' && !isFirstMessage) return;

      const delaySec = (settings.delaySeconds ?? 1) * 1000;

      // Tampilkan typing indicator
      setIsTyping(true);
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);

      await new Promise(r => setTimeout(r, delaySec));

      // Insert auto-reply — sender_id = user.id agar lolos NOT NULL & RLS
      const { data: autoMsg, error: insertErr } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          sender_role: 'auto',
          message: settings.message,
          is_read: true,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('[auto-reply] gagal insert:', insertErr.message);
        setIsTyping(false);
        return;
      }

      if (autoMsg) {
        setMessages(prev => [...prev, autoMsg]);
        await supabase.from('chat_threads').update({
          last_message: settings.message,
          last_message_at: new Date().toISOString(),
          unread_user: 0,
        }).eq('id', threadId);
      }
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
    } catch (e) {
      console.error('[auto-reply] error:', e);
      setIsTyping(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !thread || !user) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    // Cek apakah ini pesan pertama customer di thread ini
    const customerMsgs = messages.filter(m => m.sender_role === 'customer');
    const isFirstMessage = customerMsgs.length === 0;

    const { data, error } = await supabase.from('chat_messages').insert({
      thread_id: thread.id, sender_id: user.id, sender_role: 'customer', message: text,
    }).select().single();
    if (!error && data) {
      setMessages(prev => [...prev, data]);
      await supabase.from('chat_threads').update({
        last_message: text, last_message_at: new Date().toISOString(),
        unread_admin: (thread.unread_admin || 0) + 1,
      }).eq('id', thread.id);

      // Trigger auto-reply setelah pesan terkirim
      triggerAutoReply(thread.id, isFirstMessage);
    }
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setOpen(true)}
            className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-glow-lg hover:scale-110 transition flex items-center justify-center"
            aria-label="Chat dengan admin"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unread}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[90vw] sm:w-96 h-[70vh] sm:h-[500px] rounded-2xl glass-strong shadow-glow-lg flex flex-col overflow-hidden border border-border/40">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div>
              <p className="font-semibold text-sm">SR12 Customer Service</p>
              <p className="text-xs opacity-80">Biasanya membalas dalam 1 jam</p>
            </div>
            <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-background/30">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-10">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Halo! Ada yang bisa kami bantu? 👋
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    m.sender_role === 'customer'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : m.sender_role === 'auto'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-foreground rounded-bl-sm'
                      : 'bg-secondary text-foreground rounded-bl-sm'
                  }`}>
                    {/* Badge auto-reply */}
                    {m.sender_role === 'auto' && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        <Bot className="h-3 w-3" /> Pesan Otomatis
                      </span>
                    )}
                    {m.message}
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-border/40 bg-card/50">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Tulis pesan..."
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              disabled={sending || isTyping}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim() || isTyping}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:scale-105 transition"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
