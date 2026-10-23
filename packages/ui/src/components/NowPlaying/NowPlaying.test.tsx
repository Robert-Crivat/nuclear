import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NowPlaying } from '.';

const renderNowPlaying = (onClose = vi.fn(), onArtistClick = vi.fn()) =>
  render(
    <NowPlaying
      heading="Now playing"
      title="Around the World"
      artist="Daft Punk"
      onClose={onClose}
      onArtistClick={onArtistClick}
      seekBar={<div>seek bar</div>}
      controls={<div>controls</div>}
      actions={<button>Queue</button>}
      labels={{ close: 'Close now playing' }}
    />,
  );

describe('NowPlaying', () => {
  it('(Snapshot) renders the current track', () => {
    renderNowPlaying();
    expect(screen.getByTestId('now-playing')).toMatchSnapshot();
  });

  it('closes from the header button', async () => {
    const onClose = vi.fn();
    renderNowPlaying(onClose);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close now playing' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('opens the artist from the artist name', async () => {
    const onArtistClick = vi.fn();
    renderNowPlaying(vi.fn(), onArtistClick);
    await userEvent.click(screen.getByRole('button', { name: 'Daft Punk' }));
    expect(onArtistClick).toHaveBeenCalledOnce();
  });

  it('renders the seek bar, controls and actions it is given', () => {
    renderNowPlaying();
    expect(screen.getByText('seek bar')).toBeInTheDocument();
    expect(screen.getByText('controls')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Queue' })).toBeInTheDocument();
  });
});
