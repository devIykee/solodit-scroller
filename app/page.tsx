'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BugReportCard from './components/BugReportCard';
import SearchBar from './components/SearchBar';
import { BugReport } from './types';
import { SearchIcon, LockIcon, UnlockIcon } from './components/Icons';

export default function Home() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedSource, setSelectedSource] = useState<'local' | 'live'>('local');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Lazy state initializers to avoid setState in effects
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('bookmarks');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return new Set();
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const lastPosition = localStorage.getItem('lastPosition');
      if (lastPosition) {
        const parsed = parseInt(lastPosition, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef(false);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSourceChange = useCallback((source: 'local' | 'live') => {
    setSelectedSource(source);
    setCurrentIndex(0);
    try {
      localStorage.setItem('lastPosition', '0');
    } catch {
      // ignore
    }
  }, []);

  // Compute live vs local counts
  const { liveCount, localCount } = useMemo(() => {
    let live = 0;
    let local = 0;
    for (const r of reports) {
      if (r.source === 'live' || r.id.startsWith('live-')) {
        live++;
      } else {
        local++;
      }
    }
    return { liveCount: live, localCount: local };
  }, [reports]);

  // Load data on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const response = await fetch('/api/reports');
        const data = await response.json();
        if (isMounted && Array.isArray(data)) {
          setReports(data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute filtered reports cleanly as derived state with useMemo
  const filteredReports = useMemo(() => {
    let result = reports;

    if (showBookmarksOnly) {
      result = result.filter(r => bookmarks.has(r.id));
    }

    if (selectedSeverity !== 'all') {
      result = result.filter(r => r.severity === selectedSeverity);
    }

    if (selectedSource === 'live') {
      result = result.filter(r => r.source === 'live' || r.id.startsWith('live-'));
    } else {
      result = result.filter(r => r.source !== 'live' && !r.id.startsWith('live-'));
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().replace(/^#/, '');
      result = result.filter(report =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.protocol.toLowerCase().includes(query) ||
        report.auditor.toLowerCase().includes(query) ||
        report.severity.toLowerCase().includes(query) ||
        report.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [reports, searchQuery, selectedSeverity, selectedSource, showBookmarksOnly, bookmarks]);

  // Keep active index in bounds
  const activeIndex = useMemo(() => {
    if (filteredReports.length === 0) return 0;
    return currentIndex >= filteredReports.length ? 0 : currentIndex;
  }, [filteredReports.length, currentIndex]);

  const scrollToIndex = useCallback((index: number) => {
    if (isScrolling.current || filteredReports.length === 0) return;
    isScrolling.current = true;

    // Wrap around for infinite scrolling
    let newIndex = index;
    if (newIndex < 0) {
      newIndex = filteredReports.length - 1;
    } else if (newIndex >= filteredReports.length) {
      newIndex = 0;
    }

    setCurrentIndex(newIndex);
    try {
      localStorage.setItem('lastPosition', newIndex.toString());
    } catch {
      // ignore
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 400);
  }, [filteredReports.length]);

  const handleRandom = useCallback(() => {
    if (filteredReports.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredReports.length);
    scrollToIndex(randomIndex);
  }, [filteredReports.length, scrollToIndex]);

  const toggleBookmark = useCallback((reportId: string) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      try {
        localStorage.setItem('bookmarks', JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    // If user locked onto the card, NEVER switch cards on wheel
    if (isLocked || isScrolling.current) return;

    // Check if scrolling inside a scrollable card container
    const scrollContainer = (e.target as HTMLElement)?.closest('.overflow-y-auto');
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isScrollable = scrollHeight > clientHeight + 10;

      if (isScrollable) {
        // If scrolling down but haven't reached the end of the report content
        if (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight - 20) {
          return;
        }
        // If scrolling up but haven't reached the top of the report content
        if (e.deltaY < 0 && scrollTop > 20) {
          return;
        }
      }
    }

    if (Math.abs(e.deltaY) > 25) {
      if (e.deltaY > 0) {
        scrollToIndex(activeIndex + 1);
      } else {
        scrollToIndex(activeIndex - 1);
      }

      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
        isScrolling.current = false;
      }, 350);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isLocked) return;

    const scrollContainer = (e.target as HTMLElement)?.closest('.overflow-y-auto');
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (scrollHeight > clientHeight + 10) {
        if (scrollTop > 15 && scrollTop + clientHeight < scrollHeight - 15) {
          return;
        }
      }
    }

    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        scrollToIndex(activeIndex + 1);
      } else {
        scrollToIndex(activeIndex - 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J' || e.key === ' ') {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLocked(prev => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        if (filteredReports[activeIndex]) {
          toggleBookmark(filteredReports[activeIndex].id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRandom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredReports, handleRandom, toggleBookmark, scrollToIndex]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white font-mono gap-4">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <div className="text-sm tracking-widest uppercase text-zinc-400">Loading Solodit Reports...</div>
      </div>
    );
  }

  // Calculate virtualized window: render only cards within ±2 range of activeIndex
  const windowRadius = 2;
  const startIndex = Math.max(0, activeIndex - windowRadius);
  const endIndex = Math.min(filteredReports.length - 1, activeIndex + windowRadius);
  const visibleReports = filteredReports.slice(startIndex, endIndex + 1).map((report, idx) => ({
    report,
    originalIndex: startIndex + idx,
  }));

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-hidden bg-black relative select-none"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Center Feeds Navigation (TikTok / Twitter style pure text) */}
      <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-8 sm:gap-10 select-none">
        <button
          onClick={() => handleSourceChange('local')}
          className={`relative flex flex-col items-center py-1 transition-all duration-200 cursor-pointer ${
            selectedSource === 'local'
              ? 'text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-300 font-medium'
          }`}
          title="Browse local findings"
        >
          <span className="text-sm sm:text-base tracking-wider font-mono">
            Local
          </span>
          <span
            className={`h-0.5 w-6 rounded-full mt-1 transition-all duration-200 ${
              selectedSource === 'local'
                ? 'bg-white scale-100 opacity-100'
                : 'bg-transparent scale-0 opacity-0'
            }`}
          />
        </button>

        <button
          onClick={() => handleSourceChange('live')}
          className={`relative flex flex-col items-center py-1 transition-all duration-200 cursor-pointer ${
            selectedSource === 'live'
              ? 'text-white font-bold'
              : 'text-zinc-500 hover:text-zinc-300 font-medium'
          }`}
          title="Browse live additions from Solodit"
        >
          <span className="text-sm sm:text-base tracking-wider font-mono">
            Live
          </span>
          <span
            className={`h-0.5 w-6 rounded-full mt-1 transition-all duration-200 ${
              selectedSource === 'live'
                ? 'bg-white scale-100 opacity-100'
                : 'bg-transparent scale-0 opacity-0'
            }`}
          />
        </button>
      </div>

      {/* Top Controls & Navigation */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
        selectedSource={selectedSource}
        setSelectedSource={handleSourceChange}
        showBookmarksOnly={showBookmarksOnly}
        setShowBookmarksOnly={setShowBookmarksOnly}
        bookmarksCount={bookmarks.size}
        totalCount={reports.length}
        filteredCount={filteredReports.length}
        liveCount={liveCount}
        localCount={localCount}
        onRandom={handleRandom}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
      />

      {/* Empty State */}
      {filteredReports.length === 0 ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-6">
          <div className="max-w-md text-center space-y-4">
            <SearchIcon size={36} className="mx-auto text-zinc-600 mb-2" />
            <h2 className="text-xl font-bold font-mono">No Vulnerabilities Found</h2>
            <p className="text-zinc-400 text-sm">
              {showBookmarksOnly
                ? 'You have not bookmarked any reports matching these criteria yet. Press B on any report to save it.'
                : `No reports matched your filters in the ${selectedSource.toUpperCase()} feed.`}
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-mono transition-colors"
                >
                  Clear search
                </button>
              )}
              {selectedSeverity !== 'all' && (
                <button
                  onClick={() => setSelectedSeverity('all')}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-mono transition-colors"
                >
                  Reset severity
                </button>
              )}
              <button
                onClick={() => handleSourceChange(selectedSource === 'live' ? 'local' : 'live')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-mono transition-colors"
              >
                Switch to {selectedSource === 'live' ? 'Local' : 'Live'}
              </button>
              {showBookmarksOnly && (
                <button
                  onClick={() => setShowBookmarksOnly(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-mono transition-colors"
                >
                  Show all reports
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Virtualized Scroller Container */
        <div
          className="relative w-full transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            height: `${filteredReports.length * 100}vh`,
            transform: `translateY(-${activeIndex * 100}vh)`,
          }}
        >
          {visibleReports.map(({ report, originalIndex }) => (
            <div
              key={report.id}
              className="absolute left-0 w-full h-screen"
              style={{
                top: `${originalIndex * 100}vh`,
              }}
            >
              <BugReportCard
                report={report}
                isActive={originalIndex === activeIndex}
                isBookmarked={bookmarks.has(report.id)}
                isLocked={isLocked}
                onToggleBookmark={() => toggleBookmark(report.id)}
                onToggleLock={() => setIsLocked(prev => !prev)}
                onTagClick={(tag) => setSearchQuery(tag)}
                onSourceClick={(src) => handleSourceChange(src)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Floating Bottom Navigator */}
      {filteredReports.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-full px-4 py-1.5 shadow-2xl flex items-center gap-3 text-xs font-mono text-zinc-300">
          <button
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
            title="Previous report (↑ or K)"
          >
            ← Prev
          </button>

          <span className="text-zinc-500 font-sans">|</span>

          <span className="text-zinc-200">
            <span className="text-white font-bold">{activeIndex + 1}</span> of {filteredReports.length.toLocaleString()}
          </span>

          <span className="text-zinc-500 font-sans">|</span>

          <button
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors"
            title="Next report (↓ or J)"
          >
            Next →
          </button>

          <span className="text-zinc-500 font-sans">|</span>

          <button
            onClick={() => setIsLocked(prev => !prev)}
            className={`px-2.5 py-0.5 rounded transition-all flex items-center gap-1.5 font-semibold ${
              isLocked
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Lock current card to scroll and read without jumping (L)"
          >
            {isLocked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
            <span>{isLocked ? 'Locked' : 'Lock (L)'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
