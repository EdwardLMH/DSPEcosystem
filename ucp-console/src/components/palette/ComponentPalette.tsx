import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { SLICE_DEFINITIONS, SLICE_CATEGORIES } from '../../utils/sliceDefinitions';
import { SliceType, SliceCategory } from '../../types/ucp';

export function ComponentPalette() {
  const { state, dispatch } = useUCP();
  const [activeCategory, setActiveCategory] = useState<SliceCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const defs = Object.values(SLICE_DEFINITIONS);
  const filtered = defs.filter(d => {
    const matchesCat = activeCategory === 'all' || d.category === activeCategory;
    const matchesSearch = search === '' ||
      d.label.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const existingTypes = new Set(state.layout.slices.map(s => s.type));

  function handleDragStart(e: React.DragEvent, sliceType: SliceType) {
    e.dataTransfer.setData('palette-slice-type', sliceType);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: 'var(--surface-sidebar)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Component Library
        </div>
        <input
          placeholder="Search components…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 12,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[{ id: 'all', label: 'All', icon: '⊞' }, ...SLICE_CATEGORIES].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            style={{
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s',
              background: activeCategory === cat.id ? 'var(--hsbc-red)' : 'rgba(255,255,255,0.08)',
              color: activeCategory === cat.id ? '#fff' : 'rgba(255,255,255,0.55)',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            No components found
          </div>
        )}
        {filtered.map(def => {
          const isSingletonUsed = def.singleton && existingTypes.has(def.type);
          return (
            <div
              key={def.type}
              draggable={!isSingletonUsed}
              onDragStart={e => handleDragStart(e, def.type)}
              onClick={() => !isSingletonUsed && dispatch({ type: 'ADD_SLICE', sliceType: def.type })}
              title={isSingletonUsed ? 'Already on canvas (singleton)' : `Drag or click to add ${def.label}`}
              style={{
                background: isSingletonUsed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: isSingletonUsed ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '9px 11px',
                cursor: isSingletonUsed ? 'default' : 'grab',
                opacity: isSingletonUsed ? 0.4 : 1,
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { if (!isSingletonUsed) (e.currentTarget as HTMLElement).style.background = 'rgba(219,0,17,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSingletonUsed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 16 }}>{def.icon}</span>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{def.label}</span>
                {isSingletonUsed && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>USED</span>
                )}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.4 }}>{def.description}</div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, lineHeight: 1.5 }}>
          💡 Drag onto canvas or click to append
        </div>
      </div>
    </aside>
  );
}
