import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../AdminPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
}

describe('AdminPage', () => {
  it('affiche le titre et les liens vers les pages admin', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Administration' })).toBeInTheDocument();

    const equipesLink = screen.getByRole('link', { name: 'Équipes inscrites' });
    expect(equipesLink).toHaveAttribute('href', '/admin/equipes');

    const enrolementLink = screen.getByRole('link', { name: 'Enrôlement jour J' });
    expect(enrolementLink).toHaveAttribute('href', '/admin/enrolement');
  });
});
