import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BottomNavigation } from '.';

const renderNavigation = (onLibrary = vi.fn()) =>
  render(
    <BottomNavigation>
      <BottomNavigation.Item
        icon={<span />}
        label="Home"
        isActive
        onClick={vi.fn()}
      />
      <BottomNavigation.Item
        icon={<span />}
        label="Library"
        onClick={onLibrary}
      />
    </BottomNavigation>,
  );

describe('BottomNavigation', () => {
  it('(Snapshot) renders the items', () => {
    renderNavigation();
    expect(screen.getByTestId('bottom-navigation')).toMatchSnapshot();
  });

  it('marks the active item as the current page', () => {
    renderNavigation();
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Library' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('calls the item handler when tapped', async () => {
    const onLibrary = vi.fn();
    renderNavigation(onLibrary);
    await userEvent.click(screen.getByRole('button', { name: 'Library' }));
    expect(onLibrary).toHaveBeenCalledOnce();
  });
});
