// Carga el `.env` ANTES de que nadie lea `process.env` en este archivo.
//
// `loadWorkerEnv()` no se llama desde el ciclo de vida de Nest sino como
// `useValue` en `system-api-client.module.ts`, y un `useValue` se evalúa **al
// importar el módulo** — antes de que `ConfigModule.forRoot()` exista, y por
// tanto antes de que su dotenv haya corrido. El único otro `import
// 'dotenv/config'` del repo vive en `src/orm/config/orm.config.ts`, que se
// resuelve más tarde en la cadena. Resultado: sin esta línea, TODO lo que lee
// `loadWorkerEnv` caía a los defaults del código y el `.env` era decorativo
// para los 21 workers.
//
// El síntoma no era una variable vacía sino un worker que "andaba mal":
// tomaba `WORKER_API_BASE_URL` por defecto en vez de la del `.env` y el
// cortacircuitos de `system-api` quedaba abierto en bucle. En Docker no se
// notaba, porque Compose entrega las variables como entorno real del proceso
// y `process.env` ya las tiene antes de importar nada — sólo mordía a quien
// corriera un worker en el host.
//
// Va acá y no en `bootstrap.ts` a propósito: quien lee el entorno es este
// módulo, así que cualquier consumidor de `loadWorkerEnv` lo carga por
// importarlo, sin depender del orden de imports de cada entrypoint.
//
// No pisa nada en Docker: dotenv **no** sobrescribe variables que ya existen
// en `process.env`, así que lo que declara Compose sigue ganando.
import 'dotenv/config';

import * as Joi from 'joi';

/**
 * Esquema de entorno compartido por los 17 procesos worker
 * (`src/worker-<dominio>.ts`, arrancados vía `bootstrapWorker` en
 * `src/worker/bootstrap.ts`). Se concatena al esquema global de
 * `ConfigModule` en cada uno, igual que `authEnvSchema` en `AppModule`: una
 * URL o un intervalo mal escrito abortan el arranque, no el primer tick.
 */
