import type { BedOpsView } from './bed-ops-view';
import {
  ageClassOf,
  evaluateCompatibility,
  splitViolations,
  DEFAULT_AGE_THRESHOLDS,
  type BedFacts,
  type CompatibilityConfig,
  type EncounterFacts,
  type PatientFacts,
  type RoomOccupant,
} from './bed-compatibility-rules';

const AT = new Date('2026-10-29T12:00:00Z');

const config: CompatibilityConfig = {
  ageThresholds: DEFAULT_AGE_THRESHOLDS,
  inspectionRequired: false,
  hvacValidationMaxDays: 365,
  levelsByBedFunction: {
    SPACE_FN_BED_STANDARD: ['LOC_CARE_GENERAL', 'LOC_CARE_INTERMEDIATE'],
    SPACE_FN_BED_ICU: ['LOC_CARE_ICU'],
  },
};

const readyOps = (
  over: Partial<{
    lifecycle: string;
    availability: string;
    hygiene: string;
    terminal: boolean;
    occupancy: 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';
    assignable: boolean;
  }> = {},
): BedOpsView => ({
  careSpaceId: 'bed-1',
  lifecycle: { code: over.lifecycle ?? 'SPACE_ACTIVE' },
  availability: { code: over.availability ?? 'SPACE_OP_AVAILABLE' },
  hygiene: {
    code: over.hygiene ?? 'HYG_CLEAN',
    terminalRequired: over.terminal ?? false,
  },
  isolation: { code: 'ISO_NONE' },
  occupancy: { code: over.occupancy ?? 'OCC_FREE' },
  v2Code: 'U',
  assignable: over.assignable ?? true,
});

const bed = (over: Partial<BedFacts> = {}): BedFacts => ({
  functionCode: 'SPACE_FN_BED_STANDARD',
  bed: { sexRestriction: null, ageGroup: null, pressure: null, hvacValidatedOn: null },
  room: { sexRestriction: null, ageGroup: null, pressure: null, hvacValidatedOn: null },
  roomOccupants: [],
  ops: readyOps(),
  occupancyWaived: false,
  ...over,
});

const man: PatientFacts = { gender: 'MALE', birthDate: '1980-05-10' };
const woman: PatientFacts = { gender: 'FEMALE', birthDate: '1985-03-02' };
const general: EncounterFacts = {
  levelOfCareCode: 'LOC_CARE_GENERAL',
  isolationCode: null,
  isolationOrganism: null,
};
const occupant = (over: Partial<RoomOccupant> = {}): RoomOccupant => ({
  encounterId: 'enc-other',
  gender: 'FEMALE',
  isolationCode: null,
  isolationOrganism: null,
  ...over,
});

const rules = (patient: PatientFacts, encounter: EncounterFacts, target: BedFacts) =>
  evaluateCompatibility(patient, encounter, target, config, AT).map((v) => v.rule);

