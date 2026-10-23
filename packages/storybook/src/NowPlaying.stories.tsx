import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListMusicIcon, MicVocalIcon } from 'lucide-react';

import { Button, NowPlaying, PlayerBar } from '@nuclearplayer/ui';

const meta: Meta<typeof NowPlaying> = {
  title: 'Components/NowPlaying',
  component: NowPlaying,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof NowPlaying>;

export const Default: Story = {
  render: () => (
    <div className="h-[720px] w-96">
      <NowPlaying
        heading="Now playing"
        title="Around the World"
        artist="Daft Punk"
        coverUrl="https://picsum.photos/600"
        onClose={() => {}}
        onArtistClick={() => {}}
        seekBar={
          <PlayerBar.SeekBar
            progress={40}
            elapsedSeconds={96}
            remainingSeconds={146}
          />
        }
        controls={
          <PlayerBar.Controls
            isPlaying
            showDiscovery={false}
            labels={{}}
            onPlayPause={() => {}}
            onNext={() => {}}
            onPrevious={() => {}}
            onShuffleToggle={() => {}}
            onRepeatToggle={() => {}}
          />
        }
        actions={
          <>
            <Button size="icon" variant="text" aria-label="Queue">
              <ListMusicIcon size={20} />
            </Button>
            <Button size="icon" variant="text" aria-label="Lyrics">
              <MicVocalIcon size={20} />
            </Button>
          </>
        }
        labels={{ close: 'Close now playing' }}
      />
    </div>
  ),
};
