import type { QueueItem } from '@nuclearplayer/model';

import { useQueueStore } from '../../stores/queueStore';
import { getSetting } from '../../stores/settingsStore';
import { useSoundStore } from '../../stores/soundStore';
import { Logger } from '../logger';
import { hasFreshStream, streamingHost } from '../streamingHost';
import { candidatesForTrack } from './candidateSource';

const inFlight = new Set<string>();

const upcomingItem = (): QueueItem | undefined => {
  if (getSetting('core.playback.shuffle')) {
    return undefined;
  }
  const { items, currentIndex } = useQueueStore.getState();
  const isLast = currentIndex >= items.length - 1;
  if (isLast && getSetting('core.playback.repeat') !== 'all') {
    return undefined;
  }
  return items[isLast ? 0 : currentIndex + 1];
};

const isAlreadyResolved = (item: QueueItem) =>
  item.track.streamCandidates?.some(hasFreshStream) ?? false;

export const prefetchStream = async (item: QueueItem): Promise<void> => {
  if (inFlight.has(item.id) || isAlreadyResolved(item)) {
    return;
  }
  inFlight.add(item.id);
  try {
    const candidates = await candidatesForTrack(item.track);
    const candidate = candidates?.find((current) => !current.failed);
    const latest = useQueueStore.getState().getItemById(item.id);
    if (!candidates || !candidate || !latest || latest.status === 'loading') {
      return;
    }
    useQueueStore.getState().updateItemState(item.id, {
      track: { ...latest.track, streamCandidates: candidates },
    });

    const resolved = await streamingHost.resolveStreamForCandidate(candidate);
    if (
      resolved &&
      !resolved.failed &&
      useQueueStore.getState().getItemById(item.id)
    ) {
      useQueueStore.getState().updateCandidate(item.id, resolved);
    }
  } catch (error) {
    Logger.streaming.debug(`Prefetch failed for ${item.track.title}: ${error}`);
  } finally {
    inFlight.delete(item.id);
  }
};

export const initNextTrackPrefetch = () =>
  useSoundStore.subscribe((state, previous) => {
    if (state.status !== 'playing' || previous.status === 'playing') {
      return;
    }
    const next = upcomingItem();
    if (next) {
      void prefetchStream(next);
    }
  });
