import * as Joi from 'joi';

/**
 * Configuración del dominio `audio_tts` (síntesis de voz cacheada).
 *
 * La comparten los dos procesos y por eso vive aquí y no bajo `src/worker`: la
 * API necesita la identidad de render (idioma, voz, formato) para calcular la
 * clave del asset y decidir un cache hit, y el worker necesita esa misma
 * identidad para pedirle al proveedor exactamente el audio que la clave
 * promete. Si cada proceso tuviera su copia, una divergencia de un solo campo
 * -otro formato por defecto, otra versión de voz- haría que el worker generase
 * un audio que la API nunca volvería a encontrar: cuota gastada en un asset
 * inalcanzable.
 *
 * El reparto de secretos, en cambio, sí es asimétrico y deliberado:
 *
 *   - `AUDIO_TTS_DATA_KEY` (cifrado del texto renderizado) solo la necesita la
 *     **API**: es quien cifra al encolar y descifra al entregar el trabajo.
 *   - `ELEVENLABS_API_KEY` solo la necesita el **worker**: es el único proceso
 *     que habla con el proveedor.
 *
 * Ninguno de los dos puede hacer el trabajo del otro, que es exactamente lo que
 * se quiere de una credencial de pago por uso.
 *
 * Sigue el patrón de `worker.env.ts` y `orm.env.ts`: un esquema Joi que se
 * concatena al `ConfigModule` global (una variable mal escrita aborta el
 * arranque, no el primer tick) y un cargador tipado que lee `process.env`.
 */

/** Proveedores de síntesis reconocidos. `fake` está prohibido en producción. */
export const AUDIO_TTS_PROVIDERS = ['disabled', 'fake', 'elevenlabs'] as const;
export type AudioTtsProviderName = (typeof AUDIO_TTS_PROVIDERS)[number];

/** Backends de almacenamiento del audio generado. */
export const AUDIO_STORAGE_DRIVERS = ['local', 's3'] as const;
export type AudioStorageDriver = (typeof AUDIO_STORAGE_DRIVERS)[number];

/**
 * Valor por defecto de la clave de cifrado, publicado en el repositorio.
 *
 * Existe para que un desarrollador pueda levantar el módulo sin `.env`, y está
 * explícitamente **bloqueado** fuera de `test` por `assertAudioTtsEnvCoherent`:
 * una clave que cualquiera puede leer en git no cifra nada. Mismo criterio que
 * `INSECURE_DEV_KEY` en `common/crypto/secret-cipher.ts`.
 */
export const PUBLISHED_DEV_DATA_KEY = 'dev-only-audio-data-key-change';

/** Longitud mínima de la clave de datos fuera de `test`. */
const MIN_DATA_KEY_LENGTH = 32;

