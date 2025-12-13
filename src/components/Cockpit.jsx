import React from 'react';
import { Flame, Zap, Snowflake, Award, Clock } from 'lucide-react';
import KPICard from './KPICard';

const Cockpit = ({ kpis, selectedFilter, onFilterChange }) => {
  return (
    <section className="mb-8">
      {/* Barre de Performance */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10 rounded-lg p-4 border border-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Opportunités Détectées
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {kpis.totalQualifies}
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Performance IA
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards par température */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          icon={Flame}
          title="À Traiter d'Urgence"
          value={kpis.leadsChauds}
          highlighted={selectedFilter === "CHAUD"}
          onClick={() => onFilterChange("CHAUD")}
          isActive={selectedFilter === "CHAUD"}
        />
        <KPICard
          icon={Zap}
          title="Projets à Suivre"
          value={kpis.leadsTiedes}
          highlighted={selectedFilter === "TIEDE"}
          onClick={() => onFilterChange("TIEDE")}
          isActive={selectedFilter === "TIEDE"}
        />
        <KPICard
          icon={Snowflake}
          title="Prospects Froids"
          value={kpis.leadsFroids}
          highlighted={selectedFilter === "FROID"}
          onClick={() => onFilterChange("FROID")}
          isActive={selectedFilter === "FROID"}
        />
        <KPICard
          icon={Clock}
          title="En cours..."
          value={kpis.leadsEnCours}
          highlighted={selectedFilter === "EN_COURS"}
          onClick={() => onFilterChange("EN_COURS")}
          isActive={selectedFilter === "EN_COURS"}
        />
      </div>
    </section>
  );
};

export default Cockpit;
