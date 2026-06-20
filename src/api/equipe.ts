import { authFetch } from './authFetch';

declare const __APP_API_BASE_URL__: string | undefined;

const API_BASE_URL =
  typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : 'http://localhost:3010';

export type StatutEquipe = 'inscrite' | 'enrolee' | 'engagee' | 'retiree';

export interface EquipeDto {
  id: string;
  nom: string;
  capitaineUserId: string;
  capitainePseudo?: string;
  nbJoueursApprox: number;
  nbFemininesEnvisage: number;
  commentaire?: string;
  statut: StatutEquipe;
  nbFemininesReel?: number;
  ordreArrivee?: number;
  dateInscription: string;
  dateEnrolement?: string;
}

export interface InscrireEquipeDto {
  nom: string;
  capitaineUserId: string;
  capitainePseudo: string;
  nbJoueursApprox: number;
  nbFemininesEnvisage: number;
  commentaire?: string;
}

export interface EnrolerEquipeDto {
  nbFemininesReel: number;
}

export interface EnrolementEtatDto {
  cloture: boolean;
}

export interface ClotureResultDto {
  equipes: EquipeDto[];
  cloture: true;
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

export async function listEquipes(): Promise<EquipeDto[]> {
  const res = await fetch(`${API_BASE_URL}/equipes`);
  return handleResponse<EquipeDto[]>(res);
}

export async function inscrireEquipe(dto: InscrireEquipeDto): Promise<EquipeDto> {
  const res = await fetch(`${API_BASE_URL}/equipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<EquipeDto>(res);
}

export async function listEnrolees(): Promise<EquipeDto[]> {
  const res = await fetch(`${API_BASE_URL}/equipes/enrolees`);
  return handleResponse<EquipeDto[]>(res);
}

export async function getEnrolementEtat(): Promise<EnrolementEtatDto> {
  const res = await fetch(`${API_BASE_URL}/equipes/enrolement-etat`);
  return handleResponse<EnrolementEtatDto>(res);
}

export async function enrolerEquipe(id: string, dto: EnrolerEquipeDto): Promise<EquipeDto> {
  const res = await authFetch(`${API_BASE_URL}/equipes/${id}/enroler`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<EquipeDto>(res);
}

export async function reordonnerEquipes(orderedIds: string[]): Promise<EquipeDto[]> {
  const res = await authFetch(`${API_BASE_URL}/equipes/reordonner`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  });
  return handleResponse<EquipeDto[]>(res);
}

export async function cloturerEnrolements(): Promise<ClotureResultDto> {
  const res = await authFetch(`${API_BASE_URL}/equipes/cloturer-enrolements`, {
    method: 'POST',
  });
  return handleResponse<ClotureResultDto>(res);
}
