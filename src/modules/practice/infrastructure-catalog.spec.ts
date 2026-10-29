import {
  ConceptFamily,
  FORMS,
  FORM_KEYS,
  FUNCTIONS,
  FUNCTION_CODES,
  FUNCTION_PROFILES,
  PARENT_RULE_SEEDS,
  REGULATORY,
  ROOT_FORMS,
  SPACE_TRANSITIONS,
  TYPOLOGY_RULE_SEEDS,
  TYPOLOGY_SOURCES,
  UNIT_TRANSITIONS,
  practiceConcept,
} from './infrastructure-catalog';
import { PRACTICE_CONCEPT_SEEDS, PRAC } from './practice.concepts';

describe('infrastructure-catalog · integridad de los datos del contrato', () => {
  it('cada código de concepto y cada id son únicos', () => {
    const codes = PRACTICE_CONCEPT_SEEDS.map((seed) => seed.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(Object.values(PRAC)).size).toBe(Object.values(PRAC).length);
  });

  it('las 10 formas, las 29 funciones nuevas y la genérica existen como conceptos con display', () => {
    expect(FORM_KEYS).toHaveLength(10);
    for (const key of FORM_KEYS) {
      expect(practiceConcept(`LOC_FORM_${key}`).display).not.toMatch(
        /^LOC_FORM_/,
      );
    }
    expect(
      FUNCTION_CODES.filter((c) => c.startsWith('SPACE_FN_')),
    ).toHaveLength(29);
    expect(FUNCTION_CODES).toContain('SPACE_TYPE_ROOM');
    for (const code of FUNCTION_CODES) {
      const entry = practiceConcept(code);
      expect(entry.id).toBe(PRAC[code as keyof typeof PRAC]);
      expect(entry.display.length).toBeGreaterThan(0);
    }
  });

  it('el perfil de cada función sólo nombra formas del catálogo y trae las diez banderas', () => {
    const banderas = [
      'schedulable',
      'inpatient',
      'billable',
      'allowOverlap',
      'isolationCapable',
      'stockPoint',
      'hostsEquipment',
      'requiresTerminalCleaning',
      'requiresArea',
      'requiresHvac',
    ];
    for (const code of FUNCTION_CODES) {
      const profile = FUNCTION_PROFILES[code];
      expect(profile.forms.length).toBeGreaterThan(0);
      for (const form of profile.forms) expect(FORM_KEYS).toContain(form);
      for (const flag of banderas) {
        expect(typeof (profile as Record<string, unknown>)[flag]).toBe(
          'boolean',
        );
      }
    }
    // Lo que el contrato dice de forma explícita.
    expect(FUNCTION_PROFILES.SPACE_FN_OPERATING_ROOM.forms).toEqual(['ROOM']);
    expect(FUNCTION_PROFILES.SPACE_FN_ISOLATION_AIIR.requiresHvac).toBe(true);
    expect(FUNCTION_PROFILES.SPACE_FN_BED_STANDARD.forms).toEqual(['BED']);
    expect(FUNCTION_PROFILES.SPACE_TYPE_ROOM.forms).toHaveLength(10);
  });

  it('las reglas padre→hijo semilla son exactamente las del contrato §2', () => {
    const pares = PARENT_RULE_SEEDS.flatMap((r) =>
      r.children.map((c) => `${r.parent}>${c}`),
    ).sort();
    expect(pares).toEqual(
      [
        'SITE>BUILDING',
        'SITE>AREA',
        'BUILDING>WING',
        'BUILDING>LEVEL',
        'BUILDING>AREA',
        'BUILDING>ROOM',
        'WING>LEVEL',
        'WING>WARD',
        'WING>AREA',
        'WING>ROOM',
        'LEVEL>WARD',
        'LEVEL>AREA',
        'LEVEL>ROOM',
        'LEVEL>CORRIDOR',
        'WARD>ROOM',
        'WARD>BED',
        'AREA>ROOM',
        'AREA>BED',
        'AREA>AREA',
        'ROOM>BED',
        'CORRIDOR>ROOM',
      ].sort(),
    );
    expect(ROOT_FORMS).toEqual(['BUILDING', 'AREA', 'ROOM', 'VIRTUAL']);
  });

  it('las reglas de tipología semilla cumplen el contrato y traen su norma de origen', () => {
    const permitidas = (t: string) =>
      TYPOLOGY_RULE_SEEDS.filter(
        (r) => r.typology === t && r.rule === 'TYPO_ALLOWED',
      ).map((r) => r.fn);
    const exigidas = (t: string) =>
      TYPOLOGY_RULE_SEEDS.filter(
        (r) => r.typology === t && r.rule === 'TYPO_REQUIRED',
      ).map((r) => r.fn);

    const puesto = permitidas('TYPOLOGY_HEALTH_POST');
    for (const prohibida of [
      'SPACE_FN_OPERATING_ROOM',
      'SPACE_FN_ICU_BAY',
      'SPACE_FN_INPATIENT_ROOM',
      'SPACE_FN_BED_STANDARD',
      'SPACE_FN_BED_ICU',
      'SPACE_FN_CRIB',
      'SPACE_FN_STRETCHER',
    ])
      expect(puesto).not.toContain(prohibida);
    expect(puesto).toEqual(
      expect.arrayContaining([
        'SPACE_FN_CONSULTING_ROOM',
        'SPACE_TYPE_ROOM',
        'SPACE_FN_WAITING',
      ]),
    );

    const ambulatorio = permitidas('TYPOLOGY_HC_AMBULATORY');
    for (const prohibida of [
      'SPACE_FN_INPATIENT_ROOM',
      'SPACE_FN_BED_STANDARD',
      'SPACE_FN_OPERATING_ROOM',
    ]) {
      expect(ambulatorio).not.toContain(prohibida);
    }
    // El centro ambulatorio sí admite UTI según el contrato (sólo se prohíben los tres grupos nombrados).
    expect(ambulatorio).toContain('SPACE_FN_ICU_BAY');

    for (const hospital of ['TYPOLOGY_HOSPITAL_L2', 'TYPOLOGY_HOSPITAL_L3']) {
      expect(exigidas(hospital).sort()).toEqual([
        'SPACE_FN_EMERGENCY_BOX',
        'SPACE_FN_INPATIENT_ROOM',
        'SPACE_FN_OPERATING_ROOM',
      ]);
      // Los hospitales no restringen: sólo exigen.
      expect(permitidas(hospital)).toEqual([]);
    }
    for (const regla of TYPOLOGY_RULE_SEEDS) {
      expect(TYPOLOGY_SOURCES[regla.typology]).toBe(regla.source);
      expect(regla.source.length).toBeGreaterThan(0);
    }
  });

  it('las transiciones de ciclo de vida son las de procesos/02 y exigen motivo en suspender y clausurar', () => {
    for (const table of [SPACE_TRANSITIONS, UNIT_TRANSITIONS]) {
      expect(table.activate.from).toHaveLength(1);
      expect(table.suspend.requiresReason).toBe(true);
      expect(table.retire.requiresReason).toBe(true);
      expect(table.activate.requiresReason).toBe(false);
      expect(table.reactivate.requiresReason).toBe(false);
      expect(table.retire.from).toHaveLength(3);
    }
    expect(SPACE_TRANSITIONS.retire.to).toBe(PRAC.SPACE_RETIRED);
    expect(SPACE_TRANSITIONS.retire.from).not.toContain(PRAC.SPACE_RETIRED);
  });
});

