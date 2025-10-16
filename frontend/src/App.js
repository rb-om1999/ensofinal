import React, { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ChartAnalyzer from './components/ChartAnalyzer';
import VerifyEmail from './components/VerifyEmail';
import PricingPage from './components/PricingPage';
import PaymentPage from './components/PaymentPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ChartAnalyzer />} />
          <Route path="/analyze" element={<ChartAnalyzer />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
