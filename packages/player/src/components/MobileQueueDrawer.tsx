import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Drawer } from '@nuclearplayer/ui';

import { ConnectedControls } from './ConnectedPlayerBar';
import { ConnectedQueuePanel, QueueHeaderActions } from './ConnectedQueuePanel';
import { ConnectedStreamVerification } from './ConnectedStreamVerification';

type MobileQueueDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MobileQueueDrawer: FC<MobileQueueDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation('queue');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      className="w-full"
      data-testid="mobile-queue-drawer"
    >
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="font-bold">{t('title')}</span>
        <span className="flex items-center gap-1">
          <QueueHeaderActions />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2">
        <ConnectedQueuePanel />
      </div>
      <ConnectedStreamVerification />
      <div className="border-border border-t-(length:--border-width) py-2">
        <ConnectedControls />
      </div>
    </Drawer>
  );
};
