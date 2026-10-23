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

  async mount(): Promise<RenderResult> {
    await initializeSettingsStore();
    registerBuiltInCoreSettings();

    const history = createMemoryHistory({ initialEntries: ['/dashboard'] });
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

  get playerShuffleButton() {
    return screen.queryByTestId('player-shuffle-button');
  },

  navigationButton: {
    async click() {
      await user.click(screen.getByTestId('mobile-navigation-button'));
    },
  },

  navigationDrawer: {
    get element() {
      return screen.queryByTestId('mobile-navigation-drawer-panel');
    },
    async goTo(label: string) {
      const drawer = await screen.findByTestId(
        'mobile-navigation-drawer-panel',
      );
      await user.click(within(drawer).getByText(label));
    },
  },

  queueButton: {
    async click() {
      await user.click(screen.getByTestId('mobile-queue-button'));
    },
  },

  queueDrawer: {
    async find() {
      return screen.findByTestId('mobile-queue-drawer-panel');
    },
  },

  async openGeneralSettings() {
    await this.navigationButton.click();
    await this.navigationDrawer.goTo('Preferences');
    await user.click(await screen.findByRole('button', { name: 'General' }));
    await screen.findByRole('heading', { name: 'General', level: 1 });
  },

  get customTitleBarToggle() {
    return screen.queryByRole('switch', { name: 'Custom title bar' });
  },
};
