import { useSyncExternalStore } from 'react';

const NARROW_SCREEN_QUERY = '(width < 40rem)';

const narrowScreenQuery = () => window.matchMedia?.(NARROW_SCREEN_QUERY);

const subscribe = (onChange: () => void) => {
  const query = narrowScreenQuery();
  query?.addEventListener?.('change', onChange);
  return () => query?.removeEventListener?.('change', onChange);
};

const isNarrowScreen = () => narrowScreenQuery()?.matches === true;

export const useIsNarrowScreen = () =>
  useSyncExternalStore(subscribe, isNarrowScreen, () => false);
