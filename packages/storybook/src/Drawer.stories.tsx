import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button, Drawer } from '@nuclearplayer/ui';

const meta: Meta<typeof Drawer> = {
  title: 'Components/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Drawer>;

const DrawerDemo = ({ side }: { side: 'left' | 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open {side} drawer</Button>
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} side={side}>
        <div className="flex flex-col gap-2 p-4">
          <span className="font-bold">Drawer content</span>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </Drawer>
    </>
  );
};

export const Left: Story = {
  render: () => <DrawerDemo side="left" />,
};

export const Right: Story = {
  render: () => <DrawerDemo side="right" />,
};