export const audioTtsEnvSchema = Joi.object({
  // --- Interruptores de gasto -------------------------------------------------
  /** Interruptor maestro. `false` deja el módulo en modo solo-caché. */
  AUDIO_TTS_ENABLED: Joi.boolean().default(false),
  AUDIO_TTS_PROVIDER: Joi.string()
    .valid(...AUDIO_TTS_PROVIDERS)
    .default('disabled'),
  /**
   * Permite generar audio nuevo durante una petición de usuario. Separado del
   * interruptor maestro porque son decisiones distintas: se puede querer
   * pre-generar el catálogo (`prewarm`) sin abrir la puerta a que cada
   * onboarding gaste cuota del proveedor.
   */
  AUDIO_TTS_ALLOW_RUNTIME_GENERATION: Joi.boolean().default(false),
  /**
   * Confirmación explícita de que la licencia del proveedor cubre el uso en
   * producción. Sin ella, en producción no se genera ni un audio: clonar o
   * sintetizar una voz de marca bajo un plan que no lo permite es un problema
   * contractual que ningún reintento arregla.
   */
  AUDIO_TTS_PROD_LICENSE_CONFIRMED: Joi.boolean().default(false),

  // --- Identidad del render --------------------------------------------------
  AUDIO_TTS_DEFAULT_LANGUAGE: Joi.string().min(2).max(20).default('es-419'),
  AUDIO_TTS_DEFAULT_FORMAT: Joi.string()
    .min(3)
    .max(64)
    .default('mp3_44100_128'),
  AUDIO_TTS_SAMPLE_RATE: Joi.number()
    .integer()
    .min(8000)
    .max(192_000)
    .default(44_100),
  AUDIO_TTS_VOICE_PROFILE: Joi.string()
    .min(1)
    .max(100)
    .default('brand_es_latam_v1'),
  AUDIO_TTS_VOICE_VERSION: Joi.number()
    .integer()
    .min(1)
    .max(100_000)
    .default(1),
  AUDIO_TTS_MODEL: Joi.string().min(1).max(128).default('eleven_v3'),
  AUDIO_TTS_GLOBAL_FALLBACK_TEMPLATE: Joi.string()
    .min(1)
    .max(160)
    .default('onboarding.fallback.generic'),
  AUDIO_TTS_MAX_TEXT_LENGTH: Joi.number()
    .integer()
    .min(16)
    .max(20_000)
    .default(5000),

  // --- Presupuesto -----------------------------------------------------------
  AUDIO_TTS_MONTHLY_BUDGET_UNITS: Joi.number()
    .integer()
    .min(0)
    .max(1_000_000_000)
    .default(10_000),
  /** Colchón que nunca se gasta en generación runtime: reserva para incidentes. */
  AUDIO_TTS_SAFETY_RESERVE_UNITS: Joi.number()
    .integer()
    .min(0)
    .max(1_000_000_000)
    .default(1000),
  /**
   * Generaciones runtime por actor y día. **`0` significa bloqueado, no
   * ilimitado**: un límite ausente nunca debe interpretarse como permiso. Para
   * quitar el techo hay que declararlo con `AUDIO_TTS_ACTOR_LIMIT_UNLIMITED`.
   */
  AUDIO_TTS_RUNTIME_GENERATIONS_PER_ACTOR_DAY: Joi.number()
    .integer()
    .min(0)
    .max(10_000)
    .default(3),
  AUDIO_TTS_ACTOR_LIMIT_UNLIMITED: Joi.boolean().default(false),

  // --- Red y resiliencia del proveedor (solo worker) -------------------------
  AUDIO_TTS_REQUEST_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .max(120_000)
    .default(10_000),
  AUDIO_TTS_MAX_RESPONSE_BYTES: Joi.number()
    .integer()
    .min(1024)
    .max(268_435_456)
    .default(10_485_760),
  AUDIO_TTS_MIN_RESPONSE_BYTES: Joi.number()
    .integer()
    .min(16)
    .max(1_048_576)
    .default(256),
  /**
   * Reintentos dentro de una misma llamada al proveedor. Por defecto `0`: el
   * reintento de verdad lo aporta el ciclo de vida del asset (`attempts` +
   * lease), que sobrevive a una caída del proceso. Reintentar aquí además
   * multiplicaría el gasto de una petición que ya está facturada.
   */
  AUDIO_TTS_HTTP_MAX_RETRIES: Joi.number().integer().min(0).max(2).default(0),
  AUDIO_TTS_RETRY_BASE_MS: Joi.number()
    .integer()
    .min(100)
    .max(10_000)
    .default(500),
  AUDIO_TTS_MAX_CONCURRENCY: Joi.number().integer().min(1).max(32).default(2),
  AUDIO_TTS_MAX_REQUESTS_PER_SECOND: Joi.number()
    .positive()
    .max(100)
    .default(2),
  /**
   * Réplicas del worker. El ritmo se aplica por proceso, así que la cuota se
   * divide entre este número: sin él, escalar a 4 réplicas cuadruplica en
   * silencio el RPS real contra el proveedor.
   */
  AUDIO_TTS_REPLICA_COUNT: Joi.number().integer().min(1).max(512).default(1),
  AUDIO_TTS_BULKHEAD_QUEUE_SIZE: Joi.number()
    .integer()
    .min(0)
    .max(1024)
    .default(16),
  AUDIO_TTS_BULKHEAD_WAIT_MS: Joi.number()
    .integer()
    .min(0)
    .max(120_000)
    .default(15_000),
  AUDIO_TTS_CB_FAILURE_THRESHOLD: Joi.number()
    .integer()
    .min(2)
    .max(50)
    .default(5),
  AUDIO_TTS_CB_OPEN_MS: Joi.number()
    .integer()
    .min(1000)
    .max(300_000)
    .default(30_000),

  // --- Cifrado de campo (solo API) -------------------------------------------
  AUDIO_TTS_DATA_KEY: Joi.string().default(PUBLISHED_DEV_DATA_KEY),
  AUDIO_TTS_DATA_KEY_ID: Joi.string()
    .pattern(/^[a-z0-9_-]{1,32}$/u)
    .default('k1'),
  /** Claves anteriores para descifrar durante una rotación: `id:secreto[,id:secreto]`. */
  AUDIO_TTS_DATA_KEYS_PREVIOUS: Joi.string().allow('').default(''),

  // --- ElevenLabs (solo worker) ---------------------------------------------
  ELEVENLABS_API_KEY: Joi.string().allow('').default(''),
  ELEVENLABS_BASE_URL: Joi.string().uri().default('https://api.elevenlabs.io'),
  ELEVENLABS_VOICE_ID: Joi.string().allow('').default(''),
  /** Vacío = usar `AUDIO_TTS_MODEL`. Se separa porque el nombre del modelo es del proveedor. */
  ELEVENLABS_MODEL_ID: Joi.string().allow('').default(''),
  /** Vacío = usar `AUDIO_TTS_DEFAULT_FORMAT`. */
  ELEVENLABS_OUTPUT_FORMAT: Joi.string().allow('').default(''),

  // --- Ciclo de vida de la generación ---------------------------------------
  /**
   * Duración del lease de generación. Debe superar el plazo de la llamada al
   * proveedor: si expira antes, un segundo worker reclama el mismo asset
   * mientras el primero sigue esperando respuesta, y se paga dos veces el mismo
   * audio. La coherencia se comprueba en `assertAudioTtsEnvCoherent`.
   */
  AUDIO_GENERATION_LEASE_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(7200)
    .default(300),
  /** Intentos totales antes de declarar el asset FAILED_PERMANENT. */
  AUDIO_GENERATION_MAX_ATTEMPTS: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(4),
  /** Assets que el worker reclama por tick. */
  AUDIO_GENERATION_BATCH_SIZE: Joi.number().integer().min(1).max(64).default(2),
  /** Cadencia del tick de generación del worker. */
  AUDIO_GENERATION_INTERVAL_MS: Joi.number()
    .integer()
    .min(1000)
    .max(600_000)
    .default(5000),
  /** Espera antes de volver a reclamar un asset que falló de forma transitoria. */
  AUDIO_GENERATION_RETRY_DELAY_SECONDS: Joi.number()
    .integer()
    .min(0)
    .max(3600)
    .default(30),
  AUDIO_RECONCILE_INTERVAL_MS: Joi.number()
    .integer()
    .min(10_000)
    .max(86_400_000)
    .default(300_000),
  /** Antigüedad a partir de la cual un asset sin progreso se considera encallado. */
  AUDIO_RECONCILE_STALE_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(604_800)
    .default(900),
  AUDIO_RECONCILE_BATCH_SIZE: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(100),
  /** Retención del contador diario por actor (dato personal, no puede crecer sin fin). */
  AUDIO_RETENTION_ACTOR_DAILY_DAYS: Joi.number()
    .integer()
    .min(1)
    .max(3650)
    .default(90),

  // --- Almacenamiento --------------------------------------------------------
  AUDIO_STORAGE_DRIVER: Joi.string()
    .valid(...AUDIO_STORAGE_DRIVERS)
    .default('local'),
  AUDIO_LOCAL_STORAGE_PATH: Joi.string()
    .min(1)
    .default('./storage/audio-assets'),
  AUDIO_ALLOW_LOCAL_STORAGE_IN_PROD: Joi.boolean().default(false),
  AUDIO_SIGNED_URL_TTL_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(604_800)
    .default(900),
  AUDIO_S3_BUCKET: Joi.string().allow('').default(''),
  AUDIO_S3_REGION: Joi.string().default('auto'),
  AUDIO_S3_ENDPOINT: Joi.string().allow('').default(''),
  AUDIO_S3_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  AUDIO_S3_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  AUDIO_S3_FORCE_PATH_STYLE: Joi.boolean().default(true),
  AUDIO_S3_SSE: Joi.string().valid('', 'AES256', 'aws:kms').default('AES256'),
  AUDIO_S3_KMS_KEY_ID: Joi.string().allow('').default(''),

  /** Plantillas de arranque idempotentes. Se desactiva con `false` en producción gestionada. */
  AUDIO_TTS_SEED_TEMPLATES: Joi.boolean().default(true),
}).unknown(true);

