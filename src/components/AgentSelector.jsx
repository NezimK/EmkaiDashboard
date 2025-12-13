import React, { useState } from 'react';
import { Users, Check } from 'lucide-react';

const AgentSelector = ({ isOpen, onClose, onSelect, currentAgent, availableAgents }) => {
  const [selectedAgent, setSelectedAgent] = useState(currentAgent || null);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (selectedAgent) {
      onSelect(selectedAgent);
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
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assigner à un agent
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sélectionnez l'agent qui gérera ce dossier
              </p>
            </div>
          </div>
        </div>

        {/* Liste des agents */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {availableAgents.map((agent) => (
              <button
                key={agent.name}
                onClick={() => setSelectedAgent(agent.name)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  selectedAgent === agent.name
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                    selectedAgent === agent.name
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {agent.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.role}</p>
                  </div>
                </div>
                {selectedAgent === agent.name && (
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
            disabled={!selectedAgent}
            className="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assigner
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentSelector;
