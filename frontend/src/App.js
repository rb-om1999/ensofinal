import React, { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChartAnalyzer from './components/ChartAnalyzer';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ChartAnalyzer />} />
          <Route path="/analyze" element={<ChartAnalyzer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
