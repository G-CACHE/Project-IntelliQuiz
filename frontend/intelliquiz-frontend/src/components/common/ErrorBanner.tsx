import React from 'react';

interface ErrorBannerProps {
  message: string;
  onClose?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onClose }) => {
  return (
    <div className="bg-primary/20 border border-primary text-white px-4 py-3 rounded-lg flex justify-between items-center">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-xl font-bold">
          ×
        </button>
      )}
    </div>
  );
};
