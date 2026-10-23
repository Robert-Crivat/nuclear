import { useNavigate } from '@tanstack/react-router';
import { ListMusicIcon, MicVocalIcon } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { formatArtistNames } from '@nuclearplayer/model';
import { Button, Drawer, FavoriteButton, NowPlaying } from '@nuclearplayer/ui';

import { useFavoritesStore } from '../../stores/favoritesStore';
import { useQueueStore } from '../../stores/queueStore';
import { trackArtworkUrl } from '../../utils/trackArtwork';
import { ConnectedControls } from '../ConnectedPlayerBar';
import { ConnectedSeekBar } from '../ConnectedPlayerBar/ConnectedSeekBar';

type ConnectedNowPlayingScreenProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenQueue: () => void;
};

export const ConnectedNowPlayingScreen: FC<ConnectedNowPlayingScreenProps> = ({
  isOpen,
  onClose,
  onOpenQueue,
}) => {
  const { t } = useTranslation('nowPlaying');
  const { t: tNavigation } = useTranslation('navigation');
  const { t: tQueue } = useTranslation('queue');
  const { t: tTrack } = useTranslation('track');
  const navigate = useNavigate();
  const currentItem = useQueueStore((state) => state.getCurrentItem());
  const { isTrackFavorite, addTrack, removeTrack } = useFavoritesStore();

  const track = currentItem?.track;
  const artistSource = track?.artists[0]?.source;

  const openArtist = () => {
    if (!artistSource) {
      return;
    }
    onClose();
    navigate({
      to: '/artist/$providerId/$artistId',
      params: { providerId: artistSource.provider, artistId: artistSource.id },
    });
  };

  const openLyrics = () => {
    onClose();
    navigate({ to: '/lyrics' });
  };

  return (
    <Drawer
      isOpen={isOpen && Boolean(track)}
      onClose={onClose}
      side="bottom"
      data-testid="now-playing-screen"
    >
      {track && (
        <NowPlaying
          heading={t('title')}
          title={track.title}
          artist={formatArtistNames(track.artists)}
          coverUrl={trackArtworkUrl(track, 'cover', 600)}
          onClose={onClose}
          onArtistClick={artistSource ? openArtist : undefined}
          favorite={
            <FavoriteButton
              isFavorite={isTrackFavorite(track.source)}
              onToggle={() =>
                isTrackFavorite(track.source)
                  ? removeTrack(track.source)
                  : addTrack(track)
              }
              ariaLabelAdd={tTrack('actions.addToFavorites')}
              ariaLabelRemove={tTrack('actions.removeFromFavorites')}
            />
          }
          seekBar={<ConnectedSeekBar />}
          controls={
            <div className="[&_button]:size-11 [&_svg]:size-5 [&>div]:justify-between">
              <ConnectedControls />
            </div>
          }
          actions={
            <>
              <Button
                size="icon"
                variant="text"
                aria-label={tQueue('title')}
                onClick={onOpenQueue}
                data-testid="now-playing-queue"
              >
                <ListMusicIcon size={20} />
              </Button>
              <Button
                size="icon"
                variant="text"
                aria-label={tNavigation('lyrics')}
                onClick={openLyrics}
                data-testid="now-playing-lyrics"
              >
                <MicVocalIcon size={20} />
              </Button>
            </>
          }
          labels={{ close: t('close') }}
        />
      )}
    </Drawer>
  );
};
