import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-3',
  lg: 'w-16 h-16 border-4',
  xl: 'w-24 h-24 border-4',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${SIZE_CLASSES[size]}
          border-accent border-t-transparent
          rounded-full animate-spin
        `}
      />
      {message && (
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Connection status indicator
export const ConnectionStatus: React.FC<{
  connected: boolean;
  connecting?: boolean;
  showLabel?: boolean;
}> = ({ connected, connecting = false, showLabel = true }) => {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-2 h-2 rounded-full
          ${connected ? 'bg-green-500' : connecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}
        `}
      />
      {showLabel && (
        <span className="text-gray-400 text-sm">
          {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
        </span>
      )}
    </div>
  );
};

// Loading overlay for buttons/forms
export const LoadingOverlay: React.FC<{
  loading: boolean;
  children: React.ReactNode;
}> = ({ loading, children }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};

// Skeleton loader for content
export const Skeleton: React.FC<{
  className?: string;
}> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`bg-gray-700 rounded animate-pulse ${className}`}
    />
  );
};

export default LoadingSpinner;
