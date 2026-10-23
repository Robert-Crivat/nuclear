import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { MiniPlayer } from '@nuclearplayer/ui';

const meta: Meta<typeof MiniPlayer> = {
  title: 'Components/MiniPlayer',
  component: MiniPlayer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof MiniPlayer>;

const labels = { play: 'Play', pause: 'Pause', open: 'Open now playing' };

export const Playing: Story = {
  render: () => {
    const [isPlaying, setPlaying] = useState(true);
    return (
      <div className="w-96">
        <MiniPlayer
          title="Around the World"
          artist="Daft Punk"
          coverUrl="https://picsum.photos/200"
          isPlaying={isPlaying}
          progress={35}
          onPlayPause={() => setPlaying(!isPlaying)}
          onOpen={() => {}}
          labels={labels}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <div className="w-96">
      <MiniPlayer
        title="Around the World"
        artist="Daft Punk"
        isPlaying={false}
        isLoading
        progress={0}
        onPlayPause={() => {}}
        onOpen={() => {}}
        labels={labels}
      />
    </div>
  ),
};
