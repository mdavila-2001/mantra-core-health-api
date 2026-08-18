/**
 * Errores del puerto de analítica web. Misma forma que los del proveedor de
 * TTS (`tts-provider.errors.ts`): un código estable para el log y una respuesta
 * cerrada a "¿se cura reintentando?", que es lo único que necesitan el
 * reintento y el cortacircuitos para decidir.
 *
 * La clasificación no es decorativa: reintentar un 401 sólo gasta cuota y
 * mantiene el circuito cerrado sobre una dependencia que no va a responder
 * distinto, mientras que no reintentar un 503 pierde eventos que sí se habrían
 * entregado un segundo después.
 */
export abstract class WebAnalyticsError extends Error {
  /** Código estable, apto para métricas y alertas. */
  abstract readonly code: string;
  /** `true` si el mismo envío puede tener éxito más tarde. */
  abstract readonly retryable: boolean;
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param message - Descripción legible del fallo.
   * @param retryAfterMs - Espera impuesta por el proveedor, si la declaró.
   */
  constructor(
    message: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

/** El proveedor pidió bajar el ritmo. */
export class WebAnalyticsRateLimitedError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_RATE_LIMITED';
  readonly retryable = true;
}

/** Credenciales rechazadas: reintentar no cambia nada. */
export class WebAnalyticsUnauthorizedError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_UNAUTHORIZED';
  readonly retryable = false;
}

/** El proveedor no contestó a tiempo. */
export class WebAnalyticsTimeoutError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_TIMEOUT';
  readonly retryable = true;
}

/** No hubo respuesta HTTP: DNS, TCP o corte de red. */
export class WebAnalyticsNetworkError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_NETWORK';
  readonly retryable = true;
}

/** El payload no le gustó al proveedor; reenviarlo igual tampoco. */
export class WebAnalyticsInvalidRequestError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_INVALID_REQUEST';
  readonly retryable = false;
}

/** Fallo del lado del proveedor; suele curarse solo. */
export class WebAnalyticsUnavailableError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_UNAVAILABLE';
  readonly retryable = true;
}

/** Falta configuración para hablar con el proveedor. */
export class WebAnalyticsNotConfiguredError extends WebAnalyticsError {
  readonly code = 'WEB_ANALYTICS_NOT_CONFIGURED';
  readonly retryable = false;
}
