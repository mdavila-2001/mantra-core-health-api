import {
  FORMS,
  FUNCTIONS,
  PARENT_RULE_SEEDS,
  TYPOLOGY_RULE_SEEDS,
  REGULATORY,
} from '../infrastructure-catalog';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  MAX_BATCH_SIZE,
  PatternError,
  allowedFunctions,
  canBeRoot,
  checkFunctionProfile,
  checkParentRule,
  checkTypology,
  expandBulkPattern,
  missingForActivation,
  resolveAttributes,
  resolveShape,
  type RuleSet,
} from './infrastructure-rules';

/** Las reglas tal como las dejaría el seed en la base. */
function ruleSet(): RuleSet {
  const parentChildren = new Map<string, Set<string>>();
  for (const rule of PARENT_RULE_SEEDS) {
    parentChildren.set(
      FORMS.byInput(rule.parent)!.id,
      new Set(rule.children.map((c) => FORMS.byInput(c)!.id)),
    );
  }
  const typologyAllowed = new Map<string, Set<string>>();
  const typologyRequired = new Map<string, Set<string>>();
  for (const row of TYPOLOGY_RULE_SEEDS) {
    const target =
      row.rule === 'TYPO_ALLOWED' ? typologyAllowed : typologyRequired;
    const typologyId = REGULATORY.typology.byInput(row.typology)!.id;
    target.set(
      typologyId,
      (target.get(typologyId) ?? new Set()).add(FUNCTIONS.byInput(row.fn)!.id),
    );
  }
  return { parentChildren, typologyAllowed, typologyRequired };
}

const shape = (form: string, fn: string, parentForm: string | null) => ({
  form: FORMS.byInput(form)!,
  fn: FUNCTIONS.byInput(fn)!,
  parentFormId: parentForm ? FORMS.byInput(parentForm)!.id : null,
});

describe('expandBulkPattern', () => {
  it('301-{A..H} da 8 códigos y los nombres siguen el rango', () => {
    const items = expandBulkPattern('301-{A..H}', 'Cama 301-{A..H}');
    expect(items).toHaveLength(8);
    expect(items[0]).toEqual({ code: '301-A', name: 'Cama 301-A' });
    expect(items[7]).toEqual({ code: '301-H', name: 'Cama 301-H' });
  });

  it('CAMA-{1..12} da 12 y los marcadores {code}, {n} e {i} se reemplazan', () => {
    const items = expandBulkPattern(
      'CAMA-{1..12}',
      'Cama {i} ({code}) valor {n}',
    );
    expect(items).toHaveLength(12);
    expect(items[11]).toEqual({
      code: 'CAMA-12',
      name: 'Cama 12 (CAMA-12) valor 12',
    });
  });

  it('un cero a la izquierda conserva el ancho', () => {
    const items = expandBulkPattern('C-{01..03}', 'c {n}');
    expect(items.map((i) => i.code)).toEqual(['C-01', 'C-02', 'C-03']);
  });

  it('rechaza lo que no es un único rango válido o supera el máximo', () => {
    const casos: Array<[string, string]> = [
      ['SIN-RANGO', 'x'],
      ['A-{1..3}-{A..C}', 'x'],
      ['A-{5..1}', 'x'],
      ['A-{1..201}', 'x'],
      ['A-{AA..CC}', 'x'],
      ['A-{1..3}', 'N-{1..4}'],
    ];
    for (const [code, name] of casos) {
      expect(() => expandBulkPattern(code, name)).toThrow(PatternError);
    }
    expect(MAX_BATCH_SIZE).toBe(200);
    expect(expandBulkPattern('X-{1..200}', 'x')).toHaveLength(200);
  });
});

