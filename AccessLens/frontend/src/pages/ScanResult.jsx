import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScanById, getReportUrl } from '../services/api';
import ScoreCard from '../components/ScoreCard';
import Charts from '../components/Charts';
import IssueCard from '../components/IssueCard';
import {
  Download,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

// Fallback mock data in case backend is offline during frontend review
const MOCK_SCAN = {
  _id: 'mock-sample-scan-123',
  url: 'https://www.w3.org/WAI/demos/bad/before/home.html',
  score: 62,
  summary: {
    critical: 2,
    serious: 3,
    moderate: 0,
    minor: 0,
    total: 5
  },
  issues: [
    {
      ruleId: 'image-alt',
      impact: 'critical',
      description: 'Ensures <img> elements have alternate text or a role of none or presentation',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      recommendation: {
        explanation: 'Images must have an alt attribute describing their content or function. Decorative images should use an empty alt attribute (alt="").',
        incorrectCode: '<img src="chart.png">',
        correctedCode: '<img src="chart.png" alt="Quarterly revenue growth chart showing 15% increase">'
      },
      nodes: [
        {
          selector: 'img[src$="border_left_top.gif"]',
          html: '<img src="./img/border_left_top.gif" width="10px" height="10px">'
        },
        {
          selector: 'img[src="logo.png"]',
          html: '<img src="logo.png">'
        }
      ]
    },
    {
      ruleId: 'color-contrast',
      impact: 'serious',
      description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
      help: 'Elements must have sufficient color contrast',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
      recommendation: {
        explanation: 'Text must have a contrast ratio of at least 4.5:1 against its background (3:1 for large text >= 18pt or bold >= 14pt) to ensure readability.',
        incorrectCode: '/* Failing contrast ratio (2.1:1) */\ncolor: #94a3b8; background-color: #ffffff;',
        correctedCode: '/* Accessible contrast ratio (7.2:1) */\ncolor: #1e293b; background-color: #ffffff;'
      },
      nodes: [
        {
          selector: 'tr > td font > b',
          html: '<b>Free Penguins</b>'
        }
      ]
    },
    {
      ruleId: 'link-name',
      impact: 'serious',
      description: 'Ensures links have discernible text',
      help: 'Links must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
      recommendation: {
        explanation: 'Hyperlinks must have discernible text indicating their destination. Avoid generic text like "click here" or empty anchor tags.',
        incorrectCode: '<a href="/docs">Click here</a>',
        correctedCode: '<a href="/docs">Read the AccessLens Documentation</a>'
      },
      nodes: [
        {
          selector: '#home > a',
          html: '<a href="javascript:location.href=\'home.html\';"><img name="nav" src="home.png"></a>'
        }
      ]
    },
    {
      ruleId: 'html-has-lang',
      impact: 'serious',
      description: 'Ensures every HTML document has a lang attribute',
      help: '<html> element must have a lang attribute',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/html-has-lang',
      recommendation: {
        explanation: 'The <html> root element must have a valid lang attribute so screen readers apply correct voice synthesis, pronunciation, and translation.',
        incorrectCode: '<html>',
        correctedCode: '<html lang="en">'
      },
      nodes: [
        {
          selector: 'html',
          html: '<html>'
        }
      ]
    },
    {
      ruleId: 'label',
      impact: 'critical',
      description: 'Ensures every form element has a label',
      help: 'Form elements must have labels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      recommendation: {
        explanation: 'Form elements must have an associated <label> element (via for/id) or aria-label so screen reader users understand what input is expected.',
        incorrectCode: '<input type="text" placeholder="Enter your email">',
        correctedCode: '<label for="email">Email Address</label>\n<input id="email" type="text" placeholder="name@example.com">'
      },
      nodes: [
        {
          selector: 'select',
          html: '<select onchange="location.href = this.value;"><option>Pick one</option></select>'
        }
      ]
    }
  ],
  createdAt: new Date().toISOString()
};

