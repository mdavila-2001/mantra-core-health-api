import type {
  PatientFlag,
  SupportAccessContext,
  SupportAccessFacts,
  SupportChannel,
  UsageKey,
} from './support-access-context';
import {
  SupportAccessReason,
  type ConditionSource,
  type UnmetCondition,
} from './support-access.types';
import { atomMeta } from './support-permission-catalog';
import {
  DEFAULT_TIME_ZONE,
  endOfZonedDayExclusive,
  evaluateWindows,
  nextResetAt,
  periodKey,
  startOfZonedDay,
  type TimeWindow,
} from './support-time';

/**
 * Condiciones ABAC v1 de un permiso de apoyo (CONTRATO-GOBIERNO §3.3 y §3.4):
 * tipos del `condition_json`, aplicabilidad de cada clave a un átomo y el
 * evaluador puro con lógica de tres valores (`T`/`F`/`I`). Lo indeterminado
 * (`I`) cierra: nunca abre.
 */

/** Versión del esquema que este motor entiende. */
export const SUPPORT_CONDITION_SCHEMA_VERSION = 1;

/** Resultado de un predicado: verdadero, falso o indeterminado. */
export type Tri = 'T' | 'F' | 'I';

/** Lo que cuenta un límite. `AMOUNT` es interno: suma montos del día. */
export type UsageMetric = 'ACTIONS' | 'DISTINCT_PATIENTS' | 'AMOUNT';
/** Periodo de un límite. */
export type UsagePeriod = 'HOUR' | 'DAY' | 'WEEK';
/** Estrategia de enmascaramiento (`authz:MASK_*`). */
export type FieldMask = 'PARTIAL' | 'REDACT' | 'NULLIFY' | 'HASH';
/** Quién aprueba un cuatro ojos. */
export type ApprovalBy = 'DOCTOR' | 'SECOND_APPROVER' | 'SERVICE_HEAD';

/** Un límite de volumen. */
export interface LimitCondition {
  readonly metric: 'ACTIONS' | 'DISTINCT_PATIENTS';
  readonly per: UsagePeriod;
  readonly max: number;
  readonly scope?: 'GRANT' | 'PERSON';
  readonly group?: string;
  readonly onExceed: 'DENY' | 'REQUIRE_APPROVAL';
}

/** `condition_json` v1: todas las claves son opcionales y se cruzan (Y). */
export interface SupportCondition {
  readonly schemaVersion: number;
  readonly time?: {
    readonly timeZone?: string;
    readonly windows: readonly TimeWindow[];
  };
  readonly limits?: readonly LimitCondition[];
  readonly patients?: {
    readonly scope?:
      'ANY' | 'WITH_APPOINTMENT_WINDOW' | 'CARE_TEAM_OF_COVERED_DOCTOR';
    readonly appointmentWindow?: {
      readonly daysBefore: number;
      readonly daysAfter: number;
      readonly withCoveredDoctor?: boolean;
    };
    readonly age?: { readonly min?: number; readonly max?: number };
    readonly isMinor?: boolean;
    readonly coverage?: {
      readonly mode: 'INSURED_ONLY' | 'SELF_PAY_ONLY' | 'ANY';
      readonly carrierIds?: readonly string[];
    };
    readonly flags?: { readonly anyOf: readonly PatientFlag[] };
    readonly exclude?: {
      readonly minors?: boolean;
      readonly flags?: readonly PatientFlag[];
    };
  };
  readonly appointment?: {
    readonly window?: {
      readonly daysBefore: number;
      readonly daysAfter: number;
    };
    readonly leadTime?: {
      readonly minHours: number;
      readonly onViolation: 'DENY' | 'REQUIRE_APPROVAL';
    };
    readonly horizon?: { readonly maxDaysAhead: number };
  };
  readonly channels?: { readonly allow: readonly SupportChannel[] };
  readonly fields?: Readonly<Record<string, { readonly mask: FieldMask }>>;
  readonly amount?: {
    readonly currency: 'BOB';
    readonly perTransactionMax?: number;
    readonly perDayMax?: number;
    readonly maxDiscountPercent?: number;
    readonly onExceed?: 'DENY' | 'REQUIRE_APPROVAL';
  };
  readonly session?: { readonly maxSessionMinutes: number };
  readonly network?: { readonly require: 'ORG_RULES' | 'ANY' };
  readonly device?: { readonly knownOnly: boolean };
  readonly presence?: { readonly doctor: 'ONLINE' };
  readonly obligations?: {
    readonly requireReason?: { readonly minLength?: number };
    readonly stepUp?: { readonly maxAgeMinutes?: number };
    readonly approval?: {
      readonly by: ApprovalBy;
      readonly ttlMinutes?: number;
    };
  };
  readonly delegationCeiling?: {
    readonly allowAtoms?: readonly string[];
    readonly forbidAtoms?: readonly string[];
    readonly templates?: readonly string[];
    readonly maxValidDays?: number;
  };
}

