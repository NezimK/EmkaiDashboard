import React from 'react';
import { Target } from 'lucide-react';
import LeadCard from './LeadCard';

const HitList = ({ leads, selectedFilter, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, agency }) => {
  // Filtrer uniquement les leads QUALIFIES (à traiter)
  // Exclure : PRE_QUALIFICATION, EN_DECOUVERTE, VISITE_PROGRAMMEE, ARCHIVE
  let filteredLeads = leads.filter(lead =>
    lead.statut === "QUALIFIE" &&
    lead.statut !== "VISITE_PROGRAMMEE" &&
    !lead.date_visite
  );

  // IMPORTANT: Exclure les leads assignés à d'autres agents
  // Ne montrer que les leads libres (agent_en_charge vide) OU assignés à moi
  filteredLeads = filteredLeads.filter(lead =>
    !lead.agent_en_charge || lead.agent_en_charge === currentUser?.name
  );

  if (selectedFilter) {
    // Si un filtre est actif, filtrer par score
    filteredLeads = filteredLeads.filter(lead => lead.score === selectedFilter);
  }

  // Trier par date de création : les plus ANCIENS en premier (fenêtre 24h)
  filteredLeads = [...filteredLeads].sort((a, b) => {
    const dateA = new Date(a.createdTime);
    const dateB = new Date(b.createdTime);
    return dateA - dateB; // Ordre croissant (les plus anciens en premier)
  });

  // Déterminer le titre selon le filtre
  const getTitle = () => {
    if (selectedFilter === "CHAUD") return "Acquéreurs prêts";
    if (selectedFilter === "TIEDE") return "Projet en maturation";
    if (selectedFilter === "FROID") return "Demande exploratoire";
    return "Dossiers à traiter";
  };

  return (
    <section className="mb-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredLeads.map(lead => (
          <LeadCard
            key={lead.id}
            lead={lead}
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
