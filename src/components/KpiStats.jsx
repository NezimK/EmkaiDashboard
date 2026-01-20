import React, { useMemo, useState } from 'react';
import { BarChart3, TrendingUp, Target, Filter } from 'lucide-react';

const KpiStats = ({ leads }) => {
  const [selectedPortal, setSelectedPortal] = useState('all');

  // Calculer les statistiques par portail
  const portalStats = useMemo(() => {
    const stats = {};

    leads.forEach(lead => {
      const portal = lead.secteur || 'Non défini';

      if (!stats[portal]) {
        stats[portal] = {
          total: 0,
          chaud: 0,
          tiede: 0,
          froid: 0
        };
      }

      stats[portal].total++;

      if (lead.score === 'CHAUD') stats[portal].chaud++;
      else if (lead.score === 'TIEDE') stats[portal].tiede++;
      else if (lead.score === 'FROID') stats[portal].froid++;
    });

    // Trier par nombre total de leads (décroissant)
    return Object.entries(stats)
      .sort((a, b) => b[1].total - a[1].total)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }, [leads]);

  // Calculer le total général
  const totalStats = useMemo(() => {
    return {
      total: leads.length,
      chaud: leads.filter(l => l.score === 'CHAUD').length,
      tiede: leads.filter(l => l.score === 'TIEDE').length,
      froid: leads.filter(l => l.score === 'FROID').length
    };
  }, [leads]);

  // Obtenir les données filtrées pour l'affichage
  const displayStats = selectedPortal === 'all' ? totalStats : portalStats[selectedPortal];
  const displayLeads = selectedPortal === 'all'
    ? leads
    : leads.filter(l => (l.secteur || 'Non défini') === selectedPortal);

  // Calculer les pourcentages
  const getPercentage = (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <BarChart3 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Statistiques par Portail
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyse de la provenance des leads
            </p>
          </div>
        </div>
      </div>

      {/* Filtre par portail */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtrer par portail
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPortal('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedPortal === 'all'
                ? 'bg-accent text-black shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Tous les portails ({totalStats.total})
          </button>
          {Object.keys(portalStats).map(portal => (
            <button
              key={portal}
              onClick={() => setSelectedPortal(portal)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPortal === portal
                  ? 'bg-accent text-black shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {portal} ({portalStats[portal].total})
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg dark:hover:shadow-accent/5 transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
            <Target className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayStats?.total || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {selectedPortal === 'all' ? 'Tous les leads' : `Leads de ${selectedPortal}`}
          </p>
        </div>

        {/* Chauds */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg dark:hover:shadow-red-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chauds</span>
            <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 shadow-md dark:shadow-red-500/50"></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayStats?.chaud || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getPercentage(displayStats?.chaud || 0, displayStats?.total || 0)}% du total
          </p>
        </div>

        {/* Tièdes */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg dark:hover:shadow-orange-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tièdes</span>
            <div className="w-3 h-3 rounded-full bg-orange-500 dark:bg-orange-400 shadow-md dark:shadow-orange-500/50"></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayStats?.tiede || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getPercentage(displayStats?.tiede || 0, displayStats?.total || 0)}% du total
          </p>
        </div>

        {/* Froids */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Froids</span>
            <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 shadow-md dark:shadow-blue-500/50"></div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayStats?.froid || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getPercentage(displayStats?.froid || 0, displayStats?.total || 0)}% du total
          </p>
        </div>
      </div>

      {/* Tableau détaillé par portail */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Répartition par Portail
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Portail
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Chauds
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tièdes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Froids
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % du Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {Object.entries(portalStats).map(([portal, stats]) => (
                <tr
                  key={portal}
                  className={`transition-colors cursor-pointer ${
                    portal === selectedPortal
                      ? 'bg-accent/5 dark:bg-accent/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                  }`}
                  onClick={() => setSelectedPortal(portal)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 transition-colors ${
                        portal === selectedPortal ? 'bg-accent shadow-md shadow-accent/50' : 'bg-gray-400 dark:bg-gray-600'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {portal}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {stats.total}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      {stats.chaud}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                      {stats.tiede}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {stats.froid}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getPercentage(stats.total, totalStats.total)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Graphique visuel simple (barre de progression) */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Répartition Visuelle
        </h3>
        <div className="space-y-4">
          {Object.entries(portalStats).map(([portal, stats]) => {
            const percentage = getPercentage(stats.total, totalStats.total);
            return (
              <div key={portal}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {portal}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.total} leads ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent to-accent-dark h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KpiStats;
