'use client';

import { useState, useRef, useEffect } from 'react';
import {
  SearchIcon,
  FilterIcon,
  LockIcon,
  UnlockIcon,
  BookmarkIcon,
  ShuffleIcon,
  CloseIcon,
  HelpIcon,
} from './Icons';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (severity: string) => void;
  selectedSource: 'local' | 'live';
  setSelectedSource: (source: 'local' | 'live') => void;
  showBookmarksOnly: boolean;
  setShowBookmarksOnly: (show: boolean) => void;
  bookmarksCount: number;
  totalCount: number;
  filteredCount: number;
  liveCount?: number;
  localCount?: number;
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
  selectedSource,
  setSelectedSource,
  showBookmarksOnly,
  setShowBookmarksOnly,
  bookmarksCount,
  totalCount,
  filteredCount,
  liveCount,
  localCount,
  onRandom,
  isLocked,
  setIsLocked,
}: SearchBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Focus input when search palette opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Click outside filter popover to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          setIsSearchOpen(false);
          setIsFilterOpen(false);
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsFilterOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFilterOpen(prev => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setSelectedSource(selectedSource === 'local' ? 'live' : 'local');
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsFilterOpen(false);
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSource, setSelectedSource]);

  const hasActiveFilters = selectedSeverity !== 'all' || showBookmarksOnly;

  return (
    <>
      {/* Top Floating Control Capsule */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Active Query Pill (if query active) */}
        {searchQuery && !isSearchOpen && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 text-xs font-mono px-3 py-1.5 rounded-full border border-zinc-700/80 backdrop-blur-md shadow-lg transition-all"
          >
            <span className="text-zinc-400">Search:</span>
            <span className="text-white max-w-[120px] truncate">&quot;{searchQuery}&quot;</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="text-zinc-500 hover:text-white ml-1"
            >
              <CloseIcon size={12} />
            </span>
          </button>
        )}

        {/* Floating Icon Island */}
        <div className="flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/90 rounded-full p-1 shadow-2xl">
          {/* Search Button */}
          <button
            onClick={() => {
              setIsSearchOpen(true);
              setIsFilterOpen(false);
            }}
            className={`p-2 rounded-full transition-colors relative ${
              searchQuery
                ? 'text-white bg-zinc-800'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
            }`}
            title="Search reports (/)"
            aria-label="Search"
          >
            <SearchIcon size={15} />
            {searchQuery && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>

          {/* Filter Button */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => {
                setIsFilterOpen(prev => !prev);
                setIsSearchOpen(false);
              }}
              className={`p-2 rounded-full transition-colors relative ${
                hasActiveFilters || isFilterOpen
                  ? 'text-white bg-zinc-800'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
              }`}
              title="Filter by severity or bookmarks (F)"
              aria-label="Filter"
            >
              <FilterIcon size={15} />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>

            {/* Expandable Filter Popover */}
            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    Filter Reports
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSelectedSeverity('all');
                        setShowBookmarksOnly(false);
                      }}
                      className="text-[10px] text-zinc-400 hover:text-white font-mono"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Source Feed (Local / Live) */}
                <div className="mb-3">
                  <div className="text-[11px] text-zinc-500 font-mono mb-1.5 flex justify-between items-center">
                    <span>Source Feed (S)</span>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                      {selectedSource}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'local' as const, label: 'Local', count: localCount },
                      { id: 'live' as const, label: 'Live', count: liveCount },
                    ].map((src) => {
                      const isSelected = selectedSource === src.id;
                      return (
                        <button
                          key={src.id}
                          onClick={() => setSelectedSource(src.id)}
                          className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition-all text-center tracking-wider font-semibold ${
                            isSelected
                              ? src.id === 'live'
                                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md'
                                : 'bg-zinc-100 text-zinc-950 font-bold shadow-md'
                              : src.id === 'live'
                              ? 'bg-zinc-900 text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 border border-emerald-500/30'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{src.label}</span>
                            {src.id === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            )}
                          </div>
                          {src.count !== undefined && (
                            <div className={`text-[9px] font-mono ${isSelected ? 'text-zinc-800' : 'text-zinc-500'}`}>
                              {src.count.toLocaleString()}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Severity Options */}
                <div className="mb-3">
                  <div className="text-[11px] text-zinc-500 font-mono mb-1.5">Severity</div>
                  <div className="grid grid-cols-3 gap-1">
                    {severities.map((sev) => {
                      const isSelected = selectedSeverity === sev.id;
                      return (
                        <button
                          key={sev.id}
                          onClick={() => setSelectedSeverity(sev.id)}
                          className={`px-2 py-1.5 rounded text-xs font-mono transition-all text-center uppercase tracking-wider ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 font-bold'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                          }`}
                        >
                          {sev.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bookmarks Toggle */}
                <div className="pt-2 border-t border-zinc-900">
                  <button
                    onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-colors ${
                      showBookmarksOnly
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800/70 border border-zinc-800/80'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BookmarkIcon size={13} filled={showBookmarksOnly} />
                      <span>Bookmarked Only</span>
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {bookmarksCount} saved
                    </span>
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono text-center">
                  Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} findings
                </div>
              </div>
            )}
          </div>

          {/* Lock Card Toggle */}
          <button
            onClick={() => setIsLocked(prev => !prev)}
            className={`p-2 rounded-full transition-colors relative ${
              isLocked
                ? 'text-sky-400 bg-sky-950/50 border border-sky-800/70'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
            }`}
            title={isLocked ? "Card locked for reading (L to unlock)" : "Lock card to scroll text freely (L)"}
            aria-label="Lock card"
          >
            {isLocked ? <LockIcon size={15} /> : <UnlockIcon size={15} />}
          </button>

          {/* Random Button */}
          <button
            onClick={onRandom}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/70 rounded-full transition-colors"
            title="Random vulnerability (R)"
            aria-label="Random vulnerability"
          >
            <ShuffleIcon size={15} />
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelp(prev => !prev)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/70 rounded-full transition-colors"
            title="Keyboard shortcuts (?)"
            aria-label="Help"
          >
            <HelpIcon size={15} />
          </button>
        </div>
      </div>

      {/* Expandable Command Palette Style Search Overlay */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-w-xl w-full shadow-2xl text-white animate-in fade-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
              <span className="text-zinc-400">
                <SearchIcon size={18} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search protocol, title, tag (#oracle), or text..."
                className="w-full bg-transparent text-sm font-mono text-white placeholder-zinc-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-900"
                title="Close (Esc)"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            {/* Quick Suggestions / Filter Status */}
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>
                {filteredCount.toLocaleString()} matching findings found
              </span>
              <span className="text-[11px] text-zinc-600">
                Press Esc or Enter to view
              </span>
            </div>

            {/* Quick Tag Shortcuts */}
            <div className="mt-4 pt-3 border-t border-zinc-900">
              <div className="text-[11px] text-zinc-500 font-mono mb-2">Quick Tags:</div>
              <div className="flex flex-wrap gap-1.5">
                {['reentrancy', 'oracle', 'access-control', 'bridge', 'overflow', 'flash-loan'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      setIsSearchOpen(false);
                    }}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 rounded-md text-xs font-mono border border-zinc-800/80 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
              <h3 className="font-mono text-xs font-bold tracking-widest uppercase text-zinc-300">
                Keyboard Navigation
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close modal"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Next finding</span>
                <span className="text-zinc-200">Down arrow, J, or Space</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Previous finding</span>
                <span className="text-zinc-200">Up arrow, K, or Shift+Space</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Lock card (scroll text freely)</span>
                <span className="text-zinc-200">L</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Bookmark finding</span>
                <span className="text-zinc-200">B</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Random finding</span>
                <span className="text-zinc-200">R</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Search palette</span>
                <span className="text-zinc-200">/</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Severity filter popover</span>
                <span className="text-zinc-200">F</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Switch feed (Local / Live)</span>
                <span className="text-zinc-200">S</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Dismiss / Close</span>
                <span className="text-zinc-200">Escape</span>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 text-center font-mono">
              {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} findings loaded
            </div>
          </div>
        </div>
      )}
    </>
  );
}
