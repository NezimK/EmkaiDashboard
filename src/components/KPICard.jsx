import React from 'react';

const KPICard = ({ icon: Icon, title, value, highlighted = false, onClick, isActive = false }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-4
        ${highlighted
          ? 'bg-gradient-to-br from-accent to-accent-dark shadow-lg shadow-accent/20 ring-2 ring-accent'
          : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800'
        }
        ${isActive ? 'ring-2 ring-accent scale-105' : ''}
        hover:scale-105 transition-all duration-300 cursor-pointer
      `}
    >
      <div className="flex items-center space-x-3">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-2 rounded-lg
          ${highlighted
            ? 'bg-white/20'
            : 'bg-gray-100 dark:bg-gray-800/50'
          }
        `}>
          <Icon className={`w-5 h-5 ${highlighted ? 'text-white' : 'text-accent'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <div className={`
            text-3xl font-bold mb-0.5
            ${highlighted
              ? 'text-white'
              : 'text-gray-900 dark:text-white'
            }
          `}>
            {value}
          </div>

          {/* Title */}
          <div className={`
            text-xs font-medium
            ${highlighted
              ? 'text-white/90'
              : 'text-gray-600 dark:text-gray-400'
            }
          `}>
            {title}
          </div>
        </div>
      </div>

      {/* Decoration */}
      {highlighted && (
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      )}
    </div>
  );
};

export default KPICard;
