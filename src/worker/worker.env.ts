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
   * Configurada por defecto (no opt-in, a diferencia de `TS_RETENTION_POLICIES`):
   * apunta a `http://127.0.0.1:4100` porque un adapter que "falla siempre" es
   * peor que probar contra un doble de prueba honesto en desarrollo. En un
   * entorno real esto debe apuntar al proveedor real (o quedar vacío para
   * volver al adapter por defecto, que falla visible en vez de fingir éxito).
   */
  MOCK_PROVIDER_BASE_URL: Joi.string()
    .uri()
    .allow('')
    .default('http://127.0.0.1:4100'),
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

/** Lee la configuración del worker desde `process.env`. */
export function loadWorkerEnv(): WorkerEnv {
  return {
    apiBaseUrl: process.env.WORKER_API_BASE_URL ?? 'http://127.0.0.1:3000',
    httpTimeoutMs: Number(process.env.WORKER_HTTP_TIMEOUT_MS ?? 30_000),
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
