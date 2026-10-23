import { useCanGoBack, useRouter } from '@tanstack/react-router';
import { ChevronLeft, ListMusicIcon, MenuIcon } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, TopBar } from '@nuclearplayer/ui';

import { ConnectedThemeController } from './ConnectedThemeController';
import { SearchBox } from './SearchBox';

type ConnectedMobileTopBarProps = {
  onOpenNavigation: () => void;
  onOpenQueue: () => void;
};

export const ConnectedMobileTopBar: FC<ConnectedMobileTopBarProps> = ({
  onOpenNavigation,
  onOpenQueue,
}) => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const { t } = useTranslation('navigation');
  const { t: tCommon } = useTranslation('common');
  const { t: tQueue } = useTranslation('queue');

  return (
    <TopBar className="grid-cols-[auto_1fr_auto]">
      <div className="flex flex-row items-center gap-2">
        <Button
          size="icon-sm"
          aria-label={t('menu')}
          data-testid="mobile-navigation-button"
          onClick={onOpenNavigation}
        >
          <MenuIcon size={16} />
        </Button>
        <Button
          size="icon-sm"
          aria-label={tCommon('actions.back')}
          disabled={!canGoBack}
          onClick={() => router.history.back()}
        >
          <ChevronLeft size={16} />
        </Button>
      </div>
      <SearchBox />
      <div className="flex flex-row items-center justify-end gap-2">
        <ConnectedThemeController />
        <Button
          size="icon-sm"
          aria-label={tQueue('title')}
          data-testid="mobile-queue-button"
          onClick={onOpenQueue}
        >
          <ListMusicIcon size={16} />
        </Button>
      </div>
    </TopBar>
  );
};
