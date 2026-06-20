import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminEnrolementPage } from '../AdminEnrolementPage';
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
      <AdminEnrolementPage />
    </QueryClientProvider>,
  );
}

describe('AdminEnrolementPage', () => {
  beforeEach(() => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([]);
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([]);
    vi.mocked(equipeApi.getEnrolementEtat).mockResolvedValue({ cloture: false });
    vi.mocked(equipeApi.enrolerEquipe).mockResolvedValue(buildEquipe({ statut: 'enrolee' }));
    vi.mocked(equipeApi.reordonnerEquipes).mockResolvedValue([]);
    vi.mocked(equipeApi.cloturerEnrolements).mockResolvedValue({ equipes: [], cloture: true });
  });

  it('affiche les équipes à enrôler avec le nombre de féminines envisagé pré-rempli', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', nbFemininesEnvisage: 3, statut: 'inscrite' }),
    ]);

    renderPage();

    expect(await screen.findByText('DSI')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    expect(screen.getByRole('button', { name: 'Enrôler' })).toBeInTheDocument();
  });

  it('le bouton "Enrôler" appelle enrolerEquipe avec le nombre de féminines saisi', async () => {
    vi.mocked(equipeApi.listEquipes).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', nbFemininesEnvisage: 3, statut: 'inscrite' }),
    ]);

    renderPage();

    await screen.findByText('DSI');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enrôler' }));

    await vi.waitFor(() => {
      expect(equipeApi.enrolerEquipe).toHaveBeenCalledWith('equipe-1', { nbFemininesReel: 4 });
    });
  });

  it('affiche les équipes enrôlées via EnrolementList', async () => {
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 }),
    ]);

    renderPage();

    expect(await screen.findByText('DSI')).toBeInTheDocument();
    expect(screen.getByText('3 féminines')).toBeInTheDocument();
  });

  it('affiche un message d’aide et désactive la clôture quand moins de 2 équipes sont enrôlées', async () => {
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 }),
    ]);

    renderPage();

    await screen.findByText('DSI');
    expect(
      screen.getByText('Au moins 2 équipes enrôlées sont requises pour clôturer.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clôturer les enrôlements' })).toBeDisabled();
  });

  it('le bouton de clôture est actif avec au moins 2 équipes enrôlées et appelle cloturerEnrolements', async () => {
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 }),
      buildEquipe({
        id: 'equipe-2',
        nom: 'Marketing',
        statut: 'enrolee',
        nbFemininesReel: 2,
        ordreArrivee: 2,
      }),
    ]);

    renderPage();

    await screen.findByText('DSI');
    const button = screen.getByRole('button', { name: 'Clôturer les enrôlements' });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(equipeApi.cloturerEnrolements).toHaveBeenCalledTimes(1);
    });
  });

  it('affiche le message de clôture et désactive le bouton quand les enrôlements sont clôturés', async () => {
    vi.mocked(equipeApi.getEnrolementEtat).mockResolvedValue({ cloture: true });
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 }),
      buildEquipe({
        id: 'equipe-2',
        nom: 'Marketing',
        statut: 'enrolee',
        nbFemininesReel: 2,
        ordreArrivee: 2,
      }),
    ]);

    renderPage();

    expect(
      await screen.findByText('Les enrôlements sont clôturés. Le tournoi peut démarrer.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Au moins 2 équipes enrôlées sont requises pour clôturer.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Clôturer les enrôlements' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Décloturer les inscriptions' }),
    ).toBeEnabled();
  });

  it('affiche le message d’erreur quand la clôture échoue', async () => {
    vi.mocked(equipeApi.listEnrolees).mockResolvedValue([
      buildEquipe({ id: 'equipe-1', nom: 'DSI', statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 }),
      buildEquipe({
        id: 'equipe-2',
        nom: 'Marketing',
        statut: 'enrolee',
        nbFemininesReel: 2,
        ordreArrivee: 2,
      }),
    ]);
    vi.mocked(equipeApi.cloturerEnrolements).mockRejectedValue(
      new Error('Au moins 2 équipes enrôlées sont requises'),
    );

    renderPage();

    await screen.findByText('DSI');
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer les enrôlements' }));

    expect(await screen.findByText('Au moins 2 équipes enrôlées sont requises')).toBeInTheDocument();
  });
});
