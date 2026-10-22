import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Datos de la petición que la bitácora necesita y que el servicio de dominio no
 * recibe por parámetro: de dónde vino (`ip`), con qué sesión (`sessionId`, para
 * resolver `device_id`) y quién actúa. Lo abre `AuditTrailInterceptor` por cada
 * request HTTP.
 */
export interface AuditRequestContext {
  /** Dirección de origen, ya validada como `inet`. */
  readonly ip?: string;
  /** `iam.sessions.token_id` del token, si lo trae. */
  readonly sessionId?: string;
  /** `iam.users.id` del actor autenticado. */
  readonly actorUserId?: string;
  /**
   * `iam.sessions.device_id` resuelto una vez por request (`null` = la sesión no
   * tiene dispositivo o no existe; `undefined` = todavía no se consultó).
   */
  deviceId?: string | null;
  /** Algún eslabón `success: true` se selló durante la petición. */
  sealedSuccess: boolean;
  /** Algún eslabón `success: false` se selló durante la petición. */
  sealedFailure: boolean;
}

const storage = new AsyncLocalStorage<AuditRequestContext>();

/** Ejecuta `fn` con el contexto de bitácora de la petición. */
export function runWithAuditRequestContext<T>(
  context: AuditRequestContext,
  fn: () => T,
): T {
  return storage.run(context, fn);
}

/** Contexto de bitácora activo, o `undefined` fuera de una petición HTTP. */
export function getAuditRequestContext(): AuditRequestContext | undefined {
  return storage.getStore();
}

/**
 * Registra que la petición ya dejó un eslabón en `audit_log`. Lo llama
 * `AuditLogRepository.append`, así cualquier camino —`AuditTrailService`,
 * `AuditEventsService` o el repositorio directo— evita que el interceptor
 * selle la misma petición dos veces.
 */
export function markAuditSealed(success: boolean): void {
  const context = storage.getStore();
  if (!context) return;
  if (success) context.sealedSuccess = true;
  else context.sealedFailure = true;
}
