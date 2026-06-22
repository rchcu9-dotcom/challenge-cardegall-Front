import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  enregistrerScoreMatch,
  getTourCourant,
  reorganiserPlanning,
  terminerTour,
  type MatchDto,
  type TerrainPlanningDto,
  type TourCourantDto,
} from '../tour';

function buildMatch(overrides: Partial<MatchDto> = {}): MatchDto {
  return {
    id: 'match-1',
    tourId: 'tour-1',
    equipeAId: 'equipe-1',
    equipeBId: 'equipe-2',
    estBye: false,
    terrain: 'A',
    heureDebutPrevue: '2026-06-21T08:03:00.000Z',
    heureFinPrevue: '2026-06-21T08:13:00.000Z',
    scoreA: null,
    scoreB: null,
    statut: 'a_jouer',
    ...overrides,
  };
}

function buildTourCourant(overrides: Partial<TourCourantDto> = {}): TourCourantDto {
  return {
    tour: {
      id: 'tour-1',
      numero: 1,
      statut: 'en_cours',
      parametres: {
        nomsTerrains: ['A', 'B'],
        dureeMatchMinutes: 15,
        latenceMinutes: 5,
        delaiDemarrageMinutes: 3,
      },
      equipesBecot: [],
    },
    matches: [buildMatch()],
    classement: [],
    resultatsComplets: false,
    ...overrides,
  };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('api/tour', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getTourCourant appelle GET /tours/courant', async () => {
    const dto = buildTourCourant();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dto));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getTourCourant();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/tours/courant');
    expect(result).toEqual(dto);
  });

  it('terminerTour envoie un POST JSON avec action seule sur /tours/courant/terminer', async () => {
    const resultDto = { action: 'phase_finale' as const, classementFinal: [] };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(resultDto));
    vi.stubGlobal('fetch', fetchMock);

    const result = await terminerTour('phase_finale');

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/tours/courant/terminer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'phase_finale' }),
    });
    expect(result).toEqual(resultDto);
  });

  it('terminerTour envoie aussi les paramètres du tour suivant quand ils sont fournis', async () => {
    const parametres = {
      nomsTerrains: ['A', 'B', 'C'],
      dureeMatchMinutes: 20,
      latenceMinutes: 8,
      delaiDemarrageMinutes: 5,
    };
    const resultDto = {
      action: 'nouveau_tour' as const,
      tour: buildTourCourant().tour,
      matches: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(resultDto));
    vi.stubGlobal('fetch', fetchMock);

    await terminerTour('nouveau_tour', parametres);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/tours/courant/terminer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'nouveau_tour', parametres }),
    });
  });

  it('enregistrerScoreMatch envoie un PATCH JSON sur /tours/matches/:id/score', async () => {
    const dto = buildTourCourant();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dto));
    vi.stubGlobal('fetch', fetchMock);

    const result = await enregistrerScoreMatch('match-1', 3, 1);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/tours/matches/match-1/score', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreA: 3, scoreB: 1 }),
    });
    expect(result).toEqual(dto);
  });

  it('reorganiserPlanning envoie un PATCH JSON avec parTerrain sur /tours/courant/planning', async () => {
    const dto = buildTourCourant();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dto));
    vi.stubGlobal('fetch', fetchMock);
    const parTerrain: TerrainPlanningDto[] = [
      { terrain: 'A', matchIds: ['match-2', 'match-1'] },
      { terrain: 'B', matchIds: [] },
    ];

    const result = await reorganiserPlanning(parTerrain);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/tours/courant/planning', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parTerrain }),
    });
    expect(result).toEqual(dto);
  });

  it('reorganiserPlanning lève une erreur avec le message du serveur quand la réponse est en échec (ex. 409 tour pas en_cours)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "Le tour courant n'est pas en cours" }, false, 409));
    vi.stubGlobal('fetch', fetchMock);

    await expect(reorganiserPlanning([{ terrain: 'A', matchIds: [] }])).rejects.toThrow(
      "Le tour courant n'est pas en cours",
    );
  });

  it('lève une erreur générique "Erreur <status>" quand la réponse en échec ne contient pas de message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, false, 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTourCourant()).rejects.toThrow('Erreur 500');
  });
});
