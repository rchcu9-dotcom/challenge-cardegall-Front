import { authFetch } from './authFetch';

declare const __APP_API_BASE_URL__: string | undefined;

const API_BASE_URL =
  typeof __APP_API_BASE_URL__ !== 'undefined' ? __APP_API_BASE_URL__ : 'http://localhost:3010';

export type RoleUtilisateur = 'admin' | 'capitaine' | 'membre';

export interface UtilisateurDto {
  id: string;
  providerId: string;
  provider: string;
  displayName: string;
  email?: string;
  role: RoleUtilisateur;
  dateApparition: string;
  derniereConnexion?: string;
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

export async function listUsers(): Promise<UtilisateurDto[]> {
  const res = await authFetch(`${API_BASE_URL}/users`);
  return handleResponse<UtilisateurDto[]>(res);
}

export async function updateUserRole(id: string, role: RoleUtilisateur): Promise<UtilisateurDto> {
  const res = await authFetch(`${API_BASE_URL}/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  return handleResponse<UtilisateurDto>(res);
}
