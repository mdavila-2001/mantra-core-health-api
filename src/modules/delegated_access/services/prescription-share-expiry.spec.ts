import { CONCEPTS } from '../../../common';
import {
  effectiveShareStatus,
  shareEndedReason,
  shareExpiresAt,
  shareStatusOf,
} from './prescription-share-expiry';

const DAY = 24 * 60 * 60 * 1000;

/** Vencimiento y estado del enlace compartido (S-5). */
describe('prescription-share-expiry', () => {
  const now = new Date('2026-10-30T12:00:00.000Z');
  const inDays = (n: number) => new Date(now.getTime() + n * DAY);

  describe('shareExpiresAt', () => {
    it('vence con el valid_to más próximo de los ítems', () => {
      expect(
        shareExpiresAt([{ validTo: inDays(10) }, { validTo: inDays(5) }], now),
      ).toEqual(inDays(5));
    });

    it('sin valid_to, a los 30 días', () => {
      expect(shareExpiresAt([{ validTo: null }, {}], now)).toEqual(inDays(30));
      expect(shareExpiresAt([], now)).toEqual(inDays(30));
    });

    it('un ítem que vence a los 40 días no estira el enlace más allá de 30', () => {
      expect(shareExpiresAt([{ validTo: inDays(40) }], now)).toEqual(
        inDays(30),
      );
    });
  });

  describe('shareStatusOf', () => {
    const active = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: inDays(3),
    };

    it('activo y sin vencer es VALID', () => {
      expect(shareStatusOf(active, now)).toBe('VALID');
    });

    it('revocado es REVOKED aunque no venció', () => {
      expect(shareStatusOf({ ...active, revokedAt: now }, now)).toBe('REVOKED');
      expect(
        shareStatusOf(
          { ...active, statusConceptId: CONCEPTS.STATE_REVOKED },
          now,
        ),
      ).toBe('REVOKED');
    });

    it('revocado gana sobre vencido', () => {
      expect(
        shareStatusOf(
          { ...active, expiresAt: inDays(-1), revokedAt: now },
          now,
        ),
      ).toBe('REVOKED');
    });

    it('expiresAt pasado es EXPIRED aunque la fila diga ACTIVE', () => {
      expect(shareStatusOf({ ...active, expiresAt: inDays(-1) }, now)).toBe(
        'EXPIRED',
      );
      expect(shareStatusOf({ ...active, expiresAt: now }, now)).toBe('EXPIRED');
    });

    it('una fila EXPIRED es EXPIRED', () => {
      expect(
        shareStatusOf(
          { ...active, statusConceptId: CONCEPTS.STATE_EXPIRED },
          now,
        ),
      ).toBe('EXPIRED');
    });
  });

  describe('effectiveShareStatus', () => {
    const active = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: inDays(3),
    };

    it('sin ítems vigentes, un enlace válido se lee EXPIRED', () => {
      expect(effectiveShareStatus(active, 0, now)).toBe('EXPIRED');
      expect(effectiveShareStatus(active, 2, now)).toBe('VALID');
    });

    it('revocado sigue REVOKED aunque no queden ítems', () => {
      expect(effectiveShareStatus({ ...active, revokedAt: now }, 0, now)).toBe(
        'REVOKED',
      );
    });
  });

  describe('shareEndedReason (H12-09)', () => {
    const active = {
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: inDays(3),
    };

    it('en plazo y sin ítems vigentes: la receta dejó de valer, no venció', () => {
      expect(shareEndedReason(active, 0, now)).toBe('PRESCRIPTION_NOT_ACTIVE');
    });

    it('con el plazo pasado: venció el enlace', () => {
      expect(
        shareEndedReason({ ...active, expiresAt: inDays(-1) }, 0, now),
      ).toBe('LINK_EXPIRED');
      expect(
        shareEndedReason(
          { ...active, statusConceptId: CONCEPTS.STATE_EXPIRED },
          2,
          now,
        ),
      ).toBe('LINK_EXPIRED');
    });

    it('vigente o revocado no tiene motivo de vencimiento', () => {
      expect(shareEndedReason(active, 2, now)).toBeNull();
      expect(
        shareEndedReason({ ...active, revokedAt: now }, 0, now),
      ).toBeNull();
    });
  });
});
