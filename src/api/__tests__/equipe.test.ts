import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  listEquipes,
  listEnrolees,
  getEnrolementEtat,
  inscrireEquipe,
  enrolerEquipe,
  reordonnerEquipes,
  cloturerEnrolements,
  decloturerEnrolements,
  type EquipeDto,
} from '../equipe';

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

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('api/equipe', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('listEquipes appelle GET /equipes', async () => {
    const equipes = [buildEquipe()];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(equipes));
    vi.stubGlobal('fetch', fetchMock);

    const result = await listEquipes();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes');
    expect(result).toEqual(equipes);
  });

  it('inscrireEquipe envoie un POST JSON sur /equipes', async () => {
    const created = buildEquipe({
      id: 'equipe-7',
      nom: 'Logistique',
      capitaineUserId: 'demo-capitaine',
      capitainePseudo: 'CapiLogistique',
      nbJoueursApprox: 9,
      nbFemininesEnvisage: 2,
      commentaire: 'Présents dès 8h',
    });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created));
    vi.stubGlobal('fetch', fetchMock);

    const dto = {
      nom: 'Logistique',
      capitaineUserId: 'demo-capitaine',
      capitainePseudo: 'CapiLogistique',
      nbJoueursApprox: 9,
      nbFemininesEnvisage: 2,
      commentaire: 'Présents dès 8h',
    };

    const result = await inscrireEquipe(dto);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    expect(result).toEqual(created);
  });

  it('listEnrolees appelle GET /equipes/enrolees', async () => {
    const enrolees = [buildEquipe({ statut: 'enrolee', nbFemininesReel: 3, ordreArrivee: 1 })];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(enrolees));
    vi.stubGlobal('fetch', fetchMock);

    const result = await listEnrolees();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/enrolees');
    expect(result).toEqual(enrolees);
  });

  it('getEnrolementEtat appelle GET /equipes/enrolement-etat', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ cloture: false }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getEnrolementEtat();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/enrolement-etat');
    expect(result).toEqual({ cloture: false });
  });

  it('enrolerEquipe envoie un PATCH JSON sur /equipes/:id/enroler', async () => {
    const updated = buildEquipe({ statut: 'enrolee', nbFemininesReel: 4, ordreArrivee: 1 });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(updated));
    vi.stubGlobal('fetch', fetchMock);

    const result = await enrolerEquipe('equipe-1', { nbFemininesReel: 4 });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/equipe-1/enroler', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nbFemininesReel: 4 }),
    });
    expect(result).toEqual(updated);
  });

  it('reordonnerEquipes envoie un PATCH JSON avec orderedIds sur /equipes/reordonner', async () => {
    const reordered = [buildEquipe({ id: 'equipe-2' }), buildEquipe({ id: 'equipe-1' })];
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(reordered));
    vi.stubGlobal('fetch', fetchMock);

    const result = await reordonnerEquipes(['equipe-2', 'equipe-1']);

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/reordonner', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: ['equipe-2', 'equipe-1'] }),
    });
    expect(result).toEqual(reordered);
  });

  it('cloturerEnrolements envoie un POST sur /equipes/cloturer-enrolements', async () => {
    const body = { equipes: [buildEquipe({ statut: 'engagee' })], cloture: true as const };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal('fetch', fetchMock);

    const result = await cloturerEnrolements();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/cloturer-enrolements', {
      method: 'POST',
    });
    expect(result).toEqual(body);
  });

  it('decloturerEnrolements envoie un POST sur /equipes/decloturer-enrolements', async () => {
    const body = { equipes: [buildEquipe({ statut: 'enrolee' })], cloture: false as const };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body));
    vi.stubGlobal('fetch', fetchMock);

    const result = await decloturerEnrolements();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3010/equipes/decloturer-enrolements', {
      method: 'POST',
    });
    expect(result).toEqual(body);
  });

  it('lève une erreur avec le message du serveur quand la réponse est en échec', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: 'Au moins 2 équipes enrôlées sont requises' }, false, 400));
    vi.stubGlobal('fetch', fetchMock);

    await expect(cloturerEnrolements()).rejects.toThrow(
      'Au moins 2 équipes enrôlées sont requises',
    );
  });

  it('lève une erreur générique "Erreur <status>" quand la réponse en échec ne contient pas de message', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, false, 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listEquipes()).rejects.toThrow('Erreur 500');
  });
});
