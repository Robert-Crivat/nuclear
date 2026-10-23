import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeIcon, LibraryIcon, SearchIcon } from 'lucide-react';
import { useState } from 'react';

import { BottomNavigation } from '@nuclearplayer/ui';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Components/BottomNavigation',
  component: BottomNavigation,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof BottomNavigation>;

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState('home');
    return (
      <div className="w-96">
        <BottomNavigation>
          <BottomNavigation.Item
            icon={<HomeIcon />}
            label="Home"
            isActive={active === 'home'}
            onClick={() => setActive('home')}
          />
          <BottomNavigation.Item
            icon={<SearchIcon />}
            label="Search"
            isActive={active === 'search'}
            onClick={() => setActive('search')}
          />
          <BottomNavigation.Item
            icon={<LibraryIcon />}
            label="Library"
            isActive={active === 'library'}
            onClick={() => setActive('library')}
          />
        </BottomNavigation>
      </div>
    );
  },
};
