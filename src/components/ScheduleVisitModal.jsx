/**
 * @fileoverview Modal de programmation et gestion des visites
 * @module components/ScheduleVisitModal
 *
 * @description
 * Composant modal permettant de programmer, modifier ou annuler une visite avec un lead.
 * Intègre la synchronisation automatique avec Google Calendar via OAuth2.
 *
 * Fonctionnalités principales :
 * - Programmation de nouvelle visite
 * - Modification de visite existante
 * - Annulation de visite
 * - Synchronisation automatique Google Calendar
 * - Export manuel Outlook (fallback)
 *
 * @author IMMO Copilot Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Trash2 } from 'lucide-react';
import Toast from './Toast';
import { scheduleVisit, cancelVisit, sendVisitConfirmationWhatsApp, updateLead } from '../services/supabase';
import { exportToCalendar } from '../utils/calendarExport';
import { createGoogleCalendarEvent, checkGoogleCalendarStatus, deleteGoogleCalendarEvent } from '../services/calendarApi';

/**
 * Modal de gestion des visites
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.lead - Données du lead (nom, email, téléphone, date_visite)
 * @param {Function} props.onClose - Callback de fermeture de la modal
 * @param {Function} props.onLeadUpdate - Callback appelé après mise à jour du lead
 * @param {string} props.agency - Identifiant de l'agence (AGENCY_A ou AGENCY_B)
 * @returns {JSX.Element} Composant modal
 */
