import { SetMetadata } from '@nestjs/common';

/** Clave de metadata de `@AuditTrail()`. */
export const AUDIT_TRAIL_KEY = 'auditTrail';
/** Clave de metadata de `@SkipAuditTrail()`. */
export const SKIP_AUDIT_TRAIL_KEY = 'skipAuditTrail';
/** Clave de metadata de `@AccessLogged()`. */
export const ACCESS_LOGGED_KEY = 'accessLogged';

/**
 * De dónde sale el identificador del recurso afectado: un parámetro de ruta
 * (`param:<nombre>`) o un campo del cuerpo de la respuesta (`result:<campo>`).
 * Sólo se sella si el valor es un UUID: `audit_log.entity_id` es `uuid`.
 */
export type AuditIdSource = `param:${string}` | `result:${string}`;

/** Nombre explícito del sello que el interceptor deja para una ruta que muta. */
export interface AuditTrailOptions {
  /** Verbo de negocio en pasado y MAYÚSCULAS, p. ej. `PERMISSION_SET_CREATED`. */
  readonly action: string;
  /** Tabla afectada en singular, p. ej. `delegated_permission_set`. */
  readonly entity: string;
  /** Origen del id del recurso; por defecto se deriva de la ruta. */
  readonly entityId?: AuditIdSource;
}

/**
 * Nombra el sello que `AuditTrailInterceptor` escribe en `audit.audit_log` al
 * terminar la ruta. Es opcional: sin él, el interceptor sella igual toda ruta
 * autenticada que muta, con una identidad derivada de la ruta
 * (`HTTP POST /clinical/observations`). Se usa donde el nombre de negocio
 * importa para quien lee la bitácora.
 */
export const AuditTrail = (options: AuditTrailOptions) =>
  SetMetadata(AUDIT_TRAIL_KEY, options);

/**
 * Excluye una ruta (o un controlador entero) del sello transversal. El motivo es
 * obligatorio y debe nombrar el rastro alternativo o por qué no hace falta; el
 * control de CI `alovida:audit-trail` exige además que la ruta figure en su
 * allowlist, para que una exclusión no entre sin revisión.
 */
export const SkipAuditTrail = (reason: string) =>
  SetMetadata(SKIP_AUDIT_TRAIL_KEY, reason);

/**
 * Paciente cuyo dato se lee: el propio actor (`actor`, rutas `/me`) o un
 * parámetro de ruta (`param:<nombre>`).
 */
export type AccessLoggedPatient = 'actor' | `param:${string}`;

/** Lectura de PHI que debe quedar en `audit.data_access_log`. */
export interface AccessLoggedOptions {
  /** Tipo de recurso leído, p. ej. `DIAGNOSTIC_REPORT`. */
  readonly resourceType: string;
  /** Paciente titular del dato, cuando la ruta lo identifica. */
  readonly patient?: AccessLoggedPatient;
  /** Parámetro de ruta con el id del recurso leído (`param:<nombre>`). */
  readonly resourceId?: `param:${string}`;
  /**
   * Propósito de uso declarado; por defecto `PATIENT_ACCESS` si el titular es el
   * actor y `TREATMENT` en otro caso.
   */
  readonly purpose?: string;
}

/**
 * Marca una lectura de PHI. `AuditTrailInterceptor` escribe la fila de
 * `audit.data_access_log` ANTES de ejecutar el handler y la confirma: sin
 * evidencia del acceso no hay lectura (forma de `ClinicalReadService`).
 */
export const AccessLogged = (options: AccessLoggedOptions) =>
  SetMetadata(ACCESS_LOGGED_KEY, options);
