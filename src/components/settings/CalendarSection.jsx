import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import {
  getGoogleAuthUrl,
  checkGoogleCalendarStatus,
  disconnectGoogleCalendar,
  getOutlookAuthUrl,
  checkOutlookCalendarStatus,
  disconnectOutlookCalendar,
  checkAllCalendarStatus
} from '../../services/calendarApi';

const calendarOptions = [
  {
    id: 'google',
    name: 'Google Calendar',
    icon: '📅',
    color: 'bg-accent',
    description: 'Synchroniser avec Google Calendar'
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    icon: '📧',
    color: 'bg-accent-dark',
    description: 'Synchroniser avec Outlook'
  },
];

const CalendarSection = ({ currentUser, agency, setToast }) => {
  const [connectedCalendar, setConnectedCalendar] = useState(null);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const status = await checkAllCalendarStatus(currentUser.id);
        if (status.google) {
          setConnectedCalendar('google');
        } else if (status.outlook) {
          setConnectedCalendar('outlook');
        } else {
          setConnectedCalendar(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    checkConnectionStatus();
  }, [currentUser.id]);

  const handleConnectCalendar = async (calendarId) => {
    const openAuthPopup = async (getAuthUrl, checkStatus, calendarName) => {
      try {
        const authUrl = await getAuthUrl(currentUser.id, currentUser.email, agency);

        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          authUrl,
          `${calendarName} Authorization`,
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const checkPopup = setInterval(async () => {
          if (popup && popup.closed) {
            clearInterval(checkPopup);

            const isConnected = await checkStatus(currentUser.id);
            if (isConnected) {
              setConnectedCalendar(calendarId);
              setToast({ type: 'success', message: `${calendarName} connecté avec succès` });
            }
          }
        }, 500);
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        setToast({ type: 'error', message: `Erreur lors de la connexion à ${calendarName}` });
      }
    };

    if (calendarId === 'google') {
      await openAuthPopup(getGoogleAuthUrl, checkGoogleCalendarStatus, 'Google Calendar');
    } else if (calendarId === 'outlook') {
      await openAuthPopup(getOutlookAuthUrl, checkOutlookCalendarStatus, 'Outlook Calendar');
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      if (connectedCalendar === 'google') {
        await disconnectGoogleCalendar(currentUser.id);
        setToast({ type: 'success', message: 'Google Calendar déconnecté' });
      } else if (connectedCalendar === 'outlook') {
        await disconnectOutlookCalendar(currentUser.id);
        setToast({ type: 'success', message: 'Outlook Calendar déconnecté' });
      }
      setConnectedCalendar(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      setToast({ type: 'error', message: 'Erreur lors de la déconnexion' });
    }
  };

  return (
    <div data-onboarding="settings-calendar" className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Calendar className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Calendrier connecté
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Connectez votre calendrier pour synchroniser automatiquement vos visites programmées
      </p>

      {!connectedCalendar && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Aucun calendrier connecté. Choisissez un calendrier ci-dessous.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {calendarOptions.map((calendar) => (
          <div
            key={calendar.id}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${connectedCalendar === calendar.id
              ? 'border-accent bg-accent/10 dark:bg-accent/20'
              : 'border-gray-200 dark:border-gray-700'
              }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${calendar.color} rounded-lg flex items-center justify-center text-white text-2xl`}>
                {calendar.icon}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {calendar.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {calendar.description}
                </p>
              </div>
            </div>

            {connectedCalendar === calendar.id ? (
              <button
                onClick={handleDisconnectCalendar}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Déconnecter</span>
              </button>
            ) : (
              <button
                onClick={() => handleConnectCalendar(calendar.id)}
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium"
              >
                Connecter
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarSection;
