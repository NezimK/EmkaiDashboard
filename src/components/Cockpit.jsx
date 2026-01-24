import React from 'react';
import { Flame, Zap, Snowflake, Award, Clock } from 'lucide-react';
import KPICard from './KPICard';

const Cockpit = ({ kpis, selectedFilter, onFilterChange }) => {
  return (
    <section className="mb-8">
      {/* Cards par température - Leads qualifiés uniquement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={Flame}
          title="Acquéreurs prêts"
          value={kpis.leadsHot}
          highlighted={selectedFilter === "CHAUD"}
          onClick={() => onFilterChange("CHAUD")}
          isActive={selectedFilter === "CHAUD"}
        />
        <KPICard
          icon={Zap}
          title="Projet en maturation"
          value={kpis.leadsWarm}
          highlighted={selectedFilter === "TIEDE"}
          onClick={() => onFilterChange("TIEDE")}
          isActive={selectedFilter === "TIEDE"}
        />
        <KPICard
          icon={Snowflake}
          title="Demande exploratoire"
          value={kpis.leadsCold}
          highlighted={selectedFilter === "FROID"}
          onClick={() => onFilterChange("FROID")}
          isActive={selectedFilter === "FROID"}
        />
      </div>
    </section>
  );
};

export default Cockpit;
