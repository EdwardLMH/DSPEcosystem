import React from 'react';
import { Header } from './layout/Header';
import { ComponentPalette } from './palette/ComponentPalette';
import { EditorCanvas } from './canvas/EditorCanvas';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { MobileSimulator } from './simulator/MobileSimulator';
import { WorkflowPanel } from './workflow/WorkflowPanel';
import { Toast } from './shared/Toast';
import { useUCP } from '../store/UCPStore';

export function EditorPage() {
  const { state } = useUCP();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ComponentPalette />
        <EditorCanvas />
        <PropertiesPanel />
      </div>
      {state.showSimulator && <MobileSimulator />}
      {state.showWorkflow   && <WorkflowPanel />}
      <Toast />
    </div>
  );
}
