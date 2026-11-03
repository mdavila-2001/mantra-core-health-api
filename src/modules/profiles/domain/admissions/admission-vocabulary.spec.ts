import { describe, expect, it } from '@jest/globals';
import {
  EVENT_TYPES,
  REASON_CODES,
  REASONS,
  SOURCE_TYPE_CODES,
  SOURCE_TYPES,
  applicantVisibleReason,
  eventCodeOf,
  reasonCodeOf,
  sourceTypeOf,
} from './admission-vocabulary';

describe('vocabulario de admisiones', () => {
  it('cada tipo de fuente y cada motivo tiene su concepto, y se resuelve de ida y vuelta', () => {
    for (const code of SOURCE_TYPE_CODES) {
      expect(sourceTypeOf(SOURCE_TYPES[code].concept)).toBe(code);
    }
    for (const code of REASON_CODES) {
      expect(reasonCodeOf(REASONS[code].concept)).toBe(code);
    }
    expect(sourceTypeOf('x')).toBeUndefined();
    expect(reasonCodeOf(null)).toBeUndefined();
  });

  it('los eventos de la bitácora cubren los doce del diseño y los de soltar/reasignar/abandonar', () => {
    for (const code of [
      'CREATED',
      'CLAIMED',
      'INFO_REQUESTED',
      'RESUBMITTED',
      'ITEM_VERIFIED',
      'ITEM_REJECTED',
      'VERIFIED',
      'REJECTED',
      'SUSPENDED',
      'REINSTATED',
      'EXPIRED',
      'WITHDRAWN',
      'RELEASED',
      'REASSIGNED',
      'ABANDONED',
      'BACKFILLED',
    ]) {
      expect(Object.keys(EVENT_TYPES)).toContain(code);
    }
    expect(eventCodeOf(EVENT_TYPES.VERIFIED)).toBe('VERIFIED');
    expect(eventCodeOf('x')).toBeUndefined();
  });

  it('el motivo «sospecha de fraude» nunca llega al solicitante: se le muestra como «otro»', () => {
    expect(applicantVisibleReason('SOSPECHA_DE_FRAUDE')).toBe('OTRO');
    expect(applicantVisibleReason('ILEGIBLE')).toBe('ILEGIBLE');
    expect(applicantVisibleReason(undefined)).toBeUndefined();
  });
});
