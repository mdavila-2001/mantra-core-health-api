/**
 * Superficie pública de la capa de trazas distribuidas (`src/observability`).
 *
 * Los módulos de dominio importan **solo desde aquí**. Nada bajo `src/modules/`
 * debe importar `@opentelemetry/*` ni rutas internas de esta carpeta: esa es la
 * frontera que mantiene el dominio desacoplado del backend de trazas.
 */

export { ObservabilityModule } from './observability.module';
export {
  TracingService,
  markSpanError,
  runInTracedSpan,
} from './tracing.service';
export type {
  TraceSpan,
  TraceAttributes,
  TraceAttributeValue,
} from './tracing.service';
export {
  TraceContextService,
  currentTraceContext,
} from './trace-context.service';
export type { TraceLogContext } from './trace-context.service';
export { MessagingTraceService } from './messaging-trace.service';
export type { TraceCarrier, CarrierPayload } from './messaging-trace.service';
export {
  TraceResponseInterceptor,
  applyTraceHeader,
} from './trace-response.interceptor';
export {
  APP_ATTR,
  TELEMETRY_CONFIG,
  TRACE_ID_HEADER,
  TRACE_CARRIER_KEY,
  EXCLUDED_HTTP_PATHS,
} from './telemetry.constants';
export {
  telemetryEnvSchema,
  loadTelemetryConfig,
  resolveServiceName,
} from './telemetry.config';
export type { TelemetryConfig } from './telemetry.types';

// `telemetry.bootstrap` NO se reexporta a propósito: importarlo tiene el efecto
// lateral de arrancar el SDK, y ese arranque debe ocurrir en un único sitio y
// en la primera línea del proceso. Quien lo necesite (los dos entrypoints y las
// pruebas del bootstrap) lo importa por su ruta directa.
