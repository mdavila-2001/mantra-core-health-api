import { PreconditionFailedException } from '../../../common';
import {
  VALID_TO_IN_PAST_MESSAGE,
  assertValidToNotInPast,
} from './prescription-valid-to';

describe('assertValidToNotInPast', () => {
  const NOW = new Date('2026-10-31T12:00:00Z');

  it('sin validTo o con validTo futuro pasa', () => {
    expect(() => assertValidToNotInPast(undefined, NOW)).not.toThrow();
    expect(() => assertValidToNotInPast(null, NOW)).not.toThrow();
    expect(() =>
      assertValidToNotInPast(new Date(NOW.getTime() + 1), NOW),
    ).not.toThrow();
  });

  it('vencer en este mismo instante ya es estar vencida (el corte de la receta vigente)', () => {
    let error: any;
    try {
      assertValidToNotInPast(new Date(NOW), NOW, { requestId: 'mr1' });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getResponse()).toEqual({
      code: 'PRECONDITION_FAILED',
      message: VALID_TO_IN_PAST_MESSAGE,
      reason: 'MEDICATION_VALID_TO_IN_PAST',
      details: { requestId: 'mr1', validTo: NOW.toISOString() },
    });
  });
});
