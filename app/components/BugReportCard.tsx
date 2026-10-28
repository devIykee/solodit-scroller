'use client';

import { BugReport } from '../types';
import { useState } from 'react';
import {
  LockIcon,
  UnlockIcon,
  BookmarkIcon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  ExpandIcon,
  CollapseIcon,
} from './Icons';

interface BugReportCardProps {
  report: BugReport;
  isActive: boolean;
  isBookmarked: boolean;
  isLocked?: boolean;
  onToggleBookmark: () => void;
  onToggleLock?: () => void;
  onTagClick?: (tag: string) => void;
}

const severityBadgeStyles = {
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  informational: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

const severityCardBorders = {
  critical: 'hover:border-rose-500/40 border-zinc-800',
  high: 'hover:border-orange-500/40 border-zinc-800',
  medium: 'hover:border-yellow-500/40 border-zinc-800',
  low: 'hover:border-emerald-500/40 border-zinc-800',
  informational: 'hover:border-blue-500/40 border-zinc-800',
};

const severityHeadingColors = {
  critical: 'text-rose-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-emerald-400',
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
          <div key={pIdx} className="my-4 bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="bg-zinc-950/80 px-4 py-2 text-xs text-zinc-400 font-mono border-b border-zinc-800/80 flex justify-between items-center">
              <span className="font-semibold text-zinc-300">{part.language || 'code'}</span>
              <button
                onClick={() => copyCode(part.content, pIdx)}
                className="text-xs hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded text-zinc-300 font-mono flex items-center gap-1.5"
                title="Copy code snippet"
              >
                {isCopied ? (
                  <>
                    <CheckIcon size={12} className="text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-zinc-200 leading-relaxed scrollbar-thin">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      }

      return renderInlineMarkdown(part.content, pIdx);
    });
  };

  const renderInlineMarkdown = (content: string, keyPrefix: number) => {
    const lines = content.split('\n');

    return (
      <div key={keyPrefix} className="space-y-2">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-2" />;
          }

          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
          const displayLine = isBullet ? line.trim().slice(2) : line;

          return (
            <p key={lIdx} className={`${isBullet ? 'pl-4 border-l-2 border-zinc-800 my-1' : ''} leading-relaxed`}>
              {parseLineSpans(displayLine)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseLineSpans = (line: string) => {
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g;
    const tokens = line.split(tokenRegex);

    return tokens.map((token, i) => {
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

      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return (
          <code key={i} className="bg-zinc-800/80 text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono border border-zinc-700/60">
            {token.slice(1, -1)}
          </code>
        );
      }

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
    <div className="h-screen w-screen flex items-center justify-center p-3 sm:p-5 md:p-8 select-text">
      <div
        className={`max-w-4xl w-full ${
          isExpanded ? 'h-[92vh]' : 'h-[86vh]'
        } bg-zinc-950/95 border ${severityCardBorders[report.severity]} rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-35 pointer-events-none'
        }`}
      >
        <div className="h-full overflow-y-auto p-6 md:p-8 text-white flex flex-col justify-between scrollbar-thin">
          <div>
            {/* Header */}
            <div className="mb-6 border-b border-zinc-800/80 pb-6">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`${severityBadgeStyles[report.severity]} border px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider`}
                  >
                    {report.severity}
                  </span>
                  <span className="text-zinc-400 text-xs font-mono bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
                    {report.protocol}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {onToggleLock && (
                    <button
                      onClick={onToggleLock}
                      className={`transition-colors px-2.5 py-1 rounded-md text-xs font-mono border flex items-center gap-1.5 ${
                        isLocked
                          ? 'bg-sky-500/15 text-sky-400 border-sky-500/40'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
                      }`}
                      aria-label="Toggle card scroll lock"
                      title="Lock card to scroll text without jumping to next card (L)"
                    >
                      {isLocked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
                      <span>{isLocked ? 'Locked' : 'Lock'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-zinc-400 hover:text-white transition-colors px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-mono flex items-center gap-1"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    title={isExpanded ? 'Collapse card' : 'Expand card'}
                  >
                    {isExpanded ? <CollapseIcon size={12} /> : <ExpandIcon size={12} />}
                    <span className="hidden sm:inline">{isExpanded ? 'Collapse' : 'Expand'}</span>
                  </button>

                  <button
                    onClick={onToggleBookmark}
                    className={`transition-colors px-2.5 py-1 rounded-md text-xs font-mono border flex items-center gap-1.5 ${
                      isBookmarked
                        ? 'bg-zinc-800 text-white border-zinc-700'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
                    }`}
                    aria-label="Toggle bookmark"
                    title="Bookmark report (B)"
                  >
                    <BookmarkIcon size={12} filled={isBookmarked} />
                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              <h1 className="text-xl md:text-2xl font-bold mb-3 leading-snug text-zinc-100 tracking-tight font-sans">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-zinc-400 text-xs font-mono">
                {report.auditor && (
                  <span className="text-zinc-400">
                    Auditor: <span className="text-zinc-200 font-medium">{report.auditor}</span>
                  </span>
                )}
                {report.date && (
                  <>
                    <span className="text-zinc-600">/</span>
                    <span>{report.date}</span>
                  </>
                )}
                {isLocked && (
                  <>
                    <span className="text-zinc-600">/</span>
                    <span className="text-sky-400 font-semibold">[Scroll Locked]</span>
                  </>
                )}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-sm text-zinc-300">
              {/* Description */}
              {report.description && (
                <div>
                  <h2 className={`text-[11px] font-mono font-bold mb-2 uppercase tracking-widest ${severityHeadingColors[report.severity]}`}>
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
                  <h2 className={`text-[11px] font-mono font-bold mb-2 uppercase tracking-widest ${severityHeadingColors[report.severity]}`}>
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
                  <h2 className={`text-[11px] font-mono font-bold mb-2 uppercase tracking-widest ${severityHeadingColors[report.severity]}`}>
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
                  <h2 className={`text-[11px] font-mono font-bold mb-2 uppercase tracking-widest ${severityHeadingColors[report.severity]}`}>
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {report.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => onTagClick?.(tag)}
                        className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 px-2.5 py-1 rounded-md text-xs font-mono transition-colors"
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
            <div className="pt-6 mt-8 border-t border-zinc-800/80 flex justify-between items-center flex-wrap gap-3">
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-950 hover:bg-white px-3.5 py-1.5 rounded-lg font-mono font-semibold text-xs transition-colors"
              >
                <span>View on Solodit</span>
                <ExternalLinkIcon size={12} />
              </a>

              <div className="text-xs text-zinc-500 font-mono">
                {isLocked
                  ? 'Card locked to scroll text (L to unlock)'
                  : 'L to lock | B to save | R for random | Up/Down to navigate'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
