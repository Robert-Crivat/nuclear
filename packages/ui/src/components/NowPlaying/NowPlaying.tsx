import { ChevronDown, Music2 } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

type NowPlayingProps = {
  heading: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  onClose: () => void;
  onArtistClick?: () => void;
  favorite?: ReactNode;
  seekBar: ReactNode;
  controls: ReactNode;
  actions?: ReactNode;
  labels: {
    close: string;
  };
  className?: string;
};

export const NowPlaying: FC<NowPlayingProps> = ({
  heading,
  title,
  artist,
  coverUrl,
  onClose,
  onArtistClick,
  favorite,
  seekBar,
  controls,
  actions,
  labels,
  className,
}) => (
  <div
    data-testid="now-playing"
    className={cn(
      'surface-background flex h-full w-full flex-col gap-6 overflow-y-auto px-6 pt-4 pb-6 landscape:grid landscape:grid-cols-2 landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-x-8',
      className,
    )}
  >
    <div className="flex items-center gap-2 landscape:col-span-2">
      <Button
        size="icon"
        variant="text"
        aria-label={labels.close}
        onClick={onClose}
        data-testid="now-playing-close"
      >
        <ChevronDown size={24} />
      </Button>
      <span className="flex-1 text-center text-xs font-bold tracking-widest uppercase opacity-80">
        {heading}
      </span>
      <span className="size-10" />
    </div>

    <div className="flex flex-1 items-center justify-center landscape:min-h-0">
      <div className="border-border bg-muted shadow-shadow flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-md border-(length:--border-width) landscape:h-full landscape:w-auto">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="size-full object-cover"
            data-testid="now-playing-cover"
          />
        ) : (
          <Music2 size={64} className="opacity-50" />
        )}
      </div>
    </div>

    <div className="flex flex-col gap-6 landscape:justify-center">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="truncate text-2xl font-bold"
            data-testid="now-playing-title"
          >
            {title}
          </span>
          {artist && (
            <button
              type="button"
              className="cursor-pointer truncate text-left opacity-70"
              onClick={onArtistClick}
              disabled={!onArtistClick}
            >
              {artist}
            </button>
          )}
        </div>
        {favorite}
      </div>

      <div className="flex flex-col gap-4">
        {seekBar}
        {controls}
      </div>

      {actions && (
        <div className="flex items-center justify-between">{actions}</div>
      )}
    </div>
  </div>
);
