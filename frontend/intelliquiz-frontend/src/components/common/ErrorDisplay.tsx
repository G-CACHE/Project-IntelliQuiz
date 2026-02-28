import React from 'react';
import { useNavigate } from 'react-router-dom';

type ErrorType = 'NETWORK' | 'VALIDATION' | 'AUTH' | 'CONNECTION' | 'SESSION' | 'UNKNOWN';

interface ErrorDisplayProps {
  type?: ErrorType;
  message: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  homeUrl?: string;
}

const ERROR_ICONS: Record<ErrorType, string> = {
  NETWORK: '🌐',
  VALIDATION: '⚠️',
  AUTH: '🔒',
  CONNECTION: '📡',
  SESSION: '⏱️',
  UNKNOWN: '❌',
};

const ERROR_TITLES: Record<ErrorType, string> = {
  NETWORK: 'Network Error',
  VALIDATION: 'Validation Error',
  AUTH: 'Authentication Error',
  CONNECTION: 'Connection Lost',
  SESSION: 'Session Expired',
  UNKNOWN: 'Something Went Wrong',
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type = 'UNKNOWN',
  message,
  onRetry,
  showHomeLink = true,
  homeUrl = '/',
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-primary-dark rounded-xl border border-red-500/30 text-center">
        {/* Icon */}
        <div className="text-6xl mb-4">{ERROR_ICONS[type]}</div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {ERROR_TITLES[type]}
        </h2>
        
        {/* Message */}
        <p className="text-gray-400 mb-6">{message}</p>
        
        {/* Actions */}
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-light text-black font-bold rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
          
          {showHomeLink && (
            <button
              onClick={() => navigate(homeUrl)}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              Return to Home
            </button>
          )}
        </div>
        
        {/* Help Text */}
        {type === 'CONNECTION' && (
          <p className="text-gray-500 text-sm mt-6">
            Check your internet connection and try again.
          </p>
        )}
        
        {type === 'SESSION' && (
          <p className="text-gray-500 text-sm mt-6">
            Your session has expired. Please log in again.
          </p>
        )}
      </div>
    </div>
  );
};

// Inline error banner for use within pages
export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ message, onRetry, onDismiss }) => {
  return (
    <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-red-400">⚠️</span>
        <p className="text-red-300">{message}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