/** Valores por defecto de las obligaciones (§3.4). */
export const DEFAULT_STEP_UP_MAX_AGE_MINUTES = 10;
export const DEFAULT_APPROVAL_TTL_MINUTES = 60;
export const DEFAULT_REASON_MIN_LENGTH = 5;

/** Obligaciones que una condición pide (ya con sus valores por defecto). */
export interface ExplicitObligations {
  readonly reason?: { readonly minLength: number };
  readonly stepUp?: { readonly maxAgeMinutes: number };
  readonly approval?: { readonly by: ApprovalBy; readonly ttlMinutes: number };
}

/** Lo que habría que consumir de un contador si la acción se permite. */
export interface UsageRequest {
  readonly key: UsageKey;
  readonly amount: number;
}

/** Lo que el contador dijo de un límite (para explicar «3 de 20»). */
export interface UsageSnapshot {
  readonly key: UsageKey;
  readonly metric: UsageMetric;
  readonly per: UsagePeriod;
  readonly max: number;
  readonly used: number;
  readonly ok: boolean;
  readonly resetsAt?: string;
}

/** Facetas que el servicio debe resolver para evaluar (`requiredFacets`). */
export type Facet =
  | 'patient'
  | 'session'
  | 'network'
  | 'device'
  | 'doctorOnline'
  | 'stepUp'
  | 'usage';

/** Resultado de evaluar una condición contra un átomo. */
export interface ConditionEvaluation {
  /** Resultado por clave evaluada (las no evaluadas no figuran). */
  readonly predicates: Readonly<Record<string, Tri>>;
  /** Lo que no se cumplió o quedó indeterminado, en el orden del contrato. */
  readonly unmet: readonly UnmetCondition[];
  /** Obligaciones que la condición pide. */
  readonly obligations: ExplicitObligations;
  /** Máscara pedida por campo. */
  readonly fields: Readonly<Record<string, FieldMask>>;
  /** Consumos pendientes si se permite. */
  readonly usage: readonly UsageRequest[];
  /** Lecturas de contadores. */
  readonly readings: readonly UsageSnapshot[];
}

/** Opciones de `evaluateConditions`. */
export interface EvaluateConditionsOptions {
  /** De dónde sale la condición. */
  readonly source?: ConditionSource;
  /** Prefijo de la ruta (`condition`, `actionConditions.<átomo>`…). */
  readonly pathPrefix?: string;
  /** Regla de la organización de origen. */
  readonly ruleId?: string;
  /** Zona de la organización (días y periodos); por defecto La Paz. */
  readonly timeZone?: string;
  /** Concesión (clave de los contadores `scope: GRANT`). */
  readonly grantId?: string;
  /** Persona (clave de los contadores `scope: PERSON`). */
  readonly subjectId?: string;
  /** Doctor que el permiso cubre en esta decisión. */
  readonly coveredPractitionerProfileId?: string;
  /** Evalúa también las facetas caras aunque una barata ya falló. */
  readonly evaluateAll?: boolean;
}

// ───────────────────────── aplicabilidad (§3.6) ─────────────────────────

/** Claves de condición con regla de aplicabilidad propia. */
export type ConditionKey =
  | 'time'
  | 'session'
  | 'network'
  | 'device'
  | 'obligations'
  | 'limits.ACTIONS'
  | 'limits.DISTINCT_PATIENTS'
  | 'patients'
  | 'appointment.window'
  | 'appointment.leadTime'
  | 'appointment.horizon'
  | 'channels'
  | 'amount'
  | 'presence'
  | 'delegationCeiling';

const DISTINCT_PATIENT_ATOMS: ReadonlySet<string> = new Set([
  'patients.search.exact',
  'patients.profile.view_basic',
  'reports.agenda.export',
]);
const HORIZON_ATOMS: ReadonlySet<string> = new Set([
  'agenda.appointment.create',
  'agenda.appointment.create.overbook',
  'agenda.appointment.reschedule',
  'agenda.appointment.walk_in',
]);
const CHANNEL_ATOMS: ReadonlySet<string> = new Set([
  'messages.conversation.reply_on_behalf',
  'messages.attachment.send',
  'messages.broadcast.send',
]);
const AMOUNT_ATOMS: ReadonlySet<string> = new Set([
  'billing.payment.collect',
  'billing.receipt.issue',
  'billing.receipt.void',
  'billing.payment.refund',
  'billing.discount.apply',
]);
const CEILING_ATOMS: ReadonlySet<string> = new Set([
  'team.grants.assign',
  'team.requests.decide',
  'team.invitations.create',
]);

/**
 * ¿Acepta este átomo esa clave de condición? Es la tabla del §3.6: las claves
 * que no aplican se rechazan al guardar y no se evalúan al decidir.
 */
