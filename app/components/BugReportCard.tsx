'use client';

import { BugReport } from '../types';

interface BugReportCardProps {
  report: BugReport;
  isActive: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const severityColors = {
  critical: 'from-red-600 to-red-900',
  high: 'from-red-500 to-red-700',
  medium: 'from-blue-500 to-blue-700',
  low: 'from-green-500 to-green-700',
  informational: 'from-green-400 to-green-600',
};

const severityBadgeColors = {
  critical: 'bg-red-600',
  high: 'bg-red-500',
  medium: 'bg-blue-500',
  low: 'bg-green-500',
  informational: 'bg-green-400',
};

export default function BugReportCard({ report, isActive, isBookmarked, onToggleBookmark }: BugReportCardProps) {
  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 md:p-8">
      <div
        className={`max-w-2xl w-full h-[85vh] bg-gradient-to-br ${
          severityColors[report.severity]
        } rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'
        }`}
      >
        <div className="h-full overflow-y-auto p-6 md:p-8 text-white">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`${
                  severityBadgeColors[report.severity]
                } px-4 py-2 rounded-full text-sm font-bold uppercase`}
              >
                {report.severity}
              </span>
              <button
                onClick={onToggleBookmark}
                className="text-3xl hover:scale-110 transition-transform"
                aria-label="Toggle bookmark"
              >
                {isBookmarked ? '★' : '☆'}
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-white/80 text-sm">
              <span className="font-semibold">{report.protocol}</span>
              {report.auditor && (
                <>
                  <span>•</span>
                  <span>{report.auditor}</span>
                </>
              )}
              {report.date && (
                <>
                  <span>•</span>
                  <span>{report.date}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-white/90 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Impact */}
          {report.impact && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Impact</h2>
              <p className="text-white/90 leading-relaxed">{report.impact}</p>
            </div>
          )}

          {/* Recommendation */}
          {report.recommendation && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Recommendation</h2>
              <p className="text-white/90 leading-relaxed">{report.recommendation}</p>
            </div>
          )}

          {/* Tags */}
          {report.tags && report.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {report.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/20 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Link */}
          {report.url && (
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Full Report →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
