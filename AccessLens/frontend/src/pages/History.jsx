import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getScans, deleteScan } from '../services/api';
import {
  History as HistoryIcon,
  Trash2,
  ExternalLink,
  ArrowRight,
  Loader2,
  GitCompare,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';

const MOCK_HISTORY = [
  {
    _id: 'mock-scan-1',
    url: 'https://www.w3.org/WAI/demos/bad/before/home.html',
    score: 62,
    summary: { critical: 2, serious: 3, moderate: 0, minor: 0, total: 5 },
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'mock-scan-2',
    url: 'https://example.com/',
    score: 100,
    summary: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export default function History() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getScans();
      if (res.success && Array.isArray(res.data)) {
        setScans(res.data);
        setIsUsingMock(false);
      } else {
        throw new Error(res.error || 'Failed to fetch history');
      }
    } catch (err) {
      console.warn('Backend unavailable, displaying mock history for preview:', err.message);
      setScans(MOCK_HISTORY);
      setIsUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this scan record?')) return;

    try {
      if (!isUsingMock) {
        await deleteScan(id);
      }
      setScans((prev) => prev.filter((s) => s._id !== id));
      setSelectedForCompare((prev) => prev.filter((sId) => sId !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete scan.');
    }
  };

  const toggleSelectForCompare = (id) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        // Keep the second one and add the new one
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Mock Data Banner if offline */}
      {isUsingMock && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            <strong>Demo Mode:</strong> Displaying mock scan history (backend offline or in-memory reset).
          </span>
          <span className="font-semibold text-amber-900">Sample History</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <HistoryIcon className="w-7 h-7 text-indigo-600" />
            <span>Audit History</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review past accessibility scans or select two to compare before/after improvements.
          </p>
        </div>

        {/* Compare Action Button */}
        <div className="flex items-center gap-3">
          {selectedForCompare.length === 2 ? (
            <Link
              to={`/compare?a=${selectedForCompare[0]}&b=${selectedForCompare[1]}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md shadow-indigo-100 transition"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Selected (2)</span>
            </Link>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
              {selectedForCompare.length === 1
                ? 'Select 1 more scan to compare'
                : 'Select 2 scans to compare'}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading history...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      ) : scans.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-800">No scans recorded yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Audit your first website to generate an estimated accessibility score and track historical changes.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition"
          >
            <span>Run New Audit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="p-4 w-12 text-center">Compare</th>
                  <th scope="col" className="py-4 px-6">Scanned URL</th>
                  <th scope="col" className="py-4 px-6 text-center">Score</th>
                  <th scope="col" className="py-4 px-6 text-center">Issues</th>
                  <th scope="col" className="py-4 px-6">Date</th>
                  <th scope="col" className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan) => {
                  const isSelected = selectedForCompare.includes(scan._id);
                  const scoreColor =
                    scan.score >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                    scan.score >= 70 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                    'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <tr
                      key={scan._id}
                      className={`transition ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForCompare(scan._id)}
                          aria-label={`Select ${scan.url} for comparison`}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900 max-w-xs truncate">
                        <Link
                          to={`/scan/${scan._id}`}
                          className="hover:text-indigo-600 transition flex items-center gap-1.5"
                        >
                          <span className="truncate">{scan.url}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${scoreColor}`}>
                          {scan.score}/100
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-medium">
                        {scan.summary?.total !== undefined ? scan.summary.total : (scan.issues?.length || 0)}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/scan/${scan._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(scan._id, e)}
                          aria-label={`Delete scan of ${scan.url}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
