import React from 'react';
import { HelpCircle } from 'lucide-react';

const HelpSection = ({ onRestartOnboarding }) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <HelpCircle className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aide
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
        Besoin d'un rappel sur les fonctionnalités du dashboard ?
      </p>

      <button
        onClick={onRestartOnboarding}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
      >
        <HelpCircle className="w-5 h-5" />
        <span>Revoir le tutoriel</span>
      </button>
    </div>
  );
};

export default HelpSection;