describe('ConceptFamily', () => {
  it('acepta el código completo, el corto y el alias, y siempre devuelve el completo', () => {
    expect(FORMS.byInput('LOC_FORM_BED')?.code).toBe('LOC_FORM_BED');
    expect(FORMS.byInput('bed')?.code).toBe('LOC_FORM_BED');
    expect(FUNCTIONS.byInput('OPERATING_ROOM')?.code).toBe(
      'SPACE_FN_OPERATING_ROOM',
    );
    expect(FUNCTIONS.byInput('GENERIC')?.code).toBe('SPACE_TYPE_ROOM');
    expect(REGULATORY.typology.byInput('TYPOLOGY_HEALTH_POST')?.code).toBe(
      'TYPOLOGY_HEALTH_POST',
    );
    expect(REGULATORY.capacityKind.byInput('beds_censable')?.code).toBe(
      'CAP_BEDS_CENSABLE',
    );
  });

  it('un código ajeno a la familia, vacío o nulo no resuelve', () => {
    expect(FORMS.byInput('SPACE_FN_OPERATING_ROOM')).toBeUndefined();
    expect(FORMS.byInput('')).toBeUndefined();
    expect(FORMS.byInput(null)).toBeUndefined();
    expect(FORMS.byConceptId('no-es-un-id')).toBeUndefined();
  });

  it('resuelve por id de concepto', () => {
    const room = FORMS.byInput('ROOM')!;
    expect(FORMS.byConceptId(room.id)).toEqual(room);
  });

  it('una familia con un código desconocido falla al construirse (no se siembra un concepto que no existe)', () => {
    expect(() => new ConceptFamily('X_', ['X_NO_EXISTE'])).toThrow(
      /desconocido/,
    );
  });
});
