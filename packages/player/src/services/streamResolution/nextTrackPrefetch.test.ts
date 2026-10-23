import { waitFor } from '@testing-library/react';

import { useQueueStore } from '../../stores/queueStore';
import { setSetting } from '../../stores/settingsStore';
import { useSoundStore } from '../../stores/soundStore';
import {
  createMockCandidate,
  createMockStream,
  StreamingProviderBuilder,
} from '../../test/builders/StreamingProviderBuilder';
import { createQueueItem } from '../../test/fixtures/queue';
import { providersHost } from '../providersHost';
import { hasFreshStream } from '../streamingHost';
import { initNextTrackPrefetch } from './nextTrackPrefetch';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(9100),
}));

const searchedTitles: string[] = [];

const nextItem = () => useQueueStore.getState().items[1];

describe('Next track prefetch', () => {
  let unsubscribe: () => void;

  beforeEach(async () => {
    searchedTitles.length = 0;
    await setSetting('core.playback.streamVerification', false);
    await setSetting('core.playback.shuffle', false);
    providersHost.register(
      new StreamingProviderBuilder()
        .withSearchForTrack(async (_artist, title) => {
          searchedTitles.push(title);
          return [createMockCandidate(`${title} stream`, title)];
        })
        .withGetStreamUrl(async (candidateId) => createMockStream(candidateId))
        .build(),
    );
    useQueueStore.setState({
      items: [createQueueItem('First Song'), createQueueItem('Second Song')],
      currentIndex: 0,
    });
    useSoundStore.setState({ status: 'stopped' });
    unsubscribe = initNextTrackPrefetch();
  });

  afterEach(() => unsubscribe());

  it('resolves the stream of the next track when playback starts', async () => {
    useSoundStore.getState().play();

    await waitFor(() =>
      expect(nextItem().track.streamCandidates?.some(hasFreshStream)).toBe(
        true,
      ),
    );
    expect(searchedTitles).toEqual(['Second Song']);
  });

  it('does not prefetch when shuffle is on', async () => {
    await setSetting('core.playback.shuffle', true);

    useSoundStore.getState().play();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(searchedTitles).toEqual([]);
  });

  it('does not prefetch past the end of the queue', async () => {
    useQueueStore.setState({ currentIndex: 1 });

    useSoundStore.getState().play();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(searchedTitles).toEqual([]);
  });
});
