import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageCircle, Send, Loader2, Bot, User as UserIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Catatan: auto-reply sekarang ditangani oleh chatbot rule-based di ChatWidget.

const AdminChat = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Thread & messages ────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('chat_threads').select('*').order('last_message_at', { ascending: false, nullsFirst: false });
    setThreads(data || []);
    if (data && data.length) {
      const ids = data.map(t => t.user_id);
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Realtime: refresh threads
  useEffect(() => {
    const ch = supabase.channel('admin-chat-threads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, () => loadThreads())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadThreads]);

  const openThread = async (t: any) => {
    setActiveId(t.id);
    const { data } = await supabase.from('chat_messages').select('*').eq('thread_id', t.id).order('created_at');
    setMessages(data || []);
    await supabase.from('chat_messages').update({ is_read: true }).eq('thread_id', t.id).eq('sender_role', 'customer').eq('is_read', false);
    await supabase.from('chat_threads').update({ unread_admin: 0 }).eq('id', t.id);
    loadThreads();
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  // Realtime msgs for active thread
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`admin-thread-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `thread_id=eq.${activeId}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        if (m.sender_role === 'customer') {
          supabase.from('chat_messages').update({ is_read: true }).eq('id', m.id).then(() => {});
        }
        setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  const send = async () => {
    if (!input.trim() || !activeId) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    const { data } = await supabase.from('chat_messages').insert({
      thread_id: activeId, sender_id: user!.id, sender_role: 'admin', message: text,
    }).select().single();
    if (data) {
      setMessages(prev => [...prev, data]);
      const t = threads.find(x => x.id === activeId);
      await supabase.from('chat_threads').update({
        last_message: text, last_message_at: new Date().toISOString(),
        unread_user: (t?.unread_user || 0) + 1,
      }).eq('id', activeId);
    }
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  // ── Render bubble ────────────────────────────────────────────────
  const renderBubble = (m: any) => {
    const isCustomer = m.sender_role === 'customer';
    const isAuto     = m.sender_role === 'auto';
    return (
      <div key={m.id} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
          isCustomer
            ? 'bg-secondary text-foreground rounded-bl-sm'
            : isAuto
            ? 'bg-blue-50 dark:bg-blue-900/30 text-foreground rounded-br-sm border border-blue-200 dark:border-blue-800'
            : 'bg-primary text-primary-foreground rounded-br-sm'
        }`}>
          {isAuto && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <Bot className="h-3 w-3" /> Chatbot Bella
            </span>
          )}
          {!isCustomer && !isAuto && (
            <span className="block text-[10px] opacity-70 mb-0.5">Admin</span>
          )}
          {m.message}
          <p className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-display text-2xl font-bold text-foreground">Pesan Customer</h1>
        <div className="flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Bot className="h-3.5 w-3.5" />
          Chatbot Bella Aktif
        </div>
      </div>

      {/* ── Info chatbot ── */}
      <div className="mb-4 rounded-xl border border-border bg-card/50 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">ℹ️ Info:</span> Pesan customer dibalas otomatis oleh Chatbot <strong>Bella</strong>. Admin tetap bisa membalas manual di sini jika diperlukan.
      </div>

      {/* ── Mobile view ── */}
      <div className="block md:hidden">
        {!activeId ? (
          <div className="rounded-xl border border-border bg-card overflow-y-auto max-h-[75vh]">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />Belum ada percakapan
              </div>
            ) : threads.map(t => {
              const p = profiles[t.user_id];
              return (
                <button key={t.id} onClick={() => openThread(t)}
                  className="w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/40 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">{p?.full_name || 'Customer'}</span>
                    {t.unread_admin > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{t.unread_admin}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.last_message || 'Belum ada pesan'}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card flex flex-col" style={{ height: '75vh' }}>
            <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
              <button onClick={() => setActiveId(null)} className="mr-1 text-muted-foreground hover:text-foreground text-xs">← Kembali</button>
              <UserIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium truncate">{profiles[threads.find(t => t.id === activeId)?.user_id]?.full_name || 'Customer'}</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map(m => renderBubble(m))}
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-border">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Balas pesan..." className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none" />
              <button onClick={send} disabled={sending || !input.trim()}
                className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop view ── */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 h-[70vh]">
        <div className="rounded-xl border border-border bg-card overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />Belum ada percakapan
            </div>
          ) : threads.map(t => {
            const p = profiles[t.user_id];
            return (
              <button key={t.id} onClick={() => openThread(t)}
                className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary/40 transition ${activeId === t.id ? 'bg-primary/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground truncate">{p?.full_name || 'Customer'}</span>
                  {t.unread_admin > 0 && <span className="h-5 min-w-5 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{t.unread_admin}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{t.last_message || 'Belum ada pesan'}</p>
                {t.last_message_at && <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(t.last_message_at).toLocaleString('id-ID')}</p>}
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2 rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Pilih percakapan untuk mulai membalas
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{profiles[threads.find(t => t.id === activeId)?.user_id]?.full_name || 'Customer'}</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  <Bot className="h-3 w-3" /> Chatbot aktif
                </span>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(m => renderBubble(m))}
              </div>
              <div className="flex items-center gap-2 p-3 border-t border-border">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Balas pesan..." className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none" />
                <button onClick={send} disabled={sending || !input.trim()}
                  className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
