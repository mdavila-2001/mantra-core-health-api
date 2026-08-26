import type { WebAnalyticsPort } from '../domain/web-analytics.port';
import {
  loadWebAnalyticsEnv,
  type WebAnalyticsEnv,
} from '../web-analytics.env';
import type { DisabledWebAnalyticsAdapter } from './disabled-web-analytics.adapter';
import type { GoogleAnalyticsAdapter } from './google-analytics/google-analytics.adapter';

/** Adaptadores candidatos, ya construidos por el contenedor. */
export interface WebAnalyticsAdapters {
  /** Adaptador que no reenvía nada. */
  disabled: DisabledWebAnalyticsAdapter;
  /** Adaptador del Measurement Protocol de GA4. */
  googleAnalytics: GoogleAnalyticsAdapter;
}

/**
 * Elige el adaptador de analítica web que publica `WEB_ANALYTICS_PORT`.
 *
 * Vive fuera del módulo por una razón concreta: la selección es la decisión que
 * más fácilmente se rompe en silencio —un despliegue creyendo que mide y sin
 * medir— y aquí se puede probar sin levantar el ORM entero que arrastra
 * `TelemetryModule`.
 *
 * El interruptor `TELEMETRY_WEB_ANALYTICS_ENABLED` manda sobre el proveedor: un
 * incidente se apaga con una variable booleana, sin tener que recordar a qué
 * valor había que devolver el proveedor.
 *
 * @param adapters - Adaptadores disponibles.
 * @param env - Configuración; por defecto, la del entorno del proceso.
 * @returns Adaptador activo.
 * @throws Error si el proveedor configurado no tiene implementación cableada.
 */
export function selectWebAnalyticsAdapter(
  adapters: WebAnalyticsAdapters,
  env: WebAnalyticsEnv = loadWebAnalyticsEnv(),
): WebAnalyticsPort {
  if (!env.enabled) return adapters.disabled;
  switch (env.provider) {
    case 'none':
      return adapters.disabled;
    case 'google_analytics':
      return adapters.googleAnalytics;
    default:
      throw new Error(
        'TELEMETRY_WEB_ANALYTICS_PROVIDER no tiene implementación cableada',
      );
  }
}
