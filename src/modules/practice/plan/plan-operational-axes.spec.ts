import {
  bedStatusV2,
  isAssignable,
  type OperationalAxes,
} from '../domain/bed-status-v2';
import { initialsOf } from './default-plan-operational-state';

/**
 * El plano colorea con el resumen v2-0116 y el «asignable» de F2
 * (`domain/bed-status-v2.ts`): no tiene una copia propia de la regla. Estos casos
 * fijan la tabla de CONTRATO-F2-F5 §F2.2 tal como el plano la consume.
 */
const base: OperationalAxes = {
  lifecycleActive: true,
  availability: 'SPACE_OP_AVAILABLE',
  hygiene: 'HYG_CLEAN',
  isolation: 'ISO_NONE',
  occupancy: 'OCC_FREE',
  terminalCleaningRequired: false,
};
const optional = { inspectionRequired: false };
const required = { inspectionRequired: true };

describe('bedStatusV2 en el plano (CONTRATO-F2-F5 §F2.2, primera regla que aplica)', () => {
  it.each([
    ['disponible, libre, limpia', {}, optional, 'U'],
    [
      'bloqueada → C aunque esté ocupada',
      { availability: 'SPACE_OP_BLOCKED_ADMIN', occupancy: 'OCC_OCCUPIED' },
      optional,
      'C',
    ],
    ['ciclo de vida suspendido → C', { lifecycleActive: false }, optional, 'C'],
    [
      'contaminada → K antes que aislamiento y ocupación',
      {
        hygiene: 'HYG_CONTAMINATED',
        isolation: 'ISO_AIRBORNE',
        occupancy: 'OCC_OCCUPIED',
      },
      optional,
      'K',
    ],
    [
      'aislamiento → I antes que ocupación',
      { isolation: 'ISO_CONTACT', occupancy: 'OCC_OCCUPIED' },
      optional,
      'I',
    ],
    ['ocupada → O', { occupancy: 'OCC_OCCUPIED' }, optional, 'O'],
    ['reservada → R', { occupancy: 'OCC_RESERVED' }, optional, 'R'],
    ['sucia → H', { hygiene: 'HYG_DIRTY' }, optional, 'H'],
    ['limpiando → H', { hygiene: 'HYG_CLEANING' }, optional, 'H'],
    ['limpia con inspección exigida → H', {}, required, 'H'],
    [
      'limpieza terminal pendiente → H',
      { terminalCleaningRequired: true },
      optional,
      'H',
    ],
    ['inspeccionada → U', { hygiene: 'HYG_INSPECTED' }, required, 'U'],
  ] as const)('%s', (_name, patch, options, expected) => {
    expect(bedStatusV2({ ...base, ...patch }, options)).toBe(expected);
  });
});

describe('isAssignable en el plano', () => {
  it('libre, activa, disponible y limpia sin inspección exigida', () => {
    expect(isAssignable(base, optional)).toBe(true);
  });

  it('con inspección exigida sólo la inspeccionada', () => {
    expect(isAssignable(base, required)).toBe(false);
    expect(isAssignable({ ...base, hygiene: 'HYG_INSPECTED' }, required)).toBe(
      true,
    );
  });

  it.each([
    { occupancy: 'OCC_OCCUPIED' },
    { occupancy: 'OCC_RESERVED' },
    { availability: 'SPACE_OP_MAINTENANCE' },
    { lifecycleActive: false },
    { terminalCleaningRequired: true },
    { hygiene: 'HYG_DIRTY' },
  ] as const)('no es asignable con %o', (patch) => {
    expect(isAssignable({ ...base, ...patch }, optional)).toBe(false);
  });
});

describe('initialsOf', () => {
  it('nombre + primer apellido, en mayúsculas', () => {
    expect(initialsOf('ana', 'pérez', null)).toBe('AP');
  });

  it('sin nombre cae al nombre para mostrar', () => {
    expect(initialsOf(null, null, 'Juan Carlos Mamani')).toBe('JM');
  });

  it('sin nada, un signo de pregunta', () => {
    expect(initialsOf(null, null, null)).toBe('?');
  });
});
