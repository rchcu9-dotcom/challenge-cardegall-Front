import { describe, it, expect } from 'vitest';
import { useCurrentUser } from '../useCurrentUser';

describe('useCurrentUser', () => {
  it('retourne toujours le même utilisateur fictif (stub en attendant lib-auth-partagee)', () => {
    expect(useCurrentUser()).toEqual({
      userId: 'demo-capitaine',
      displayName: 'Capitaine (démo)',
    });
  });

  it('retourne une référence stable entre deux appels', () => {
    expect(useCurrentUser()).toEqual(useCurrentUser());
  });
});
