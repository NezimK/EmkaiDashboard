import React from 'react';
import { Phone } from 'lucide-react';

const WhatsAppSection = ({ whatsappNumber }) => {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Phone className="w-6 h-6 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Numéro WhatsApp de l'agence
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Ce numéro est utilisé pour recevoir et envoyer des messages WhatsApp aux prospects.
        Il est assigné automatiquement à votre agence.
      </p>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        {whatsappNumber ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-lg">
                  {whatsappNumber}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Numéro WhatsApp actif
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              Assigné automatiquement
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Aucun numéro disponible
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Contactez le support pour obtenir un numéro WhatsApp
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppSection;
