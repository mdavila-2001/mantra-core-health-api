import {
  InvalidTransitionError,
  assertTransition,
  canTransition,
  isFinished,
  isInFlight,
} from './clinical-import.state';
import type { BatchStatus } from './clinical-import.types';

const ALL: BatchStatus[] = [
  'VALIDADO',
  'RECHAZADO',
  'EN_COLA',
  'PROCESANDO',
  'COMPLETADO',
  'FALLIDO',
];

describe('estados del lote', () => {
  it('las únicas transiciones válidas son las del curso normal', () => {
    const valid = [
      ['VALIDADO', 'EN_COLA'],
      ['EN_COLA', 'PROCESANDO'],
      ['PROCESANDO', 'COMPLETADO'],
      ['PROCESANDO', 'FALLIDO'],
    ];
    for (const from of ALL) {
      for (const to of ALL) {
        expect(canTransition(from, to)).toBe(
          valid.some(([a, b]) => a === from && b === to),
        );
      }
    }
  });

  it('assertTransition lanza con la transición pedida, sin datos', () => {
    expect(() => assertTransition('RECHAZADO', 'EN_COLA')).toThrow(
      InvalidTransitionError,
    );
    expect(() => assertTransition('COMPLETADO', 'PROCESANDO')).toThrow(
      'COMPLETADO → PROCESANDO',
    );
    expect(() => assertTransition('VALIDADO', 'EN_COLA')).not.toThrow();
  });

  it('terminales y en curso', () => {
    expect(ALL.filter(isFinished)).toEqual([
      'RECHAZADO',
      'COMPLETADO',
      'FALLIDO',
    ]);
    expect(ALL.filter(isInFlight)).toEqual(['EN_COLA', 'PROCESANDO']);
  });
});
