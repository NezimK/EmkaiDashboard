import { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  Users,
  Calendar,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { authApi } from '../services/authApi';
import Toast from './Toast';
import PlanUpgradeModal from './PlanUpgradeModal';

/**
 * Noms des plans pour l'affichage
 */
const PLAN_NAMES = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  avance: 'Avancé',
  premium: 'Premium'
};

/**
 * Couleurs des badges selon le plan
 */
const PLAN_COLORS = {
  free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  essentiel: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  avance: 'bg-accent/20 text-accent border-accent/30',
  premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

/**
 * Icônes de statut d'abonnement
 */
const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-green-400', label: 'Actif' },
  past_due: { icon: AlertCircle, color: 'text-orange-400', label: 'Paiement en retard' },
  canceled: { icon: AlertCircle, color: 'text-red-400', label: 'Annulé' },
  trialing: { icon: Clock, color: 'text-blue-400', label: 'Période d\'essai' }
};

/**
 * Barre de progression avec pourcentage
 */
function ProgressBar({ current, max, label }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isUnlimited = max === -1;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-orange-400' : 'text-gray-300'}`}>
          {isUnlimited ? `${current} / Illimité` : `${current} / ${max}`}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-accent'
          }`}
          style={{ width: isUnlimited ? '10%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Section de gestion de l'abonnement dans Settings
 */
export default function SubscriptionSection({ onNavigate, onPlanChanged }) {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Charger les infos d'abonnement au montage
  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authApi.getSubscription();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Erreur chargement abonnement:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir le portail Stripe
  const handleOpenPortal = async () => {
    try {
      setIsPortalLoading(true);
      const data = await authApi.createPortalSession();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Erreur ouverture portail:', err);
      setToast({
        type: 'error',
        message: err.message || 'Impossible d\'ouvrir le portail de facturation'
      });
    } finally {
      setIsPortalLoading(false);
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm mb-6" data-onboarding="settings-subscription">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <span className="ml-2 text-gray-400">Chargement de l'abonnement...</span>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm mb-6" data-onboarding="settings-subscription">
        <div className="flex items-center text-red-400 py-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // Pas d'abonnement
  if (!subscription) {
    return null;
  }

  const plan = subscription.plan || 'free';
  const planName = PLAN_NAMES[plan] || plan;
  const planColor = PLAN_COLORS[plan] || PLAN_COLORS.free;
  const statusConfig = STATUS_CONFIG[subscription.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  // Formater la date de renouvellement
  const renewalDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div className="p-6 bg-white dark:bg-dark-card rounded-xl shadow-sm mb-6" data-onboarding="settings-subscription">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mon Abonnement
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez votre plan et votre facturation
            </p>
          </div>
        </div>

        {/* Badge du plan */}
        <div className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${planColor}`}>
          {planName}
        </div>
      </div>

      {/* Statut de l'abonnement */}
      <div className="flex items-center mb-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <StatusIcon className={`w-5 h-5 mr-2 ${statusConfig.color}`} />
        <span className={`text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
        {subscription.cancelAtPeriodEnd && (
          <span className="ml-2 text-xs text-orange-400">
            (Se termine le {renewalDate})
          </span>
        )}
      </div>

      {/* Barres de progression */}
      <div className="mb-6">
        <ProgressBar
          current={subscription.conversationsUsed}
          max={subscription.conversationsLimit}
          label="Conversations ce mois"
        />
        <ProgressBar
          current={subscription.usersCount}
          max={subscription.usersLimit}
          label="Membres de l'équipe"
        />
      </div>

      {/* Date de renouvellement */}
      {renewalDate && !subscription.cancelAtPeriodEnd && (
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Calendar className="w-4 h-4 mr-2" />
          Prochain renouvellement : {renewalDate}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-3">
        {subscription.hasStripeCustomer ? (
          <>
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="flex items-center px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Changer de plan
            </button>
            <button
              onClick={handleOpenPortal}
              disabled={isPortalLoading}
              className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPortalLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Gérer la facturation
            </button>
          </>
        ) : (
          <a
            href="https://www.emkai.fr/formules.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Souscrire à un plan
          </a>
        )}
      </div>

      {/* Modal de changement de plan */}
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          // Recharger les infos d'abonnement après fermeture
          loadSubscription();
        }}
        currentPlan={plan}
        onNavigate={onNavigate}
        onPlanChanged={(newPlan) => {
          // Mettre à jour le plan localement
          setSubscription(prev => prev ? { ...prev, plan: newPlan } : prev);
          // Notifier le parent
          if (onPlanChanged) {
            onPlanChanged(newPlan);
          }
        }}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
