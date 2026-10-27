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
          <div className="flex items-center gap-2 bg-black border-2 border-white rounded p-2 shadow-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 px-4 py-2 focus:outline-none font-mono"
              autoFocus
            />
            <button
              onClick={() => {
                setSearchQuery('');
                setIsExpanded(false);
              }}
              className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded transition-colors font-bold"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 bg-black border-2 border-white hover:bg-white hover:text-black text-white px-6 py-3 rounded transition-colors shadow-2xl font-bold uppercase tracking-wider text-sm"
          >
            <span>Search</span>
          </button>
        )}
      </div>
    </div>
  );
}
