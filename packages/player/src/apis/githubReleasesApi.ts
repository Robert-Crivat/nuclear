import { z } from 'zod';

import { ApiClient } from './ApiClient';

const GithubReleaseSchema = z.object({
  tag_name: z.string(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string(),
      size: z.number(),
    }),
  ),
});

export type GithubRelease = z.infer<typeof GithubReleaseSchema>;

class GithubReleasesApi extends ApiClient {
  constructor() {
    super('https://api.github.com/repos/nukeop/nuclear');
  }

  getLatestRelease() {
    return this.fetch('/releases/latest', GithubReleaseSchema);
  }
}

export const githubReleasesApi = new GithubReleasesApi();
