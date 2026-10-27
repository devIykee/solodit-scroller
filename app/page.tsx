'use client';

import { useState, useEffect, useRef } from 'react';
import BugReportCard from './components/BugReportCard';
import SearchBar from './components/SearchBar';
import { BugReport } from './types';

export default function Home() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<BugReport[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const isScrolling = useRef(false);

  useEffect(() => {
    // Load bookmarks from localStorage
    const saved = localStorage.getItem('bookmarks');
    if (saved) {
      setBookmarks(new Set(JSON.parse(saved)));
    }

    // Load last position
    const lastPosition = localStorage.getItem('lastPosition');
    if (lastPosition) {
      setCurrentIndex(parseInt(lastPosition));
    }

    fetchReports();
  }, []);

  useEffect(() => {
    // Filter reports based on search query
    if (searchQuery.trim() === '') {
      setFilteredReports(reports);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = reports.filter(report =>
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.protocol.toLowerCase().includes(query) ||
        report.severity.toLowerCase().includes(query) ||
        report.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredReports(filtered);
      setCurrentIndex(0); // Reset to first result when searching
    }
  }, [searchQuery, reports]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data);
      setFilteredReports(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setIsLoading(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (isScrolling.current || filteredReports.length === 0) return;
    isScrolling.current = true;

    // Infinite scroll: wrap around
    let newIndex = index;
    if (newIndex < 0) {
      newIndex = filteredReports.length - 1;
    } else if (newIndex >= filteredReports.length) {
      newIndex = 0;
    }

    setCurrentIndex(newIndex);
    localStorage.setItem('lastPosition', newIndex.toString());

    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  };

  const toggleBookmark = (reportId: string) => {
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(reportId)) {
      newBookmarks.delete(reportId);
    } else {
      newBookmarks.add(reportId);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(Array.from(newBookmarks)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 10) {
      if (e.deltaY > 0) {
        scrollToIndex(currentIndex + 1);
      } else {
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        scrollToIndex(currentIndex + 1);
      } else {
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'b' || e.key === 'B') {
        if (filteredReports[currentIndex]) {
          toggleBookmark(filteredReports[currentIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredReports]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading bug reports...</div>
      </div>
    );
  }

  if (filteredReports.length === 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="text-white text-xl text-center px-4 mt-8">
          <p className="mb-4">
            {searchQuery ? `No results found for "${searchQuery}"` : 'No reports found.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentReport = filteredReports[currentIndex];

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-hidden bg-black relative"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Search Bar */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Report Cards */}
      <div
        className="transition-transform duration-500 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
        }}
      >
        {filteredReports.map((report, index) => (
          <BugReportCard
            key={report.id}
            report={report}
            isActive={index === currentIndex}
            isBookmarked={bookmarks.has(report.id)}
            onToggleBookmark={() => toggleBookmark(report.id)}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50 max-h-[60vh] overflow-y-auto py-4">
        {filteredReports.slice(0, 20).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white h-8'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to report ${index + 1}`}
          />
        ))}
        {filteredReports.length > 20 && (
          <div className="text-white/50 text-xs text-center">
            +{filteredReports.length - 20}
          </div>
        )}
      </div>

      {/* Bookmark indicator */}
      {currentReport && bookmarks.has(currentReport.id) && (
        <div className="fixed top-20 right-4 z-50">
          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            ★ Bookmarked
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm z-50 text-center">
        <div>
          {currentIndex + 1} / {filteredReports.length} {searchQuery && '(filtered)'}
        </div>
        <div className="text-xs mt-1">
          Scroll • Arrow keys • B to bookmark • {bookmarks.size} saved
        </div>
      </div>
    </div>
  );
}
