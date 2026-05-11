import { UCPProvider, useUCP } from './store/UCPStore';
import { UCPDBProvider } from './db/UCPDBProvider';
import { UCPDBSync } from './db/UCPDBSync';
import { Header } from './components/layout/Header';
import { ContentEditorPanel } from './components/content/ContentEditorPanel';
import { ComponentRegistryPanel } from './components/content/ComponentRegistryPanel';
import { PageTemplatePanel } from './components/content/PageTemplatePanel';
import { TemplateEditorView } from './components/content/TemplateEditorView';
import { UCPHistoryPanel } from './components/history/UCPHistoryPanel';
import { BizLineAdminPanel } from './components/admin/BizLineAdminPanel';
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
  const { state } = useUCP();
  const { navView } = state;

  function renderMain() {
    switch (navView) {
      case 'content':        return <ContentEditorPanel />;
      case 'components':     return <ComponentRegistryPanel />;
      case 'templates':      return <PageTemplatePanel />;
      case 'history':        return <UCPHistoryPanel />;
      case 'audit':          return <PlaceholderPanel icon="🔒" title="Audit Log" subtitle="Full audit trail of all UCP content actions" />;
      case 'admin-bizlines': return <BizLineAdminPanel />;
      default:               return <ContentEditorPanel />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'var(--font-family)' }}>
      {/* Skip navigation link for keyboard and screen reader users */}
      <a href="#ucp-main-content" className="skip-link">Skip to main content</a>

      <Header />
      <UCPDBSync />

      <main id="ucp-main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {renderMain()}
      </main>

      <Toast />
      {/* Template editor renders as a full-screen overlay when active */}
      <TemplateEditorView />
    </div>
  );
}

export default function App() {
  return (
    <UCPDBProvider>
      <UCPProvider>
        <AppLayout />
      </UCPProvider>
    </UCPDBProvider>
  );
}
