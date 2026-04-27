import React, { useRef, useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { CanvasSlice, SliceType } from '../../types/ucp';
import { SLICE_DEFINITIONS } from '../../utils/sliceDefinitions';
import { Button } from '../shared/Button';

// ─── Slice card shown on the canvas ──────────────────────────────────────────

function SliceCard({
  slice,
  index,
  isSelected,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
}: {
  slice: CanvasSlice;
  index: number;
  isSelected: boolean;
  isDragOver: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
}) {
  const { dispatch } = useUCP();
  const def = SLICE_DEFINITIONS[slice.type];

  return (
    <div
      draggable={!slice.locked}
      onDragStart={() => onDragStart(index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
      onDragLeave={onDragLeave}
      onClick={() => dispatch({ type: 'SELECT_SLICE', instanceId: slice.instanceId })}
      style={{
        position: 'relative',
        border: isSelected
          ? '2px solid var(--hsbc-red)'
          : isDragOver
          ? '2px dashed var(--hsbc-red)'
          : '1.5px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        background: isDragOver ? 'rgba(219,0,17,0.03)' : slice.visible ? '#fff' : '#F9FAFB',
        cursor: slice.locked ? 'default' : 'grab',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: isSelected ? '0 0 0 3px rgba(219,0,17,0.15)' : 'var(--shadow-sm)',
        opacity: slice.visible ? 1 : 0.55,
        userSelect: 'none',
        marginBottom: 0,
      }}
    >
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-light)',
        background: isSelected ? 'rgba(219,0,17,0.04)' : '#FAFAFA',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{def?.icon ?? '📦'}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexGrow: 1 }}>{def?.label ?? slice.type}</span>

        {/* Index badge */}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, background: 'var(--surface-active)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>
          #{index + 1}
        </span>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <IconBtn
            title={slice.visible ? 'Hide slice' : 'Show slice'}
            onClick={() => dispatch({ type: 'TOGGLE_SLICE_VISIBLE', instanceId: slice.instanceId })}
          >
            {slice.visible ? '👁' : '🙈'}
          </IconBtn>
          <IconBtn
            title={slice.locked ? 'Unlock' : 'Lock'}
            onClick={() => dispatch({ type: 'TOGGLE_SLICE_LOCK', instanceId: slice.instanceId })}
          >
            {slice.locked ? '🔒' : '🔓'}
          </IconBtn>
          <IconBtn
            title="Remove slice"
            onClick={() => dispatch({ type: 'REMOVE_SLICE', instanceId: slice.instanceId })}
            danger
          >
            🗑
          </IconBtn>
        </div>
      </div>

      {/* Slice content preview */}
      <SlicePreview slice={slice} />

      {/* Selected indicator stripe */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 3,
          background: 'var(--hsbc-red)',
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        }} />
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, borderRadius: 4, border: 'none', cursor: 'pointer',
        background: danger ? '#FEE2E2' : 'var(--surface-active)',
        transition: 'all 0.1s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Lightweight visual preview per slice type ────────────────────────────────

function SlicePreview({ slice }: { slice: CanvasSlice }) {
  const def = SLICE_DEFINITIONS[slice.type];
  const minH = def?.minHeight ?? 48;
  const p = slice.props as any;

  const previewWrap = (content: React.ReactNode) => (
    <div style={{ padding: '10px 14px', minHeight: minH, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {content}
    </div>
  );

  switch (slice.type) {
    case 'HEADER_NAV':
      return previewWrap(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 16, padding: '5px 12px', fontSize: 11, color: '#9CA3AF' }}>
            🔍 {p.searchPlaceholder}
          </div>
          {p.showNotificationBell && <span style={{ fontSize: 16 }}>🔔</span>}
          {p.showQRScanner && <span style={{ fontSize: 16 }}>⬛</span>}
        </div>
      );

    case 'QUICK_ACCESS':
      return previewWrap(
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          {(p.items ?? []).slice(0, 5).map((item: any) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 40, height: 40, background: '#F0F2F5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 10, color: '#6B7280' }}>{item.label}</span>
            </div>
          ))}
        </div>
      );

    case 'PROMO_BANNER':
      return previewWrap(
        <div style={{
          background: p.backgroundColor || '#E8F4FD',
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            {p.badgeText && <div style={{ fontSize: 9, fontWeight: 700, color: '#DB0011', marginBottom: 3, background: 'rgba(219,0,17,0.1)', display: 'inline-block', padding: '1px 6px', borderRadius: 10 }}>{p.badgeText}</div>}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>{p.title}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{p.subtitle}</div>
            <div style={{ marginTop: 8, background: '#DB0011', color: '#fff', fontSize: 10, fontWeight: 600, padding: '4px 12px', borderRadius: 14, display: 'inline-block' }}>{p.ctaLabel}</div>
          </div>
          {p.imageUrl
            ? <img src={p.imageUrl} alt="" style={{ width: 70, height: 70, objectFit: 'contain' }} />
            : <div style={{ width: 70, height: 70, background: 'rgba(0,0,0,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎨</div>
          }
        </div>
      );

    case 'FUNCTION_GRID':
      return previewWrap(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(p.rows ?? []).map((row: any[], ri: number) => (
            <div key={ri} style={{ display: 'flex', gap: 8, justifyContent: 'space-around' }}>
              {row.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                  <div style={{ width: 36, height: 36, background: '#F0F2F5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{item.icon}</div>
                  <span style={{ fontSize: 9, color: '#6B7280', textAlign: 'center' }}>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );

    case 'AI_ASSISTANT':
      return previewWrap(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', borderRadius: 8, padding: '6px 12px' }}>
          <span style={{ fontSize: 18 }}>✉️</span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{p.greeting}</span>
        </div>
      );

    case 'AD_BANNER':
      return previewWrap(
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #FFF9E6, #FFF3CC)', borderRadius: 10, padding: '10px 14px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{p.title}</div>
              {p.subtitle && <div style={{ fontSize: 10, color: '#78716C', marginTop: 2 }}>{p.subtitle}</div>}
              <div style={{ marginTop: 6, background: '#DB0011', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 12, display: 'inline-block' }}>{p.ctaLabel}</div>
            </div>
            {p.imageUrl
              ? <img src={p.imageUrl} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }} />
              : <div style={{ width: 60, height: 60, background: 'rgba(0,0,0,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📢</div>
            }
          </div>
          {p.dismissible && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>✕</div>}
        </div>
      );

    case 'FLASH_LOAN':
      return previewWrap(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', borderRadius: 8, padding: '8px 12px' }}>
          <div>
            <div style={{ fontSize: 10, color: '#DB0011', fontWeight: 700 }}>⚡ {p.productName}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{p.tagline}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginTop: 2 }}>¥{(p.maxAmount ?? 0).toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--hsbc-red)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 16 }}>{p.ctaLabel}</div>
        </div>
      );

    case 'WEALTH_SELECTION':
      return previewWrap(
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{p.sectionTitle}</span>
            <span style={{ fontSize: 11, color: '#DB0011' }}>更多 ›</span>
          </div>
          {(p.products ?? []).slice(0, 2).map((pr: any) => (
            <div key={pr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{pr.productName}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{pr.riskLevel}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#DB0011' }}>{pr.yield7Day}</div>
                {pr.highlighted && <div style={{ background: '#DB0011', color: '#fff', fontSize: 9, padding: '2px 8px', borderRadius: 10 }}>{pr.ctaLabel}</div>}
              </div>
            </div>
          ))}
        </div>
      );

    case 'FEATURED_RANKINGS':
      return previewWrap(
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{p.sectionTitle}</span>
            <span style={{ fontSize: 11, color: '#DB0011' }}>更多 ›</span>
          </div>
          {(p.items ?? []).slice(0, 2).map((item: any) => (
            <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0' }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#DB0011', background: '#FEE2E2', padding: '1px 6px', borderRadius: 8, display: 'inline-block', marginBottom: 2 }}>{item.badge}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: '#6B7280' }}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'LIFE_DEALS':
      return previewWrap(
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{p.sectionTitle}</span>
            <span style={{ fontSize: 11, color: '#DB0011' }}>更多 ›</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(p.deals ?? []).slice(0, 3).map((d: any) => (
              <div key={d.id} style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                {d.logoUrl
                  ? <img src={d.logoUrl} alt={d.brandName} style={{ width: 40, height: 40, objectFit: 'contain', margin: '0 auto 4px' }} />
                  : <div style={{ width: 40, height: 40, background: '#E5E7EB', borderRadius: 8, margin: '0 auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{d.brandName.slice(0, 2)}</div>
                }
                <div style={{ fontSize: 9, color: '#fff', background: '#DB0011', borderRadius: 8, padding: '2px 4px' }}>{d.tag}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'SPACER':
      return (
        <div style={{ height: Math.max(p.height ?? 16, 16), display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg, #F9FAFB, #F9FAFB 4px, #F3F4F6 4px, #F3F4F6 8px)' }}>
          <span style={{ fontSize: 10, color: '#D1D5DB', fontWeight: 600, background: '#fff', padding: '1px 8px', borderRadius: 8 }}>Spacer {p.height}px</span>
        </div>
      );

    default:
      return previewWrap(<div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>No preview available</div>);
  }
}

// ─── Drop zone indicator ──────────────────────────────────────────────────────

function DropZoneIndicator() {
  return (
    <div style={{
      height: 3, borderRadius: 2, background: 'var(--hsbc-red)',
      boxShadow: '0 0 8px rgba(219,0,17,0.4)',
      transition: 'all 0.1s',
    }} />
  );
}

// ─── Main Canvas ──────────────────────────────────────────────────────────────

export function EditorCanvas() {
  const { state, dispatch } = useUCP();
  const { layout, selectedInstanceId, dragOverIndex } = state;
  const dragSrcIndex = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragSrcIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dispatch({ type: 'SET_DRAG_OVER', index });
  }

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    dispatch({ type: 'SET_DRAG_OVER', index: null });

    // From palette
    const paletteType = e.dataTransfer.getData('palette-slice-type') as SliceType | '';
    if (paletteType) {
      dispatch({ type: 'ADD_SLICE', sliceType: paletteType, atIndex: toIndex });
      return;
    }

    // Reorder
    const from = dragSrcIndex.current;
    if (from !== null && from !== toIndex) {
      dispatch({ type: 'MOVE_SLICE', fromIndex: from, toIndex });
    }
    dragSrcIndex.current = null;
  }

  function handleDragLeave() {
    dispatch({ type: 'SET_DRAG_OVER', index: null });
  }

  function handleCanvasDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (dragOverIndex === null) dispatch({ type: 'SET_DRAG_OVER', index: layout.slices.length });
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    dispatch({ type: 'SET_DRAG_OVER', index: null });
    const paletteType = e.dataTransfer.getData('palette-slice-type') as SliceType | '';
    if (paletteType) {
      dispatch({ type: 'ADD_SLICE', sliceType: paletteType });
    }
  }

  return (
    <main
      style={{
        flex: 1,
        overflowY: 'auto',
        background: 'var(--surface-bg)',
        padding: '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      onDragLeave={handleDragLeave}
      onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'SELECT_SLICE', instanceId: null }); }}
    >
      {/* Canvas toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{layout.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {layout.platform.toUpperCase()} · {layout.locale} · {layout.slices.length} component{layout.slices.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {selectedInstanceId ? `Selected: ${layout.slices.find(s => s.instanceId === selectedInstanceId)?.type}` : 'Click a slice to select'}
          </span>
          <Button size="sm" variant="ghost" icon="🔄" onClick={() => dispatch({ type: 'SELECT_SLICE', instanceId: null })}>
            Deselect
          </Button>
        </div>
      </div>

      {/* Slices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {layout.slices.length === 0 && (
          <div style={{
            border: '2px dashed var(--border-mid)',
            borderRadius: 'var(--radius-xl)',
            padding: 48,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Canvas is empty</div>
            <div style={{ fontSize: 12 }}>Drag components from the left panel or click to add them</div>
          </div>
        )}

        {layout.slices.map((slice, index) => (
          <React.Fragment key={slice.instanceId}>
            {dragOverIndex === index && dragSrcIndex.current !== index && <DropZoneIndicator />}
            <SliceCard
              slice={slice}
              index={index}
              isSelected={selectedInstanceId === slice.instanceId}
              isDragOver={false}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
            />
          </React.Fragment>
        ))}

        {/* Trailing drop zone */}
        {dragOverIndex === layout.slices.length && <DropZoneIndicator />}
      </div>

      {/* Add slice button */}
      <button
        style={{
          marginTop: 16,
          border: '2px dashed var(--border-mid)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px',
          color: 'var(--text-muted)',
          fontSize: 13,
          cursor: 'pointer',
          background: 'transparent',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--hsbc-red)';
          (e.currentTarget as HTMLElement).style.color = 'var(--hsbc-red)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
        }}
        onClick={() => {}} // palette handles adding
      >
        <span>＋</span> Drag a component here or click from the left panel
      </button>
    </main>
  );
}