export function conditionKeyAppliesToAtom(
  key: ConditionKey,
  atom: string,
): boolean {
  const meta = atomMeta(atom);
  if (!meta?.supportAssignable) return false;
  const isAppointment = atom.startsWith('agenda.appointment.');
  switch (key) {
    case 'time':
    case 'session':
    case 'network':
    case 'device':
    case 'obligations':
    case 'limits.ACTIONS':
      return true;
    case 'limits.DISTINCT_PATIENTS':
      return (
        DISTINCT_PATIENT_ATOMS.has(atom) ||
        atom === 'agenda.appointment.view' ||
        atom.startsWith('agenda.appointment.view.') ||
        atom.startsWith('patients.profile.view.')
      );
    case 'patients':
      return (
        isAppointment ||
        (atom.startsWith('patients.') &&
          atom !== 'patients.profile.register') ||
        atom.startsWith('messages.conversation.') ||
        atom === 'messages.attachment.send'
      );
    case 'appointment.window':
      return isAppointment;
    case 'appointment.leadTime':
      return (
        atom === 'agenda.appointment.cancel' ||
        atom === 'agenda.appointment.reschedule'
      );
    case 'appointment.horizon':
      return HORIZON_ATOMS.has(atom);
    case 'channels':
      return CHANNEL_ATOMS.has(atom);
    case 'amount':
      return AMOUNT_ATOMS.has(atom);
    case 'presence':
      return (
        atom.startsWith('agenda.') ||
        atom.startsWith('messages.conversation.') ||
        atom === 'patients.clinical.request_temporary_access'
      );
    case 'delegationCeiling':
      return CEILING_ATOMS.has(atom);
  }
}

/** Facetas que una condición necesita (opcionalmente filtradas por átomo). */
export function requiredFacets(
  condition: SupportCondition | readonly SupportCondition[],
  atom?: string,
): ReadonlySet<Facet> {
  const out = new Set<Facet>();
  const list = Array.isArray(condition)
    ? (condition as readonly SupportCondition[])
    : [condition as SupportCondition];
  const applies = (key: ConditionKey): boolean =>
    atom === undefined || conditionKeyAppliesToAtom(key, atom);
  for (const c of list) {
    if (c.patients && applies('patients')) out.add('patient');
    if (c.session && applies('session')) out.add('session');
    if (c.network?.require === 'ORG_RULES' && applies('network'))
      out.add('network');
    if (c.device?.knownOnly && applies('device')) out.add('device');
    if (c.presence && applies('presence')) out.add('doctorOnline');
    if (
      c.limits?.some((l) =>
        applies(
          l.metric === 'ACTIONS'
            ? 'limits.ACTIONS'
            : 'limits.DISTINCT_PATIENTS',
        ),
      )
    ) {
      out.add('usage');
    }
    if (c.amount?.perDayMax !== undefined && applies('amount'))
      out.add('usage');
    if (c.obligations?.stepUp && applies('obligations')) out.add('stepUp');
    if (
      c.limits?.some((l) => l.metric === 'DISTINCT_PATIENTS') &&
      applies('patients')
    ) {
      out.add('patient');
    }
  }
  if (atom !== undefined && atomMeta(atom)?.requiresStepUp) out.add('stepUp');
  return out;
}

// ───────────────────────── orden de incumplimientos ─────────────────────────

/** Orden de evaluación y de reporte (de barato a caro, §3.8). */
const KEY_RANK: Readonly<Record<string, number>> = {
  time: 0,
  'appointment.window': 1,
  channels: 2,
  'patients.age': 3,
  'patients.isMinor': 3.1,
  'patients.exclude': 3.2,
  'patients.flags': 3.3,
  'patients.coverage': 3.4,
  'patients.scope': 3.5,
  'appointment.leadTime': 4,
  'appointment.horizon': 4.1,
  network: 5,
  device: 6,
  session: 7,
  presence: 8,
  limits: 9,
  amount: 10,
};

/** Posición de una clave en el orden de evaluación del contrato. */
export function unmetRank(key: string): number {
  return KEY_RANK[key] ?? 99;
}

/** Comparador determinista de incumplimientos: orden del contrato, luego ruta. */
export function compareUnmet(a: UnmetCondition, b: UnmetCondition): number {
  return (
    unmetRank(a.key) - unmetRank(b.key) ||
    (a.status === b.status ? 0 : a.status === 'F' ? -1 : 1) ||
    (a.path ?? '').localeCompare(b.path ?? '') ||
    a.code.localeCompare(b.code)
  );
}

// ───────────────────────── evaluación ─────────────────────────

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Combina resultados de tres valores con «Y»: un `F` basta; si no, un `I`. */
function and(values: readonly Tri[]): Tri {
  if (values.includes('F')) return 'F';
  if (values.includes('I')) return 'I';
  return 'T';
}

