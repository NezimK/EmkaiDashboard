import React, { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';

const StatusSelector = ({ isOpen, onClose, onSelect, currentStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || '');

  if (!isOpen) return null;

  const statuses = [
    { value: 'Qualifié', label: 'Qualifié', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
    { value: 'Contacté', label: 'Contacté', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { value: 'En Découverte', label: 'En Découverte', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
    { value: 'Visite Programmée', label: 'Visite Programmée', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    { value: 'Archivé', label: 'Archivé', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400' },
  ];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (selectedStatus) {
      onSelect(selectedStatus);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Changer le statut
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sélectionnez le nouveau statut du prospect
              </p>
            </div>
          </div>
        </div>

        {/* Liste des statuts */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  selectedStatus === status.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                {selectedStatus === status.value && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusSelector;
