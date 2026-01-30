import { useState, useEffect } from 'react';
import { Users, UserPlus, MoreVertical, Mail, RefreshCw, UserX, X } from 'lucide-react';
import { authApi } from '../services/authApi';

const TeamManagement = ({ currentUser, onToast }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // État du formulaire d'invitation
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });
  const [isInviting, setIsInviting] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authApi.fetchUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      onToast?.({ type: 'error', message: 'Erreur lors du chargement des utilisateurs' });
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer une invitation
  const handleInvite = async (e) => {
    e.preventDefault();

    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      onToast?.({ type: 'error', message: 'Veuillez remplir tous les champs' });
      return;
    }

    setIsInviting(true);
    try {
      await authApi.createUser({
        email: inviteForm.email,
        firstName: inviteForm.firstName,
        lastName: inviteForm.lastName,
        role: 'agent' // Les managers ne peuvent créer que des agents
      });

      onToast?.({ type: 'success', message: 'Invitation envoyée avec succès' });
      setShowInviteModal(false);
      setInviteForm({ email: '', firstName: '', lastName: '' });
      loadUsers();
    } catch (error) {
      console.error('Erreur invitation:', error);
      onToast?.({ type: 'error', message: error.message || 'Erreur lors de l\'envoi de l\'invitation' });
    } finally {
      setIsInviting(false);
    }
  };

  // Désactiver/réactiver un utilisateur
  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await authApi.deactivateUser(user.id);
        onToast?.({ type: 'success', message: `${user.firstName} a été désactivé` });
      } else {
        await authApi.updateUser(user.id, { isActive: true });
        onToast?.({ type: 'success', message: `${user.firstName} a été réactivé` });
      }
      setActiveDropdown(null);
      loadUsers();
    } catch (error) {
      console.error('Erreur toggle active:', error);
      onToast?.({ type: 'error', message: error.message });
    }
  };

  // Renvoyer l'invitation
  const handleResendInvite = async (user) => {
    try {
      await authApi.resetUserPassword(user.id);
      onToast?.({ type: 'success', message: `Invitation renvoyée à ${user.email}` });
      setActiveDropdown(null);
    } catch (error) {
      console.error('Erreur resend invite:', error);
      onToast?.({ type: 'error', message: error.message });
    }
  };

  // Obtenir les initiales d'un utilisateur
  const getInitials = (user) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  return (
    <div>
      {/* Header avec bouton d'invitation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestion de l'équipe
          </h3>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" />
          <span>Inviter un agent</span>
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Gérez les membres de votre équipe. Les agents invités recevront un email pour créer leur compte.
      </p>

      {/* Liste des utilisateurs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucun membre dans l'équipe pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                user.isActive
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
              }`}
            >
              {/* Avatar et infos */}
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  user.role === 'manager' ? 'bg-purple-500' : 'bg-accent'
                }`}>
                  {getInitials(user)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    {user.id === currentUser.id && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">(vous)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>

              {/* Badges et actions */}
              <div className="flex items-center space-x-3">
                {/* Badge de rôle */}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'manager'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-accent/20 text-accent'
                }`}>
                  {user.role}
                </span>

                {/* Badge de statut */}
                {!user.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    Inactif
                  </span>
                )}

                {user.requiresPasswordSetup && (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                    En attente
                  </span>
                )}

                {/* Menu d'actions - pas pour soi-même */}
                {user.id !== currentUser.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Dropdown menu */}
                    {activeDropdown === user.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        <button
                          onClick={() => handleResendInvite(user)}
                          className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Renvoyer l'invitation</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`w-full flex items-center space-x-2 px-4 py-2 text-left ${
                            user.isActive
                              ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          <UserX className="w-4 h-4" />
                          <span>{user.isActive ? 'Désactiver' : 'Réactiver'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Inviter un nouvel agent
              </h4>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ email: '', firstName: '', lastName: '' });
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="agent@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder="Jean"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder="Dupont"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                L'agent recevra un email pour créer son mot de passe et accéder au dashboard.
              </p>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteForm({ email: '', firstName: '', lastName: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isInviting ? 'Envoi...' : 'Envoyer l\'invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
