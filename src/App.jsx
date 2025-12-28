import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Cockpit from './components/Cockpit';
import HitList from './components/HitList';
import ContactedLeads from './components/ContactedLeads';
import LeadCard from './components/LeadCard';
import LeadModal from './components/LeadModal';
import ConversationModal from './components/ConversationModal';
import ManagerView from './components/ManagerView';
import VisitsCalendar from './components/VisitsCalendar';
import Settings from './components/Settings';
import Login from './components/Login';
import FilterBar from './components/FilterBar';
import { fetchLeadsFromAirtable } from './services/airtable';
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
    // Total des opportunités détectées = TOUS les leads dans Airtable
    const totalQualifies = leads.length;

    // Les leads Chauds/Tièdes/Froids = seulement les NON contactés, NON en cours, NON en découverte
    // ET qui ne sont pas assignés à d'autres agents
    const nonContactedLeads = leads.filter(lead =>
      lead.statut !== "CONTACTE" &&
      lead.statut !== "EN_COURS" &&
      lead.statut !== "EN_DECOUVERTE" &&
      (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
    );
    const leadsChauds = nonContactedLeads.filter(lead => lead.score === "CHAUD").length;
    const leadsTiedes = nonContactedLeads.filter(lead => lead.score === "TIEDE").length;
    const leadsFroids = nonContactedLeads.filter(lead => lead.score === "FROID").length;

    // Leads En cours = statut "EN_COURS" (déjà mappé depuis "En-cours" ou "En_cours" par airtable.js)
    const leadsEnCoursFiltered = leads.filter(lead => lead.statut === "EN_COURS");
    const leadsEnCours = leadsEnCoursFiltered.length;

    // Debug: Afficher les leads dans chaque catégorie
    console.log('🔍 KPI DEBUG - Leads Tièdes:', nonContactedLeads.filter(lead => lead.score === "TIEDE").map(l => ({ nom: l.nom, statut: l.statut, score: l.score })));
    console.log('🔍 KPI DEBUG - Leads En Cours:', leadsEnCoursFiltered.map(l => ({ nom: l.nom, statut: l.statut, score: l.score })));

    return {
      totalQualifies,
      leadsChauds,
      leadsTiedes,
      leadsFroids,
      leadsEnCours
    };
  };

  const kpis = getKPIs();

  // Charger les leads depuis Airtable
  useEffect(() => {
    // Ne charger les leads que si l'utilisateur est authentifié et a une agence
    if (!isAuthenticated || !currentUser?.agency) {
      setLoading(false); // Important: arrêter le loading si pas authentifié
      return;
    }

    let isFirstLoad = true;

    async function loadLeads() {
      try {
        // Afficher le loader uniquement au premier chargement
        if (isFirstLoad) {
          setLoading(true);
        }
        setError(null);
        const data = await fetchLeadsFromAirtable(currentUser.agency);
        setLeads(data);
      } catch (err) {
        console.error('Erreur lors du chargement des leads:', err);
        // Afficher l'erreur uniquement au premier chargement
        if (isFirstLoad) {
          setError(err.message);
        }
      } finally {
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      }
    }

    loadLeads();

    // Rafraîchir toutes les 30 secondes pour avoir les données à jour (en arrière-plan)
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, currentUser?.agency]);

  // Vérifier si un utilisateur est déjà connecté (sessionStorage)
  // sessionStorage : garde la session pendant les rafraîchissements, mais déconnecte à la fermeture du navigateur
  useEffect(() => {
    const savedUser = sessionStorage.getItem('emkai_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);

        // Validation de sécurité : vérifier que l'utilisateur a tous les champs requis
        if (user && user.agency && user.agencyName && user.email && user.name && user.role) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          // Si les données sont incomplètes, forcer la déconnexion
          console.warn('Session invalide : données utilisateur incomplètes');
          sessionStorage.removeItem('emkai_user');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la lecture de la session:', error);
        sessionStorage.removeItem('emkai_user');
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

  const handleLogin = (email, password) => {
    const result = validateLogin(email, password);

    if (result.success) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setLoginError('');
      // Sauvegarder dans sessionStorage (se vide à la fermeture du navigateur)
      sessionStorage.setItem('emkai_user', JSON.stringify(result.user));
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
    sessionStorage.removeItem('emkai_user');
    console.log('✅ Déconnexion réussie');
  };

  const handleMarkContacted = async (leadId) => {
    // Trouver le lead pour vérifier son état actuel
    const currentLead = leads.find(lead => lead.id === leadId);
    const isCurrentlyContacted = currentLead?.statut === "CONTACTE";

    // Toggle: si déjà contacté, on remet à "Qualifié", sinon on marque comme contacté
    const newStatut = isCurrentlyContacted ? "QUALIFIE" : "CONTACTE";
    const newContactedValue = !isCurrentlyContacted;

    // Mettre à jour localement immédiatement
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, statut: newStatut, contacted: newContactedValue } : lead
      )
    );

    // Mettre à jour dans Airtable en arrière-plan
    try {
      const { updateLeadInAirtable } = await import('./services/airtable');
      // Mettre à jour uniquement le champ Statut (le champ "contacté" n'existe pas dans Airtable)
      await updateLeadInAirtable(leadId, {
        Statut: isCurrentlyContacted ? "Qualifié" : "Contacté"
      });
      console.log(`✅ Lead ${isCurrentlyContacted ? 'réactivé' : 'marqué comme contacté'} dans Airtable:`, leadId);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du lead dans Airtable:', error);
      // On garde quand même le changement local même si Airtable échoue
    }
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
          <h2 className="text-white text-2xl font-bold mb-4">Erreur de connexion Airtable</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="text-left bg-gray-900/50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-300 mb-2">Vérifiez :</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>✓ Votre token Airtable est valide</li>
              <li>✓ Votre Base ID est correct</li>
              <li>✓ Le nom de votre table est exact</li>
              <li>✓ Les permissions du token (read/write)</li>
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
      return leads.filter(lead =>
        lead.statut === 'QUALIFIE' &&
        (!lead.agent_en_charge || lead.agent_en_charge === currentUser?.name)
      );
    } else if (currentView === 'en_cours') {
      // VUE 2: EN DÉCOUVERTE - Statut = "CONTACTÉ" or "EN DÉCOUVERTE"
      // Pour les agents : uniquement leurs dossiers (Agent = Moi)
      // Pour les managers : tous les dossiers contactés/en découverte
      return leads.filter(lead => {
        const hasCorrectStatus = lead.statut === 'CONTACTE' || lead.statut === 'EN_DECOUVERTE';
        const isManager = currentUser?.role === 'manager';
        const isAssignedToMe = lead.agent_en_charge === currentUser?.name;

        return hasCorrectStatus && (isManager || isAssignedToMe);
      });
    } else if (currentView === 'visites') {
      // VUE 3: VISITES - Statut = "VISITE PROGRAMMÉE" uniquement
      return leads.filter(lead =>
        lead.statut === 'VISITE_PROGRAMMEE'
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
        ) : currentView === 'a_traiter' ? (
          <>
            {/* Cockpit KPIs - uniquement sur la vue "À Traiter" */}
            <Cockpit kpis={kpis} selectedFilter={selectedFilter} onFilterChange={handleFilterChange} />

            {/* Hit List - Leads Qualifiés (Non contactés) */}
            <HitList
              leads={leads}
              selectedFilter={selectedFilter}
              onMarkContacted={handleMarkContacted}
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
            ) : (
              /* Liste des prospects filtrés selon la vue */
              <>
                {filteredLeads.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onMarkContacted={handleMarkContacted}
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
