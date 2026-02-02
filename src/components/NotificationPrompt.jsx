import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationPreference,
  setNotificationPreference
} from '../services/notifications';

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si on doit afficher le prompt
    if (!isNotificationSupported()) return;

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Afficher le prompt seulement si permission pas encore demandée
    // et si l'utilisateur n'a pas déjà refusé via notre UI
    const userPreference = getNotificationPreference();
    const dismissed = localStorage.getItem('notification-prompt-dismissed');

    if (currentPermission === 'default' && userPreference && !dismissed) {
      // Attendre un peu avant d'afficher pour ne pas être intrusif
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setIsLoading(false);

    if (result === 'granted') {
      setNotificationPreference(true);
      setShowPrompt(false);
    } else if (result === 'denied') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/10 rounded-xl">
            <Bell className="w-6 h-6 text-accent" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Activer les notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recevez des alertes pour les nouveaux leads et rappels de relance.
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Activation...' : 'Activer'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
