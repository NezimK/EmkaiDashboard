import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  Bot,
  FolderOpen,
  Users,
  Calendar,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus
} from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    type: 'modal',
    target: null,
    navigateTo: null,
    description: 'Bienvenue sur IMMO Copilot ! Découvrez les fonctionnalités principales en quelques étapes.',
    icon: Sparkles,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    tooltipPosition: 'center',
    isWelcome: true // Pour doubler la taille
  },
  {
    id: 'prequalification',
    type: 'spotlight',
    target: '[data-onboarding="nav-prequalification"]',
    navigateTo: 'pre_qualification',
    description: 'Regardez en direct notre IA pré-qualifier vos prospects. Reprenez le contrôle de la conversation à tout moment.',
    icon: Bot,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-400/10',
    tooltipPosition: 'right'
  },
  {
    id: 'dossiers',
    type: 'spotlight',
    target: '[data-onboarding="nav-dossiers"]',
    navigateTo: 'a_traiter',
    description: 'Retrouvez ici tous les dossiers pris en charge, classés par niveau de maturité.',
    icon: FolderOpen,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    tooltipPosition: 'right'
  },
  {
    id: 'decouverte',
    type: 'spotlight',
    target: '[data-onboarding="nav-decouverte"]',
    navigateTo: 'en_decouverte',
    description: 'Suivez vos prospects en cours de traitement. Accédez à leurs conversations et historique en un clic.',
    icon: Users,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/10',
    tooltipPosition: 'right'
  },
  {
    id: 'visites',
    type: 'spotlight',
    target: '[data-onboarding="nav-visites"]',
    navigateTo: 'visites',
    description: 'Planifiez vos visites avec le calendrier intégré. Synchronisez avec Google Calendar ou Outlook.',
    icon: Calendar,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-400/10',
    tooltipPosition: 'right'
  },
  {
    id: 'calendrier',
    type: 'spotlight',
    target: '[data-onboarding="settings-calendar"]',
    navigateTo: 'settings',
    settingsTab: 'integrations',
    description: 'Connectez votre calendrier Google ou Outlook pour synchroniser automatiquement vos visites.',
    icon: Calendar,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-400/10',
    tooltipPosition: 'right'
  },
  {
    id: 'invite-agents',
    type: 'spotlight',
    target: '[data-onboarding="settings-team"]',
    navigateTo: 'settings',
    settingsTab: 'abonnement',
    description: 'Invitez vos agents pour qu\'ils puissent accéder à leurs dossiers et gérer leurs leads.',
    icon: UserPlus,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-400/10',
    tooltipPosition: 'left'
  },
  {
    id: 'ready',
    type: 'modal',
    target: null,
    navigateTo: 'a_traiter', // Naviguer vers "Dossiers à traiter" à la fin
    description: "Vous êtes prêt ! Explorez le dashboard et gérez vos prospects comme un pro.",
    icon: Rocket,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
    tooltipPosition: 'center',
    isWelcome: true // Même taille que la première étape
  }
];

