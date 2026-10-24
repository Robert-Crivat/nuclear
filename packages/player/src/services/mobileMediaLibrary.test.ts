import { useFavoritesStore } from '../stores/favoritesStore';
import { usePlaylistStore } from '../stores/playlistStore';
import { useQueueStore } from '../stores/queueStore';
import { createQueueItem, createTrack } from '../test/fixtures/queue';
import { resetInMemoryTauriStore } from '../test/utils/inMemoryTauriStore';
import { buildBrowseTree, playMediaId } from './mobileMediaLibrary';

vi.mock(
  './playlistFileService',
  async () =>
    (await import('../test/fixtures/playlists')).playlistFileServiceMock,
);

const titles = (items: { title: string }[] | undefined) =>
  items?.map((item) => item.title);

describe('Mobile media library', () => {
  beforeEach(() => {
    resetInMemoryTauriStore();
    useQueueStore.setState({
      items: [createQueueItem('Queued Song')],
      currentIndex: 0,
    });
    useFavoritesStore.setState({
      tracks: [
        { ref: createTrack('Liked One'), addedAtIso: '2026-01-01T00:00:00Z' },
        { ref: createTrack('Liked Two'), addedAtIso: '2026-01-01T00:00:00Z' },
      ],
    });
  });

  it('lists the queue, favorites and playlists at the root', async () => {
    const tree = await buildBrowseTree();

    expect(titles(tree.root)).toEqual([
      'Queue',
      'Favorite tracks',
      'Playlists',
    ]);
    expect(titles(tree.queue)).toEqual(['Queued Song']);
    expect(titles(tree.favorites)).toEqual(['Liked One', 'Liked Two']);
  });

  it('lists the tracks of each playlist', async () => {
    const playlistId = await usePlaylistStore
      .getState()
      .createPlaylist('Road trip');
    await usePlaylistStore
      .getState()
      .addTracks(playlistId, [createTrack('On The Road')]);

    const tree = await buildBrowseTree();

    expect(titles(tree.playlists)).toEqual(['Road trip']);
    expect(titles(tree[`playlist:${playlistId}`])).toEqual(['On The Road']);
  });

  it('queues the favorites and jumps to the chosen one', async () => {
    await playMediaId('favorites:1');

    const { items, currentIndex } = useQueueStore.getState();
    expect(items.map((item) => item.track.title)).toEqual([
      'Liked One',
      'Liked Two',
    ]);
    expect(currentIndex).toBe(1);
  });
});
