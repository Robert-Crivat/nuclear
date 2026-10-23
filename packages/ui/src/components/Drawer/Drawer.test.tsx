import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Drawer } from '.';

describe('Drawer', () => {
  it('(Snapshot) renders an open drawer', () => {
    render(
      <Drawer isOpen onClose={vi.fn()} side="right">
        <p>Queue</p>
      </Drawer>,
    );
    expect(screen.getByTestId('drawer-panel')).toMatchSnapshot();
  });

  it('shows its content when open', () => {
    render(
      <Drawer isOpen onClose={vi.fn()}>
        <p>Navigation</p>
      </Drawer>,
    );
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    render(
      <Drawer isOpen={false} onClose={vi.fn()}>
        <p>Navigation</p>
      </Drawer>,
    );
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Navigation</p>
      </Drawer>,
    );
    await userEvent.click(screen.getByTestId('drawer-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen onClose={onClose}>
        <p>Navigation</p>
      </Drawer>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
