import type { EntityManager } from '@mikro-orm/postgresql';
import type { PatientFlag } from '../domain';

/**
 * Puertos del PIP (punto de información de la política) del personal de apoyo
 * (CONTRATO-GOBIERNO §8.7). `SupportAccessContextLoader` los usa para resolver
 * los hechos de una decisión SOLO cuando algún permiso candidato los necesita;
 * los adaptadores (`delegated_access/infrastructure/adapters/`) son los únicos
 * que conocen a `profiles`, `insurance`, `scheduling`, `authz`, `iam` y a la
 * presencia de `community`. Todos fallan cerrado: ante un error devuelven
 * «no se sabe» (`undefined`) y la condición que lo necesita queda indeterminada.
 */

/** Una cita del paciente en la organización (no cancelada ni rechazada). */
export interface PatientBookingFact {
  /** Inicio de la cita. */
  readonly startAt: Date;
  /** Perfil del doctor de la cita, si la agenda es de un doctor. */
  readonly practitionerProfileId?: string;
}

/** Lo que se sabe de un paciente para evaluar `patients` (y banderas). */
export interface PatientFactsRecord {
  /** Fecha de nacimiento (`YYYY-MM-DD`), si la hay. */
  readonly birthDate?: string;
  /** Banderas de restricción vigentes. */
  readonly flags: readonly PatientFlag[];
  /** ¿Tiene cobertura vigente hoy? `undefined` = no se pudo saber. */
  readonly insured?: boolean;
  /** Aseguradoras de las coberturas vigentes. */
  readonly carrierIds?: readonly string[];
  /** Citas dentro del rango pedido. */
  readonly bookings: readonly PatientBookingFact[];
  /** Doctores del equipo asistencial del paciente (relación activa o médico de cabecera). */
  readonly careTeam: readonly string[];
}

/** Qué pedirle al puerto de pacientes (solo lo que alguna condición necesita). */
export interface PatientFactsRequest {
  /** Organización. */
  readonly tenantId: string;
  /** Pacientes de la acción (uno para una decisión; muchos para una agenda). */
  readonly patientProfileIds: readonly string[];
  /** Instante de la decisión. */
  readonly now: Date;
  /** Cuántos días antes y después de hoy interesan las citas (0 = no se piden). */
  readonly bookingRange?: {
    readonly daysBefore: number;
    readonly daysAfter: number;
  };
  /** ¿Se necesita la cobertura? */
  readonly needsCoverage: boolean;
  /** ¿Se necesita el equipo asistencial? */
  readonly needsCareTeam: boolean;
  /** ¿Se necesita la fecha de nacimiento? */
  readonly needsBirthDate: boolean;
}

/** Hechos de paciente (banderas, edad, cobertura, citas, equipo). */
export interface PatientFactsPort {
  /**
   * Carga lo pedido de VARIOS pacientes con un número fijo de consultas (no una
   * por paciente: la agenda combinada de 200 citas hace las mismas que una).
   *
   * @returns Un registro por paciente conocido; un paciente que falta o un error
   *   de lectura (se lanza) dejan los hechos ausentes (falla cerrado).
   */
  loadMany(
    em: EntityManager,
    request: PatientFactsRequest,
  ): Promise<Map<string, PatientFactsRecord>>;
}

/** Lo que se sabe de la sesión del token (`iam.sessions`). */
export interface SessionRecord {
  /** Cuándo empezó (`created_at`; el refresco no lo reinicia). */
  readonly startedAt: Date;
  /** Dispositivo de la sesión, si lo tiene. */
  readonly deviceId?: string | null;
}

/** Sesión del token (`iam.sessions.token_id`). */
export interface SessionInfoPort {
  /** La sesión; `undefined` si no se puede resolver (falla cerrado). */
  find(
    em: EntityManager,
    sessionId: string,
  ): Promise<SessionRecord | undefined>;
}

/** Reglas de red de la organización (`authz.ip_access_rules`). */
export interface NetworkPolicyPort {
  /**
   * Evalúa el origen contra las reglas de red vigentes de la organización.
   *
   * @returns `satisfiesOrgRules` (el origen pasa) y `orgHasAllowRules` (la
   *   organización tiene al menos una regla `ALLOW`); `undefined` si no se pudo.
   */
  evaluate(
    em: EntityManager,
    tenantId: string,
    ip: string | undefined,
    now: Date,
  ): Promise<
    { satisfiesOrgRules: boolean; orgHasAllowRules: boolean } | undefined
  >;
}

/** Reconocimiento de dispositivos de `iam`. */
export interface DevicePort {
  /** ¿El dispositivo es de confianza de la persona? `undefined` = no se sabe. */
  isTrusted(
    em: EntityManager,
    userId: string,
    deviceId: string,
  ): Promise<boolean | undefined>;
}

/** Presencia del doctor (Redis, TTL 60 s). */
export interface PresencePort {
  /** ¿El doctor figura en línea? `undefined` = no se pudo leer la presencia. */
  isOnline(practitionerProfileId: string): Promise<boolean | undefined>;
}

/** Paso extra (segundo factor fresco) de la sesión, visto desde la política. */
export interface SupportStepUpPort {
  /**
   * Minutos desde el último paso extra de la sesión; `null` si no hay sello
   * vigente; `undefined` si no se pudo comprobar (Redis caído): la política niega
   * con `STEP_UP_UNAVAILABLE`, jamás lo toma por «sin sello» ni por «fresco».
   */
  ageMinutes(sessionId: string): Promise<number | null | undefined>;
  /** ¿La persona tiene un segundo factor inscrito? (guía el desafío). */
  isEnrolled(em: EntityManager, userId: string): Promise<boolean>;
}

/** Zona horaria de la organización (`directory.tenants.time_zone`). */
export interface TenantZonePort {
  /** Zona IANA; `undefined` si la organización no declara una. */
  timeZoneOf(em: EntityManager, tenantId: string): Promise<string | undefined>;
}

/** Tokens de inyección de los puertos del PIP. */
export const SUPPORT_PATIENT_FACTS_PORT = Symbol('SUPPORT_PATIENT_FACTS_PORT');
export const SUPPORT_SESSION_INFO_PORT = Symbol('SUPPORT_SESSION_INFO_PORT');
export const SUPPORT_NETWORK_POLICY_PORT = Symbol(
  'SUPPORT_NETWORK_POLICY_PORT',
);
export const SUPPORT_DEVICE_PORT = Symbol('SUPPORT_DEVICE_PORT');
export const SUPPORT_PRESENCE_PORT = Symbol('SUPPORT_PRESENCE_PORT');
export const SUPPORT_STEP_UP_PORT = Symbol('SUPPORT_STEP_UP_PORT');
export const SUPPORT_TENANT_ZONE_PORT = Symbol('SUPPORT_TENANT_ZONE_PORT');
