/**
 * Compatibilidad paciente ↔ cama (CONTRATO-F2-F5 §F3.2). Puro: la aplicación
 * junta el estado de la cama, la habitación, el paciente y los compañeros de
 * habitación; acá se decide qué reglas fallan.
 */

/** Regla de compatibilidad. */
export type CompatibilityRule =
  | 'LIFECYCLE'
  | 'AVAILABILITY'
  | 'OCCUPANCY'
  | 'HYGIENE'
  | 'ISOLATION_AIRBORNE'
  | 'SEX'
  | 'AGE'
  | 'ISOLATION_COHORT'
  | 'LEVEL_OF_CARE';

/** Reglas que nunca se fuerzan. */
export const BLOCKING_RULES: readonly CompatibilityRule[] = [
  'LIFECYCLE',
  'AVAILABILITY',
  'OCCUPANCY',
  'HYGIENE',
  'ISOLATION_AIRBORNE',
];

/** Una regla que falla. */
export interface Violation {
  readonly rule: CompatibilityRule;
  readonly severity: 'BLOCKING' | 'OVERRIDABLE';
  readonly detail: string;
}

/** Un compañero de habitación (otra cama ocupada de la misma habitación). */
export interface Roommate {
  readonly sex: 'M' | 'F' | 'O' | null;
  readonly isolation: string;
  readonly organism: string | null;
}

/** Lo que se evalúa. */
export interface CompatibilityInput {
  /** Reglas de asignabilidad de F2 que fallan (`LIFECYCLE|AVAILABILITY|OCCUPANCY|HYGIENE`). */
  readonly bedViolations: readonly string[];
  /** Reserva: la higiene todavía puede estar pendiente. */
  readonly reserve: boolean;
  /** Función de la cama (`SPACE_FN_BED_ICU`…). */
  readonly bedFunction: string | null;
  /** La cama o su habitación es AIIR (función `SPACE_FN_ISOLATION_AIIR`). */
  readonly airborneCapable: boolean;
  /** `SEX_ANY|SEX_FEMALE|SEX_MALE` de la habitación (o de la cama). */
  readonly sexRestriction: string | null;
  /** `AGE_ANY|AGE_ADULT|AGE_PEDIATRIC|AGE_NEONATAL` de la cama o habitación. */
  readonly ageGroup: string | null;
  readonly patientSex: 'M' | 'F' | 'O' | null;
  readonly patientBirthDate: Date | null;
  readonly isolation: string;
  readonly organism: string | null;
  readonly levelOfCare: string | null;
  readonly roommates: readonly Roommate[];
  readonly now: Date;
  /** `infra.age_group_thresholds` (años pediátricos, días neonatales). */
  readonly pediatricMaxYears?: number;
  readonly neonatalMaxDays?: number;
}

/** Niveles de cuidado admitidos por función de cama. */
const LEVELS_BY_FUNCTION: Record<string, readonly string[]> = {
  SPACE_FN_BED_ICU: ['LOC_CARE_ICU'],
  SPACE_FN_BED_STANDARD: ['LOC_CARE_GENERAL', 'LOC_CARE_INTERMEDIATE'],
  SPACE_FN_CRIB: ['LOC_CARE_GENERAL', 'LOC_CARE_NEONATAL_ICU'],
};

/**
 * Reglas que fallan para poner al paciente en la cama.
 *
 * @param input - Cama, habitación, paciente y compañeros.
 */
