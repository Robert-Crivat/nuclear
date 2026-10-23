import { useNavigate } from '@tanstack/react-router';
import {
  CableIcon,
  DiscIcon,
  HeartIcon,
  HistoryIcon,
  ListMusicIcon,
  UserIcon,
} from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import {
  SidebarNavigation,
  SidebarNavigationItem,
  ViewShell,
} from '@nuclearplayer/ui';

import { usePlaylistStore } from '../../stores/playlistStore';
import { PlaylistArtwork } from '../Playlists/components/PlaylistArtwork';

export const Library: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tHome } = useTranslation('home');
  const { t: tPlaylists } = useTranslation('playlists');
  const navigate = useNavigate();
  const playlists = usePlaylistStore((state) => state.index);

  return (
    <ViewShell data-testid="library-view" title={t('library')}>
      <div className="flex w-full flex-col gap-6 pb-6">
        <SidebarNavigation>
          <div className="flex flex-col gap-2">
            <SidebarNavigationItem
              to="/favorites/tracks"
              icon={<HeartIcon />}
              label={t('favoriteTracks')}
            />
            <SidebarNavigationItem
              to="/favorites/albums"
              icon={<DiscIcon />}
              label={t('favoriteAlbums')}
            />
            <SidebarNavigationItem
              to="/favorites/artists"
              icon={<UserIcon />}
              label={t('favoriteArtists')}
            />
            <SidebarNavigationItem
              to="/playlists"
              icon={<ListMusicIcon />}
              label={t('playlists')}
            />
            <SidebarNavigationItem
              to="/history"
              icon={<HistoryIcon />}
              label={t('history')}
            />
            <SidebarNavigationItem
              to="/sources"
              icon={<CableIcon />}
              label={t('sources')}
            />
          </div>
        </SidebarNavigation>

        {playlists.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-bold">{tHome('yourPlaylists')}</h2>
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                data-testid="library-playlist"
                className="flex w-full cursor-pointer items-center gap-3 text-left"
                onClick={() =>
                  navigate({
                    to: '/playlists/$playlistId',
                    params: { playlistId: playlist.id },
                  })
                }
              >
                <span className="size-12 shrink-0 overflow-hidden rounded-sm">
                  <PlaylistArtwork
                    name={playlist.name}
                    thumbnails={playlist.thumbnails}
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-bold">{playlist.name}</span>
                  <span className="truncate text-xs opacity-70">
                    {tPlaylists('trackCount', { count: playlist.itemCount })}
                  </span>
                </span>
              </button>
            ))}
          </section>
        )}
      </div>
    </ViewShell>
  );
};