/** Configuración tipada del dominio de audio. */
export interface AudioTtsConfig {
  nodeEnv: string;
  enabled: boolean;
  provider: AudioTtsProviderName;
  allowRuntimeGeneration: boolean;
  prodLicenseConfirmed: boolean;

  defaultLanguage: string;
  defaultFormat: string;
  sampleRate: number;
  voiceProfile: string;
  voiceVersion: number;
  model: string;
  globalFallbackTemplate: string;
  maxTextLength: number;

  monthlyBudgetUnits: number;
  safetyReserveUnits: number;
  runtimeGenerationsPerActorDay: number;
  actorLimitUnlimited: boolean;

  requestTimeoutMs: number;
  maxResponseBytes: number;
  minResponseBytes: number;
  httpMaxRetries: number;
  retryBaseMs: number;
  maxConcurrency: number;
  maxRequestsPerSecond: number;
  replicaCount: number;
  bulkheadQueueSize: number;
  bulkheadWaitMs: number;
  circuitFailureThreshold: number;
  circuitOpenMs: number;

  dataKey: string;
  dataKeyId: string;
  dataKeysPrevious: string;

  elevenLabsApiKey: string;
  elevenLabsBaseUrl: string;
  elevenLabsVoiceId: string;
  elevenLabsModelId: string;
  elevenLabsOutputFormat: string;

