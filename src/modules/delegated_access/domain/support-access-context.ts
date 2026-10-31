import type {
  SupportCondition,
  UsageMetric,
  UsagePeriod,
} from './support-conditions';
import type { SupportAtomCode } from './support-permission-catalog';

/**
 * Contexto y hechos de una decisión de apoyo (CONTRATO-GOBIERNO §3.2): los
 * atributos del modelo NIST 800-162. Solo tipos puros: sin Nest ni MikroORM.
 */

/** Canal de mensajería que usa una acción (hoy los de `SendMessageDto`). */
export type SupportChannel = 'CHAT' | 'EMAIL';

/**
 * Lo que el llamador sabe de la acción. Todo es opcional: un llamador antiguo
 * no manda nada y sus átomos de alias no usan condiciones; un átomo con
 * condiciones SIN el atributo que necesita queda indeterminado (falla cerrado).
 */
export interface SupportAccessContext {
  /** Instante de la decisión; en la función pura manda el parámetro `now`. */
  readonly now?: Date;
  /** Paciente de la acción (cita, ficha, conversación). */
  readonly patientProfileId?: string;
  /** Inicio de la cita de la acción (el original, si se reprograma). */
  readonly appointmentStartAt?: Date;
  /** Destino de crear, reprogramar o dar turno sin cita. */
  readonly newAppointmentStartAt?: Date;
  /** Canales por los que sale el mensaje. */
  readonly channels?: readonly SupportChannel[];
  /** Monto de la operación, en unidades menores (centavos de Bs). */
  readonly amount?: {
    readonly currency: 'BOB';
    readonly minorUnits: number;
    readonly discountPercent?: number;
  };
  /** Lo que la persona aporta para cumplir obligaciones. */
  readonly proof?: {
    readonly reasonText?: string;
    /** Cuatro ojos ya aprobado y vigente para ESTA acción. */
    readonly approvalId?: string;
  };
  /** `true` en explicar/simular: no consume contadores y evalúa todo. */
  readonly peek?: boolean;
  /** Lo siguiente lo completa el servicio (PIP), nunca el cliente. */
  readonly ip?: string;
  readonly sessionId?: string;
  readonly deviceId?: string | null;
}

/** Banderas de restricción de un paciente (`patient_restriction_flags`). */
export type PatientFlag =
  'VIP' | 'CONFIDENTIAL' | 'STAFF_RELATIVE' | 'PROTECTED';

/** Clave de un contador de uso (límites y montos). */
export interface UsageKey {
  /** Qué se cuenta. */
  readonly metric: UsageMetric;
  /** Periodo de la ventana. */
  readonly per: UsagePeriod;
  /** Identificador del periodo en la zona de la organización (`2026-11-03`). */
  readonly period: string;
  /** `GRANT` cuenta por concesión; `PERSON` por persona. */
  readonly scope: 'GRANT' | 'PERSON';
  /** Id de la concesión (`GRANT`) o de la persona/vínculo (`PERSON`). */
  readonly subject: string;
  /** Grupo compartido del límite o, si no hay, el átomo. */
  readonly bucket: string;
  /** Paciente que se cuenta (solo `DISTINCT_PATIENTS`). */
  readonly patientProfileId?: string;
}

/** Lo que el contador sabe de una clave. */
export interface UsageReading {
  /** Cuántos van en la ventana. */
  readonly used: number;
  /** Cuántos quedan. */
  readonly remaining: number;
  /** `DISTINCT_PATIENTS`: el paciente ya figura en el conjunto de la ventana. */
  readonly alreadyCounted?: boolean;
  /** Cuándo se renueva, si el contador lo sabe (ventanas deslizantes). */
  readonly resetsAt?: Date;
}

/**
 * Hechos resueltos perezosamente por el servicio (PIP) y solo si algún permiso
 * candidato los necesita (`requiredFacets`). Un hecho ausente es
 * indeterminado: la condición que lo necesita no se cumple.
 */
export interface SupportAccessFacts {
  readonly patient?: {
    readonly ageYears?: number;
    readonly birthDateKnown: boolean;
    readonly isMinor?: boolean;
    readonly flags: readonly PatientFlag[];
    readonly insured?: boolean;
    readonly carrierIds?: readonly string[];
    readonly hasBookingInWindow?: (
      window: { daysBefore: number; daysAfter: number },
      coveredDoctors?: readonly string[],
    ) => boolean;
    readonly inCareTeamOf?: (practitionerProfileId: string) => boolean;
  };
  readonly session?: { readonly startedAt: Date };
  readonly network?: {
    readonly satisfiesOrgRules: boolean;
    readonly orgHasAllowRules: boolean;
  };
  readonly device?: { readonly trusted: boolean };
  readonly doctorOnline?: boolean;
  /** `null` = sin segundo paso vigente; `undefined` = no se pudo comprobar. */
  readonly stepUpAgeMinutes?: number | null;
  /** ¿La persona tiene un segundo factor inscrito? (para guiar el desafío). */
  readonly stepUpEnrolled?: boolean;
  /** Contadores de límites y montos (solo lectura; consumir es del llamador). */
  readonly usage?: (key: UsageKey) => UsageReading;
  /** Zona horaria de la organización (`directory.tenants.time_zone`). */
  readonly orgTimeZone?: string;
}

/** Una regla de la organización (L1) ya cargada y vigente. */
export interface GovernanceRuleFacts {
  readonly id: string;
  readonly kind:
    'DENY_PERMISSION' | 'CEILING' | 'REQUIRE_CONDITION' | 'FIELD_FLOOR';
  /** Plantilla a la que aplica; `null` o ausente = todas. */
  readonly roleTemplateCode?: string | null;
  /** Átomo o patrón (`billing.*`). */
  readonly permissionPattern: string;
  /** `DENY_PERMISSION`: texto para el usuario. */
  readonly message?: string;
  /** `REQUIRE_CONDITION`: la condición que se cruza con la del permiso. */
  readonly condition?: SupportCondition;
  /** `FIELD_FLOOR`: lo más completo que puede verse el campo. */
  readonly maxVisibility?: 'PARTIAL' | 'REDACT' | 'NULLIFY';
}

/** Átomo y condición con que llega un permiso (forma rica de `actions`). */
export interface AtomGrant {
  readonly atom: SupportAtomCode;
  /** `LEGACY` si vino de un alias; `ATOM` si se escribió como átomo. */
  readonly origin: 'LEGACY' | 'ATOM';
  /** Condición propia de este átomo dentro del permiso. */
  readonly condition?: SupportCondition | null;
}
