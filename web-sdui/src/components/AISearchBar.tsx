import React, { useState, useRef } from 'react';

interface AISearchBarProps {
  placeholder?: string;
  enableSemanticSearch?: boolean;
  enableQRScan?: boolean;
  enableChatbot?: boolean;
  enableMessageInbox?: boolean;
  searchApiEndpoint?: string;
  id?: string;
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  deepLink: string;
  score: number;
}

const RED = '#DB0011';

export default function AISearchBar({
  placeholder = '搜尋功能、產品',
  enableSemanticSearch = true,
  enableQRScan = true,
  enableChatbot = true,
  enableMessageInbox = true,
  searchApiEndpoint = '/api/v1/search',
  id,
}: AISearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bffBase = searchApiEndpoint.startsWith('http')
    ? new URL(searchApiEndpoint).origin
    : '';

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounce.current) clearTimeout(debounce.current);
    if (!value.trim()) { setResults([]); setError(''); return; }
    debounce.current = setTimeout(() => performSearch(value), 350);
  }

  async function performSearch(q: string) {
    if (!enableSemanticSearch) return;
    setLoading(true);
    setError('');
    try {
      const url = bffBase
        ? `${bffBase}/api/v1/search`
        : searchApiEndpoint;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 8 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { results: SearchResult[] };
      setResults(data.results ?? []);
    } catch {
      setError('搜尋服務暫時不可用，請稍後重試。');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = ['朝朝寶', '低風險理財', '信用卡', '基金', '借錢', '外匯'];

  return (
    <div id={id} style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Search bar row */}
      <div style={{
        background: RED, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {enableQRScan && (
          <button
            onClick={() => alert('QR Scan — integrate native camera API')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.9)', fontSize: 20, lineHeight: 1 }}
            aria-label="QR Scan"
          >⬜</button>
        )}
        <div
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setOpen(true)}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 20,
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'text',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>🔍</span>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{placeholder}</span>
        </div>
        {enableChatbot && (
          <button
            onClick={() => alert('Chatbot — open AI assistant')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.9)', fontSize: 20, lineHeight: 1 }}
            aria-label="AI Chatbot"
          >🤖</button>
        )}
        {enableMessageInbox && (
          <button
            onClick={() => alert('Messages — open inbox')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,0.9)', fontSize: 20, lineHeight: 1 }}
            aria-label="Messages"
          >✉️</button>
        )}
      </div>

      {/* Search overlay */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: '#fff', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Overlay header */}
          <div style={{ background: RED, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 20,
              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {loading
                ? <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>⏳</span>
                : <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>🔍</span>
              }
              <input
                autoFocus
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder={placeholder}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#fff', fontSize: 14,
                }}
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>✕</button>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); setQuery(''); setResults([]); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, whiteSpace: 'nowrap' }}
            >取消</button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#E5E7EB' }} />

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
            {!query.trim() ? (
              /* Suggestions */
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 12 }}>熱門搜尋</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => { handleQueryChange(s); }}
                      style={{
                        padding: '6px 14px', borderRadius: 18, border: '1px solid #E5E7EB',
                        background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151',
                      }}>{s}</button>
                  ))}
                </div>
                {enableSemanticSearch && (
                  <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#E0F2FE', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16 }}>✨</span>
                    <span style={{ fontSize: 12, color: '#0369A1', lineHeight: 1.5 }}>
                      智能語意搜尋 — 試試「低風險穩定回報」或「咖啡優惠」
                    </span>
                  </div>
                )}
              </div>
            ) : error ? (
              <div style={{ padding: 32, textAlign: 'center', color: RED, fontSize: 13 }}>{error}</div>
            ) : results.length === 0 && !loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>找不到「{query}」的相關結果</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>試試其他關鍵詞</div>
              </div>
            ) : (
              <div>
                <div style={{ padding: '8px 16px', fontSize: 11, color: '#9CA3AF' }}>
                  找到 {results.length} 個相關結果
                </div>
                {results.map((r, i) => (
                  <div key={r.id}>
                    <div
                      onClick={() => { alert(`Navigate → ${r.deepLink}`); setOpen(false); }}
                      style={{ padding: '12px 16px', background: '#fff', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {r.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 8, background: '#FEE2E2', color: RED, flexShrink: 0 }}>{r.type}</span>
                    </div>
                    {i < results.length - 1 && <div style={{ height: 1, background: '#F3F4F6', marginLeft: 72 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
