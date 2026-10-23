import { Music2, Pause, Play } from 'lucide-react';
import { FC, ReactNode } from 'react';

import { cn } from '../../utils';
import { Button } from '../Button';

type MiniPlayerProps = {
  title: string;
  artist?: string;
  coverUrl?: string;
  isPlaying: boolean;
  isLoading?: boolean;
  progress: number;
  onPlayPause: () => void;
  onOpen: () => void;
  action?: ReactNode;
  labels: {
    play: string;
    pause: string;
    open: string;
  };
  className?: string;
};

export const MiniPlayer: FC<MiniPlayerProps> = ({
  title,
  artist,
  coverUrl,
  isPlaying,
  isLoading = false,
  progress,
  onPlayPause,
  onOpen,
  action,
  labels,
  className,
}) => (
  <div
    data-testid="mini-player"
    className={cn(
      'surface-bottombar border-border relative flex items-center gap-3 overflow-hidden rounded-md border-(length:--border-width) p-2',
      className,
    )}
  >
    <button
      type="button"
      aria-label={labels.open}
      onClick={onOpen}
      data-testid="mini-player-open"
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
    >
      <span className="border-border bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm border-(length:--border-width)">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <Music2 size={18} />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className="truncate text-sm font-bold"
          data-testid="mini-player-title"
        >
          {title}
        </span>
        {artist && (
          <span className="truncate text-xs opacity-70">{artist}</span>
        )}
      </span>
    </button>
    {action}
    <Button
      size="icon"
      onClick={onPlayPause}
      aria-label={isPlaying ? labels.pause : labels.play}
      data-testid="mini-player-play-pause"
    >
      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
    </Button>
    <span className="bg-muted absolute inset-x-0 bottom-0 h-0.5">
      <span
        data-testid="mini-player-progress"
        className={cn('surface-seekbar block h-full', {
          'bg-stripes-diagonal w-full': isLoading,
        })}
        style={isLoading ? undefined : { width: `${progress}%` }}
      />
    </span>
  </div>
);
