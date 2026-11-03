import modelSpecialties from './model-specialties.json';
import rules from './rules.json';

/**
 * Coherencia de las reglas de evidencia especialidad → servicio.
 *
 * El importador (`tools/terminology-import/specialty-services/`) sólo relaciona
 * un servicio con una especialidad cuando una de estas reglas lo respalda; si
 * una regla apunta a un código que el modelo no declara, la relación quedaría
 * colgando de nada. Por eso cada código nombrado acá se coteja con la foto de
 * `VS_MEDICAL_SPECIALTY` que viene del paquete del modelo.
 */

interface Rule {
  readonly specialty: string | null;
  readonly match?: string;
  readonly note?: string;
}

/** Las entradas reales de un mapa (las claves `_…` son documentación). */
function realEntries(map: Record<string, unknown>): [string, Rule][] {
  return Object.entries(map).filter(([key]) => !key.startsWith('_')) as [
    string,
    Rule,
  ][];
}

const MODEL_CODES = new Set(modelSpecialties.specialties.map((s) => s.code));

const RULE_MAPS: Record<string, Record<string, unknown>> = {
  boArancelHeadings: rules.boArancelHeadings,
  boDentalSections: rules.boDentalSections,
  fonasaGroups: rules.fonasaGroups,
  phrases: rules.performer.phrases,
};

describe('reglas de servicios por especialidad', () => {
  it('la foto del modelo trae las 63 especialidades, sin códigos repetidos', () => {
    expect(modelSpecialties.specialties).toHaveLength(63);
    expect(MODEL_CODES.size).toBe(63);
  });

  it.each(Object.keys(RULE_MAPS))(
    '%s: cada especialidad nombrada existe en VS_MEDICAL_SPECIALTY',
    (name) => {
      const unknown = realEntries(RULE_MAPS[name])
        .map(([, rule]) => rule.specialty)
        .filter((code): code is string => code !== null)
        .filter((code) => !MODEL_CODES.has(code));
      expect(unknown).toEqual([]);
    },
  );

  it.each(Object.keys(RULE_MAPS))(
    '%s: toda asignación declara su tipo de equivalencia',
    (name) => {
      const kinds = new Set(Object.keys(rules.matchKinds));
      const bad = realEntries(RULE_MAPS[name])
        .filter(([, rule]) => rule.specialty !== null)
        .filter(([, rule]) => !kinds.has(rule.match ?? ''))
        .map(([key]) => key);
      expect(bad).toEqual([]);
    },
  );

  it('las equivalencias que no son literales explican por qué', () => {
    const unexplained = Object.values(RULE_MAPS)
      .flatMap((map) => realEntries(map))
      .filter(
        ([, rule]) =>
          rule.match === 'national-name' || rule.match === 'section-content',
      )
      .filter(([, rule]) => !rule.note)
      .map(([key]) => key);
    expect(unexplained).toEqual([]);
  });

  it('las frases ya están en la forma con que se comparan (mayúsculas, sin tildes)', () => {
    const notNormalized = realEntries(rules.performer.phrases)
      .map(([phrase]) => phrase)
      .filter(
        (phrase) =>
          phrase !==
          phrase
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase(),
      );
    expect(notNormalized).toEqual([]);
  });

  it('el arancel odontológico entero va a Odontología', () => {
    expect(rules.boDentalSections._all).toBe('ODONTOLOGIA');
  });

  it('los patrones de prestador compilan', () => {
    const all = Object.values(rules.performer.patterns).flat();
    expect(all.length).toBeGreaterThan(0);
    for (const pattern of [...all, ...rules.performer.trailingCut]) {
      expect(() => new RegExp(pattern)).not.toThrow();
    }
  });
});
