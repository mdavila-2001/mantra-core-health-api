import * as Joi from 'joi';

/**
 * Configuración del reenvío de analítica web (módulo Telemetry, 28).
 *
 * Vive junto al módulo —como `audio.env.ts`— y no en `common/`, porque sólo
 * este dominio la consume. El esquema Joi se concatena en la validación global
 * de `AppModule`: si alguien activa el reenvío sin credenciales, el proceso
 * debe morir en el arranque y no en el primer evento del primer visitante.
 *
 * El valor por defecto es **apagado**. Un despliegue que no configure nada se
 * comporta exactamente igual que antes de existir este adaptador.
 */

/** Adaptadores de analítica web reconocidos por `TelemetryModule`. */
export const WEB_ANALYTICS_PROVIDERS = ['none', 'google_analytics'] as const;

/** Nombre de un adaptador de analítica web soportado. */
export type WebAnalyticsProviderName = (typeof WEB_ANALYTICS_PROVIDERS)[number];

/** Endpoint de recolección por defecto de Google Analytics 4. */
export const GA4_DEFAULT_ENDPOINT = 'https://www.google-analytics.com';

const DEFAULT_TIMEOUT_MS = 2_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_MS = 200;
const DEFAULT_MAX_CONCURRENCY = 4;
const DEFAULT_MAX_QUEUED = 64;
const DEFAULT_CB_FAILURE_THRESHOLD = 5;
const DEFAULT_CB_OPEN_MS = 30_000;
const DEFAULT_BATCH_TOLERANCE_MS = 1_000;
const DEV_SUBJECT_SALT = 'dev-only-web-analytics-salt-change-before-production';
const MIN_PROD_SALT_LENGTH = 16;

/** Esquema de validación del entorno de analítica web. */
export const webAnalyticsEnvSchema = Joi.object({
  TELEMETRY_WEB_ANALYTICS_ENABLED: Joi.boolean().default(false),
  TELEMETRY_WEB_ANALYTICS_PROVIDER: Joi.string()
    .valid(...WEB_ANALYTICS_PROVIDERS)
    .default('none'),
  TELEMETRY_WEB_ANALYTICS_TIMEOUT_MS: Joi.number()
    .integer()
    .min(200)
    .max(30_000)
    .default(DEFAULT_TIMEOUT_MS),
  TELEMETRY_WEB_ANALYTICS_MAX_RETRIES: Joi.number()
    .integer()
    .min(0)
    .max(5)
    .default(DEFAULT_MAX_RETRIES),
  TELEMETRY_WEB_ANALYTICS_RETRY_BASE_MS: Joi.number()
    .integer()
    .min(50)
    .max(10_000)
    .default(DEFAULT_RETRY_BASE_MS),
  TELEMETRY_WEB_ANALYTICS_MAX_CONCURRENCY: Joi.number()
    .integer()
    .min(1)
    .max(64)
    .default(DEFAULT_MAX_CONCURRENCY),
  TELEMETRY_WEB_ANALYTICS_MAX_QUEUED: Joi.number()
    .integer()
    .min(0)
    .max(4_096)
    .default(DEFAULT_MAX_QUEUED),
  TELEMETRY_WEB_ANALYTICS_CB_FAILURE_THRESHOLD: Joi.number()
    .integer()
    .min(2)
    .max(50)
    .default(DEFAULT_CB_FAILURE_THRESHOLD),
  TELEMETRY_WEB_ANALYTICS_CB_OPEN_MS: Joi.number()
    .integer()
    .min(1_000)
    .max(300_000)
    .default(DEFAULT_CB_OPEN_MS),
  TELEMETRY_WEB_ANALYTICS_SITE_URL: Joi.string().uri().allow('').default(''),
  TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT: Joi.string()
    .allow('')
    .default(() =>
      process.env.NODE_ENV === 'production' ? '' : DEV_SUBJECT_SALT,
    ),
  GA4_MEASUREMENT_ID: Joi.string()
    .pattern(/^G-[A-Z0-9]+$/u)
    .allow('')
    .default(''),
  GA4_API_SECRET: Joi.string().allow('').default(''),
  GA4_ENDPOINT: Joi.string().uri().default(GA4_DEFAULT_ENDPOINT),
  GA4_DEBUG_VALIDATION: Joi.boolean().default(false),
  GA4_AD_USER_DATA: Joi.boolean().default(false),
  GA4_AD_PERSONALIZATION: Joi.boolean().default(false),
  GA4_BATCH_TIME_TOLERANCE_MS: Joi.number()
    .integer()
    .min(0)
    .max(60_000)
    .default(DEFAULT_BATCH_TOLERANCE_MS),
}).unknown(true);

