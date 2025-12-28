import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { CALENDAR_TYPES, exportToCalendar } from '../utils/calendarExport';

const CalendarExportMenu = ({ lead, visitDate, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = (calendarType) => {
    exportToCalendar(calendarType, lead, visitDate);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Bouton principal */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-all shadow-md text-sm font-medium"
        title="Ajouter à mon agenda"
      >
        <CalendarPlus className="w-4 h-4" />
        <span className="hidden md:inline">Ajouter à l'agenda</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="p-2">
            {CALENDAR_TYPES.map((calendar) => (
              <button
                key={calendar.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(calendar.id);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-left"
              >
                <div className={`w-8 h-8 ${calendar.color} rounded-lg flex items-center justify-center text-white text-lg flex-shrink-0`}>
                  {calendar.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {calendar.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarExportMenu;
