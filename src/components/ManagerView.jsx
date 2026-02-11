import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import LeadCard from './LeadCard';
import { authApi } from '../services/authApi';

const ManagerView = ({ leads, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, agency }) => {
  const [teamAgentCount, setTeamAgentCount] = useState(0);

  // Charger le nombre réel d'agents actifs dans l'équipe
  useEffect(() => {
    const loadAgentCount = async () => {
      try {
        const data = await authApi.fetchAgents();
        const agents = data.agents || [];
        // Compter uniquement les agents (exclure le manager lui-même)
        setTeamAgentCount(agents.filter(a => a.role === 'agent').length);
      } catch (error) {
        console.error('Erreur chargement agents:', error);
      }
    };
    loadAgentCount();
  }, []);

  // Grouper les leads par agent
  const leadsByAgent = leads.reduce((acc, lead) => {
    const agent = lead.agent_en_charge || 'Non assigné';
    if (!acc[agent]) {
      acc[agent] = [];
    }
    acc[agent].push(lead);
    return acc;
  }, {});

  // État pour gérer l'expansion/réduction des sections
  const [expandedAgents, setExpandedAgents] = useState(
    Object.keys(leadsByAgent).reduce((acc, agent) => {
      acc[agent] = true; // Tout ouvert par défaut
      return acc;
    }, {})
  );

  const toggleAgent = (agent) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agent]: !prev[agent]
    }));
  };

  // Calculer les statistiques globales
  const totalLeads = leads.length;
  const agentCount = teamAgentCount;

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Agents actifs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{agentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dossiers assignés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-xl p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Moyenne par agent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {agentCount > 0 ? Math.round(totalLeads / agentCount) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des agents avec leurs dossiers */}
      <div className="space-y-4">
        {Object.entries(leadsByAgent)
          .sort(([agentA], [agentB]) => {
            // Mettre "Non assigné" en dernier
            if (agentA === 'Non assigné') return 1;
            if (agentB === 'Non assigné') return -1;
            return agentA.localeCompare(agentB);
          })
          .map(([agent, agentLeads]) => {
            const isExpanded = expandedAgents[agent];
            const isUnassigned = agent === 'Non assigné';

            return (
              <div
                key={agent}
                className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                {/* En-tête de l'agent */}
                <button
                  onClick={() => toggleAgent(agent)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isUnassigned
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'bg-accent/10'
                    }`}>
                      <Users className={`w-5 h-5 ${
                        isUnassigned
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-accent'
                      }`} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {agent}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {agentLeads.length} dossier{agentLeads.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-semibold">
                      {agentLeads.length}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Liste des dossiers de l'agent */}
                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                      {agentLeads.map(lead => (
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
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Message si aucun dossier assigné */}
      {totalLeads === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucun dossier assigné pour le moment
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagerView;
