import React from 'react';
import { Sun, Moon, LogOut, Building2 } from 'lucide-react';

const Header = ({ darkMode, toggleDarkMode, onLogout, currentUser }) => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-bg border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-1 flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-accent">IMMO</span>
              <span className="text-gray-900 dark:text-white ml-2 text-lg font-light">Copilot</span>
            </h1>

            {/* Agency Badge */}
            {currentUser?.agencyName && (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-accent/10 dark:bg-accent/20 rounded-lg border border-accent/20">
                <Building2 className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">{currentUser.agencyName}</span>
              </div>
            )}
          </div>

          {/* Actions - Dark Mode + Logout */}
          <div className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-200"
              title={darkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-accent" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
