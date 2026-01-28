/**
 * @fileoverview Page de connexion de l'application
 * @module components/Login
 *
 * @description
 * Page de login avec authentification par email/mot de passe.
 * Inclut une fonctionnalité de récupération de mot de passe.
 * Affiche les comptes de démonstration pour les deux agences.
 *
 * @author IMMO Copilot Team
 * @version 1.1.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../services/supabase';

/**
 * Composant de page de connexion
 *
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Function} props.onLogin - Callback appelé lors de la soumission (email, password)
 * @param {string} props.error - Message d'erreur à afficher (optionnel)
 * @returns {JSX.Element} Page de login
 */
const Login = ({ onLogin, error: propError }) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // États pour le mot de passe oublié
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  // ============================================================
  // EFFECTS
  // ============================================================

  /**
   * Charge les identifiants sauvegardés au montage du composant
   */
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedEmail && savedRememberMe) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Gère la sauvegarde des identifiants si "Se souvenir de moi" est coché
   */
  const handleRememberMe = () => {
    if (rememberMe) {
      // Si on décoche, on supprime les données sauvegardées
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }
    setRememberMe(!rememberMe);
  };

  /**
   * Gère la soumission du formulaire de connexion
   * Simule un délai de 800ms pour l'expérience utilisateur
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Sauvegarder l'email si "Se souvenir de moi" est coché
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }

    // Simulation d'un délai de connexion pour UX
    setTimeout(() => {
      onLogin(email, password, rememberMe);
      setIsLoading(false);
    }, 800);
  };

  /**
   * Gère la soumission du formulaire de mot de passe oublié
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordError('');

    try {
      await resetPassword(forgotPasswordEmail);
      setForgotPasswordSuccess(true);
    } catch (error) {
      setForgotPasswordError(error.message || 'Une erreur est survenue');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  /**
   * Ouvre le formulaire de mot de passe oublié
   */
  const openForgotPassword = () => {
    setForgotPasswordEmail(email); // Pré-remplir avec l'email de connexion
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
    setShowForgotPassword(true);
  };

  /**
   * Ferme le formulaire de mot de passe oublié
   */
  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-bg to-gray-900 flex items-center justify-center px-4">
      {/* ==================== ARRIÈRE-PLAN DÉCORATIF ==================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-accent">IMMO</span>
            <span className="text-white ml-2">Copilot</span>
          </h1>
          <p className="text-gray-400">Connectez-vous à votre compte</p>
        </div>

        {/* Card */}
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMe}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-accent focus:ring-2 focus:ring-accent focus:ring-offset-0 transition-all cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-sm text-accent hover:text-accent-dark transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Error Message */}
            {propError && (
              <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-400">{propError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-black
                bg-gradient-to-r from-accent to-accent-dark
                hover:from-accent-dark hover:to-accent
                transition-all duration-200 transform
                ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}
                focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-bg
              `}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center mb-3">Comptes de démonstration</p>

            {/* Immocope */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-accent mb-2 flex items-center">
                <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                Immocope
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 font-semibold">Agent</span>
                    <span className="text-blue-400 text-[10px]">AGENT</span>
                  </div>
                  <div className="text-accent font-mono text-[11px]">agent@immocope.com / agent123</div>
                </div>
                <div className="p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 font-semibold">Manager</span>
                    <span className="text-purple-400 text-[10px]">MANAGER</span>
                  </div>
                  <div className="text-accent font-mono text-[11px]">manager@immocope.com / manager123</div>
                </div>
              </div>
            </div>

            {/* RealAgency */}
            <div>
              <p className="text-xs font-semibold text-green-400 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                RealAgency
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 font-semibold">Agent</span>
                    <span className="text-blue-400 text-[10px]">AGENT</span>
                  </div>
                  <div className="text-green-400 font-mono text-[11px]">agent@realagency.com / agent123</div>
                </div>
                <div className="p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 font-semibold">Manager</span>
                    <span className="text-purple-400 text-[10px]">MANAGER</span>
                  </div>
                  <div className="text-green-400 font-mono text-[11px]">manager@realagency.com / manager123</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2025 IMMO Copilot - Tous droits réservés
        </p>
      </div>

      {/* ==================== MODAL MOT DE PASSE OUBLIÉ ==================== */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-2xl w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            {/* Bouton retour */}
            <button
              onClick={closeForgotPassword}
              className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Retour</span>
            </button>

            {/* Contenu */}
            <div className="mt-8">
              {forgotPasswordSuccess ? (
                // État de succès
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Email envoyé !</h2>
                  <p className="text-gray-400 mb-6">
                    Un email de réinitialisation a été envoyé à{' '}
                    <span className="text-accent font-medium">{forgotPasswordEmail}</span>.
                    <br />
                    Vérifiez votre boîte de réception et suivez les instructions.
                  </p>
                  <button
                    onClick={closeForgotPassword}
                    className="w-full py-3 px-4 rounded-lg font-semibold text-black bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                // Formulaire de réinitialisation
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-accent" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Mot de passe oublié ?</h2>
                    <p className="text-gray-400 text-sm">
                      Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                          id="forgotEmail"
                          type="email"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                          placeholder="votre@email.com"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {forgotPasswordError && (
                      <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-400">{forgotPasswordError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className={`
                        w-full py-3 px-4 rounded-lg font-semibold text-black
                        bg-gradient-to-r from-accent to-accent-dark
                        hover:from-accent-dark hover:to-accent
                        transition-all duration-200 transform
                        ${forgotPasswordLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}
                        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-dark-bg
                      `}
                    >
                      {forgotPasswordLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
