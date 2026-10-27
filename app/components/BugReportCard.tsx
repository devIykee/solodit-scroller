'use client';

import { BugReport } from '../types';
import { useState } from 'react';

interface BugReportCardProps {
  report: BugReport;
  isActive: boolean;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

const severityColors = {
  critical: 'bg-black border-red-500',
  high: 'bg-black border-red-400',
  medium: 'bg-black border-gray-400',
  low: 'bg-black border-green-400',
  informational: 'bg-black border-blue-400',
};

const severityBadgeColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-red-400 text-black',
  medium: 'bg-gray-400 text-black',
  low: 'bg-green-400 text-black',
  informational: 'bg-blue-400 text-black',
};

const severityTextColors = {
  critical: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-gray-400',
  low: 'text-green-400',
  informational: 'text-blue-400',
};

export default function BugReportCard({ report, isActive, isBookmarked, onToggleBookmark }: BugReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract code blocks from text
  const renderContent = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;

    let lastIndex = 0;
    const parts = [];
    let match;

    // Find code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index);
        parts.push({ type: 'text', content: textBefore });
      }

      // Add code block
      parts.push({
        type: 'code-block',
        language: match[1] || 'solidity',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, index) => {
      if (part.type === 'code-block') {
        return (
          <div key={index} className="my-4 bg-white rounded-lg overflow-hidden">
            <div className="bg-gray-200 px-4 py-2 text-xs text-gray-700 font-mono border-b border-gray-300">
              {part.language}
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm font-mono text-black">{part.content}</code>
            </pre>
          </div>
        );
      } else {
        // Handle inline code
        const textParts = part.content.split(inlineCodeRegex);
        return (
          <span key={index}>
            {textParts.map((text, i) =>
              i % 2 === 1 ? (
                <code key={i} className="bg-white text-black px-2 py-1 rounded text-sm font-mono">
                  {text}
                </code>
              ) : (
                text
              )
            )}
          </span>
        );
      }
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 md:p-8">
      <div
        className={`max-w-3xl w-full ${
          isExpanded ? 'h-[90vh]' : 'h-[85vh]'
        } ${severityColors[report.severity]} border-4 rounded-lg shadow-2xl overflow-hidden transition-all duration-500 ${
          isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-50'
        }`}
      >
        <div className="h-full overflow-y-auto p-6 md:p-8 text-white">
          {/* Header */}
          <div className="mb-6 border-b border-gray-700 pb-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className={`${severityBadgeColors[report.severity]} px-4 py-2 rounded text-xs font-bold uppercase tracking-wider`}
              >
                {report.severity}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white hover:text-gray-300 transition-colors px-3 py-1 border border-white rounded text-sm"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
                <button
                  onClick={onToggleBookmark}
                  className="text-white hover:text-gray-300 transition-colors text-2xl"
                  aria-label="Toggle bookmark"
                >
                  {isBookmarked ? '★' : '☆'}
                </button>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight text-white">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm font-mono">
              <span className="font-semibold text-white">{report.protocol}</span>
              {report.auditor && (
                <>
                  <span className="text-gray-600">|</span>
                  <span>{report.auditor}</span>
                </>
              )}
              {report.date && (
                <>
                  <span className="text-gray-600">|</span>
                  <span>{report.date}</span>
                </>
              )}
            </div>
          </div>

          {/* Full Report Content */}
          <div className="space-y-6">
            {/* Description */}
            {report.description && (
              <div>
                <h2 className={`text-lg font-bold mb-3 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                  Description
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {renderContent(report.description)}
                </div>
              </div>
            )}

            {/* Impact */}
            {report.impact && (
              <div>
                <h2 className={`text-lg font-bold mb-3 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                  Impact
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {renderContent(report.impact)}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {report.recommendation && (
              <div>
                <h2 className={`text-lg font-bold mb-3 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                  Recommendation
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {renderContent(report.recommendation)}
                </div>
              </div>
            )}

            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <div>
                <h2 className={`text-lg font-bold mb-3 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {report.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white text-black px-3 py-1 rounded text-xs font-mono uppercase tracking-wider hover:bg-gray-200 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Link */}
            {report.url && (
              <div className="pt-4">
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block border-2 border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded font-bold transition-colors uppercase tracking-wider text-sm"
                >
                  View Full Report →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
