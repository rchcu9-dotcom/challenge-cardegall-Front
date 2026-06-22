import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HamburgerMenu } from '../HamburgerMenu';
import type { TabConfig } from '../tabsConfig';

const TABS: TabConfig[] = [
  { id: 'accueil', label: 'Accueil', shortLabel: 'Accueil', path: '/' },
  { id: 'planning', label: 'Planning', shortLabel: 'Planning', path: '/planning' },
  { id: 'admin', label: 'Admin', shortLabel: 'Admin', path: '/admin', requiresAdmin: true },
];

describe('HamburgerMenu', () => {
  it('renders a menu item for each tab provided', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HamburgerMenu tabs={TABS} onNavigate={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('menuitem', { name: 'Accueil' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('menuitem', { name: 'Planning' })).toHaveAttribute('href', '/planning');
    expect(screen.getByRole('menuitem', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });

  it('marks the Admin item as active on a nested admin sub-route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/equipes']}>
        <HamburgerMenu tabs={TABS} onNavigate={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('menuitem', { name: 'Admin' })).toHaveClass('is-active');
    expect(screen.getByRole('menuitem', { name: 'Accueil' })).not.toHaveClass('is-active');
  });

  it('only marks Accueil as active on the exact root route, not on every route', () => {
    render(
      <MemoryRouter initialEntries={['/planning']}>
        <HamburgerMenu tabs={TABS} onNavigate={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('menuitem', { name: 'Accueil' })).not.toHaveClass('is-active');
    expect(screen.getByRole('menuitem', { name: 'Planning' })).toHaveClass('is-active');
  });

  it('calls onNavigate when an item is clicked', () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <HamburgerMenu tabs={TABS} onNavigate={onNavigate} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('menuitem', { name: 'Planning' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('forwards an extra className to the menu container', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HamburgerMenu tabs={TABS} onNavigate={vi.fn()} className="app-hamburger-menu--anchored" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('menu')).toHaveClass('app-hamburger-menu--anchored');
  });
});
