import React from 'react';
import { AlertTriangle, Phone } from 'lucide-react';

const UrgencyList = ({ leads }) => {
  // Filtrer les leads où l'IA est stoppée
  const urgentLeads = leads.filter(lead => lead.stop_ai === true);

  if (urgentLeads.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Intervention Requise
        </h2>
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-semibold animate-pulse">
          {urgentLeads.length}
        </span>
      </div>

      {/* Compact List */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        {urgentLeads.map((lead, index) => (
          <div
            key={lead.id}
            className={`
              p-4 flex items-center justify-between
              hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors
              ${index !== urgentLeads.length - 1 ? 'border-b border-gray-200 dark:border-gray-800' : ''}
            `}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {lead.nom}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {lead.summary}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = `tel:${lead.phone}`}
              className="ml-4 flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Appeler</span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UrgencyList;
