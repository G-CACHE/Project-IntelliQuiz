import React from 'react';

interface HostControlsProps {
  onStart?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

export const HostControls: React.FC<HostControlsProps> = ({ onStart, onPause, onEnd }) => {
  return (
    <div className="flex gap-4">
      <button
        onClick={onStart}
        className="px-6 py-3 bg-[#f8c107] text-black font-bold rounded-lg hover:bg-[#e0ad06]"
      >
        Start Game
      </button>
      <button
        onClick={onPause}
        className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
      >
        Pause
      </button>
      <button
        onClick={onEnd}
        className="px-6 py-3 bg-[#880015] text-white font-bold rounded-lg hover:bg-[#6b000f]"
      >
        End Game
      </button>
    </div>
  );
};
