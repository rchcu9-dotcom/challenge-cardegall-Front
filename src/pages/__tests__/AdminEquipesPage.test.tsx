import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminEquipesPage } from '../AdminEquipesPage';
import * as equipeApi from '../../api/equipe';
import type { EquipeDto } from '../../api/equipe';

vi.mock('../../api/equipe');

function buildEquipe(overrides: Partial<EquipeDto> = {}): EquipeDto {
  return {
    id: 'equipe-1',
    nom: 'DSI',
    capitaineUserId: 'demo-dsi',
    nbJoueursApprox: 10,
    nbFemininesEnvisage: 3,
    statut: 'inscrite',
    dateInscription: '2026-06-13T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminEquipesPage />
    </QueryClientProvider>,
  );
}

describe('AdminEquipesPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockReset();
  });

  it('affiche un message de chargement pendant la récupération des équipes', () => {
    vi.mocked(equipeApi.listEquipes).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
  });

  it('affiche un message quand aucune équipe n’est inscrite', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('Aucune équipe inscrite pour le moment.')).toBeInTheDocument();
  });

  it('affiche les équipes triées par date d’inscription croissante avec toutes les colonnes', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({
        id: 'equipe-2',
        nom: 'Marketing',
        capitaineUserId: 'demo-marketing',
        capitaineEmail: 'capitaine.marketing@orange.com',
        nbJoueursApprox: 8,
        nbFemininesEnvisage: 2,
        statut: 'enrolee',
        dateInscription: '2026-06-14T00:00:00.000Z',
      }),
      buildEquipe({
        id: 'equipe-1',
        nom: 'DSI',
        capitaineUserId: 'demo-dsi',
        nbJoueursApprox: 10,
        nbFemininesEnvisage: 3,
        commentaire: 'Présents dès 8h',
        statut: 'inscrite',
        dateInscription: '2026-06-13T00:00:00.000Z',
      }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();

    expect(rows[1]).toHaveTextContent('DSI');
    expect(rows[1]).toHaveTextContent('demo-dsi');
    expect(rows[1]).toHaveTextContent('10');
    expect(rows[1]).toHaveTextContent('3');
    expect(rows[1]).toHaveTextContent('Présents dès 8h');
    expect(rows[1]).toHaveTextContent('Inscrite');

    expect(rows[2]).toHaveTextContent('Marketing');
    expect(rows[2]).toHaveTextContent('capitaine.marketing@orange.com');
    expect(rows[2]).toHaveTextContent('Enrôlée');
  });

  it('affiche un tiret quand le commentaire est absent', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([buildEquipe({ commentaire: undefined })]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('—');
  });

  it('affiche un tiret dans la colonne Email pour une équipe sans email (équipe seedée)', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([buildEquipe({ capitaineEmail: undefined })]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    const cells = within(rows[1]).getAllByRole('cell');
    expect(cells[2]).toHaveTextContent('—');
  });

  it('affiche le pseudo du Capitaine dans la colonne "Capitaine" quand il est renseigné', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ capitainePseudo: 'CapiLogistique' }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('CapiLogistique');
    expect(rows[1]).not.toHaveTextContent('demo-dsi');
  });

  it('retombe sur capitaineUserId dans la colonne "Capitaine" quand le pseudo est absent (équipe seedée)', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ capitainePseudo: undefined, capitaineUserId: 'demo-dsi' }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('demo-dsi');
  });
});
