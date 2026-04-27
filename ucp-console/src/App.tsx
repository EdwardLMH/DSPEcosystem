import React from 'react';
import { UCPProvider } from './store/UCPStore';
import { EditorPage } from './components/EditorPage';

export default function App() {
  return (
    <UCPProvider>
      <EditorPage />
    </UCPProvider>
  );
}
