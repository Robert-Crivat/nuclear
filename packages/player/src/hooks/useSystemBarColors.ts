import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

type Rgba = [number, number, number, number];

const RGB_PATTERN =
  /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/;

const parseColor = (cssColor: string): Rgba | undefined => {
  const match = RGB_PATTERN.exec(cssColor);
  if (match) {
    const [, red, green, blue, alpha = '1'] = match;
    return [Number(red), Number(green), Number(blue), Number(alpha)];
  }
  const context = document.createElement('canvas').getContext('2d');
  if (!context) {
    return undefined;
  }
  context.fillStyle = cssColor;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  return [red, green, blue, alpha / 255];
};

const opacityOf = (element: Element) => {
  let opacity = 1;
  for (let node: Element | null = element; node; node = node.parentElement) {
    opacity *= Number(getComputedStyle(node).opacity || 1);
  }
  return opacity;
};

const toHex = (channels: number[]) =>
  `#${channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`;

const colorAt = (x: number, y: number) => {
  const layers: Rgba[] = [];
  for (const element of document.elementsFromPoint?.(x, y) ?? []) {
    const color = parseColor(getComputedStyle(element).backgroundColor);
    if (!color || color[3] === 0) {
      continue;
    }
    const alpha = color[3] * opacityOf(element);
    if (alpha === 0) {
      continue;
    }
    layers.push([color[0], color[1], color[2], alpha]);
    if (alpha >= 1) {
      break;
    }
  }
  if (layers.length === 0) {
    return undefined;
  }
  return toHex(
    layers.reduceRight<number[]>(
      (base, [red, green, blue, alpha]) => [
        base[0] * (1 - alpha) + red * alpha,
        base[1] * (1 - alpha) + green * alpha,
        base[2] * (1 - alpha) + blue * alpha,
      ],
      [0, 0, 0],
    ),
  );
};

const RETRY_DELAY_MS = 1000;
const SETTLE_DELAY_MS = 100;

export const useSystemBarColors = () => {
  useEffect(() => {
    let lastSent = '';
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const sync = () => {
      const top = colorAt(window.innerWidth / 2, 0);
      const bottom = colorAt(window.innerWidth / 2, window.innerHeight - 1);
      const side = colorAt(0, window.innerHeight / 2) ?? bottom;
      const colors = `${top}${bottom}${side}`;
      if (!top || !bottom || colors === lastSent) {
        return;
      }
      invoke('plugin:nuclear-android|setSystemBarColors', {
        top,
        bottom,
        side,
      })
        .then(() => {
          lastSent = colors;
        })
        .catch(() => {
          clearTimeout(retryTimer);
          retryTimer = setTimeout(scheduleSync, RETRY_DELAY_MS);
        });
    };

    const scheduleSync = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(sync, SETTLE_DELAY_MS);
    };

    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-id', 'style', 'class'],
    });
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('transitionend', scheduleSync, true);
    document.addEventListener('animationend', scheduleSync, true);
    window.addEventListener('resize', scheduleSync);
    scheduleSync();

    return () => {
      observer.disconnect();
      document.removeEventListener('transitionend', scheduleSync, true);
      document.removeEventListener('animationend', scheduleSync, true);
      window.removeEventListener('resize', scheduleSync);
      clearTimeout(retryTimer);
      clearTimeout(settleTimer);
    };
  }, []);
};
