import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';

import { useUpdaterStore } from '../stores/updaterStore';
import { downloadFile } from './tauri/commands';

vi.mock('@tauri-apps/plugin-os', () => ({
  platform: () => 'android',
}));

vi.mock('@tauri-apps/api/app', () => ({
  getVersion: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

vi.mock('@tauri-apps/api/path', () => ({
  appCacheDir: () => Promise.resolve('/cache'),
  join: (...parts: string[]) => Promise.resolve(parts.join('/')),
}));

vi.mock('./tauri/commands', () => ({
  downloadFile: vi.fn(() => Promise.resolve()),
}));

const latestRelease = (tag: string, assetNames: string[]) => ({
  tag_name: tag,
  assets: assetNames.map((name) => ({
    name,
    browser_download_url: `https://github.com/nukeop/nuclear/releases/download/${tag}/${name}`,
    size: 1000,
  })),
});

const mockLatestRelease = (release: ReturnType<typeof latestRelease>) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(release), { status: 200 })),
    ),
  );

describe('Android updater', () => {
  beforeEach(() => {
    vi.mocked(getVersion).mockResolvedValue('1.51.2');
    useUpdaterStore.setState({
      isUpdateAvailable: false,
      updateInfo: null,
      isDownloading: false,
      isReadyToRestart: false,
      downloadProgress: 0,
      error: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('offers a newer release that ships an APK', async () => {
    mockLatestRelease(
      latestRelease('player@1.52.0', ['Nuclear_1.52.0_android.apk']),
    );

    await useUpdaterStore.getState().checkForUpdate();

    expect(useUpdaterStore.getState().isUpdateAvailable).toBe(true);
    expect(useUpdaterStore.getState().updateInfo?.version).toBe('1.52.0');
  });

  it('ignores a release without an APK', async () => {
    mockLatestRelease(
      latestRelease('player@1.52.0', ['Nuclear_1.52.0_amd64.AppImage']),
    );

    await useUpdaterStore.getState().checkForUpdate();

    expect(useUpdaterStore.getState().isUpdateAvailable).toBe(false);
  });

  it('ignores a release that is not newer', async () => {
    mockLatestRelease(
      latestRelease('player@1.51.2', ['Nuclear_1.51.2_android.apk']),
    );

    await useUpdaterStore.getState().checkForUpdate();

    expect(useUpdaterStore.getState().isUpdateAvailable).toBe(false);
  });

  it('downloads the APK and hands it to the system installer', async () => {
    mockLatestRelease(
      latestRelease('player@1.52.0', ['Nuclear_1.52.0_android.apk']),
    );
    await useUpdaterStore.getState().checkForUpdate();

    await useUpdaterStore.getState().downloadUpdate();
    expect(downloadFile).toHaveBeenCalledWith(
      'https://github.com/nukeop/nuclear/releases/download/player@1.52.0/Nuclear_1.52.0_android.apk',
      '/cache/Nuclear_1.52.0_android.apk',
    );
    expect(useUpdaterStore.getState().isReadyToRestart).toBe(true);

    await useUpdaterStore.getState().restartToUpdate();
    expect(invoke).toHaveBeenCalledWith('plugin:nuclear-android|installApk', {
      path: '/cache/Nuclear_1.52.0_android.apk',
    });
  });
});
