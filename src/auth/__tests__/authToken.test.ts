import { describe, it, expect, afterEach } from 'vitest';
import { clearToken, getToken, setToken } from '../authToken';

describe('authToken', () => {
  afterEach(() => {
    clearToken();
  });

  it('retourne null quand aucun token n’est stocké', () => {
    expect(getToken()).toBeNull();
  });

  it('stocke et relit un token', () => {
    setToken('jwt-abc');
    expect(getToken()).toBe('jwt-abc');
  });

  it('efface le token stocké', () => {
    setToken('jwt-abc');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
