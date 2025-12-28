import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import LeadCard from './LeadCard';

const VisitsCalendar = ({ leads, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, agency }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' ou 'list'

  // Navigation mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir les jours du mois
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Jours vides avant le début du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Obtenir les visites pour une date donnée
  const getVisitsForDate = (date) => {
    if (!date) return [];

    return leads.filter(lead => {
      if (!lead.date_visite) return false;
      const leadDate = new Date(lead.date_visite);
      return (
        leadDate.getDate() === date.getDate() &&
        leadDate.getMonth() === date.getMonth() &&
        leadDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const days = getDaysInMonth();

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-accent" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Toggle vue calendrier / liste */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        /* Vue Calendrier */
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const visitsForDay = date ? getVisitsForDate(date) : [];
              const today = isToday(date);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-gray-200 dark:border-gray-800 p-2 ${
                    !date ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  } transition-colors`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-semibold mb-2 ${
                        today
                          ? 'bg-accent text-black w-7 h-7 rounded-full flex items-center justify-center'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {date.getDate()}
                      </div>
                      {visitsForDay.length > 0 && (
                        <div className="space-y-1">
                          {visitsForDay.slice(0, 2).map((lead) => (
                            <div
                              key={lead.id}
                              onClick={() => onOpenInfoModal(lead)}
                              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors truncate"
                            >
                              {lead.nom}
                            </div>
                          ))}
                          {visitsForDay.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                              +{visitsForDay.length - 2} autre{visitsForDay.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vue Liste */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                currentUser={currentUser}
                onLeadUpdate={onLeadUpdate}
                onOpenInfoModal={onOpenInfoModal}
                onOpenConversationModal={onOpenConversationModal}
                showLastMessage={false}
                agency={agency}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 dark:text-gray-400">
                Aucune visite programmée pour le moment
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitsCalendar;
