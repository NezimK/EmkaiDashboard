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
import { fetchLeads, subscribeToLeads, unsubscribeFromLeads } from './services/supabase';
import { validateLogin } from './data/users';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [viewFilter, setViewFilter] = useState(null); // Filtre spécifique à chaque vue
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('a_traiter'); // 'a_traiter', 'en_cours', 'visites', 'relance', 'manager', 'settings'
  const [selectedLeadForInfo, setSelectedLeadForInfo] = useState(null); // Lead sélectionné pour la modal Info
  const [selectedLeadForConversation, setSelectedLeadForConversation] = useState(null); // Lead sélectionné pour la modal Conversation

  // Calculer les KPIs depuis les leads en temps réel
  const getKPIs = () => {
    // Les leads Chauds/Tièdes/Froids = seulement les NON en cours, NON en découverte, NON visite programmée
    // ET qui ne sont pas assignés à d'autres agents
    const nonContactedLeads = leads.filter(lead =>
      lead.statut !== "EN_COURS" &&
      lead.statut !== "EN_DECOUVERTE" &&
      lead.statut !== "VISITE_PROGRAMMEE" && // Exclure les visites programmées
      !lead.date_visite && // Exclure aussi par la date de visite
      lead.statut !== "ARCHIVE" && // Exclure les archivés
      (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
    );
    const leadsChauds = nonContactedLeads.filter(lead => lead.score === "CHAUD").length;
    const leadsTiedes = nonContactedLeads.filter(lead => lead.score === "TIEDE").length;
    const leadsFroids = nonContactedLeads.filter(lead => lead.score === "FROID").length;

    // Leads En cours = statut "EN_COURS" (déjà mappé depuis "En-cours" ou "En_cours" par supabase.js)
    const leadsEnCoursFiltered = leads.filter(lead => lead.statut === "EN_COURS");
    const leadsEnCours = leadsEnCoursFiltered.length;

    return {
      leadsChauds,
      leadsTiedes,
      leadsFroids,
      leadsEnCours
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

  // Vérifier si un utilisateur est déjà connecté (sessionStorage ou localStorage)
  // sessionStorage : garde la session pendant les rafraîchissements, mais déconnecte à la fermeture du navigateur
  // localStorage : garde la session même après fermeture du navigateur (si "Se souvenir de moi")
  useEffect(() => {
    // D'abord vérifier sessionStorage (prioritaire)
    let savedUser = sessionStorage.getItem('emkai_user');
    let storageType = 'session';

    // Si pas de session, vérifier localStorage (connexion persistante)
    if (!savedUser) {
      savedUser = localStorage.getItem('emkai_user');
      storageType = 'local';
    }

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        // Validation de sécurité : vérifier que l'utilisateur a tous les champs requis
        if (user && user.agency && user.agencyName && user.email && user.name && user.role) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          console.log(`✅ Session restaurée depuis ${storageType}Storage`);

          // Si restauré depuis localStorage, copier aussi dans sessionStorage pour cette session
          if (storageType === 'local') {
            sessionStorage.setItem('emkai_user', savedUser);
          }
        } else {
          // Si les données sont incomplètes, forcer la déconnexion
          console.warn('Session invalide : données utilisateur incomplètes');
          sessionStorage.removeItem('emkai_user');
          localStorage.removeItem('emkai_user');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la lecture de la session:', error);
        sessionStorage.removeItem('emkai_user');
        localStorage.removeItem('emkai_user');
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }
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

  const handleLogin = (email, password, rememberMe = false) => {
    const result = validateLogin(email, password);

    if (result.success) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setLoginError('');

      const userJSON = JSON.stringify(result.user);

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
    } else {
      setLoginError(result.error);
    }
  };

  const handleLogout = () => {
    // Nettoyage complet de la session
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedFilter(null);
    setCurrentView('a_traiter'); // Remettre sur la vue "À Traiter"
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

  // Si non authentifié, afficher la page de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={loginError} />;
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
    if (currentView === 'a_traiter') {
      // VUE 1: À TRAITER - Statut = "QUALIFIE" AND (Agent = null OR Agent = Moi)
      // EXCLURE les leads avec visite programmée ET ceux avec date_visite renseignée
      return leads.filter(lead =>
        lead.statut === 'QUALIFIE' &&
        lead.statut !== 'VISITE_PROGRAMMEE' && // Exclure explicitement les visites programmées
        !lead.date_visite && // Exclure aussi par la présence d'une date de visite
        (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
      );
    } else if (currentView === 'en_cours') {
      // VUE 2: EN DÉCOUVERTE - Statut = "CONTACTÉ" or "EN DÉCOUVERTE"
      // Pour les agents : uniquement leurs dossiers (Agent = Moi)
      // Pour les managers : tous les dossiers en découverte
      return leads.filter(lead => {
        const hasCorrectStatus = lead.statut === 'EN_DECOUVERTE';
        const isManager = currentUser?.role === 'manager';
        const isAssignedToMe = lead.agent_en_charge === currentUser?.name;

        return hasCorrectStatus && (isManager || isAssignedToMe);
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

    // Appliquer le filtre de vue si présent
    if (viewFilter) {
      if (currentView === 'en_cours') {
        // Filtrer par score uniquement
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

    if (currentView === 'en_cours') {
      return [
        {
          value: 'CHAUD',
          label: 'Chaud',
          count: baseLeads.filter(l => l.score === 'CHAUD').length
        },
        {
          value: 'TIEDE',
          label: 'Tiède',
          count: baseLeads.filter(l => l.score === 'TIEDE').length
        },
        {
          value: 'FROID',
          label: 'Froid',
          count: baseLeads.filter(l => l.score === 'FROID').length
        },
      ];
    } else if (currentView === 'relance') {
      return [
        {
          value: 'TIEDE',
          label: 'Tiède',
          count: baseLeads.filter(l => l.score === 'TIEDE').length
        },
        {
          value: 'FROID',
          label: 'Froid',
          count: baseLeads.filter(l => l.score === 'FROID').length
        },
      ];
    }

    return [];
  };

  // Titre et description dynamique selon la vue
  const getViewInfo = () => {
    if (currentView === 'a_traiter') {
      return {
        title: 'À Traiter',
        description: 'Prospects qualifiés prêts à être contactés'
      };
    } else if (currentView === 'en_cours') {
      return {
        title: 'En Découverte',
        description: 'Prospects en cours de qualification'
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
      />

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
      />

      {/* Main content avec padding left pour la sidebar */}
      <main className="ml-64 px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'settings' ? (
          /* Vue Réglages */
          <Settings
            currentUser={currentUser}
            agency={currentUser?.agency}
            onLogout={handleLogout}
            onUserUpdate={setCurrentUser}
          />
        ) : currentView === 'kpi' ? (
          /* Vue Statistiques KPI */
          <KpiStats leads={leads} />
        ) : currentView === 'a_traiter' ? (
          <>
            {/* Cockpit KPIs - uniquement sur la vue "À Traiter" */}
            <Cockpit kpis={kpis} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />

            {/* Hit List - Leads Qualifiés (Non contactés) */}
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
                        showLastMessage={currentView === 'en_cours'}
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
    </div>
  );
}

export default App;
