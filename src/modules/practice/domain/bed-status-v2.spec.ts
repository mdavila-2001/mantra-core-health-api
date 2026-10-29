import {
  bedStatusV2,
  isAssignable,
  V2_BED_STATUS_CODES,
  type OperationalAxes,
  type V2BedStatus,
} from './bed-status-v2';

const LIBRE: OperationalAxes = {
  lifecycleActive: true,
  availability: 'SPACE_OP_AVAILABLE',
  hygiene: 'HYG_INSPECTED',
  isolation: 'ISO_NONE',
  occupancy: 'OCC_FREE',
  terminalCleaningRequired: false,
};
const con = (cambio: Partial<OperationalAxes>): OperationalAxes => ({
  ...LIBRE,
  ...cambio,
});
const EXIGE = { inspectionRequired: true };
const NO_EXIGE = { inspectionRequired: false };

describe('bedStatusV2 · las 7 reglas del contrato (CONTRATO-F2-F5 §F2.2)', () => {
  // [regla, descripción, ejes, opciones, esperado]
  const tabla: [number, string, OperationalAxes, typeof EXIGE, V2BedStatus][] =
    [
      [
        1,
        'bloqueada por motivo clínico',
        con({ availability: 'SPACE_OP_BLOCKED_CLINICAL' }),
        EXIGE,
        'C',
      ],
      [
        1,
        'bloqueada por motivo administrativo',
        con({ availability: 'SPACE_OP_BLOCKED_ADMIN' }),
        EXIGE,
        'C',
      ],
      [
        1,
        'en mantenimiento',
        con({ availability: 'SPACE_OP_MAINTENANCE' }),
        EXIGE,
        'C',
      ],
      [1, 'cerrada', con({ availability: 'SPACE_OP_CLOSED' }), EXIGE, 'C'],
      [
        1,
        'ciclo de vida distinto de activo',
        con({ lifecycleActive: false }),
        EXIGE,
        'C',
      ],
      [
        2,
        'higiene contaminada',
        con({ hygiene: 'HYG_CONTAMINATED' }),
        EXIGE,
        'K',
      ],
      [
        3,
        'aislamiento por contacto',
        con({ isolation: 'ISO_CONTACT' }),
        EXIGE,
        'I',
      ],
      [3, 'aislamiento aéreo', con({ isolation: 'ISO_AIRBORNE' }), EXIGE, 'I'],
      [4, 'ocupada', con({ occupancy: 'OCC_OCCUPIED' }), EXIGE, 'O'],
      [5, 'reservada', con({ occupancy: 'OCC_RESERVED' }), EXIGE, 'R'],
      [6, 'sucia', con({ hygiene: 'HYG_DIRTY' }), EXIGE, 'H'],
      [6, 'en limpieza', con({ hygiene: 'HYG_CLEANING' }), EXIGE, 'H'],
      [
        6,
        'limpia con inspección obligatoria',
        con({ hygiene: 'HYG_CLEAN' }),
        EXIGE,
        'H',
      ],
      [
        6,
        'inspeccionada con limpieza terminal pendiente',
        con({ terminalCleaningRequired: true }),
        NO_EXIGE,
        'H',
      ],
      [7, 'inspeccionada y libre', LIBRE, EXIGE, 'U'],
      [
        7,
        'limpia sin inspección obligatoria',
        con({ hygiene: 'HYG_CLEAN' }),
        NO_EXIGE,
        'U',
      ],
    ];

  it.each(tabla)(
    'regla %i · %s',
    (_regla, _descripcion, ejes, opciones, esperado) => {
      expect(bedStatusV2(ejes, opciones)).toBe(esperado);
    },
  );

  it('todos los códigos producidos están en la lista que admite la restricción de la base', () => {
    for (const [, , ejes, opciones] of tabla) {
      expect(V2_BED_STATUS_CODES).toContain(bedStatusV2(ejes, opciones));
    }
    expect([...V2_BED_STATUS_CODES].sort()).toEqual([
      'C',
      'H',
      'I',
      'K',
      'O',
      'R',
      'U',
    ]);
  });

  describe('la primera regla que aplica gana', () => {
    it('cerrada pesa más que contaminada, aislada y ocupada', () => {
      expect(
        bedStatusV2(
          con({
            availability: 'SPACE_OP_CLOSED',
            hygiene: 'HYG_CONTAMINATED',
            isolation: 'ISO_AIRBORNE',
            occupancy: 'OCC_OCCUPIED',
          }),
          EXIGE,
        ),
      ).toBe('C');
    });
    it('contaminada pesa más que aislada y ocupada', () => {
      expect(
        bedStatusV2(
          con({
            hygiene: 'HYG_CONTAMINATED',
            isolation: 'ISO_DROPLET',
            occupancy: 'OCC_OCCUPIED',
          }),
          EXIGE,
        ),
      ).toBe('K');
    });
    it('aislada pesa más que ocupada y reservada', () => {
      expect(
        bedStatusV2(
          con({ isolation: 'ISO_PROTECTIVE', occupancy: 'OCC_OCCUPIED' }),
          EXIGE,
        ),
      ).toBe('I');
    });
    it('ocupada pesa más que sucia: «ocupada y en limpieza» no existe como valor único', () => {
      expect(
        bedStatusV2(
          con({ occupancy: 'OCC_OCCUPIED', hygiene: 'HYG_DIRTY' }),
          EXIGE,
        ),
      ).toBe('O');
    });
    it('ocupada pesa más que reservada y ésta más que sucia', () => {
      expect(
        bedStatusV2(
          con({ occupancy: 'OCC_RESERVED', hygiene: 'HYG_DIRTY' }),
          EXIGE,
        ),
      ).toBe('R');
    });
  });
});

