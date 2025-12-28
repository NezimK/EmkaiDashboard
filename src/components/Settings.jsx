import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Calendar, Check, X, LogOut, Mail, Lock, Edit2 } from 'lucide-react';
import Toast from './Toast';
import { updateUserEmail, updateUserPassword } from '../data/users';
import { getGoogleAuthUrl, checkGoogleCalendarStatus, disconnectGoogleCalendar } from '../services/calendarApi';

const Settings = ({ currentUser, agency, onLogout, onUserUpdate }) => {
  const [connectedCalendar, setConnectedCalendar] = useState(null);
  const [toast, setToast] = useState(null);

  // États pour la modification d'email
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // États pour la modification de mot de passe
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Vérifier le statut de connexion Google Calendar
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const isConnected = await checkGoogleCalendarStatus(currentUser.id);
        if (isConnected) {
          setConnectedCalendar('google');
        } else {
          setConnectedCalendar(null);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    checkConnectionStatus();
  }, [currentUser.id]);

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

  const handleConnectCalendar = async (calendarId) => {
    if (calendarId === 'google') {
      try {
        // Obtenir l'URL d'autorisation Google
        const authUrl = await getGoogleAuthUrl(currentUser.id, currentUser.email, agency);

        // Ouvrir la fenêtre popup d'autorisation
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          authUrl,
          'Google Calendar Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Vérifier périodiquement si la popup est fermée
        const checkPopup = setInterval(async () => {
          if (popup && popup.closed) {
            clearInterval(checkPopup);

            // Vérifier si la connexion a réussi
            const isConnected = await checkGoogleCalendarStatus(currentUser.id);
            if (isConnected) {
              setConnectedCalendar('google');
              setToast({
                type: 'success',
                message: 'Google Calendar connecté avec succès'
              });
            }
          }
        }, 500);
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        setToast({
          type: 'error',
          message: 'Erreur lors de la connexion à Google Calendar'
        });
      }
    } else if (calendarId === 'outlook') {
      // Pour Outlook, garder l'ancien comportement (export simple)
      sessionStorage.setItem(`calendar_${agency}_${currentUser.email}`, calendarId);
      setConnectedCalendar(calendarId);
      setToast({
        type: 'success',
        message: 'Outlook Calendar sélectionné'
      });
    }
  };

  const handleDisconnectCalendar = async () => {
    if (connectedCalendar === 'google') {
      try {
        await disconnectGoogleCalendar(currentUser.id);
        setConnectedCalendar(null);
        setToast({
          type: 'success',
          message: 'Google Calendar déconnecté'
        });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        setToast({
          type: 'error',
          message: 'Erreur lors de la déconnexion'
        });
      }
    } else {
      // Pour Outlook
      sessionStorage.removeItem(`calendar_${agency}_${currentUser.email}`);
      setConnectedCalendar(null);
      setToast({
        type: 'success',
        message: 'Calendrier déconnecté'
      });
    }
  };

  // Gérer la mise à jour de l'email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    if (!newEmail || newEmail === currentUser.email) {
      setToast({
        type: 'error',
        message: 'Veuillez entrer un nouvel email différent'
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setToast({
        type: 'error',
        message: 'Email invalide'
      });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const result = updateUserEmail(currentUser.id, newEmail);

      if (result.success) {
        // Mettre à jour l'utilisateur dans sessionStorage
        const updatedUser = { ...currentUser, email: newEmail };
        sessionStorage.setItem('emkai_user', JSON.stringify(updatedUser));

        // Notifier le parent si la fonction existe
        if (onUserUpdate) {
          onUserUpdate(updatedUser);
        }

        setToast({
          type: 'success',
          message: 'Email modifié avec succès'
        });

        setIsEditingEmail(false);
        setNewEmail('');
      } else {
        setToast({
          type: 'error',
          message: result.error
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification de l\'email:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de la modification de l\'email'
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Gérer la mise à jour du mot de passe
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({
        type: 'error',
        message: 'Veuillez remplir tous les champs'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({
        type: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    if (newPassword.length < 6) {
      setToast({
        type: 'error',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = updateUserPassword(currentUser.id, currentPassword, newPassword);

      if (result.success) {
        setToast({
          type: 'success',
          message: 'Mot de passe modifié avec succès'
        });

        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToast({
          type: 'error',
          message: result.error
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors de la modification du mot de passe:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de la modification du mot de passe'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="w-8 h-8 text-accent" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Réglages</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez vos préférences et connectez votre calendrier
        </p>
      </div>

      {/* Informations du compte */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informations du compte
        </h3>
        <div className="space-y-3">
          {/* Email - Modifiable */}
          <div className="py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Email</span>
              {!isEditingEmail && (
                <button
                  onClick={() => {
                    setIsEditingEmail(true);
                    setNewEmail(currentUser.email);
                  }}
                  className="text-accent hover:text-accent-dark flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Modifier</span>
                </button>
              )}
            </div>
            {isEditingEmail ? (
              <form onSubmit={handleUpdateEmail} className="space-y-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Nouvel email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdatingEmail ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail(false);
                      setNewEmail('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white">{currentUser.email}</span>
            )}
          </div>

          {/* Mot de passe - Modifiable */}
          <div className="py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Mot de passe</span>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="text-accent hover:text-accent-dark flex items-center space-x-1"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Modifier</span>
                </button>
              )}
            </div>
            {isEditingPassword ? (
              <form onSubmit={handleUpdatePassword} className="space-y-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdatingPassword ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <span className="font-medium text-gray-900 dark:text-white">••••••••</span>
            )}
          </div>

          {/* Rôle - Non modifiable */}
          <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Rôle</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentUser.role === 'manager'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                : 'bg-accent/20 dark:bg-accent/20 text-accent dark:text-accent'
            }`}>
              {currentUser.role}
            </span>
          </div>

          {/* Agence - Non modifiable */}
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600 dark:text-gray-400">Agence</span>
            <span className="font-medium text-gray-900 dark:text-white">{agency}</span>
          </div>
        </div>
      </div>

      {/* Connexion au calendrier */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calendrier connecté
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Connectez votre calendrier pour synchroniser automatiquement vos visites programmées
        </p>

        {/* Avertissement si aucun calendrier n'est connecté */}
        {!connectedCalendar && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Aucun calendrier connecté. Choisissez un calendrier ci-dessous.
            </p>
          </div>
        )}

        {/* Liste des calendriers disponibles */}
        <div className="space-y-3">
          {calendarOptions.map((calendar) => (
            <div
              key={calendar.id}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                connectedCalendar === calendar.id
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

      {/* Déconnexion */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compte
        </h3>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Se déconnecter</span>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Settings;