function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Evalúa una condición v1 contra un átomo. Pura y determinista.
 *
 * Solo evalúa las claves que aplican al átomo. Las facetas baratas (hora,
 * ventana de cita, canal, paciente, anticipación) van primero; las caras
 * (red, dispositivo, sesión, presencia, límites, monto) solo se evalúan si las
 * baratas pasaron, salvo en `peek`/`evaluateAll` (explicar y simular), que
 * evalúan todo para poder decir «qué faltaría».
 *
 * @param condition - Condición v1.
 * @param atom - Átomo que se evalúa.
 * @param context - Contexto de la acción.
 * @param facts - Hechos resueltos por el servicio.
 * @param now - Instante de la decisión.
 * @param options - Origen, zona y claves de contadores.
 * @returns Predicados, incumplimientos, obligaciones, máscaras y consumos.
 */
export function evaluateConditions(
  condition: SupportCondition,
  atom: string,
  context: SupportAccessContext | undefined,
  facts: SupportAccessFacts | undefined,
  now: Date,
  options: EvaluateConditionsOptions = {},
): ConditionEvaluation {
  const predicates: Record<string, Tri> = {};
  const unmet: UnmetCondition[] = [];
  const usage: UsageRequest[] = [];
  const readings: UsageSnapshot[] = [];
  const orgZone = options.timeZone ?? facts?.orgTimeZone ?? DEFAULT_TIME_ZONE;
  const prefix = options.pathPrefix ?? 'condition';
  const applies = (key: ConditionKey): boolean =>
    conditionKeyAppliesToAtom(key, atom);

  const fail = (
    key: string,
    status: 'F' | 'I',
    code: SupportAccessReason,
    details?: Record<string, unknown>,
    approvable = false,
    subPath = key,
  ): void => {
    unmet.push({
      key,
      code,
      status,
      path: `${prefix}.${subPath}`,
      source: options.source ?? 'GRANT',
      ...(options.ruleId ? { ruleId: options.ruleId } : {}),
      ...(details ? { details } : {}),
      approvable,
    });
  };
  const decide = (key: string, results: readonly Tri[]): Tri => {
    const tri = and(results);
    predicates[key] = tri;
    return tri;
  };

  // ── baratas ────────────────────────────────────────────────────────
  if (condition.time && applies('time')) {
    const zone = condition.time.timeZone ?? orgZone;
    const tri = evaluateWindows(condition.time.windows, now, zone);
    predicates.time = tri;
    if (tri !== 'T') {
      fail(
        'time',
        tri,
        SupportAccessReason.TIME_WINDOW,
        {
          timeZone: zone,
          windows: condition.time.windows,
          ...(tri === 'I' ? { indeterminate: true } : {}),
        },
        false,
        'time.windows',
      );
    }
  }

  const window = condition.appointment?.window;
  if (window && applies('appointment.window')) {
    const start = context?.appointmentStartAt;
    const lo = startOfZonedDay(now, orgZone, -window.daysBefore);
    const hi = endOfZonedDayExclusive(now, orgZone, window.daysAfter);
    if (!isDate(start) || !lo || !hi) {
      predicates['appointment.window'] = 'I';
      fail('appointment.window', 'I', SupportAccessReason.APPOINTMENT_WINDOW, {
        indeterminate: true,
        ...window,
      });
    } else if (start >= lo && start < hi) {
      predicates['appointment.window'] = 'T';
    } else {
      predicates['appointment.window'] = 'F';
      fail('appointment.window', 'F', SupportAccessReason.APPOINTMENT_WINDOW, {
        ...window,
      });
    }
  }

  if (condition.channels && applies('channels')) {
    const asked = context?.channels;
    if (!asked || asked.length === 0) {
      predicates.channels = 'I';
      fail('channels', 'I', SupportAccessReason.CHANNEL_UNKNOWN, {
        allow: condition.channels.allow,
      });
    } else if (asked.every((c) => condition.channels?.allow.includes(c))) {
      predicates.channels = 'T';
    } else {
      predicates.channels = 'F';
      fail('channels', 'F', SupportAccessReason.CHANNEL_NOT_ALLOWED, {
        allow: condition.channels.allow,
        requested: [...asked],
      });
    }
  }

  if (condition.patients && applies('patients')) {
    evaluatePatients(condition.patients, facts, options, fail, decide);
  }

  const leadTime = condition.appointment?.leadTime;
  if (leadTime && applies('appointment.leadTime')) {
    const start = context?.appointmentStartAt;
    if (!isDate(start)) {
      predicates['appointment.leadTime'] = 'I';
      fail('appointment.leadTime', 'I', SupportAccessReason.LEAD_TIME, {
        indeterminate: true,
        minHours: leadTime.minHours,
      });
    } else {
      const hoursLeft = (start.getTime() - now.getTime()) / 3_600_000;
      // Una cita ya empezada o pasada siempre incumple.
      if (hoursLeft > 0 && hoursLeft >= leadTime.minHours) {
        predicates['appointment.leadTime'] = 'T';
      } else {
        predicates['appointment.leadTime'] = 'F';
        fail(
          'appointment.leadTime',
          'F',
          SupportAccessReason.LEAD_TIME,
          {
            minHours: leadTime.minHours,
            hoursLeft: round1(Math.max(0, hoursLeft)),
            onViolation: leadTime.onViolation,
          },
          leadTime.onViolation === 'REQUIRE_APPROVAL',
        );
      }
    }
  }

  const horizon = condition.appointment?.horizon;
  if (horizon && applies('appointment.horizon')) {
    const target = context?.newAppointmentStartAt;
    const limit = endOfZonedDayExclusive(now, orgZone, horizon.maxDaysAhead);
    if (!isDate(target) || !limit) {
      predicates['appointment.horizon'] = 'I';
      fail('appointment.horizon', 'I', SupportAccessReason.HORIZON, {
        indeterminate: true,
        maxDaysAhead: horizon.maxDaysAhead,
      });
    } else if (target < limit) {
      predicates['appointment.horizon'] = 'T';
    } else {
      predicates['appointment.horizon'] = 'F';
      fail('appointment.horizon', 'F', SupportAccessReason.HORIZON, {
        maxDaysAhead: horizon.maxDaysAhead,
      });
    }
  }

  // ── caras: solo si las baratas pasaron (o en explicar/simular) ─────
  const evaluateAll = options.evaluateAll === true || context?.peek === true;
  if (unmet.length === 0 || evaluateAll) {
    if (condition.network && applies('network')) {
      if (condition.network.require === 'ANY') {
        predicates.network = 'T';
      } else if (!facts?.network) {
        predicates.network = 'I';
        fail('network', 'I', SupportAccessReason.NETWORK_NOT_ALLOWED, {
          indeterminate: true,
        });
      } else if (!facts.network.orgHasAllowRules) {
        predicates.network = 'I';
        fail('network', 'I', SupportAccessReason.NETWORK_RULES_NOT_CONFIGURED);
      } else if (facts.network.satisfiesOrgRules) {
        predicates.network = 'T';
      } else {
        predicates.network = 'F';
        fail('network', 'F', SupportAccessReason.NETWORK_NOT_ALLOWED);
      }
    }

    if (condition.device && applies('device')) {
      if (!condition.device.knownOnly) {
        predicates.device = 'T';
      } else if (!facts?.device) {
        predicates.device = 'I';
        fail('device', 'I', SupportAccessReason.DEVICE_NOT_TRUSTED, {
          indeterminate: true,
        });
      } else if (facts.device.trusted) {
        predicates.device = 'T';
      } else {
        predicates.device = 'F';
        fail('device', 'F', SupportAccessReason.DEVICE_NOT_TRUSTED);
      }
    }

    if (condition.session && applies('session')) {
      const max = condition.session.maxSessionMinutes;
      if (!facts?.session || !isDate(facts.session.startedAt)) {
        predicates.session = 'I';
        fail('session', 'I', SupportAccessReason.SESSION_TOO_LONG, {
          indeterminate: true,
          maxSessionMinutes: max,
        });
      } else if (
        now.getTime() - facts.session.startedAt.getTime() <=
        max * 60_000
      ) {
        predicates.session = 'T';
      } else {
        predicates.session = 'F';
        fail('session', 'F', SupportAccessReason.SESSION_TOO_LONG, {
          maxSessionMinutes: max,
        });
      }
    }

    if (condition.presence && applies('presence')) {
      if (facts?.doctorOnline === undefined) {
        predicates.presence = 'I';
        fail('presence', 'I', SupportAccessReason.DOCTOR_OFFLINE, {
          indeterminate: true,
        });
      } else if (facts.doctorOnline) {
        predicates.presence = 'T';
      } else {
        predicates.presence = 'F';
        fail('presence', 'F', SupportAccessReason.DOCTOR_OFFLINE);
      }
    }

    if (condition.limits) {
      evaluateLimits(
        condition.limits,
        atom,
        context,
        facts,
        now,
        orgZone,
        options,
        {
          predicates,
          fail,
          usage,
          readings,
        },
      );
    }

    if (condition.amount && applies('amount')) {
      evaluateAmount(
        condition.amount,
        atom,
        context,
        facts,
        now,
        orgZone,
        options,
        {
          predicates,
          fail,
          usage,
          readings,
        },
      );
    }
  }

  // ── salidas que no son incumplimientos ─────────────────────────────
  const obligations = readObligations(condition, applies('obligations'));
  const fields: Record<string, FieldMask> = {};
  if (condition.fields) {
    for (const [fieldAtom, spec] of Object.entries(condition.fields)) {
      fields[fieldAtom] = spec.mask;
    }
  }

  return {
    predicates,
    unmet: unmet.sort(compareUnmet),
    obligations,
    fields,
    usage,
    readings,
  };
}

