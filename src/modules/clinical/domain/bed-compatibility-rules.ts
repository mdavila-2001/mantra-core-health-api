import type { CareSpaceOperationalState } from '../ports/care-space-ops.port';

/** Reglas de compatibilidad (CONTRATO-F2-F5 F3.2). */
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

/** Las que **nunca** se fuerzan. */
export const BLOCKING_RULES: readonly CompatibilityRule[] = [
  'LIFECYCLE',
  'AVAILABILITY',
  'OCCUPANCY',
  'HYGIENE',
  'ISOLATION_AIRBORNE',
];

/** Las que se fuerzan con justificación e incidente. */
export const OVERRIDABLE_RULES: readonly CompatibilityRule[] = [
  'SEX',
  'AGE',
  'ISOLATION_COHORT',
  'LEVEL_OF_CARE',
];

/** Una incompatibilidad detectada. */
export interface CompatibilityViolation {
  /** Regla incumplida. */
  readonly rule: CompatibilityRule;
  /** `BLOCKING` no se fuerza; `OVERRIDABLE` sí. */
  readonly severity: 'BLOCKING' | 'OVERRIDABLE';
  /** Explicación para la persona, sin datos personales. */
  readonly detail: string;
}

/** Sexo administrativo reducido a lo que las reglas distinguen. */
export type AdministrativeGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

/** Grupo etario de una cama/habitación o de un paciente. */
export type AgeClass = 'AGE_ANY' | 'AGE_ADULT' | 'AGE_PEDIATRIC' | 'AGE_NEONATAL';

/** Umbrales de `infra.age_group_thresholds`. */
export interface AgeThresholds {
  /** Menores de esta edad en años son pediátricos. */
  readonly pediatricMaxYears: number;
  /** Menores de esta edad en días son neonatos. */
  readonly neonatalMaxDays: number;
}

/** Valores por omisión de los umbrales (F3.2: `< 15 años`, `< 28 días`). */
export const DEFAULT_AGE_THRESHOLDS: AgeThresholds = {
  pediatricMaxYears: 15,
  neonatalMaxDays: 28,
};

/** Lo que las reglas necesitan saber de la persona internada. */
export interface PatientFacts {
  /** Sexo administrativo. */
  readonly gender: AdministrativeGender;
  /** Fecha de nacimiento `YYYY-MM-DD`, o `null` si no se conoce. */
  readonly birthDate: string | null;
}

/** Lo que las reglas necesitan saber del encuentro. */
export interface EncounterFacts {
  /** `LOC_CARE_*` del encuentro, o `null` si no se declaró. */
  readonly levelOfCareCode: string | null;
  /** `ISO_*` de la precaución, o `null`. */
  readonly isolationCode: string | null;
  /** Organismo declarado. */
  readonly isolationOrganism: string | null;
}

/** Otro paciente ya instalado en la misma habitación. */
export interface RoomOccupant {
  /** Encuentro. */
  readonly encounterId: string;
  /** Sexo administrativo. */
  readonly gender: AdministrativeGender;
  /** `ISO_*` de su precaución, o `null`. */
  readonly isolationCode: string | null;
  /** Organismo declarado. */
  readonly isolationOrganism: string | null;
}

/** Atributos de un local (cama o habitación) que las reglas consultan. */
export interface SpaceAttributes {
  /** `SEX_ANY|SEX_FEMALE|SEX_MALE` o `null`. */
  readonly sexRestriction: string | null;
  /** `AGE_*` o `null`. */
  readonly ageGroup: string | null;
  /** `PRESSURE_*` o `null`. */
  readonly pressure: string | null;
  /** Fecha de la última validación HVAC `YYYY-MM-DD`, o `null`. */
  readonly hvacValidatedOn: string | null;
}

/** La cama destino y su contexto. */
export interface BedFacts {
  /** `SPACE_FN_*` de la cama. */
  readonly functionCode: string | null;
  /** Atributos de la cama. */
  readonly bed: SpaceAttributes;
  /** Atributos de la habitación (padre `ROOM`), o `null` si la cama no cuelga de una. */
  readonly room: SpaceAttributes | null;
  /** Otros pacientes de la misma habitación. */
  readonly roomOccupants: readonly RoomOccupant[];
  /** Estado operativo que da F2. */
  readonly ops: CareSpaceOperationalState;
  /**
   * La reserva o la ocupación actual no impide la colocación: es de este
   * encuentro (convierte su reserva) o de su compañero de intercambio.
   */
  readonly occupancyWaived: boolean;
}

