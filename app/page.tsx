'use client';

import { useState, useEffect, useRef } from 'react';
import BugReportCard from './components/BugReportCard';
import { BugReport } from './types';

export default function Home() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
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

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setIsLoading(false);
    }
  };

  const scrollToIndex = (index: number) => {
    if (isScrolling.current || reports.length === 0) return;
    isScrolling.current = true;

    const newIndex = Math.max(0, Math.min(index, reports.length - 1));
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
        if (reports[currentIndex]) {
          toggleBookmark(reports[currentIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reports.length]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Loading bug reports...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl text-center px-4">
          <p className="mb-4">No reports found.</p>
          <p className="text-gray-400 text-sm">Check the API or scraper logs.</p>
        </div>
      </div>
    );
  }

  const currentReport = reports[currentIndex];

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-hidden bg-black"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="transition-transform duration-500 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
        }}
      >
        {reports.map((report, index) => (
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
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {reports.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white h-8'
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Bookmark indicator */}
      {currentReport && bookmarks.has(currentReport.id) && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            ★ Bookmarked
          </div>
        </div>
      )}

      {/* Controls hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm z-50 text-center">
        <div>Scroll, swipe, or use arrow keys</div>
        <div className="text-xs mt-1">Press B to bookmark • {bookmarks.size} bookmarked</div>
      </div>
    </div>
  );
}
