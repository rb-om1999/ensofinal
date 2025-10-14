import React, { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChartAnalyzer from './components/ChartAnalyzer';
import VerifyEmail from './components/VerifyEmail';
import PricingPage from './components/PricingPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChartAnalyzer />} />
          <Route path="/analyze" element={<ChartAnalyzer />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
