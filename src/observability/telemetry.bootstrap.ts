import { DiagLogLevel, diag, type DiagLogger } from '@opentelemetry/api';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type Sampler,
} from '@opentelemetry/sdk-trace-base';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { loadTelemetryConfig } from './telemetry.config';
import { buildInstrumentations } from './instrumentations';
import { registerTelemetryShutdown } from './telemetry.shutdown';
import type { TelemetryConfig } from './telemetry.types';

/**
 * Arranque del SDK de OpenTelemetry.
 *
 * **Debe ser la primera importación del proceso.** Las instrumentaciones
 * automáticas funcionan parcheando módulos en el momento en que Node los carga;
 * si `@nestjs/core`, `express`, `pg` o `ioredis` ya están cargados cuando este
 * archivo se evalúa, el parcheo llega tarde y no se emite ningún span. Por eso
 * `src/main.ts` y `src/worker/bootstrap.ts` lo importan por efecto lateral en su
 * primera línea, antes que ninguna otra cosa.
 *
 * El arranque es idempotente: importar este módulo dos veces (o llamar a
 * `startTelemetry()` de nuevo) devuelve la instancia ya creada en vez de
 * levantar un segundo SDK que duplicaría cada span.
 */

/** Instancia única del SDK del proceso. */
let sdk: NodeSDK | null = null;

/** Configuración con la que se arrancó, para que las pruebas puedan leerla. */
let activeConfig: TelemetryConfig | null = null;

/**
 * Canal de diagnóstico del propio SDK.
 *
 * Escribe NDJSON a `stderr` en vez de usar `console.log`: el backend emite todos
 * sus logs como JSON por línea (pino) y el agregador espera ese formato. No se
 * usa pino porque el SDK arranca antes de que exista `LoggingModule`.
 */
const diagLogger: DiagLogger = {
  error: (message, ...args) => writeDiag('error', message, args),
  warn: (message, ...args) => writeDiag('warn', message, args),
  info: (message, ...args) => writeDiag('info', message, args),
  debug: (message, ...args) => writeDiag('debug', message, args),
  verbose: (message, ...args) => writeDiag('trace', message, args),
};

/** Serializa una línea de diagnóstico del SDK al formato del resto de logs. */
function writeDiag(level: string, message: string, args: unknown[]): void {
  process.stderr.write(
    `${JSON.stringify({
      level,
      name: 'opentelemetry',
      msg: message,
      detail: args.length > 0 ? args.map(String) : undefined,
    })}\n`,
  );
}

/** Traduce el nivel configurado al enumerado del SDK. */
function toDiagLevel(level: TelemetryConfig['diagLevel']): DiagLogLevel {
  return DiagLogLevel[level];
}

/**
 * Construye el muestreador.
 *
 * `parentbased_*` respeta la decisión que ya tomó el servicio aguas arriba: si
 * un worker decidió muestrear una traza, la API no la descarta a mitad de
 * camino y la traza no queda partida.
 */
export function buildSampler(config: TelemetryConfig): Sampler {
  const { type, ratio } = config.sampler;

  switch (type) {
    case 'always_on':
      return new AlwaysOnSampler();
    case 'always_off':
      return new AlwaysOffSampler();
    case 'traceidratio':
      return new TraceIdRatioBasedSampler(ratio);
    case 'parentbased_always_on':
      return new ParentBasedSampler({ root: new AlwaysOnSampler() });
    case 'parentbased_always_off':
      return new ParentBasedSampler({ root: new AlwaysOffSampler() });
    case 'parentbased_traceidratio':
    default:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(ratio),
      });
  }
}

/**
 * Construye el propagador compuesto a partir de la lista configurada.
 *
 * Solo se soportan los dos estándares W3C. B3 (Zipkin) queda fuera a propósito:
 * no hay ningún sistema heredado en este ecosistema que lo exija y activarlo
 * duplicaría cabeceras en cada petición saliente.
 */
export function buildPropagator(config: TelemetryConfig): CompositePropagator {
  const propagators = [];
  if (config.propagators.includes('tracecontext')) {
    propagators.push(new W3CTraceContextPropagator());
  }
  if (config.propagators.includes('baggage')) {
    propagators.push(new W3CBaggagePropagator());
  }
  return new CompositePropagator({ propagators });
}

/** Construye el recurso que identifica a este proceso en la UI de trazas. */
function buildResource(config: TelemetryConfig) {
  return defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_NAMESPACE]: config.serviceNamespace,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
    }),
  );
}

/**
 * Inicializa el SDK si la telemetría está habilitada.
 *
 * Con `OTEL_ENABLED=false` devuelve `null` sin crear SDK, sin instalar
 * instrumentaciones y sin abrir ninguna conexión: el backend arranca exactamente
 * igual que antes de esta iniciativa.
 *
 * Un fallo al construir el SDK **no tumba el proceso**: se registra por el canal
 * de diagnóstico y el backend sigue arrancando sin trazas. La observabilidad no
 * puede ser un punto único de fallo de un sistema de salud.
 *
 * @param source entorno del que leer la configuración; parametrizado para poder
 *               probar sin contaminar `process.env`.
 */
export function startTelemetry(
  source: NodeJS.ProcessEnv = process.env,
): NodeSDK | null {
  if (sdk) return sdk;

  const config = loadTelemetryConfig(source);
  activeConfig = config;

  if (!config.enabled) return null;

  diag.setLogger(diagLogger, toDiagLevel(config.diagLevel));

  try {
    const exporter = new OTLPTraceExporter({
      url: config.exporter.endpoint,
      timeoutMillis: config.exporter.timeoutMs,
    });

    sdk = new NodeSDK({
      resource: buildResource(config),
      sampler: buildSampler(config),
      textMapPropagator: buildPropagator(config),
      // `BatchSpanProcessor` exporta en segundo plano, fuera de la ruta de la
      // petición: si Jaeger no responde, el lote se descarta pero ninguna
      // operación de negocio espera ni falla por ello.
      spanProcessors: [new BatchSpanProcessor(exporter)],
      instrumentations: buildInstrumentations(),
    });

    sdk.start();
    registerTelemetryShutdown(sdk);
    return sdk;
  } catch (error) {
    sdk = null;
    diag.error(
      'No se pudo inicializar OpenTelemetry; el backend continúa sin trazas',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/** Configuración con la que arrancó el proceso (o `null` si no se evaluó). */
export function getTelemetryConfig(): TelemetryConfig | null {
  return activeConfig;
}

/** Restablece el estado interno. Solo para pruebas. */
export function resetTelemetryForTests(): void {
  sdk = null;
  activeConfig = null;
}

// Efecto lateral: importar este módulo arranca la telemetría. Es la forma de
// garantizar que ocurre antes que cualquier otra importación del proceso.
startTelemetry();
