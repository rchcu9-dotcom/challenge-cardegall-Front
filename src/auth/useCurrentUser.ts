export interface CurrentUser {
  userId: string;
  displayName: string;
}

const STUB_USER: CurrentUser = {
  userId: 'demo-capitaine',
  displayName: 'Capitaine (démo)',
};

/**
 * Stub en attendant `lib-auth-partagee` : retourne toujours le même utilisateur fictif.
 * À remplacer par l'utilisateur authentifié réel une fois la lib disponible, sans
 * changer la signature (consommateurs récupèrent juste `userId`/`displayName`).
 */
export function useCurrentUser(): CurrentUser {
  return STUB_USER;
}
