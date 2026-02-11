import { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  MessageSquare,
  Users,
  Headphones,
  Calendar,
  BarChart3,
  Smartphone,
  Crown,
  Loader2,
  ArrowRight,
  CheckCircle,
  PartyPopper
} from 'lucide-react';
import { authApi } from '../services/authApi';

/**
 * Configuration des plans avec leurs caractéristiques
 */
const PLANS = {
  essentiel: {
    name: 'Essentiel',
    price: 142,
    color: 'blue',
    colorClasses: {
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      button: 'bg-blue-600 hover:bg-blue-700',
      highlight: 'border-blue-500/50',
      icon: 'text-blue-400'
    },
    features: [
      { icon: MessageSquare, text: '20 conversations/jour', included: true },
      { icon: Calendar, text: 'Disponible 6j/7', included: true },
      { icon: Smartphone, text: 'WhatsApp intégré', included: true },
      { icon: Users, text: '3 utilisateurs', included: true },
      { icon: Check, text: 'Synchronisation CRM', included: true },
      { icon: Calendar, text: 'Gmail/Outlook + Calendar', included: true },
      { icon: BarChart3, text: 'Dashboard KPIs', included: false, unlockKey: 'kpi' },
      { icon: Headphones, text: 'Support prioritaire', included: false, unlockKey: 'support' }
    ]
  },
  avance: {
    name: 'Avancé',
    price: 249,
    color: 'accent',
    colorClasses: {
      badge: 'bg-accent/20 text-accent border-accent/30',
      button: 'bg-accent hover:bg-accent-dark',
      highlight: 'border-accent/50',
      icon: 'text-accent'
    },
    features: [
      { icon: MessageSquare, text: '50 conversations/jour', included: true },
      { icon: Calendar, text: 'Disponible 6j/7', included: true },
      { icon: Smartphone, text: 'WhatsApp + SMS intégré', included: true },
      { icon: Users, text: '6 utilisateurs', included: true },
      { icon: Check, text: 'Synchronisation CRM', included: true },
      { icon: Calendar, text: 'Gmail/Outlook + Calendar', included: true },
      { icon: BarChart3, text: 'Dashboard KPIs', included: true, unlockKey: 'kpi' },
      { icon: Headphones, text: 'Support prioritaire', included: false, unlockKey: 'support' }
    ]
  },
  premium: {
    name: 'Premium',
    price: 439,
    color: 'purple',
    recommended: true,
    colorClasses: {
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      button: 'bg-purple-600 hover:bg-purple-700',
      highlight: 'border-purple-500/50 ring-2 ring-purple-500/20',
      icon: 'text-purple-400'
    },
    features: [
      { icon: MessageSquare, text: '100 conversations/jour', included: true },
      { icon: Calendar, text: 'Disponible 7j/7', included: true },
      { icon: Smartphone, text: 'WhatsApp + SMS intégré', included: true },
      { icon: Users, text: 'Utilisateurs illimités', included: true },
      { icon: Check, text: 'Synchronisation CRM', included: true },
      { icon: Calendar, text: 'Gmail/Outlook + Calendar', included: true },
      { icon: BarChart3, text: 'Dashboard KPIs', included: true, unlockKey: 'kpi' },
      { icon: Headphones, text: 'Support prioritaire', included: true, unlockKey: 'support' }
    ]
  }
};

// Ordre des plans pour comparaison
const PLAN_ORDER = ['essentiel', 'avance', 'premium'];

// Fonctionnalités débloquées avec description pour le mini-onboarding
const UNLOCKED_FEATURES = {
  kpi: {
    key: 'kpi',
    title: 'Dashboard Statistiques',
    description: 'Accédez à vos KPIs et analyses de performance',
    icon: BarChart3,
    navTarget: 'kpi',
    navLabel: 'Statistiques'
  },
  support: {
    key: 'support',
    title: 'Support Prioritaire',
    description: 'Bénéficiez d\'une assistance dédiée et prioritaire',
    icon: Headphones,
    navTarget: null,
    navLabel: null
  }
};

