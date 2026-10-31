import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

/**
 * Puerto del sello de auditoría del personal de apoyo.
 *
 * Lo que la agenda necesita de la cadena de auditoría es una sola operación:
 * dejar un asiento (qué hizo la persona de apoyo, sobre qué cita, con qué
 * permiso y sobre la agenda de qué doctor) dentro de la transacción que recibe.
 * Qué módulo escribe la cadena es asunto de `audit`.
 */

/** Un asiento de la cadena de auditoría. */
export interface SupportAuditEntry {
  /** Acción de negocio (`SUPPORT_SCHEDULE_CANCEL`, `SUPPORT_ACCESS_VIA_GRANT`…). */
  readonly action: string;
  /** Recurso afectado. */
  readonly entity: string;
  /** Id del recurso. */
  readonly entityId?: string;
  /** Organización en la que se actuó. */
  readonly tenantId?: string;
  /** `false` para un intento rechazado. */
  readonly success?: boolean;
}

/** Lectura de un paciente por la persona de apoyo (quién vio al paciente X). */
export interface SupportPatientAccessEntry {
  /** Perfil del paciente cuyo dato se vio. */
  readonly patientProfileId: string;
  /** Organización en la que se leyó. */
  readonly tenantId: string;
  /** Tipo de recurso leído (`SUPPORT_AGENDA`). */
  readonly resourceType: string;
}

/** Sello de auditoría del personal de apoyo. */
export interface SupportAuditPort {
  /** Deja el asiento en la transacción `tx`, a nombre de `actor`. */
  record(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: SupportAuditEntry,
  ): Promise<void>;
  /**
   * Deja el asiento de acceso que nombra al paciente cuya cita se mostró
   * (`patient_profile_id`), sin ningún dato clínico, en la transacción `tx`.
   */
  recordPatientAccess(
    tx: EntityManager,
    actor: AuthenticatedUser,
    entry: SupportPatientAccessEntry,
  ): Promise<void>;
}

/** Token de inyección del sello de auditoría del personal de apoyo. */
export const SUPPORT_AUDIT_PORT = Symbol('SUPPORT_AUDIT_PORT');
