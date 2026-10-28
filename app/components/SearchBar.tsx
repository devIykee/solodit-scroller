'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (severity: string) => void;
  showBookmarksOnly: boolean;
  setShowBookmarksOnly: (show: boolean) => void;
  bookmarksCount: number;
  totalCount: number;
  filteredCount: number;
  onRandom: () => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean | ((prev: boolean) => boolean)) => void;
}

const severities = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
  { id: 'informational', label: 'Info' },
];

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  selectedSeverity,
  setSelectedSeverity,
  showBookmarksOnly,
  setShowBookmarksOnly,
  bookmarksCount,
  totalCount,
  filteredCount,
  onRandom,
  isLocked,
  setIsLocked,
}: SearchBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Keyboard shortcut '/' to search, '?' for help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-3">
        <div className="bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-wrap items-center justify-between gap-2">
          {/* Left: Search input or button */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            {isSearchOpen ? (
              <div className="flex items-center gap-1.5 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search protocol, title, auditor, tag... (Esc to close)"
                  className="w-full bg-transparent text-white placeholder-zinc-500 text-xs font-mono focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-white text-xs px-1"
                    title="Clear query"
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-zinc-400 hover:text-white text-xs px-1 border-l border-zinc-700 pl-1.5"
                  title="Close search"
                >
                  Close
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                title="Press '/' to search"
              >
                <span>🔍 Search</span>
                {searchQuery ? (
                  <span className="bg-zinc-800 text-white px-1.5 py-0.2 rounded text-[11px] max-w-[120px] truncate">
                    &quot;{searchQuery}&quot;
                  </span>
                ) : (
                  <kbd className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded text-[10px] border border-zinc-700">
                    /
                  </kbd>
                )}
              </button>
            )}

            {/* Random Button */}
            <button
              onClick={onRandom}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1"
              title="Jump to a random vulnerability (R)"
            >
              <span>🎲</span>
              <span className="hidden sm:inline">Random</span>
            </button>
          </div>

          {/* Center: Severity Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 scrollbar-none">
            {severities.map((sev) => {
              const isSelected = selectedSeverity === sev.id;
              return (
                <button
                  key={sev.id}
                  onClick={() => setSelectedSeverity(sev.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all uppercase tracking-wider ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {sev.label}
                </button>
              );
            })}
          </div>

          {/* Right: Bookmarks, Lock & Help */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsLocked(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 border ${
                isLocked
                  ? 'bg-blue-500/25 text-blue-300 border-blue-500 font-semibold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
              }`}
              title="Lock card to scroll and read without jumping to next card (L)"
            >
              <span>{isLocked ? '🔒 Locked' : '🔓 Lock'}</span>
            </button>

            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1 border ${
                showBookmarksOnly
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800'
              }`}
              title="Filter bookmarked reports"
            >
              <span>★</span>
              <span>{bookmarksCount}</span>
            </button>

            <button
              onClick={() => setShowHelp(prev => !prev)}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition-colors"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 max-w-md w-full shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm tracking-wide uppercase">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Next report</span>
                <span className="text-white">↓ or J or Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Previous report</span>
                <span className="text-white">↑ or K or Shift+Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Lock / unlock card scroll</span>
                <span className="text-white">L</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Bookmark report</span>
                <span className="text-white">B</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Random vulnerability</span>
                <span className="text-white">R</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Search</span>
                <span className="text-white">/</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-900">
                <span className="text-zinc-400">Close search / modal</span>
                <span className="text-white">Escape</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Shortcuts help</span>
                <span className="text-white">?</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
              {filteredCount} of {totalCount} reports loaded from Solodit
            </div>
          </div>
        </div>
      )}
    </>
  );
}
