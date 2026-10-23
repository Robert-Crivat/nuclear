import { invoke } from '@tauri-apps/api/core';
import debounce from 'lodash-es/debounce';

import { i18n } from '@nuclearplayer/i18n';
import { formatArtistNames, type Track } from '@nuclearplayer/model';

import { useFavoritesStore } from '../stores/favoritesStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { useQueueStore } from '../stores/queueStore';
import { errorMessage } from '../utils/errorMessage';
import { Logger } from './logger';
import { playbackManager } from './playback';

type BrowseItem = {
  mediaId: string;
  title: string;
  subtitle?: string;
  isPlayable: boolean;
};

const MAX_PLAYLISTS = 50;

const trackItem = (mediaId: string, track: Track): BrowseItem => ({
  mediaId,
  title: track.title,
  subtitle: formatArtistNames(track.artists),
  isPlayable: true,
});

const folder = (mediaId: string, title: string): BrowseItem => ({
  mediaId,
  title,
  isPlayable: false,
});

const loadPlaylistTracks = async (playlistId: string): Promise<Track[]> => {
  const playlist = await usePlaylistStore.getState().loadPlaylist(playlistId);
  return playlist?.items.map((item) => item.track) ?? [];
};

export const buildBrowseTree = async (): Promise<
  Record<string, BrowseItem[]>
> => {
  const queue = useQueueStore.getState().items;
  const favorites = useFavoritesStore.getState().tracks;
  const playlists = usePlaylistStore.getState().index.slice(0, MAX_PLAYLISTS);

  const playlistEntries = await Promise.all(
    playlists.map(async (playlist) => {
      const tracks = await loadPlaylistTracks(playlist.id);
      return [
        `playlist:${playlist.id}`,
        tracks.map((track, index) =>
          trackItem(`playlist:${playlist.id}:${index}`, track),
        ),
      ] as const;
    }),
  );

  return {
    root: [
      folder('queue', i18n.t('queue:title')),
      folder('favorites', i18n.t('navigation:favoriteTracks')),
      folder('playlists', i18n.t('navigation:playlists')),
    ],
    queue: queue.map((item) => trackItem(`queue:${item.id}`, item.track)),
    favorites: favorites.map((entry, index) =>
      trackItem(`favorites:${index}`, entry.ref),
    ),
    playlists: playlists.map((playlist) =>
      folder(`playlist:${playlist.id}`, playlist.name),
    ),
    ...Object.fromEntries(playlistEntries),
  };
};

const playTracksFrom = (tracks: Track[], index: number) => {
  const queue = useQueueStore.getState();
  queue.clearQueue();
  queue.addToQueue(tracks);
  queue.goToIndex(index);
  playbackManager.play();
};

export const playMediaId = async (mediaId: string) => {
  const [kind, id, position] = mediaId.split(':');
  if (kind === 'queue') {
    useQueueStore.getState().goToId(id);
    playbackManager.play();
  } else if (kind === 'favorites') {
    const tracks = useFavoritesStore
      .getState()
      .tracks.map((entry) => entry.ref);
    playTracksFrom(tracks, Number(id));
  } else if (kind === 'playlist' && position !== undefined) {
    playTracksFrom(await loadPlaylistTracks(id), Number(position));
  }
};

const publishBrowseTree = async () => {
  try {
    const tree = await buildBrowseTree();
    await invoke('plugin:nuclear-android|setBrowseTree', { tree });
  } catch (error) {
    Logger.playback.warn(
      `Failed to publish the media library: ${errorMessage(error)}`,
    );
  }
};

export const initMobileMediaLibrary = () => {
  const schedulePublish = debounce(() => void publishBrowseTree(), 1000);
  useQueueStore.subscribe((state, previous) => {
    if (state.items !== previous.items) {
      schedulePublish();
    }
  });
  useFavoritesStore.subscribe(schedulePublish);
  usePlaylistStore.subscribe((state, previous) => {
    if (state.index !== previous.index) {
      schedulePublish();
    }
  });
  schedulePublish();
};
