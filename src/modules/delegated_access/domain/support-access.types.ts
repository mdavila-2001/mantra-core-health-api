import type { AtomGrant, SupportAccessContext } from './support-access-context';
import type { PolicyTrace } from './support-policy-trace';
import type { SupportCondition } from './support-conditions';
import type { SupportActionInput } from './support-permission-catalog';
import type {
  ExpansionMode,
  FixedSnapshot,
  SupportTargetKind,
} from './support-targets';

/** Motivo estable de una decisión de acceso del personal de apoyo. */
export enum SupportAccessReason {
  /** Permitido: un permiso vigente cubre el objetivo y trae la acción. */
  ALLOWED = 'ALLOWED',
  /** La persona no tiene vínculo de apoyo con la organización. */
  NO_ENGAGEMENT = 'NO_ENGAGEMENT',
  /** El vínculo existe pero no está activo o está vencido o suspendido. */
  ENGAGEMENT_INACTIVE = 'ENGAGEMENT_INACTIVE',
  /** El doctor del objetivo todavía no aceptó a esta persona. */
  DOCTOR_NOT_ACCEPTED = 'DOCTOR_NOT_ACCEPTED',
  /** El doctor aceptó a la persona pero no le permitió responder en su nombre. */
  REPLY_NOT_ALLOWED_BY_DOCTOR = 'REPLY_NOT_ALLOWED_BY_DOCTOR',
  /** Ningún permiso vigente cubre el doctor, el servicio y el espacio de la cita. */
  NO_COVERING_GRANT = 'NO_COVERING_GRANT',
  /** Un permiso cubre la cita pero ninguno incluye la acción pedida. */
  ACTION_NOT_GRANTED = 'ACTION_NOT_GRANTED',
  /** El doctor, servicio o espacio indicado no pertenece a la organización. */
  TARGET_OUTSIDE_TENANT = 'TARGET_OUTSIDE_TENANT',
  // ── Nuevos (CONTRATO-GOBIERNO §8.4 y Anexo C); los de arriba no cambian ──
  /** L0: el átomo no se puede dar a personal de apoyo. */
  NOT_DELEGABLE = 'NOT_DELEGABLE',
  /** L1: una regla de la organización lo prohíbe. */
  ORG_RULE_DENY = 'ORG_RULE_DENY',
  /** Una concesión `DENY` aplica a este caso. */
  EXPLICIT_DENY = 'EXPLICIT_DENY',
  /** Falta completar el ingreso de la persona. */
  ONBOARDING_INCOMPLETE = 'ONBOARDING_INCOMPLETE',
  /** El permiso tiene una condición de una versión que este motor no lee. */
  CONDITION_UNREADABLE = 'CONDITION_UNREADABLE',
  /** Fuera del horario permitido. */
  TIME_WINDOW = 'TIME_WINDOW',
  /** Llegó al tope de acciones, pacientes distintos o similar. */
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  /** El paciente no está entre los que el permiso alcanza. */
  PATIENT_SCOPE = 'PATIENT_SCOPE',
  /** La edad del paciente está fuera de lo permitido. */
  PATIENT_AGE = 'PATIENT_AGE',
  /** No se conoce la edad del paciente y el permiso la exige. */
  PATIENT_AGE_UNKNOWN = 'PATIENT_AGE_UNKNOWN',
  /** El permiso solo alcanza pacientes con (o sin) seguro. */
  PATIENT_COVERAGE = 'PATIENT_COVERAGE',
  /** El paciente está reservado o excluido de este permiso. */
  PATIENT_EXCLUDED = 'PATIENT_EXCLUDED',
  /** La cita está fuera de las fechas permitidas. */
  APPOINTMENT_WINDOW = 'APPOINTMENT_WINDOW',
  /** Falta anticipación mínima para la cita. */
  LEAD_TIME = 'LEAD_TIME',
  /** La fecha pedida pasa del horizonte permitido. */
  HORIZON = 'HORIZON',
  /** El canal del mensaje no está permitido. */
  CHANNEL_NOT_ALLOWED = 'CHANNEL_NOT_ALLOWED',
  /** No se pudo saber por qué canal sale el mensaje. */
  CHANNEL_UNKNOWN = 'CHANNEL_UNKNOWN',
  /** La conexión no viene de la red de la organización. */
  NETWORK_NOT_ALLOWED = 'NETWORK_NOT_ALLOWED',
  /** El permiso pide red de la organización pero no hay redes definidas. */
  NETWORK_RULES_NOT_CONFIGURED = 'NETWORK_RULES_NOT_CONFIGURED',
  /** El equipo no es de confianza. */
  DEVICE_NOT_TRUSTED = 'DEVICE_NOT_TRUSTED',
  /** La sesión pasó del máximo permitido. */
  SESSION_TOO_LONG = 'SESSION_TOO_LONG',
  /** El doctor debe estar conectado. */
  DOCTOR_OFFLINE = 'DOCTOR_OFFLINE',
  /** El monto supera el límite. */
  AMOUNT_LIMIT = 'AMOUNT_LIMIT',
  /** No se informó el monto y el permiso lo limita. */
  AMOUNT_UNKNOWN = 'AMOUNT_UNKNOWN',
  /** Falta el motivo escrito. */
  REASON_REQUIRED = 'REASON_REQUIRED',
  /** Falta confirmar la identidad con el segundo paso. */
  STEP_UP_REQUIRED = 'STEP_UP_REQUIRED',
  /** No se pudo comprobar el segundo paso. */
  STEP_UP_UNAVAILABLE = 'STEP_UP_UNAVAILABLE',
  /** Falta la aprobación de otra persona (cuatro ojos). */
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  /** No se pudo dejar el registro obligatorio de la decisión. */
  DECISION_LOG_UNAVAILABLE = 'DECISION_LOG_UNAVAILABLE',
}