type FailFn = (
  key: string,
  status: 'F' | 'I',
  code: SupportAccessReason,
  details?: Record<string, unknown>,
  approvable?: boolean,
  subPath?: string,
) => void;

/** Obligaciones que una condición pide, con sus valores por defecto. */
export function readObligations(
  condition: SupportCondition,
  enabled = true,
): ExplicitObligations {
  const o = condition.obligations;
  if (!o || !enabled) return {};
  return {
    ...(o.requireReason
      ? {
          reason: {
            minLength: o.requireReason.minLength ?? DEFAULT_REASON_MIN_LENGTH,
          },
        }
      : {}),
    ...(o.stepUp
      ? {
          stepUp: {
            maxAgeMinutes:
              o.stepUp.maxAgeMinutes ?? DEFAULT_STEP_UP_MAX_AGE_MINUTES,
          },
        }
      : {}),
    ...(o.approval
      ? {
          approval: {
            by: o.approval.by,
            ttlMinutes: o.approval.ttlMinutes ?? DEFAULT_APPROVAL_TTL_MINUTES,
          },
        }
      : {}),
  };
}

const ageOf = (
  patient: NonNullable<SupportAccessFacts['patient']>,
): number | undefined =>
  patient.birthDateKnown && typeof patient.ageYears === 'number'
    ? patient.ageYears
    : undefined;

