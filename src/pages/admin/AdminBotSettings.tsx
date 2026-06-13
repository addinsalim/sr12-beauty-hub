import { useState, useRef } from 'react';
import {
  Bot, Save, RotateCcw, Plus, Trash2, ChevronDown, ChevronUp,
  X, ToggleLeft, ToggleRight, Send, Loader2, Sparkles, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  type BotConfig, type BotCategory,
  loadBotConfig, saveBotConfig, getBotReplyFromConfig,
  DEFAULT_BOT_CONFIG,
} from '@/lib/botConfig';

// ─── Helper ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft('');
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-xs text-primary"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(i)}
              className="ml-0.5 hover:text-destructive transition"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground italic">Belum ada item</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="rounded-lg border border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary px-3 py-1.5 text-sm transition disabled:opacity-40"
        >
          + Tambah
        </button>
      </div>
    </div>
  );
}

function CategoryCard({
  cat,
  index,
  onChange,
  onDelete,
}: {
  cat: BotCategory;
  index: number;
  onChange: (updated: BotCategory) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const set = <K extends keyof BotCategory>(key: K, val: BotCategory[K]) =>
    onChange({ ...cat, [key]: val });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-secondary/30 transition"
        onClick={() => setExpanded((p) => !p)}>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground truncate">{cat.label || 'Kategori tanpa nama'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
            title="Hapus kategori"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-background/40">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Nama Kategori</label>
            <input
              value={cat.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="contoh: Info Produk"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Kata Kunci Trigger <span className="text-[10px] normal-case font-normal">(tekan Enter untuk tambah)</span>
            </label>
            <ChipInput
              values={cat.keywords}
              onChange={(v) => set('keywords', v)}
              placeholder="contoh: pesan, order, beli..."
            />
          </div>

          {/* Reply */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Teks Balasan <span className="text-[10px] normal-case font-normal">(gunakan **teks** untuk bold, {'{botName}'} untuk nama bot)</span>
            </label>
            <textarea
              value={cat.reply}
              onChange={(e) => set('reply', e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono"
            />
          </div>

          {/* Quick Replies */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Tombol Quick Reply <span className="text-[10px] normal-case font-normal">(tampil setelah balasan ini)</span>
            </label>
            <ChipInput
              values={cat.quickReplies}
              onChange={(v) => set('quickReplies', v)}
              placeholder="contoh: Cara Order 🛍️"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────
function BotPreview({ config }: { config: BotConfig }) {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () => setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMsgs((p) => [...p, { role: 'user', text }]);
    setTyping(true);
    scrollBottom();

    const apiKey = config.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    let reply = '';

    if (config.useGemini && apiKey) {
      try {
        const contents: any[] = [];
        let lastRole: 'user' | 'model' | null = null;
        
        // Build history from current messages
        const recentMsgs = msgs.slice(-10);
        for (const m of recentMsgs) {
          const role = m.role === 'user' ? 'user' : 'model';
          if (role === lastRole) {
            contents[contents.length - 1].parts[0].text += '\n' + m.text;
          } else {
            contents.push({
              role,
              parts: [{ text: m.text }]
            });
            lastRole = role;
          }
        }

        // Add current user query
        if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
          contents.push({
            role: 'user',
            parts: [{ text }]
          });
        }

        const systemInstruction = {
          parts: [{
            text: `You are ${config.botName || 'Bella'}, a friendly, helpful, and professional virtual AI assistant for SR12 Purwakarta / Beauty Hub (an Indonesian brand of premium natural skincare, cosmetics, herbal products, and fragrances).
Respond in Indonesian (Bahasa Indonesia) with a polite, warm, and helpful tone.
Use emojis, clear spacing, and bullet points to make your replies readable.
Keep your answers concise and professional (maximum 3-4 sentences).
You can help users with:
- Ordering guidelines (checkout, adding to cart, vouchers).
- Skincare tips and recommendations.
- Payment methods.
- Store locations and contact info.
If the user asks questions outside the scope of SR12 Beauty Hub, politely state that you can only help with SR12 Beauty Hub queries, and advise them to wait for a human admin to respond. Encourage the user to browse the "Produk" page for exact prices and real-time stock.`
          }]
        };

        const delay = Math.max(500, config.delayMs || 1000);
        const startTime = Date.now();

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
          throw new Error(errData?.error?.message || `Gemini status ${response.status}`);
        }

        const resData = await response.json();
        reply = resData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        const elapsed = Date.now() - startTime;
        if (elapsed < delay) {
          await new Promise((r) => setTimeout(r, delay - elapsed));
        }
      } catch (err) {
        console.error('[BotPreview] Gemini error, fallback to local config:', err);
        const localRes = getBotReplyFromConfig(text, config);
        reply = localRes.reply;
      }
    } else {
      await new Promise((r) => setTimeout(r, Math.min(config.delayMs, 800)));
      const localRes = getBotReplyFromConfig(text, config);
      reply = localRes.reply;
    }

    setMsgs((p) => [...p, { role: 'bot', text: reply }]);
    setTyping(false);
    scrollBottom();
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden h-[420px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground shrink-0">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="font-semibold text-sm flex items-center gap-1">
            {config.botName || 'Bella'} <Sparkles className="h-3 w-3 opacity-80" />
          </p>
          <p className="text-xs opacity-75">Preview Mode</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/30">
        {msgs.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 text-primary/40" />
            Ketik pesan untuk test bot...
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
              m.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border/60 text-foreground rounded-bl-sm'
            }`}>
              {renderText(m.text)}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '160ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '320ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t border-border shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ketik untuk test bot..."
          disabled={typing}
          className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:scale-105 transition-transform"
        >
          {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminBotSettings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig>(() => loadBotConfig());
  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'preview'>('settings');
  const [dirty, setDirty] = useState(false);

  const update = <K extends keyof BotConfig>(key: K, val: BotConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    saveBotConfig(config);
    setDirty(false);
    toast({ title: '✅ Pengaturan chatbot disimpan!' });
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_BOT_CONFIG, categories: [...DEFAULT_BOT_CONFIG.categories] });
    setDirty(true);
    toast({ title: '🔄 Config direset ke default', description: 'Tekan Simpan untuk menyimpan.' });
  };

  const updateCategory = (idx: number, updated: BotCategory) => {
    const cats = [...config.categories];
    cats[idx] = updated;
    update('categories', cats);
  };

  const deleteCategory = (idx: number) => {
    update('categories', config.categories.filter((_, i) => i !== idx));
  };

  const addCategory = () => {
    const newCat: BotCategory = {
      id: generateId(),
      label: 'Kategori Baru',
      keywords: [],
      reply: '',
      quickReplies: [],
    };
    update('categories', [...config.categories, newCat]);
  };

  const tabs = [
    { id: 'settings', label: 'Pengaturan Umum', icon: Settings2 },
    { id: 'categories', label: `Kategori FAQ (${config.categories.length})`, icon: Bot },
    { id: 'preview', label: 'Preview Bot', icon: Sparkles },
  ] as const;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Pengaturan Chatbot Bella
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola perilaku, respons, dan kategori FAQ chatbot secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => update('enabled', !config.enabled)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition ${
              config.enabled
                ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'bg-secondary border-border text-muted-foreground'
            }`}
          >
            {config.enabled
              ? <><ToggleRight className="h-4 w-4" /> Bot Aktif</>
              : <><ToggleLeft className="h-4 w-4" /> Bot Nonaktif</>
            }
          </button>

          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default
          </Button>

          <Button size="sm" onClick={handleSave} disabled={!dirty} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Status banner */}
      {!config.enabled && (
        <div className="mb-4 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2">
          <Bot className="h-4 w-4 shrink-0" />
          <span><strong>Bot dinonaktifkan.</strong> Pesan customer akan masuk ke halaman Pesan tanpa auto-reply dari bot.</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mb-4 flex gap-1 rounded-xl bg-secondary/50 p-1 w-full sm:w-auto inline-flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition flex-1 sm:flex-none justify-center ${
              activeTab === t.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Pengaturan Umum ── */}
      {activeTab === 'settings' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {/* Identitas Bot */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Identitas Bot
              </h2>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Bot</label>
                <input
                  value={config.botName}
                  onChange={(e) => update('botName', e.target.value)}
                  placeholder="Bella"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Gunakan <code className="bg-secondary px-1 rounded text-[10px]">{'{botName}'}</code> di teks balasan untuk menyebut nama bot.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Delay Balasan: <strong>{config.delayMs}ms</strong>
                </label>
                <input
                  type="range" min={500} max={5000} step={100}
                  value={config.delayMs}
                  onChange={(e) => update('delayMs', Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-0.5">
                  <span>0.5 detik</span><span>5 detik</span>
                </div>
              </div>
            </div>

            {/* Integrasi AI Gemini */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" /> Integrasi AI Gemini
              </h2>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/35 border border-border/40">
                <div>
                  <p className="text-xs font-medium text-foreground">Aktifkan AI Gemini</p>
                  <p className="text-[10px] text-muted-foreground">Respons bot cerdas & dinamis berbasis AI</p>
                </div>
                <button
                  type="button"
                  onClick={() => update('useGemini', !config.useGemini)}
                  className={`rounded-full p-1 transition ${
                    config.useGemini ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {config.useGemini ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Gemini API Key <span className="text-[10px] text-muted-foreground">(Opsional - default menggunakan API Key sistem)</span>
                </label>
                <input
                  type="password"
                  value={config.geminiApiKey || ''}
                  onChange={(e) => update('geminiApiKey', e.target.value)}
                  placeholder="Masukkan API Key (AIzaSy...)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Jika dikosongkan, aplikasi akan menggunakan API Key global yang dikonfigurasi di server.
                </p>
              </div>
            </div>
          </div>

          {/* Pesan Fallback */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Bot className="h-4 w-4 text-orange-500" /> Pesan Fallback
              <span className="text-[10px] text-muted-foreground font-normal">(jika tidak ada keyword yang cocok)</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Teks Balasan Default</label>
              <textarea
                value={config.fallbackReply}
                onChange={(e) => update('fallbackReply', e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Quick Replies Default</label>
              <ChipInput
                values={config.fallbackQuickReplies}
                onChange={(v) => update('fallbackQuickReplies', v)}
                placeholder="Cara Order 🛍️"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Kategori FAQ ── */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {config.categories.length} kategori aktif. Klik untuk expand dan edit.
            </p>
            <button
              onClick={addCategory}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 hover:bg-primary/15 text-primary px-4 py-2 text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" /> Tambah Kategori
            </button>
          </div>

          {config.categories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              onChange={(updated) => updateCategory(i, updated)}
              onDelete={() => deleteCategory(i)}
            />
          ))}

          {config.categories.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center">
              <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada kategori.</p>
              <button onClick={addCategory} className="mt-3 text-primary text-sm font-medium hover:underline">
                + Tambah kategori pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Preview ── */}
      {activeTab === 'preview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Simulasi chatbot menggunakan config yang sedang diedit (belum perlu disimpan untuk preview).
            </p>
            <BotPreview config={config} />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">Tips Penggunaan</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-primary">•</span> Gunakan <code className="bg-secondary px-1 rounded text-xs">**teks**</code> untuk bold di teks balasan.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Gunakan <code className="bg-secondary px-1 rounded text-xs">{'{botName}'}</code> agar nama bot muncul dinamis.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Kata kunci dicocokkan dengan <strong>includes</strong>, bukan exact match.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Urutan kategori penting — kategori pertama yang cocok yang dipakai.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Quick reply bisa diisi emoji untuk tampilan yang lebih menarik.</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Nonaktifkan bot jika ingin layanan CS manual penuh dari admin.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Sticky save reminder ── */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-border bg-card shadow-lg px-5 py-3 text-sm animate-in fade-in slide-in-from-bottom-4">
          <span className="text-muted-foreground">Ada perubahan yang belum disimpan</span>
          <Button size="sm" onClick={handleSave} className="rounded-full gap-1.5">
            <Save className="h-3.5 w-3.5" /> Simpan
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminBotSettings;
