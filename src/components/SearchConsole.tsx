import React, { useEffect, useState } from 'react';
import { JurisdictionKey, PermitCategoryKey } from '../types';
import { SAMPLE_QUESTIONS, JURISDICTIONS } from '../data/permitConstants';
import { ArrowRight } from 'lucide-react';
import { QUESTION_MAX_LENGTH, validatePermitSearch } from '../lib/validation';
import { loadLastQuery, saveLastQuery } from '../lib/storage';
import { LoadingSpinner } from './common/LoadingSpinner';

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
  const [query, setQuery] = useState(loadLastQuery);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const currentJur = JURISDICTIONS.find((j) => j.key === jurisdiction);
  const sampleList = SAMPLE_QUESTIONS[jurisdiction]?.[category] || [];

  useEffect(() => {
    saveLastQuery(query);
  }, [query]);

  const submitQuestion = (value: string) => {
    const nextError = validatePermitSearch({
      jurisdiction,
      category,
      question: value
    });
    if (nextError) {
      setFieldError(nextError);
      return;
    }
    setFieldError(null);
    onSearch(value.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    submitQuestion(query);
  };

  const handleChipClick = (sample: string) => {
    if (isLoading) return;
    setQuery(sample);
    submitQuestion(sample);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 sm:block">
        <label htmlFor="permit-question-input" className="sr-only">
          Permit question
        </label>
        <input
          id="permit-question-input"
          type="text"
          value={query}
          maxLength={QUESTION_MAX_LENGTH}
          onChange={(e) => {
            setQuery(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? 'permit-question-error' : 'permit-question-hint'}
          placeholder={`Ask a permit question (e.g., "What are the railing requirements for a 3ft deck in ${currentJur?.name}?")`}
          className={`w-full h-14 pl-12 pr-4 sm:pr-40 rounded-xl border bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-700 text-sm placeholder:text-slate-400 transition ${
            fieldError ? 'border-red-300' : 'border-slate-200'
          }`}
        />

        <svg
          className="absolute left-4 top-4 w-6 h-6 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <div className="sm:absolute sm:right-2 sm:top-2 sm:bottom-2 flex items-center">
          <button
            id="submit-permit-question-btn"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto h-11 sm:h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="sm:hidden">Searching…</span>
                <span className="hidden sm:inline">Searching permit sources...</span>
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

      <div className="flex items-center justify-between gap-3">
        <p id="permit-question-hint" className="text-[11px] text-slate-400">
          {query.trim().length}/{QUESTION_MAX_LENGTH} characters · at least 5 required
        </p>
      </div>

      {fieldError && (
        <p id="permit-question-error" className="text-xs text-red-700" role="alert">
          {fieldError}
        </p>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {sampleList.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleChipClick(sample)}
            className="shrink-0 text-left text-xs bg-white text-slate-700 hover:bg-slate-50 hover:text-blue-600 border border-slate-200 rounded-lg px-3 py-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed max-w-[280px] sm:max-w-none truncate sm:whitespace-normal"
          >
            {sample}
          </button>
        ))}
      </div>
    </div>
  );
};
