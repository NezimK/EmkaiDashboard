import React from 'react';
import { Mail, Phone, HelpCircle } from 'lucide-react';

const SupportSection = () => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <HelpCircle className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nous contacter
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Un problème ou une question ? Notre équipe est disponible pour vous aider.
      </p>

      <div className="space-y-3">
        <a
          href="mailto:support@emkai.fr"
          className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
            <p className="text-xs text-gray-500">support@emkai.fr</p>
          </div>
        </a>

        <a
          href="https://wa.me/33645541319"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</p>
            <p className="text-xs text-gray-500">+33 6 45 54 13 19</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default SupportSection;
