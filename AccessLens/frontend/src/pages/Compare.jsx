import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { compareScans, getScans } from '../services/api';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Code,
  ShieldCheck
} from 'lucide-react';

const MOCK_COMPARISON = {
  scanA: {
    _id: 'mock-a',
    url: 'https://example.com/v1',
    score: 65,
    summary: { critical: 2, serious: 2, moderate: 1, minor: 0, total: 5 },
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  scanB: {
    _id: 'mock-b',
    url: 'https://example.com/v2',
    score: 86,
    summary: { critical: 0, serious: 1, moderate: 1, minor: 1, total: 3 },
    createdAt: new Date().toISOString()
  },
  scoreDelta: 21,
  fixed: [
    {
      ruleId: 'image-alt',
      impact: 'critical',
      selector: 'img.hero-banner',
      description: 'Images must have alternate text'
    },
    {
      ruleId: 'label',
      impact: 'critical',
      selector: 'input#search-box',
      description: 'Form elements must have labels'
    }
  ],
  new: [
    {
      ruleId: 'link-name',
      impact: 'minor',
      selector: 'footer a.social-link',
      description: 'Links must have discernible text'
    }
  ],
  stillPresent: [
    {
      ruleId: 'color-contrast',
      impact: 'serious',
      selector: 'p.caption',
      description: 'Elements must have sufficient color contrast'
    }
  ]
};

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scanAId = searchParams.get('a') || '';
  const scanBId = searchParams.get('b') || '';

  const [availableScans, setAvailableScans] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Load available scans for the dropdown selection
  useEffect(() => {
    async function loadScans() {
      try {
        const res = await getScans();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableScans(res.data);
          // If no query params and at least 2 scans exist, default to them
          if (!scanAId && !scanBId && res.data.length >= 2) {
            setSearchParams({ a: res.data[1]._id, b: res.data[0]._id });
          }
        }
      } catch (err) {
        console.warn('Could not load history for compare selector:', err.message);
      }
    }
    loadScans();
  }, []);

  // Fetch comparison when a & b change
  useEffect(() => {
    if (!scanAId || !scanBId) {
      setComparison(null);
      return;
    }

    async function runComparison() {
      try {
        setLoading(true);
        setError(null);
        const res = await compareScans(scanAId, scanBId);
        if (res.success && res.data) {
          setComparison(res.data);
          setIsUsingMock(false);
        } else {
          throw new Error(res.error || 'Failed to compare scans');
        }
      } catch (err) {
        console.warn('Comparison API failed, loading representative mock:', err.message);
        setComparison(MOCK_COMPARISON);
        setIsUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    runComparison();
  }, [scanAId, scanBId]);

  const handleSelectA = (id) => {
    setSearchParams({ a: id, b: scanBId });
  };

  const handleSelectB = (id) => {
    setSearchParams({ a: scanAId, b: id });
  };

  const delta = comparison ? comparison.scoreDelta : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Page Title & Navigation */}
      <div className="border-b border-slate-200 pb-6">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-indigo-600" />
          <span>Before & After Audit Comparison</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Compare two scans of a website to track accessibility progression, resolved violations, and newly introduced regressions.
        </p>
      </div>

      {/* Mock Data Banner if offline */}
      {isUsingMock && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            <strong>Demo Mode:</strong> Showing sample comparison data (one or both selected scan IDs were not found).
          </span>
          <span className="font-semibold text-amber-900">Sample Comparison</span>
        </div>
      )}

      {/* Scan Selectors Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label htmlFor="scan-a-select" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Baseline Scan A (Before / Earlier)
          </label>
          <select
            id="scan-a-select"
            value={scanAId}
            onChange={(e) => handleSelectA(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
          >
            <option value="">-- Select Baseline Scan A --</option>
            {availableScans.map((s) => (
              <option key={s._id} value={s._id}>
                {s.url} (Score: {s.score}/100 · {new Date(s.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scan-b-select" className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Target Scan B (After / Later)
          </label>
          <select
            id="scan-b-select"
            value={scanBId}
            onChange={(e) => handleSelectB(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
          >
            <option value="">-- Select Target Scan B --</option>
            {availableScans.map((s) => (
              <option key={s._id} value={s._id}>
                {s.url} (Score: {s.score}/100 · {new Date(s.createdAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Calculating accessibility progression delta...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : !comparison ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <GitCompare className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Select two scans to begin comparison</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Choose a baseline scan and a target scan from the dropdowns above or select any two scans from the History page.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
          >
            <span>View Scan History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Score Progression & Up/Down Delta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Scan A Score */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">
                Baseline (Scan A)
              </span>
              <div className="text-5xl font-black text-slate-700 my-2">
                {comparison.scanA?.score}
              </div>
              <span className="text-xs text-slate-500 truncate max-w-full">
                {comparison.scanA?.url}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {new Date(comparison.scanA?.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Score Delta Indicator Card */}
            <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center text-center ${
              delta > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : delta < 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-2">
                Score Delta
              </span>
              <div className="flex items-center gap-2">
                {delta > 0 ? (
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                ) : delta < 0 ? (
                  <TrendingDown className="w-8 h-8 text-rose-600" />
                ) : (
                  <Minus className="w-8 h-8 text-slate-500" />
                )}
                <span className="text-5xl font-black">
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              </div>
              <span className="text-xs font-bold mt-2">
                {delta > 0
                  ? 'Improvement Detected'
                  : delta < 0
                  ? 'Regression Detected'
                  : 'Score Unchanged'}
              </span>
            </div>

            {/* Scan B Score */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase text-indigo-600 tracking-wider mb-1">
                Target (Scan B)
              </span>
              <div className="text-5xl font-black text-indigo-600 my-2">
                {comparison.scanB?.score}
              </div>
              <span className="text-xs text-slate-500 truncate max-w-full">
                {comparison.scanB?.url}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                {new Date(comparison.scanB?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 2. Three Groups Summary Tabs */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>All Changes</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-200">
                  {(comparison.fixed?.length || 0) + (comparison.new?.length || 0) + (comparison.stillPresent?.length || 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fixed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'fixed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Fixed Issues</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-700 text-emerald-100">
                  {comparison.fixed?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'new'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>New Issues</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-700 text-rose-100">
                  {comparison.new?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stillPresent')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'stillPresent'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Still Present</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-700 text-amber-100">
                  {comparison.stillPresent?.length || 0}
                </span>
              </button>
            </div>

            {/* 3. Three Groups Cards */}
            <div className="space-y-6">
              {/* Group 1: FIXED ISSUES */}
              {(activeTab === 'all' || activeTab === 'fixed') && (
                <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-sm">
                  <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Fixed Issues ({comparison.fixed?.length || 0})</span>
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">Resolved in Target Scan B</span>
                  </div>

                  <div className="p-6">
                    {comparison.fixed?.length === 0 ? (
                      <p className="text-xs text-slate-400">No issues were fixed between these two scans.</p>
                    ) : (
                      <div className="space-y-3">
                        {comparison.fixed.map((item, idx) => (
                          <div key={idx} className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-emerald-900">{item.ruleId}</span>
                              <span className="text-[10px] uppercase font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded-md">
                                {item.impact}
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 font-mono text-[11px] truncate">
                              Selector: <span className="text-slate-900">{item.selector}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 font-sans">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Group 2: NEW ISSUES */}
              {(activeTab === 'all' || activeTab === 'new') && (
                <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-sm">
                  <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>New Issues ({comparison.new?.length || 0})</span>
                    </div>
                    <span className="text-xs text-rose-700 font-medium">Regressions introduced in Scan B</span>
                  </div>

                  <div className="p-6">
                    {comparison.new?.length === 0 ? (
                      <p className="text-xs text-slate-400">No new regressions were introduced.</p>
                    ) : (
                      <div className="space-y-3">
                        {comparison.new.map((item, idx) => (
                          <div key={idx} className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-rose-900">{item.ruleId}</span>
                              <span className="text-[10px] uppercase font-bold text-rose-700 px-2 py-0.5 bg-rose-100 rounded-md">
                                {item.impact}
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 font-mono text-[11px] truncate">
                              Selector: <span className="text-slate-900">{item.selector}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 font-sans">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Group 3: STILL PRESENT ISSUES */}
              {(activeTab === 'all' || activeTab === 'stillPresent') && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <HelpCircle className="w-4 h-4 text-slate-600" />
                      <span>Still Present Issues ({comparison.stillPresent?.length || 0})</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Unresolved across both scans</span>
                  </div>

                  <div className="p-6">
                    {comparison.stillPresent?.length === 0 ? (
                      <p className="text-xs text-slate-400">No persistent violations found.</p>
                    ) : (
                      <div className="space-y-3">
                        {comparison.stillPresent.map((item, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-800">{item.ruleId}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-600 px-2 py-0.5 bg-slate-200 rounded-md">
                                {item.impact}
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 font-mono text-[11px] truncate">
                              Selector: <span className="text-slate-900">{item.selector}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-500 font-sans">{item.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
