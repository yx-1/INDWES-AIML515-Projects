import React from 'react';
import { SearchRecord, UserProfile } from '../types';
import { Trash2, Plus, Clock, X } from 'lucide-react';
import { GoogleIcon } from './common/GoogleIcon';
import { LoadingSpinner } from './common/LoadingSpinner';
import { shortJurisdictionLabel } from '../lib/format';

interface HistorySidebarProps {
  records: SearchRecord[];
  activeRecordId: string | null;
  onSelectRecord: (record: SearchRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (recordId: string) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onNewSearch?: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
  isLoading?: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  records,
  activeRecordId,
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
  currentUser,
  onOpenAuth,
  onNewSearch,
  onCloseMobile,
  isMobileDrawer = false,
  isLoading = false
}) => {
  return (
    <aside
      id="geometric-history-sidebar"
      className={`${
        isMobileDrawer
          ? 'fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] shadow-2xl flex md:hidden'
          : 'hidden md:flex w-64 lg:w-72 shrink-0'
      } bg-slate-900 text-slate-300 flex-col border-r border-slate-800 h-full select-none`}
    >
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl shadow-xs">
            L
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-none">PermitLens AI</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 inline-block">
              Course MVP
            </span>
          </div>
        </div>

        {isMobileDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close history"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {onNewSearch && (
        <div className="px-4 pt-4">
          <button
            id="sidebar-new-search-btn"
            type="button"
            onClick={() => {
              onNewSearch();
              if (isMobileDrawer && onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Permit Search</span>
          </button>
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Saved History
          </span>
          {records.length > 0 && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-bold">
              {records.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-xs text-slate-500">
              <LoadingSpinner className="h-4 w-4 text-slate-400" />
              <span>Loading saved searches…</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 px-2">
              <Clock className="h-6 w-6 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">No saved searches yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Austin, Seattle, and Los Angeles inquiries will appear here.</p>
            </div>
          ) : (
            records.map((rec) => {
              const isActive = rec.id === activeRecordId;
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    onSelectRecord(rec);
                    if (isMobileDrawer && onCloseMobile) onCloseMobile();
                  }}
                  className={`group relative px-3 py-2 rounded text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border-l-2 border-blue-500 font-medium'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                    <span className="font-semibold text-blue-400 uppercase tracking-tight">
                      {shortJurisdictionLabel(rec)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecord(rec.id);
                      }}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-500 hover:text-red-400 p-0.5 transition"
                      title="Remove record"
                      aria-label="Remove record"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="truncate text-xs leading-snug">{rec.question}</p>
                </div>
              );
            })
          )}
        </div>

        {records.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 px-2">
            <button
              id="clear-all-history-sidebar-btn"
              type="button"
              onClick={onClearHistory}
              className="text-[11px] text-slate-500 hover:text-red-400 transition cursor-pointer font-medium"
            >
              Clear History
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800">
        {currentUser ? (
          <div
            id="sidebar-user-profile-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 transition cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold overflow-hidden shrink-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition">
                {currentUser.company || currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        ) : (
          <button
            id="sidebar-signin-btn"
            type="button"
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </aside>
  );
};
