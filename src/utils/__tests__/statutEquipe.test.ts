import { describe, it, expect } from 'vitest';
import { STATUT_EQUIPE_LABELS } from '../statutEquipe';

describe('STATUT_EQUIPE_LABELS', () => {
  it('fournit un libellé français pour chaque statut possible', () => {
    expect(STATUT_EQUIPE_LABELS).toEqual({
      inscrite: 'Inscrite',
      enrolee: 'Enrôlée',
      engagee: 'Engagée',
      retiree: 'Retirée',
    });
  });
});
