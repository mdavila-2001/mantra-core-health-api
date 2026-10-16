import { SetMetadata } from '@nestjs/common';

/** Clave de metadata de `@Audited()`. */
export const AUDITED_KEY = 'audited';
/** Clave de metadata de `@NotAudited()`. */
export const NOT_AUDITED_KEY = 'notAudited';
/** Clave de metadata de `@AccessLogged()`. */
export const ACCESS_LOGGED_KEY = 'accessLogged';

/**
 * De dónde sale el identificador del recurso afectado: un parámetro de ruta
 * (`param:<nombre>`), un campo de la respuesta (`result.<campo>`) o del cuerpo
 * de la petición (`body.<campo>`). Sólo se sella si el valor es un UUID:
 * `audit_log.entity_id` es `uuid`.
 */
export type AuditIdSource =
  `param:${string}` | `result.${string}` | `body.${string}`;

/** Nombre de negocio del sello que el interceptor deja para una ruta que muta. */
export interface AuditedOptions {
  /** Verbo de negocio en pasado y MAYÚSCULAS, p. ej. `PERMISSION_SET_CREATED`. */
  readonly action: string;
  /** Tabla afectada en singular, p. ej. `delegated_permission_set`. */
  readonly entity: string;
  /** Origen del id del recurso; por defecto se deriva de la ruta. */
  readonly entityId?: AuditIdSource;
}

/**
 * Nombra el sello que `AuditTrailInterceptor` escribe en `audit.audit_log` al
 * terminar una ruta que muta. Toda ruta `POST/PUT/PATCH/DELETE` lleva este
 * decorador o `@NotAudited`: lo exige `audit-trail-coverage.spec.ts`. Si el
 * servicio ya selló la petición (patrón canónico atómico, §1.1 del informe C),
 * el interceptor no repite; la acción declarada acá debe ser la misma que usa
 * el servicio.
 */
export const Audited = (options: AuditedOptions) =>
  SetMetadata(AUDITED_KEY, options);

/**
 * Excluye una ruta (o un controlador entero) del sello transversal. El motivo es
 * obligatorio y debe nombrar el rastro alternativo o por qué no hace falta: las
 * rutas `@Public()` que mutan (sin actor no hay sello, `audit_log.user_id` es
 * NOT NULL) y la plomería de cola de los workers.
 */
export const NotAudited = (reason: string) =>
  SetMetadata(NOT_AUDITED_KEY, reason);

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