function minorOf(
  patient: NonNullable<SupportAccessFacts['patient']>,
): boolean | undefined {
  if (typeof patient.isMinor === 'boolean') return patient.isMinor;
  const age = ageOf(patient);
  return age === undefined ? undefined : age < 18;
}

/** Alcance de pacientes (`patients`): edad, menor, exclusiones, banderas, cobertura, alcance. */
function evaluatePatients(
  spec: NonNullable<SupportCondition['patients']>,
  facts: SupportAccessFacts | undefined,
  options: EvaluateConditionsOptions,
  fail: FailFn,
  decide: (key: string, results: readonly Tri[]) => Tri,
): void {
  const patient = facts?.patient;
  const R = SupportAccessReason;

  if (spec.age) {
    const { min, max } = spec.age;
    const age = patient ? ageOf(patient) : undefined;
    if (age === undefined) {
      decide('patients.age', ['I']);
      fail(
        'patients.age',
        'I',
        R.PATIENT_AGE_UNKNOWN,
        { indeterminate: true, min, max },
        false,
        'patients.age',
      );
    } else if (
      (min === undefined || age >= min) &&
      (max === undefined || age <= max)
    ) {
      decide('patients.age', ['T']);
    } else {
      decide('patients.age', ['F']);
      fail(
        'patients.age',
        'F',
        R.PATIENT_AGE,
        { min, max },
        false,
        'patients.age',
      );
    }
  }

  if (typeof spec.isMinor === 'boolean') {
    const minor = patient ? minorOf(patient) : undefined;
    if (minor === undefined) {
      decide('patients.isMinor', ['I']);
      fail(
        'patients.isMinor',
        'I',
        R.PATIENT_AGE_UNKNOWN,
        { indeterminate: true },
        false,
        'patients.isMinor',
      );
    } else if (minor === spec.isMinor) {
      decide('patients.isMinor', ['T']);
    } else {
      decide('patients.isMinor', ['F']);
      fail(
        'patients.isMinor',
        'F',
        R.PATIENT_AGE,
        { isMinor: spec.isMinor },
        false,
        'patients.isMinor',
      );
    }
  }

  if (spec.exclude && (spec.exclude.minors || spec.exclude.flags?.length)) {
    const results: Tri[] = [];
    if (!patient) {
      results.push('I');
    } else {
      if (spec.exclude.minors) {
        const minor = minorOf(patient);
        results.push(minor === undefined ? 'I' : minor ? 'F' : 'T');
      }
      const hit = (spec.exclude.flags ?? []).filter((f) =>
        patient.flags.includes(f),
      );
      if (spec.exclude.flags?.length) results.push(hit.length > 0 ? 'F' : 'T');
    }
    const tri = decide('patients.exclude', results);
    if (tri !== 'T') {
      const flags = patient
        ? (spec.exclude.flags ?? []).filter((f) => patient.flags.includes(f))
        : [];
      fail(
        'patients.exclude',
        tri,
        R.PATIENT_EXCLUDED,
        {
          ...(tri === 'I' ? { indeterminate: true } : {}),
          ...(flags.length ? { flags } : {}),
          ...(tri === 'F' && flags.length === 0 ? { minors: true } : {}),
        },
        false,
        'patients.exclude',
      );
    }
  }

  if (spec.flags && spec.flags.anyOf.length > 0) {
    if (!patient) {
      decide('patients.flags', ['I']);
      fail(
        'patients.flags',
        'I',
        R.PATIENT_SCOPE,
        { indeterminate: true },
        false,
        'patients.flags',
      );
    } else if (spec.flags.anyOf.some((f) => patient.flags.includes(f))) {
      decide('patients.flags', ['T']);
    } else {
      decide('patients.flags', ['F']);
      fail(
        'patients.flags',
        'F',
        R.PATIENT_SCOPE,
        { anyOf: spec.flags.anyOf },
        false,
        'patients.flags',
      );
    }
  }

  if (spec.coverage && spec.coverage.mode !== 'ANY') {
    const carriers = spec.coverage.carrierIds ?? [];
    if (!patient || typeof patient.insured !== 'boolean') {
      decide('patients.coverage', ['I']);
      fail(
        'patients.coverage',
        'I',
        R.PATIENT_COVERAGE,
        { indeterminate: true, mode: spec.coverage.mode },
        false,
        'patients.coverage',
      );
    } else {
      const wantsInsured = spec.coverage.mode === 'INSURED_ONLY';
      let tri: Tri = patient.insured === wantsInsured ? 'T' : 'F';
      if (tri === 'T' && wantsInsured && carriers.length > 0) {
        tri = !patient.carrierIds
          ? 'I'
          : patient.carrierIds.some((c) => carriers.includes(c))
            ? 'T'
            : 'F';
      }
      decide('patients.coverage', [tri]);
      if (tri !== 'T') {
        fail(
          'patients.coverage',
          tri,
          R.PATIENT_COVERAGE,
          {
            mode: spec.coverage.mode,
            ...(carriers.length ? { carrierIds: carriers } : {}),
            ...(tri === 'I' ? { indeterminate: true } : {}),
          },
          false,
          'patients.coverage',
        );
      }
    }
  }

  if (spec.scope && spec.scope !== 'ANY') {
    const doctor = options.coveredPractitionerProfileId;
    let tri: Tri;
    if (!patient) {
      tri = 'I';
    } else if (spec.scope === 'WITH_APPOINTMENT_WINDOW') {
      const win = spec.appointmentWindow ?? { daysBefore: 0, daysAfter: 0 };
      if (!patient.hasBookingInWindow) tri = 'I';
      else {
        const doctors =
          win.withCoveredDoctor !== false && doctor ? [doctor] : undefined;
        tri = patient.hasBookingInWindow(
          { daysBefore: win.daysBefore, daysAfter: win.daysAfter },
          doctors,
        )
          ? 'T'
          : 'F';
      }
    } else if (!patient.inCareTeamOf || !doctor) {
      tri = 'I';
    } else {
      tri = patient.inCareTeamOf(doctor) ? 'T' : 'F';
    }
    decide('patients.scope', [tri]);
    if (tri !== 'T') {
      fail(
        'patients.scope',
        tri,
        R.PATIENT_SCOPE,
        { scope: spec.scope, ...(tri === 'I' ? { indeterminate: true } : {}) },
        false,
        'patients.scope',
      );
    }
  }
}

