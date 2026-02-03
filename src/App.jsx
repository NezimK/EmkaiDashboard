import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Cockpit from './components/Cockpit';
import HitList from './components/HitList';
import LeadCard from './components/LeadCard';
import LeadModal from './components/LeadModal';
import ConversationModal from './components/ConversationModal';
import ManagerView from './components/ManagerView';
import VisitsCalendar from './components/VisitsCalendar';
import Settings from './components/Settings';
import Login from './components/Login';
import FilterBar from './components/FilterBar';
import KpiStats from './components/KpiStats';
import RelanceView from './components/RelanceView';
import Onboarding from './components/Onboarding';
import NotificationPrompt from './components/NotificationPrompt';
import { fetchLeads, subscribeToLeads, unsubscribeFromLeads } from './services/supabase';
import { authApi, API_BASE_URL } from './services/authApi';
import { notifyNewLead, getNotificationPermission, getNotificationPreference } from './services/notifications';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [viewFilter, setViewFilter] = useState(null); // Filtre spécifique à chaque vue
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [setPasswordToken, setSetPasswordToken] = useState(null); // Token pour définir le mot de passe (invitation)
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('a_traiter'); // 'pre_qualification', 'a_traiter', 'en_decouverte', 'visites', 'relance', 'manager', 'settings'
  const [selectedLeadForInfo, setSelectedLeadForInfo] = useState(null); // Lead sélectionné pour la modal Info
  const [selectedLeadForConversation, setSelectedLeadForConversation] = useState(null); // Lead sélectionné pour la modal Conversation
  const [showOnboarding, setShowOnboarding] = useState(false); // Afficher l'onboarding
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Sidebar mobile
  const [accountType, setAccountType] = useState(null); // Type de compte (agence ou independant)

  // Calculer les KPIs depuis les leads en temps réel
  const getKPIs = () => {
    // Leads qualifiés = statut QUALIFIE, non en visite, non archivés
    const qualifiedLeads = leads.filter(lead =>
      lead.statut === "QUALIFIE" &&
      lead.statut !== "VISITE_PROGRAMMEE" &&
      !lead.date_visite &&
      lead.statut !== "ARCHIVE" &&
      (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
    );

    // Leads HOT/WARM/COLD parmi les qualifiés
    const leadsHot = qualifiedLeads.filter(lead => lead.score === "CHAUD").length;
    const leadsWarm = qualifiedLeads.filter(lead => lead.score === "TIEDE").length;
    const leadsCold = qualifiedLeads.filter(lead => lead.score === "FROID").length;

    // Leads en pré-qualification IA
    const leadsPreQualification = leads.filter(lead => lead.statut === "PRE_QUALIFICATION").length;

    return {
      leadsHot,
      leadsWarm,
      leadsCold,
      leadsPreQualification
    };
  };

  const kpis = getKPIs();

  // Charger les leads depuis Supabase avec real-time subscriptions
  useEffect(() => {
    // Ne charger les leads que si l'utilisateur est authentifié et a un client_id
    const clientId = currentUser?.client_id || currentUser?.agency;
    if (!isAuthenticated || !clientId) {
      setLoading(false);
      return;
    }

    let subscription = null;

    async function loadLeads() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchLeads(clientId);
        setLeads(data);
      } catch (err) {
        console.error('Erreur lors du chargement des leads:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Charger les leads initiaux
    loadLeads();

    // Configurer les subscriptions real-time (plus besoin de polling !)
    subscription = subscribeToLeads(clientId, {
      onInsert: (newLead) => {
        console.log('📥 Nouveau lead reçu en temps réel:', newLead.nom);
        setLeads(prevLeads => [newLead, ...prevLeads]);
        // Envoyer une notification push si activée
        if (getNotificationPermission() === 'granted' && getNotificationPreference()) {
          notifyNewLead(newLead);
        }
      },
      onUpdate: (updatedLead) => {
        console.log('📝 Lead mis à jour en temps réel:', updatedLead.nom);
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.id === updatedLead.id ? updatedLead : lead
          )
        );
        // Mettre à jour les modales ouvertes si nécessaire
        if (selectedLeadForInfo?.id === updatedLead.id) {
          setSelectedLeadForInfo(updatedLead);
        }
        if (selectedLeadForConversation?.id === updatedLead.id) {
          setSelectedLeadForConversation(updatedLead);
        }
      },
      onDelete: (deletedLeadId) => {
        console.log('🗑️ Lead supprimé en temps réel:', deletedLeadId);
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== deletedLeadId));
        // Fermer les modales si le lead supprimé était sélectionné
        if (selectedLeadForInfo?.id === deletedLeadId) {
          setSelectedLeadForInfo(null);
        }
        if (selectedLeadForConversation?.id === deletedLeadId) {
          setSelectedLeadForConversation(null);
        }
      },
    });

    // Cleanup: se désabonner quand le composant est démonté ou l'utilisateur change
    return () => {
      if (subscription) {
        unsubscribeFromLeads(subscription);
      }
    };
  }, [isAuthenticated, currentUser?.client_id, currentUser?.agency]);

  // Détecter si on est sur la page /set-password (invitation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const path = window.location.pathname;

    if (path === '/set-password' && token) {
      setSetPasswordToken(token);
      // Nettoyer l'URL sans recharger la page
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Vérifier si un utilisateur est déjà connecté via les tokens JWT
  useEffect(() => {
    const restoreSession = async () => {
      // Si on est en mode set-password, ne pas restaurer de session
      if (setPasswordToken) return;

      // Vérifier si des tokens sont stockés
      if (!authApi.loadStoredTokens()) {
        // Pas de tokens, essayer l'ancien format (migration)
        const savedUser = sessionStorage.getItem('emkai_user') || localStorage.getItem('emkai_user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            if (user && user.agency && user.email && user.name && user.role) {
              // Ancien format sans JWT - garder temporairement pour migration
              const userWithClientId = { ...user, client_id: user.tenant_id || user.agency };
              setCurrentUser(userWithClientId);
              setIsAuthenticated(true);
              console.log('⚠️ Session restaurée (ancien format, reconnexion recommandée)');
              return;
            }
          } catch (e) {
            console.warn('Erreur parsing session:', e);
          }
        }
        return;
      }

      // Tokens trouvés, valider avec l'API
      try {
        const user = await authApi.getCurrentUser();
        const userWithClientId = { ...user, client_id: user.tenant_id };

        setCurrentUser(userWithClientId);
        setIsAuthenticated(true);

        // Sauvegarder les infos utilisateur
        const userJSON = JSON.stringify(userWithClientId);
        sessionStorage.setItem('emkai_user', userJSON);

        console.log('✅ Session restaurée via JWT');
      } catch (error) {
        console.warn('Session expirée ou invalide:', error.message);
        // Nettoyer les tokens invalides
        authApi.clearTokens();
        sessionStorage.removeItem('emkai_user');
        localStorage.removeItem('emkai_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    restoreSession();
  }, []);

  // Gérer le dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(selectedFilter === filter ? null : filter);
  };

  const handleViewFilterChange = (filter) => {
    setViewFilter(filter);
  };

  // Réinitialiser le filtre de vue lors du changement de vue
  useEffect(() => {
    setViewFilter(null);
  }, [currentView]);

  const handleLogin = async (email, password, rememberMe = false) => {
    try {
      // Authentification via l'API backend (passe rememberMe pour le stockage des tokens)
      const user = await authApi.login(email, password, rememberMe);

      // Ajouter client_id comme alias de tenant_id pour compatibilité
      const userWithClientId = {
        ...user,
        client_id: user.tenant_id
      };

      setCurrentUser(userWithClientId);
      setIsAuthenticated(true);
      setLoginError('');

      const userJSON = JSON.stringify(userWithClientId);

      // Toujours sauvegarder dans sessionStorage (pour la session actuelle)
      sessionStorage.setItem('emkai_user', userJSON);

      // Si "Se souvenir de moi" est coché, sauvegarder aussi dans localStorage
      if (rememberMe) {
        localStorage.setItem('emkai_user', userJSON);
        console.log('✅ Session sauvegardée (connexion persistante)');
      } else {
        // Nettoyer localStorage si l'option n'est pas cochée
        localStorage.removeItem('emkai_user');
        console.log('✅ Session sauvegardée (session uniquement)');
      }

      // Vérifier si l'onboarding a déjà été complété pour cet utilisateur
      const onboardingKey = `onboarding_completed_${user.id}`;
      if (!localStorage.getItem(onboardingKey)) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setLoginError(error.message || 'Erreur de connexion');
    }
  };

  // Charger le type de compte du tenant
  useEffect(() => {
    const loadAccountType = async () => {
      if (!currentUser?.tenant_id) return;
      try {
        const response = await fetch(`/api/onboarding/tenant/${currentUser.tenant_id}`);
        const data = await response.json();
        if (data.success && data.tenant.account_type) {
          setAccountType(data.tenant.account_type);
        }
      } catch (error) {
        console.error('Erreur chargement account_type:', error);
      }
    };
    loadAccountType();
  }, [currentUser?.tenant_id]);

  // Handlers pour l'onboarding
  const handleOnboardingComplete = () => {
    if (currentUser?.id) {
      localStorage.setItem(`onboarding_completed_${currentUser.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    if (currentUser?.id) {
      localStorage.setItem(`onboarding_completed_${currentUser.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const handleRestartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleLogout = async () => {
    // Déconnexion via l'API (révocation du refresh token)
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    }

    // Nettoyage complet de la session
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedFilter(null);
    setCurrentView('a_traiter'); // Remettre sur la vue par défaut
    setLeads([]); // Vider les leads pour sécurité
    setSelectedLeadForInfo(null); // Fermer les modales
    setSelectedLeadForConversation(null);

    // Nettoyer sessionStorage ET localStorage
    sessionStorage.removeItem('emkai_user');
    localStorage.removeItem('emkai_user');

    // Ne pas supprimer rememberedEmail (pour pré-remplir le champ email)
    // localStorage.removeItem('rememberedEmail');
    // localStorage.removeItem('rememberMe');

    console.log('✅ Déconnexion réussie');
  };

  // Callback après définition du mot de passe (invitation)
  const handleSetPasswordSuccess = (user, tokens) => {
    // Stocker les tokens
    authApi.setTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn, true);

    // Configurer l'utilisateur
    const userWithClientId = {
      ...user,
      client_id: user.tenant_id
    };

    setCurrentUser(userWithClientId);
    setIsAuthenticated(true);
    setSetPasswordToken(null);

    // Sauvegarder
    const userJSON = JSON.stringify(userWithClientId);
    localStorage.setItem('emkai_user', userJSON);
    sessionStorage.setItem('emkai_user', userJSON);

    // Afficher l'onboarding pour le nouvel utilisateur
    setShowOnboarding(true);

    console.log('✅ Mot de passe défini, utilisateur connecté');
  };

  // Gérer la mise à jour d'un lead (par exemple après assignation)
  const handleLeadUpdate = (updatedLead) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    );
    // Mettre à jour également les leads sélectionnés dans les modales pour éviter leur fermeture
    if (selectedLeadForInfo && selectedLeadForInfo.id === updatedLead.id) {
      setSelectedLeadForInfo(updatedLead);
    }
    if (selectedLeadForConversation && selectedLeadForConversation.id === updatedLead.id) {
      setSelectedLeadForConversation(updatedLead);
    }
  };

  // Si non authentifié, afficher la page de login (ou set-password si invitation)
  if (!isAuthenticated) {
    return (
      <Login
        onLogin={handleLogin}
        error={loginError}
        setPasswordToken={setPasswordToken}
        onSetPasswordSuccess={handleSetPasswordSuccess}
        onCancelSetPassword={() => setSetPasswordToken(null)}
      />
    );
  }

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          {/* Logo IMMO animé */}
          <div className="relative mb-8">
            <div className="text-6xl font-bold text-white animate-pulse">
              <span className="text-accent">IMMO</span>
            </div>
            <div className="mt-2 text-sm tracking-widest text-accent/60 uppercase">
              Copilot
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto mb-6">
            <div className="h-full bg-gradient-to-r from-accent to-accent-dark animate-loading-bar"></div>
          </div>

          <p className="text-gray-400 text-sm animate-pulse">
            Connexion à votre base de données...
          </p>
        </div>
      </div>
    );
  }

  // Écran d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-dark-card rounded-2xl border border-red-500/20">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-2xl font-bold mb-4">Erreur de connexion</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="text-left bg-gray-900/50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-300 mb-2">Vérifiez :</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>✓ Votre connexion internet</li>
              <li>✓ La configuration Supabase (URL et clé)</li>
              <li>✓ Votre client_id est correct</li>
              <li>✓ Les permissions de la table leads</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent hover:bg-accent-dark text-black font-semibold rounded-lg transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Obtenir les leads de base pour la vue (sans appliquer viewFilter)
  const getBaseLeadsForView = () => {
    if (currentView === 'pre_qualification') {
      // VUE: PRÉ-QUALIFICATION IA - Leads en cours de qualification par l'IA (New, In_Progress)
      return leads.filter(lead => lead.statut === 'PRE_QUALIFICATION');
    } else if (currentView === 'a_traiter') {
      // VUE: À TRAITER - Leads QUALIFIÉS, filtrés par score via le Cockpit
      // EXCLURE les leads avec visite programmée ET ceux avec date_visite renseignée
      return leads.filter(lead =>
        lead.statut === 'QUALIFIE' &&
        lead.statut !== 'VISITE_PROGRAMMEE' &&
        !lead.date_visite &&
        (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
      );
    } else if (currentView === 'en_decouverte') {
      // VUE: EN DÉCOUVERTE - Leads pris en charge par un agent
      // Pour les agents : uniquement leurs dossiers
      // Pour les managers : tous les dossiers
      return leads.filter(lead => {
        const isEnDecouverte = lead.statut === 'EN_DECOUVERTE';
        const isManager = currentUser?.role === 'manager';
        const isAssignedToMe = lead.agent_en_charge === currentUser?.name;

        if (isEnDecouverte) return isManager || isAssignedToMe;
        return false;
      });
    } else if (currentView === 'visites') {
      // VUE 3: VISITES - Statut = "VISITE PROGRAMMÉE" OU présence d'une date_visite
      // Inclure tous les leads qui ont une visite programmée (par statut OU par date)
      return leads.filter(lead =>
        lead.statut === 'VISITE_PROGRAMMEE' || lead.date_visite
      );
    } else if (currentView === 'relance') {
      // VUE 4: RELANCE - Score = "TIÈDE" or "FROID"
      return leads.filter(lead =>
        lead.score === 'TIEDE' || lead.score === 'FROID'
      );
    } else if (currentView === 'archives') {
      // VUE 5: ARCHIVÉS - Statut = "ARCHIVE"
      return leads.filter(lead =>
        lead.statut === 'ARCHIVE'
      );
    } else if (currentView === 'manager') {
      // VUE 6: MANAGER - Tous les leads assignés (vue d'ensemble pour managers)
      return leads.filter(lead => lead.agent_en_charge);
    }
    return [];
  };

  // Filtrer les leads selon la vue active ET le filtre sélectionné
  const getFilteredLeads = () => {
    let baseLeads = getBaseLeadsForView();

    // Appliquer le filtre de vue si présent (pour la vue a_traiter via Cockpit)
    if (viewFilter) {
      if (currentView === 'a_traiter') {
        // Filtrer par score
        if (viewFilter === 'CHAUD' || viewFilter === 'TIEDE' || viewFilter === 'FROID') {
          baseLeads = baseLeads.filter(lead => lead.score === viewFilter);
        }
      } else if (currentView === 'relance') {
        // Filtrer par score dans "Relance"
        if (viewFilter === 'TIEDE' || viewFilter === 'FROID') {
          baseLeads = baseLeads.filter(lead => lead.score === viewFilter);
        }
      }
    }

    return baseLeads;
  };

  // Générer les filtres dynamiques selon la vue
  const getViewFilters = () => {
    const baseLeads = getBaseLeadsForView();

    if (currentView === 'relance') {
      return [
        {
          value: 'TIEDE',
          label: 'WARM',
          count: baseLeads.filter(l => l.score === 'TIEDE').length
        },
        {
          value: 'FROID',
          label: 'COLD',
          count: baseLeads.filter(l => l.score === 'FROID').length
        },
      ];
    }

    return [];
  };

  // Titre et description dynamique selon la vue
  const getViewInfo = () => {
    if (currentView === 'pre_qualification') {
      return {
        title: 'Pré-qualification IA',
        description: 'Leads en cours de qualification automatique par l\'IA'
      };
    } else if (currentView === 'a_traiter') {
      return {
        title: 'À Traiter',
        description: 'Prospects qualifiés prêts à être contactés'
      };
    } else if (currentView === 'en_decouverte') {
      return {
        title: 'En Découverte',
        description: 'Dossiers pris en charge par un agent'
      };
    } else if (currentView === 'visites') {
      return {
        title: 'Visites',
        description: 'Visites programmées avec les prospects'
      };
    } else if (currentView === 'relance') {
      return {
        title: 'Relance',
        description: 'Prospects à relancer (tièdes ou froids)'
      };
    } else if (currentView === 'archives') {
      return {
        title: 'Archivés',
        description: 'Prospects archivés et dossiers clôturés'
      };
    } else if (currentView === 'manager') {
      return {
        title: 'Vue Manager',
        description: 'Vue d\'ensemble des dossiers assignés par agent'
      };
    }
    return { title: '', description: '' };
  };

  const viewInfo = getViewInfo();
  const filteredLeads = getFilteredLeads();

  // Si authentifié, afficher le dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        currentUser={currentUser}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setIsMobileSidebarOpen(false); // Fermer la sidebar mobile après navigation
        }}
        currentUser={currentUser}
        accountType={accountType}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content avec padding left pour la sidebar (responsive) */}
      <main className="md:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'settings' ? (
          /* Vue Réglages */
          <Settings
            currentUser={currentUser}
            agency={currentUser?.agency}
            onLogout={handleLogout}
            onUserUpdate={setCurrentUser}
            onRestartOnboarding={handleRestartOnboarding}
          />
        ) : currentView === 'kpi' ? (
          /* Vue Statistiques KPI */
          <KpiStats leads={leads} />
        ) : currentView === 'a_traiter' ? (
          <>
            {/* Cockpit KPIs - uniquement sur la vue "À Traiter" */}
            <Cockpit kpis={kpis} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />

            {/* Hit List - Leads Qualifiés filtrés par score */}
            <HitList
              leads={leads}
              selectedFilter={selectedFilter}
              currentUser={currentUser}
              onLeadUpdate={handleLeadUpdate}
              onOpenInfoModal={setSelectedLeadForInfo}
              onOpenConversationModal={setSelectedLeadForConversation}
              agency={currentUser?.agency}
            />
          </>
        ) : currentView === 'pre_qualification' ? (
          <>
            {/* En-tête pour la vue Pré-qualification IA */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewInfo.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{viewInfo.description}</p>
            </div>

            {/* Liste des leads en pré-qualification */}
            {filteredLeads.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    currentUser={currentUser}
                    onLeadUpdate={handleLeadUpdate}
                    onOpenInfoModal={setSelectedLeadForInfo}
                    onOpenConversationModal={setSelectedLeadForConversation}
                    showLastMessage={true}
                    agency={currentUser?.agency}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun lead en pré-qualification IA pour le moment
                </p>
              </div>
            )}
          </>
        ) : currentView === 'manager' ? (
          <>
            {/* En-tête pour la vue Manager */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewInfo.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{viewInfo.description}</p>
            </div>

            {/* Vue Manager - Groupement par agent */}
            <ManagerView
              leads={filteredLeads}
              currentUser={currentUser}
              onLeadUpdate={handleLeadUpdate}
              onOpenInfoModal={setSelectedLeadForInfo}
              onOpenConversationModal={setSelectedLeadForConversation}
              agency={currentUser?.agency}
            />
          </>
        ) : (
          <>
            {/* En-tête pour les autres vues */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{viewInfo.title}</h2>
              <p className="text-gray-600 dark:text-gray-400">{viewInfo.description}</p>
            </div>

            {/* FilterBar - Afficher uniquement si des filtres existent pour cette vue */}
            {getViewFilters().length > 0 && (
              <FilterBar
                filters={getViewFilters()}
                selectedFilter={viewFilter}
                onFilterChange={handleViewFilterChange}
              />
            )}

            {/* Vue spéciale pour les visites avec calendrier */}
            {currentView === 'visites' ? (
              <VisitsCalendar
                leads={filteredLeads}
                currentUser={currentUser}
                onLeadUpdate={handleLeadUpdate}
                onOpenInfoModal={setSelectedLeadForInfo}
                onOpenConversationModal={setSelectedLeadForConversation}
                agency={currentUser?.agency}
              />
            ) : currentView === 'relance' ? (
              /* Vue spéciale pour les relances */
              <RelanceView
                leads={leads}
                currentUser={currentUser}
                onOpenConversationModal={setSelectedLeadForConversation}
                agency={currentUser?.agency}
              />
            ) : (
              /* Liste des prospects filtrés selon la vue */
              <>
                {filteredLeads.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        currentUser={currentUser}
                        onLeadUpdate={handleLeadUpdate}
                        onOpenInfoModal={setSelectedLeadForInfo}
                        onOpenConversationModal={setSelectedLeadForConversation}
                        showLastMessage={currentView === 'en_decouverte'}
                        agency={currentUser?.agency}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucun prospect dans cette vue pour le moment
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Modales globales - Ne se ferment pas quand le lead change de catégorie */}
      {selectedLeadForInfo && (
        <LeadModal
          lead={selectedLeadForInfo}
          onClose={() => setSelectedLeadForInfo(null)}
          currentUser={currentUser}
          onLeadUpdate={handleLeadUpdate}
          agency={currentUser?.agency}
        />
      )}

      {selectedLeadForConversation && (
        <ConversationModal
          lead={selectedLeadForConversation}
          onClose={() => setSelectedLeadForConversation(null)}
          currentUser={currentUser}
          onLeadUpdate={handleLeadUpdate}
          agency={currentUser?.agency}
        />
      )}

      {/* Onboarding modal */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        onNavigate={setCurrentView}
        currentUser={currentUser}
      />

      {/* Prompt pour activer les notifications */}
      <NotificationPrompt />
    </div>
  );
}

export default App;