/** Efecto de una decisión. `CHALLENGE` pide algo más y NUNCA abre (`allowed = false`). */
export type SupportDecisionEffect = 'PERMIT' | 'DENY' | 'CHALLENGE';

/** Qué pide un desafío. */
export type SupportChallengeKind =
  'REASON' | 'STEP_UP' | 'APPROVAL' | 'STEP_UP_ENROLL';

/** Visibilidad de un campo en la decisión: completo o enmascarado. */
export type FieldVisibility = 'FULL' | 'PARTIAL' | 'REDACT' | 'NULLIFY';

/** De dónde sale una condición incumplida. */
export type ConditionSource = 'GRANT' | 'ATOM' | 'ORG_RULE';

/** Una condición que no se cumplió (`F`) o no se pudo determinar (`I`). */
export interface UnmetCondition {
  /** Clave de la condición: `time`, `appointment.leadTime`, `patients.exclude`… */
  readonly key: string;
  /** Motivo estable. */
  readonly code: SupportAccessReason;
  /** `F` = falso; `I` = indeterminado (faltó el dato). Ambos cierran. */
  readonly status: 'F' | 'I';
  /** Ruta dentro de la condición del permiso, del átomo o de la regla. */
  readonly path?: string;
  /** Qué condición la trajo. */
  readonly source?: ConditionSource;
  /** Regla de la organización de origen, si vino de una. */
  readonly ruleId?: string;
  /** Números reales: mínimos, usados, cuándo se renueva… */
  readonly details?: Readonly<Record<string, unknown>>;
  /** ¿Una aprobación de cuatro ojos la puede salvar? */
  readonly approvable?: boolean;
}

/** Veredicto de la política. Los tres primeros campos son los de siempre. */
export interface SupportAccessDecision {
  /** ¿Se permite la acción? Solo `true` si `effect = PERMIT`. */
  readonly allowed: boolean;
  /** Motivo estable. */
  readonly reason: SupportAccessReason;
  /** Permiso que habilitó (o desafió) la acción. */
  readonly grantId?: string;
  /** Efecto de la decisión. */
  readonly effect?: SupportDecisionEffect;
  /** Átomo evaluado. */
  readonly atom?: string;
  /** Condiciones que no se cumplieron. */
  readonly unmet?: readonly UnmetCondition[];
  /** Qué falta para abrir (solo `CHALLENGE`). */
  readonly challenge?: {
    readonly kind: SupportChallengeKind;
    readonly details: Readonly<Record<string, unknown>>;
  };
  /** Campos visibles y su máscara (ausente = el campo se anula). */
  readonly visibleFields?: Readonly<Record<string, FieldVisibility>>;
  /** Traza completa, solo si el llamador la pide. */
  readonly trace?: PolicyTrace;
}

