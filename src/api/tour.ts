import { authFetch } from './authFetch';

declare const __APP_API_BASE_URL__: string | undefined;

const API_BASE_URL =
  typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : 'http://localhost:3010';

export type StatutTour = 'planifie' | 'en_cours' | 'termine';
export type StatutMatch = 'a_jouer' | 'en_cours' | 'termine';
export type ActionFinTour = 'nouveau_tour' | 'phase_finale';

export interface ParametresTour {
  nomsTerrains: string[];
  dureeMatchMinutes: number;
  latenceMinutes: number;
  delaiDemarrageMinutes: number;
}

export interface TourDto {
  id: string;
  numero: number;
  statut: StatutTour;
  parametres: ParametresTour;
  equipesBecot: string[];
}

export interface MatchDto {
  id: string;
  tourId: string;
  equipeAId: string;
  equipeBId: string | null;
  estBye: boolean;
  terrain: string | null;
  heureDebutPrevue: string | null;
  heureFinPrevue: string | null;
  scoreA: number | null;
  scoreB: number | null;
  statut: StatutMatch;
}

export interface ClassementEntryDto {
  equipeId: string;
  points: number;
  victoires: number;
  nuls: number;
  defaites: number;
  butsMarques: number;
  butsConcedes: number;
  diffGenerale: number;
  diffParticuliere: number;
  nbFeminines: number;
  rang: number;
}

export interface TourCourantDto {
  tour: TourDto;
  matches: MatchDto[];
  classement: ClassementEntryDto[];
  resultatsComplets: boolean;
}

export type TerminerTourResultDto =
  | { action: 'nouveau_tour'; tour: TourDto; matches: MatchDto[] }
  | { action: 'phase_finale'; classementFinal: ClassementEntryDto[]; phaseFinaleDemarree: boolean };

export interface TerrainPlanningDto {
  terrain: string;
  matchIds: string[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body && typeof body === 'object' && 'message' in body && String(body.message)) ||
      `Erreur ${res.status}`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getTourCourant(): Promise<TourCourantDto> {
  const res = await fetch(`${API_BASE_URL}/tours/courant`);
  return handleResponse<TourCourantDto>(res);
}

export async function terminerTour(
  action: ActionFinTour,
  parametres?: ParametresTour,
): Promise<TerminerTourResultDto> {
  const res = await authFetch(`${API_BASE_URL}/tours/courant/terminer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parametres ? { action, parametres } : { action }),
  });
  return handleResponse<TerminerTourResultDto>(res);
}

export async function enregistrerScoreMatch(
  matchId: string,
  scoreA: number,
  scoreB: number,
): Promise<TourCourantDto> {
  const res = await authFetch(`${API_BASE_URL}/tours/matches/${matchId}/score`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scoreA, scoreB }),
  });
  return handleResponse<TourCourantDto>(res);
}

export async function reorganiserPlanning(
  parTerrain: TerrainPlanningDto[],
): Promise<TourCourantDto> {
  const res = await authFetch(`${API_BASE_URL}/tours/courant/planning`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parTerrain }),
  });
  return handleResponse<TourCourantDto>(res);
}
