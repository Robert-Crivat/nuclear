import { pickArtwork, type Track } from '@nuclearplayer/model';

type ArtworkPurpose = Parameters<typeof pickArtwork>[1];

export const trackArtworkUrl = (
  track: Track,
  purpose: ArtworkPurpose,
  size: number,
): string | undefined =>
  pickArtwork(track.artwork, purpose, size)?.url ??
  track.streamCandidates?.find(
    (candidate) => !candidate.failed && candidate.thumbnail,
  )?.thumbnail;
