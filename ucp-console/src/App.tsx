import React from 'react';
import { UCPProvider } from './store/UCPStore';
import { useUCP } from './store/UCPStore';
import { Sidebar } from './components/nav/Sidebar';
import { EditorPage } from './components/EditorPage';
import { PageLibraryPanel } from './components/pages/PageLibraryPanel';
import { StatsPanel } from './components/stats/StatsPanel';
import { MarketAdminPanel } from './components/admin/MarketAdminPanel';
import { BizLineAdminPanel } from './components/admin/BizLineAdminPanel';
import { ComponentRegistryPanel } from './components/content/ComponentRegistryPanel';
import { ContentLibraryPanel } from './components/content/ContentLibraryPanel';

// ─── Placeholder panel for views not yet fully built ─────────────────────────

function PlaceholderPanel({ icon, title, subtitle }: {
  icon: string; title: string; subtitle: string;
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      background: 'var(--surface-bg)',
      color: 'var(--text-muted)',
    }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

// ─── Inner layout (needs store context) ──────────────────────────────────────

function AppLayout() {
  const { state } = useUCP();
  const { navView } = state;

  function renderMain() {
    switch (navView) {
      case 'editor':
        return <EditorPage />;
      case 'pages':
        return <PageLibraryPanel />;
      case 'stats':
      case 'aeo':
        return <StatsPanel />;
      case 'admin-markets':
        return <MarketAdminPanel />;
      case 'admin-bizlines':
        return <BizLineAdminPanel />;
      case 'content':
        return <ContentLibraryPanel />;
      case 'components':
        return <ComponentRegistryPanel />;
      case 'pending':
        return (
          <PlaceholderPanel
            icon="🕐"
            title="Pending Approvals"
            subtitle="Pages awaiting review across all markets"
          />
        );
      case 'history':
        return (
          <PlaceholderPanel
            icon="📋"
            title="Approval History"
            subtitle="Past submissions, approvals, and rejections"
          />
        );
      case 'audit':
        return (
          <PlaceholderPanel
            icon="🔒"
            title="Audit Log"
            subtitle="Full audit trail of all platform actions"
          />
        );
      default:
        return <EditorPage />;
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'var(--font-family)',
    }}>
      {/* Sidebar — always visible */}
      <Sidebar />

      {/* Main content area */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}>
        {renderMain()}
      </div>
    </div>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <UCPProvider>
      <AppLayout />
    </UCPProvider>
  );
}
