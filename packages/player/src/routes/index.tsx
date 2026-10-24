import { createFileRoute, redirect } from '@tanstack/react-router';

import { isMobilePlatform } from '../utils/platform';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({
      to: isMobilePlatform() ? '/home' : '/dashboard',
    });
  },
});
