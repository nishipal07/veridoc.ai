import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ScanResult from './pages/ScanResult';
import History from './pages/History';
import Compare from './pages/Compare';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scan/:id" element={<ScanResult />} />
            <Route path="/history" element={<History />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </div>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AccessLens · 6-Hour Hackathon Demo · Automated Accessibility Auditor</span>
            <span>Powered by Playwright & axe-core</span>
          </div>
        </footer>
      </div>
    </Router>
  );
}
