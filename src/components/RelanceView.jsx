import React, { useMemo, useState } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, Send, Copy } from 'lucide-react';
import { calculateNextRelance, getRelanceTemplate, getRelanceUrgency, isGoodTimeToSend } from '../config/relanceConfig';
import Toast from './Toast';

const RelanceView = ({ leads, currentUser, onOpenConversationModal, agency }) => {
  const [toast, setToast] = useState(null);
  const [copiedLeadId, setCopiedLeadId] = useState(null);

  // Calculer les leads à relancer avec leurs informations
  const relanceLeads = useMemo(() => {
    return leads
      .map(lead => {
        const nextRelanceDate = calculateNextRelance(lead);
        if (!nextRelanceDate) return null;

        const urgency = getRelanceUrgency(nextRelanceDate);
        const relanceCount = lead.conversation?.filter(msg =>
          msg.sender === 'bot' && msg.isRelance === true
        ).length || 0;

        const template = getRelanceTemplate(lead, currentUser, currentUser?.agencyName || 'Votre Agence');

        return {
          ...lead,
          nextRelanceDate,
          urgency,
          relanceCount,
          template
        };
      })
      .filter(lead => lead !== null)
      .sort((a, b) => a.nextRelanceDate - b.nextRelanceDate);
  }, [leads, currentUser]);

  // Grouper par urgence
  const groupedLeads = useMemo(() => {
    return {
      urgent: relanceLeads.filter(l => l.urgency === 'urgent'),
      today: relanceLeads.filter(l => l.urgency === 'today'),
      soon: relanceLeads.filter(l => l.urgency === 'soon'),
      scheduled: relanceLeads.filter(l => l.urgency === 'scheduled')
    };
  }, [relanceLeads]);

  // Copier le message dans le presse-papier
  const handleCopyMessage = (lead) => {
    if (lead.template) {
      navigator.clipboard.writeText(lead.template.message);
      setCopiedLeadId(lead.id);
      setToast({
        type: 'success',
        message: 'Message copié dans le presse-papier'
      });
      setTimeout(() => setCopiedLeadId(null), 2000);
    }
  };

  // Ouvrir la conversation avec le message pré-rempli
  const handleSendRelance = (lead) => {
    // TODO: Passer le template au modal de conversation
    onOpenConversationModal(lead, lead.template?.message);
  };

  const goodTimeToSend = isGoodTimeToSend();

  // Fonction pour formater la date
  const formatRelanceDate = (date) => {
    const now = new Date();
    const diffHours = (date - now) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return `En retard de ${Math.abs(Math.floor(diffHours))}h`;
    } else if (diffHours < 24) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 48) {
      return `Demain à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  };

  const UrgencyBadge = ({ urgency }) => {
    const config = {
      urgent: { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800', label: 'URGENT', icon: AlertTriangle },
      today: { color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800', label: 'Aujourd\'hui', icon: Clock },
      soon: { color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800', label: 'Cette semaine', icon: Bell },
      scheduled: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700', label: 'Planifié', icon: CheckCircle }
    };

    const { color, label, icon: Icon } = config[urgency] || config.scheduled;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const LeadRelanceCard = ({ lead }) => (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg dark:hover:shadow-accent/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {lead.nom}
            </h3>
            <UrgencyBadge urgency={lead.urgency} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lead.adresse || lead.bien || 'Bien non défini'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Relance #{lead.relanceCount + 1}
          </p>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
            {formatRelanceDate(lead.nextRelanceDate)}
          </p>
        </div>
      </div>

      {/* Aperçu du message */}
      {lead.template && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Objet : {lead.template.subject}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {lead.template.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleCopyMessage(lead)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-700"
        >
          {copiedLeadId === lead.id ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">Copier</span>
            </>
          )}
        </button>
        <button
          onClick={() => handleSendRelance(lead)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-all shadow-accent/20"
        >
          <Send className="w-4 h-4" />
          <span className="text-sm font-medium">Envoyer</span>
        </button>
      </div>
    </div>
  );

  const SectionHeader = ({ title, count, icon: Icon, color }) => (
    <div className="flex items-center space-x-3 mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {count} lead{count > 1 ? 's' : ''} à relancer
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Bell className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Relances à Effectuer
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {relanceLeads.length} lead{relanceLeads.length > 1 ? 's' : ''} nécessite{relanceLeads.length > 1 ? 'nt' : ''} une relance
              </p>
            </div>
          </div>

          {/* Indicateur du bon moment pour envoyer */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            goodTimeToSend
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {goodTimeToSend ? 'Bon moment pour relancer' : 'Hors horaires optimaux'}
            </span>
          </div>
        </div>

        {/* Statistiques par urgence */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{groupedLeads.urgent.length}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Urgents</p>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{groupedLeads.today.length}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Aujourd'hui</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{groupedLeads.soon.length}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Cette semaine</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{groupedLeads.scheduled.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Planifiés</p>
          </div>
        </div>
      </div>

      {/* Leads urgents */}
      {groupedLeads.urgent.length > 0 && (
        <div>
          <SectionHeader
            title="Relances Urgentes"
            count={groupedLeads.urgent.length}
            icon={AlertTriangle}
            color="bg-red-100 dark:bg-red-900/30"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedLeads.urgent.map(lead => (
              <LeadRelanceCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Leads aujourd'hui */}
      {groupedLeads.today.length > 0 && (
        <div>
          <SectionHeader
            title="À Relancer Aujourd'hui"
            count={groupedLeads.today.length}
            icon={Clock}
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedLeads.today.map(lead => (
              <LeadRelanceCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Leads cette semaine */}
      {groupedLeads.soon.length > 0 && (
        <div>
          <SectionHeader
            title="Cette Semaine"
            count={groupedLeads.soon.length}
            icon={Bell}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedLeads.soon.map(lead => (
              <LeadRelanceCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Leads planifiés */}
      {groupedLeads.scheduled.length > 0 && (
        <div>
          <SectionHeader
            title="Relances Planifiées"
            count={groupedLeads.scheduled.length}
            icon={CheckCircle}
            color="bg-gray-100 dark:bg-gray-800"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groupedLeads.scheduled.map(lead => (
              <LeadRelanceCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune relance */}
      {relanceLeads.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Aucune relance à effectuer pour le moment
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Tous vos leads sont à jour !
          </p>
        </div>
      )}

      {/* Toast */}
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

export default RelanceView;
