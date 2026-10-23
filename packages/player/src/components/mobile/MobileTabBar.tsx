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

export const MobileTabBar: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tSearch } = useTranslation('search');
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const lastTab = useRef<Tab>('home');
  lastTab.current = tabForPath(pathname) ?? lastTab.current;
  const active = lastTab.current;

  return (
    <BottomNavigation>
      <BottomNavigation.Item
        icon={<HomeIcon />}
        label={t('home')}
        isActive={active === 'home'}
        onClick={() => navigate({ to: '/home' })}
        data-testid="tab-home"
      />
      <BottomNavigation.Item
        icon={<SearchIcon />}
        label={tSearch('title')}
        isActive={active === 'search'}
        onClick={() => navigate({ to: '/search', search: { q: '' } })}
        data-testid="tab-search"
      />
      <BottomNavigation.Item
        icon={<LibraryIcon />}
        label={t('library')}
        isActive={active === 'library'}
        onClick={() => navigate({ to: '/library' })}
        data-testid="tab-library"
      />
    </BottomNavigation>
  );
};
