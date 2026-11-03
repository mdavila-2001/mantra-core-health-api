import { describe, expect, it } from '@jest/globals';
import {
  FUNCTION_PROFILES,
  PARENT_RULE_SEED,
  PRACTICE_CONCEPT_BY_CODE,
  TYPOLOGY_RULE_SEED,
  conceptIdOf,
} from './structure-catalog';
import {
  descendantsOf,
  judgeFunctionForm,
  judgeNoCycle,
  judgeParentChild,
  judgeTypology,
  missingRequiredFunctions,
} from './structure-rules';
import { judgeParentAllows, judgeTransition } from './lifecycle';
import { BULK_MAX, expandPattern } from './code-pattern';
import {
  capacityGaps,
  deriveCapacity,
  effectiveLicenseStatus,
} from './capacity';

describe('catálogo de infraestructura (contrato §2)', () => {
  it('cada código usado por perfiles y reglas existe como concepto de practice', () => {
    const codes = [
      ...FUNCTION_PROFILES.flatMap((p) => [p.code, ...p.forms]),
      ...PARENT_RULE_SEED.flatMap((r) => [r.parent, r.child]),
      ...TYPOLOGY_RULE_SEED.flatMap((r) => [r.typology, r.function, r.rule]),
    ];
    const missing = codes.filter((c) => !PRACTICE_CONCEPT_BY_CODE.has(c));
    expect(missing).toEqual([]);
  });

  it('las 29 funciones SPACE_FN_* del contrato más GENERIC tienen perfil', () => {
    expect(
      FUNCTION_PROFILES.filter((p) => p.code.startsWith('SPACE_FN_')),
    ).toHaveLength(29);
    expect(FUNCTION_PROFILES.find((p) => p.key === 'GENERIC')?.code).toBe(
      'SPACE_TYPE_ROOM',
    );
  });

  it('un código de otro grupo no se acepta (fail-closed por prefijo)', () => {
    expect(conceptIdOf('LOC_FORM_ROOM', 'PRESSURE_')).toBeUndefined();
    expect(conceptIdOf('PRESSURE_NEGATIVE', 'PRESSURE_')).toBeDefined();
    expect(conceptIdOf('NO_EXISTE', 'PRESSURE_')).toBeUndefined();
  });
});

describe('regla padre→hijo', () => {
  it('cama bajo local: permitido', () => {
    expect(
      judgeParentChild('LOC_FORM_ROOM', 'LOC_FORM_BED', PARENT_RULE_SEED).ok,
    ).toBe(true);
  });
  it('piso bajo cama: rechazado con las formas permitidas', () => {
    const v = judgeParentChild(
      'LOC_FORM_BED',
      'LOC_FORM_LEVEL',
      PARENT_RULE_SEED,
    );
    expect(v).toMatchObject({
      ok: false,
      reason: 'SPACE_PARENT_RULE',
    });
  });
  it('raíz: edificio, área, local y virtual sí; cama no', () => {
    for (const f of [
      'LOC_FORM_BUILDING',
      'LOC_FORM_AREA',
      'LOC_FORM_ROOM',
      'LOC_FORM_VIRTUAL',
    ] as const) {
      expect(judgeParentChild(null, f, PARENT_RULE_SEED).ok).toBe(true);
    }
    expect(judgeParentChild(null, 'LOC_FORM_BED', PARENT_RULE_SEED).ok).toBe(
      false,
    );
  });
  it('sin reglas en la base, todo hijo se rechaza (fail-closed)', () => {
    expect(judgeParentChild('LOC_FORM_ROOM', 'LOC_FORM_BED', []).ok).toBe(
      false,
    );
  });
});

describe('perfil de función', () => {
  it('quirófano sólo como local', () => {
    expect(
      judgeFunctionForm('SPACE_FN_OPERATING_ROOM', 'LOC_FORM_ROOM').ok,
    ).toBe(true);
    expect(
      judgeFunctionForm('SPACE_FN_OPERATING_ROOM', 'LOC_FORM_BED'),
    ).toMatchObject({
      ok: false,
      reason: 'FUNCTION_FORM_MISMATCH',
    });
  });
  it('función desconocida: SPACE_UNKNOWN_CODE', () => {
    expect(judgeFunctionForm('SPACE_FN_NOPE', 'LOC_FORM_ROOM')).toMatchObject({
      reason: 'SPACE_UNKNOWN_CODE',
    });
  });
});

