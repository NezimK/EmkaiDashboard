/**
 * @fileoverview Composant de dialogue de confirmation
 * @module components/ConfirmDialog
 *
 * @description
 * Modal de confirmation pour les actions critiques.
 * Supporte 3 variantes : default (gold), danger (red), warning (orange)
 *
 * @author IMMO Copilot Team
 * @version 1.0.0
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Dialogue de confirmation pour actions utilisateur
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.isOpen - État d'ouverture du dialogue
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Function} props.onConfirm - Callback de confirmation
 * @param {string} props.title - Titre du dialogue
 * @param {string} props.message - Message de confirmation
 * @param {string} props.confirmText - Texte du bouton de confirmation (défaut: 'Confirmer')
 * @param {string} props.cancelText - Texte du bouton d'annulation (défaut: 'Annuler')
 * @param {'default'|'danger'|'warning'} props.variant - Variante de couleur (défaut: 'default')
 * @returns {JSX.Element|null} Composant dialogue ou null si fermé
 */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmer', cancelText = 'Annuler', variant = 'default' }) => {
  if (!isOpen) return null;

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Ferme le dialogue si le clic est sur le backdrop (pas sur le contenu)
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Exécute l'action de confirmation et ferme le dialogue
   */
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // ============================================================
  // STYLES DYNAMIQUES PAR VARIANTE
  // ============================================================

  /**
   * Retourne les classes CSS en fonction de la variante
   * @returns {Object} Objet contenant les classes pour icon et button
   */
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          icon: 'text-orange-600 dark:text-orange-400',
          button: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
      default:
        return {
          icon: 'text-accent dark:text-accent',
          button: 'bg-accent hover:bg-accent-dark text-black font-semibold'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${styles.icon}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
