import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KYCDemoPage } from './pages/kyc/KYCDemoPage';
import { HomePage } from './pages/home/HomePage';
import { FXViewpointPage } from './pages/fxviewpoint/FXViewpointPage';
import { DepositCampaignPage } from './pages/deposit/DepositCampaignPage';
import { SDUIProvider } from './context/SDUIContext';
import { observability } from './analytics/ObservabilityClient';
import './tokens/hive-tokens.css';

// Detect channel from query param (?channel=WEB_STANDARD|WEB_WECHAT) or default to SDUI
const params  = new URLSearchParams(window.location.search);
const rawChan = (params.get('channel') ?? 'SDUI').toUpperCase();
const channel = (['SDUI', 'WEB_STANDARD', 'WEB_WECHAT'].includes(rawChan)
  ? rawChan : 'SDUI') as 'SDUI' | 'WEB_STANDARD' | 'WEB_WECHAT';

observability.markAppStart();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SDUIProvider channel={channel}>
      {/* WCAG 2.1 AA — skip-to-main-content link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: '-40px', left: 0, zIndex: 9999,
          padding: '8px 16px', background: '#DB0011', color: '#fff',
          fontWeight: 600, textDecoration: 'none', borderRadius: '0 0 4px 0',
          transition: 'top 0.2s',
        }}
        onFocus={e => { (e.target as HTMLElement).style.top = '0'; }}
        onBlur={e  => { (e.target as HTMLElement).style.top = '-40px'; }}
      >
        Skip to main content
      </a>
      <BrowserRouter>
        <main id="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home"             element={<HomePage />} />
            <Route path="/fx-viewpoint"     element={<FXViewpointPage />} />
            <Route path="/deposit"          element={<DepositCampaignPage />} />
            <Route path="/kyc/demo"         element={<KYCDemoPage />} />
            <Route path="/kyc/demo/:sessionId" element={<KYCDemoPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </SDUIProvider>
  </React.StrictMode>
);
