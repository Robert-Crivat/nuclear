import { waitFor, within } from '@testing-library/react';

import { useSettingsStore } from '../stores/settingsStore';
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
});

describe('Mobile layout', () => {
  it('replaces the desktop sidebars with drawers', async () => {
    await MobileLayoutWrapper.mount();

    expect(MobileLayoutWrapper.desktopSidebars).toHaveLength(0);
    expect(
      MobileLayoutWrapper.navigationDrawer.element,
    ).not.toBeInTheDocument();
  });

  it('navigates from the navigation drawer and closes it', async () => {
    await MobileLayoutWrapper.mount();

    await MobileLayoutWrapper.navigationButton.click();
    await MobileLayoutWrapper.navigationDrawer.goTo('Playlists');

    await waitFor(() =>
      expect(MobileLayoutWrapper.pathname).toBe('/playlists'),
    );
    await waitFor(() =>
      expect(
        MobileLayoutWrapper.navigationDrawer.element,
      ).not.toBeInTheDocument(),
    );
  });

  it('shows the queue and the full playback controls in the queue drawer', async () => {
    await MobileLayoutWrapper.mount();
    expect(MobileLayoutWrapper.playerShuffleButton).not.toBeInTheDocument();

    await MobileLayoutWrapper.queueButton.click();
    const drawer = await MobileLayoutWrapper.queueDrawer.find();

    expect(within(drawer).getByText('Queue is empty')).toBeInTheDocument();
    expect(
      within(drawer).getByTestId('player-shuffle-button'),
    ).toBeInTheDocument();
  });

  it('hides desktop-only settings', async () => {
    await MobileLayoutWrapper.mount();
    await MobileLayoutWrapper.openGeneralSettings();

    expect(MobileLayoutWrapper.customTitleBarToggle).not.toBeInTheDocument();
  });
});
