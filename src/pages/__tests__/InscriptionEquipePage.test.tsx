import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InscriptionEquipePage } from '../InscriptionEquipePage';
import * as equipeApi from '../../api/equipe';
import type { EquipeDto } from '../../api/equipe';

vi.mock('../../api/equipe');

function buildEquipe(overrides: Partial<EquipeDto> = {}): EquipeDto {
  return {
    id: 'equipe-7',
    nom: 'Logistique',
    capitaineUserId: 'demo-capitaine',
    nbJoueursApprox: 9,
    nbFemininesEnvisage: 2,
    statut: 'inscrite',
    dateInscription: '2026-06-13T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InscriptionEquipePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('InscriptionEquipePage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.inscrireEquipe).mockReset().mockResolvedValue(buildEquipe());
  });

  it('affiche le formulaire avec les champs requis et leurs valeurs initiales', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: "Inscription d'une équipe" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nom de l'équipe")).toHaveValue('');
    expect(screen.getByLabelText('Pseudo du Capitaine')).toHaveValue('');
    expect(screen.getByLabelText('Nombre de joueurs (approximatif)')).toHaveValue(0);
    expect(screen.getByLabelText('Nombre de joueuses envisagées (féminines)')).toHaveValue(0);
    expect(screen.getByLabelText('Commentaire (optionnel)')).toHaveValue('');
    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).toBeInTheDocument();
  });

  it('le champ "Pseudo du Capitaine" est obligatoire et positionné après "Nom de l\'équipe"', () => {
    renderPage();

    const pseudoInput = screen.getByLabelText('Pseudo du Capitaine');
    expect(pseudoInput).toBeRequired();

    const inputs = screen.getAllByRole('textbox');
    const nomIndex = inputs.indexOf(screen.getByLabelText("Nom de l'équipe"));
    const pseudoIndex = inputs.indexOf(pseudoInput);
    expect(pseudoIndex).toBe(nomIndex + 1);
  });

  it('soumet le formulaire avec les valeurs saisies et le capitaineUserId du stub', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.change(screen.getByLabelText('Nombre de joueurs (approximatif)'), {
      target: { value: '9' },
    });
    fireEvent.change(screen.getByLabelText('Nombre de joueuses envisagées (féminines)'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText('Commentaire (optionnel)'), {
      target: { value: 'Présents dès 8h' },
    });

    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await vi.waitFor(() => {
      expect(equipeApi.inscrireEquipe).toHaveBeenCalledWith(
        {
          nom: 'Logistique',
          capitaineUserId: 'demo-capitaine',
          capitainePseudo: 'CapiLogistique',
          nbJoueursApprox: 9,
          nbFemininesEnvisage: 2,
          commentaire: 'Présents dès 8h',
        },
        expect.anything(),
      );
    });
  });

  it('envoie commentaire: undefined quand le champ commentaire est vide', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await vi.waitFor(() => {
      expect(equipeApi.inscrireEquipe).toHaveBeenCalledWith(
        expect.objectContaining({ commentaire: undefined }),
        expect.anything(),
      );
    });
  });

  it('affiche une confirmation après succès et permet d’inscrire une autre équipe', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    expect(await screen.findByText('Équipe « Logistique » inscrite avec succès.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Inscrire une autre équipe' }));

    expect(screen.getByLabelText("Nom de l'équipe")).toHaveValue('');
    expect(screen.getByLabelText('Pseudo du Capitaine')).toHaveValue('');
    expect(screen.getByLabelText('Nombre de joueurs (approximatif)')).toHaveValue(0);
    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).toBeInTheDocument();
  });

  it('affiche un lien vers les équipes inscrites sur l’écran de confirmation', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    expect(await screen.findByText('Équipe « Logistique » inscrite avec succès.')).toBeInTheDocument();

    const lien = screen.getByRole('link', { name: 'Voir les équipes inscrites' });
    expect(lien).toHaveAttribute('href', '/#statut-tournoi');
  });

  it('affiche le message d’erreur quand l’inscription échoue', async () => {
    vi.mocked(equipeApi.inscrireEquipe).mockRejectedValue(new Error('Erreur 400'));

    renderPage();

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    expect(await screen.findByText('Erreur 400')).toBeInTheDocument();
  });

  it('invalide la query ["equipes"] après une inscription réussie', async () => {
    const queryClient = new QueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['equipes'], [buildEquipe({ id: 'equipe-existante' })]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <InscriptionEquipePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText("Nom de l'équipe"), { target: { value: 'Logistique' } });
    fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
      target: { value: 'CapiLogistique' },
    });
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await vi.waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['equipes'] });
    });

    expect(queryClient.getQueryState(['equipes'])?.isInvalidated).toBe(true);
  });
});
