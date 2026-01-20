import React from 'react';
import { Flame, Zap, Snowflake, Award, Clock } from 'lucide-react';
import KPICard from './KPICard';

const Cockpit = ({ kpis, selectedFilter, onFilterChange }) => {
  return (
    <section className="mb-8">
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