describe('evaluateCompatibility', () => {
  it('una cama activa, disponible, libre y limpia es asignable y compatible', () => {
    expect(rules(man, general, bed())).toEqual([]);
  });

  describe('bloqueantes: nunca se fuerzan', () => {
    it.each([
      ['LIFECYCLE', readyOps({ lifecycle: 'SPACE_SUSPENDED' })],
      ['AVAILABILITY', readyOps({ availability: 'SPACE_OP_BLOCKED_CLINICAL' })],
      ['OCCUPANCY', readyOps({ occupancy: 'OCC_OCCUPIED', assignable: false })],
      ['HYGIENE', readyOps({ hygiene: 'HYG_DIRTY', assignable: false })],
      ['HYGIENE', readyOps({ terminal: true, assignable: false })],
    ] as const)('%s', (rule, ops) => {
      const found = evaluateCompatibility(man, general, bed({ ops }), config, AT);
      const hit = found.find((v) => v.rule === rule);
      expect(hit).toMatchObject({ rule, severity: 'BLOCKING' });
    });

    it('limpia sin inspección es asignable sólo si infra.inspection_required=false', () => {
      const clean = bed({ ops: readyOps({ hygiene: 'HYG_CLEAN' }) });
      expect(rules(man, general, clean)).toEqual([]);
      expect(
        evaluateCompatibility(man, general, clean, { ...config, inspectionRequired: true }, AT).map((v) => v.rule),
      ).toEqual(['HYGIENE']);
      expect(
        rules(man, general, bed({ ops: readyOps({ hygiene: 'HYG_INSPECTED' }) })),
      ).toEqual([]);
    });

    it('si los ejes están en orden pero la operación dice «no asignable», falla cerrado', () => {
      expect(rules(man, general, bed({ ops: readyOps({ assignable: false }) }))).toEqual(['HYGIENE']);
    });

    it('una reserva propia (o la ocupación del compañero de intercambio) no impide la colocación', () => {
      const reserved = readyOps({ occupancy: 'OCC_RESERVED', assignable: false });
      expect(rules(man, general, bed({ ops: reserved }))).toContain('OCCUPANCY');
      expect(rules(man, general, bed({ ops: reserved, occupancyWaived: true }))).toEqual([]);
    });

    it('aislamiento aéreo: sólo en un local con presión negativa y HVAC validado dentro de la vigencia', () => {
      const airborne: EncounterFacts = { ...general, isolationCode: 'ISO_AIRBORNE' };
      expect(rules(man, airborne, bed())).toContain('ISOLATION_AIRBORNE');
      const aiir = (validated: string | null, pressure = 'PRESSURE_NEGATIVE') =>
        bed({
          room: { sexRestriction: null, ageGroup: null, pressure, hvacValidatedOn: validated },
        });
      // La cama no declara presión: se mira la habitación.
      expect(rules(man, airborne, aiir('2026-09-01'))).not.toContain('ISOLATION_AIRBORNE');
      expect(rules(man, airborne, aiir('2024-01-01'))).toContain('ISOLATION_AIRBORNE');
      expect(rules(man, airborne, aiir(null))).toContain('ISOLATION_AIRBORNE');
      expect(rules(man, airborne, aiir('2026-09-01', 'PRESSURE_POSITIVE'))).toContain('ISOLATION_AIRBORNE');
      const violation = evaluateCompatibility(man, airborne, bed(), config, AT).find(
        (v) => v.rule === 'ISOLATION_AIRBORNE',
      );
      expect(violation?.severity).toBe('BLOCKING');
    });
  });

  describe('forzables', () => {
    it('SEX: varón en una habitación sólo para mujeres', () => {
      const target = bed({
        room: { sexRestriction: 'SEX_FEMALE', ageGroup: null, pressure: null, hvacValidatedOn: null },
      });
      const found = evaluateCompatibility(man, general, target, config, AT);
      expect(found).toEqual([
        expect.objectContaining({ rule: 'SEX', severity: 'OVERRIDABLE' }),
      ]);
      expect(rules(woman, general, target)).toEqual([]);
    });

    it('SEX: la cama también puede restringir', () => {
      const target = bed({
        bed: { sexRestriction: 'SEX_MALE', ageGroup: null, pressure: null, hvacValidatedOn: null },
      });
      expect(rules(woman, general, target)).toEqual(['SEX']);
      expect(rules(man, general, target)).toEqual([]);
    });

    it('SEX: sexo desconocido en un local restringido se trata como incompatible', () => {
      const target = bed({
        room: { sexRestriction: 'SEX_FEMALE', ageGroup: null, pressure: null, hvacValidatedOn: null },
      });
      expect(rules({ gender: 'UNKNOWN', birthDate: null }, general, target)).toEqual(['SEX']);
    });

    it('SEX: habitación compartida con una persona de distinto sexo (regla NHS)', () => {
      expect(rules(man, general, bed({ roomOccupants: [occupant({ gender: 'FEMALE' })] }))).toEqual(['SEX']);
      expect(rules(man, general, bed({ roomOccupants: [occupant({ gender: 'MALE' })] }))).toEqual([]);
      // Sin habitación no hay vecinos que mirar.
      expect(rules(man, general, bed({ room: null, roomOccupants: [occupant()] }))).toEqual([]);
    });

    it('AGE: el grupo de la cama o la habitación contra la edad del paciente', () => {
      const pediatric = bed({
        room: { sexRestriction: null, ageGroup: 'AGE_PEDIATRIC', pressure: null, hvacValidatedOn: null },
      });
      expect(rules(man, general, pediatric)).toEqual(['AGE']);
      expect(rules({ gender: 'FEMALE', birthDate: '2020-01-01' }, general, pediatric)).toEqual([]);
      expect(rules({ gender: 'FEMALE', birthDate: null }, general, pediatric)).toEqual(['AGE']);
      const any = bed({
        room: { sexRestriction: null, ageGroup: 'AGE_ANY', pressure: null, hvacValidatedOn: null },
      });
      expect(rules(man, general, any)).toEqual([]);
    });

    it('ISOLATION_COHORT: cualquier mezcla con un paciente aislado en la habitación', () => {
      const contact: EncounterFacts = { ...general, isolationCode: 'ISO_CONTACT', isolationOrganism: 'MRSA' };
      // el paciente aislado va con alguien sin precaución
      expect(rules(man, contact, bed({ roomOccupants: [occupant({ gender: 'MALE' })] }))).toEqual(['ISOLATION_COHORT']);
      // el paciente sin precaución va con alguien aislado
      expect(
        rules(man, general, bed({ roomOccupants: [occupant({ gender: 'MALE', isolationCode: 'ISO_CONTACT', isolationOrganism: 'MRSA' })] })),
      ).toEqual(['ISOLATION_COHORT']);
      // ambos aislados: sigue necesitando el aval
      expect(
        rules(man, contact, bed({ roomOccupants: [occupant({ gender: 'MALE', isolationCode: 'ISO_CONTACT', isolationOrganism: 'MRSA' })] })),
      ).toEqual(['ISOLATION_COHORT']);
      // ninguno aislado: nada
      expect(rules(man, general, bed({ roomOccupants: [occupant({ gender: 'MALE' })] }))).toEqual([]);
      // ISO_NONE cuenta como sin precaución
      expect(
        rules(man, { ...general, isolationCode: 'ISO_NONE' }, bed({ roomOccupants: [occupant({ gender: 'MALE', isolationCode: 'ISO_NONE' })] })),
      ).toEqual([]);
    });

    it('LEVEL_OF_CARE: el nivel del encuentro contra lo que admite la función de la cama', () => {
      const icuBed = bed({ functionCode: 'SPACE_FN_BED_ICU' });
      expect(rules(man, general, icuBed)).toEqual(['LEVEL_OF_CARE']);
      expect(rules(man, { ...general, levelOfCareCode: 'LOC_CARE_ICU' }, icuBed)).toEqual([]);
      expect(rules(man, { ...general, levelOfCareCode: 'LOC_CARE_ICU' }, bed())).toEqual(['LEVEL_OF_CARE']);
      // función sin entrada en la tabla: no restringe
      expect(rules(man, general, bed({ functionCode: 'SPACE_TYPE_ROOM' }))).toEqual([]);
      // sin nivel declarado no hay contra qué comparar
      expect(rules(man, { ...general, levelOfCareCode: null }, bed({ functionCode: 'SPACE_FN_BED_ICU' }))).toEqual([]);
    });

    it('devuelve todas las incompatibilidades juntas, bloqueantes primero en su propia categoría', () => {
      const target = bed({
        functionCode: 'SPACE_FN_BED_ICU',
        room: { sexRestriction: 'SEX_FEMALE', ageGroup: null, pressure: null, hvacValidatedOn: null },
        ops: readyOps({ hygiene: 'HYG_DIRTY', assignable: false }),
      });
      const found = evaluateCompatibility(man, general, target, config, AT);
      const { blocking, overridable } = splitViolations(found);
      expect(blocking.map((v) => v.rule)).toEqual(['HYGIENE']);
      expect(overridable.map((v) => v.rule).sort()).toEqual(['LEVEL_OF_CARE', 'SEX']);
    });
  });
});

