import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Phone, List, LayoutGrid, CalendarDays } from 'lucide-react';
import LeadCard from './LeadCard';

// ── Palette de couleurs par agent ──────────────────────────────────────────────
const AGENT_COLORS = [
  { bgLight: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-400 dark:border-blue-600', dot: 'bg-blue-500' },
  { bgLight: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-400 dark:border-emerald-600', dot: 'bg-emerald-500' },
  { bgLight: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-400 dark:border-violet-600', dot: 'bg-violet-500' },
  { bgLight: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-400 dark:border-amber-600', dot: 'bg-amber-500' },
  { bgLight: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-400 dark:border-rose-600', dot: 'bg-rose-500' },
  { bgLight: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-400 dark:border-cyan-600', dot: 'bg-cyan-500' },
  { bgLight: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-400 dark:border-pink-600', dot: 'bg-pink-500' },
  { bgLight: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-400 dark:border-teal-600', dot: 'bg-teal-500' },
  { bgLight: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400 dark:border-orange-600', dot: 'bg-orange-500' },
  { bgLight: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-400 dark:border-indigo-600', dot: 'bg-indigo-500' },
];

const UNASSIGNED_COLOR = { bgLight: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-400 dark:border-gray-600', dot: 'bg-gray-400' };

// ── Constantes calendrier ──────────────────────────────────────────────────────
const HOUR_HEIGHT = 64;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_NAMES_SHORT = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sep.', 'Oct.', 'Nov.', 'Déc.'];
const DAY_NAMES_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_NAMES_LETTER = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// ── Utilitaires date ───────────────────────────────────────────────────────────
const getMondayIndex = (jsDay) => (jsDay === 0 ? 6 : jsDay - 1);

const getWeekStart = (date) => {
  const d = new Date(date);
  const diff = getMondayIndex(d.getDay());
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (d1, d2) =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

const isToday = (date) => isSameDay(date, new Date());

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const getVisitTopPx = (dateStr) => {
  const d = new Date(dateStr);
  const totalMin = (d.getHours() - DAY_START_HOUR) * 60 + d.getMinutes();
  return (totalMin / 60) * HOUR_HEIGHT;
};

// Répartir les visites en colonnes quand elles se chevauchent (pour la vue semaine)
const layoutVisits = (visits) => {
  if (visits.length === 0) return [];
  const sorted = [...visits].sort((a, b) => new Date(a.date_visite) - new Date(b.date_visite));
  const columns = [];

  sorted.forEach(visit => {
    const start = new Date(visit.date_visite).getTime();
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      const lastEnd = new Date(lastInCol.date_visite).getTime() + 60 * 60 * 1000;
      if (start >= lastEnd) {
        columns[col].push(visit);
        visit._col = col;
        placed = true;
        break;
      }
    }
    if (!placed) {
      visit._col = columns.length;
      columns.push([visit]);
    }
  });

  const totalCols = columns.length;
  sorted.forEach(v => { v._totalCols = totalCols; });
  return sorted;
};

// ── Composant principal ────────────────────────────────────────────────────────
const VisitsCalendar = ({ leads, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, agency }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedAgents, setSelectedAgents] = useState(null);

  // Carte agent → couleur
  const agentColorMap = useMemo(() => {
    const agents = [...new Set(leads.map(l => l.agent_en_charge).filter(Boolean))].sort();
    const map = {};
    agents.forEach((agent, i) => {
      map[agent] = AGENT_COLORS[i % AGENT_COLORS.length];
    });
    return map;
  }, [leads]);

  const getAgentColor = (name) => agentColorMap[name] || UNASSIGNED_COLOR;

  // Filtrage par agents sélectionnés
  const visibleLeads = useMemo(() => {
    if (!selectedAgents) return leads;
    return leads.filter(l => selectedAgents.includes(l.agent_en_charge));
  }, [leads, selectedAgents]);

  // Visites pour une date donnée
  const getVisitsForDate = (date) => {
    if (!date) return [];
    return visibleLeads.filter(lead => {
      if (!lead.date_visite) return false;
      return isSameDay(new Date(lead.date_visite), date);
    });
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigatePrevious = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1, 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1, 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Titre dynamique
  const getTitle = () => {
    if (viewMode === 'month' || viewMode === 'list') {
      return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'week') {
      const ws = getWeekStart(currentDate);
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) {
        return `${ws.getDate()} - ${we.getDate()} ${MONTH_NAMES_SHORT[ws.getMonth()]} ${ws.getFullYear()}`;
      }
      return `${ws.getDate()} ${MONTH_NAMES_SHORT[ws.getMonth()]} - ${we.getDate()} ${MONTH_NAMES_SHORT[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return `${DAY_NAMES_FULL[getMondayIndex(currentDate.getDay())]} ${currentDate.getDate()} ${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    return '';
  };

  // Toggle filtre agent
  const toggleAgentFilter = (agentName) => {
    const allAgents = Object.keys(agentColorMap);
    if (!selectedAgents) {
      // Pas de filtre actif → cacher cet agent
      setSelectedAgents(allAgents.filter(a => a !== agentName));
    } else if (selectedAgents.includes(agentName)) {
      const next = selectedAgents.filter(a => a !== agentName);
      setSelectedAgents(next.length === 0 ? null : next);
    } else {
      const next = [...selectedAgents, agentName];
      setSelectedAgents(next.length === allAgents.length ? null : next);
    }
  };

  const resetAgentFilter = () => setSelectedAgents(null);

  // ── Légende agents ─────────────────────────────────────────────────────────
  const agents = Object.keys(agentColorMap);

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Navigation + titre */}
        <div className="flex items-center space-x-3">
          <button onClick={navigatePrevious} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors">
            Aujourd'hui
          </button>
          <button onClick={navigateNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white ml-1">
            {getTitle()}
          </h3>
        </div>

        {/* Toggle vues */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {[
            { key: 'month', label: 'Mois', icon: Calendar },
            { key: 'week', label: 'Semaine', icon: LayoutGrid },
            { key: 'day', label: 'Jour', icon: CalendarDays },
            { key: 'list', label: 'Liste', icon: List },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex-shrink-0 ${
                viewMode === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Légende agents */}
      {agents.length > 1 && (
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">Agents :</span>
          <button
            onClick={resetAgentFilter}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              !selectedAgents
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:border-accent/40'
            }`}
          >
            Tous
          </button>
          {agents.map(agent => {
            const color = getAgentColor(agent);
            const isHidden = selectedAgents && !selectedAgents.includes(agent);
            return (
              <button
                key={agent}
                onClick={() => toggleAgentFilter(agent)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  isHidden ? 'opacity-40' : 'opacity-100'
                } ${color.bgLight} ${color.text} ${color.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                {agent}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenu selon le mode */}
      {viewMode === 'month' && <MonthView currentDate={currentDate} getVisitsForDate={getVisitsForDate} getAgentColor={getAgentColor} onOpenInfoModal={onOpenInfoModal} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
      {viewMode === 'week' && <WeekView currentDate={currentDate} getVisitsForDate={getVisitsForDate} getAgentColor={getAgentColor} onOpenInfoModal={onOpenInfoModal} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
      {viewMode === 'day' && <DayView currentDate={currentDate} getVisitsForDate={getVisitsForDate} getAgentColor={getAgentColor} onOpenInfoModal={onOpenInfoModal} />}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visibleLeads.length > 0 ? (
            visibleLeads.map(lead => (
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
              <p className="text-gray-600 dark:text-gray-400">Aucune visite programmée pour le moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Vue Mois ─────────────────────────────────────────────────────────────────
const MonthView = ({ currentDate, getVisitsForDate, getAgentColor, onOpenInfoModal, setCurrentDate, setViewMode }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = getMondayIndex(firstDay.getDay());
    const result = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month, -i), isCurrentMonth: false });
    }
    for (let day = 1; day <= lastDay.getDate(); day++) {
      result.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    while (result.length < 42) {
      const nextDay = result.length - startPadding - lastDay.getDate() + 1;
      result.push({ date: new Date(year, month + 1, nextDay), isCurrentMonth: false });
    }
    return result;
  }, [year, month]);

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* En-têtes jours */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
        {DAY_NAMES_SHORT.map((day, i) => (
          <div key={i} className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{DAY_NAMES_LETTER[i]}</span>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7">
        {days.map(({ date, isCurrentMonth }, index) => {
          const visitsForDay = getVisitsForDate(date);
          const today = isToday(date);

          return (
            <div
              key={index}
              onClick={() => { setCurrentDate(date); setViewMode('day'); }}
              className={`min-h-[80px] md:min-h-[110px] border-r border-b border-gray-200 dark:border-gray-800 p-1 md:p-1.5 cursor-pointer transition-colors ${
                !isCurrentMonth
                  ? 'bg-gray-50/50 dark:bg-gray-900/30'
                  : today
                    ? 'bg-accent/5 dark:bg-accent/5'
                    : 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 ${
                today
                  ? 'bg-accent text-black w-6 h-6 rounded-full flex items-center justify-center'
                  : isCurrentMonth
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-600'
              }`}>
                {date.getDate()}
              </div>
              {visitsForDay.length > 0 && (
                <div className="space-y-0.5">
                  {visitsForDay.slice(0, 3).map(visit => {
                    const color = getAgentColor(visit.agent_en_charge);
                    return (
                      <div
                        key={visit.id}
                        onClick={(e) => { e.stopPropagation(); onOpenInfoModal(visit); }}
                        className={`text-[10px] leading-tight px-1 md:px-1.5 py-0.5 rounded ${color.bgLight} ${color.text} cursor-pointer hover:opacity-80 transition-opacity truncate`}
                      >
                        {/* Mobile: point + heure | Desktop: heure + initiales + nom */}
                        <span className="md:hidden flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
                          {formatTime(visit.date_visite)}
                        </span>
                        <span className="hidden md:inline">
                          <span className="font-semibold">{formatTime(visit.date_visite)}</span>
                          {' '}{getInitials(visit.agent_en_charge)} - {visit.nom}
                        </span>
                      </div>
                    );
                  })}
                  {visitsForDay.length > 3 && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1 md:px-1.5 font-medium">
                      +{visitsForDay.length - 3} autre{visitsForDay.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Vue Semaine ──────────────────────────────────────────────────────────────
const WeekView = ({ currentDate, getVisitsForDate, getAgentColor, onOpenInfoModal, setCurrentDate, setViewMode }) => {
  const weekStart = getWeekStart(currentDate);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart.getTime()]);

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* En-têtes des jours */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="grid grid-cols-[56px_repeat(7,minmax(100px,1fr))] min-w-[560px]">
          {/* Header row */}
          <div className="border-b border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-2" />
          {weekDays.map((day, i) => {
            const today = isToday(day);
            return (
              <div
                key={i}
                onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                className={`p-2 text-center border-b border-r border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                  today ? 'bg-accent/5 dark:bg-accent/5' : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{DAY_NAMES_SHORT[i]}</div>
                <div className={`text-lg font-bold mt-0.5 ${
                  today
                    ? 'bg-accent text-black w-8 h-8 rounded-full flex items-center justify-center mx-auto'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}

          {/* Grille horaire */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Label heure */}
              <div className="border-r border-b border-gray-200 dark:border-gray-800 flex items-start justify-end pr-2 pt-1" style={{ height: `${HOUR_HEIGHT}px` }}>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
              {/* Colonnes jour */}
              {weekDays.map((day, dayIndex) => {
                const isLastHour = hour === HOURS[HOURS.length - 1];
                return (
                  <div
                    key={dayIndex}
                    className={`relative border-r border-b border-gray-100 dark:border-gray-800/50 ${isToday(day) ? 'bg-accent/[0.02]' : ''}`}
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {/* Rendre les visites uniquement dans la première rangée d'heure pour chaque jour-colonne */}
                    {hour === HOURS[0] && (() => {
                      const dayVisits = getVisitsForDate(day);
                      const laid = layoutVisits(dayVisits);
                      return laid.map(visit => {
                        const color = getAgentColor(visit.agent_en_charge);
                        const top = getVisitTopPx(visit.date_visite);
                        if (top < 0 || top > HOURS.length * HOUR_HEIGHT) return null;
                        const widthPct = 100 / visit._totalCols;
                        const leftPct = visit._col * widthPct;
                        return (
                          <div
                            key={visit.id}
                            onClick={() => onOpenInfoModal(visit)}
                            className={`absolute rounded-md px-1.5 py-1 cursor-pointer border-l-4 ${color.border} ${color.bgLight} ${color.text} hover:shadow-md transition-shadow overflow-hidden z-10`}
                            style={{
                              top: `${top}px`,
                              height: `${HOUR_HEIGHT}px`,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                            }}
                          >
                            <div className="text-[11px] font-semibold truncate">{formatTime(visit.date_visite)} - {visit.nom}</div>
                            <div className="text-[10px] opacity-75 truncate">{visit.agent_en_charge || 'Non assigné'}</div>
                          </div>
                        );
                      });
                    })()}

                    {/* Ligne heure actuelle */}
                    {isToday(day) && hour === HOURS[0] && (() => {
                      const now = new Date();
                      const h = now.getHours();
                      if (h >= DAY_START_HOUR && h < DAY_END_HOUR) {
                        const top = getVisitTopPx(now.toISOString());
                        return (
                          <div className="absolute left-0 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${top}px` }}>
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                            <div className="flex-1 h-0.5 bg-red-500" />
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Vue Jour ─────────────────────────────────────────────────────────────────
const DayView = ({ currentDate, getVisitsForDate, getAgentColor, onOpenInfoModal }) => {
  const dayVisits = useMemo(() => {
    return getVisitsForDate(currentDate).sort((a, b) => new Date(a.date_visite) - new Date(b.date_visite));
  }, [currentDate, getVisitsForDate]);

  const today = isToday(currentDate);

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* En-tête du jour */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dayVisits.length} visite{dayVisits.length !== 1 ? 's' : ''} programmée{dayVisits.length !== 1 ? 's' : ''}
          </p>
        </div>
        {today && (
          <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">
            Aujourd'hui
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {HOURS.map(hour => {
          const hourVisits = dayVisits.filter(v => new Date(v.date_visite).getHours() === hour);
          const dynamicHeight = hourVisits.length > 0 ? Math.max(HOUR_HEIGHT, hourVisits.length * 88 + 8) : HOUR_HEIGHT;

          return (
            <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800/50" style={{ minHeight: `${dynamicHeight}px` }}>
              {/* Label heure */}
              <div className="w-14 md:w-16 flex-shrink-0 flex items-start justify-end pr-2 md:pr-3 pt-2 border-r border-gray-200 dark:border-gray-800">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>

              {/* Cartes de visite */}
              <div className="flex-1 p-1.5 space-y-1.5">
                {hourVisits.map(visit => {
                  const color = getAgentColor(visit.agent_en_charge);
                  return (
                    <div
                      key={visit.id}
                      onClick={() => onOpenInfoModal(visit)}
                      className={`p-3 rounded-lg border-l-4 ${color.border} ${color.bgLight} cursor-pointer hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-bold ${color.text}`}>
                          {formatTime(visit.date_visite)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${color.bgLight} ${color.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          {visit.agent_en_charge || 'Non assigné'}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {visit.nom}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {visit.bien && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {visit.bien}
                          </span>
                        )}
                        {visit.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {visit.telephone}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Ligne heure actuelle */}
        {today && (() => {
          const now = new Date();
          const h = now.getHours();
          if (h >= DAY_START_HOUR && h < DAY_END_HOUR) {
            const top = getVisitTopPx(now.toISOString());
            return (
              <div className="absolute left-14 md:left-16 right-0 flex items-center z-10 pointer-events-none" style={{ top: `${top}px` }}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* État vide */}
      {dayVisits.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune visite programmée ce jour</p>
        </div>
      )}
    </div>
  );
};

export default VisitsCalendar;