/** Configuración que las reglas leen de `practice_settings`. */
export interface CompatibilityConfig {
  /** Umbrales etarios. */
  readonly ageThresholds: AgeThresholds;
  /** `infra.inspection_required`. */
  readonly inspectionRequired: boolean;
  /** `infra.hvac_validation_max_days`. */
  readonly hvacValidationMaxDays: number;
  /** Funciones de cama → niveles admitidos. */
  readonly levelsByBedFunction: Readonly<Record<string, readonly string[]>>;
}

const MS_PER_DAY = 86_400_000;

/** Parte `YYYY-MM-DD` como UTC a medianoche. */
function parseDay(day: string): number {
  return Date.UTC(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7)) - 1,
    Number(day.slice(8, 10)),
  );
}

/**
 * Grupo etario del paciente a una fecha.
 *
 * @param birthDate - `YYYY-MM-DD`, o `null`.
 * @param at - Instante de referencia.
 * @param thresholds - Umbrales.
 * @returns `AGE_NEONATAL` (< días), `AGE_PEDIATRIC` (< años) o `AGE_ADULT`; `null` si no hay fecha.
 */
export function ageClassOf(
  birthDate: string | null,
  at: Date,
  thresholds: AgeThresholds,
): Exclude<AgeClass, 'AGE_ANY'> | null {
  if (!birthDate) return null;
  const born = parseDay(birthDate);
  const today = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  const ageDays = Math.floor((today - born) / MS_PER_DAY);
  if (ageDays < thresholds.neonatalMaxDays) return 'AGE_NEONATAL';
  const birth = new Date(born);
  let years = at.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    at.getUTCMonth() < birth.getUTCMonth() ||
    (at.getUTCMonth() === birth.getUTCMonth() &&
      at.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years < thresholds.pediatricMaxYears ? 'AGE_PEDIATRIC' : 'AGE_ADULT';
}

const bothKnown = (a: AdministrativeGender, b: AdministrativeGender): boolean =>
  (a === 'MALE' || a === 'FEMALE') && (b === 'MALE' || b === 'FEMALE');

const hasPrecaution = (code: string | null): boolean =>
  code !== null && code !== 'ISO_NONE';

/**
 * Evalúa todas las reglas de compatibilidad de una cama para un encuentro.
 *
 * Función pura: no lee la base ni el reloj. Devuelve **todas** las
 * incompatibilidades (no se detiene en la primera) para que la interfaz las
 * muestre juntas y el forzado cubra el conjunto completo.
 *
 * @param patient - Sexo y nacimiento.
 * @param encounter - Nivel de cuidado y aislamiento declarados.
 * @param target - Cama, habitación, vecinos y estado operativo.
 * @param config - Umbrales y tablas.
 * @param at - Instante en que se asigna (para la edad).
 * @returns Las incompatibilidades; vacío si la cama es asignable y compatible.
 */
export function evaluateCompatibility(
  patient: PatientFacts,
  encounter: EncounterFacts,
  target: BedFacts,
  config: CompatibilityConfig,
  at: Date,
): CompatibilityViolation[] {
  const out: CompatibilityViolation[] = [];
  const blocking = (rule: CompatibilityRule, detail: string): void => {
    out.push({ rule, severity: 'BLOCKING', detail });
  };
  const overridable = (rule: CompatibilityRule, detail: string): void => {
    out.push({ rule, severity: 'OVERRIDABLE', detail });
  };
  const { ops } = target;

  // --- bloqueantes: nunca se fuerzan ------------------------------------
  if (ops.lifecycle.code !== 'SPACE_ACTIVE') {
    blocking('LIFECYCLE', 'La cama no está activa');
  }
  if (ops.availability.code !== 'SPACE_OP_AVAILABLE') {
    blocking(
      'AVAILABILITY',
      'La cama está bloqueada, en mantenimiento o cerrada',
    );
  }
  const occupancyOk =
    ops.occupancy.code === 'OCC_FREE' || target.occupancyWaived;
  if (!occupancyOk) {
    blocking(
      'OCCUPANCY',
      ops.occupancy.code === 'OCC_RESERVED'
        ? 'La cama está reservada para otro paciente'
        : 'La cama está ocupada',
    );
  }
  const hygieneOk =
    !ops.hygiene.terminalRequired &&
    (ops.hygiene.code === 'HYG_INSPECTED' ||
      (ops.hygiene.code === 'HYG_CLEAN' && !config.inspectionRequired));
  if (!hygieneOk) {
    blocking(
      'HYGIENE',
      ops.hygiene.terminalRequired
        ? 'La cama requiere limpieza terminal e inspección'
        : 'La cama no está limpia e inspeccionada',
    );
  } else if (occupancyOk && ops.occupancy.code === 'OCC_FREE' && !ops.assignable) {
    // Los ejes que F3 conoce están en orden pero la operación dice que no es
    // asignable: se respeta (falla cerrado) sin inventar el motivo.
    blocking('HYGIENE', 'La operación de camas no la declara asignable');
  }

  // Aislamiento aéreo: sólo en un local AIIR (presión negativa con validación HVAC vigente).
  if (encounter.isolationCode === 'ISO_AIRBORNE') {
    const attrs =
      target.bed.pressure !== null ? target.bed : (target.room ?? target.bed);
    const validated = attrs.hvacValidatedOn
      ? Math.floor((parseDay(toDay(at)) - parseDay(attrs.hvacValidatedOn)) / MS_PER_DAY)
      : null;
    const aiirOk =
      attrs.pressure === 'PRESSURE_NEGATIVE' &&
      validated !== null &&
      validated >= 0 &&
      validated <= config.hvacValidationMaxDays;
    if (!aiirOk) {
      blocking(
        'ISOLATION_AIRBORNE',
        'El aislamiento aéreo sólo se aloja en un local AIIR con presión negativa y validación HVAC vigente',
      );
    }
  }

  // --- forzables: justificación + incidente ------------------------------
  const sexLimits = [target.bed.sexRestriction, target.room?.sexRestriction]
    .filter((value): value is string => !!value && value !== 'SEX_ANY');
  for (const limit of new Set(sexLimits)) {
    const allowed: AdministrativeGender = limit === 'SEX_FEMALE' ? 'FEMALE' : 'MALE';
    if (patient.gender !== allowed) {
      overridable(
        'SEX',
        limit === 'SEX_FEMALE'
          ? 'El local es sólo para mujeres'
          : 'El local es sólo para varones',
      );
    }
  }
  if (
    target.room &&
    target.roomOccupants.some((other) => bothKnown(patient.gender, other.gender) && other.gender !== patient.gender)
  ) {
    overridable(
      'SEX',
      'La habitación ya aloja a una persona de distinto sexo (alojamiento del mismo sexo)',
    );
  }

  const patientClass = ageClassOf(patient.birthDate, at, config.ageThresholds);
  const ageLimit = [target.bed.ageGroup, target.room?.ageGroup].find(
    (value) => !!value && value !== 'AGE_ANY',
  );
  if (ageLimit && patientClass !== ageLimit) {
    overridable(
      'AGE',
      patientClass === null
        ? 'La cama es de un grupo etario y se desconoce la edad del paciente'
        : 'El grupo etario del paciente no coincide con el de la cama o la habitación',
    );
  }

  if (
    target.roomOccupants.some(
      (other) =>
        hasPrecaution(other.isolationCode) !== hasPrecaution(encounter.isolationCode) ||
        (hasPrecaution(other.isolationCode) && hasPrecaution(encounter.isolationCode)),
    )
  ) {
    overridable(
      'ISOLATION_COHORT',
      'Hay aislamiento en la habitación: la cohorte exige el mismo organismo y el aval de control de infecciones',
    );
  }

  if (encounter.levelOfCareCode && target.functionCode) {
    const admitted = config.levelsByBedFunction[target.functionCode];
    if (admitted && !admitted.includes(encounter.levelOfCareCode)) {
      overridable(
        'LEVEL_OF_CARE',
        'El nivel de cuidado del encuentro no corresponde a la función de la cama',
      );
    }
  }

  return out;
}

function toDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/**
 * Separa lo bloqueante de lo forzable.
 *
 * @param violations - Resultado de {@link evaluateCompatibility}.
 */
export function splitViolations(violations: readonly CompatibilityViolation[]): {
  blocking: CompatibilityViolation[];
  overridable: CompatibilityViolation[];
} {
  return {
    blocking: violations.filter((v) => v.severity === 'BLOCKING'),
    overridable: violations.filter((v) => v.severity === 'OVERRIDABLE'),
  };
}
