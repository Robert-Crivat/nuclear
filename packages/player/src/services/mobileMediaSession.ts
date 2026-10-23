import { addPluginListener, invoke } from '@tauri-apps/api/core';

import { formatArtistNames } from '@nuclearplayer/model';

import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { errorMessage } from '../utils/errorMessage';
import { isMobilePlatform } from '../utils/platform';
import { secondsToMs } from '../utils/time';
import { Logger } from './logger';
import { playbackManager } from './playback';

const PLUGIN = 'nuclear-android';

type MediaAction = {
  action: 'play' | 'pause' | 'next' | 'previous' | 'seek';
  positionMs?: number;
};

let sessionStarted = false;

const logFailure = (error: unknown) =>
  Logger.playback.warn(`Media session update failed: ${errorMessage(error)}`);

const stopSession = () => {
  if (!sessionStarted) {
    return;
  }
  sessionStarted = false;
  invoke(`plugin:${PLUGIN}|stopMediaSession`).catch(logFailure);
};

const updateSession = () => {
  const currentItem = useQueueStore.getState().getCurrentItem();
  const { status, seek, duration } = useSoundStore.getState();

  if (!currentItem) {
    stopSession();
    return;
  }

  const isPlaying = status === 'playing';
  if (!sessionStarted && !isPlaying) {
    return;
  }
  sessionStarted = true;

  const { track } = currentItem;
  invoke(`plugin:${PLUGIN}|updateMediaSession`, {
    title: track.title,
    artist: formatArtistNames(track.artists),
    album: track.album?.title,
    artworkUrl: track.artwork?.items[0]?.url,
    isPlaying,
    positionMs: Math.round(secondsToMs(seek)),
    durationMs: Number.isFinite(duration)
      ? Math.round(secondsToMs(duration))
      : 0,
  }).catch(logFailure);
};

const handleAction = ({ action, positionMs }: MediaAction) => {
  switch (action) {
    case 'play':
      return playbackManager.play();
    case 'pause':
      return playbackManager.pause();
    case 'next':
      return useQueueStore.getState().goToNext();
    case 'previous':
      return useQueueStore.getState().goToPrevious();
    case 'seek':
      return useSoundStore.getState().seekTo((positionMs ?? 0) / 1000);
  }
};

export const initMobileMediaSession = async () => {
  if (!isMobilePlatform()) {
    return;
  }

  let previousItemId: string | undefined;
  useQueueStore.subscribe((state) => {
    const currentItem = state.getCurrentItem();
    if (currentItem?.id !== previousItemId) {
      previousItemId = currentItem?.id;
      updateSession();
    }
  });

  useSoundStore.subscribe((state, previous) => {
    const durationChanged =
      state.duration !== previous.duration && Number.isFinite(state.duration);
    const seeked = Math.abs(state.seek - previous.seek) > 2;
    if (state.status !== previous.status || durationChanged || seeked) {
      updateSession();
    }
  });

  await addPluginListener<MediaAction>(
    PLUGIN,
    'mediaAction',
    handleAction,
  ).catch((error) =>
    Logger.playback.error(
      `Failed to listen for media actions: ${errorMessage(error)}`,
    ),
  );
};
