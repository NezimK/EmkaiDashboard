import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin, error: propError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation d'un délai de connexion
    setTimeout(() => {
      onLogin(email, password);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-dark-bg to-gray-900 flex items-center justify-center px-4">
      {/* Decoration Background */}
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
    </div>
  );
};

export default Login;
