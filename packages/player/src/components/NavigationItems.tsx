import {
  CableIcon,
  DiscIcon,
  GaugeIcon,
  HistoryIcon,
  ListMusicIcon,
  MicVocalIcon,
  MusicIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { SidebarNavigationItem } from '@nuclearplayer/ui';

import { useSettingsModalStore } from '../stores/settingsModalStore';

export const NavigationItems: FC = () => {
  const { t } = useTranslation('navigation');
  const { t: tPrefs } = useTranslation('preferences');
  const openSettings = useSettingsModalStore((state) => state.open);

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        <SidebarNavigationItem
          to="/dashboard"
          icon={<GaugeIcon />}
          label={t('dashboard')}
        />
        <SidebarNavigationItem
          to="/favorites/albums"
          icon={<DiscIcon />}
          label={t('favoriteAlbums')}
        />
        <SidebarNavigationItem
          to="/favorites/tracks"
          icon={<MusicIcon />}
          label={t('favoriteTracks')}
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
          to="/lyrics"
          icon={<MicVocalIcon />}
          label={t('lyrics')}
        />
        <SidebarNavigationItem
          to="/sources"
          icon={<CableIcon />}
          label={t('sources')}
        />
      </div>
      <SidebarNavigationItem
        icon={<SettingsIcon />}
        label={tPrefs('title')}
        onClick={() => openSettings()}
      />
    </>
  );
};
