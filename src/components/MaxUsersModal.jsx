import { useState } from 'react';
import { X, TrendingUp, UserPlus, Loader2, AlertTriangle } from 'lucide-react';
import { authApi } from '../services/authApi';

const PLAN_NAMES = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  avance: 'Avancé',
  premium: 'Premium'
};

export default function MaxUsersModal({
  isOpen,
  onClose,
  usersCount,
  usersLimit,
  plan,
  onUpgradePlan,
  onSeatAdded
}) {
  const [isAddingSeat, setIsAddingSeat] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAddExtraSeat = async () => {
    try {
      setIsAddingSeat(true);
      setError(null);
      const data = await authApi.addExtraSeat();
      if (data.success) {
        onSeatAdded(data.newMaxUsers);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAddingSeat(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Limite d'utilisateurs atteinte
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Votre plan <span className="font-semibold text-gray-900 dark:text-white">{PLAN_NAMES[plan] || plan}</span> est
          limité à {usersLimit} utilisateur{usersLimit > 1 ? 's' : ''}.
          Vous utilisez actuellement <span className="font-semibold">{usersCount}/{usersLimit}</span> place{usersLimit > 1 ? 's' : ''}.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3">
          {/* Option 1: Ajouter un siège */}
          <button
            onClick={handleAddExtraSeat}
            disabled={isAddingSeat}
            className="w-full flex items-center justify-between p-4 border-2 border-accent/30 rounded-xl hover:border-accent/60 hover:bg-accent/5 transition-all disabled:opacity-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Ajouter un siège</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+1 utilisateur supplémentaire</p>
              </div>
            </div>
            <div className="text-right">
              {isAddingSeat ? (
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
              ) : (
                <span className="text-accent font-semibold text-sm">15€/mois</span>
              )}
            </div>
          </button>

          {/* Option 2: Changer de plan */}
          {plan !== 'premium' && (
            <button
              onClick={onUpgradePlan}
              className="w-full flex items-center justify-between p-4 border-2 border-purple-500/30 rounded-xl hover:border-purple-500/60 hover:bg-purple-500/5 transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Changer de plan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Plus d'utilisateurs et de fonctionnalités</p>
                </div>
              </div>
              <span className="text-purple-400 font-semibold text-sm">Voir les plans</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
