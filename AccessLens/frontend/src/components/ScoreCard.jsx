import React from 'react';
import { ShieldAlert, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * ScoreCard component displaying a visual gauge for the Estimated Accessibility Score
 * and four severity metric cards for Critical, Serious, Moderate, and Minor issues.
 */
export default function ScoreCard({ score = 100, summary = {}, selectedImpact, onSelectImpact }) {
  const { critical = 0, serious = 0, moderate = 0, minor = 0, total = 0 } = summary;

  // Determine score color theme
  const getScoreTheme = (s) => {
    if (s >= 90) {
      return {
        text: 'text-emerald-600',
        stroke: '#059669',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Good Accessibility'
      };
    }
    if (s >= 70) {
      return {
        text: 'text-amber-600',
        stroke: '#d97706',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: 'Needs Improvement'
      };
    }
    return {
      text: 'text-rose-600',
      stroke: '#e11d48',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      label: 'Poor Accessibility'
    };
  };

  const theme = getScoreTheme(score);

  // SVG circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const severityItems = [
    {
      impact: 'critical',
      label: 'Critical',
      count: critical,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: ShieldAlert
    },
    {
      impact: 'serious',
      label: 'Serious',
      count: serious,
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: AlertCircle
    },
    {
      impact: 'moderate',
      label: 'Moderate',
      count: moderate,
      color: 'text-yellow-700',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertTriangle
    },
    {
      impact: 'minor',
      label: 'Minor',
      count: minor,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Score Gauge Card */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border ${theme.border} ${theme.bg} flex flex-col items-center justify-center text-center shadow-sm`}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-4">
            Estimated Accessibility Score
          </span>

          {/* Circular SVG Gauge */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
              {/* Background Circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated Progress Circle */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Score Text in Center */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${theme.text}`}>
                {score}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">out of 100</span>
            </div>
          </div>

          <div className="mt-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${theme.text} bg-white shadow-xs`}>
              {theme.label}
            </span>
            <p className="text-[11px] text-slate-500 mt-2 max-w-xs">
              Automated scoring metric based on WCAG 2 A/AA rule violations. Not an official certification.
            </p>
          </div>
        </div>

        {/* Four Severity Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-4">
          {severityItems.map(({ impact, label, count, color, bg, border, icon: Icon }) => {
            const isSelected = selectedImpact === impact;
            return (
              <button
                key={impact}
                type="button"
                onClick={() => onSelectImpact && onSelectImpact(isSelected ? 'all' : impact)}
                className={`p-5 rounded-2xl border text-left transition relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${bg} ${border} ${
                  isSelected ? 'ring-2 ring-indigo-600 shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                </div>
                <div className={`text-3xl sm:text-4xl font-extrabold mt-2 ${color}`}>
                  {count}
                </div>
                <span className="text-[11px] text-slate-600 mt-1 block">
                  {count === 1 ? '1 rule violated' : `${count} rules violated`}
                </span>
                {isSelected && (
                  <span className="absolute bottom-1 right-2 text-[10px] font-bold text-indigo-700 bg-white/80 px-1.5 py-0.5 rounded">
                    Active Filter
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
