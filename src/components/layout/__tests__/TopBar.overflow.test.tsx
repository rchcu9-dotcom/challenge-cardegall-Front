import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../auth/AuthContext';
import { useEnrolementEtat } from '../../../hooks/useEnrolementEtat';

// Isolé dans son propre fichier car tabsConfig est mocké à un nombre de tabs <= MAX_TOP_TABS,
// ce qui ne reflète pas la config réelle (6 tabs) utilisée par TopBar.test.tsx.
vi.mock('../../../hooks/useEnrolementEtat');
vi.mock('../tabsConfig', () => ({
  tabsConfig: [
    { id: 'accueil', label: 'Accueil', shortLabel: 'Accueil', path: '/' },
    { id: 'competition', label: 'Compétition', shortLabel: 'Compét.', path: '/competition' },
    { id: 'planning', label: 'Planning', shortLabel: 'Planning', path: '/planning' },
  ],
  MAX_VISIBLE_TABS: 3,
}));

describe('TopBar — pas de surplus (<= MAX_TOP_TABS onglets)', () => {
  beforeEach(() => {
    vi.mocked(useEnrolementEtat).mockReturnValue({ cloture: false });
  });

  it('does not show the "Plus" button when there are 3 or fewer visible tabs', async () => {
    const { TopBar } = await import('../TopBar');
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuthProvider>
            <TopBar />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.queryByRole('button', { name: "Plus d'options de navigation" })).not.toBeInTheDocument();
  });
});
