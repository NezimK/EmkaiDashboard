/**
 * @fileoverview Composant Toast pour les notifications système
 * @module components/Toast
 *
 * @description
 * Composant de notification temporaire (toast) avec fermeture automatique.
 * Supporte 3 types : success, error, warning
 *
 * @author IMMO Copilot Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

/**
 * Composant Toast pour afficher des notifications temporaires
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {'success'|'error'|'warning'} props.type - Type de notification (défaut: 'success')
 * @param {string} props.message - Message à afficher
 * @param {Function} props.onClose - Callback de fermeture
 * @param {number} props.duration - Durée d'affichage en ms (défaut: 3000, 0 = pas de fermeture auto)
 * @returns {JSX.Element} Composant toast
 */
const Toast = ({ type = 'success', message, onClose, duration = 3000 }) => {
  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Auto-fermeture du toast après la durée spécifiée
   * Si duration = 0, le toast reste affiché jusqu'à fermeture manuelle
   */
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // ============================================================
  // CONFIGURATION DES STYLES PAR TYPE
  // ============================================================

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-accent/10 dark:bg-accent/20',
      borderColor: 'border-accent',
      iconColor: 'text-accent dark:text-accent',
      textColor: 'text-gray-900 dark:text-white'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: XCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[type];

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`flex items-center space-x-3 ${bgColor} border-l-4 ${borderColor} p-4 rounded-lg shadow-xl max-w-md`}>
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <p className={`text-sm font-medium ${textColor} flex-1`}>{message}</p>
        <button
          onClick={onClose}
          className={`${iconColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
