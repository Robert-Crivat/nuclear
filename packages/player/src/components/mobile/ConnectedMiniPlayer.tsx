import { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '@nuclearplayer/i18n';
import { formatArtistNames } from '@nuclearplayer/model';
import { MiniPlayer } from '@nuclearplayer/ui';

import { playbackManager } from '../../services/playback';
import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';
import { trackArtworkUrl } from '../../utils/trackArtwork';

type ConnectedMiniPlayerProps = {
  onOpen: () => void;
};

export const ConnectedMiniPlayer: FC<ConnectedMiniPlayerProps> = ({
  onOpen,
}) => {
  const { t } = useTranslation('nowPlaying');
  const currentItem = useQueueStore((state) => state.getCurrentItem());
  const { status, seek, duration } = useSoundStore(
    useShallow((state) => ({
      status: state.status,
      seek: state.seek,
      duration: state.duration,
    })),
  );

  if (!currentItem) {
    return null;
  }

  const { track } = currentItem;
  const progress =
    Number.isFinite(duration) && duration > 0 ? (seek / duration) * 100 : 0;

  return (
    <MiniPlayer
      title={track.title}
      artist={formatArtistNames(track.artists)}
      coverUrl={trackArtworkUrl(track, 'thumbnail', 64)}
      isPlaying={status === 'playing'}
      isLoading={currentItem.status === 'loading'}
      progress={progress}
      onPlayPause={playbackManager.toggle}
      onOpen={onOpen}
      labels={{
        play: t('play'),
        pause: t('pause'),
        open: t('open'),
      }}
    />
  );
};
