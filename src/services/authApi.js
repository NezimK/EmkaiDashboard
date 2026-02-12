/**
 * Service d'authentification API pour le dashboard
 * Gère les tokens JWT et les appels authentifiés
 */

// En dev, utiliser '' (URL relative) pour passer par le proxy Vite → localhost:3000
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');
const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || 'https://n8n.emkai.fr';
const WEBHOOK_RESPONSE_URL = `${N8N_BASE}/webhook/response-dashboard-multitenant`;

class AuthApi {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.refreshPromise = null; // Pour éviter les refresh simultanés
  }

  /**
   * Connexion avec email et mot de passe
   * @param {string} email
   * @param {string} password
   * @param {boolean} rememberMe - Si true, persiste dans localStorage, sinon sessionStorage
   */
  async login(email, password, rememberMe = false) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }

    this.setTokens(data.accessToken, data.refreshToken, data.expiresIn, rememberMe);
    return data.user;
  }

  /**
   * Stocke les tokens en mémoire et dans le storage approprié
   * @param {boolean} rememberMe - Si true, utilise localStorage, sinon sessionStorage
   *                               Si undefined, garde le storage actuel (pour refresh token)
   */
  setTokens(accessToken, refreshToken, expiresIn, rememberMe) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000);

    const tokenData = JSON.stringify({
      accessToken,
      refreshToken,
      tokenExpiresAt: this.tokenExpiresAt
    });

    // Si rememberMe n'est pas défini (ex: lors d'un refresh), garder le storage actuel
    if (rememberMe === undefined) {
      // Déterminer quel storage était utilisé
      if (localStorage.getItem('emkai_tokens')) {
        localStorage.setItem('emkai_tokens', tokenData);
      } else {
        sessionStorage.setItem('emkai_tokens', tokenData);
      }
      return;
    }

    // Nettoyer les deux storages d'abord
    localStorage.removeItem('emkai_tokens');
    sessionStorage.removeItem('emkai_tokens');

    // Stocker selon la préférence "Se souvenir de moi"
    if (rememberMe) {
      localStorage.setItem('emkai_tokens', tokenData);
    } else {
      sessionStorage.setItem('emkai_tokens', tokenData);
    }
  }

  /**
   * Retourne un token valide, rafraîchit si nécessaire
   */
  async getValidToken() {
    // Si pas de token en mémoire, essayer de charger depuis le storage
    if (!this.accessToken) {
      const loaded = this.loadStoredTokens();
      if (import.meta.env.DEV) console.log('🔑 Tokens chargés depuis storage:', loaded);
    }

    if (!this.accessToken) {
      if (import.meta.env.DEV) console.warn('⚠️ Aucun token trouvé');
      throw new Error('Non authentifié');
    }

    // Rafraîchir si le token expire dans moins d'1 minute
    if (this.tokenExpiresAt && Date.now() > this.tokenExpiresAt - 60000) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Rafraîchit l'access token
   */
  async refreshAccessToken() {
    // Éviter les refresh simultanés
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      this.clearTokens();
      throw new Error('Session expirée');
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
              },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        if (!response.ok) {
          this.clearTokens();
          throw new Error('Session expirée');
        }

        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Déconnexion
   */
  async logout() {
    try {
      if (this.accessToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
              },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });
      }
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Efface tous les tokens (mémoire + storages)
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    localStorage.removeItem('emkai_tokens');
    sessionStorage.removeItem('emkai_tokens');
    sessionStorage.removeItem('emkai_user');
  }

  /**
   * Charge les tokens depuis localStorage ou sessionStorage
   * Vérifie d'abord localStorage (session persistante), puis sessionStorage
   */
  loadStoredTokens() {
    const stored = localStorage.getItem('emkai_tokens') || sessionStorage.getItem('emkai_tokens');
    if (stored) {
      try {
        const { accessToken, refreshToken, tokenExpiresAt } = JSON.parse(stored);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = tokenExpiresAt;
        return true;
      } catch (error) {
        console.warn('Erreur chargement tokens:', error);
        localStorage.removeItem('emkai_tokens');
        sessionStorage.removeItem('emkai_tokens');
      }
    }
    return false;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated() {
    if (!this.accessToken) {
      this.loadStoredTokens();
    }
    return !!this.accessToken;
  }

  /**
   * Récupère les infos de l'utilisateur connecté
   */
  async getCurrentUser() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/auth/me`);

    if (!response.ok) {
      throw new Error('Impossible de récupérer les informations utilisateur');
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Helper pour les requêtes authentifiées
   */
  async fetchWithAuth(url, options = {}) {
    const token = await this.getValidToken();

    // Auto-prefix relative URLs with API_BASE for production
    const fullUrl = url.startsWith('/') ? `${API_BASE}${url}` : url;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    // Si token expiré, essayer de rafraîchir et réessayer
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED') {
        await this.refreshAccessToken();
        const newToken = await this.getValidToken();
        return fetch(fullUrl, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
              }
        });
      }
    }

    return response;
  }

  /**
   * Change le mot de passe de l'utilisateur connecté
   */
  async changePassword(currentPassword, newPassword) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du changement de mot de passe');
    }

    return data;
  }

  // =============================================================================
  // Gestion des utilisateurs (Team Management)
  // =============================================================================

  /**
   * Récupère la liste des utilisateurs du tenant
   */
  async fetchUsers() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la récupération des utilisateurs');
    }

    return response.json();
  }

  /**
   * Récupère la liste des agents disponibles pour l'assignation de leads
   * @returns {Promise<Object>} { success, agents: [{ id, email, name, role }] }
   */
  async fetchAgents() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users/agents`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la récupération des agents');
    }

    return response.json();
  }

  /**
   * Crée un nouvel utilisateur (envoi d'invitation par email)
   * @param {Object} userData - { email, firstName, lastName, role }
   */
  async createUser(userData) {
    const url = `${API_BASE}/api/users`;

    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Erreur lors de la création de l\'utilisateur');
      if (data.code) {
        error.code = data.code;
        error.usersCount = data.usersCount;
        error.usersLimit = data.usersLimit;
        error.plan = data.plan;
      }
      throw error;
    }

    return data;
  }

  /**
   * Ajoute un siège supplémentaire (15€/mois)
   * @returns {Promise<Object>} { success, message, newMaxUsers }
   */
  async addExtraSeat() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/stripe/add-extra-seat`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'ajout du siège supplémentaire');
    }

    return data;
  }

  /**
   * Modifie un utilisateur existant
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updates - { firstName, lastName, role, is_active }
   */
  async updateUser(userId, updates) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la modification de l\'utilisateur');
    }

    return data;
  }

  /**
   * Désactive un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  async deactivateUser(userId) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users/${userId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la désactivation de l\'utilisateur');
    }

    return data;
  }

  /**
   * Met à jour l'email de l'utilisateur connecté (avec vérification du mot de passe)
   * @param {string} newEmail - Nouvel email
   * @param {string} password - Mot de passe actuel pour confirmation
   */
  async updateEmail(newEmail, password) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users/me/update-email`, {
      method: 'POST',
      body: JSON.stringify({ newEmail, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la modification de l\'email');
    }

    return data;
  }

  /**
   * Renvoie l'invitation / reset le mot de passe d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   */
  async resetUserPassword(userId) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/users/${userId}/reset-password`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du reset du mot de passe');
    }

    return data;
  }

  // =============================================================================
  // Gestion de l'abonnement (Stripe)
  // =============================================================================

  /**
   * Récupère les informations d'abonnement du tenant
   * @returns {Promise<Object>} Infos d'abonnement (plan, usage, limites, etc.)
   */
  async getSubscription() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/stripe/subscription`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la récupération de l\'abonnement');
    }

    return data;
  }

  /**
   * Crée une session Stripe Customer Portal pour gérer l'abonnement
   * @returns {Promise<Object>} { success: true, url: string }
   */
  async createPortalSession() {
    const response = await this.fetchWithAuth(`${API_BASE}/api/stripe/create-portal-session`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création de la session');
    }

    return data;
  }

  /**
   * Change de plan (upgrade ou downgrade)
   * @param {string} newPlan - Le nouveau plan (essentiel, avance, premium)
   * @returns {Promise<Object>} { success: true, message: string, subscription: Object }
   */
  async createUpgradeSession(newPlan) {
    const response = await this.fetchWithAuth(`${API_BASE}/api/stripe/create-upgrade-session`, {
      method: 'POST',
      body: JSON.stringify({ newPlan })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du changement de plan');
    }

    return data;
  }

  // =============================================================================
  // Webhook - Réponses Dashboard Multitenant
  // =============================================================================

  /**
   * Envoie une réponse au webhook n8n pour le dashboard multitenant
   * @param {Object} payload - Les données à envoyer au webhook
   */
  async sendWebhookResponse(payload) {
    try {
      const response = await fetch(WEBHOOK_RESPONSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn('Erreur webhook:', response.status);
        return null;
      }

      return response.json();
    } catch (error) {
      console.warn('Erreur lors de l\'envoi au webhook:', error);
      return null;
    }
  }
}

// Singleton
export const authApi = new AuthApi();

// Export de l'URL de base pour d'autres services
export const API_BASE_URL = API_BASE;