describe('ageClassOf', () => {
  const t = DEFAULT_AGE_THRESHOLDS;
  it('neonato < 28 días, pediátrico < 15 años, adulto después', () => {
    expect(ageClassOf('2026-10-10', AT, t)).toBe('AGE_NEONATAL');
    expect(ageClassOf('2026-10-01', AT, t)).toBe('AGE_PEDIATRIC'); // 28 días exactos ya no es neonato
    expect(ageClassOf('2012-10-30', AT, t)).toBe('AGE_PEDIATRIC'); // 13 años y 364 días
    expect(ageClassOf('2011-10-30', AT, t)).toBe('AGE_PEDIATRIC'); // 14 años y 364 días
    expect(ageClassOf('2011-10-29', AT, t)).toBe('AGE_ADULT'); // 15 años exactos: «< 15» ya no
    expect(ageClassOf('2011-10-28', AT, t)).toBe('AGE_ADULT');
    expect(ageClassOf(null, AT, t)).toBeNull();
  });

  it('respeta los umbrales configurados', () => {
    expect(ageClassOf('2020-01-01', AT, { pediatricMaxYears: 5, neonatalMaxDays: 28 })).toBe('AGE_ADULT');
    expect(ageClassOf('2026-10-10', AT, { pediatricMaxYears: 15, neonatalMaxDays: 10 })).toBe('AGE_PEDIATRIC');
  });
});
