import { screen, waitFor, within } from '@testing-library/react';

import { usePlaylistStore } from '../stores/playlistStore';
import { useQueueStore } from '../stores/queueStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStartupStore } from '../stores/startupStore';
import { createQueueItem } from '../test/fixtures/queue';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import { MobileLayoutWrapper } from './MobileLayout.test-wrapper';

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: () => 'android',
}));

vi.mock(
  '../services/playlistFileService',
  async () =>
    (await import('../test/fixtures/playlists')).playlistFileServiceMock,
);

beforeEach(() => {
  resetInMemoryTauriStore();
  useSettingsStore.setState({ definitions: {}, values: {}, loaded: false });
  useQueueStore.setState({ items: [], currentIndex: 0 });
  usePlaylistStore.setState({ index: [], playlists: new Map() });
});

describe('Mobile layout', () => {
  it('opens on the home tab without the desktop sidebars', async () => {
    await MobileLayoutWrapper.mount();

    await waitFor(() => expect(MobileLayoutWrapper.pathname).toBe('/home'));
    expect(MobileLayoutWrapper.homeView).toBeInTheDocument();
    expect(MobileLayoutWrapper.tabs.isActive('home')).toBe(true);
    expect(MobileLayoutWrapper.desktopSidebars).toHaveLength(0);
  });

  it('shows your playlists on the home tab', async () => {
    await usePlaylistStore.getState().createPlaylist('Road trip');
    await MobileLayoutWrapper.mount('/home');

    const row = await screen.findByTestId('home-playlists');
    expect(within(row).getByText('Road trip')).toBeInTheDocument();
    expect(MobileLayoutWrapper.dashboardEmptyState).not.toBeInTheDocument();
  });

  it('suggests plugins when the home tab has nothing to show', async () => {
    useStartupStore.setState({ isStartingUp: false });
    await MobileLayoutWrapper.mount('/home');

    expect(
      await screen.findByTestId('dashboard-empty-state'),
    ).toBeInTheDocument();
  });

  it('reaches the playlists from the library tab', async () => {
    await MobileLayoutWrapper.mount('/home');

    await MobileLayoutWrapper.tabs.open('library');
    await MobileLayoutWrapper.library.open('Playlists');

    await waitFor(() =>
      expect(MobileLayoutWrapper.pathname).toBe('/playlists'),
    );
    expect(MobileLayoutWrapper.tabs.isActive('library')).toBe(true);
  });

  it('opens the search tab with an empty query', async () => {
    await MobileLayoutWrapper.mount('/home');

    await MobileLayoutWrapper.tabs.open('search');

    await waitFor(() => expect(MobileLayoutWrapper.pathname).toBe('/search'));
    expect(await screen.findByTestId('search-view')).toBeInTheDocument();
    expect(MobileLayoutWrapper.tabs.isActive('search')).toBe(true);
  });

  it('returns to the last search when switching back to the search tab', async () => {
    await MobileLayoutWrapper.mount('/search?q=adele');

    await MobileLayoutWrapper.tabs.open('home');
    await waitFor(() => expect(MobileLayoutWrapper.pathname).toBe('/home'));
    await MobileLayoutWrapper.tabs.open('search');

    await waitFor(() =>
      expect(MobileLayoutWrapper.href).toBe('/search?q=adele'),
    );
  });

  it('goes back to the tab root when tapping the active tab', async () => {
    await MobileLayoutWrapper.mount('/search?q=adele');

    await MobileLayoutWrapper.tabs.open('search');

    await waitFor(() => expect(MobileLayoutWrapper.href).toBe('/search?q='));
  });

  it('hides the mini player when nothing is queued', async () => {
    await MobileLayoutWrapper.mount('/home');

    expect(MobileLayoutWrapper.miniPlayer.element).not.toBeInTheDocument();
  });

  it('opens now playing and the queue from the mini player', async () => {
    useQueueStore.setState({ items: [createQueueItem('First Song')] });
    await MobileLayoutWrapper.mount('/home');

    await MobileLayoutWrapper.miniPlayer.open();
    const nowPlaying = await MobileLayoutWrapper.nowPlaying.find();
    expect(within(nowPlaying).getByText('First Song')).toBeInTheDocument();
    expect(
      within(nowPlaying).getByTestId('player-shuffle-button'),
    ).toBeInTheDocument();

    await MobileLayoutWrapper.nowPlaying.openQueue();
    const queue = await MobileLayoutWrapper.queueDrawer.find();
    expect(within(queue).getByText('First Song')).toBeInTheDocument();
  });

  it('opens settings on the section list and goes back to it from a section', async () => {
    await MobileLayoutWrapper.mount('/home');

    await MobileLayoutWrapper.settings.open();
    await MobileLayoutWrapper.settings.select('General');
    expect(MobileLayoutWrapper.settings.backButton).toBeInTheDocument();

    await MobileLayoutWrapper.settings.back();
    expect(
      await screen.findByRole('button', { name: 'General' }),
    ).toBeInTheDocument();
  });

  it('hides desktop-only settings', async () => {
    await MobileLayoutWrapper.mount('/home');

    await MobileLayoutWrapper.settings.open();
    await MobileLayoutWrapper.settings.select('General');

    expect(
      MobileLayoutWrapper.settings.customTitleBarToggle,
    ).not.toBeInTheDocument();
  });
});
