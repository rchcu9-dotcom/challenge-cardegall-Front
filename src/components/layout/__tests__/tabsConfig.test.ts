import { describe, it, expect } from 'vitest';
import { getPrimaryTabIds } from '../tabsConfig';

describe('getPrimaryTabIds', () => {
  it('returns Accueil, Compétition, Inscription while enrolments are open', () => {
    expect(getPrimaryTabIds(false)).toEqual(['accueil', 'competition', 'inscription']);
  });

  it('returns Accueil, Planning, Résultats & classement once enrolments are clôturés', () => {
    expect(getPrimaryTabIds(true)).toEqual(['accueil', 'planning', 'resultats']);
  });
});
