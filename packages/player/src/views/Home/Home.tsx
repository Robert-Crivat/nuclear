import { useNavigate } from '@tanstack/react-router';
import uniqBy from 'lodash-es/uniqBy';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import { CardsRow, CardsRowItem, ViewShell } from '@nuclearplayer/ui';

import { useQueueActions } from '../../hooks/useQueueActions';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { usePlaylistStore } from '../../stores/playlistStore';
import { DashboardWidgets } from '../Dashboard/Dashboard';
import { useListeningHistory } from '../History/hooks/queries/useListeningHistory';
import { entryToTrack } from '../History/utils/entryToTrack';

const RECENT_LIMIT = 50;
const RECENT_SHOWN = 12;

export const Home: FC = () => {
  const { t } = useTranslation('home');
  const { t: tNavigation } = useTranslation('navigation');
  const { t: tDashboard } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { playNow } = useQueueActions();
  const playlists = usePlaylistStore((state) => state.index);
  const albums = useFavoritesStore((state) => state.albums);
  const artists = useFavoritesStore((state) => state.artists);
  const { data: history } = useListeningHistory({
    limit: RECENT_LIMIT,
    offset: 0,
  });

  const labels = {
    filterPlaceholder: tDashboard('filter-playlists'),
    nothingFound: tDashboard('nothing-found'),
  };

  const recentItems: CardsRowItem[] = uniqBy(
    history?.items ?? [],
    (entry) => `${entry.title}|${entry.artists.join(',')}`,
  )
    .slice(0, RECENT_SHOWN)
    .map((entry) => ({
      id: entry.playId,
      title: entry.title,
      subtitle: entry.artists.join(', '),
      imageUrl: entry.artworkUrl ?? undefined,
      onClick: () => {
        const track = entryToTrack(entry);
        if (track) {
          playNow(track);
        }
      },
    }));

  const playlistItems: CardsRowItem[] = playlists.map((playlist) => ({
    id: playlist.id,
    title: playlist.name,
    imageUrl: playlist.thumbnails?.[0],
    onClick: () =>
      navigate({
        to: '/playlists/$playlistId',
        params: { playlistId: playlist.id },
      }),
  }));

  const albumItems: CardsRowItem[] = albums.map((entry) => ({
    id: `${entry.ref.source.provider}-${entry.ref.source.id}`,
    title: entry.ref.title,
    subtitle: entry.ref.artists?.[0]?.name,
    imageUrl: pickArtwork(entry.ref.artwork, 'cover', 300)?.url,
    onClick: () =>
      navigate({
        to: `/album/${entry.ref.source.provider}/${entry.ref.source.id}`,
      }),
  }));

  const artistItems: CardsRowItem[] = artists.map((entry) => ({
    id: `${entry.ref.source.provider}-${entry.ref.source.id}`,
    title: entry.ref.name,
    imageUrl: pickArtwork(entry.ref.artwork, 'cover', 300)?.url,
    onClick: () =>
      navigate({
        to: `/artist/${entry.ref.source.provider}/${entry.ref.source.id}`,
      }),
  }));

  return (
    <ViewShell data-testid="home-view" title={tNavigation('home')}>
      <div className="flex w-full flex-col gap-6 pb-6">
        {recentItems.length > 0 && (
          <CardsRow
            data-testid="home-recently-played"
            title={t('recentlyPlayed')}
            items={recentItems}
            labels={labels}
          />
        )}
        {playlistItems.length > 0 && (
          <CardsRow
            data-testid="home-playlists"
            title={t('yourPlaylists')}
            items={playlistItems}
            labels={labels}
          />
        )}
        {albumItems.length > 0 && (
          <CardsRow
            data-testid="home-favorite-albums"
            title={t('favoriteAlbums')}
            items={albumItems}
            labels={labels}
          />
        )}
        {artistItems.length > 0 && (
          <CardsRow
            data-testid="home-favorite-artists"
            title={t('favoriteArtists')}
            items={artistItems}
            labels={labels}
          />
        )}
        <DashboardWidgets />
      </div>
    </ViewShell>
  );
};
