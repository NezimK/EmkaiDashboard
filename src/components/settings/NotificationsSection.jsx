import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import {
  isNotificationSupported,
  requestNotificationPermission,
  setNotificationPreference,
  getNotificationPreference
} from '../../services/notifications';
import { API_BASE_URL } from '../../services/authApi';

const NotificationsSection = ({ currentUser, notifSettings, setNotifSettings, setToast }) => {
  const [browserNotifEnabled, setBrowserNotifEnabled] = useState(getNotificationPreference());
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  const handleToggleNotif = (key) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleBrowserNotif = async () => {
    if (!browserNotifEnabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        setBrowserNotifEnabled(true);
        setNotificationPreference(true);
        setToast({ type: 'success', message: 'Notifications navigateur activées' });
      } else {
        setToast({ type: 'error', message: 'Permission de notification refusée par le navigateur' });
        return;
      }
    } else {
      setBrowserNotifEnabled(false);
      setNotificationPreference(false);
      setToast({ type: 'success', message: 'Notifications navigateur désactivées' });
    }
  };

  const handleSaveNotifSettings = async () => {
    setIsSavingNotif(true);
    try {
      const baseUrl = import.meta.env.DEV ? '' : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/onboarding/save-notification-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          notificationSettings: notifSettings
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde');

      setToast({ type: 'success', message: 'Préférences de notifications enregistrées' });
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
      setToast({ type: 'error', message: 'Erreur lors de la sauvegarde des notifications' });
    } finally {
      setIsSavingNotif(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Bell className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notifications
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Configurez vos préférences de notifications pour rester informé de l'activité de vos leads.
      </p>

      {isNotificationSupported() && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Notifications navigateur</p>
            <p className="text-sm text-gray-500">Recevez des alertes directement dans votre navigateur</p>
          </div>
          <button
            onClick={handleToggleBrowserNotif}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${browserNotifEnabled ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${browserNotifEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {[
          { key: 'dailyReport', label: 'Rapport quotidien', desc: 'Recevez un résumé des leads chaque matin' },
          { key: 'instantNotif', label: 'Notifications leads HOT', desc: 'Soyez alerté immédiatement pour les leads prioritaires' },
          { key: 'weeklyStats', label: 'Statistiques hebdomadaires', desc: 'Recevez un bilan détaillé chaque lundi' },
          { key: 'teamPerf', label: 'Suivi performance équipe', desc: 'Visualisez les taux de conversion par agent' }
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
            <button
              onClick={() => handleToggleNotif(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifSettings[key] ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifSettings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveNotifSettings}
        disabled={isSavingNotif}
        className="mt-4 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium disabled:opacity-50"
      >
        {isSavingNotif ? 'Enregistrement...' : 'Enregistrer les préférences'}
      </button>
    </div>
  );
};

export default NotificationsSection;
