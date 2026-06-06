import React, { useEffect, useCallback, useRef } from 'react';
import type { ViolationType } from '../../services/api';

interface AntiCheatWrapperProps {
  children: React.ReactNode;
  onViolation: (type: ViolationType) => void;
  enabled?: boolean;
}

/**
 * AntiCheatWrapper - Wraps participant game content during an active quiz session.
 *
 * On top of the global security policy (right-click blocked, DevTools shortcuts
 * blocked, print shortcuts blocked), this wrapper adds:
 *   - Tab-switch detection  → reported as TAB_SWITCH violation
 *   - Copy attempt          → blocked + reported as COPY_ATTEMPT violation
 *   - Print-screen keys     → blocked + reported as PRINT_SCREEN violation
 *   - CSS user-select:none  → prevents mouse-drag text selection
 *   - -webkit-touch-callout:none → prevents long-press copy on iOS/Android
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
      onViolation('TAB_SWITCH');
    }
  }, [enabled, onViolation]);

  // Block all copy / cut attempts and report
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (enabled) {
      e.preventDefault();
      violationCountRef.current++;
      onViolation('COPY_ATTEMPT');
    }
  }, [enabled, onViolation]);

  const handleCut = useCallback((e: ClipboardEvent) => {
    if (enabled) {
      e.preventDefault();
    }
  }, [enabled]);

  // Block drag-start (another way to extract text)
  const handleDragStart = useCallback((e: DragEvent) => {
    if (enabled) {
      e.preventDefault();
    }
  }, [enabled]);

  // Block selection via selectstart
  const handleSelectStart = useCallback((e: Event) => {
    if (enabled) {
      e.preventDefault();
    }
  }, [enabled]);

  // Key-level blocks for print-screen and copy shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const ctrl = e.ctrlKey || e.metaKey;
    const key  = e.key;
    const code = e.code;

    // PrintScreen (all variants)
    if (key === 'PrintScreen' || code === 'PrintScreen') {
      e.preventDefault();
      violationCountRef.current++;
      onViolation('PRINT_SCREEN');
      return;
    }

    // Ctrl/Cmd+C  (copy)
    if (ctrl && (key === 'c' || key === 'C')) {
      e.preventDefault();
      violationCountRef.current++;
      onViolation('COPY_ATTEMPT');
      return;
    }

    // Ctrl/Cmd+X  (cut)
    if (ctrl && (key === 'x' || key === 'X')) {
      e.preventDefault();
      return;
    }

    // Ctrl/Cmd+A  (select all — prevents mass-select then copy)
    if (ctrl && (key === 'a' || key === 'A')) {
      e.preventDefault();
      return;
    }

    // macOS screenshot shortcuts: Cmd+Shift+3/4/5, Cmd+Ctrl+Shift+3/4
    if (ctrl && e.shiftKey && (key === '3' || key === '4' || key === '5')) {
      e.preventDefault();
      onViolation('PRINT_SCREEN');
      return;
    }
  }, [enabled, onViolation]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy',        handleCopy        as EventListener);
    document.addEventListener('cut',         handleCut         as EventListener);
    document.addEventListener('dragstart',   handleDragStart   as EventListener);
    document.addEventListener('selectstart', handleSelectStart as EventListener);
    document.addEventListener('keydown',     handleKeyDown,    { capture: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy',        handleCopy        as EventListener);
      document.removeEventListener('cut',         handleCut         as EventListener);
      document.removeEventListener('dragstart',   handleDragStart   as EventListener);
      document.removeEventListener('selectstart', handleSelectStart as EventListener);
      document.removeEventListener('keydown',     handleKeyDown,    { capture: true });
    };
  }, [enabled, handleVisibilityChange, handleCopy, handleCut, handleDragStart, handleSelectStart, handleKeyDown]);

  return (
    <div
      className="anti-cheat-wrapper"
      style={{
        userSelect:             enabled ? 'none' : 'auto',
        WebkitUserSelect:       enabled ? 'none' : 'auto',
        // @ts-expect-error — non-standard but widely supported on mobile
        WebkitTouchCallout:     enabled ? 'none' : 'default',
        MozUserSelect:          enabled ? 'none' : 'auto',
        msUserSelect:           enabled ? 'none' : 'auto',
        pointerEvents:          'auto',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default AntiCheatWrapper;
