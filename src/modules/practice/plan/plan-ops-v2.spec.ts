import { deriveAssignable, deriveV2Code, type OpsAxes } from './plan-ops-v2';
import { initialsOf } from './default-plan-operational-state';

const base: OpsAxes = {
  lifecycleCode: 'SPACE_ACTIVE',
  availabilityCode: 'SPACE_OP_AVAILABLE',
  hygieneCode: 'HYG_CLEAN',
  isolationCode: 'ISO_NONE',
  occupancyCode: 'OCC_FREE',
  terminalCleaningRequired: false,
  inspectionRequired: false,
};

describe('deriveV2Code (CONTRATO-F2-F5 §F2.2, primera regla que aplica)', () => {
  it.each([
    ['disponible, libre, limpia', {}, 'U'],
    [
      'bloqueada → C aunque esté ocupada',
      {
        availabilityCode: 'SPACE_OP_BLOCKED_ADMIN',
        occupancyCode: 'OCC_OCCUPIED',
      },
      'C',
    ],
    ['ciclo de vida suspendido → C', { lifecycleCode: 'SPACE_SUSPENDED' }, 'C'],
    [
      'contaminada → K antes que aislamiento y ocupación',
      {
        hygieneCode: 'HYG_CONTAMINATED',
        isolationCode: 'ISO_AIRBORNE',
        occupancyCode: 'OCC_OCCUPIED',
      },
      'K',
    ],
    [
      'aislamiento → I antes que ocupación',
      { isolationCode: 'ISO_CONTACT', occupancyCode: 'OCC_OCCUPIED' },
      'I',
    ],
    ['ocupada → O', { occupancyCode: 'OCC_OCCUPIED' }, 'O'],
    ['reservada → R', { occupancyCode: 'OCC_RESERVED' }, 'R'],
    ['sucia → H', { hygieneCode: 'HYG_DIRTY' }, 'H'],
    ['limpiando → H', { hygieneCode: 'HYG_CLEANING' }, 'H'],
    ['limpia con inspección exigida → H', { inspectionRequired: true }, 'H'],
    [
      'limpieza terminal pendiente → H',
      { terminalCleaningRequired: true },
      'H',
    ],
    [
      'inspeccionada → U',
      { hygieneCode: 'HYG_INSPECTED', inspectionRequired: true },
      'U',
    ],
  ] as const)('%s', (_name, patch, expected) => {
    expect(deriveV2Code({ ...base, ...patch })).toBe(expected);
  });
});

describe('deriveAssignable', () => {
  it('libre, activa, disponible y limpia sin inspección exigida', () => {
    expect(deriveAssignable(base)).toBe(true);
  });

  it('con inspección exigida sólo la inspeccionada', () => {
    expect(deriveAssignable({ ...base, inspectionRequired: true })).toBe(false);
    expect(
      deriveAssignable({
        ...base,
        inspectionRequired: true,
        hygieneCode: 'HYG_INSPECTED',
      }),
    ).toBe(true);
  });

  it.each([
    { occupancyCode: 'OCC_OCCUPIED' },
    { occupancyCode: 'OCC_RESERVED' },
    { availabilityCode: 'SPACE_OP_MAINTENANCE' },
    { lifecycleCode: 'SPACE_RETIRED' },
    { terminalCleaningRequired: true },
    { hygieneCode: 'HYG_DIRTY' },
  ] as const)('no es asignable con %o', (patch) => {
    expect(deriveAssignable({ ...base, ...patch })).toBe(false);
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
