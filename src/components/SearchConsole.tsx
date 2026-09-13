import React, { useState } from 'react';
import { JurisdictionKey, PermitCategoryKey } from '../types';
import { SAMPLE_QUESTIONS, JURISDICTIONS, CATEGORIES } from '../data/permitConstants';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SearchConsoleProps {
  jurisdiction: JurisdictionKey;
  category: PermitCategoryKey;
  onSearch: (question: string) => void;
  isLoading: boolean;
}

export const SearchConsole: React.FC<SearchConsoleProps> = ({
  jurisdiction,
  category,
  onSearch,
  isLoading
}) => {
  const [query, setQuery] = useState('');

  const currentJur = JURISDICTIONS.find((j) => j.key === jurisdiction);
  const currentCat = CATEGORIES.find((c) => c.key === category);
  const sampleList = SAMPLE_QUESTIONS[jurisdiction]?.[category] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleChipClick = (sample: string) => {
    setQuery(sample);
    onSearch(sample);
  };

  return (
    <div className="space-y-3">
      {/* Geometric Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          id="permit-question-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ask a permit question (e.g., "What are the railing requirements for a 3ft deck in ${currentJur?.name}?")`}
          className="w-full h-14 pl-12 pr-32 sm:pr-40 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700 text-sm placeholder:text-slate-400 transition"
        />

        {/* Geometric Search Icon */}
        <svg
          className="absolute left-4 top-4 w-6 h-6 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Action button inside bar */}
        <div className="absolute right-2 top-2 bottom-2 flex items-center">
          <button
            id="submit-permit-question-btn"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Searching permit sources...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Contractor Queries */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {sampleList.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(sample)}
            className="shrink-0 text-left text-xs bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 transition cursor-pointer shadow-2xs"
          >
            {sample}
          </button>
        ))}
      </div>
    </div>
  );
};