export const workerEnvSchema = Joi.object({
  /** Base de la API contra la que el worker llama los endpoints `/internal/*`. */
  WORKER_API_BASE_URL: Joi.string().uri().default('http://127.0.0.1:3000'),
  WORKER_HTTP_TIMEOUT_MS: Joi.number().integer().min(1000).default(30_000),
  /**
   * Puerto de la sonda HTTP del worker (`/health`, `/readiness`, `/status`).
   * `0` la deshabilita. Es lo que permite a Docker/Kubernetes distinguir un
   * worker sano de uno con el tick colgado, que hasta ahora eran indistinguibles
   * desde fuera. Cada worker corre en su propio contenedor, así que el mismo
   * puerto en los 20 no colisiona; fuera de Docker, el que lo encuentre ocupado
   * arranca sin sonda y lo avisa (ver `worker-health.server.ts`).
   */
  WORKER_HEALTH_PORT: Joi.number().integer().min(0).max(65535).default(9100),
  /**
   * Plazo de un tick programado. No es el plazo de una llamada (eso es
   * `WORKER_HTTP_TIMEOUT_MS`) sino el techo tras el cual la ejecución se aborta
   * y se declara perdida. Generoso porque los ticks van desde subsegundo
   * (relevo del outbox) hasta minutos (compresión de chunks de `time_series`).
   */
  WORKER_TICK_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1000)
    .default(5 * 60_000),
  /**
   * Tiempo que un tick puede llevar en vuelo antes de que la liveness lo
   * declare atascado y el orquestador reinicie el proceso. Por encima del plazo
   * del tick a propósito: si el plazo funciona, el tick ya se abortó solo; que
   * se supere este umbral significa que ni siquiera el aborto surtió efecto,
   * que es la definición operativa de worker zombi.
   */
  WORKER_STUCK_TICK_MS: Joi.number()
    .integer()
    .min(1000)
    .default(10 * 60_000),
  /** Espera máxima a que terminen los ticks en vuelo durante el apagado. */
  WORKER_DRAIN_TIMEOUT_MS: Joi.number().integer().min(0).default(20_000),
  /**
   * Plazo total del apagado. Al agotarse, el proceso sale con código 1 dejando
   * en el log qué seguía pendiente. Debe quedar **por debajo** del plazo de
   * gracia del orquestador (10 s en `docker stop` por defecto,
   * `terminationGracePeriodSeconds` en Kubernetes): si no, quien fuerza la
   * salida es un `SIGKILL` mudo y se pierde justo el diagnóstico.
   */
  WORKER_SHUTDOWN_TIMEOUT_MS: Joi.number().integer().min(1000).default(30_000),
  /** Intentos totales de una llamada a la API, incluido el primero. */
  WORKER_HTTP_RETRY_ATTEMPTS: Joi.number().integer().min(1).max(10).default(3),
  /** Llamadas simultáneas a la API permitidas por proceso worker. */
  WORKER_HTTP_MAX_CONCURRENT: Joi.number()
    .integer()
    .min(1)
    .max(256)
    .default(16),
  /**
   * Códigos de `messaging.message_queues` que este worker debe drenar.
   * `message_queues` es catálogo de solo lectura para los 13 casos de uso del
   * módulo (no hay endpoint para listarlas activas); se configura aquí en vez
   * de inventar superficie nueva sobre un contrato ya cerrado.
   */
  MESSAGING_QUEUE_CODES: Joi.string().allow('').default(''),
  /** Umbral de compresión de chunks, uniforme para las 12 series de `time_series`. */
  TS_COMPRESSION_OLDER_THAN: Joi.string().max(50).default('7 days'),
  /** Tamaño de la ventana que se rematerializa en cada tick de rollups. */
  TS_ROLLUP_REFRESH_WINDOW_HOURS: Joi.number().integer().min(1).default(2),
  /**
   * Retención por tabla: `tabla=intervalo` separados por coma, p. ej.
   * `location_ping_series=30 days,telemetry_event_series=180 days`.
   * Deliberadamente **vacío por defecto** (opt-in): a diferencia de
   * comprimir (reversible, sólo cambia el formato de almacenamiento),
   * `drop_chunks` borra datos sin vuelta atrás, y cada serie de este módulo
   * declara una política de retención distinta por motivos de cumplimiento
   * (clínica vs. analítica vs. "corta, gobernada por consentimiento" — ver
   * los comentarios de `database/NoSQL/58_time_series_timescaledb`). Nadie
   * debería heredar una ventana de borrado que no configuró explícitamente.
   */
  TS_RETENTION_POLICIES: Joi.string().allow('').default(''),
  /**
   * Base URL de `mock-provider-server` (proyecto NestJS independiente en
   * `../mock-provider-server`, ver su README). Emula los tres proveedores
   * externos que este backend no conecta de verdad todavía: mensajería
   * (`notification-delivery.job.ts`), borrado cross-store
   * (`deletion-pipeline.job.ts`) y embeddings (`embedding-drain.job.ts`).
   *
   * Configurada por defecto FUERA DE PRODUCCIÓN (no opt-in, a diferencia de
   * `TS_RETENTION_POLICIES`): apunta a `http://127.0.0.1:4100` porque un adapter
   * que "falla siempre" es peor que probar contra un doble de prueba honesto en
   * desarrollo. En un entorno real esto debe apuntar al proveedor real, o quedar
   * vacío para volver al adapter por defecto, que falla visible en vez de fingir
   * éxito.
   *
   * El default es CONDICIONAL al entorno y no una constante. `ConfigModule`
   * escribe los defaults de Joi de vuelta en `process.env`
   * (`assignVariablesToProcess`, solo para claves ausentes), así que un default
   * fijo aquí gana siempre sobre cualquier comprobación posterior sobre
   * `process.env`: la guarda de producción de `loadWorkerEnv` nunca llegaría a
   * ver la variable vacía. Ver `assertMockProviderNotInProduction`.
   */
  MOCK_PROVIDER_BASE_URL: Joi.string()
    .uri()
    .allow('')
    .default(() =>
      process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:4100',
    ),
  MOCK_PROVIDER_API_KEY: Joi.string().allow('').default(''),
  /**
   * Proveedor real de envío de email para `NotificationDeliveryJob` (canal
   * EMAIL) vía Gmail API con OAuth2 de 3 patas (cuenta Gmail normal, no
   * Workspace: no hay delegación de dominio, así que se necesita un
   * `refresh_token` obtenido una vez con consentimiento interactivo — ver
   * `tools/google-oauth/get-refresh-token.mjs`). Las 4 deben estar presentes
   * para que `GoogleProviderWiringService` reemplace el adapter; si falta
   * alguna, el job sigue con el stub `PROVIDER_NOT_CONFIGURED` (o con
   * `mock-provider-server` si `MOCK_PROVIDER_BASE_URL` está configurada).
   * Si ambos proveedores están configurados a la vez, Google gana (el real
   * se registra después del mock en `messaging.worker-module.ts`).
   */
  GOOGLE_OAUTH_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_OAUTH_REFRESH_TOKEN: Joi.string().allow('').default(''),
  /** Buzón remitente real (debe ser la misma cuenta que otorgó el consentimiento OAuth2). */
  GOOGLE_SENDER_EMAIL: Joi.string().allow('').default(''),
}).unknown(true);

/**
 * Describe el contrato estructural de worker env.
 */
export interface WorkerEnv {
  apiBaseUrl: string;
  httpTimeoutMs: number;
  healthPort: number;
  tickTimeoutMs: number;
  stuckTickMs: number;
  drainTimeoutMs: number;
  shutdownTimeoutMs: number;
  httpRetryAttempts: number;
  httpMaxConcurrent: number;
  messagingQueueCodes: string[];
  tsCompressionOlderThan: string;
  tsRollupRefreshWindowHours: number;
  tsRetentionPolicies: Record<string, string>;
  mockProviderBaseUrl: string;
  mockProviderApiKey: string;
  googleOAuthClientId: string;
  googleOAuthClientSecret: string;
  googleOAuthRefreshToken: string;
  googleSenderEmail: string;
}

