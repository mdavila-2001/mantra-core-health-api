import { basename, extname } from 'node:path';
import * as Joi from 'joi';
import {
  DEFAULT_SERVICE_NAMESPACE,
  SERVICE_PREFIX,
} from './telemetry.constants';
import type {
  DiagLevel,
  SamplerType,
  TelemetryConfig,
} from './telemetry.types';

/**
 * Configuración por entorno de las trazas distribuidas.
 *
 * Sigue el mismo patrón que `src/logging/logging.env.ts`: la validación vive en
 * una función pura y no en un proveedor inyectable, porque el SDK de
 * OpenTelemetry se inicializa **antes** de que exista el contenedor de
 * dependencias de NestJS (y antes incluso de que se importe NestJS). El esquema
 * se concatena además al `validationSchema` global de `ConfigModule` para que un
 * valor inválido aborte el arranque en vez de degradar en silencio.
 */

/** Puerto y ruta OTLP/HTTP estándar de un colector o de Jaeger all-in-one. */
const DEFAULT_ENDPOINT = 'http://localhost:4318/v1/traces';

/**
 * Esquema Joi de las variables `OTEL_*`.
 *
 * `OTEL_ENABLED` va apagado por defecto a propósito: activar la exportación de
 * trazas abre conexiones salientes desde 21 procesos, y eso debe ser una
 * decisión explícita del operador, no un efecto colateral de actualizar el repo.
 */
export const telemetryEnvSchema = Joi.object({
  OTEL_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  OTEL_SERVICE_NAME: Joi.string().max(120).allow('').default(''),
  OTEL_SERVICE_NAMESPACE: Joi.string()
    .max(60)
    .default(DEFAULT_SERVICE_NAMESPACE),
  OTEL_SERVICE_VERSION: Joi.string().max(60).allow('').default(''),
  OTEL_DEPLOYMENT_ENVIRONMENT: Joi.string().max(40).allow('').default(''),
  OTEL_EXPORTER_OTLP_PROTOCOL: Joi.string()
    .valid('http/protobuf')
    .default('http/protobuf'),
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: Joi.string()
    .uri()
    .default(DEFAULT_ENDPOINT),
  OTEL_EXPORT_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .max(120_000)
    .default(10_000),
  OTEL_TRACES_SAMPLER: Joi.string()
    .valid(
      'always_on',
      'always_off',
      'traceidratio',
      'parentbased_always_on',
      'parentbased_always_off',
      'parentbased_traceidratio',
    )
    .default('parentbased_traceidratio'),
  OTEL_TRACES_SAMPLER_ARG: Joi.number().min(0).max(1).default(1),
  OTEL_PROPAGATORS: Joi.string().default('tracecontext,baggage'),
  OTEL_DIAG_LOG_LEVEL: Joi.string()
    .valid('NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE')
    .default('ERROR'),
  OTEL_TRACE_RESPONSE_HEADER: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
}).unknown(true);

/** Forma cruda del entorno tras aplicar el esquema. */
interface RawTelemetryEnv {
  OTEL_ENABLED: boolean;
  OTEL_SERVICE_NAME: string;
  OTEL_SERVICE_NAMESPACE: string;
  OTEL_SERVICE_VERSION: string;
  OTEL_DEPLOYMENT_ENVIRONMENT: string;
  OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf';
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: string;
  OTEL_EXPORT_TIMEOUT_MS: number;
  OTEL_TRACES_SAMPLER: SamplerType;
  OTEL_TRACES_SAMPLER_ARG: number;
  OTEL_PROPAGATORS: string;
  OTEL_DIAG_LOG_LEVEL: DiagLevel;
  OTEL_TRACE_RESPONSE_HEADER: boolean;
}

/**
 * Deriva el nombre del servicio del entrypoint que arrancó el proceso.
 *
 * Los 21 procesos comparten imagen y `.env`; lo único que los distingue es el
 * archivo que Node ejecuta (`dist/src/main.js` frente a
 * `dist/src/worker-messaging.js`). Derivarlo de ahí evita tener que declarar 21
 * valores de `OTEL_SERVICE_NAME` en `docker-compose.yml` y, sobre todo, evita el
 * error operativo clásico: veinte workers exportando bajo el nombre de la API.
 *
 * `OTEL_SERVICE_NAME`, si está presente, siempre gana.
 *
 * @param entrypoint ruta del script en ejecución; se parametriza para poder
 *                   probar la derivación sin manipular `process.argv`.
 */
export function resolveServiceName(
  entrypoint: string | undefined = process.argv[1],
): string {
  if (!entrypoint) return `${SERVICE_PREFIX}-api`;

  const name = basename(entrypoint, extname(entrypoint));
  if (name.startsWith('worker-')) {
    return `${SERVICE_PREFIX}-worker-${name.slice('worker-'.length)}`;
  }
  return `${SERVICE_PREFIX}-api`;
}

/**
 * Valida el entorno de telemetría y lo devuelve tipado.
 *
 * @param source entorno a validar; se parametriza para poder testearlo sin
 *               contaminar `process.env`.
 */
export function loadTelemetryConfig(
  source: NodeJS.ProcessEnv = process.env,
): TelemetryConfig {
  const result = telemetryEnvSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  }) as Joi.ValidationResult<RawTelemetryEnv>;

  if (result.error) {
    throw new Error(
      `Configuración de telemetría inválida: ${result.error.message}`,
    );
  }

  const env = result.value;

  return {
    enabled: env.OTEL_ENABLED,
    serviceName: env.OTEL_SERVICE_NAME || resolveServiceName(),
    serviceNamespace: env.OTEL_SERVICE_NAMESPACE,
    // `npm_package_version` lo exporta Yarn al ejecutar cualquier script del
    // proyecto; fuera de un script (p. ej. `node dist/src/main.js` dentro del
    // contenedor) no existe, y ahí la versión debe venir del despliegue.
    serviceVersion:
      env.OTEL_SERVICE_VERSION || process.env.npm_package_version || 'unknown',
    environment:
      env.OTEL_DEPLOYMENT_ENVIRONMENT || source.NODE_ENV || 'development',
    exporter: {
      protocol: env.OTEL_EXPORTER_OTLP_PROTOCOL,
      endpoint: env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
      timeoutMs: env.OTEL_EXPORT_TIMEOUT_MS,
    },
    sampler: {
      type: env.OTEL_TRACES_SAMPLER,
      ratio: env.OTEL_TRACES_SAMPLER_ARG,
    },
    propagators: env.OTEL_PROPAGATORS.split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    diagLevel: env.OTEL_DIAG_LOG_LEVEL,
    responseHeaderEnabled: env.OTEL_TRACE_RESPONSE_HEADER,
  };
}