describe('reglas de forma, función y tipología', () => {
  const rules = ruleSet();

  it('INV-04: una cama cuelga de local, sala o área; no de un piso; sin padre sólo edificio, área, local y virtual', () => {
    expect(
      checkParentRule(rules, shape('BED', 'SPACE_FN_BED_STANDARD', 'ROOM')),
    ).toBeNull();
    expect(
      checkParentRule(rules, shape('BED', 'SPACE_FN_BED_STANDARD', 'WARD')),
    ).toBeNull();
    expect(
      checkParentRule(rules, shape('BED', 'SPACE_FN_BED_STANDARD', 'AREA')),
    ).toBeNull();
    expect(
      checkParentRule(rules, shape('BED', 'SPACE_FN_BED_STANDARD', 'LEVEL'))
        ?.reason,
    ).toBe(PracticeErrorReason.SPACE_PARENT_RULE);
    expect(
      checkParentRule(rules, shape('LEVEL', 'SPACE_FN_LEVEL_GENERIC', null))
        ?.reason,
    ).toBe(PracticeErrorReason.SPACE_PARENT_RULE);
    for (const raiz of ['BUILDING', 'AREA', 'ROOM', 'VIRTUAL']) {
      expect(canBeRoot(FORMS.byInput(raiz)!)).toBe(true);
      expect(
        checkParentRule(rules, shape(raiz, 'SPACE_TYPE_ROOM', null)),
      ).toBeNull();
    }
    expect(canBeRoot(FORMS.byInput('BED')!)).toBe(false);
  });

  it('una tabla de reglas vacía no deja pasar nada (fail-closed)', () => {
    const vacia: RuleSet = {
      parentChildren: new Map(),
      typologyAllowed: new Map(),
      typologyRequired: new Map(),
    };
    expect(
      checkParentRule(vacia, shape('ROOM', 'SPACE_TYPE_ROOM', 'LEVEL'))?.reason,
    ).toBe(PracticeErrorReason.SPACE_PARENT_RULE);
  });

  it('INV-05: el quirófano sólo es un local', () => {
    expect(
      checkFunctionProfile(shape('ROOM', 'SPACE_FN_OPERATING_ROOM', 'LEVEL')),
    ).toBeNull();
    expect(
      checkFunctionProfile(shape('BED', 'SPACE_FN_OPERATING_ROOM', 'ROOM'))
        ?.reason,
    ).toBe(PracticeErrorReason.SPACE_FUNCTION_FORM_MISMATCH);
    expect(
      checkFunctionProfile(shape('AREA', 'SPACE_FN_BED_ICU', 'LEVEL'))?.reason,
    ).toBe(PracticeErrorReason.SPACE_FUNCTION_FORM_MISMATCH);
  });

  it('INV-06: el Puesto de Salud no admite quirófano ni camas; el hospital no restringe; sin tipología no se mira', () => {
    const puesto = REGULATORY.typology.byInput('TYPOLOGY_HEALTH_POST')!.id;
    const hospital = REGULATORY.typology.byInput('TYPOLOGY_HOSPITAL_L2')!.id;
    const quirofano = FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!;
    const consultorio = FUNCTIONS.byInput('SPACE_FN_CONSULTING_ROOM')!;
    expect(checkTypology(rules, puesto, quirofano)?.reason).toBe(
      PracticeErrorReason.TYPOLOGY_NOT_ALLOWED,
    );
    expect(
      checkTypology(rules, puesto, FUNCTIONS.byInput('SPACE_FN_BED_STANDARD')!)
        ?.reason,
    ).toBe(PracticeErrorReason.TYPOLOGY_NOT_ALLOWED);
    expect(checkTypology(rules, puesto, consultorio)).toBeNull();
    expect(
      checkTypology(rules, puesto, FUNCTIONS.byInput('GENERIC')!),
    ).toBeNull();
    expect(checkTypology(rules, hospital, quirofano)).toBeNull();
    expect(checkTypology(rules, undefined, quirofano)).toBeNull();
    expect(allowedFunctions(rules, hospital)).toBeNull();
    expect(allowedFunctions(rules, puesto)?.has(quirofano.id)).toBe(false);
  });
});

