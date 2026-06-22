import { describe, it, expect } from 'vitest';
import { isOrangeComEmail } from '../email';

describe('isOrangeComEmail', () => {
  it.each(['capitaine@orange.com', 'capitaine@si.orange.com', 'Capitaine@Orange.COM'])(
    'accepte une adresse sur le domaine orange.com ou un sous-domaine (%s)',
    (value) => {
      expect(isOrangeComEmail(value)).toBe(true);
    },
  );

  it.each([
    '',
    'pas-un-email',
    'capitaine@gmail.com',
    'capitaine@fauxorange.com',
    'capitaine@orange.com.faux-domaine.fr',
  ])('rejette une adresse non conforme (%s)', (value) => {
    expect(isOrangeComEmail(value)).toBe(false);
  });
});
