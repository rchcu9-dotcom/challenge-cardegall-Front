import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminUsersPage } from '../AdminUsersPage';
import * as usersApi from '../../api/users';
import type { UtilisateurDto } from '../../api/users';

vi.mock('../../api/users');

function buildUtilisateur(overrides: Partial<UtilisateurDto> = {}): UtilisateurDto {
  return {
    id: 'utilisateur-1',
    userId: 'demo-capitaine',
    displayName: 'Capitaine Démo',
    email: 'capitaine.demo@orange.com',
    role: 'membre',
    dateApparition: '2026-06-13T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminUsersPage />
    </QueryClientProvider>,
  );
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.mocked(usersApi.listUsers).mockReset();
    vi.mocked(usersApi.updateUserRole).mockReset();
  });

  it('affiche un message de chargement pendant la récupération des utilisateurs', () => {
    vi.mocked(usersApi.listUsers).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche un message quand aucun utilisateur n’est connu', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucun utilisateur pour le moment.')).toBeInTheDocument();
  });

  it('affiche la table avec les colonnes Nom, Email, Rôle et Date', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([
      buildUtilisateur({
        id: 'utilisateur-1',
        displayName: 'Admin Démo',
        email: 'admin.demo@orange.com',
        role: 'admin',
        dateApparition: '2026-06-13T00:00:00.000Z',
      }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(2);

    expect(screen.getByRole('columnheader', { name: 'Nom' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Rôle' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: "Date d'apparition" })).toBeInTheDocument();

    expect(rows[1]).toHaveTextContent('Admin Démo');
    expect(rows[1]).toHaveTextContent('admin.demo@orange.com');
    expect(rows[1]).toHaveTextContent('Admin');
    expect(rows[1]).toHaveTextContent(new Date('2026-06-13T00:00:00.000Z').toLocaleDateString('fr-FR'));
  });

  it('affiche un tiret quand l’email est absent', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([
      buildUtilisateur({ email: undefined }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('—');
  });

  it('affiche le bouton "Promouvoir admin" pour un utilisateur membre', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([buildUtilisateur({ role: 'membre' })]);

    renderPage();

    expect(await screen.findByRole('button', { name: 'Promouvoir admin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirer le rôle admin' })).not.toBeInTheDocument();
  });

  it('affiche le bouton "Retirer le rôle admin" pour un utilisateur admin', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([buildUtilisateur({ role: 'admin' })]);

    renderPage();

    expect(await screen.findByRole('button', { name: 'Retirer le rôle admin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Promouvoir admin' })).not.toBeInTheDocument();
  });

  it('le bouton "Promouvoir admin" déclenche updateUserRole avec le rôle "admin"', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([
      buildUtilisateur({ id: 'utilisateur-1', role: 'membre' }),
    ]);
    vi.mocked(usersApi.updateUserRole).mockResolvedValue(
      buildUtilisateur({ id: 'utilisateur-1', role: 'admin' }),
    );

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Promouvoir admin' }));

    await vi.waitFor(() => {
      expect(usersApi.updateUserRole).toHaveBeenCalledWith('utilisateur-1', 'admin');
    });
  });

  it('le bouton "Retirer le rôle admin" déclenche updateUserRole avec le rôle "membre"', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([
      buildUtilisateur({ id: 'utilisateur-1', role: 'admin' }),
    ]);
    vi.mocked(usersApi.updateUserRole).mockResolvedValue(
      buildUtilisateur({ id: 'utilisateur-1', role: 'membre' }),
    );

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Retirer le rôle admin' }));

    await vi.waitFor(() => {
      expect(usersApi.updateUserRole).toHaveBeenCalledWith('utilisateur-1', 'membre');
    });
  });

  it('rafraîchit la liste des utilisateurs après un changement de rôle réussi', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValueOnce([
      buildUtilisateur({ id: 'utilisateur-1', displayName: 'Capitaine Démo', role: 'membre' }),
    ]);
    vi.mocked(usersApi.updateUserRole).mockResolvedValue(
      buildUtilisateur({ id: 'utilisateur-1', displayName: 'Capitaine Démo', role: 'admin' }),
    );

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Promouvoir admin' }));

    // Après invalidation, listUsers est appelé à nouveau et la table est rafraîchie.
    vi.mocked(usersApi.listUsers).mockResolvedValueOnce([
      buildUtilisateur({ id: 'utilisateur-1', displayName: 'Capitaine Démo', role: 'admin' }),
    ]);

    expect(await screen.findByRole('button', { name: 'Retirer le rôle admin' })).toBeInTheDocument();
    expect(usersApi.listUsers).toHaveBeenCalledTimes(2);
  });

  it('affiche un message d’erreur si le changement de rôle échoue', async () => {
    vi.mocked(usersApi.listUsers).mockResolvedValue([
      buildUtilisateur({ id: 'utilisateur-1', role: 'membre' }),
    ]);
    vi.mocked(usersApi.updateUserRole).mockRejectedValue(new Error('Erreur 404'));

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Promouvoir admin' }));

    expect(await screen.findByText('Erreur 404')).toBeInTheDocument();
  });
});