export default function ScanResult() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Filter States
  const [selectedImpact, setSelectedImpact] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchScan() {
      try {
        setLoading(true);
        setError(null);
        const res = await getScanById(id);
        if (res.success && res.data) {
          setScan(res.data);
          setIsUsingMock(false);
        } else {
          throw new Error(res.error || 'Scan not found.');
        }
      } catch (err) {
        console.warn('API error, falling back to mock scan for preview:', err.message);
        // Fall back to sample mock data so user can review complete UI even if backend is offline
        setScan(MOCK_SCAN);
        setIsUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, [id]);

  // Filter issues based on selected impact & search text
  const filteredIssues = useMemo(() => {
    if (!scan?.issues) return [];
    return scan.issues.filter((issue) => {
      // 1. Severity filter
      if (selectedImpact !== 'all' && issue.impact !== selectedImpact) {
        return false;
      }
      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesRule = issue.ruleId.toLowerCase().includes(query);
        const matchesDesc = (issue.description || '').toLowerCase().includes(query);
        const matchesHelp = (issue.help || '').toLowerCase().includes(query);
        return matchesRule || matchesDesc || matchesHelp;
      }
      return true;
    });
  }, [scan, selectedImpact, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium">Loading audit results...</p>
      </div>
    );
  }

  if (error && !scan) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 space-y-3">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold">Unable to load scan</h2>
          <p className="text-sm">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Scanner</span>
          </Link>
        </div>
      </div>
    );
  }

  const impacts = [
    { key: 'all', label: 'All Issues', count: scan.issues?.length || 0 },
    { key: 'critical', label: 'Critical', count: scan.summary?.critical || 0 },
    { key: 'serious', label: 'Serious', count: scan.summary?.serious || 0 },
    { key: 'moderate', label: 'Moderate', count: scan.summary?.moderate || 0 },
    { key: 'minor', label: 'Minor', count: scan.summary?.minor || 0 }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Mock Data Notice Banner if offline */}
      {isUsingMock && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            <strong>Demo Mode:</strong> Displaying representative mock audit data (Backend scan ID: {id} was not reachable).
          </span>
          <span className="font-semibold text-amber-900">Sample Demo View</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-indigo-600 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Scanner
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 break-all">
            Accessibility Audit: <span className="text-indigo-600">{scan.url}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited on {new Date(scan.createdAt).toLocaleString()} · Scan ID: {scan._id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={scan.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Visit Site</span>
          </a>
          <a
            href={isUsingMock ? '#' : getReportUrl(scan._id)}
            onClick={(e) => {
              if (isUsingMock) {
                e.preventDefault();
                alert('Demo Mode Notice: Please ensure the AccessLens backend is running to stream the live PDFKit-generated report!');
              }
            }}
            target={isUsingMock ? undefined : '_blank'}
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md shadow-indigo-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* 1. Score Gauge & Four Severity Cards */}
      <ScoreCard
        score={scan.score}
        summary={scan.summary}
        selectedImpact={selectedImpact}
        onSelectImpact={setSelectedImpact}
      />

      {/* 2. Recharts Charts (Severity Distribution & Top Issues) */}
      <Charts summary={scan.summary} issues={scan.issues} />

      {/* 3. Filterable Issues Section */}
      <section className="space-y-6 pt-4" aria-label="Detected Accessibility Issues">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Audited Issues</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                Showing {filteredIssues.length} of {scan.issues?.length || 0}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review specific WCAG failures, inspect DOM snippets, and apply rule-based fixes.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by rule or text..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          {impacts.map(({ key, label, count }) => {
            const active = selectedImpact === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedImpact(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                aria-pressed={active}
              >
                <span>{label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Issue Cards List */}
        {filteredIssues.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No issues match the current filter</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? `No violations matched "${searchQuery}".` : 'No violations in this severity category.'}
            </p>
            <button
              type="button"
              onClick={() => { setSelectedImpact('all'); setSearchQuery(''); }}
              className="mt-2 px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue, idx) => (
              <IssueCard key={issue._id || `${issue.ruleId}-${idx}`} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