/**
 * Aborta el arranque si el emulador de proveedores está configurado en
 * producción.
 *
 * `mock-provider-server` **acepta por defecto toda verificación de identidad**:
 * su tasa de rechazo es 0, así que responde `ACCEPTED` tanto para el documento
 * de identidad de un paciente (`IDA_CHECK_TYPE_IDENTITY_CARD`) como para la
 * matrícula de un médico (`IDA_CHECK_TYPE_MEDICAL_LICENSE`). En producción eso
 * significaría dar por verificada la identidad y la habilitación profesional de
 * cualquiera, sin que ningún registro civil ni colegio médico haya dicho nada.
 *
 * No es una advertencia sino un fallo de arranque, en la misma línea que
 * `loadAuthEnv` con `JWT_SECRET`: un doble de prueba en producción no es una
 * configuración inusual que merezca un aviso, es un incidente de seguridad.
 *
 * @param source entorno a evaluar; se parametriza para poder probarlo sin
 *               contaminar `process.env`.
 */
export function assertMockProviderNotInProduction(
  source: NodeJS.ProcessEnv = process.env,
): void {
  if (source.NODE_ENV !== 'production') return;
  const configured = (source.MOCK_PROVIDER_BASE_URL ?? '').trim();
  if (configured.length === 0) return;

  throw new Error(
    'MOCK_PROVIDER_BASE_URL está configurada en producción ' +
      `("${configured}"). mock-provider-server acepta por defecto TODA ` +
      'verificación de identidad y de matrícula profesional (tasa de rechazo 0), ' +
      'así que el sistema daría por verificado a cualquiera. Deje la variable ' +
      'vacía para volver al adapter que falla visible, o apúntela al proveedor real.',
  );
}

/** Lee la configuración del worker desde `process.env`. */
export function loadWorkerEnv(): WorkerEnv {
  assertMockProviderNotInProduction();
  return {
    apiBaseUrl: process.env.WORKER_API_BASE_URL ?? 'http://127.0.0.1:3000',
    httpTimeoutMs: numberFromEnv('WORKER_HTTP_TIMEOUT_MS', 30_000),
    healthPort: numberFromEnv('WORKER_HEALTH_PORT', 9100),
    tickTimeoutMs: numberFromEnv('WORKER_TICK_TIMEOUT_MS', 5 * 60_000),
    stuckTickMs: numberFromEnv('WORKER_STUCK_TICK_MS', 10 * 60_000),
    drainTimeoutMs: numberFromEnv('WORKER_DRAIN_TIMEOUT_MS', 20_000),
    shutdownTimeoutMs: numberFromEnv('WORKER_SHUTDOWN_TIMEOUT_MS', 30_000),
    httpRetryAttempts: numberFromEnv('WORKER_HTTP_RETRY_ATTEMPTS', 3),
    httpMaxConcurrent: numberFromEnv('WORKER_HTTP_MAX_CONCURRENT', 16),
    messagingQueueCodes: (process.env.MESSAGING_QUEUE_CODES ?? '')
      .split(',')
      .map((code) => code.trim())
      .filter((code) => code.length > 0),
    tsCompressionOlderThan: process.env.TS_COMPRESSION_OLDER_THAN ?? '7 days',
    tsRollupRefreshWindowHours: Number(
      process.env.TS_ROLLUP_REFRESH_WINDOW_HOURS ?? 2,
    ),
    tsRetentionPolicies: parseRetentionPolicies(
      process.env.TS_RETENTION_POLICIES ?? '',
    ),
    mockProviderBaseUrl:
      process.env.MOCK_PROVIDER_BASE_URL ?? 'http://127.0.0.1:4100',
    mockProviderApiKey: process.env.MOCK_PROVIDER_API_KEY ?? '',
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? '',
    googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? '',
    googleOAuthRefreshToken: process.env.GOOGLE_OAUTH_REFRESH_TOKEN ?? '',
    googleSenderEmail: process.env.GOOGLE_SENDER_EMAIL ?? '',
  };
}

/**
 * Lee un número del entorno cayendo al valor por defecto si falta o no es
 * numérico. `Number(undefined)` es `NaN`, y un `NaN` propagado a un plazo
 * significa "sin plazo": el fallo más silencioso posible en una pieza cuyo
 * único trabajo es acotar el tiempo.
 */
function numberFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** `"a=1 day,b=30 days"` -> `{a: '1 day', b: '30 days'}`. Entradas mal formadas se ignoran. */
function parseRetentionPolicies(raw: string): Record<string, string> {
  const policies: Record<string, string> = {};
  for (const entry of raw.split(',')) {
    const [table, olderThan] = entry.split('=').map((part) => part.trim());
    if (table && olderThan) {
      policies[table] = olderThan;
    }
  }
  return policies;
}
