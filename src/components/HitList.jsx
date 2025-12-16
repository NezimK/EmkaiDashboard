import React from 'react';
import { Target } from 'lucide-react';
import LeadCard from './LeadCard';

const HitList = ({ leads, selectedFilter, onMarkContacted, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, agency }) => {
  // Filtrer les leads selon le filtre sélectionné
  let filteredLeads = leads;

  if (selectedFilter === "EN_COURS") {
    // Filtre spécial pour les leads "En cours"
    filteredLeads = leads.filter(lead => lead.statut === "EN_COURS");
  } else {
    // Filtrer les leads NON CONTACTÉS, NON EN_COURS, et NON EN_DECOUVERTE
    filteredLeads = leads.filter(lead =>
      lead.statut !== "CONTACTE" &&
      lead.statut !== "EN_COURS" &&
      lead.statut !== "EN_DECOUVERTE"
    );

    // IMPORTANT: Exclure les leads assignés à d'autres agents
    // Ne montrer que les leads libres (agent_en_charge vide) OU assignés à moi
    filteredLeads = filteredLeads.filter(lead =>
      !lead.agent_en_charge || lead.agent_en_charge === currentUser?.name
    );

    if (selectedFilter) {
      // Si un filtre est actif, filtrer par score
      filteredLeads = filteredLeads.filter(lead => lead.score === selectedFilter);
    } else {
      // Sinon, afficher uniquement les leads qualifiés et non-stoppés
      filteredLeads = filteredLeads.filter(lead =>
        lead.statut === "QUALIFIE" && !lead.stop_ai
      );
    }
  }

  // Déterminer le titre selon le filtre
  const getTitle = () => {
    if (selectedFilter === "CHAUD") return "À Traiter d'Urgence";
    if (selectedFilter === "TIEDE") return "Projets à Suivre";
    if (selectedFilter === "FROID") return "Prospects Froids";
    if (selectedFilter === "EN_COURS") return "En cours...";
    return "Opportunités Détectées";
  };

  return (
    <section className="mb-8">
      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Target className="w-6 h-6 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTitle()}
        </h2>
        <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
          {filteredLeads.length}
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onMarkContacted={onMarkContacted}
            currentUser={currentUser}
            onLeadUpdate={onLeadUpdate}
            onOpenInfoModal={onOpenInfoModal}
            onOpenConversationModal={onOpenConversationModal}
            agency={agency}
          />
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucun lead trouvé pour ce filtre
          </p>
        </div>
      )}
    </section>
  );
};

export default HitList;
