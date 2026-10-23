import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, RenderResult, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { routeTree } from '../routeTree.gen';
import { registerBuiltInCoreSettings } from '../services/coreSettings';
import { initializeSettingsStore } from '../stores/settingsStore';

const user = userEvent.setup();

export const MobileLayoutWrapper = {
  router: null as ReturnType<typeof createRouter> | null,

  async mount(initialPath = '/'): Promise<RenderResult> {
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    const history = createMemoryHistory({ initialEntries: [initialPath] });
    this.router = createRouter({ routeTree, history });
    const result = render(<App routerProp={this.router} />);
    await screen.findByTestId('player-workspace-main');
    return result;
  },

  get pathname() {
    return this.router?.state.location.pathname;
  },

  get desktopSidebars() {
    return screen.queryAllByTestId(/^sidebar-(left|right)$/);
  },

  tabs: {
    async open(name: 'home' | 'search' | 'library') {
      await user.click(screen.getByTestId(`tab-${name}`));
    },
    isActive(name: 'home' | 'search' | 'library') {
      return (
        screen.getByTestId(`tab-${name}`).getAttribute('aria-current') ===
        'page'
      );
    },
  },

  get homeView() {
    return screen.queryByTestId('home-view');
  },

  get homePlaylistsRow() {
    return screen.queryByTestId('home-playlists');
  },

  library: {
    async open(label: string) {
      const view = await screen.findByTestId('library-view');
      await user.click(within(view).getByText(label));
    },
  },

  miniPlayer: {
    get element() {
      return screen.queryByTestId('mini-player');
    },
    async open() {
      await user.click(screen.getByTestId('mini-player-open'));
    },
  },

  nowPlaying: {
    async find() {
      return screen.findByTestId('now-playing');
    },
    async openQueue() {
      await user.click(screen.getByTestId('now-playing-queue'));
    },
  },

  queueDrawer: {
    async find() {
      return screen.findByTestId('mobile-queue-drawer-panel');
    },
  },

  settings: {
    async open() {
      await user.click(screen.getByTestId('mobile-settings-button'));
    },
    async select(label: string) {
      await user.click(await screen.findByRole('button', { name: label }));
    },
    async back() {
      await user.click(screen.getByTestId('settings-back-to-navigation'));
    },
    get backButton() {
      return screen.queryByTestId('settings-back-to-navigation');
    },
    get customTitleBarToggle() {
      return screen.queryByRole('switch', { name: 'Custom title bar' });
    },
  },
};
