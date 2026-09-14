import React from 'react';
import { UserProfile, JurisdictionKey, PermitCategoryKey } from '../types';
import { JURISDICTIONS, CATEGORIES } from '../data/permitConstants';
import { Menu, X } from 'lucide-react';
import { GoogleIcon } from './common/GoogleIcon';
import { LoadingSpinner } from './common/LoadingSpinner';

interface HeaderProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  selectedJurisdiction: JurisdictionKey;
  onSelectJurisdiction: (j: JurisdictionKey) => void;
  selectedCategory: PermitCategoryKey;
  onSelectCategory: (c: PermitCategoryKey) => void;
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  isSearching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenAuth,
  selectedJurisdiction,
  onSelectJurisdiction,
  selectedCategory,
  onSelectCategory,
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  isSearching = false
}) => {
  return (
    <header className="min-h-16 h-auto py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 px-3 sm:px-8 shrink-0 z-20">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          aria-label="Toggle history sidebar"
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex flex-col min-w-0">
          <label htmlFor="header-jurisdiction-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Jurisdiction
          </label>
          <select
            id="header-jurisdiction-select"
            required
            value={selectedJurisdiction}
            onChange={(e) => onSelectJurisdiction(e.target.value as JurisdictionKey)}
            className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none max-w-[46vw] sm:max-w-none truncate"
          >
            {JURISDICTIONS.map((jur) => (
              <option key={jur.key} value={jur.key}>
                {jur.name}, {jur.state}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[1px] h-8 bg-slate-200 my-auto hidden xs:block sm:block"></div>

        <div className="flex flex-col min-w-0">
          <label htmlFor="header-category-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Permit Category
          </label>
          <select
            id="header-category-select"
            required
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value as PermitCategoryKey)}
            className="text-xs sm:text-sm font-semibold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none max-w-[40vw] sm:max-w-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.shortTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="h-8 px-2 sm:px-4 flex items-center gap-2 border border-slate-200 rounded-md text-xs font-medium text-slate-600 bg-slate-50">
          {isSearching ? (
            <>
              <LoadingSpinner className="h-3 w-3 text-blue-600" />
              <span className="hidden sm:inline">Searching</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="hidden sm:inline">System Ready</span>
            </>
          )}
        </div>

        {currentUser ? (
          <button
            id="user-profile-header-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-slate-900 max-w-[140px] truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 max-w-[140px] truncate">
                {currentUser.email}
              </span>
            </div>
          </button>
        ) : (
          <button
            id="google-signin-header-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer shadow-2xs"
          >
            <GoogleIcon />
            <span className="hidden sm:inline">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};