  leaseSeconds: number;
  maxAttempts: number;
  batchSize: number;
  generationIntervalMs: number;
  retryDelaySeconds: number;
  reconcileIntervalMs: number;
  reconcileStaleSeconds: number;
  reconcileBatchSize: number;
  actorDailyRetentionDays: number;

  storageDriver: AudioStorageDriver;
  localStoragePath: string;
  allowLocalStorageInProd: boolean;
  signedUrlTtlSeconds: number;
  s3Bucket: string;
  s3Region: string;
  s3Endpoint: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3ForcePathStyle: boolean;
  s3ServerSideEncryption: string;
  s3KmsKeyId: string;

  seedTemplates: boolean;
}

/**
 * Reglas que ninguna variable puede validar por su cuenta porque dependen de
 * otra. Se comprueban al construir la configuración —no en el primer uso— para
 * que una combinación incoherente aborte el arranque del proceso.
 *
 * @param config configuración ya materializada.
 * @throws Error con **todos** los problemas encontrados. Reportarlos de uno en
 *         uno obligaría a arrancar N veces para descubrir N errores.
 */
export function assertAudioTtsEnvCoherent(config: AudioTtsConfig): void {
  const problems: string[] = [];
  const isProd = config.nodeEnv === 'production';

  if (isProd && config.provider === 'fake') {
    problems.push(
      'AUDIO_TTS_PROVIDER=fake está prohibido en producción: sintetiza un tono, ' +
        'no voz, y el audio quedaría cacheado como válido para siempre.',
    );
  }
  if (
    isProd &&
    config.storageDriver === 'local' &&
    !config.allowLocalStorageInProd
  ) {
    problems.push(
      'AUDIO_STORAGE_DRIVER=local en producción: el audio viviría en el disco ' +
        'del contenedor y desaparecería en el siguiente despliegue. Use s3 o ' +
        'declare AUDIO_ALLOW_LOCAL_STORAGE_IN_PROD=true si el volumen es persistente.',
    );
  }

  // La clave se exige en todos los entornos salvo `test`: staging cifra datos
  // reales de personas reales.
  if (config.nodeEnv !== 'test') {
    if (config.dataKey.length < MIN_DATA_KEY_LENGTH) {
      problems.push(
        `AUDIO_TTS_DATA_KEY debe tener al menos ${MIN_DATA_KEY_LENGTH} caracteres.`,
      );
    }
    if (config.dataKey === PUBLISHED_DEV_DATA_KEY) {
      problems.push(
        'AUDIO_TTS_DATA_KEY conserva el valor por defecto, que está publicado en ' +
          'el repositorio: el texto quedaría cifrado con una clave conocida.',
      );
    }
  }

  if (config.enabled && config.provider === 'elevenlabs') {
    if (!config.elevenLabsApiKey) {
      problems.push(
        'ELEVENLABS_API_KEY es obligatoria con AUDIO_TTS_PROVIDER=elevenlabs.',
      );
    }
    if (!config.elevenLabsVoiceId) {
      problems.push(
        'ELEVENLABS_VOICE_ID es obligatoria con AUDIO_TTS_PROVIDER=elevenlabs.',
      );
    }
  }
  if (config.storageDriver === 's3' && !config.s3Bucket) {
    problems.push(
      'AUDIO_S3_BUCKET es obligatorio con AUDIO_STORAGE_DRIVER=s3.',
    );
  }
  if (config.s3AccessKeyId && !config.s3SecretAccessKey) {
    problems.push(
      'AUDIO_S3_SECRET_ACCESS_KEY falta pese a haberse definido AUDIO_S3_ACCESS_KEY_ID.',
    );
  }
  if (config.s3ServerSideEncryption === 'aws:kms' && !config.s3KmsKeyId) {
    problems.push(
      'AUDIO_S3_KMS_KEY_ID es obligatorio con AUDIO_S3_SSE=aws:kms.',
    );
  }

  if (config.leaseSeconds * 1000 <= config.requestTimeoutMs) {
    problems.push(
      `AUDIO_GENERATION_LEASE_SECONDS (${config.leaseSeconds} s) debe superar ` +
        `AUDIO_TTS_REQUEST_TIMEOUT_MS (${config.requestTimeoutMs} ms): si no, un ` +
        'segundo worker reclama el asset mientras el primero aún espera al ' +
        'proveedor y el audio se paga dos veces.',
    );
  }
  // Coherencia de contrapresión: el lote que el worker reclama tiene que caber
  // en lo que el mamparo admite, o cada tick generaría rechazos artificiales que
  // consumen intentos del asset sin haber llamado al proveedor.
  const capacity = config.maxConcurrency + config.bulkheadQueueSize;
  if (config.batchSize > capacity) {
    problems.push(
      `AUDIO_GENERATION_BATCH_SIZE (${config.batchSize}) supera la capacidad del ` +
        `mamparo (${capacity} = AUDIO_TTS_MAX_CONCURRENCY + AUDIO_TTS_BULKHEAD_QUEUE_SIZE).`,
    );
  }
  if (config.safetyReserveUnits > config.monthlyBudgetUnits) {
    problems.push(
      'AUDIO_TTS_SAFETY_RESERVE_UNITS no puede superar AUDIO_TTS_MONTHLY_BUDGET_UNITS: ' +
        'el presupuesto utilizable sería cero y nada llegaría a generarse.',
    );
  }
  if (config.minResponseBytes >= config.maxResponseBytes) {
    problems.push(
      'AUDIO_TTS_MIN_RESPONSE_BYTES debe ser menor que AUDIO_TTS_MAX_RESPONSE_BYTES.',
    );
  }

  if (problems.length > 0) {
    throw new Error(
      `Configuración de audio_tts incoherente:\n- ${problems.join('\n- ')}`,
    );
  }
}

