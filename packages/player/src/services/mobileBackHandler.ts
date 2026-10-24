import { isMobilePlatform } from '../utils/platform';

declare global {
  interface Window {
    __nuclearHandleBack?: () => boolean;
  }
}

const closeTopmostDialog = () => {
  if (!document.querySelector('[role="dialog"]')) {
    return false;
  }
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
  return true;
};

export const initMobileBackHandler = () => {
  if (isMobilePlatform()) {
    window.__nuclearHandleBack = closeTopmostDialog;
  }
};
