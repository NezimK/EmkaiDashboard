import React from 'react';
import { Home, Users, Calendar, RotateCcw, Archive, Shield, Settings } from 'lucide-react';

const Sidebar = ({ currentView, onNavigate, currentUser }) => {
  const navigationItems = [
    {
      id: 'a_traiter',
      label: 'À Traiter',
      icon: Home,
      color: 'text-accent'
    },
    {
      id: 'en_cours',
      label: 'En Découverte',
      icon: Users,
      color: 'text-accent'
    },
    {
      id: 'visites',
      label: 'Visites',
      icon: Calendar,
      color: 'text-accent'
    },
    {
      id: 'relance',
      label: 'Relance',
      icon: RotateCcw,
      color: 'text-accent'
    },
    {
      id: 'archives',
      label: 'Archivés',
      icon: Archive,
      color: 'text-gray-600 dark:text-gray-400'
    }
  ];

  // Ajouter la vue Manager si l'utilisateur est manager
  let allItems = [...navigationItems];

  if (currentUser?.role === 'manager') {
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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isManagerView = item.id === 'manager';
          const isSettingsView = item.id === 'settings';

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-accent/10 border-l-4 border-accent'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
                }
                ${isManagerView || isSettingsView ? 'mt-4 border-t border-gray-200 dark:border-gray-800 pt-4' : ''}
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {item.label}
              </span>
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
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
