import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KYCDemoPage } from './pages/kyc/KYCDemoPage';
import { WealthHubPage } from './pages/wealth/WealthHubPage';
import { FXViewpointPage } from './pages/fxviewpoint/FXViewpointPage';
import { DepositCampaignPage } from './pages/deposit/DepositCampaignPage';
import './tokens/hive-tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/wealth" replace />} />
        <Route path="/wealth" element={<WealthHubPage />} />
        <Route path="/fx-viewpoint" element={<FXViewpointPage />} />
        <Route path="/deposit" element={<DepositCampaignPage />} />
        <Route path="/kyc/demo" element={<KYCDemoPage />} />
        <Route path="/kyc/demo/:sessionId" element={<KYCDemoPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
