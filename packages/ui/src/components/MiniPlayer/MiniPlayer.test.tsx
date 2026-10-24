import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MiniPlayer } from '.';

const labels = { play: 'Play', pause: 'Pause', open: 'Open now playing' };

const renderMiniPlayer = (overrides = {}) => {
  const props = {
    title: 'Around the World',
    artist: 'Daft Punk',
    isPlaying: false,
    progress: 25,
    onPlayPause: vi.fn(),
    onOpen: vi.fn(),
    labels,
    ...overrides,
  };
  render(<MiniPlayer {...props} />);
  return props;
};

describe('MiniPlayer', () => {
  it('(Snapshot) renders the current track', () => {
    renderMiniPlayer();
    expect(screen.getByTestId('mini-player')).toMatchSnapshot();
  });

  it('opens the now playing screen when the track is tapped', async () => {
    const { onOpen, onPlayPause } = renderMiniPlayer();
    await userEvent.click(screen.getByRole('button', { name: labels.open }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onPlayPause).not.toHaveBeenCalled();
  });

  it('toggles playback without opening the now playing screen', async () => {
    const { onOpen, onPlayPause } = renderMiniPlayer({ isPlaying: true });
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPlayPause).toHaveBeenCalledOnce();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('shows the playback progress', () => {
    renderMiniPlayer({ progress: 40 });
    expect(screen.getByTestId('mini-player-progress')).toHaveStyle({
      width: '40%',
    });
  });
});
