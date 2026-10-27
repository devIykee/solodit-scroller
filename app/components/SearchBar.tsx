'use client';

import { useState } from 'react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="relative">
        {isExpanded ? (
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full p-2 shadow-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="flex-1 bg-transparent text-white placeholder-white/50 px-4 py-2 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setIsExpanded(false);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-6 py-3 rounded-full transition-colors shadow-lg"
          >
            <span className="text-xl">🔍</span>
            <span>Search</span>
          </button>
        )}
      </div>
    </div>
  );
}