// Overlay sombre complet (bloque tous les clics)
function FullOverlay({ targetRect, padding = 8, highlightElement }) {
  // Ajouter la classe de mise en évidence à l'élément ciblé
  useEffect(() => {
    if (highlightElement) {
      const element = document.querySelector(highlightElement);
      if (element) {
        element.classList.add('onboarding-highlight');
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [highlightElement]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto">
      {/* Fond sombre uniforme - seulement quand pas de spotlight */}
      {!targetRect && <div className="absolute inset-0 bg-black/60" />}

      {/* Spotlight avec boxShadow qui fait l'ombre autour */}
      {targetRect && (
        <div
          className="absolute rounded-xl border-2 border-accent z-10"
          style={{
            top: targetRect.y - padding,
            left: targetRect.x - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.60), 0 0 20px 4px rgba(212, 175, 55, 0.4)'
          }}
        />
      )}
    </div>
  );
}

// Calcul de la position de la tooltip
function getTooltipStyle(targetRect, position) {
  if (!targetRect || position === 'center') {
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }

  const gap = 16;
  const tooltipWidth = 280;
  const viewportWidth = window.innerWidth;

  switch (position) {
    case 'right': {
      let left = targetRect.right + gap;
      let top = targetRect.top + targetRect.height / 2;

      // Si la tooltip dépasse à droite, la placer en dessous
      if (left + tooltipWidth > viewportWidth - 20) {
        return {
          position: 'fixed',
          top: `${targetRect.bottom + gap}px`,
          left: `${Math.max(20, targetRect.left)}px`,
          transform: 'translateY(0)'
        };
      }

      return {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translateY(-50%)'
      };
    }
    case 'left': {
      const tooltipRight = targetRect.left - gap;
      const top = targetRect.top + targetRect.height / 2;

      // Si la tooltip dépasse à gauche, la placer en dessous
      if (tooltipRight - tooltipWidth < 20) {
        return {
          position: 'fixed',
          top: `${targetRect.bottom + gap}px`,
          left: `${Math.max(20, targetRect.left)}px`,
          transform: 'translateY(0)'
        };
      }

      return {
        position: 'fixed',
        top: `${top}px`,
        left: `${tooltipRight}px`,
        transform: 'translate(-100%, -50%)'
      };
    }
    case 'bottom': {
      return {
        position: 'fixed',
        top: `${targetRect.bottom + gap}px`,
        left: `${targetRect.left + targetRect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
    }
    default:
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
  }
}

// Flèche directionnelle
function TooltipArrow({ position, targetRect }) {
  if (!targetRect || position === 'center') return null;

  if (position === 'right') {
    return (
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
        style={{ marginLeft: '-2px' }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid #1A1A1A'
          }}
        />
      </div>
    );
  }

  if (position === 'left') {
    return (
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
        style={{ marginRight: '-2px' }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '6px solid #1A1A1A'
          }}
        />
      </div>
    );
  }

  return null;
}

// Lock/unlock scroll on html+body
function lockScroll() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function unlockScroll() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

export default function Onboarding({ isOpen, onComplete, onSkip, onNavigate, onSettingsTabChange, currentUser, accountType }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const scrollTimerRef = useRef(null);

  // Filtrer les étapes selon le type de compte et le rôle
  // L'étape "invite-agents" est exclue pour les indépendants et les agents
  const filteredSteps = ONBOARDING_STEPS.filter(step => {
    if (step.id === 'invite-agents') {
      // Exclure pour les indépendants
      if (accountType === 'independant') return false;
      // Exclure pour les agents (seuls managers/admins peuvent inviter)
      if (currentUser?.role === 'agent') return false;
    }
    return true;
  });

  const step = filteredSteps[currentStep];

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Lock scroll when onboarding is open
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen]);

  // Navigate to the corresponding view when step changes
  useEffect(() => {
    if (!isOpen || !onNavigate || !step) return;

    if (step.navigateTo) {
      onNavigate(step.navigateTo);
    }
    // Switch settings tab if the step targets a specific tab
    if (step.settingsTab && onSettingsTabChange) {
      onSettingsTabChange(step.settingsTab);
    }
  }, [isOpen, currentStep, step?.navigateTo, step?.settingsTab, onNavigate, onSettingsTabChange]);

  // Update target position and scroll to target
  useEffect(() => {
    if (!isOpen || !step) return;

    const updatePosition = () => {
      if (step.target) {
        const element = document.querySelector(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    // Scroll to target: unlock scroll, use native scrollIntoView, re-lock
    const scrollToTarget = () => {
      if (!step.target) {
        updatePosition();
        return;
      }

      const element = document.querySelector(step.target);
      if (!element) {
        updatePosition();
        return;
      }

      // Temporarily unlock, let the browser scroll to the element, re-lock
      unlockScroll();
      element.scrollIntoView({ behavior: 'auto', block: 'center' });
      requestAnimationFrame(() => {
        lockScroll();
        updatePosition();
      });
    };

    // For steps targeting elements inside Settings tabs, the element may not be
    // in the DOM yet (tab switch + React re-render is async). Poll until found.
    let pollTimer = null;
    let pollCount = 0;
    const maxPolls = 20; // 20 * 100ms = 2s max polling

    const waitForElementAndScroll = () => {
      if (!step.target) {
        scrollToTarget();
        return;
      }

      const element = document.querySelector(step.target);
      if (element) {
        scrollToTarget();
        return;
      }

      // Element not found yet, poll
      if (pollCount < maxPolls) {
        pollCount++;
        pollTimer = setTimeout(waitForElementAndScroll, 100);
      }
    };

    // Initial scroll after navigation/render
    const timer = setTimeout(waitForElementAndScroll, 150);
    scrollTimerRef.current = timer;

    // For steps on Settings page, async sections (SubscriptionSection, TeamManagement)
    // change the layout height after their API calls complete. Use MutationObserver
    // to re-scroll whenever the DOM subtree changes (e.g. loader replaced by content).
    let observer = null;
    let debounceTimer = null;
    if (step.target) {
      let settled = false;
      const stopTimer = setTimeout(() => {
        settled = true;
        if (observer) observer.disconnect();
      }, 4000);

      observer = new MutationObserver(() => {
        if (settled) return;
        // Debounce: batch rapid DOM mutations into a single re-scroll
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scrollToTarget, 100);
      });

      // Only observe <main> childList changes, not attributes (avoids overflow style loops)
      const mainEl = document.querySelector('main');
      if (mainEl) {
        observer.observe(mainEl, { childList: true, subtree: true, attributes: false });
      }

      scrollTimerRef.current = stopTimer;
    }

    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      clearTimeout(pollTimer);
      clearTimeout(debounceTimer);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, step?.target, currentStep]);

  const nextStep = useCallback(() => {
    if (isAnimating) return;

    if (currentStep < filteredSteps.length - 1) {
      setIsAnimating(true);
      setCurrentStep(prev => prev + 1);
      setTimeout(() => setIsAnimating(false), 200);
    } else {
      onComplete();
    }
  }, [currentStep, isAnimating, onComplete, filteredSteps.length]);

  const prevStep = useCallback(() => {
    if (isAnimating || currentStep === 0) return;

    setIsAnimating(true);
    setCurrentStep(prev => prev - 1);
    setTimeout(() => setIsAnimating(false), 200);
  }, [currentStep, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextStep, prevStep, onSkip]);

  if (!isOpen || !step) return null;

  const Icon = step.icon;
  const isLastStep = currentStep === filteredSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const transitionClass = prefersReducedMotion
    ? ''
    : 'transition-all duration-200 ease-out';

  const tooltipStyle = getTooltipStyle(targetRect, step.tooltipPosition);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-description"
    >
      {/* Overlay complet qui bloque les clics */}
      <FullOverlay targetRect={targetRect} padding={8} highlightElement={step.target} />

      {/* Tooltip - taille adaptée */}
      <div
        style={tooltipStyle}
        className={`
          relative z-50 w-96 bg-dark-card border border-gray-800 rounded-xl
          shadow-2xl overflow-visible ${transitionClass}
          ${prefersReducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-200'}
        `}
      >
        {/* Flèche directionnelle */}
        <TooltipArrow position={step.tooltipPosition} targetRect={targetRect} />

        {/* Close button - avec plus d'espace */}
        <button
          onClick={onSkip}
          className={`
            absolute top-3 right-3 p-1.5 rounded-lg text-gray-500
            hover:text-gray-300 hover:bg-gray-800/50 ${transitionClass}
            focus:outline-none focus:ring-2 focus:ring-accent z-10
          `}
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content - taille adaptée selon le type */}
        <div className={step.isWelcome ? 'p-6' : 'p-4 pr-10'}>
          {/* Icon + Description */}
          <div className={`flex gap-3 ${step.isWelcome ? 'mb-4 flex-col items-center text-center' : 'mb-3'}`}>
            <div
              className={`
                ${step.isWelcome ? 'w-14 h-14' : 'w-9 h-9'} rounded-lg flex items-center justify-center flex-shrink-0
                ${step.iconBg}
              `}
            >
              <Icon className={`${step.isWelcome ? 'w-8 h-8' : 'w-5 h-5'} ${step.iconColor}`} />
            </div>
            <p
              id="onboarding-description"
              className={`text-gray-300 leading-relaxed ${step.isWelcome ? 'text-base' : 'text-sm'}`}
            >
              {step.description}
            </p>
          </div>

          {/* Progress + Navigation */}
          <div className="flex items-center justify-between">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {filteredSteps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    h-1.5 rounded-full ${transitionClass}
                    ${index === currentStep
                      ? 'bg-accent w-3'
                      : 'bg-gray-700 w-1.5'
                    }
                  `}
                />
              ))}
              <span className="text-[10px] text-gray-500 ml-1.5">
                {currentStep + 1}/{filteredSteps.length}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-1">
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className={`
                    p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 ${transitionClass}
                    focus:outline-none focus:ring-2 focus:ring-accent
                  `}
                  aria-label="Précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={nextStep}
                className={`
                  px-2.5 py-1 rounded-lg text-xs font-medium ${transitionClass}
                  bg-accent hover:bg-accent-dark text-black
                  focus:outline-none focus:ring-2 focus:ring-accent
                `}
              >
                <span className="flex items-center gap-0.5">
                  {isLastStep ? 'Terminer' : 'Suivant'}
                  {!isLastStep && <ChevronRight className="w-3 h-3" />}
                </span>
              </button>
            </div>
          </div>

          {/* Lien pour passer le tutoriel */}
          {!isLastStep && (
            <div className="mt-3 text-center">
              <button
                onClick={onSkip}
                className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
              >
                Passer le tutoriel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
