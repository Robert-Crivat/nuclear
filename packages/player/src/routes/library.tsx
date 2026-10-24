import { createFileRoute } from '@tanstack/react-router';

import { Library } from '../views/Library';

export const Route = createFileRoute('/library')({
  component: Library,
});
