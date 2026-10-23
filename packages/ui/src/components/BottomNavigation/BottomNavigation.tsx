import { FC, ReactNode } from 'react';

import { cn } from '../../utils';

type BottomNavigationProps = {
  children: ReactNode;
  className?: string;
};

type BottomNavigationItemProps = {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  'data-testid'?: string;
};

const BottomNavigationItem: FC<BottomNavigationItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  'data-testid': testId = 'bottom-navigation-item',
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    data-testid={testId}
    className={cn(
      'flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 py-2 text-xs transition-opacity',
      {
        'font-bold opacity-100': isActive,
        'opacity-60': !isActive,
      },
    )}
  >
    <span className="flex size-6 items-center justify-center">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

type BottomNavigationComponent = FC<BottomNavigationProps> & {
  Item: typeof BottomNavigationItem;
};

const BottomNavigationImpl: FC<BottomNavigationProps> = ({
  children,
  className,
}) => (
  <nav
    data-testid="bottom-navigation"
    className={cn('surface-bottombar flex w-full items-stretch', className)}
  >
    {children}
  </nav>
);

export const BottomNavigation =
  BottomNavigationImpl as BottomNavigationComponent;
BottomNavigation.Item = BottomNavigationItem;
