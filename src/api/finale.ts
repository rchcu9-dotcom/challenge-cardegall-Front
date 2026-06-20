import { authFetch } from './authFetch';

declare const __APP_API_BASE_URL__: string | undefined;

const API_BASE_URL =
  typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : 'http://localhost:3010';

export type TypeMatchFinale = 'demi_finale_a' | 'demi_finale_b' | 'finale_cardebat' | 'finale_le_gall';
export type StatutMatchFinale = 'a_jouer' | 'termine';
export type StatutPhaseFinale = 'en_cours' | 'terminee';

export interface MatchFinaleDto {
  id: string;
  type: TypeMatchFinale;
  equipeAId: string | null;
  equipeBId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  statut: StatutMatchFinale;
}

export interface PhaseFinaleDto {
  demarree: boolean;
  statut: StatutPhaseFinale | null;
  demiFinaleA: MatchFinaleDto | null;
  demiFinaleB: MatchFinaleDto | null;
  finaleCardebat: MatchFinaleDto | null;
  finaleLeGall: MatchFinaleDto | null;
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

export async function getPhaseFinaleCourante(): Promise<PhaseFinaleDto> {
  const res = await fetch(`${API_BASE_URL}/finale/courante`);
  return handleResponse<PhaseFinaleDto>(res);
}

export async function demarrerPhaseFinale(): Promise<PhaseFinaleDto> {
  const res = await authFetch(`${API_BASE_URL}/finale/demarrer`, {
    method: 'POST',
  });
  return handleResponse<PhaseFinaleDto>(res);
}

export async function enregistrerScoreMatchFinale(
  matchId: string,
  scoreA: number,
  scoreB: number,
): Promise<PhaseFinaleDto> {
  const res = await authFetch(`${API_BASE_URL}/finale/matches/${matchId}/score`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scoreA, scoreB }),
  });
  return handleResponse<PhaseFinaleDto>(res);
}
