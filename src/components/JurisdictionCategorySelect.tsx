import React from 'react';
import { JurisdictionKey, PermitCategoryKey } from '../types';
import { JURISDICTIONS, CATEGORIES } from '../data/permitConstants';
import { MapPin, Hammer, Wrench, Home, CheckCircle } from 'lucide-react';

interface JurisdictionCategorySelectProps {
  selectedJurisdiction: JurisdictionKey;
  onSelectJurisdiction: (j: JurisdictionKey) => void;
  selectedCategory: PermitCategoryKey;
  onSelectCategory: (c: PermitCategoryKey) => void;
}

export const JurisdictionCategorySelect: React.FC<JurisdictionCategorySelectProps> = ({
  selectedJurisdiction,
  onSelectJurisdiction,
  selectedCategory,
  onSelectCategory
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Hammer':
        return <Hammer className="h-4 w-4" />;
      case 'Wrench':
        return <Wrench className="h-4 w-4" />;
      case 'Home':
        return <Home className="h-4 w-4" />;
      default:
        return <Hammer className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Jurisdiction Selector (Strictly 2 supported cities) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>1. Select Jurisdiction (Supported: 2 Cities)</span>
          </label>
          <span className="text-[11px] text-slate-500 font-medium">Local municipal codes apply</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {JURISDICTIONS.map((jur) => {
            const isSelected = selectedJurisdiction === jur.key;
            return (
              <button
                key={jur.key}
                id={`jurisdiction-opt-${jur.key}`}
                type="button"
                onClick={() => onSelectJurisdiction(jur.key)}
                className={`relative text-left p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">{jur.name}, {jur.state}</span>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{jur.department}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{jur.codeStandard}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Permit Category Selector (Strictly 3 supported categories) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Hammer className="h-3.5 w-3.5 text-blue-600" />
            <span>2. Select Permit Category (Supported: 3 Categories)</span>
          </label>
          <span className="text-[11px] text-slate-500 font-medium">Residential review tracks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                id={`category-opt-${cat.key}`}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`relative text-left p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {getCategoryIcon(cat.icon)}
                    </span>
                    {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{cat.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal line-clamp-2">{cat.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-medium text-slate-400">Est. Review: {cat.typicalReviewTime.split('(')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
