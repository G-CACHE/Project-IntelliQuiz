import { useEffect } from 'react';

/**
 * Applies site-wide security restrictions:
 *  - Disables right-click (context menu) on all pages
 *  - Blocks all DevTools / inspect keyboard shortcuts
 *  - Blocks print shortcuts (Ctrl+P, Cmd+P)
 *
 * Copy / text-selection restrictions are intentionally left to
 * AntiCheatWrapper so they only apply during active quiz sessions.
 */
export function useGlobalSecurityPolicy() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey; // Cmd on Mac
      const shift = e.shiftKey;
      const key = e.key;
      const code = e.code;

      // --- DevTools open shortcuts ---
      // F12
      if (key === 'F12') { e.preventDefault(); return; }

      // Ctrl+Shift+I  (Chrome / Firefox / Edge — Elements / Inspector)
      if (ctrl && shift && (key === 'I' || key === 'i')) { e.preventDefault(); return; }

      // Ctrl+Shift+J  (Chrome — Console)
      if (ctrl && shift && (key === 'J' || key === 'j')) { e.preventDefault(); return; }

      // Ctrl+Shift+C  (Chrome — Inspect Element picker)
      if (ctrl && shift && (key === 'C' || key === 'c')) { e.preventDefault(); return; }

      // Ctrl+Shift+K  (Firefox — Console)
      if (ctrl && shift && (key === 'K' || key === 'k')) { e.preventDefault(); return; }

      // Ctrl+Shift+E  (Firefox — Network)
      if (ctrl && shift && (key === 'E' || key === 'e')) { e.preventDefault(); return; }

      // Ctrl+Shift+M  (Firefox — Responsive design)
      if (ctrl && shift && (key === 'M' || key === 'm')) { e.preventDefault(); return; }

      // Ctrl+U  (View source)
      if (ctrl && (key === 'u' || key === 'U')) { e.preventDefault(); return; }

      // Ctrl+S  (Save page)
      if (ctrl && (key === 's' || key === 'S')) { e.preventDefault(); return; }

      // --- Print shortcuts ---
      // Ctrl+P / Cmd+P
      if (ctrl && (key === 'p' || key === 'P')) { e.preventDefault(); return; }

      // --- Screenshot shortcuts ---
      // PrintScreen key
      if (key === 'PrintScreen' || code === 'PrintScreen') { e.preventDefault(); return; }

      // Windows: Win+PrintScreen, Win+Shift+S (Snipping Tool) — can't fully block OS-level,
      // but blocking the key event prevents some browser-level captures.
      if (e.shiftKey && (key === 'PrintScreen' || code === 'PrintScreen')) { e.preventDefault(); return; }

      // macOS: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5, Cmd+Ctrl+Shift+3/4
      if (ctrl && shift && (key === '3' || key === '4' || key === '5')) { e.preventDefault(); return; }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);
}
