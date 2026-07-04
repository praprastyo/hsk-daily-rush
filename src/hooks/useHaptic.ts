import { useCallback } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'error' | 'success';

export function useHaptic() {
  const trigger = useCallback((type: HapticType) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([30, 40, 30]);
          break;
        case 'error':
          navigator.vibrate([60, 50, 60]);
          break;
      }
    }
  }, []);

  return trigger;
}