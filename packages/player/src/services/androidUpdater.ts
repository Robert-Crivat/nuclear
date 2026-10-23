import { getVersion } from '@tauri-apps/api/app';
import { invoke } from '@tauri-apps/api/core';
import { appCacheDir, join } from '@tauri-apps/api/path';
import type { Update } from '@tauri-apps/plugin-updater';
import gt from 'semver/functions/gt';
import valid from 'semver/functions/valid';

import { githubReleasesApi } from '../apis/githubReleasesApi';
import { downloadFile } from './tauri/commands';

export type AppUpdate = Pick<Update, 'version' | 'downloadAndInstall'>;

const APK_SUFFIX = '_android.apk';

let downloadedApkPath: string | null = null;

export const checkAndroidUpdate = async (): Promise<AppUpdate | null> => {
  const release = await githubReleasesApi.getLatestRelease();
  const version = release.tag_name.replace(/^player@/, '');
  const apk = release.assets.find((asset) => asset.name.endsWith(APK_SUFFIX));

  if (!apk || !valid(version)) {
    return null;
  }
  if (!gt(version, await getVersion())) {
    return null;
  }

  return {
    version,
    downloadAndInstall: async (onEvent) => {
      onEvent?.({ event: 'Started', data: { contentLength: apk.size } });
      const path = await join(await appCacheDir(), apk.name);
      await downloadFile(apk.browser_download_url, path);
      downloadedApkPath = path;
      onEvent?.({ event: 'Finished' });
    },
  };
};

export const installAndroidUpdate = async () => {
  if (!downloadedApkPath) {
    throw new Error('No downloaded update to install');
  }
  await invoke('plugin:nuclear-android|installApk', {
    path: downloadedApkPath,
  });
};
