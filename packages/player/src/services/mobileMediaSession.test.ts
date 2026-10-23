import { addPluginListener, invoke } from '@tauri-apps/api/core';

import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';
import { createQueueItem } from '../test/fixtures/queue';
import { initMobileMediaSession } from './mobileMediaSession';

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: () => 'android',
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
  addPluginListener: vi.fn(() => Promise.resolve({ unregister: vi.fn() })),
}));

type MediaActionHandler = (payload: {
  action: string;
  positionMs?: number;
}) => void;

const sessionUpdates = () =>
  vi
    .mocked(invoke)
    .mock.calls.filter(
      ([command]) => command === 'plugin:nuclear-android|updateMediaSession',
    )
    .map(([, args]) => args);

const sessionStops = () =>
  vi
    .mocked(invoke)
    .mock.calls.filter(
      ([command]) => command === 'plugin:nuclear-android|stopMediaSession',
    );

let mediaActionHandler: MediaActionHandler;

describe('Mobile media session', () => {
  beforeAll(async () => {
    await initMobileMediaSession();
    expect(addPluginListener).toHaveBeenCalledWith(
      'nuclear-android',
      'mediaAction',
      expect.any(Function),
    );
    mediaActionHandler = vi.mocked(addPluginListener).mock
      .calls[0][2] as MediaActionHandler;
  });

  beforeEach(() => {
    useSoundStore.setState({ status: 'stopped', seek: 0, duration: 0 });
    useQueueStore.setState({
      items: [createQueueItem('First Song'), createQueueItem('Second Song')],
      currentIndex: 0,
    });
    vi.mocked(invoke).mockClear();
  });

  it('publishes the current track once playback starts', () => {
    useSoundStore.setState({ duration: 180 });
    expect(sessionUpdates()).toHaveLength(0);

    useSoundStore.getState().play();

    expect(sessionUpdates().at(-1)).toEqual(
      expect.objectContaining({
        title: 'First Song',
        artist: 'Test Artist',
        isPlaying: true,
        durationMs: 180000,
      }),
    );
  });

  it('reports pauses to the system', () => {
    useSoundStore.getState().play();
    useSoundStore.getState().pause();

    expect(sessionUpdates().at(-1)).toEqual(
      expect.objectContaining({ isPlaying: false }),
    );
  });

  it('skips to the next track when the system asks for it', () => {
    useSoundStore.getState().play();

    mediaActionHandler({ action: 'next' });

    expect(useQueueStore.getState().getCurrentItem()?.track.title).toBe(
      'Second Song',
    );
  });

  it('pauses when the system asks for it', () => {
    useSoundStore.getState().play();

    mediaActionHandler({ action: 'pause' });

    expect(useSoundStore.getState().status).toBe('paused');
  });

  it('stops the session when the queue is cleared', () => {
    useSoundStore.getState().play();

    useQueueStore.setState({ items: [], currentIndex: 0 });

    expect(sessionStops()).toHaveLength(1);
  });
});
