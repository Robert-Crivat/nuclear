import { platform } from '@tauri-apps/plugin-os';

export const isMobilePlatform = () => {
  const current = platform();
  return current === 'android' || current === 'ios';
};