interface Sink {
  readonly predicates: Record<string, Tri>;
  readonly fail: FailFn;
  readonly usage: UsageRequest[];
  readonly readings: UsageSnapshot[];
}

/** `limits`: todos deben cumplirse; lee el contador y pide consumirlo si se cumplen. */
function evaluateLimits(
  limits: readonly LimitCondition[],
  atom: string,
  context: SupportAccessContext | undefined,
  facts: SupportAccessFacts | undefined,
  now: Date,
  zone: string,
  options: EvaluateConditionsOptions,
  sink: Sink,
): void {
  const results: Tri[] = [];
  const pendingUsage: UsageRequest[] = [];
  limits.forEach((limit, index) => {
    const appliesKey: ConditionKey =
      limit.metric === 'ACTIONS'
        ? 'limits.ACTIONS'
        : 'limits.DISTINCT_PATIENTS';
    if (!conditionKeyAppliesToAtom(appliesKey, atom)) return;
    const scope = limit.scope ?? 'GRANT';
    const period = periodKey(limit.per, now, zone);
    const patientId = context?.patientProfileId;
    const approvable = limit.onExceed === 'REQUIRE_APPROVAL';
    const base = { metric: limit.metric, per: limit.per, max: limit.max };
    const subPath = `limits[${index}]`;
    if (
      !facts?.usage ||
      !period ||
      (limit.metric === 'DISTINCT_PATIENTS' && !patientId)
    ) {
      results.push('I');
      sink.fail(
        'limits',
        'I',
        SupportAccessReason.LIMIT_EXCEEDED,
        { ...base, indeterminate: true },
        false,
        subPath,
      );
      return;
    }
    const key: UsageKey = {
      metric: limit.metric,
      per: limit.per,
      period,
      scope,
      subject:
        scope === 'PERSON'
          ? (options.subjectId ?? '')
          : (options.grantId ?? ''),
      bucket: limit.group ?? atom,
      ...(limit.metric === 'DISTINCT_PATIENTS'
        ? { patientProfileId: patientId }
        : {}),
    };
    const reading = facts.usage(key);
    const exceeded = !reading.alreadyCounted && reading.used >= limit.max;
    const resetsAt = (
      reading.resetsAt ?? nextResetAt(limit.per, now, zone)
    )?.toISOString();
    sink.readings.push({
      key,
      metric: limit.metric,
      per: limit.per,
      max: limit.max,
      used: reading.used,
      ok: !exceeded,
      ...(resetsAt ? { resetsAt } : {}),
    });
    if (exceeded) {
      results.push('F');
      sink.fail(
        'limits',
        'F',
        SupportAccessReason.LIMIT_EXCEEDED,
        { ...base, used: reading.used, resetsAt },
        approvable,
        subPath,
      );
    } else {
      results.push('T');
      pendingUsage.push({ key, amount: 1 });
    }
  });
  if (results.length === 0) return;
  sink.predicates.limits = and(results);
  if (sink.predicates.limits === 'T') sink.usage.push(...pendingUsage);
}

