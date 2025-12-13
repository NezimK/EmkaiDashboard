import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const Toast = ({ type = 'success', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle2,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-900 dark:text-green-100'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100'
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
