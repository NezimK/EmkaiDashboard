import React from 'react';
import { Filter } from 'lucide-react';

const FilterBar = ({ filters, selectedFilter, onFilterChange }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrer :</span>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => onFilterChange(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedFilter === null
                ? 'bg-accent text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Tous
          </button>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === filter.value
                  ? 'bg-accent text-black'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-full text-xs">
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
