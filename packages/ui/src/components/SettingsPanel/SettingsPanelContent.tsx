import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

type SettingsPanelContentProps = {
  children: ReactNode;
  className?: string;
};

export const SettingsPanelContent: FC<SettingsPanelContentProps> = ({
  children,
  className,
}) => (
  <div
    className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}
  >
    {children}
  </div>
);
