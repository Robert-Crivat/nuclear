import { CellContext } from '@tanstack/react-table';

import { Track } from '@nuclearplayer/model';

import { cn } from '../../../utils';

export const TextCell = <T extends Track>({
  getValue,
  className,
}: CellContext<T, string | number | undefined> & { className?: string }) => (
  <td className={cn('cursor-default truncate px-2', className)}>
    <div className="truncate">{getValue()}</div>
  </td>
);
