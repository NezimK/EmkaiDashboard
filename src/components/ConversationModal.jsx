import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, PauseCircle, PlayCircle } from 'lucide-react';
import Toast from './Toast';
import { updateLeadStatus, assignLeadToAgent, markMessagesAsRead, toggleStopAI, fetchSingleLead } from '../services/leadsApi';
import { sendWhatsAppMessage, isWhatsAppConfigured } from '../services/whatsapp';

const ConversationModal = ({ lead, onClose, currentUser, onLeadUpdate, agency }) => {
  if (!lead) return null;

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localConversation, setLocalConversation] = useState(lead.conversation || []);
  const [toast, setToast] = useState(null);
  const [isAIPaused, setIsAIPaused] = useState(lead.stop_ai || false);
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const conversationEndRef = useRef(null);

  // Fonction pour scroller vers le bas (dernier message)
  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Synchroniser localConversation avec lead.conversation quand il change
  useEffect(() => {
    console.log('🔄 [ConversationModal] Syncing conversation for', lead.nom);
    setLocalConversation(lead.conversation || []);
  }, [lead.conversation, lead.nom]);

  // Ref pour suivre le nombre de messages sans recréer l'interval
  const conversationLengthRef = useRef(localConversation.length);
  useEffect(() => {
    conversationLengthRef.current = localConversation.length;
  }, [localConversation.length]);

  // Ref stable pour onLeadUpdate
  const onLeadUpdateRef = useRef(onLeadUpdate);
  useEffect(() => {
    onLeadUpdateRef.current = onLeadUpdate;
  }, [onLeadUpdate]);

  // Polling pour récupérer les nouveaux messages toutes les 5 secondes
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const updatedLead = await fetchSingleLead(lead.id);
        const newCount = updatedLead.conversation?.length || 0;

        if (newCount > conversationLengthRef.current) {
          setLocalConversation(updatedLead.conversation || []);
          if (onLeadUpdateRef.current) {
            onLeadUpdateRef.current(updatedLead);
          }
        }
      } catch (error) {
        console.error('❌ [ConversationModal] Error polling messages:', error);
      }
    };

    const intervalId = setInterval(pollMessages, 5000);
    return () => clearInterval(intervalId);
  }, [agency, lead.id]);

  // Scroller vers le bas quand localConversation change (nouveau message)
  useEffect(() => {
    scrollToBottom();
  }, [localConversation]);

  // Marquer les messages comme lus quand la modal est ouverte
  useEffect(() => {
    const markAsRead = async () => {
      const unreadCount = lead.conversation?.filter(msg => msg.sender === 'lead' && msg.read === false).length || 0;

      if (unreadCount > 0) {
        console.log('📬 Marking', unreadCount, 'messages as read for', lead.nom);
        try {
          const updatedLead = await markMessagesAsRead(lead.id, lead.conversation);

          // Notifier le parent pour mettre à jour la liste
          if (onLeadUpdate) {
            onLeadUpdate(updatedLead);
          }
        } catch (error) {
          console.error('❌ Error marking messages as read:', error);
        }
      }
    };

    // Marquer comme lu après 1 seconde (pour laisser le temps à l'utilisateur de voir la conversation)
    const timeout = setTimeout(markAsRead, 1000);

    return () => clearTimeout(timeout);
  }, [lead.id, lead.nom, lead.conversation, onLeadUpdate]);

  // Déterminer le statut d'assignation
  const isAssignedToMe = lead.agent_en_charge && currentUser && lead.agent_en_charge === currentUser.name;
  const isAssignedToOther = lead.agent_en_charge && currentUser && lead.agent_en_charge !== currentUser.name;
  const isFree = !lead.agent_en_charge;
  const isManager = currentUser?.role === 'manager';

  // Envoyer un message WhatsApp
  const handleSendMessage = async () => {
    // Empêcher l'envoi si le dossier n'est pas assigné à l'utilisateur actuel
    if (!isAssignedToMe && !isManager) {
      setToast({
        type: 'error',
        message: 'Vous devez prendre en charge ce dossier pour envoyer des messages'
      });
      return;
    }

    if (!messageText.trim() || isSending) return;

    const newMessage = {
      message: messageText,
      sender: 'agent',
      timestamp: new Date().toISOString()
    };

    // Optimistic UI - Ajouter immédiatement le message
    setLocalConversation(prev => [...prev, newMessage]);
    const currentMessage = messageText;
    setMessageText('');
    setIsSending(true);

    try {
      // Vérifier que WhatsApp est configuré pour cette agence
      if (!isWhatsAppConfigured(agency)) {
        throw new Error('WhatsApp n\'est pas configuré pour cette agence');
      }

      // Envoyer le message via le service WhatsApp (qui utilise le bon webhook n8n)
      await sendWhatsAppMessage(
        agency,
        lead.id,
        lead.phone,
        currentMessage,
        currentUser?.name || 'Agent'
      );

      // Si le lead n'est pas assigné à l'utilisateur actuel, l'assigner
      if (!isAssignedToMe && currentUser) {
        console.log('📝 Assignation automatique du lead à', currentUser.name);
        const updatedLead = await assignLeadToAgent(lead.id, currentUser.name);

        // Notifier le parent pour mettre à jour la liste
        if (onLeadUpdate) {
          onLeadUpdate(updatedLead);
        }
      }

      console.log('✅ Message envoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);

      // Gestion d'erreur : Retirer le message de la liste
      setLocalConversation(prev => prev.filter(msg => msg !== newMessage));

      setToast({
        type: 'error',
        message: 'Échec de l\'envoi du message. Veuillez réessayer.'
      });

      // Remettre le message dans le champ
      setMessageText(currentMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Gérer l'envoi avec la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Empêcher l'envoi si le dossier n'est pas assigné à l'utilisateur actuel
      if (!isAssignedToMe && !isManager) {
        return;
      }
      handleSendMessage();
    }
  };

  // Toggle pause/reprise de l'IA
  const handleToggleAI = async () => {
    setIsTogglingAI(true);

    try {
      const newPauseValue = !isAIPaused;
      const updatedLead = await toggleStopAI(lead.id, newPauseValue);

      setIsAIPaused(newPauseValue);

      // Notifier le parent pour mettre à jour la liste
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }

      setToast({
        type: 'success',
        message: newPauseValue ? 'IA mise en pause' : 'IA réactivée'
      });

      console.log(`✅ IA ${newPauseValue ? 'pausée' : 'réactivée'} pour le lead:`, lead.nom);
    } catch (error) {
      console.error('❌ Erreur lors du toggle de l\'IA:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de la modification de l\'état de l\'IA'
      });
    } finally {
      setIsTogglingAI(false);
    }
  };

  // Fermer la modal quand on clique sur le backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Format de la date et l'heure
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-accent-dark p-6 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Conversation WhatsApp</h2>
                <p className="text-sm text-white/80">{lead.nom}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Bouton Pause/Reprendre IA */}
              <button
                onClick={handleToggleAI}
                disabled={isTogglingAI}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  isAIPaused
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isAIPaused ? 'Réactiver l\'IA' : 'Mettre l\'IA en pause'}
              >
                {isAIPaused ? (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    <span className="text-sm">Reprendre l'IA</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-5 h-5" />
                    <span className="text-sm">Pause de l'IA</span>
                  </>
                )}
              </button>

              {/* Bouton Fermer */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Conversation */}
        <div className="flex-1 overflow-y-auto p-6">
          {localConversation.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  Aucun historique de conversation disponible
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex flex-col-reverse">
              <div ref={conversationEndRef} />
              {localConversation.slice().reverse().map((msg, index) => {
                // Déterminer le type d'expéditeur
                const isSarah = msg.sender === 'bot';
                const isAgent = msg.sender === 'agent';
                const isProspect = !isSarah && !isAgent;

                // Configuration visuelle selon l'expéditeur
                let senderConfig = {
                  name: lead.nom,
                  bgColor: 'bg-gray-200 dark:bg-gray-700',
                  textColor: 'text-gray-900 dark:text-white',
                  labelColor: 'text-gray-600 dark:text-gray-400',
                  alignment: 'justify-start',
                  roundedCorner: 'rounded-bl-sm',
                  timestampAlign: 'text-left'
                };

                if (isSarah) {
                  senderConfig = {
                    name: 'Sarah (Assistant IA)',
                    bgColor: 'bg-accent',
                    textColor: 'text-black',
                    labelColor: 'text-black/70',
                    alignment: 'justify-end',
                    roundedCorner: 'rounded-br-sm',
                    timestampAlign: 'text-right'
                  };
                } else if (isAgent) {
                  senderConfig = {
                    name: currentUser?.name || 'Agent Immobilier',
                    bgColor: 'bg-accent dark:bg-accent',
                    textColor: 'text-black',
                    labelColor: 'text-black/80',
                    alignment: 'justify-end',
                    roundedCorner: 'rounded-br-sm',
                    timestampAlign: 'text-right'
                  };
                }

                return (
                  <div
                    key={index}
                    className={`flex ${senderConfig.alignment}`}
                  >
                    <div className="flex flex-col max-w-[80%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${senderConfig.bgColor} ${senderConfig.textColor} ${senderConfig.roundedCorner}`}
                      >
                        <p className={`text-xs font-semibold mb-1 ${senderConfig.labelColor}`}>
                          {senderConfig.name}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                      {msg.timestamp && (
                        <p className={`text-xs text-gray-500 dark:text-gray-500 mt-1 px-2 ${senderConfig.timestampAlign}`}>
                          {formatDateTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Zone d'envoi de message */}
        <div className={`p-6 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 transition-all ${
          (!isAssignedToMe && !isManager)
            ? 'bg-gray-200 dark:bg-gray-800 opacity-50 cursor-not-allowed'
            : 'bg-gray-50 dark:bg-gray-900/50'
        }`}>
          {(!isAssignedToMe && !isManager) ? (
            /* Message d'avertissement pour dossier non pris */
            <div className="flex items-center justify-center space-x-2 rounded-lg p-4 bg-gray-300 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                🔒 Vous devez prendre en charge ce dossier pour envoyer des messages
              </p>
            </div>
          ) : (
            /* Zone d'envoi active */
            <>
              <div className="flex items-end space-x-2 rounded-lg p-3 border-2 transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus-within:border-accent">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={isSending}
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  className="p-2.5 bg-accent hover:bg-accent-dark text-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="Envoyer le message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Appuyez sur Entrée pour envoyer, Shift + Entrée pour une nouvelle ligne
              </p>
            </>
          )}
        </div>
      </div>

      {/* Toast de notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ConversationModal;
