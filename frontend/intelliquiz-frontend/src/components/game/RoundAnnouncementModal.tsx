import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import '../../styles/RoundAnnouncementModal.css';

interface RoundAnnouncementModalProps {
  roundName: string;
  message?: string;
  isVisible: boolean;
  onAnnoucementComplete?: () => void;
  durationSeconds?: number;
  manualStart?: boolean;
  onManualStart?: () => void;
  manualStartLabel?: string;
}

const RoundAnnouncementModal: React.FC<RoundAnnouncementModalProps> = ({
  roundName,
  message,
  isVisible,
  onAnnoucementComplete,
  durationSeconds = 5,
  manualStart = false,
  onManualStart,
  manualStartLabel = 'Click anywhere to start',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const onCompleteRef = useRef(onAnnoucementComplete);

  useEffect(() => {
    onCompleteRef.current = onAnnoucementComplete;
  }, [onAnnoucementComplete]);

  useEffect(() => {
    if (!isVisible) {
      setDisplayText('');
      setShowContent(false);
      setProgressPercent(0);
      return;
    }

    setShowContent(true);
    setProgressPercent(0);

    if (manualStart) {
      return;
    }

    const startedAt = Date.now();
    const durationMs = Math.max(1, durationSeconds * 1000);

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / durationMs);
      setProgressPercent(ratio * 100);
    }, 50);

    // Announce completion after configured duration
    const timer = setTimeout(() => {
      setProgressPercent(100);
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, durationMs);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(timer);
    };
  }, [isVisible, durationSeconds, manualStart]);

  // Animation enters the round name letter by letter
  useEffect(() => {
    if (!showContent || !roundName) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < roundName.length) {
        setDisplayText(roundName.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [showContent, roundName]);

  if (!isVisible) return null;

  const handleManualStart = () => {
    if (!manualStart || !onManualStart) return;
    onManualStart();
  };

  return (
    <div
      className="round-announcement-overlay"
      onClick={handleManualStart}
      role={manualStart && onManualStart ? 'button' : undefined}
      tabIndex={manualStart && onManualStart ? 0 : -1}
      onKeyDown={(event) => {
        if (!manualStart || !onManualStart) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onManualStart();
        }
      }}
    >
      <div className="round-announcement-modal">
        <div className="round-announcement-icon">
          <Zap size={64} />
        </div>
        <h1 className="round-announcement-title">
          {displayText}
          <span className="round-announcement-cursor">|</span>
        </h1>
        <p className="round-announcement-subtitle">
          {message || 'Get ready for the next challenge!'}
        </p>
        {manualStart ? (
          <button
            type="button"
            className="round-announcement-start-button"
            disabled={!onManualStart}
            onClick={(event) => {
              event.stopPropagation();
              handleManualStart();
            }}
          >
            {manualStartLabel}
          </button>
        ) : (
          <div className="round-announcement-progress">
            <div
              className="round-announcement-progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundAnnouncementModal;
