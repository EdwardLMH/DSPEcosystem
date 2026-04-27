import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KYCDemoPage } from './pages/kyc/KYCDemoPage';
import './tokens/hive-tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/kyc/demo" replace />} />
        <Route path="/kyc/demo" element={<KYCDemoPage />} />
        <Route path="/kyc/demo/:sessionId" element={<KYCDemoPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
