import { createRootRoute, useRouterState } from '@tanstack/react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { FC, useEffect, useState } from 'react';

import {
  PlayerShell,
  PlayerWorkspace,
  RouteTransition,
  SidebarNavigation,
  Toaster,
} from '@nuclearplayer/ui';

import { ConnectedPlayerBar } from '../components/ConnectedPlayerBar';
import {
  ConnectedQueuePanel,
  QueueHeaderActions,
} from '../components/ConnectedQueuePanel';
import { ConnectedSettingsModal } from '../components/ConnectedSettingsModal';
import { ConnectedStreamVerification } from '../components/ConnectedStreamVerification';
import { ConnectedTitleBar } from '../components/ConnectedTitleBar';
import { ConnectedTopBar } from '../components/ConnectedTopBar';
import { DevTools } from '../components/DevTools';
import { FlatpakWarningBanner } from '../components/FlatpakWarningBanner';
import { ConnectedMiniPlayer } from '../components/mobile/ConnectedMiniPlayer';
import { ConnectedNowPlayingScreen } from '../components/mobile/ConnectedNowPlayingScreen';
import { MobileHeader } from '../components/mobile/MobileHeader';
import { MobileTabBar } from '../components/mobile/MobileTabBar';
import { MobileQueueDrawer } from '../components/MobileQueueDrawer';
import { NavigationItems } from '../components/NavigationItems';
import { SoundProvider } from '../components/SoundProvider';
import { StreamResolver } from '../components/StreamResolver';
import { useSystemBarColors } from '../hooks/useSystemBarColors';
import { GlobalShortcuts } from '../shortcuts';
import { useLayoutStore } from '../stores/layoutStore';
import { useStartupStore } from '../stores/startupStore';
import { isMobilePlatform } from '../utils/platform';

const DesktopRoot: FC = () => {
  const {
    leftSidebar,
    rightSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebarWidth,
    setRightSidebarWidth,
  } = useLayoutStore();
  const isStartingUp = useStartupStore((state) => state.isStartingUp);
  useEffect(() => {
    const window = getCurrentWindow();
    window.show().then(() => window.setFocus());
  }, []);
  return (
    <PlayerShell onContextMenu={(e) => e.preventDefault()}>
      <GlobalShortcuts />
      <div>
        <ConnectedTitleBar />
        <FlatpakWarningBanner />
        <ConnectedTopBar />
      </div>
      {!isStartingUp && <StreamResolver />}
      <SoundProvider>
        <PlayerWorkspace>
          <PlayerWorkspace.LeftSidebar
            width={leftSidebar.width}
            isCollapsed={leftSidebar.isCollapsed}
            onWidthChange={setLeftSidebarWidth}
            onToggle={toggleLeftSidebar}
          >
            <SidebarNavigation isCompact={leftSidebar.isCollapsed}>
              <NavigationItems />
            </SidebarNavigation>
          </PlayerWorkspace.LeftSidebar>

          <PlayerWorkspace.Main>
            <RouteTransition />
          </PlayerWorkspace.Main>

          <PlayerWorkspace.RightSidebar
            width={rightSidebar.width}
            isCollapsed={rightSidebar.isCollapsed}
            onWidthChange={setRightSidebarWidth}
            onToggle={toggleRightSidebar}
            headerActions={<QueueHeaderActions />}
            footer={<ConnectedStreamVerification />}
          >
            <ConnectedQueuePanel isCollapsed={rightSidebar.isCollapsed} />
          </PlayerWorkspace.RightSidebar>
        </PlayerWorkspace>
      </SoundProvider>

      <ConnectedPlayerBar />
      <Toaster />
      <ConnectedSettingsModal />
      <DevTools />
    </PlayerShell>
  );
};

const MOBILE_TOAST_OFFSET = { bottom: 136 };

const MobileRoot: FC = () => {
  const isStartingUp = useStartupStore((state) => state.isStartingUp);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [isNowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [isQueueOpen, setQueueOpen] = useState(false);
  useSystemBarColors();

  useEffect(() => {
    setNowPlayingOpen(false);
    setQueueOpen(false);
  }, [pathname]);

  return (
    <PlayerShell>
      <div className="surface-topbar">
        <MobileHeader />
      </div>
      {!isStartingUp && <StreamResolver />}
      <SoundProvider>
        <PlayerWorkspace.Main className="min-h-0">
          <RouteTransition />
        </PlayerWorkspace.Main>
      </SoundProvider>
      <footer className="surface-bottombar border-border flex flex-col border-t-(length:--border-width)">
        <div className="px-2 pt-2 empty:hidden">
          <ConnectedMiniPlayer onOpen={() => setNowPlayingOpen(true)} />
        </div>
        <MobileTabBar />
      </footer>

      <ConnectedNowPlayingScreen
        isOpen={isNowPlayingOpen}
        onClose={() => setNowPlayingOpen(false)}
        onOpenQueue={() => setQueueOpen(true)}
      />
      <MobileQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setQueueOpen(false)}
      />
      <Toaster
        position="bottom-center"
        offset={MOBILE_TOAST_OFFSET}
        mobileOffset={MOBILE_TOAST_OFFSET}
      />
      <ConnectedSettingsModal />
    </PlayerShell>
  );
};

const RootComponent: FC = () =>
  isMobilePlatform() ? <MobileRoot /> : <DesktopRoot />;

export const Route = createRootRoute({
  component: RootComponent,
});
