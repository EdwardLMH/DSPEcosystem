import React, { useState } from 'react';
import { useUCP } from '../../store/UCPStore';
import { Channel, PageLayout } from '../../types/ucp';
import { ChannelBadge } from '../shared/ChannelBadge';
import { MarketBadge } from '../shared/MarketBadge';
import { ProductionStatusBadge } from '../shared/ProductionStatusBadge';
import { StatusBadge } from '../shared/StatusBadge';
import { Button } from '../shared/Button';
import { NewPageModal } from './NewPageModal';

// ─── Filter types ─────────────────────────────────────────────────────────────

type ChannelFilter = 'all' | Channel;
type StatusFilter  = 'all' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'LIVE';

// ─── Page Library Panel (full-page view) ─────────────────────────────────────

export function PageLibraryPanel() {
  const { state, dispatch } = useUCP();
  const {
    pages, activePageId, workflow, marketStatus,
    markets, bizLines, showNewPageModal,
  } = state;

  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [marketFilter,  setMarketFilter]  = useState<string>('all');
  const [bizFilter,     setBizFilter]     = useState<string>('all');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all');
  const [search,        setSearch]        = useState('');

  function getWfStatus(pageId: string) {
    return workflow.find(w => w.pageId === pageId)?.status ?? 'DRAFT';
  }

  function getMarketStatuses(pageId: string) {
    return marketStatus.filter(ms => ms.pageId === pageId);
  }

  // Filtered pages
  const filtered = pages.filter(page => {
    if (channelFilter !== 'all' && page.channel !== channelFilter) return false;
    if (marketFilter  !== 'all' && page.marketId !== marketFilter)  return false;
    if (bizFilter     !== 'all' && page.bizLineId !== bizFilter)    return false;
    const wf = getWfStatus(page.pageId);
    if (statusFilter  !== 'all' && wf !== statusFilter) return false;
    if (search && !page.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 24px',
        background: 'var(--surface-panel)',
        borderBottom: '1px solid var(--border-light)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Page Library</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {filtered.length} of {pages.length} page{pages.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Button
            variant="primary" size="sm" icon="+"
            style={{ marginLeft: 'auto' }}
            onClick={() => dispatch({ type: 'TOGGLE_NEW_PAGE_MODAL' })}
          >
            New Page
          </Button>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search pages…"
            style={{
              padding: '6px 10px',
              border: '1px solid var(--border-mid)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              fontFamily: 'var(--font-family)',
              outline: 'none',
              width: 180,
            }}
          />

          {/* Channel filter */}
          <FilterSelect
            value={channelFilter}
            onChange={v => setChannelFilter(v as ChannelFilter)}
            options={[
              { value: 'all',          label: 'All Channels' },
              { value: 'SDUI',         label: 'SDUI' },
              { value: 'WEB_STANDARD', label: 'Web Standard' },
              { value: 'WEB_WECHAT',   label: 'WeChat' },
            ]}
          />

          {/* Market filter */}
          <FilterSelect
            value={marketFilter}
            onChange={setMarketFilter}
            options={[
              { value: 'all', label: 'All Markets' },
              ...markets.map(m => ({ value: m.marketId, label: m.marketId })),
            ]}
          />

          {/* Biz line filter */}
          <FilterSelect
            value={bizFilter}
            onChange={setBizFilter}
            options={[
              { value: 'all', label: 'All Biz Lines' },
              ...bizLines.map(b => ({ value: b.bizLineId, label: b.displayName })),
            ]}
          />

          {/* Status filter */}
          <FilterSelect
            value={statusFilter}
            onChange={v => setStatusFilter(v as StatusFilter)}
            options={[
              { value: 'all',              label: 'All Statuses' },
              { value: 'DRAFT',            label: 'Draft' },
              { value: 'PENDING_APPROVAL', label: 'Pending' },
              { value: 'APPROVED',         label: 'Approved' },
              { value: 'LIVE',             label: 'Live' },
            ]}
          />
        </div>
      </div>

      {/* ── Page list ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 200, gap: 10,
          }}>
            <span style={{ fontSize: 36 }}>📭</span>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No pages match the current filters.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(page => (
              <PageRow
                key={page.pageId}
                page={page}
                isActive={page.pageId === activePageId}
                wfStatus={getWfStatus(page.pageId)}
                mktStatuses={getMarketStatuses(page.pageId)}
                onOpen={() => dispatch({ type: 'OPEN_PAGE', pageId: page.pageId })}
                onDuplicate={() => dispatch({ type: 'DUPLICATE_PAGE', pageId: page.pageId })}
                onDelete={() => {
                  if (window.confirm(`Delete "${page.name}"?`))
                    dispatch({ type: 'DELETE_PAGE', pageId: page.pageId });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Page Modal */}
      {showNewPageModal && <NewPageModal />}
    </div>
  );
}

// ─── Page Row ─────────────────────────────────────────────────────────────────

import { PageMarketStatus, WorkflowStatus } from '../../types/ucp';

function PageRow({
  page, isActive, wfStatus, mktStatuses, onOpen, onDuplicate, onDelete,
}: {
  page: PageLayout;
  isActive: boolean;
  wfStatus: WorkflowStatus;
  mktStatuses: PageMarketStatus[];
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isLive = wfStatus === 'LIVE';

  // Compact market status chips
  const statusIcons: Record<string, string> = {
    LIVE: '✅',
    NEVER_RELEASED: '⬜',
    ROLLED_BACK: '🟡',
    SUPERSEDED: '⬜',
  };

  return (
    <div style={{
      background: 'var(--surface-panel)',
      border: `1px solid ${isActive ? 'var(--hsbc-red)' : 'var(--border-light)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'border-color 0.12s, box-shadow 0.12s',
      boxShadow: isActive ? '0 0 0 2px rgba(219,0,17,0.08)' : 'none',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: 'var(--surface-active)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {page.thumbnail ?? '📄'}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: 280,
          }}>
            {page.name}
          </span>
          <ChannelBadge channel={page.channel} size="sm" />
          <MarketBadge marketId={page.marketId} scope={page.scope} size="sm" />
          <span style={{
            fontSize: 10, fontWeight: 600,
            background: 'var(--bizline-bg)', color: 'var(--bizline-text)',
            padding: '2px 7px', borderRadius: 'var(--radius-sm)',
          }}>
            {page.bizLineId}
          </span>
          <StatusBadge status={wfStatus} size="sm" />
        </div>

        {/* Production status strip */}
        {mktStatuses.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {mktStatuses.map(ms => (
              <span key={ms.statusId} style={{
                fontSize: 10, color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {statusIcons[ms.productionStatus] ?? '⬜'} {ms.releaseTargetId}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Not released to any market
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Button size="sm" variant="primary" onClick={onOpen}>
          Open
        </Button>
        <Button size="sm" variant="secondary" onClick={onDuplicate}>
          Duplicate
        </Button>
        {!isLive && (
          <Button size="sm" variant="danger" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Filter select helper ─────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 10px',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius-md)',
        fontSize: 12,
        fontFamily: 'var(--font-family)',
        background: '#fff',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
