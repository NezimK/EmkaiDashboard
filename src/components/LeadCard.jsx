import { useState } from 'react';
import { AlertCircle, Info, UserCheck, Clock, MessageSquare } from 'lucide-react';
import { assignLeadToAgent } from '../services/supabase';
import { formatTimeAgo } from '../utils/timeAgo';

const LeadCard = ({ lead, currentUser, onLeadUpdate, onOpenInfoModal, onOpenConversationModal, showLastMessage = false, agency }) => {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignToMe = async () => {
    if (!currentUser || isAssigning) return;

    setIsAssigning(true);
    try {
      const updatedLead = await assignLeadToAgent(agency, lead.id, currentUser.name);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Déterminer si le lead est assigné à moi
  const isAssignedToMe = lead.agent_en_charge && currentUser && lead.agent_en_charge === currentUser.name;

  // Récupérer le dernier message de la conversation
  const getLastMessage = () => {
    if (!lead.conversation || lead.conversation.length === 0) return null;
    return lead.conversation[lead.conversation.length - 1];
  };

  const lastMessage = getLastMessage();

  // Compter les messages non lus du prospect
  const unreadCount = lead.conversation?.filter(msg => msg.sender === 'lead' && msg.read === false).length || 0;
  const hasUnreadMessage = unreadCount > 0;

  return (
    <>
      <div className={`bg-white dark:bg-dark-card rounded-xl p-5 border transition-all duration-300 group ${
        hasUnreadMessage
          ? 'border-accent shadow-lg ring-2 ring-accent/20 dark:ring-accent/30'
          : 'border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-accent/10 hover:border-accent/50 dark:hover:border-accent/50'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {lead.nom}
              </h3>
              {hasUnreadMessage && (
                <div className="relative">
                  <span className="flex h-6 w-6 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-accent text-black text-xs font-bold">
                      {unreadCount}
                    </span>
                  </span>
                </div>
              )}
            </div>
            {lead.stop_ai && (
              <span className="inline-flex items-center text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3 h-3 mr-1" />
                IA Stoppée
              </span>
            )}
          </div>
          {/* Timestamp en haut à droite - dernier message ou date de création */}
          {(lastMessage?.timestamp || lead.createdTime) && (
            <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeAgo(lastMessage?.timestamp || lead.createdTime)}
            </span>
          )}
        </div>

        {/* Dernier message ou résumé IA */}
        {showLastMessage && lastMessage ? (
          <div className={`mb-4 p-3 rounded-lg border ${
            hasUnreadMessage
              ? 'bg-accent/10 dark:bg-accent/5 border-accent/30 dark:border-accent/20'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start gap-2 mb-1">
              <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                hasUnreadMessage ? 'text-accent' : 'text-gray-500 dark:text-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium mb-1 ${
                  hasUnreadMessage
                    ? 'text-accent'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {lastMessage.sender === 'lead' ? lead.nom : lastMessage.sender === 'bot' ? 'Sarah (IA)' : 'Agent'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {lastMessage.message}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
              {lead.summary}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Bouton "M'assigner ce dossier" */}
          <button
            onClick={handleAssignToMe}
            disabled={isAssigning || isAssignedToMe}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
              isAssignedToMe
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-default'
                : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-800'
            } ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium">
              {isAssigning ? 'Prise en cours...' : isAssignedToMe ? 'Mon Dossier' : 'Prendre le dossier'}
            </span>
          </button>

          {/* Boutons Message et Info */}
          <div className="flex items-center space-x-2">
            {/* Bouton Info */}
            <button
              onClick={() => onOpenInfoModal && onOpenInfoModal(lead)}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-700"
              title="Voir les informations détaillées"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Bouton Message - Ouvrir la conversation */}
            <button
              onClick={() => onOpenConversationModal && onOpenConversationModal(lead)}
              className="p-2.5 bg-accent hover:bg-accent-dark text-black rounded-lg transition-all duration-200 hover:shadow-md shadow-accent/20"
              title="Ouvrir la conversation"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadCard;
