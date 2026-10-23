import { ChevronLeft } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';
import { DialogRoot } from '../Dialog/DialogRoot';
import { SettingsPanelContent } from './SettingsPanelContent';
import { SettingsPanelNavigation } from './SettingsPanelNavigation';

export type SettingsNavigationItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

export type SettingsNavigationSection = {
  id: string;
  label: string;
  items: SettingsNavigationItem[];
  activeItemId: string | null;
  onSelect: (itemId: string) => void;
};

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  sections: SettingsNavigationSection[];
  navigationFooter?: ReactNode;
  isShowingContent?: boolean;
  onShowNavigation?: () => void;
  labels?: {
    back: string;
  };
  children: ReactNode;
};

export const SettingsPanel: FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  sections,
  navigationFooter,
  isShowingContent = true,
  onShowNavigation,
  labels,
  children,
}) => (
  <DialogRoot
    isOpen={isOpen}
    onClose={onClose}
    className="narrow:inset-0 narrow:rounded-none narrow:border-0 fixed inset-8 flex w-auto max-w-none p-0"
  >
    <SettingsPanelNavigation
      sections={sections}
      footer={navigationFooter}
      className={cn({ 'max-sm:hidden': isShowingContent })}
    />
    <SettingsPanelContent
      className={cn({ 'max-sm:hidden': !isShowingContent })}
    >
      {onShowNavigation && (
        <div className="px-2 pt-2 sm:hidden">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={labels?.back}
            onClick={onShowNavigation}
            data-testid="settings-back-to-navigation"
          >
            <ChevronLeft size={20} />
          </Button>
        </div>
      )}
      {children}
    </SettingsPanelContent>
  </DialogRoot>
);
