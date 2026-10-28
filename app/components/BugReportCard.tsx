'use client';

import { BugReport } from '../types';
import { useState } from 'react';

interface BugReportCardProps {
  report: BugReport;
  isActive: boolean;
  isBookmarked: boolean;
  isLocked?: boolean;
  onToggleBookmark: () => void;
  onToggleLock?: () => void;
  onTagClick?: (tag: string) => void;
}

const severityColors = {
  critical: 'bg-black border-red-500',
  high: 'bg-black border-red-400',
  medium: 'bg-black border-yellow-500',
  low: 'bg-black border-green-400',
  informational: 'bg-black border-blue-400',
};

const severityBadgeColors = {
  critical: 'bg-red-500 text-white',
  high: 'bg-red-400 text-black',
  medium: 'bg-yellow-400 text-black',
  low: 'bg-green-400 text-black',
  informational: 'bg-blue-400 text-black',
};

const severityTextColors = {
  critical: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
  informational: 'text-blue-400',
};

export default function BugReportCard({
  report,
  isActive,
  isBookmarked,
  isLocked = false,
  onToggleBookmark,
  onToggleLock,
  onTagClick,
}: BugReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown text (code blocks, links, bold, inline code)
  const renderFormattedText = (text: string) => {
    if (!text) return null;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    const parts: Array<{ type: 'text' | 'code-block'; language?: string; content: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({
        type: 'code-block',
        language: match[1] || 'solidity',
        content: match[2].trim(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'code-block') {
        const isCopied = copiedIndex === pIdx;
        return (
          <div key={pIdx} className="my-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-zinc-900 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-zinc-800 flex justify-between items-center">
              <span>{part.language || 'code'}</span>
              <button
                onClick={() => copyCode(part.content, pIdx)}
                className="text-xs hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-300 font-sans"
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-zinc-200 leading-relaxed">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      // Format markdown links [text](url), bold **text**, and inline code `code`
      return renderInlineMarkdown(part.content, pIdx);
    });
  };

  const renderInlineMarkdown = (content: string, keyPrefix: number) => {
    // Split by lines to preserve paragraphs
    const lines = content.split('\n');

    return (
      <div key={keyPrefix} className="space-y-2">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-2" />;
          }

          // Check for bullet list item
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const displayLine = isBullet ? line.trim().slice(2) : line;

          return (
            <p key={lIdx} className={`${isBullet ? 'pl-4 border-l-2 border-zinc-700 my-1' : ''} leading-relaxed`}>
              {parseLineSpans(displayLine)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseLineSpans = (line: string) => {
    // Regex for markdown link [label](url), inline code `code`, bold **text**
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g;
    const tokens = line.split(tokenRegex);

    return tokens.map((token, i) => {
      // Markdown link [label](url)
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {linkMatch[1]}
          </a>
        );
      }

      // Inline code `code`
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code key={i} className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700">
            {token.slice(1, -1)}
          </code>
        );
      }

      // Bold **bold**
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <strong key={i} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      }

      return token;
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center p-3 md:p-6 select-text">
      <div
        className={`max-w-4xl w-full ${
          isExpanded ? 'h-[92vh]' : 'h-[86vh]'
        } ${severityColors[report.severity]} border-2 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-40 pointer-events-none'
        }`}
      >
        <div className="h-full overflow-y-auto p-5 md:p-8 text-white flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="mb-6 border-b border-zinc-800 pb-5">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`${severityBadgeColors[report.severity]} px-3 py-1 rounded text-xs font-bold uppercase tracking-wider`}
                  >
                    {report.severity}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                    {report.protocol}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onToggleLock && (
                    <button
                      onClick={onToggleLock}
                      className={`transition-colors px-3 py-1 rounded text-xs font-medium border flex items-center gap-1 ${
                        isLocked
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-800'
                      }`}
                      aria-label="Toggle card scroll lock"
                      title="Lock onto this card to read without jumping to next card (L)"
                    >
                      <span>{isLocked ? '🔒 Locked' : '🔓 Lock'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-zinc-300 hover:text-white transition-colors px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-xs font-medium"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                  <button
                    onClick={onToggleBookmark}
                    className={`transition-colors px-3 py-1 rounded text-xs font-medium border ${
                      isBookmarked
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-700 hover:bg-zinc-800'
                    }`}
                    aria-label="Toggle bookmark"
                  >
                    {isBookmarked ? '★ Saved' : '☆ Save'}
                  </button>
                </div>
              </div>

              <h1 className="text-xl md:text-2xl font-bold mb-3 leading-snug text-white tracking-tight">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-zinc-400 text-xs font-mono">
                {report.auditor && (
                  <span className="text-zinc-300">Auditor: <span className="text-white font-semibold">{report.auditor}</span></span>
                )}
                {report.date && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{report.date}</span>
                  </>
                )}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-sm text-zinc-300">
              {/* Description */}
              {report.description && (
                <div>
                  <h2 className={`text-xs font-bold mb-2 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                    Description
                  </h2>
                  <div className="text-zinc-300">
                    {renderFormattedText(report.description)}
                  </div>
                </div>
              )}

              {/* Impact */}
              {report.impact && (
                <div>
                  <h2 className={`text-xs font-bold mb-2 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                    Impact
                  </h2>
                  <div className="text-zinc-300">
                    {renderFormattedText(report.impact)}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {report.recommendation && (
                <div>
                  <h2 className={`text-xs font-bold mb-2 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                    Recommendation
                  </h2>
                  <div className="text-zinc-300">
                    {renderFormattedText(report.recommendation)}
                  </div>
                </div>
              )}

              {/* Tags */}
              {report.tags && report.tags.length > 0 && (
                <div>
                  <h2 className={`text-xs font-bold mb-2 uppercase tracking-wider ${severityTextColors[report.severity]}`}>
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {report.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => onTagClick?.(tag)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white px-2.5 py-1 rounded text-xs font-mono transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Link */}
          {report.url && (
            <div className="pt-6 mt-6 border-t border-zinc-800 flex justify-between items-center flex-wrap gap-3">
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-colors"
              >
                <span>View on Solodit</span>
                <span className="text-sm">↗</span>
              </a>
              <span className="text-xs text-zinc-500 font-mono">
                {isLocked ? '🔒 Card locked to read • Press L to unlock' : 'Press L to lock card • B to save • R for random • ↑/↓ to scroll'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
