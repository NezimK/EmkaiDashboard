import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../services/authApi';

const LOGICIEL_LABELS = {
  netty: 'Septeo',
  apimo: 'Apimo'
};

const PropertySyncSection = ({ currentUser, setToast }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState(null);
  const [logiciel, setLogiciel] = useState(null);

  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const baseUrl = import.meta.env.DEV ? '' : API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/sync/status/${currentUser.tenant_id}`);
        const data = await response.json();
        if (data.success) {
          if (data.last_sync) {
            setLastSyncDate(new Date(data.last_sync));
          }
          if (data.logiciel) {
            setLogiciel(data.logiciel);
          }
        }
      } catch (error) {
        console.error('Erreur chargement statut sync:', error);
      }
    };
    loadSyncStatus();
  }, [currentUser.tenant_id]);

  const handleSyncProperties = async () => {
    if (!logiciel) return;

    setIsSyncing(true);
    try {
      const baseUrl = import.meta.env.DEV ? '' : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/sync/${logiciel}/${currentUser.tenant_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setToast({ type: 'success', message: 'Synchronisation des biens lancée avec succès' });
        setLastSyncDate(new Date());
      } else {
        throw new Error(data.error || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
      setToast({ type: 'error', message: 'Impossible de lancer la synchronisation. Veuillez réessayer.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const logicielLabel = LOGICIEL_LABELS[logiciel] || logiciel || 'votre logiciel';

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <RefreshCw className="w-6 h-6 text-accent" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Synchronisation des biens
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        Lancez manuellement la récupération de vos biens immobiliers depuis {logicielLabel}.
        Cette opération peut prendre quelques minutes.
      </p>

      <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Synchronisation manuelle</p>
          <p className="text-sm text-gray-500">Mettre à jour la liste de vos biens</p>
        </div>
        <button
          onClick={handleSyncProperties}
          disabled={isSyncing || !logiciel}
          className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-dark text-black rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser mes biens'}</span>
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        {lastSyncDate ? (
          <p>
            Dernière synchronisation : {lastSyncDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        ) : (
          <p>Aucune synchronisation effectuée</p>
        )}
      </div>
    </div>
  );
};

export default PropertySyncSection;
