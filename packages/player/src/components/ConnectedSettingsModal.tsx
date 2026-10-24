import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { SettingsPanel } from '@nuclearplayer/ui';

import { useSettingsModalStore } from '../stores/settingsModalStore';
import { SocialLinks } from './SocialLinks';
import { useSettingsNavigation } from './useSettingsNavigation';
import { VersionString } from './VersionString';

export const ConnectedSettingsModal: FC = () => {
  const { isOpen, close, isShowingContent, showNavigation } =
    useSettingsModalStore();
  const { sections, content } = useSettingsNavigation();
  const { t } = useTranslation('common');

  return (
    <SettingsPanel
      isOpen={isOpen}
      onClose={close}
      sections={sections}
      isShowingContent={isShowingContent}
      onShowNavigation={showNavigation}
      labels={{ back: t('actions.back') }}
      navigationFooter={
        <div className="flex flex-col items-center gap-2">
          <SocialLinks />
          <VersionString />
        </div>
      }
    >
      {content}
    </SettingsPanel>
  );
};
