import React from 'react';
import { Bot, Users, Calendar, Archive, Shield, Settings, BarChart3, FolderOpen, X, Lock } from 'lucide-react';

// Plans qui ont accès aux statistiques (KPIs)
const PLANS_WITH_KPI = ['avance', 'premium'];

const Sidebar = ({ currentView, onNavigate, currentUser, accountType, isOpen, onClose, currentPlan }) => {
  // Vérifier si le plan actuel a accès aux statistiques
  const hasKpiAccess = PLANS_WITH_KPI.includes(currentPlan);

  const navigationItems = [
    {
      id: 'pre_qualification',
      label: 'Pré-qualification IA',
      icon: Bot,
      color: 'text-accent',
      onboardingId: 'nav-prequalification'
    },
    {
      id: 'a_traiter',
      label: 'Dossiers à traiter',
      icon: FolderOpen,
      color: 'text-accent',
      onboardingId: 'nav-dossiers'
    },
    {
      id: 'en_decouverte',
      label: 'En Découverte',
      icon: Users,
      color: 'text-accent',
      onboardingId: 'nav-decouverte'
    },
    {
      id: 'visites',
      label: 'Visites',
      icon: Calendar,
      color: 'text-accent',
      onboardingId: 'nav-visites'
    },
    {
      id: 'kpi',
      label: 'Statistiques',
      icon: BarChart3,
      color: 'text-accent',
      requiresPlan: PLANS_WITH_KPI, // Plans requis pour accéder à cette fonctionnalité
      locked: !hasKpiAccess
    }
  ];

  // Ajouter la vue Manager si l'utilisateur est manager ET si c'est une agence
  let allItems = [...navigationItems];

  if (currentUser?.role === 'manager' && accountType === 'agence') {
    allItems.push({
      id: 'manager',
      label: 'Vue Manager',
      icon: Shield,
      color: 'text-purple-600 dark:text-purple-400'
    });
  }

  // Ajouter Réglages en dernier
  allItems.push({
    id: 'settings',
    label: 'Réglages',
    icon: Settings,
    color: 'text-gray-600 dark:text-gray-400'
  });

  return (
    <>
      {/* Backdrop overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] w-64
        bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800
        overflow-y-auto z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <nav className="p-4 space-y-2 pt-14 md:pt-4">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isManagerView = item.id === 'manager';
          const isSettingsView = item.id === 'settings';
          const isLocked = item.locked;

          return (
            <button
              key={item.id}
              onClick={() => !isLocked && onNavigate(item.id)}
              disabled={isLocked}
              data-onboarding={item.onboardingId}
              title={isLocked ? 'Disponible avec le plan Avancé ou Premium' : undefined}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : isActive
                    ? 'bg-accent/10 border-l-4 border-accent'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
                }
                ${isManagerView || isSettingsView ? 'mt-4 border-t border-gray-200 dark:border-gray-800 pt-4' : ''}
              `}
            >
              <Icon className={`w-5 h-5 ${isLocked ? 'text-gray-600' : isActive ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`text-sm font-medium flex-1 text-left ${isLocked ? 'text-gray-600' : isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {item.label}
              </span>
              {isLocked && (
                <Lock className="w-4 h-4 text-gray-600" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info au bas de la sidebar */}
      {currentUser && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-sm">
                {(currentUser.name || currentUser.nom)?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser.name || currentUser.nom}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {accountType === 'independant' ? 'Indépendant' : currentUser.role}
              </p>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
