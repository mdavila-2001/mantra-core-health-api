import { loadWebAnalyticsEnv } from '../../web-analytics.env';

/** Configuración concreta del cliente de Google Analytics 4. */
export interface GoogleAnalyticsConfig {
  /** Identificador del flujo de datos (`G-XXXXXXX`). */
  measurementId: string;
  /** Secreto de API del flujo de datos. */
  apiSecret: string;
  /** Host de recolección, ya sin barra final. */
  baseUrl: string;
  /** Envía a `/debug/mp/collect` y devuelve los mensajes de validación. */
  debugValidation: boolean;
  /** Plazo por petición. */
  timeoutMs: number;
  /** Reintentos adicionales ante fallo transitorio. */
  maxRetries: number;
  /** Ventana base del backoff. */
  retryBaseMs: number;
  /** Sal con la que se deriva el `client_id`. */
  subjectSalt: string;
  /** Holgura temporal con la que se agrupan eventos en una petición. */
  batchToleranceMs: number;
  /** Consentimiento de uso publicitario declarado por defecto. */
  adUserData: boolean;
  /** Consentimiento de personalización publicitaria declarado por defecto. */
  adPersonalization: boolean;
  /** Envíos simultáneos permitidos. */
  maxConcurrency: number;
  /** Envíos en espera antes de rechazar por saturación. */
  maxQueued: number;
  /** Fallos consecutivos que abren el cortacircuitos. */
  circuitFailureThreshold: number;
  /** Tiempo que el cortacircuitos permanece abierto. */
  circuitOpenMs: number;
}

/**
 * Deriva la configuración del cliente GA4 del entorno del módulo.
 *
 * Se lee entera en el arranque —como en `elevenlabs.config.ts`— para que un
 * despliegue mal configurado falle al construir el contenedor y no en la
 * primera visita de un usuario real.
 *
 * @returns Configuración lista para el cliente HTTP y el adaptador.
 */
export function loadGoogleAnalyticsConfig(): GoogleAnalyticsConfig {
  const env = loadWebAnalyticsEnv();
  return {
    measurementId: env.ga4MeasurementId,
    apiSecret: env.ga4ApiSecret,
    baseUrl: env.ga4Endpoint,
    debugValidation: env.ga4DebugValidation,
    timeoutMs: env.timeoutMs,
    maxRetries: env.maxRetries,
    retryBaseMs: env.retryBaseMs,
    subjectSalt: env.subjectSalt,
    batchToleranceMs: env.ga4BatchToleranceMs,
    adUserData: env.ga4AdUserData,
    adPersonalization: env.ga4AdPersonalization,
    maxConcurrency: env.maxConcurrency,
    maxQueued: env.maxQueued,
    circuitFailureThreshold: env.circuitFailureThreshold,
    circuitOpenMs: env.circuitOpenMs,
  };
}