describe('regla de tipología', () => {
  it('Puesto de Salud no admite quirófano; sí consultorio', () => {
    expect(
      judgeTypology(
        'TYPOLOGY_HEALTH_POST',
        'SPACE_FN_OPERATING_ROOM',
        TYPOLOGY_RULE_SEED,
      ),
    ).toMatchObject({
      ok: false,
      reason: 'TYPOLOGY_NOT_ALLOWED',
    });
    expect(
      judgeTypology(
        'TYPOLOGY_HEALTH_POST',
        'SPACE_FN_CONSULTING_ROOM',
        TYPOLOGY_RULE_SEED,
      ).ok,
    ).toBe(true);
  });
  it('Centro de Salud ambulatorio no admite camas', () => {
    expect(
      judgeTypology(
        'TYPOLOGY_HC_AMBULATORY',
        'SPACE_FN_BED_STANDARD',
        TYPOLOGY_RULE_SEED,
      ).ok,
    ).toBe(false);
  });
  it('sin tipología declarada no se aplica regla', () => {
    expect(
      judgeTypology(null, 'SPACE_FN_OPERATING_ROOM', TYPOLOGY_RULE_SEED).ok,
    ).toBe(true);
  });
  it('con ALLOWED, la tipología actúa como lista blanca', () => {
    const rules = [
      {
        typology: 'T',
        function: 'SPACE_FN_WAITING',
        rule: 'TYPO_ALLOWED' as const,
      },
    ];
    expect(judgeTypology('T', 'SPACE_FN_WAITING', rules).ok).toBe(true);
    expect(judgeTypology('T', 'SPACE_FN_OPERATING_ROOM', rules).ok).toBe(false);
  });
  it('Hospital L2: faltan las obligatorias que no estén', () => {
    expect(
      missingRequiredFunctions(
        'TYPOLOGY_HOSPITAL_L2',
        new Set(['SPACE_FN_OPERATING_ROOM']),
        TYPOLOGY_RULE_SEED,
      ).sort(),
    ).toEqual(['SPACE_FN_EMERGENCY_BOX', 'SPACE_FN_INPATIENT_ROOM']);
  });
});

describe('anti-ciclo', () => {
  const parentOf = new Map<string, string | null>([
    ['A', null],
    ['B', 'A'],
    ['C', 'B'],
  ]);
  it('mover A bajo C cierra un ciclo', () => {
    expect(judgeNoCycle('A', 'C', parentOf)).toMatchObject({
      ok: false,
      reason: 'SPACE_CYCLE',
    });
  });
  it('mover un nodo bajo sí mismo es ciclo', () => {
    expect(judgeNoCycle('B', 'B', parentOf).ok).toBe(false);
  });
  it('mover C a la raíz o bajo A no', () => {
    expect(judgeNoCycle('C', null, parentOf).ok).toBe(true);
    expect(judgeNoCycle('C', 'A', parentOf).ok).toBe(true);
  });
  it('un ciclo ya existente en la base no cuelga el recorrido', () => {
    const broken = new Map<string, string | null>([
      ['X', 'Y'],
      ['Y', 'X'],
      ['Z', null],
    ]);
    expect(judgeNoCycle('Z', 'X', broken).ok).toBe(true);
  });
  it('descendientes', () => {
    expect(
      descendantsOf(
        'A',
        new Map([
          ['A', ['B']],
          ['B', ['C']],
        ]),
      ).sort(),
    ).toEqual(['B', 'C']);
  });
});

