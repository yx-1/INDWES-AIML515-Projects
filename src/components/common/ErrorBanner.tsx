import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  id?: string;
  message: string;
  onDismiss: () => void;
  tone?: 'error' | 'warning';
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  id,
  message,
  onDismiss,
  tone = 'error'
}) => {
  const styles =
    tone === 'warning'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : 'bg-red-50 border-red-200 text-red-800';
  const iconClass = tone === 'warning' ? 'text-amber-600' : 'text-red-600';
  const buttonClass =
    tone === 'warning'
      ? 'text-amber-500 hover:text-amber-700'
      : 'text-red-500 hover:text-red-700';

  return (
    <div
      id={id}
      role="alert"
      className={`rounded-xl border p-4 text-xs flex items-start justify-between gap-2 ${styles}`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${iconClass}`} />
        <span className="font-medium leading-relaxed">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={`p-1 rounded-md transition cursor-pointer ${buttonClass}`}
        title="Dismiss"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
