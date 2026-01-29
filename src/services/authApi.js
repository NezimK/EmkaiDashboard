/**
 * Service d'authentification API pour le dashboard
 * Gère les tokens JWT et les appels authentifiés
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
      headers: { 'Content-Type': 'application/json' },
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
   */
  setTokens(accessToken, refreshToken, expiresIn, rememberMe = false) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = Date.now() + (expiresIn * 1000);

    const tokenData = JSON.stringify({
      accessToken,
      refreshToken,
      tokenExpiresAt: this.tokenExpiresAt
    });

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
    // Si pas de token, essayer de charger depuis localStorage
    if (!this.accessToken) {
      this.loadStoredTokens();
    }

    if (!this.accessToken) {
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
          headers: { 'Content-Type': 'application/json' },
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
            'Authorization': `Bearer ${this.accessToken}`
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

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Si token expiré, essayer de rafraîchir et réessayer
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'TOKEN_EXPIRED') {
        await this.refreshAccessToken();
        const newToken = await this.getValidToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
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
}

// Singleton
export const authApi = new AuthApi();

// Export de l'URL de base pour d'autres services
export const API_BASE_URL = API_BASE;
