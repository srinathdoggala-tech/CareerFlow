import React from 'react';
import { Plus, Calendar, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  onQuickAdd: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onQuickAdd,
  searchValue = '',
  onSearchChange
}) => {
  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#161B26] px-8 flex items-center justify-between select-none">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search companies, titles..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <Calendar className="h-4 w-4" />
          <span>{getFormattedDate()}</span>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onQuickAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-blue-500/10"
        >
          <Plus className="h-4 w-4" />
          Quick Add
        </button>
      </div>
    </header>
  );
};
