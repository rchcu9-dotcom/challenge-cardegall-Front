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
    capitainePseudo: 'CapiLogistique',
    capitaineEmail: 'capitaine.logistique@orange.com',
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

const VALID_EMAIL = 'capitaine@orange.com';

function fillRequiredFields(values: { nom?: string; capitainePseudo?: string; capitaineEmail?: string } = {}) {
  fireEvent.change(screen.getByLabelText("Nom de l'équipe"), {
    target: { value: values.nom ?? 'Logistique' },
  });
  fireEvent.change(screen.getByLabelText('Pseudo du Capitaine'), {
    target: { value: values.capitainePseudo ?? 'CapiLogistique' },
  });
  fireEvent.change(screen.getByLabelText('Adresse mail du Capitaine'), {
    target: { value: values.capitaineEmail ?? VALID_EMAIL },
  });
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
    expect(screen.getByLabelText('Adresse mail du Capitaine')).toHaveValue('');
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

  it('le champ "Adresse mail du Capitaine" est de type email, obligatoire, et positionné après "Pseudo du Capitaine"', () => {
    renderPage();

    const emailInput = screen.getByLabelText('Adresse mail du Capitaine');
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toBeRequired();

    const inputs = screen.getAllByRole('textbox');
    const pseudoIndex = inputs.indexOf(screen.getByLabelText('Pseudo du Capitaine'));
    const emailIndex = inputs.indexOf(emailInput);
    expect(emailIndex).toBe(pseudoIndex + 1);
  });

  it('le bouton "Inscrire l\'équipe" est désactivé par défaut (email vide)', () => {
    renderPage();

    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).toBeDisabled();
  });

  it('le bouton reste désactivé et un message d’erreur s’affiche pour un email hors domaine orange.com', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Adresse mail du Capitaine'), {
      target: { value: 'capitaine@gmail.com' },
    });

    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).toBeDisabled();
    expect(screen.getByText(/doit se terminer par @orange\.com/i)).toBeInTheDocument();
  });

  it('le bouton reste désactivé pour un domaine piège contenant orange.com sans en être un sous-domaine', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Adresse mail du Capitaine'), {
      target: { value: 'capitaine@orange.com.faux-domaine.fr' },
    });

    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).toBeDisabled();
  });

  it('n’affiche aucun message d’erreur tant que le champ email est vide', () => {
    renderPage();

    expect(screen.queryByText(/doit se terminer par @orange\.com/i)).not.toBeInTheDocument();
  });

  it('le bouton devient actif dès que l’email saisi est conforme à orange.com (insensible à la casse)', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Adresse mail du Capitaine'), {
      target: { value: 'Capitaine@Orange.COM' },
    });

    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).not.toBeDisabled();
    expect(screen.queryByText(/doit se terminer par @orange\.com/i)).not.toBeInTheDocument();
  });

  it('le bouton devient actif pour un sous-domaine de orange.com', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Adresse mail du Capitaine'), {
      target: { value: 'capitaine@si.orange.com' },
    });

    expect(screen.getByRole('button', { name: "Inscrire l'équipe" })).not.toBeDisabled();
  });

  it('soumet le formulaire avec les valeurs saisies, le capitaineUserId du stub et l’email', async () => {
    renderPage();

    fillRequiredFields();
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
          capitaineEmail: VALID_EMAIL,
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

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await vi.waitFor(() => {
      expect(equipeApi.inscrireEquipe).toHaveBeenCalledWith(
        expect.objectContaining({ commentaire: undefined }),
        expect.anything(),
      );
    });
  });

  it('affiche le message de confirmation après succès et ne propose plus de bouton "Inscrire une autre équipe"', async () => {
    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    expect(await screen.findByText('Équipe « Logistique » inscrite avec succès.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Inscrire une autre équipe' }),
    ).not.toBeInTheDocument();
  });

  it('affiche un récapitulatif avec les valeurs soumises (nom, pseudo, email, effectifs), distinctes des valeurs par défaut du formulaire', async () => {
    vi.mocked(equipeApi.inscrireEquipe).mockResolvedValue(
      buildEquipe({
        nom: 'Support Premium',
        capitainePseudo: 'CapiSupportPremium',
        capitaineEmail: 'capitaine.support@orange.com',
        nbJoueursApprox: 11,
        nbFemininesEnvisage: 4,
      }),
    );

    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await screen.findByText('Équipe « Support Premium » inscrite avec succès.');

    expect(screen.getByText("Nom de l'équipe").nextElementSibling).toHaveTextContent('Support Premium');
    expect(screen.getByText('Pseudo du Capitaine').nextElementSibling).toHaveTextContent(
      'CapiSupportPremium',
    );
    expect(screen.getByText('Adresse mail du Capitaine').nextElementSibling).toHaveTextContent(
      'capitaine.support@orange.com',
    );
    expect(
      screen.getByText('Nombre de joueurs (approximatif)').nextElementSibling,
    ).toHaveTextContent('11');
    expect(
      screen.getByText('Nombre de joueuses envisagées (féminines)').nextElementSibling,
    ).toHaveTextContent('4');
  });

  it('affiche la ligne "Commentaire" dans le récapitulatif quand un commentaire a été saisi', async () => {
    vi.mocked(equipeApi.inscrireEquipe).mockResolvedValue(
      buildEquipe({ commentaire: 'Arrivée prévue à 8h' }),
    );

    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await screen.findByText('Équipe « Logistique » inscrite avec succès.');

    expect(screen.getByText('Commentaire').nextElementSibling).toHaveTextContent(
      'Arrivée prévue à 8h',
    );
  });

  it('n’affiche aucune ligne "Commentaire" dans le récapitulatif quand aucun commentaire n’a été saisi', async () => {
    vi.mocked(equipeApi.inscrireEquipe).mockResolvedValue(buildEquipe({ commentaire: undefined }));

    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await screen.findByText('Équipe « Logistique » inscrite avec succès.');

    expect(screen.queryByText('Commentaire')).not.toBeInTheDocument();
  });

  it('affiche un lien vers les équipes inscrites sur l’écran de confirmation', async () => {
    renderPage();

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    expect(await screen.findByText('Équipe « Logistique » inscrite avec succès.')).toBeInTheDocument();

    const lien = screen.getByRole('link', { name: 'Voir les équipes inscrites' });
    expect(lien).toHaveAttribute('href', '/#statut-tournoi');
  });

  it('affiche le message d’erreur quand l’inscription échoue', async () => {
    vi.mocked(equipeApi.inscrireEquipe).mockRejectedValue(new Error('Erreur 400'));

    renderPage();

    fillRequiredFields();
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

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: "Inscrire l'équipe" }));

    await vi.waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['equipes'] });
    });

    expect(queryClient.getQueryState(['equipes'])?.isInvalidated).toBe(true);
  });
});