describe('ciclo de vida', () => {
  it('planificado → activo; retirado no vuelve', () => {
    expect(judgeTransition('PLANNED', 'activate', undefined)).toMatchObject({
      ok: true,
      to: 'ACTIVE',
    });
    expect(judgeTransition('RETIRED', 'reactivate', 'x')).toMatchObject({
      ok: false,
      reason: 'SPACE_INVALID_TRANSITION',
    });
  });
  it('suspender y retirar exigen motivo', () => {
    expect(judgeTransition('ACTIVE', 'suspend', '  ')).toMatchObject({
      ok: false,
      reason: 'LIFECYCLE_REASON_REQUIRED',
    });
    expect(judgeTransition('ACTIVE', 'retire', undefined)).toMatchObject({
      ok: false,
      reason: 'LIFECYCLE_REASON_REQUIRED',
    });
    expect(judgeTransition('ACTIVE', 'retire', 'demolición')).toMatchObject({
      ok: true,
      to: 'RETIRED',
    });
  });
  it('hijo activo bajo padre no activo: PARENT_NOT_ACTIVE', () => {
    expect(judgeParentAllows('ACTIVE', 'PLANNED')).toMatchObject({
      ok: false,
      reason: 'PARENT_NOT_ACTIVE',
    });
    expect(judgeParentAllows('ACTIVE', 'ACTIVE').ok).toBe(true);
    expect(judgeParentAllows('PLANNED', 'PLANNED').ok).toBe(true);
    expect(judgeParentAllows('PLANNED', 'RETIRED').ok).toBe(false);
    expect(judgeParentAllows('SUSPENDED', 'PLANNED').ok).toBe(false);
  });
});

describe('patrón de alta masiva', () => {
  it('letras y números, con nombre por el mismo rango o {}', () => {
    const letters = expandPattern('301-{A..C}', 'Cama 301-{A..C}');
    expect(letters).toMatchObject({ ok: true });
    if (letters.ok) {
      expect(letters.items.map((i) => i.code)).toEqual([
        '301-A',
        '301-B',
        '301-C',
      ]);
      expect(letters.items[2].name).toBe('Cama 301-C');
    }
    const nums = expandPattern('CAMA-{01..03}', 'Cama {}');
    if (!nums.ok) throw new Error('debía expandir');
    expect(nums.items.map((i) => i.code)).toEqual([
      'CAMA-01',
      'CAMA-02',
      'CAMA-03',
    ]);
    expect(nums.items[0].name).toBe('Cama 01');
  });
  it('sin rango, con dos rangos o al revés: BULK_PATTERN_INVALID', () => {
    expect(expandPattern('CAMA', 'x')).toMatchObject({
      ok: false,
      reason: 'BULK_PATTERN_INVALID',
    });
    expect(expandPattern('{A..B}-{1..2}', 'x')).toMatchObject({
      ok: false,
      reason: 'BULK_PATTERN_INVALID',
    });
    expect(expandPattern('C-{9..1}', 'x')).toMatchObject({
      ok: false,
      reason: 'BULK_PATTERN_INVALID',
    });
  });
  it(`más de ${BULK_MAX}: BULK_LIMIT_EXCEEDED`, () => {
    expect(expandPattern('C-{1..201}', 'x')).toMatchObject({
      ok: false,
      reason: 'BULK_LIMIT_EXCEEDED',
    });
    expect(expandPattern('C-{1..200}', 'x').ok).toBe(true);
  });
});

describe('capacidad y habilitaciones', () => {
  it('derivada cuenta sólo activos; brechas sólo de lo declarado', () => {
    const derived = deriveCapacity([
      {
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        active: true,
        censable: true,
      },
      {
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        active: false,
        censable: true,
      },
      {
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_STRETCHER',
        active: true,
        censable: false,
      },
      {
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
        active: true,
        censable: null,
      },
    ]);
    const by = Object.fromEntries(derived.map((d) => [d.kindCode, d.quantity]));
    expect(by).toMatchObject({
      CAP_BEDS_CENSABLE: 1,
      CAP_BEDS_NON_CENSABLE: 1,
      CAP_OPERATING_ROOMS: 1,
    });
    expect(
      capacityGaps(
        [
          { kindCode: 'CAP_BEDS_CENSABLE', quantity: 10 },
          { kindCode: 'CAP_OPERATING_ROOMS', quantity: 1 },
        ],
        derived,
      ),
    ).toEqual([{ kindCode: 'CAP_BEDS_CENSABLE', declared: 10, derived: 1 }]);
  });
  it('vigente con vencimiento pasado se lee vencida', () => {
    expect(
      effectiveLicenseStatus('LIC_VALID', '2026-01-01', '2026-10-30'),
    ).toBe('LIC_EXPIRED');
    expect(
      effectiveLicenseStatus('LIC_VALID', '2026-12-31', '2026-10-30'),
    ).toBe('LIC_VALID');
    expect(
      effectiveLicenseStatus('LIC_IN_PROCESS', '2026-01-01', '2026-10-30'),
    ).toBe('LIC_IN_PROCESS');
  });
});
