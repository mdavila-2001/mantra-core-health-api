/**
 * Tipos de la configuración de trazas distribuidas.
 *
 * Viven aparte de `telemetry.config.ts` para que el bootstrap, las
 * instrumentaciones y las pruebas puedan tipar la configuración sin arrastrar
 * Joi ni la lectura de `process.env`.
 */

/** Estrategias de muestreo soportadas (subconjunto de la especificación OTel). */
export type SamplerType =
  | 'always_on'
  | 'always_off'
  | 'traceidratio'
  | 'parentbased_always_on'
  | 'parentbased_always_off'
  | 'parentbased_traceidratio';

/** Niveles del diagnóstico interno del SDK. */
export type DiagLevel =
  'NONE' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE';

/** Configuración del exportador OTLP. */
export interface ExporterConfig {
  /**
   * Protocolo OTLP. Solo `http/protobuf`: es el único exportador instalado
   * (ver decisión D1). Cambiar a gRPC exige añadir su paquete, no solo esta
   * variable — por eso se valida en vez de aceptarse en silencio.
   */
  readonly protocol: 'http/protobuf';
  /** URL completa del receptor OTLP de trazas. */
  readonly endpoint: string;
  /** Tiempo máximo de una exportación antes de descartar el lote. */
  readonly timeoutMs: number;
}

/** Configuración del muestreo. */
export interface SamplerConfig {
  /** Estrategia. Por defecto `parentbased_traceidratio`. */
  readonly type: SamplerType;
  /** Proporción de trazas raíz conservadas, entre 0 y 1. */
  readonly ratio: number;
}

/** Configuración de telemetría ya validada y normalizada. */
export interface TelemetryConfig {
  /** Interruptor maestro. Con `false` no se crea SDK ni se abre conexión. */
  readonly enabled: boolean;
  /** `service.name`, p. ej. `alovida-api` o `alovida-worker-messaging`. */
  readonly serviceName: string;
  /** `service.namespace`. */
  readonly serviceNamespace: string;
  /** `service.version`. */
  readonly serviceVersion: string;
  /** `deployment.environment.name`. */
  readonly environment: string;
  /** Destino de las trazas. */
  readonly exporter: ExporterConfig;
  /** Estrategia de muestreo. */
  readonly sampler: SamplerConfig;
  /** Propagadores activos, en orden. */
  readonly propagators: readonly string[];
  /** Verbosidad del diagnóstico interno del SDK. */
  readonly diagLevel: DiagLevel;
  /** Si las respuestas HTTP incluyen la cabecera `x-trace-id`. */
  readonly responseHeaderEnabled: boolean;
}
