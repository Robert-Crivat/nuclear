import { render, screen } from '@testing-library/react';

import { ViewShell } from './ViewShell';

const mockPointer = (isCoarse: boolean) => {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: isCoarse && query === '(pointer: coarse)',
        media: query,
      }) as MediaQueryList,
  );
};

describe('ViewShell', () => {
  it('keeps the title above the scrolling content with a mouse', () => {
    mockPointer(false);
    render(
      <ViewShell title="Library">
        <p>Content</p>
      </ViewShell>,
    );

    expect(
      screen
        .getByText('Content')
        .parentElement?.contains(screen.getByTestId('title')),
    ).toBe(false);
  });

  it('scrolls the title with the content on touch screens', () => {
    mockPointer(true);
    render(
      <ViewShell title="Library">
        <p>Content</p>
      </ViewShell>,
    );

    expect(
      screen
        .getByText('Content')
        .parentElement?.contains(screen.getByTestId('title')),
    ).toBe(true);
  });
});
