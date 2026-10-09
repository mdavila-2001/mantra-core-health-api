import {
  hasVerification,
  verificationFromSnapshot,
} from './condition-verification';

/**
 * La decisión de verificación vive en un jsonb de forma libre
 * (`audit.conditions_history.data_snapshot`): la lectura no puede convertir
 * una revisión vieja o mal formada en una decisión a medias.
 */
describe('verificationFromSnapshot (C3 / P41)', () => {
  it('lee una decisión completa y descarta claves desconocidas', () => {
    expect(
      verificationFromSnapshot({
        clinicalStatus: 'x',
        verification: {
          outcome: 'REFUTED',
          decidedAt: '2026-09-26T12:00:00.000Z',
          decidedByProfileId: 'prac-1',
          reasonText: null,
          basedOn: { kind: 'ANALYSIS', serviceRequestId: 'sr-1', otra: 1 },
          extra: true,
        },
      }),
    ).toEqual({
      outcome: 'REFUTED',
      decidedAt: '2026-09-26T12:00:00.000Z',
      decidedByProfileId: 'prac-1',
      reasonText: null,
      basedOn: { kind: 'ANALYSIS', serviceRequestId: 'sr-1' },
    });
  });

  it('una evidencia de clase desconocida se lee como sin evidencia (límite)', () => {
    const read = verificationFromSnapshot({
      verification: {
        outcome: 'CONFIRMED',
        decidedAt: '2026-09-26T12:00:00.000Z',
        decidedByProfileId: 'prac-1',
        reasonText: 'x',
        basedOn: { kind: 'IMAGEN' },
      },
    });
    expect(read?.basedOn).toBeNull();
  });

  it('sin decisión, o con una decisión mal formada, no hay verificación', () => {
    expect(verificationFromSnapshot(undefined)).toBeNull();
    expect(
      verificationFromSnapshot({ statusChangeReasonText: 'x' }),
    ).toBeNull();
    expect(
      verificationFromSnapshot({
        verification: {
          outcome: 'MAYBE',
          decidedAt: 'x',
          decidedByProfileId: 'y',
        },
      }),
    ).toBeNull();
    expect(
      verificationFromSnapshot({ verification: { outcome: 'CONFIRMED' } }),
    ).toBeNull();
    expect(hasVerification({ verification: 'CONFIRMED' })).toBe(false);
  });
});