/**
 * Carte d'un plan
 */
function PlanCard({ planKey, plan, currentPlan, onSelect, isLoading, loadingPlan }) {
  const isCurrentPlan = currentPlan === planKey;
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  const thisPlanIndex = PLAN_ORDER.indexOf(planKey);
  const isUpgrade = thisPlanIndex > currentPlanIndex;
  const isDowngrade = thisPlanIndex < currentPlanIndex;
  const isLoadingThis = isLoading && loadingPlan === planKey;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-xl border-2 transition-all duration-200 ${
        isCurrentPlan
          ? 'bg-gray-800/50 border-gray-600'
          : `bg-dark-card hover:bg-gray-800/30 ${plan.colorClasses.highlight}`
      }`}
    >
      {/* Badge recommandé */}
      {plan.recommended && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Recommandé
          </span>
        </div>
      )}

      {/* Badge plan actuel */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
            Plan actuel
          </span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4 mt-2">
        <h3 className={`text-xl font-bold ${isCurrentPlan ? 'text-gray-400' : 'text-white'}`}>
          {plan.name}
        </h3>
        <div className="mt-2">
          <span className={`text-3xl font-bold ${isCurrentPlan ? 'text-gray-500' : 'text-white'}`}>
            {plan.price}€
          </span>
          <span className="text-gray-400 text-sm">/mois</span>
        </div>
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-5">
        {plan.features.map((feature, idx) => {
          return (
            <li
              key={idx}
              className={`flex items-center text-sm ${
                feature.included
                  ? isCurrentPlan
                    ? 'text-gray-400'
                    : 'text-gray-200'
                  : 'text-gray-600'
              }`}
            >
              {feature.included ? (
                <Check className={`w-4 h-4 mr-2 flex-shrink-0 ${isCurrentPlan ? 'text-gray-500' : plan.colorClasses.icon}`} />
              ) : (
                <X className="w-4 h-4 mr-2 flex-shrink-0 text-gray-700" />
              )}
              {feature.text}
            </li>
          );
        })}
      </ul>

      {/* Bouton */}
      {isCurrentPlan ? (
        <button
          disabled
          className="w-full py-2.5 px-4 rounded-lg bg-gray-700 text-gray-400 font-medium cursor-not-allowed"
        >
          Plan actuel
        </button>
      ) : (
        <button
          onClick={() => onSelect(planKey)}
          disabled={isLoading}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${plan.colorClasses.button}`}
        >
          {isLoadingThis ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changement...
            </>
          ) : (
            <>
              {isUpgrade ? 'Passer à ' : 'Changer pour '}
              {plan.name}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      )}

      {/* Info upgrade/downgrade */}
      {!isCurrentPlan && (
        <p className={`text-xs text-center mt-2 ${isUpgrade ? 'text-green-400' : 'text-orange-400'}`}>
          {isUpgrade ? '↑ Upgrade' : '↓ Downgrade'}
        </p>
      )}
    </div>
  );
}

/**
 * Écran de confirmation de succès avec mini-onboarding
 */
