import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-accent mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Cette section a rencontré un problème. Vous pouvez essayer de recharger la page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg font-medium hover:bg-accent-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recharger
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
