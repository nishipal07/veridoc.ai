import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, History, GitCompare, Sparkles, AlertTriangle } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'New Scan', icon: Sparkles },
    { to: '/history', label: 'History', icon: History },
    { to: '/compare', label: 'Compare Scans', icon: GitCompare }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">AccessLens</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                Auditor
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Limitations Disclaimer Notice */}
      <div className="bg-amber-50/90 border-t border-amber-200/60 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" aria-hidden="true" />
        <span>
          <strong>Notice:</strong> AccessLens performs automated axe-core scanning. Automated testing catches a subset of accessibility barriers and does not constitute official WCAG certification.
        </span>
      </div>
    </header>
  );
}