function SuccessScreen({ previousPlan, newPlan, unlockedFeatures, onNavigate, onClose }) {
  const newPlanConfig = PLANS[newPlan];

  return (
    <div className="text-center py-6">
      {/* Animation de succès */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <PartyPopper className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-bold text-white">Félicitations !</h2>
          <PartyPopper className="w-6 h-6 text-accent" />
        </div>
        <p className="text-gray-400">
          Vous êtes maintenant sur le plan{' '}
          <span className={`font-semibold ${newPlanConfig?.colorClasses?.icon || 'text-accent'}`}>
            {newPlanConfig?.name || newPlan}
          </span>
        </p>
      </div>

      {/* Nouvelles fonctionnalités débloquées */}
      {unlockedFeatures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Nouvelles fonctionnalités débloquées
          </h3>
          <div className="space-y-3">
            {unlockedFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="flex items-center p-4 bg-accent/10 border border-accent/30 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
                    <FeatureIcon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-white">{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                  {feature.navTarget && (
                    <button
                      onClick={() => {
                        onNavigate(feature.navTarget);
                        onClose();
                      }}
                      className="flex items-center px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg font-medium transition-colors"
                    >
                      Découvrir
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
      >
        Continuer
      </button>
    </div>
  );
}

/**
 * Modal de comparaison et upgrade des plans
 */
export default function PlanUpgradeModal({ isOpen, onClose, currentPlan, onNavigate, onPlanChanged }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [successState, setSuccessState] = useState(null); // { previousPlan, newPlan, unlockedFeatures }

  if (!isOpen) return null;

  // Calculer les fonctionnalités débloquées lors d'un upgrade
  const getUnlockedFeatures = (previousPlan, newPlan) => {
    const prevPlanConfig = PLANS[previousPlan];
    const newPlanConfig = PLANS[newPlan];

    if (!prevPlanConfig || !newPlanConfig) return [];

    const unlocked = [];
    newPlanConfig.features.forEach((newFeature) => {
      if (newFeature.included && newFeature.unlockKey) {
        // Vérifier si cette fonctionnalité n'était pas incluse avant
        const prevFeature = prevPlanConfig.features.find(
          (f) => f.unlockKey === newFeature.unlockKey
        );
        if (prevFeature && !prevFeature.included) {
          const featureInfo = UNLOCKED_FEATURES[newFeature.unlockKey];
          if (featureInfo) {
            unlocked.push(featureInfo);
          }
        }
      }
    });

    return unlocked;
  };

  const handleSelectPlan = async (planKey) => {
    if (planKey === currentPlan) return;

    try {
      setIsLoading(true);
      setLoadingPlan(planKey);
      setError(null);

      // Changer le plan via l'API
      const data = await authApi.createUpgradeSession(planKey);

      if (data.success) {
        // Calculer les fonctionnalités débloquées
        const unlockedFeatures = getUnlockedFeatures(currentPlan, planKey);

        // Afficher l'écran de succès
        setSuccessState({
          previousPlan: currentPlan,
          newPlan: planKey,
          unlockedFeatures
        });

        // Notifier le parent du changement de plan
        if (onPlanChanged) {
          onPlanChanged(planKey);
        }
      }
    } catch (err) {
      console.error('Erreur changement de plan:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  const handleClose = () => {
    setSuccessState(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${successState ? 'max-w-xl' : 'max-w-4xl'} bg-dark-bg rounded-2xl shadow-2xl border border-gray-800 overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                {successState ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Sparkles className="w-5 h-5 text-accent" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {successState ? 'Plan mis à jour' : 'Changer de plan'}
                </h2>
                <p className="text-sm text-gray-400">
                  {successState
                    ? 'Votre abonnement a été modifié avec succès'
                    : 'Choisissez le plan adapté à vos besoins'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6">
            {successState ? (
              <SuccessScreen
                previousPlan={successState.previousPlan}
                newPlan={successState.newPlan}
                unlockedFeatures={successState.unlockedFeatures}
                onNavigate={onNavigate}
                onClose={handleClose}
              />
            ) : (
              <>
                {/* Erreur */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PLAN_ORDER.map((planKey) => (
                    <PlanCard
                      key={planKey}
                      planKey={planKey}
                      plan={PLANS[planKey]}
                      currentPlan={currentPlan}
                      onSelect={handleSelectPlan}
                      isLoading={isLoading}
                      loadingPlan={loadingPlan}
                    />
                  ))}
                </div>

                {/* Note */}
                <p className="text-center text-xs text-gray-500 mt-6">
                  Le changement de plan prend effet immédiatement. Le prorata sera calculé automatiquement.
                </p>
              </>
            )}
          </div>

          {/* Footer - uniquement pour la sélection de plan */}
          {!successState && (
            <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                Tarifs excédents : WhatsApp 0,014€/msg - SMS 0,15€/SMS - Utilisateur supplémentaire 15€/mois
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
