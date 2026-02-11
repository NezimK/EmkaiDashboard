import React, { useState } from 'react';
import { Mail, Lock, Edit2, LogOut } from 'lucide-react';
import { authApi } from '../../services/authApi';

const AccountSection = ({ currentUser, agency, onLogout, onUserUpdate, setToast }) => {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    if (!newEmail || !emailPassword) {
      setToast({ type: 'error', message: 'Veuillez remplir tous les champs' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setToast({ type: 'error', message: 'Veuillez entrer un email valide' });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      const result = await authApi.updateEmail(newEmail, emailPassword);

      if (onUserUpdate && result.user) {
        onUserUpdate({ ...currentUser, email: result.user.email });
      }

      const userDataString = sessionStorage.getItem('emkai_user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        userData.email = result.user.email;
        sessionStorage.setItem('emkai_user', JSON.stringify(userData));
      }

      setToast({ type: 'success', message: 'Email mis à jour avec succès' });
      setIsEditingEmail(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      setToast({ type: 'error', message: error.message || 'Erreur lors de la mise à jour de l\'email' });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ type: 'error', message: 'Veuillez remplir tous les champs' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 8) {
      setToast({ type: 'error', message: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);

      setToast({ type: 'success', message: 'Mot de passe modifié avec succès' });
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe:', error);
      setToast({ type: 'error', message: error.message || 'Erreur lors de la modification du mot de passe' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
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
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Nouvel email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Mot de passe actuel (confirmation)"
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
                      setEmailPassword('');
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
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentUser.role === 'manager'
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
    </>
  );
};

export default AccountSection;