describe('resolveShape / resolveAttributes', () => {
  it('por omisión es un local genérico; acepta el código completo y el corto', () => {
    const porOmision = resolveShape(undefined, undefined);
    expect(porOmision.form?.code).toBe('LOC_FORM_ROOM');
    expect(porOmision.fn?.code).toBe('SPACE_TYPE_ROOM');
    expect(resolveShape('bed', 'BED_ICU').fn?.code).toBe('SPACE_FN_BED_ICU');
    const mal = resolveShape('LOC_FORM_X', 'SPACE_FN_X');
    expect(mal.errors.map((e) => e.field)).toEqual([
      'formCode',
      'functionCode',
    ]);
  });

  it('valida catálogos, rangos y formatos y resuelve ids', () => {
    const ok = resolveAttributes({
      asepsisCode: 'ASEPSIS_RESTRICTED',
      pressureCode: 'negative',
      areaM2: 12.5,
      airChangesPerHour: 12,
      gln: '7790001234567',
      hvacValidatedOn: '2026-10-01',
      censable: true,
    });
    expect(ok.errors).toEqual([]);
    expect(ok.resolved.asepsisConceptId).toBeTruthy();
    expect(ok.resolved.pressureConceptId).toBeTruthy();

    const mal = resolveAttributes({
      asepsisCode: 'NO',
      areaM2: -1,
      floorNumber: 1.5,
      gln: '123',
      hvacValidatedOn: '01/10/2026',
      prepMinutes: 5000,
      censable: 'sí' as unknown as boolean,
    });
    expect(mal.errors.map((e) => e.field).sort()).toEqual(
      [
        'areaM2',
        'asepsisCode',
        'censable',
        'floorNumber',
        'gln',
        'hvacValidatedOn',
        'prepMinutes',
      ].sort(),
    );
  });

  it('null limpia el atributo (PATCH)', () => {
    const r = resolveAttributes({ asepsisCode: null, bedCategoryCode: null });
    expect(r.resolved).toEqual({
      asepsisConceptId: null,
      bedCategoryConceptId: null,
    });
  });
});

describe('missingForActivation (precondición 4 de procesos/02)', () => {
  const quirofano = FUNCTIONS.byInput('SPACE_FN_OPERATING_ROOM')!;
  const room = FORMS.byInput('ROOM')!;

  it('un quirófano pide área, presión, ACH y validación HVAC', () => {
    const faltan = missingForActivation({ fn: quirofano, form: room });
    expect(faltan.map((f) => f.field).sort()).toEqual([
      'airChangesPerHour',
      'areaM2',
      'hvacValidatedOn',
      'pressureCode',
    ]);
    expect(new Set(faltan.map((f) => String(f.reason)))).toEqual(
      new Set([String(PracticeErrorReason.SPACE_PROFILE_INCOMPLETE)]),
    );
    expect(
      missingForActivation({
        fn: quirofano,
        form: room,
        areaM2: '36.00',
        pressureConceptId: 'p',
        airChangesPerHour: '20.00',
        hvacValidatedOn: new Date(),
      }),
    ).toEqual([]);
  });

  it('una cama pide categoría y si es censable (false vale)', () => {
    const cama = FUNCTIONS.byInput('SPACE_FN_BED_STANDARD')!;
    const bed = FORMS.byInput('BED')!;
    expect(
      missingForActivation({ fn: cama, form: bed }).map((f) => f.field),
    ).toEqual(['bedCategoryCode', 'censable']);
    expect(
      missingForActivation({
        fn: cama,
        form: bed,
        bedCategoryConceptId: 'c',
        censable: false,
      }),
    ).toEqual([]);
  });

  it('una función sin exigencias no pide nada', () => {
    expect(
      missingForActivation({ fn: FUNCTIONS.byInput('GENERIC')!, form: room }),
    ).toEqual([]);
  });
});
