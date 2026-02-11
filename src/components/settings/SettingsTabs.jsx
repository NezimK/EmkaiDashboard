import React from 'react';

const SettingsTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
              isActive
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SettingsTabs;
