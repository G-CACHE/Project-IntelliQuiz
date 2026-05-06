import React, { useEffect, useRef } from 'react';

interface TimerProps {
  timeRemaining: number;
  totalTime?: number;
  large?: boolean;
  showProgress?: boolean;
  variant?: 'proctor' | 'participant';
  displayMode?: 'seconds' | 'clock';
}

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  totalTime = 30,
  large = false,
  showProgress = true,
  variant = 'proctor',
  displayMode = 'seconds',
}) => {
  const percentage = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;
  const isLow = timeRemaining <= 5;
  const isCritical = timeRemaining <= 3;
  const prevTimeRef = useRef(timeRemaining);
  const [tickAnimation, setTickAnimation] = React.useState(false);

  const prefix = variant === 'participant' ? 'participant' : 'proctor';

  // Trigger tick animation when time changes
  useEffect(() => {
    if (prevTimeRef.current !== timeRemaining && timeRemaining > 0) {
      setTickAnimation(true);
      const timer = setTimeout(() => setTickAnimation(false), 500);
      prevTimeRef.current = timeRemaining;
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const getTimerClass = () => {
    let classes = `${prefix}-timer`;
    if (large) classes += ` ${prefix}-timer-large`;
    if (isLow) classes += ` ${prefix}-timer-low`;
    if (isCritical) classes += ` ${prefix}-timer-critical`;
    return classes;
  };

  const getProgressClass = () => {
    let classes = `${prefix}-timer-progress-fill`;
    if (isCritical) classes += ` ${prefix}-timer-progress-critical`;
    else if (isLow) classes += ` ${prefix}-timer-progress-low`;
    return classes;
  };

  const getValueClass = () => {
    let classes = `${prefix}-timer-value`;
    if (tickAnimation) classes += ' tick-animation';
    return classes;
  };

  const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
  const seconds = Math.max(0, timeRemaining) % 60;
  const secondsPadded = String(seconds).padStart(2, '0');

  return (
    <div className={getTimerClass()}>
      {/* Time Display */}
      <div className={getValueClass()}>
        {displayMode === 'clock' ? (
          <>
            {minutes}m:{secondsPadded}
            <span className={`${prefix}-timer-unit`}>s</span>
          </>
        ) : (
          <>
            {timeRemaining}
            <span className={`${prefix}-timer-unit`}>s</span>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className={`${prefix}-timer-progress`}>
          <div
            className={getProgressClass()}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Warning Icon for Critical Time */}
      {isCritical && (
        <div className={`${prefix}-timer-warning`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`${prefix}-timer-warning-icon`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Timer;
