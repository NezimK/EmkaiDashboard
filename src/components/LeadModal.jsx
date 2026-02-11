import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Euro, Globe, Calendar, Target, Lock, UserCheck, UserMinus, Users, Archive } from 'lucide-react';
import { assignLeadToAgent, unassignLead, updateLeadStatus } from '../services/leadsApi';
import { authApi } from '../services/authApi';
import ConfirmDialog from './ConfirmDialog';
import AgentSelector from './AgentSelector';
import ScheduleVisitModal from './ScheduleVisitModal';

const LeadModal = ({ lead, onClose, currentUser, onLeadUpdate, agency, allLeads }) => {
  if (!lead) return null;

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [showTakeOverConfirm, setShowTakeOverConfirm] = useState(false);
  const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showScheduleVisit, setShowScheduleVisit] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);

  // Déterminer le statut d'assignation
  const isAssignedToMe = lead.agent_en_charge && currentUser && lead.agent_en_charge === currentUser.name;
  const isAssignedToOther = lead.agent_en_charge && currentUser && lead.agent_en_charge !== currentUser.name;
  const isFree = !lead.agent_en_charge;
  const isManager = currentUser?.role === 'manager';

  // Charger les agents disponibles depuis l'API
  useEffect(() => {
    if (!isManager) return;
    const loadAgents = async () => {
      try {
        const data = await authApi.fetchAgents();
        setAvailableAgents(data.agents || []);
      } catch (error) {
        console.error('Erreur chargement agents:', error);
      }
    };
    loadAgents();
  }, [isManager]);

  // Assigner le lead à l'utilisateur connecté
  const handleAssignToMe = async () => {
    if (!currentUser) return;

    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const updatedLead = await assignLeadToAgent(lead.id, currentUser.name);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      setAssignmentError('Impossible d\'assigner ce lead. Veuillez réessayer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Récupérer le lead (forcer l'assignation)
  const handleTakeOverClick = () => {
    setShowTakeOverConfirm(true);
  };

  const handleTakeOverConfirm = async () => {
    if (!currentUser) return;

    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const updatedLead = await assignLeadToAgent(lead.id, currentUser.name);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      setAssignmentError('Impossible de récupérer ce lead. Veuillez réessayer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Désassigner le lead (remettre disponible)
  const handleUnassignClick = () => {
    setShowUnassignConfirm(true);
  };

  const handleUnassignConfirm = async () => {
    if (!currentUser) return;

    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const updatedLead = await unassignLead(lead.id);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
      // Fermer la modal après désassignation
      onClose();
    } catch (error) {
      console.error('Erreur lors de la désassignation:', error);
      setAssignmentError('Impossible de libérer ce dossier. Veuillez réessayer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Assigner à un agent spécifique (Manager uniquement)
  const handleAssignToAgent = async (agentName) => {
    if (!isManager) return;

    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const updatedLead = await assignLeadToAgent(lead.id, agentName);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      setAssignmentError('Impossible d\'assigner ce lead. Veuillez réessayer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Changer le statut du lead
  const handleStatusChange = async (newStatus) => {
    setIsAssigning(true);
    setAssignmentError(null);

    try {
      const updatedLead = await updateLeadStatus(lead.id, newStatus);
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      setAssignmentError('Impossible de changer le statut. Veuillez réessayer.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Fermer la modal quand on clique sur le backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-accent to-accent-dark p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">{lead.nom}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Boutons d'action rapide */}
          {(isAssignedToMe || isManager) && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowScheduleVisit(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-accent/20 hover:bg-accent/30 text-white text-sm font-medium rounded-lg transition-colors border border-accent/30"
              >
                <Calendar className="w-4 h-4" />
                <span>{lead.date_visite ? 'Modifier visite' : 'Programmer visite'}</span>
              </button>
              <button
                onClick={() => setShowArchiveConfirm(true)}
                disabled={isAssigning}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-sm font-medium rounded-lg transition-colors border border-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="w-4 h-4" />
                <span>Archiver</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          {/* Bandeau d'assignation */}
          {isFree && (
            <div className="mb-6 bg-accent/10 dark:bg-accent/20 border-l-4 border-accent p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-5 h-5 text-accent dark:text-accent" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Dossier disponible</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Ce prospect n'est assigné à personne</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAssignToMe}
                    disabled={isAssigning}
                    className="px-4 py-2 bg-accent hover:bg-accent-dark text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isAssigning ? 'Prise en cours...' : 'Prendre le dossier'}</span>
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setShowAgentSelector(true)}
                      disabled={isAssigning}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      title="Assigner à un agent"
                    >
                      <Users className="w-4 h-4" />
                      <span>Assigner à...</span>
                    </button>
                  )}
                </div>
              </div>
              {assignmentError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{assignmentError}</p>
              )}
            </div>
          )}

          {isAssignedToOther && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">Dossier verrouillé</p>
                    <p className="text-xs text-red-700 dark:text-red-300">Ce dossier est assigné à <span className="font-bold">{lead.agent_en_charge}</span></p>
                  </div>
                </div>
                {isManager && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleUnassignClick}
                      disabled={isAssigning}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Libérer le dossier"
                    >
                      <UserMinus className="w-3 h-3" />
                      <span>Libérer</span>
                    </button>
                    <button
                      onClick={handleTakeOverClick}
                      disabled={isAssigning}
                      className="px-3 py-2 bg-accent hover:bg-accent-dark text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Prendre le dossier"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Prendre</span>
                    </button>
                    <button
                      onClick={() => setShowAgentSelector(true)}
                      disabled={isAssigning}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      title="Réassigner à un agent"
                    >
                      <Users className="w-3 h-3" />
                      <span>Réassigner</span>
                    </button>
                  </div>
                )}
              </div>
              {assignmentError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{assignmentError}</p>
              )}
            </div>
          )}

          {isAssignedToMe && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">Mon Dossier</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Vous gérez actuellement ce prospect</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleUnassignClick}
                    disabled={isAssigning}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    title="Libérer le dossier"
                  >
                    <UserMinus className="w-4 h-4" />
                    <span>{isAssigning ? 'Libération...' : 'Libérer le dossier'}</span>
                  </button>
                  {isManager && (
                    <button
                      onClick={() => setShowAgentSelector(true)}
                      disabled={isAssigning}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      title="Réassigner à un agent"
                    >
                      <Users className="w-4 h-4" />
                      <span>Réassigner</span>
                    </button>
                  )}
                </div>
              </div>
              {assignmentError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{assignmentError}</p>
              )}
            </div>
          )}

          {/* Informations Essentielles */}
          <div className={`mb-6 ${(isFree || (isAssignedToOther && !isManager)) ? 'opacity-60 pointer-events-none' : ''}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 text-accent mr-2" />
              Informations Essentielles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Phone className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Téléphone</p>
                  <a href={`tel:${lead.phone}`} className="text-sm font-medium text-accent hover:text-accent-dark transition-colors">
                    {lead.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <a href={`mailto:${lead.email}`} className="text-sm font-medium text-accent hover:text-accent-dark transition-colors">
                    {lead.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Euro className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Financement</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.budget}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Target className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Bien</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.bien}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Globe className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Portail</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.secteur}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-4 border-accent">
                <Calendar className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Délai</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.delai}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals de confirmation */}
      <ConfirmDialog
        isOpen={showTakeOverConfirm}
        onClose={() => setShowTakeOverConfirm(false)}
        onConfirm={handleTakeOverConfirm}
        title="Récupérer ce dossier ?"
        message={`Ce dossier est actuellement assigné à ${lead.agent_en_charge}. Êtes-vous sûr de vouloir le récupérer ? Cette action transfèrera le dossier sous votre responsabilité.`}
        confirmText="Oui, récupérer"
        cancelText="Annuler"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showUnassignConfirm}
        onClose={() => setShowUnassignConfirm(false)}
        onConfirm={handleUnassignConfirm}
        title="Libérer ce dossier ?"
        message="Êtes-vous sûr de vouloir libérer ce dossier ? Il redeviendra disponible pour tous les agents dans les Dossiers à traiter."
        confirmText="Oui, libérer"
        cancelText="Annuler"
        variant="default"
      />

      {/* Sélecteur d'agent (Manager uniquement) */}
      <AgentSelector
        isOpen={showAgentSelector}
        onClose={() => setShowAgentSelector(false)}
        onSelect={handleAssignToAgent}
        currentAgent={lead.agent_en_charge}
        availableAgents={availableAgents}
      />

      {/* Confirmation d'archivage */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={() => handleStatusChange('Archivé')}
        title="Archiver ce dossier ?"
        message="Ce prospect sera déplacé dans les archives. Vous pourrez le retrouver depuis les Réglages > Archives."
        confirmText="Oui, archiver"
        cancelText="Annuler"
        variant="warning"
      />

      {/* Modal de programmation de visite */}
      {showScheduleVisit && (
        <ScheduleVisitModal
          lead={lead}
          onClose={() => setShowScheduleVisit(false)}
          onLeadUpdate={onLeadUpdate}
          agency={agency}
          allLeads={allLeads}
        />
      )}
    </div>
  );
};

export default LeadModal;
