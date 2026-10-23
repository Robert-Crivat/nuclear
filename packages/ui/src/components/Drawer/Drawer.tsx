import { Transition, TransitionChild } from '@headlessui/react';
import { cva, VariantProps } from 'class-variance-authority';
import { FC, ReactNode, useEffect } from 'react';

import { cn } from '../../utils';

const drawerPanelVariants = cva(
  'surface-background border-border absolute inset-y-0 flex w-[min(20rem,85vw)] flex-col overflow-hidden backdrop-blur-xl transition duration-200 ease-out',
  {
    variants: {
      side: {
        left: 'left-0 border-r-(length:--border-width) data-closed:-translate-x-full',
        right:
          'right-0 border-l-(length:--border-width) data-closed:translate-x-full',
      },
    },
    defaultVariants: {
      side: 'left',
    },
  },
);

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  'data-testid'?: string;
} & VariantProps<typeof drawerPanelVariants>;

export const Drawer: FC<DrawerProps> = ({
  isOpen,
  onClose,
  side,
  children,
  className,
  'data-testid': testId = 'drawer',
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  return (
    <Transition show={isOpen}>
      <div className="fixed inset-0 z-40 overflow-hidden" data-testid={testId}>
        <TransitionChild>
          <div
            className="bg-overlay absolute inset-0 transition duration-200 data-closed:opacity-0"
            onClick={onClose}
            data-testid={`${testId}-backdrop`}
          />
        </TransitionChild>
        <TransitionChild>
          <div
            role="dialog"
            aria-modal="true"
            className={cn(drawerPanelVariants({ side }), className)}
            data-testid={`${testId}-panel`}
          >
            {children}
          </div>
        </TransitionChild>
      </div>
    </Transition>
  );
};