/** Configuración efectiva del reenvío de analítica web. */
export interface WebAnalyticsEnv {
  /** Reenvío activado. Con `false` se cablea siempre el adaptador `disabled`. */
  enabled: boolean;
  /** Adaptador seleccionado. */
  provider: WebAnalyticsProviderName;
  /** Plazo por petición al proveedor. */
  timeoutMs: number;
  /** Reintentos adicionales ante fallo transitorio. */
  maxRetries: number;
  /** Ventana base del backoff exponencial. */
  retryBaseMs: number;
  /** Envíos simultáneos permitidos hacia el proveedor. */
  maxConcurrency: number;
  /** Envíos en espera antes de rechazar por saturación. */
  maxQueued: number;
  /** Fallos consecutivos que abren el cortacircuitos. */
  circuitFailureThreshold: number;
  /** Tiempo que el cortacircuitos permanece abierto. */
  circuitOpenMs: number;
  /**
   * Origen público del portal. Con él se compone la `page_location` que GA4
   * necesita para poblar sus informes de página; sin él, las vistas se agrupan
   * bajo "(not set)".
   */
  siteUrl: string;
  /** Sal con la que se deriva el identificador que ve el proveedor. */
  subjectSalt: string;
  /** Identificador de flujo de datos GA4 (`G-XXXXXXX`). */
  ga4MeasurementId: string;
  /** Secreto de API del flujo de datos GA4. */
  ga4ApiSecret: string;
  /** Host de recolección (sustituible por `region1.` o por un doble en pruebas). */
  ga4Endpoint: string;
  /** Usa `/debug/mp/collect` y registra los mensajes de validación. */
  ga4DebugValidation: boolean;
  /** Declara consentimiento de uso publicitario de los datos. */
  ga4AdUserData: boolean;
  /** Declara consentimiento de personalización publicitaria. */
  ga4AdPersonalization: boolean;
  /** Holgura temporal con la que se agrupan eventos en una misma petición. */
  ga4BatchToleranceMs: number;
}

/** Lee un booleano de entorno respetando el defecto del esquema. */
function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true';
}

/** Lee un entero de entorno respetando el defecto del esquema. */
function int(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value !== undefined && value !== ''
    ? parsed
    : fallback;
}

/**
 * Lee la configuración del reenvío sin exponer credenciales en logs.
 *
 * @returns Configuración efectiva ya normalizada.
 * @throws Error si el reenvío está activo pero le falta algo para funcionar de
 *   forma segura (credenciales de GA4, o una sal real en producción).
 */
export function loadWebAnalyticsEnv(): WebAnalyticsEnv {
  const enabled = bool(process.env.TELEMETRY_WEB_ANALYTICS_ENABLED, false);
  const provider = (process.env.TELEMETRY_WEB_ANALYTICS_PROVIDER ??
    'none') as WebAnalyticsProviderName;
  const subjectSalt =
    process.env.TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT ??
    (process.env.NODE_ENV === 'production' ? '' : DEV_SUBJECT_SALT);
  const ga4MeasurementId = process.env.GA4_MEASUREMENT_ID ?? '';
  const ga4ApiSecret = process.env.GA4_API_SECRET ?? '';

  const active = enabled && provider !== 'none';
  if (active && subjectSalt.length < MIN_PROD_SALT_LENGTH) {
    // Sin sal propia, el identificador que ve el proveedor es un hash del uuid
    // interno: cualquiera con el mismo uuid puede reconstruirlo y cruzar sus
    // datos con los nuestros. La sal es lo que rompe esa correlación.
    throw new Error(
      `TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT (>=${MIN_PROD_SALT_LENGTH} caracteres) es obligatoria con el reenvío de analítica activo`,
    );
  }
  if (active && provider === 'google_analytics') {
    if (!ga4MeasurementId || !ga4ApiSecret) {
      throw new Error(
        'El proveedor google_analytics requiere GA4_MEASUREMENT_ID y GA4_API_SECRET',
      );
    }
  }

  return {
    enabled,
    provider,
    timeoutMs: int(
      process.env.TELEMETRY_WEB_ANALYTICS_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS,
    ),
    maxRetries: int(
      process.env.TELEMETRY_WEB_ANALYTICS_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
    ),
    retryBaseMs: int(
      process.env.TELEMETRY_WEB_ANALYTICS_RETRY_BASE_MS,
      DEFAULT_RETRY_BASE_MS,
    ),
    maxConcurrency: int(
      process.env.TELEMETRY_WEB_ANALYTICS_MAX_CONCURRENCY,
      DEFAULT_MAX_CONCURRENCY,
    ),
    maxQueued: int(
      process.env.TELEMETRY_WEB_ANALYTICS_MAX_QUEUED,
      DEFAULT_MAX_QUEUED,
    ),
    circuitFailureThreshold: int(
      process.env.TELEMETRY_WEB_ANALYTICS_CB_FAILURE_THRESHOLD,
      DEFAULT_CB_FAILURE_THRESHOLD,
    ),
    circuitOpenMs: int(
      process.env.TELEMETRY_WEB_ANALYTICS_CB_OPEN_MS,
      DEFAULT_CB_OPEN_MS,
    ),
    siteUrl: (process.env.TELEMETRY_WEB_ANALYTICS_SITE_URL ?? '').replace(
      /\/+$/u,
      '',
    ),
    subjectSalt,
    ga4MeasurementId,
    ga4ApiSecret,
    ga4Endpoint: (process.env.GA4_ENDPOINT ?? GA4_DEFAULT_ENDPOINT).replace(
      /\/+$/u,
      '',
    ),
    ga4DebugValidation: bool(process.env.GA4_DEBUG_VALIDATION, false),
    ga4AdUserData: bool(process.env.GA4_AD_USER_DATA, false),
    ga4AdPersonalization: bool(process.env.GA4_AD_PERSONALIZATION, false),
    ga4BatchToleranceMs: int(
      process.env.GA4_BATCH_TIME_TOLERANCE_MS,
      DEFAULT_BATCH_TOLERANCE_MS,
    ),
  };
}
