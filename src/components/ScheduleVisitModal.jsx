import React, { useState } from 'react';
import { X, Calendar, Clock, Trash2 } from 'lucide-react';
import Toast from './Toast';
import { scheduleVisit, cancelVisit } from '../services/airtable';
import { exportToCalendar } from '../utils/calendarExport';
import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, checkGoogleCalendarStatus } from '../services/calendarApi';

const ScheduleVisitModal = ({ lead, onClose, onLeadUpdate, agency }) => {
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('14:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [toast, setToast] = useState(null);

  // Si le lead a déjà une visite programmée, pré-remplir les champs
  React.useEffect(() => {
    if (lead.date_visite) {
      const date = new Date(lead.date_visite);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setVisitDate(dateStr);
      setVisitTime(timeStr);
    }
  }, [lead.date_visite]);

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

      const updatedLead = await scheduleVisit(agency, lead.id, dateTime.toISOString());

      // Notifier le parent
      if (onLeadUpdate) {
        onLeadUpdate(updatedLead);
      }

      // Synchroniser automatiquement avec Google Calendar si connecté
      const userDataString = sessionStorage.getItem('emkai_user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);

        // Vérifier si Google Calendar est connecté
        const isGoogleConnected = await checkGoogleCalendarStatus(userData.id);

        if (isGoogleConnected) {
          try {
            // Créer l'événement dans Google Calendar automatiquement
            const eventDetails = {
              title: `Visite - ${lead.nom}`,
              description: `Visite programmée avec ${lead.nom}\nEmail: ${lead.email || 'N/A'}\nTéléphone: ${lead.telephone || 'N/A'}`,
              startDateTime: dateTime.toISOString(),
              endDateTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString() // +1 heure
            };

            const result = await createGoogleCalendarEvent(userData.id, eventDetails);
            console.log('✅ Événement créé dans Google Calendar:', result.eventId);

            // Stocker l'eventId dans le lead pour pouvoir le supprimer plus tard
            updatedLead.googleCalendarEventId = result.eventId;
          } catch (exportError) {
            console.error('❌ Erreur lors de la création de l\'événement Google Calendar:', exportError);
            // Afficher un avertissement mais ne pas bloquer
            setToast({
              type: 'warning',
              message: 'Visite programmée mais erreur lors de l\'ajout au calendrier Google'
            });
          }
        } else {
          // Pour Outlook ou autre (ancien comportement)
          const connectedCalendar = sessionStorage.getItem(`calendar_${agency}_${userData.email}`);
          if (connectedCalendar) {
            try {
              exportToCalendar(connectedCalendar, updatedLead, dateTime);
              console.log('✅ Visite exportée vers', connectedCalendar);
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

      console.log('✅ Visite programmée:', dateTime.toISOString());
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

  const handleCancelVisit = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) {
      return;
    }

    setIsCanceling(true);

    try {
      const updatedLead = await cancelVisit(agency, lead.id);

      // Notifier le parent
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

      console.log('✅ Visite annulée');
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Date minimale : aujourd'hui
  const today = new Date().toISOString().split('T')[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
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
