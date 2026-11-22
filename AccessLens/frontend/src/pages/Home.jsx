import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { runScan } from '../services/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please enter a website URL.');
      return;
    }

    // Auto prepend https:// if protocol is omitted
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      setLoading(true);
      const res = await runScan(finalUrl);
      if (res.success && res.data?._id) {
        navigate(`/scan/${res.data._id}`);
      } else {
        setError(res.error || 'Failed to complete accessibility scan.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'An error occurred while auditing the URL.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const sampleUrls = [
    'https://example.com',
    'https://wikipedia.org'
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold tracking-wide border border-indigo-100">
          <ShieldCheck className="w-4 h-4" />
          <span>Automated axe-core Accessibility Engine</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Audit Any Website for <span className="text-indigo-600">Accessibility</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Scan public websites against WCAG standards in seconds. Get an estimated accessibility score, impact-sorted issues, rule-based fixes, and downloadable PDF reports.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="mt-10 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100">
        <form onSubmit={handleScan} className="space-y-4" noValidate>
          <div>
            <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 mb-2">
              Website URL to audit
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://example.com"
                disabled={loading}
                aria-describedby={error ? "url-error" : undefined}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-base transition disabled:opacity-50"
                required
              />
            </div>
          </div>

          {error && (
            <div id="url-error" role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-bold text-red-900">Audit Request Failed</p>
                <p className="text-red-700">{error}</p>
                <p className="text-xs text-red-600 pt-1 border-t border-red-200/60">
                  Tip: Ensure the target is a publicly accessible website starting with <code>http://</code> or <code>https://</code>. Localhost, private IPs, and non-existent domains are blocked.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Auditing with Playwright & axe-core...</span>
              </>
            ) : (
              <>
                <span>Run Audit</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Try a sample URL:</span>
          {sampleUrls.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setUrl(sample)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <section className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6" aria-label="AccessLens Features">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 mb-1">Impact-Grouped Issues</h2>
          <p className="text-sm text-slate-600">Violations organized by Critical, Serious, Moderate, and Minor severity.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 mb-1">Rule-Based Fixes</h2>
          <p className="text-sm text-slate-600">Actionable remediation advice and trimmed DOM code snippets for every failing node.</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <ArrowRight className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 mb-1">Before & After Compare</h2>
          <p className="text-sm text-slate-600">Compare two audits side-by-side to track fixed, new, and persistent issues.</p>
        </div>
      </section>
    </main>
  );
}
