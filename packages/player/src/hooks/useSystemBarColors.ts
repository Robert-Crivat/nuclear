import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

const RGB_PATTERN = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/;

const rasterize = (cssColor: string) => {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) {
    return undefined;
  }
  context.fillStyle = cssColor;
  context.fillRect(0, 0, 1, 1);
  return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
};

const toHex = (cssColor: string) => {
  const channels =
    RGB_PATTERN.exec(cssColor)?.slice(1).map(Number) ?? rasterize(cssColor);
  return channels
    ? `#${channels.map((value) => value.toString(16).padStart(2, '0')).join('')}`
    : undefined;
};

const backgroundOf = (selector: string) => {
  const element = document.querySelector(selector);
  const color = element && getComputedStyle(element).backgroundColor;
  return color ? toHex(color) : undefined;
};

const RETRY_DELAY_MS = 1000;

export const useSystemBarColors = () => {
  useEffect(() => {
    let lastSent = '';
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => {
      const top = backgroundOf('[data-system-bar="top"]');
      const bottom = backgroundOf('[data-system-bar="bottom"]');
      const colors = `${top}${bottom}`;
      if (!top || !bottom || colors === lastSent) {
        return;
      }
      invoke('plugin:nuclear-android|setSystemBarColors', { top, bottom })
        .then(() => {
          lastSent = colors;
        })
        .catch(() => {
          clearTimeout(retryTimer);
          retryTimer = setTimeout(sync, RETRY_DELAY_MS);
        });
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-id', 'style', 'class'],
    });
    observer.observe(document.head, { childList: true, subtree: true });
    sync();

    return () => {
      observer.disconnect();
      clearTimeout(retryTimer);
    };
  }, []);
};
