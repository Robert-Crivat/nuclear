import { invoke } from '@tauri-apps/api/core';
import { render, waitFor } from '@testing-library/react';
import { FC } from 'react';

import { useSystemBarColors } from './useSystemBarColors';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

const layer = (backgroundColor: string) => {
  const element = document.createElement('div');
  element.style.backgroundColor = backgroundColor;
  document.body.appendChild(element);
  return element;
};

const SystemBars: FC = () => {
  useSystemBarColors();
  return null;
};

describe('useSystemBarColors', () => {
  it('blends translucent overlays into the system bar colors', async () => {
    const backdrop = layer('rgba(0, 0, 0, 0.5)');
    const header = layer('rgb(255, 255, 0)');
    const content = layer('rgb(0, 0, 255)');
    document.elementsFromPoint = (_x: number, y: number) =>
      y === 0 ? [backdrop, header] : [content];

    render(<SystemBars />);

    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        'plugin:nuclear-android|setSystemBarColors',
        { top: '#808000', bottom: '#0000ff', side: '#0000ff' },
      ),
    );
  });
});