const ScheduleVisitModal = ({ lead, onClose, onLeadUpdate, agency }) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('14:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState(null);

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Pré-remplit les champs date/heure si une visite existe déjà
   */
  React.useEffect(() => {
    if (lead.date_visite) {
      const date = new Date(lead.date_visite);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setVisitDate(dateStr);
      setVisitTime(timeStr);
    }
  }, [lead.date_visite]);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Gère la programmation ou modification d'une visite
   *
   * @async
   * @param {Event} e - Événement de soumission du formulaire
   *
   * Workflow :
   * 1. Validation des champs date/heure
   * 2. Enregistrement dans Supabase via scheduleVisit()
   * 3. Tentative de synchronisation avec Google Calendar si connecté
   * 4. Fallback vers export manuel (Outlook) si Google Calendar non connecté
   * 5. Affichage du toast de confirmation
   */
  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!visitDate || !visitTime) {
      setToast({
        type: 'error',
        message: 'Veuillez sélectionner une date et une heure'
      });
      return;
    }

    setIsScheduling(true);

    try {
      // Combiner date et heure en ISO string
      const dateTimeString = `${visitDate}T${visitTime}:00`;
      const dateTime = new Date(dateTimeString);

      // 1️⃣ Enregistrer la visite dans Supabase
      const updatedLead = await scheduleVisit(agency, lead.id, dateTime.toISOString());

      // 2️⃣ Notifier le composant parent de la mise à jour
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }

      // 3️⃣ Envoyer un message WhatsApp de confirmation au prospect
      console.log('📱 [WhatsApp] lead.phone:', lead.phone, 'lead.telephone:', lead.telephone);
      if (lead.phone || lead.telephone) {
        console.log('📱 [WhatsApp] Envoi du message de confirmation...');
        console.log('📱 [WhatsApp] Agency (client_id):', agency);
        try {
          // Récupérer l'adresse depuis bienDetails si lead.adresse est null
          const adresseBien = lead.adresse || lead.bienDetails?.adresse || null;
          console.log('📱 [WhatsApp] lead.adresse:', lead.adresse);
          console.log('📱 [WhatsApp] lead.bienDetails:', lead.bienDetails);
          console.log('📱 [WhatsApp] adresseBien finale:', adresseBien);

          const whatsappResult = await sendVisitConfirmationWhatsApp(agency, {
            id: lead.id,
            nom: lead.nom,
            telephone: lead.phone || lead.telephone,
            adresse: adresseBien,
            bien: lead.bien,
            bienDetails: lead.bienDetails
          }, dateTime.toISOString());

          console.log('📱 [WhatsApp] Résultat:', whatsappResult);
          if (!whatsappResult.success) {
            console.error('⚠️ Message WhatsApp de confirmation non envoyé:', whatsappResult.error);
          } else {
            console.log('✅ [WhatsApp] Message envoyé avec succès');
          }
        } catch (whatsappError) {
          console.error('❌ Erreur lors de l\'envoi du message WhatsApp:', whatsappError);
          // Ne pas bloquer l'opération si le WhatsApp échoue
        }
      }

      // 4️⃣ Synchronisation automatique avec le calendrier
      const userDataString = sessionStorage.getItem('emkai_user');
      console.log('📅 [Calendar Sync] userDataString:', userDataString);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('📅 [Calendar Sync] userData.id:', userData.id);
        console.log('📅 [Calendar Sync] userData:', userData);

        // Vérifier si Google Calendar est connecté via OAuth
        const isGoogleConnected = await checkGoogleCalendarStatus(userData.id);
        console.log('📅 [Calendar Sync] isGoogleConnected:', isGoogleConnected);

        if (isGoogleConnected) {
          console.log('📅 [Calendar Sync] Google Calendar est connecté, création de l\'événement...');
          try {
            // Si une visite existait déjà, supprimer l'ancien événement Google Calendar
            if (lead.googleCalendarEventId && lead.date_visite) {
              try {
                await deleteGoogleCalendarEvent(userData.id, lead.googleCalendarEventId);
                console.log('✅ Ancien événement Google Calendar supprimé lors de la modification');
              } catch (deleteError) {
                console.warn('⚠️ Impossible de supprimer l\'ancien événement Google Calendar:', deleteError);
                // Ne pas bloquer l'opération si la suppression échoue
              }
            }

            // Créer le nouvel événement dans Google Calendar
            const eventDetails = {
              title: `Visite - ${lead.nom}`,
              description: `Visite programmée avec ${lead.nom}\nEmail: ${lead.email || 'N/A'}\nTéléphone: ${lead.telephone || 'N/A'}`,
              startDateTime: dateTime.toISOString(),
              endDateTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString() // Durée : 1 heure
            };

            console.log('📅 [Calendar Sync] Appel createGoogleCalendarEvent avec eventDetails:', eventDetails);
            const result = await createGoogleCalendarEvent(userData.id, eventDetails);
            console.log('📅 [Calendar Sync] Résultat création événement:', result);

            // Sauvegarder l'eventId dans Supabase pour permettre la suppression ultérieure
            await updateLead(agency, lead.id, {
              google_calendar_event_id: result.eventId
            });

            updatedLead.googleCalendarEventId = result.eventId;
          } catch (exportError) {
            console.error('❌ Erreur lors de la création de l\'événement Google Calendar:', exportError);
            // Afficher un avertissement mais ne pas bloquer l'opération
            setToast({
              type: 'warning',
              message: 'Visite programmée mais erreur lors de l\'ajout au calendrier Google'
            });
          }
        } else {
          console.log('📅 [Calendar Sync] Google Calendar NON connecté, fallback vers export manuel');
          // Fallback : Export manuel pour Outlook ou autres calendriers
          const connectedCalendar = sessionStorage.getItem(`calendar_${agency}_${userData.email}`);
          if (connectedCalendar) {
            try {
              exportToCalendar(connectedCalendar, updatedLead, dateTime);
            } catch (exportError) {
              console.error('❌ Erreur lors de l\'export vers le calendrier:', exportError);
            }
          }
        }
      }

      setToast({
        type: 'success',
        message: 'Visite programmée avec succès'
      });

      // Fermer la modal après 1 seconde
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de la programmation de la visite:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de la programmation de la visite'
      });
    } finally {
      setIsScheduling(false);
    }
  };

  /**
   * Gère l'annulation d'une visite existante
   *
   * @async
   *
   * Workflow :
   * 1. Demande de confirmation utilisateur
   * 2. Suppression de l'événement Google Calendar (si existant)
   * 3. Suppression de la visite dans Supabase via cancelVisit()
   * 4. Notification du composant parent
   * 5. Affichage du toast de confirmation
   */
  const handleCancelVisit = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) {
      return;
    }

    setIsCanceling(true);

    try {
      // 1️⃣ Supprimer l'événement Google Calendar si un eventId existe
      if (lead.googleCalendarEventId) {
        const userDataString = sessionStorage.getItem('emkai_user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          try {
            await deleteGoogleCalendarEvent(userData.id, lead.googleCalendarEventId);
            console.log('✅ Événement Google Calendar supprimé avec succès');
          } catch (calendarError) {
            console.error('⚠️ Erreur lors de la suppression de l\'événement Google Calendar:', calendarError);
            // Ne pas bloquer l'annulation si la suppression Google Calendar échoue
          }
        }
      }

      // 2️⃣ Annuler la visite dans Supabase
      const updatedLead = await cancelVisit(agency, lead.id);

      // 3️⃣ Notifier le composant parent de la mise à jour
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }

      setToast({
        type: 'success',
        message: 'Visite annulée avec succès'
      });

      // Fermer la modal après 1 seconde
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation de la visite:', error);
      setToast({
        type: 'error',
        message: 'Erreur lors de l\'annulation de la visite'
      });
    } finally {
      setIsCanceling(false);
    }
  };

  /**
   * Gère le clic sur le fond de la modal (backdrop)
   * Ferme la modal uniquement si le clic est sur le backdrop, pas sur le contenu
   */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  // Date minimale : aujourd'hui (empêche de programmer des visites dans le passé)
  const today = new Date().toISOString().split('T')[0];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* ==================== HEADER ==================== */}
        <div className="bg-gradient-to-r from-accent via-accent to-accent-dark p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {lead.date_visite ? 'Modifier la visite' : 'Programmer une visite'}
                </h2>
                <p className="text-sm text-white/90 font-medium">{lead.nom}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSchedule} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de la visite
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-accent dark:text-accent" />
              </div>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                min={today}
                required
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Heure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heure de la visite
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-5 w-5 text-accent dark:text-accent" />
              </div>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                required
                className="block w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            {/* Bouton Annuler la visite (si une visite existe déjà) */}
            {lead.date_visite ? (
              <button
                type="button"
                onClick={handleCancelVisit}
                disabled={isCanceling}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isCanceling ? 'Annulation...' : 'Annuler la visite'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Annuler
              </button>
            )}

            <button
              type="submit"
              disabled={isScheduling}
              className="flex-1 px-4 py-3 bg-accent hover:bg-accent-dark text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isScheduling ? 'Programmation...' : (lead.date_visite ? 'Modifier' : 'Programmer une visite')}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ScheduleVisitModal;
