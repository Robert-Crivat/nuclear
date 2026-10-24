import { useNavigate, useRouterState } from '@tanstack/react-router';
import { HomeIcon, LibraryIcon, SearchIcon } from 'lucide-react';
import { FC, useRef } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { BottomNavigation } from '@nuclearplayer/ui';

const LIBRARY_PATHS = [
  '/library',
  '/playlists',
  '/favorites',
  '/history',
  '/sources',
];

const HOME_PATHS = ['/home', '/dashboard'];

type Tab = 'home' | 'search' | 'library';

const tabForPath = (pathname: string): Tab | undefined => {
  if (pathname.startsWith('/search')) {
    return 'search';
  }
  if (LIBRARY_PATHS.some((path) => pathname.startsWith(path))) {
    return 'library';
  }
  if (HOME_PATHS.includes(pathname)) {
    return 'home';
  }
  return undefined;
};

const TAB_ROOTS: Record<Tab, string> = {
  home: '/home',
  search: '/search',
  library: '/library',
};

export const MobileTabBar: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tSearch } = useTranslation('search');
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const lastTab = useRef<Tab>('home');
  const lastHrefs = useRef<Record<Tab, string>>({ ...TAB_ROOTS });
  const currentTab = tabForPath(location.pathname);
  if (currentTab) {
    lastHrefs.current[currentTab] = location.href;
  }
  lastTab.current = currentTab ?? lastTab.current;
  const active = lastTab.current;

  const openTab = (tab: Tab) =>
    navigate({
      href: tab === active ? TAB_ROOTS[tab] : lastHrefs.current[tab],
    });

  return (
    <BottomNavigation>
      <BottomNavigation.Item
        icon={<HomeIcon />}
        label={t('home')}
        isActive={active === 'home'}
        onClick={() => openTab('home')}
        data-testid="tab-home"
      />
      <BottomNavigation.Item
        icon={<SearchIcon />}
        label={tSearch('title')}
        isActive={active === 'search'}
        onClick={() => openTab('search')}
        data-testid="tab-search"
      />
      <BottomNavigation.Item
        icon={<LibraryIcon />}
        label={t('library')}
        isActive={active === 'library'}
        onClick={() => openTab('library')}
        data-testid="tab-library"
      />
    </BottomNavigation>
  );
};