/** Un permiso de apoyo con todo lo que la evaluación necesita saber de él. */
export interface SupportGrantFacts {
  /** Id del permiso. */
  readonly grantId: string;
  /** Tipo de objetivo. */
  readonly targetKind: SupportTargetKind;
  /** Perfil del doctor del objetivo (resuelto desde su asignación de rol). */
  readonly practitionerProfileId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacio del objetivo (edificio, piso, sala…). */
  readonly careSpaceId?: string;
  /** Sede del objetivo. */
  readonly practiceSiteId?: string;
  /** Modo de expansión. */
  readonly expansionMode: ExpansionMode;
  /** Foto congelada, solo para `FIXED`. */
  readonly snapshot?: FixedSnapshot;
  /** ¿Está activo (no revocado ni expirado)? */
  readonly active: boolean;
  /** Inicio de vigencia. */
  readonly validFrom?: Date;
  /** Fin de vigencia. */
  readonly validTo?: Date;
  /**
   * Acciones que el permiso incluye: códigos antiguos (alias, `origin LEGACY`)
   * o átomos (`origin ATOM`). Un alias se expande a su paquete.
   */
  readonly actions: readonly SupportActionInput[];
  /** `ALLOW` (por defecto) o `DENY`: una fila `DENY` usa la condición como «cuándo aplica». */
  readonly effect?: 'ALLOW' | 'DENY';
  /** Condición de todo el permiso (se cruza con la de cada átomo). */
  readonly condition?: SupportCondition | null;
  /** Átomos con su condición propia; gana sobre el mismo átomo de `actions`. */
  readonly atomGrants?: readonly AtomGrant[];
  /** `true` si la fila trae una condición que el motor no puede leer. */
  readonly unreadable?: boolean;
}

/** Aceptación de un doctor hacia una persona de apoyo. */
export interface DoctorAcceptanceFacts {
  /** Perfil del doctor que aceptó. */
  readonly practitionerProfileId: string;
  /** ¿Permitió que la persona responda mensajes en su nombre? */
  readonly mayReplyOnBehalf: boolean;
}

/** Un vínculo de apoyo con sus permisos y los doctores que aceptaron. */
export interface EngagementFacts {
  /** Id del vínculo. */
  readonly engagementId: string;
  /** ¿Estado activo (ni suspendido ni terminado)? */
  readonly active: boolean;
  /** Inicio de vigencia. */
  readonly validFrom?: Date;
  /** Fin de vigencia. */
  readonly validTo?: Date;
  /** Doctores que aceptaron a esta persona. */
  readonly acceptances: readonly DoctorAcceptanceFacts[];
  /** Permisos del vínculo. */
  readonly grants: readonly SupportGrantFacts[];
  /** Plantilla del vínculo (`SECRETARY`…): la usan las reglas de la organización. */
  readonly templateCode?: string | null;
  /** Persona de apoyo (contadores `scope: PERSON`). */
  readonly userId?: string;
  /** ¿Falta completar el ingreso? (solo si la organización lo exige y el vínculo es posterior). */
  readonly onboardingIncomplete?: boolean;
  /** Pendientes del ingreso, para el mensaje. */
  readonly onboardingPending?: readonly string[];
}

/** Lo que se quiere hacer: acción y objetivo (la cita o el recurso). */
export interface SupportAccessQuery {
  /** Acción pedida: un átomo o uno de los 15 códigos antiguos. */
  readonly action: SupportActionInput;
  /** Perfil del doctor de la cita. */
  readonly practitionerProfileId?: string;
  /** Asignaciones de rol del doctor de la cita (para las filas congeladas). */
  readonly practitionerRoleAssignmentIds?: readonly string[];
  /** Servicio de la cita. */
  readonly healthcareServiceId?: string;
  /** Espacio de la cita. */
  readonly careSpaceId?: string;
  /** Ruta materializada del espacio (`/sede/edificio/piso/sala/`). */
  readonly careSpacePath?: string;
  /** Sede que contiene el espacio de la cita. */
  readonly careSpaceSiteId?: string;
  /** Contexto de la acción (paciente, cita, canal, monto, pruebas…). Opcional. */
  readonly context?: SupportAccessContext;
}