/** `amount`: tope por operación, tope por día (contador) y descuento máximo. */
function evaluateAmount(
  amount: NonNullable<SupportCondition['amount']>,
  atom: string,
  context: SupportAccessContext | undefined,
  facts: SupportAccessFacts | undefined,
  now: Date,
  zone: string,
  options: EvaluateConditionsOptions,
  sink: Sink,
): void {
  const approvable = amount.onExceed === 'REQUIRE_APPROVAL';
  const given = context?.amount;
  if (
    !given ||
    given.currency !== 'BOB' ||
    !Number.isFinite(given.minorUnits)
  ) {
    sink.predicates.amount = 'I';
    sink.fail('amount', 'I', SupportAccessReason.AMOUNT_UNKNOWN, {
      indeterminate: true,
    });
    return;
  }
  const results: Tri[] = [];
  const bs = given.minorUnits / 100;
  if (amount.perTransactionMax !== undefined) {
    if (bs <= amount.perTransactionMax) results.push('T');
    else {
      results.push('F');
      sink.fail(
        'amount',
        'F',
        SupportAccessReason.AMOUNT_LIMIT,
        { limit: 'perTransactionMax', max: amount.perTransactionMax },
        approvable,
        'amount.perTransactionMax',
      );
    }
  }
  if (amount.maxDiscountPercent !== undefined) {
    const discount = given.discountPercent;
    if (discount === undefined) {
      if (atom === 'billing.discount.apply') {
        results.push('I');
        sink.fail(
          'amount',
          'I',
          SupportAccessReason.AMOUNT_UNKNOWN,
          { indeterminate: true, limit: 'maxDiscountPercent' },
          false,
          'amount.maxDiscountPercent',
        );
      }
    } else if (discount <= amount.maxDiscountPercent) {
      results.push('T');
    } else {
      results.push('F');
      sink.fail(
        'amount',
        'F',
        SupportAccessReason.AMOUNT_LIMIT,
        { limit: 'maxDiscountPercent', max: amount.maxDiscountPercent },
        approvable,
        'amount.maxDiscountPercent',
      );
    }
  }
  let dayKey: UsageKey | undefined;
  if (amount.perDayMax !== undefined) {
    const period = periodKey('DAY', now, zone);
    if (!facts?.usage || !period) {
      results.push('I');
      sink.fail(
        'amount',
        'I',
        SupportAccessReason.AMOUNT_UNKNOWN,
        { indeterminate: true, limit: 'perDayMax' },
        false,
        'amount.perDayMax',
      );
    } else {
      dayKey = {
        metric: 'AMOUNT',
        per: 'DAY',
        period,
        scope: 'GRANT',
        subject: options.grantId ?? '',
        bucket: atom,
      };
      const reading = facts.usage(dayKey);
      const total = reading.used + given.minorUnits;
      const ok = total <= amount.perDayMax * 100;
      sink.readings.push({
        key: dayKey,
        metric: 'AMOUNT',
        per: 'DAY',
        max: amount.perDayMax * 100,
        used: reading.used,
        ok,
        ...(nextResetAt('DAY', now, zone)
          ? { resetsAt: nextResetAt('DAY', now, zone)?.toISOString() }
          : {}),
      });
      if (ok) results.push('T');
      else {
        results.push('F');
        sink.fail(
          'amount',
          'F',
          SupportAccessReason.AMOUNT_LIMIT,
          { limit: 'perDayMax', max: amount.perDayMax },
          approvable,
          'amount.perDayMax',
        );
      }
    }
  }
  if (results.length === 0) results.push('T');
  const tri = and(results);
  sink.predicates.amount = tri;
  if (tri === 'T' && dayKey)
    sink.usage.push({ key: dayKey, amount: given.minorUnits });
}
