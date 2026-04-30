import React from 'react';
import { Header } from './layout/Header';
import { ComponentPalette } from './palette/ComponentPalette';
import { EditorCanvas } from './canvas/EditorCanvas';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { MobileSimulator } from './simulator/MobileSimulator';
import { WorkflowPanel } from './workflow/WorkflowPanel';
import { Toast } from './shared/Toast';
import { NewPageModal } from './pages/NewPageModal';
import { SubmitDialog } from './submission/SubmitDialog';
import { AEOScorePanel } from './aeo/AEOScorePanel';
import { WeChatMessageComposer } from './wechat/WeChatMessageComposer';
import { useUCP } from '../store/UCPStore';

export function EditorPage() {
  const { state } = useUCP();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ComponentPalette />
        <EditorCanvas />
        <PropertiesPanel />
      </div>

      {/* Overlays and slide-in panels */}
      {state.showSimulator      && <MobileSimulator />}
      {state.showWorkflow       && <WorkflowPanel />}
      {state.showNewPageModal   && <NewPageModal />}
      {state.showSubmitDialog   && <SubmitDialog />}
      {state.showAEOPanel       && <AEOScorePanel />}
      {state.showWeChatComposer && <WeChatMessageComposer />}

      <Toast />
    </div>
  );
}
