import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, CreditCard, Plug, Bell, LifeBuoy, Archive, ChevronRight } from 'lucide-react';
import Toast from './Toast';
import TeamManagement from './TeamManagement';
import SubscriptionSection from './SubscriptionSection';
import { authApi, API_BASE_URL } from '../services/authApi';
import SettingsTabs from './settings/SettingsTabs';
import AccountSection from './settings/AccountSection';
import CalendarSection from './settings/CalendarSection';
import NotificationsSection from './settings/NotificationsSection';
import PropertySyncSection from './settings/PropertySyncSection';
import WhatsAppSection from './settings/WhatsAppSection';
import HelpSection from './settings/HelpSection';
import SupportSection from './settings/SupportSection';

const Settings = ({ currentUser, agency, onLogout, onUserUpdate, onRestartOnboarding, onNavigate, onPlanChanged, activeSettingsTab, onSettingsTabChange, accountType }) => {
  const [activeTab, setActiveTab] = useState(activeSettingsTab || 'compte');
  const [toast, setToast] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notifSettings, setNotifSettings] = useState({
    dailyReport: true,
    instantNotif: true,
    weeklyStats: false,
    teamPerf: false
  });

  // Sync external tab control (from onboarding)
  useEffect(() => {
    if (activeSettingsTab) {
      setActiveTab(activeSettingsTab);
    }
  }, [activeSettingsTab]);

  // Notify parent of tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onSettingsTabChange) {
      onSettingsTabChange(tabId);
    }
  };

  // Charger les préférences de notifications depuis le user
  useEffect(() => {
    if (currentUser.notification_settings) {
      setNotifSettings(prev => ({
        ...prev,
        ...currentUser.notification_settings
      }));
    }
  }, [currentUser.notification_settings]);

  // Charger les informations du tenant (WhatsApp number)
  useEffect(() => {
    const loadTenantInfo = async () => {
      try {
        const response = await authApi.fetchWithAuth(`/api/onboarding/tenant/${currentUser.tenant_id}`);
        const data = await response.json();
        if (data.success && data.tenant.whatsapp_number) {
          setWhatsappNumber(data.tenant.whatsapp_number);
        }
      } catch (error) {
        console.error('Erreur chargement infos tenant:', error);
      }
    };
    loadTenantInfo();
  }, [currentUser.tenant_id]);

  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';

  const tabs = [
    { id: 'compte', label: 'Mon Compte', icon: User },
    ...(isManagerOrAdmin ? [{ id: 'abonnement', label: 'Abonnement', icon: CreditCard }] : []),
    { id: 'integrations', label: 'Intégrations', icon: Plug },
    { id: 'preferences', label: 'Préférences', icon: Bell },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header + Tabs */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <SettingsIcon className="w-8 h-8 text-accent" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Réglages</h2>
        </div>
        <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Tab Content */}
      {activeTab === 'compte' && (
        <>
          <AccountSection
            currentUser={currentUser}
            agency={agency}
            onLogout={onLogout}
            onUserUpdate={onUserUpdate}
            setToast={setToast}
          />

          {/* Section Archives */}
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Archive className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Archives</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Consulter les prospects archivés et dossiers clôturés</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('archives')}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
              >
                <span>Voir les archives</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'abonnement' && isManagerOrAdmin && (
        <>
          <SubscriptionSection
            onNavigate={onNavigate}
            onPlanChanged={onPlanChanged}
          />
          {accountType === 'agence' && (
            <div data-onboarding="settings-team" className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <TeamManagement
                currentUser={currentUser}
                onToast={setToast}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'integrations' && (
        <>
          <CalendarSection
            currentUser={currentUser}
            agency={agency}
            setToast={setToast}
          />
          <PropertySyncSection
            currentUser={currentUser}
            setToast={setToast}
          />
          <WhatsAppSection whatsappNumber={whatsappNumber} />
        </>
      )}

      {activeTab === 'preferences' && (
        <>
          <NotificationsSection
            currentUser={currentUser}
            notifSettings={notifSettings}
            setNotifSettings={setNotifSettings}
            setToast={setToast}
          />
          <HelpSection onRestartOnboarding={onRestartOnboarding} />
        </>
      )}

      {activeTab === 'support' && (
        <SupportSection />
      )}

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

export default Settings;
