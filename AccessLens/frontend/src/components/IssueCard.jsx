import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';

const IMPACT_CONFIG = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-800',
    icon: ShieldAlert
  },
  serious: {
    label: 'Serious',
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    icon: AlertCircle
  },
  moderate: {
    label: 'Moderate',
    bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle
  },
  minor: {
    label: 'Minor',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    icon: Info
  }
};

/**
 * Single DOM Node Inspector showing CSS Selector with Copy button and HTML snippet.
 */
function NodeSnippet({ node, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.selector);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy selector:', err);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2 font-mono text-xs border border-slate-800">
      {/* Selector Header + Copy Button */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <span className="text-indigo-300 font-semibold truncate flex items-center gap-1.5">
          <span className="text-slate-500 font-normal">#{index + 1}</span>
          <span className="truncate">{node.selector}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer flex-shrink-0"
          aria-label={`Copy selector ${node.selector}`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Trimmed HTML Snippet */}
      <div className="text-slate-300 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
        {node.html}
      </div>
    </div>
  );
}

/**
 * IssueCard component displaying impact, description, failing nodes, and rule-based before/after fixes.
 */
export default function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(true);
  const impactConfig = IMPACT_CONFIG[issue.impact] || IMPACT_CONFIG.minor;
  const ImpactIcon = impactConfig.icon;

  const rec = issue.recommendation || {};
  const explanation = typeof rec === 'object' ? rec.explanation : rec;
  const incorrectCode = typeof rec === 'object' ? rec.incorrectCode : null;
  const correctedCode = typeof rec === 'object' ? rec.correctedCode : null;

  const nodes = issue.nodes || [];

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition hover:border-slate-300">
      {/* Card Header */}
      <div className="p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${impactConfig.badge}`}>
              <ImpactIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{issue.impact}</span>
            </span>
            <span className="font-mono text-sm font-bold text-slate-900">{issue.ruleId}</span>
          </div>

          {issue.helpUrl && (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition focus:outline-none focus:underline"
            >
              <span>WCAG Guideline</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        {/* Rule Description & Help */}
        <div>
          <h4 className="text-base font-semibold text-slate-900">
            {issue.help || issue.description}
          </h4>
          {issue.help && issue.description && issue.help !== issue.description && (
            <p className="text-xs text-slate-500 mt-1">{issue.description}</p>
          )}
        </div>

        {/* Rule-Based Fix Suggestion (Before / After Code) */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
          <div>
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">
              Recommended Remediation
            </span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{explanation}</p>
          </div>

          {(incorrectCode || correctedCode) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-indigo-100/80">
              {/* Before / Incorrect Code */}
              {incorrectCode && (
                <div className="bg-red-50/90 border border-red-200 rounded-lg p-3 text-xs font-mono space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                    Before (Incorrect)
                  </span>
                  <pre className="text-red-950 whitespace-pre-wrap break-all text-[11px] font-mono">
                    {incorrectCode}
                  </pre>
                </div>
              )}

              {/* After / Corrected Code */}
              {correctedCode && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-3 text-xs font-mono space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    After (Corrected)
                  </span>
                  <pre className="text-emerald-950 whitespace-pre-wrap break-all text-[11px] font-mono">
                    {correctedCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Failing DOM Nodes Section (Collapsible) */}
      {nodes.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-slate-500" />
              <span>Failing Elements ({nodes.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1"
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Collapse' : 'Expand'}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {expanded && (
            <div className="space-y-2.5">
              {nodes.map((node, nodeIdx) => (
                <NodeSnippet key={nodeIdx} node={node} index={nodeIdx} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