export function evaluateCompatibility(input: CompatibilityInput): Violation[] {
  const out: Violation[] = [];
  const block = (rule: CompatibilityRule, detail: string) =>
    out.push({ rule, severity: 'BLOCKING', detail });
  const soft = (rule: CompatibilityRule, detail: string) =>
    out.push({ rule, severity: 'OVERRIDABLE', detail });

  for (const v of input.bedViolations) {
    if (v === 'HYGIENE' && input.reserve) continue;
    if (
      v === 'LIFECYCLE' ||
      v === 'AVAILABILITY' ||
      v === 'OCCUPANCY' ||
      v === 'HYGIENE'
    ) {
      block(v, `La cama no cumple ${v}`);
    }
  }
  if (input.isolation === 'ISO_AIRBORNE' && !input.airborneCapable) {
    block('ISOLATION_AIRBORNE', 'Aislamiento aéreo sólo en habitación AIIR');
  }
  const sexes = new Set(input.roommates.map((r) => r.sex).filter(Boolean));
  if (
    (input.sexRestriction === 'SEX_FEMALE' && input.patientSex === 'M') ||
    (input.sexRestriction === 'SEX_MALE' && input.patientSex === 'F')
  ) {
    soft('SEX', `Habitación ${input.sexRestriction}`);
  } else if (
    input.patientSex &&
    [...sexes].some((s) => s !== input.patientSex)
  ) {
    soft('SEX', 'Habitación compartida con un paciente de otro sexo');
  }
  if (
    input.patientBirthDate &&
    input.ageGroup &&
    input.ageGroup !== 'AGE_ANY'
  ) {
    const days =
      (input.now.getTime() - input.patientBirthDate.getTime()) / 86_400_000;
    const years = days / 365.25;
    const pedMax = input.pediatricMaxYears ?? 15;
    const neoMax = input.neonatalMaxDays ?? 28;
    const fits =
      input.ageGroup === 'AGE_PEDIATRIC'
        ? years < pedMax
        : input.ageGroup === 'AGE_NEONATAL'
          ? days < neoMax
          : input.ageGroup === 'AGE_ADULT'
            ? years >= pedMax
            : true;
    if (!fits) soft('AGE', `Grupo etario ${input.ageGroup}`);
  }
  if (input.isolation !== 'ISO_NONE' && input.roommates.length > 0) {
    const same = input.roommates.every(
      (r) =>
        r.isolation === input.isolation &&
        r.organism &&
        r.organism === input.organism,
    );
    soft(
      'ISOLATION_COHORT',
      same
        ? 'Cohorte con el mismo organismo: requiere aval'
        : 'Habitación con otro paciente',
    );
  }
  const allowed = input.bedFunction
    ? LEVELS_BY_FUNCTION[input.bedFunction]
    : undefined;
  if (allowed && input.levelOfCare && !allowed.includes(input.levelOfCare)) {
    soft(
      'LEVEL_OF_CARE',
      `${input.bedFunction} no admite ${input.levelOfCare}`,
    );
  }
  return out;
}

/** Veredicto de un forzado (override). */
export type OverrideVerdict =
  | { readonly ok: true; readonly forced: readonly CompatibilityRule[] }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly details: Record<string, unknown>;
    };

/**
 * Decide si las violaciones permiten la colocación: bloqueantes → 409
 * `BED_NOT_ASSIGNABLE`; forzables sin override → 422
 * `BED_COMPATIBILITY_OVERRIDE_REQUIRED`; override con < 20 caracteres → 422
 * `OVERRIDE_JUSTIFICATION_TOO_SHORT`; override que nombra una bloqueante → 422
 * `OVERRIDE_RULE_NOT_OVERRIDABLE`; override que no cubre todas las forzables
 * → 422 `BED_COMPATIBILITY_OVERRIDE_REQUIRED`.
 *
 * @param violations - Reglas que fallan.
 * @param override - Forzado pedido.
 */
export function judgePlacement(
  violations: readonly Violation[],
  override?: { justification?: string; ruleCodes?: readonly string[] },
): OverrideVerdict {
  const blocking = violations.filter((v) => v.severity === 'BLOCKING');
  if (blocking.length > 0) {
    return { ok: false, reason: 'BED_NOT_ASSIGNABLE', details: { violations } };
  }
  const soft = violations.filter((v) => v.severity === 'OVERRIDABLE');
  if (soft.length === 0) return { ok: true, forced: [] };
  if (!override) {
    return {
      ok: false,
      reason: 'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
      details: { violations },
    };
  }
  const codes = override.ruleCodes ?? [];
  if (codes.some((c) => BLOCKING_RULES.includes(c as CompatibilityRule))) {
    return {
      ok: false,
      reason: 'OVERRIDE_RULE_NOT_OVERRIDABLE',
      details: { ruleCodes: codes },
    };
  }
  if ((override.justification ?? '').trim().length < 20) {
    return {
      ok: false,
      reason: 'OVERRIDE_JUSTIFICATION_TOO_SHORT',
      details: { minLength: 20 },
    };
  }
  const missing = soft.filter((v) => !codes.includes(v.rule));
  if (missing.length > 0) {
    return {
      ok: false,
      reason: 'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
      details: { violations: missing },
    };
  }
  return { ok: true, forced: soft.map((v) => v.rule) };
}
