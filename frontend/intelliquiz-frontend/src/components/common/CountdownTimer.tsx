import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete]);

  return (
    <div className="text-3xl font-bold text-[#f8c107]">
      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
    </div>
  );
};