describe('isAssignable', () => {
  it('libre, disponible, inspeccionada y sin limpieza terminal: sí', () => {
    expect(isAssignable(LIBRE, EXIGE)).toBe(true);
  });
  it('limpia sin inspección: no si es obligatoria, sí si no lo es', () => {
    const limpia = con({ hygiene: 'HYG_CLEAN' });
    expect(isAssignable(limpia, EXIGE)).toBe(false);
    expect(isAssignable(limpia, NO_EXIGE)).toBe(true);
  });
  it('la limpieza terminal pendiente la impide aunque la inspección no sea obligatoria', () => {
    expect(
      isAssignable(
        con({ hygiene: 'HYG_CLEAN', terminalCleaningRequired: true }),
        NO_EXIGE,
      ),
    ).toBe(false);
    expect(
      isAssignable(con({ terminalCleaningRequired: true }), NO_EXIGE),
    ).toBe(false);
  });
  it.each([
    ['sucia', con({ hygiene: 'HYG_DIRTY' })],
    ['en limpieza', con({ hygiene: 'HYG_CLEANING' })],
    ['contaminada', con({ hygiene: 'HYG_CONTAMINATED' })],
    ['ocupada', con({ occupancy: 'OCC_OCCUPIED' })],
    ['reservada', con({ occupancy: 'OCC_RESERVED' })],
    ['bloqueada', con({ availability: 'SPACE_OP_BLOCKED_CLINICAL' })],
    ['en mantenimiento', con({ availability: 'SPACE_OP_MAINTENANCE' })],
    ['cerrada', con({ availability: 'SPACE_OP_CLOSED' })],
    ['fuera de ciclo de vida activo', con({ lifecycleActive: false })],
  ])('%s: no', (_nombre, ejes) => {
    expect(isAssignable(ejes, NO_EXIGE)).toBe(false);
  });
  it('el aislamiento no la impide (la compatibilidad es de F3)', () => {
    expect(isAssignable(con({ isolation: 'ISO_CONTACT' }), EXIGE)).toBe(true);
  });
});
