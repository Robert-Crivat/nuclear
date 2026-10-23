import { FC } from 'react';

import { PlayerBar } from '@nuclearplayer/ui';

import { ConnectedControls } from './ConnectedControls';
import { ConnectedNowPlaying } from './ConnectedNowPlaying';
import { ConnectedSeekBar } from './ConnectedSeekBar';
import { ConnectedVolume } from './ConnectedVolume';

type ConnectedPlayerBarProps = {
  isCompact?: boolean;
};

export const ConnectedPlayerBar: FC<ConnectedPlayerBarProps> = ({
  isCompact = false,
}) => {
  return (
    <>
      <ConnectedSeekBar />
      {isCompact ? (
        <PlayerBar
          left={<ConnectedNowPlaying />}
          right={<ConnectedControls isCompact />}
        />
      ) : (
        <PlayerBar
          left={<ConnectedNowPlaying />}
          center={<ConnectedControls />}
          right={<ConnectedVolume />}
        />
      )}
    </>
  );
};
