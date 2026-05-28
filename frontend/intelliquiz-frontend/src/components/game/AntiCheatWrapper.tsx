import React, { useEffect, useCallback, useRef } from 'react';
import type { ViolationType } from '../../services/api';

interface AntiCheatWrapperProps {
  children: React.ReactNode;
  onViolation: (type: ViolationType) => void;
  enabled?: boolean;
}

/**
 * AntiCheatWrapper - Wraps participant game content to detect cheating attempts.
 * Monitors: tab switches (visibilitychange), copy, right-click, print-screen.
 * Calls onViolation callback (which reports to server via REST/SSE flow).
 */
const AntiCheatWrapper: React.FC<AntiCheatWrapperProps> = ({
  children,
  onViolation,
  enabled = true,
}) => {
  const violationCountRef = useRef(0);

  // Detect tab switch / visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && enabled) {
      violationCountRef.current++;
      console.warn(`[AntiCheat] Tab switch detected (count: ${violationCountRef.current})`);
      onViolation('TAB_SWITCH');
    }
  }, [enabled, onViolation]);

  // Detect copy attempt
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (enabled) {
      e.preventDefault();
      violationCountRef.current++;
      console.warn(`[AntiCheat] Copy attempt detected (count: ${violationCountRef.current})`);
      onViolation('COPY_ATTEMPT');
    }
  }, [enabled, onViolation]);

  // Detect right-click
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (enabled) {
      e.preventDefault();
      console.warn('[AntiCheat] Right-click detected (logged only, not counted as violation)');
    }
  }, [enabled]);

  // Detect print-screen and other suspicious key combos
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // PrintScreen key
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      console.warn('[AntiCheat] Print screen detected (logged only, not counted as violation)');
      return;
    }

    // Ctrl+P (print), Ctrl+C (copy), Ctrl+Shift+I (devtools), F12 (devtools)
    if (
      (e.ctrlKey && e.key === 'p') ||
      (e.ctrlKey && e.key === 'c') ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      e.key === 'F12'
    ) {
      e.preventDefault();
      console.warn(`[AntiCheat] Suspicious key combo: ${e.key} (logged only, not counted as violation)`);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu as EventListener);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu as EventListener);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleVisibilityChange, handleCopy, handleContextMenu, handleKeyDown]);

  return (
    <div
      className="anti-cheat-wrapper"
      style={{ userSelect: enabled ? 'none' : 'auto' }}
    >
      {children}
    </div>
  );
};

export default AntiCheatWrapper;