/**
 * Lee la configuración del dominio de audio desde `process.env`.
 *
 * @param source entorno a leer; se parametriza para poder probar combinaciones
 *               sin contaminar `process.env`.
 */
export function loadAudioTtsConfig(
  source: NodeJS.ProcessEnv = process.env,
): AudioTtsConfig {
  const config: AudioTtsConfig = {
    nodeEnv: source.NODE_ENV ?? 'development',
    enabled: bool(source.AUDIO_TTS_ENABLED, false),
    provider: enumValue(
      source.AUDIO_TTS_PROVIDER,
      AUDIO_TTS_PROVIDERS,
      'disabled',
    ),
    allowRuntimeGeneration: bool(
      source.AUDIO_TTS_ALLOW_RUNTIME_GENERATION,
      false,
    ),
    prodLicenseConfirmed: bool(source.AUDIO_TTS_PROD_LICENSE_CONFIRMED, false),

    defaultLanguage: text(source.AUDIO_TTS_DEFAULT_LANGUAGE, 'es-419'),
    defaultFormat: text(source.AUDIO_TTS_DEFAULT_FORMAT, 'mp3_44100_128'),
    sampleRate: int(source.AUDIO_TTS_SAMPLE_RATE, 44_100),
    voiceProfile: text(source.AUDIO_TTS_VOICE_PROFILE, 'brand_es_latam_v1'),
    voiceVersion: int(source.AUDIO_TTS_VOICE_VERSION, 1),
    model: text(source.AUDIO_TTS_MODEL, 'eleven_v3'),
    globalFallbackTemplate: text(
      source.AUDIO_TTS_GLOBAL_FALLBACK_TEMPLATE,
      'onboarding.fallback.generic',
    ),
    maxTextLength: int(source.AUDIO_TTS_MAX_TEXT_LENGTH, 5000),

    monthlyBudgetUnits: int(source.AUDIO_TTS_MONTHLY_BUDGET_UNITS, 10_000),
    safetyReserveUnits: int(source.AUDIO_TTS_SAFETY_RESERVE_UNITS, 1000),
    runtimeGenerationsPerActorDay: int(
      source.AUDIO_TTS_RUNTIME_GENERATIONS_PER_ACTOR_DAY,
      3,
    ),
    actorLimitUnlimited: bool(source.AUDIO_TTS_ACTOR_LIMIT_UNLIMITED, false),

    requestTimeoutMs: int(source.AUDIO_TTS_REQUEST_TIMEOUT_MS, 10_000),
    maxResponseBytes: int(source.AUDIO_TTS_MAX_RESPONSE_BYTES, 10_485_760),
    minResponseBytes: int(source.AUDIO_TTS_MIN_RESPONSE_BYTES, 256),
    httpMaxRetries: int(source.AUDIO_TTS_HTTP_MAX_RETRIES, 0),
    retryBaseMs: int(source.AUDIO_TTS_RETRY_BASE_MS, 500),
    maxConcurrency: int(source.AUDIO_TTS_MAX_CONCURRENCY, 2),
    maxRequestsPerSecond: float(source.AUDIO_TTS_MAX_REQUESTS_PER_SECOND, 2),
    replicaCount: int(source.AUDIO_TTS_REPLICA_COUNT, 1),
    bulkheadQueueSize: int(source.AUDIO_TTS_BULKHEAD_QUEUE_SIZE, 16),
    bulkheadWaitMs: int(source.AUDIO_TTS_BULKHEAD_WAIT_MS, 15_000),
    circuitFailureThreshold: int(source.AUDIO_TTS_CB_FAILURE_THRESHOLD, 5),
    circuitOpenMs: int(source.AUDIO_TTS_CB_OPEN_MS, 30_000),

    dataKey: text(source.AUDIO_TTS_DATA_KEY, PUBLISHED_DEV_DATA_KEY),
    dataKeyId: text(source.AUDIO_TTS_DATA_KEY_ID, 'k1'),
    dataKeysPrevious: source.AUDIO_TTS_DATA_KEYS_PREVIOUS ?? '',

    elevenLabsApiKey: source.ELEVENLABS_API_KEY ?? '',
    elevenLabsBaseUrl: text(
      source.ELEVENLABS_BASE_URL,
      'https://api.elevenlabs.io',
    ),
    elevenLabsVoiceId: source.ELEVENLABS_VOICE_ID ?? '',
    elevenLabsModelId: source.ELEVENLABS_MODEL_ID ?? '',
    elevenLabsOutputFormat: source.ELEVENLABS_OUTPUT_FORMAT ?? '',

    leaseSeconds: int(source.AUDIO_GENERATION_LEASE_SECONDS, 300),
    maxAttempts: int(source.AUDIO_GENERATION_MAX_ATTEMPTS, 4),
    batchSize: int(source.AUDIO_GENERATION_BATCH_SIZE, 2),
    generationIntervalMs: int(source.AUDIO_GENERATION_INTERVAL_MS, 5000),
    retryDelaySeconds: int(source.AUDIO_GENERATION_RETRY_DELAY_SECONDS, 30),
    reconcileIntervalMs: int(source.AUDIO_RECONCILE_INTERVAL_MS, 300_000),
    reconcileStaleSeconds: int(source.AUDIO_RECONCILE_STALE_SECONDS, 900),
    reconcileBatchSize: int(source.AUDIO_RECONCILE_BATCH_SIZE, 100),
    actorDailyRetentionDays: int(source.AUDIO_RETENTION_ACTOR_DAILY_DAYS, 90),

    storageDriver: enumValue(
      source.AUDIO_STORAGE_DRIVER,
      AUDIO_STORAGE_DRIVERS,
      'local',
    ),
    localStoragePath: text(
      source.AUDIO_LOCAL_STORAGE_PATH,
      './storage/audio-assets',
    ),
    allowLocalStorageInProd: bool(
      source.AUDIO_ALLOW_LOCAL_STORAGE_IN_PROD,
      false,
    ),
    signedUrlTtlSeconds: int(source.AUDIO_SIGNED_URL_TTL_SECONDS, 900),
    s3Bucket: source.AUDIO_S3_BUCKET ?? '',
    s3Region: text(source.AUDIO_S3_REGION, 'auto'),
    s3Endpoint: source.AUDIO_S3_ENDPOINT ?? '',
    s3AccessKeyId: source.AUDIO_S3_ACCESS_KEY_ID ?? '',
    s3SecretAccessKey: source.AUDIO_S3_SECRET_ACCESS_KEY ?? '',
    s3ForcePathStyle: bool(source.AUDIO_S3_FORCE_PATH_STYLE, true),
    s3ServerSideEncryption: source.AUDIO_S3_SSE ?? 'AES256',
    s3KmsKeyId: source.AUDIO_S3_KMS_KEY_ID ?? '',

    seedTemplates: bool(source.AUDIO_TTS_SEED_TEMPLATES, true),
  };

  assertAudioTtsEnvCoherent(config);
  return config;
}

/**
 * `Number(undefined)` es `NaN`, y un `NaN` propagado a un plazo significa "sin
 * plazo": el fallo más silencioso posible en una pieza cuyo trabajo es acotar.
 */
function int(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function float(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function text(raw: string | undefined, fallback: string): string {
  const value = (raw ?? '').trim();
  return value.length > 0 ? value : fallback;
}

/**
 * Booleano del entorno. Solo `'true'`/`'1'` activan: cualquier otro valor —una
 * cadena vacía, un `'yes'` mal escrito— deja el interruptor apagado, que es el
 * lado seguro cuando lo que hay al otro lado es una credencial de pago por uso.
 */
function bool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = raw.trim().toLowerCase();
  return value === 'true' || value === '1';
}

function enumValue<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = (raw ?? '').trim() as T;
  return allowed.includes(value) ? value : fallback;
}
