import { OCDPProvider, useOCDP } from './store/OCDPStore';
import { OCDPDBProvider } from './db/OCDPDBProvider';
import { OCDPDBSync } from './db/OCDPDBSync';
import { OCDPHeader } from './components/layout/OCDPHeader';
import { PageLibraryPanel } from './components/deliver/PageLibraryPanel';
import { PageEditorView } from './components/deliver/PageEditorView';
import { JourneyBuilderPanel } from './components/deliver/JourneyBuilderPanel';
import { MarketAdminPanel } from './components/admin/MarketAdminPanel';
import { BizLineAdminPanel } from './components/admin/BizLineAdminPanel';
import { AdGroupAdminPanel } from './components/admin/AdGroupAdminPanel';
import { ApprovalFlowAdminPanel } from './components/admin/ApprovalFlowAdminPanel';
import { AuditLogPanel } from './components/admin/AuditLogPanel';
import { StatisticsPanel } from './components/analyse/StatisticsPanel';
import { AEOPanel } from './components/analyse/AEOPanel';
import { PendingPanel } from './components/review/ReviewPanels';
import { OCDPHistoryPanel } from './components/history/OCDPHistoryPanel';
import { WeChatComposerPanel } from './components/wechat/WeChatComposerPanel';
import { Toast } from './components/shared/Toast';

function PlaceholderPanel({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--surface-bg)', color: 'var(--text-muted)' }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

function AppLayout() {
  const { state } = useOCDP();
  const { navView, editorPageId } = state;

  function renderMain() {
    // Full-screen editor takes priority over nav view
    if (editorPageId) return <PageEditorView />;

    switch (navView) {
      case 'pages':          return <PageLibraryPanel />;
      case 'journeys':       return <JourneyBuilderPanel />;
      case 'pending':        return <PendingPanel />;
      case 'history':        return <OCDPHistoryPanel />;
      case 'stats':          return <StatisticsPanel />;
      case 'aeo':            return <AEOPanel />;
      case 'admin-markets':  return <MarketAdminPanel />;
      case 'admin-bizlines': return <BizLineAdminPanel />;
      case 'admin-groups':   return <AdGroupAdminPanel />;
      case 'admin-flows':    return <ApprovalFlowAdminPanel />;
      case 'audit':          return <AuditLogPanel />;
      case 'wechat':         return <WeChatComposerPanel />;
      default:               return <PageLibraryPanel />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-family)' }}>
      {/* Hide header when in page editor for maximum canvas space */}
      {!editorPageId && <OCDPHeader />}
      <OCDPDBSync />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {renderMain()}
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <OCDPDBProvider>
      <OCDPProvider>
        <AppLayout />
      </OCDPProvider>
    </OCDPDBProvider>
  );
}
