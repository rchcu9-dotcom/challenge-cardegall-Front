import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TopBar } from '../TopBar';
import { AuthProvider } from '../../../auth/AuthContext';
import { useEnrolementEtat } from '../../../hooks/useEnrolementEtat';

// Isolé dans son propre fichier car tabsConfig est mocké à exactement les 3 items "primaires"
// de l'état testé, ce qui ne reflète pas la config réelle (7 tabs) utilisée par TopBar.test.tsx.
vi.mock('../../../hooks/useEnrolementEtat');
vi.mock(import('../tabsConfig'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    tabsConfig: [
      { id: 'accueil', label: 'Accueil', shortLabel: 'Accueil', path: '/' },
      { id: 'competition', label: 'Compétition', shortLabel: 'Compét.', path: '/competition' },
      { id: 'inscription', label: 'Inscription', shortLabel: 'Inscription', path: '/inscription' },
    ],
  };
});

function renderTopBar() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <TopBar />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TopBar — aucun item secondaire (tabs visibles == tabs primaires)', () => {
  beforeEach(() => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: false });
  });

  it('does not show the "Plus" button when every visible tab is already in the primary set', () => {
    renderTopBar();

    expect(screen.queryByRole('button', { name: "Plus d'options de navigation" })).not.toBeInTheDocument();
  });
});
