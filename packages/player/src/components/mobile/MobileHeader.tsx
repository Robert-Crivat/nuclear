import {
  useCanGoBack,
  useRouter,
  useRouterState,
} from '@tanstack/react-router';
import { ChevronLeft, SettingsIcon } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, TopBar } from '@nuclearplayer/ui';

import { useSettingsModalStore } from '../../stores/settingsModalStore';
import { ConnectedThemeController } from '../ConnectedThemeController';
import { SearchBox } from '../SearchBox';
import { UpdateBadge } from '../UpdateBadge';

const TAB_ROOTS = ['/home', '/search', '/library', '/dashboard'];

export const MobileHeader: FC = () => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const openSettings = useSettingsModalStore((state) => state.open);
  const { t } = useTranslation('common');
  const { t: tPreferences } = useTranslation('preferences');

  const isTabRoot = TAB_ROOTS.includes(pathname);
  const isSearch = pathname.startsWith('/search');

  return (
    <TopBar className="grid-cols-[auto_1fr_auto]">
      <div className="flex flex-row items-center gap-2">
        {!isTabRoot && canGoBack ? (
          <Button
            size="icon-sm"
            aria-label={t('actions.back')}
            onClick={() => router.history.back()}
            data-testid="mobile-back-button"
          >
            <ChevronLeft size={16} />
          </Button>
        ) : (
          <UpdateBadge />
        )}
      </div>
      <div className="min-w-0">{isSearch && <SearchBox />}</div>
      <div className="flex flex-row items-center justify-end gap-2">
        <ConnectedThemeController />
        <Button
          size="icon-sm"
          aria-label={tPreferences('title')}
          onClick={() => openSettings()}
          data-testid="mobile-settings-button"
        >
          <SettingsIcon size={16} />
        </Button>
      </div>
    </TopBar>
  );
};
