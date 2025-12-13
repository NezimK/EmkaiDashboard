import React, { useState } from 'react';
import { CheckCircle, Flame, Zap, Snowflake } from 'lucide-react';
import LeadCard from './LeadCard';

const ContactedLeads = ({ leads, onMarkContacted, currentUser, onLeadUpdate }) => {
  const [filter, setFilter] = useState(null); // null = tous les contactés

  // Filtrer leads contactés
  const contactedLeads = leads.filter(lead => lead.statut === "CONTACTE");

  // Appliquer le filtre de température
  const filteredLeads = filter
    ? contactedLeads.filter(lead => lead.score === filter)
    : contactedLeads;

  if (contactedLeads.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leads Contactés
          </h2>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
            {contactedLeads.length}
          </span>
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === null
                ? 'bg-accent text-black'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('CHAUD')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'CHAUD'
                ? 'bg-accent text-black'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Chauds</span>
          </button>
          <button
            onClick={() => setFilter('TIEDE')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'TIEDE'
                ? 'bg-accent text-black'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Tièdes</span>
          </button>
          <button
            onClick={() => setFilter('FROID')}
            className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filter === 'FROID'
                ? 'bg-accent text-black'
                : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <Snowflake className="w-4 h-4" />
            <span>Froids</span>
          </button>
        </div>
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
          />
        ))}
      </div>

      {filteredLeads.length === 0 && filter && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-card rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucun lead contacté dans cette catégorie
          </p>
        </div>
      )}
    </section>
  );
};

export default ContactedLeads;
