import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const SearchLoadingBanner: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex items-center gap-2"
  >
    <LoadingSpinner className="h-4 w-4 text-blue-600" />
    <span className="font-medium">Searching permit sources and assembling your document checklist…</span>
  </div>
);
