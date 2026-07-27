import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo integrations (prefijo `integrations:`).
 *
 * El esquema `integrations` modela sus estados, tipos y métodos como FK
 * `*_concept_id` a `terminology.catalog_concepts`. Aquí se declaran únicamente
 * los conceptos que los 12 casos de uso del módulo insertan; para los estados
 * genéricos reutilizables (p. ej. "activo") existe además `CONCEPTS.STATE_ACTIVE`
 * transversal, pero se prefieren conceptos propios cuando el ciclo de vida es
 * específico del dominio de integraciones (colas de mensajes, credenciales,
 * conexiones) para no acoplar la semántica de otros módulos.
 *
 * `INTEGRATIONS_CONCEPT_SEEDS` lo consume el agregador central del seed; `INTEG`
 * es el mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: INTEGRATIONS_CONCEPT_SEEDS, ids: INTEG } =
  defineModuleConcepts('integrations', {
    // --- Ciclo de vida de proveedor externo (external_providers.state_concept_id) ---
    PROVIDER_DRAFT: { code: 'INTEG_PROVIDER_DRAFT', display: 'Provider draft' },
    PROVIDER_ACTIVE: {
      code: 'INTEG_PROVIDER_ACTIVE',
      display: 'Provider active',
    },
    PROVIDER_INACTIVE: {
      code: 'INTEG_PROVIDER_INACTIVE',
      display: 'Provider inactive',
    },

    // --- Tipo de proveedor (external_providers.provider_type_concept_id) ---
    PROVIDER_TYPE_LAB: {
      code: 'INTEG_PROVIDER_TYPE_LAB',
      display: 'Laboratory provider',
    },
    PROVIDER_TYPE_INSURER: {
      code: 'INTEG_PROVIDER_TYPE_INSURER',
      display: 'Insurer provider',
    },
    PROVIDER_TYPE_GOV: {
      code: 'INTEG_PROVIDER_TYPE_GOV',
      display: 'Government provider',
    },
    PROVIDER_TYPE_GENERIC: {
      code: 'INTEG_PROVIDER_TYPE_GENERIC',
      display: 'Generic provider',
    },

    // --- Tipo de autenticación (external_providers.auth_type_concept_id) ---
    AUTH_OAUTH2: {
      code: 'INTEG_AUTH_OAUTH2',
      display: 'OAuth2 authentication',
    },
    AUTH_API_KEY: {
      code: 'INTEG_AUTH_API_KEY',
      display: 'API key authentication',
    },
    AUTH_HMAC: { code: 'INTEG_AUTH_HMAC', display: 'HMAC authentication' },

    // --- Ciclo de vida de conexión (provider_connections.state_concept_id) ---
    CONN_PENDING: { code: 'INTEG_CONN_PENDING', display: 'Connection pending' },
    CONN_ACTIVE: { code: 'INTEG_CONN_ACTIVE', display: 'Connection active' },
    CONN_PAUSED: {
      code: 'INTEG_CONN_PAUSED',
      display: 'Connection paused (circuit open)',
    },

    // --- Entorno de conexión (provider_connections.environment_concept_id) ---
    ENV_SANDBOX: { code: 'INTEG_ENV_SANDBOX', display: 'Sandbox environment' },
    ENV_PRODUCTION: {
      code: 'INTEG_ENV_PRODUCTION',
      display: 'Production environment',
    },

    // --- Ciclo de vida de credencial (provider_credentials.state_concept_id) ---
    CRED_ACTIVE: { code: 'INTEG_CRED_ACTIVE', display: 'Credential active' },
    CRED_RETIRED: { code: 'INTEG_CRED_RETIRED', display: 'Credential retired' },

    // --- Tipo de secreto (provider_credentials.secret_type_concept_id) ---
    SECRET_API_KEY: { code: 'INTEG_SECRET_API_KEY', display: 'API key secret' },
    SECRET_OAUTH_TOKEN: {
      code: 'INTEG_SECRET_OAUTH_TOKEN',
      display: 'OAuth token secret',
    },
    SECRET_HMAC: { code: 'INTEG_SECRET_HMAC', display: 'HMAC shared secret' },

    // --- Ciclo de vida de endpoint (integration_endpoints.state_concept_id) ---
    ENDPOINT_PUBLISHED: {
      code: 'INTEG_ENDPOINT_PUBLISHED',
      display: 'Endpoint published',
    },
    ENDPOINT_DEPRECATED: {
      code: 'INTEG_ENDPOINT_DEPRECATED',
      display: 'Endpoint deprecated',
    },

    // --- Método HTTP (integration_endpoints.http_method_concept_id) ---
    HTTP_GET: { code: 'INTEG_HTTP_GET', display: 'HTTP GET' },
    HTTP_POST: { code: 'INTEG_HTTP_POST', display: 'HTTP POST' },
    HTTP_PUT: { code: 'INTEG_HTTP_PUT', display: 'HTTP PUT' },
    HTTP_PATCH: { code: 'INTEG_HTTP_PATCH', display: 'HTTP PATCH' },
    HTTP_DELETE: { code: 'INTEG_HTTP_DELETE', display: 'HTTP DELETE' },

    // --- Dirección de mapeo (integration_field_mappings.direction_concept_id) ---
    DIRECTION_INBOUND: {
      code: 'INTEG_DIRECTION_INBOUND',
      display: 'Inbound mapping',
    },
    DIRECTION_OUTBOUND: {
      code: 'INTEG_DIRECTION_OUTBOUND',
      display: 'Outbound mapping',
    },

    // --- Estado de mensaje saliente (outbound_messages.status_concept_id) ---
    MSG_QUEUED: { code: 'INTEG_MSG_QUEUED', display: 'Outbound queued' },
    MSG_SENDING: { code: 'INTEG_MSG_SENDING', display: 'Outbound sending' },
    MSG_SENT: { code: 'INTEG_MSG_SENT', display: 'Outbound sent' },
    MSG_FAILED: { code: 'INTEG_MSG_FAILED', display: 'Outbound failed' },
    MSG_DEAD_LETTER: {
      code: 'INTEG_MSG_DEAD_LETTER',
      display: 'Outbound dead-lettered',
    },
    MSG_HELD: {
      code: 'INTEG_MSG_HELD',
      display: 'Outbound held (circuit open)',
    },
    MSG_ACKNOWLEDGED: {
      code: 'INTEG_MSG_ACKNOWLEDGED',
      display: 'Outbound acknowledged',
    },

    // --- Estado de reintento (message_retries.status_concept_id) ---
    RETRY_SCHEDULED: {
      code: 'INTEG_RETRY_SCHEDULED',
      display: 'Retry scheduled',
    },
    RETRY_FAILED: { code: 'INTEG_RETRY_FAILED', display: 'Retry failed' },
    RETRY_EXHAUSTED: {
      code: 'INTEG_RETRY_EXHAUSTED',
      display: 'Retries exhausted',
    },

    // --- Estado de mensaje entrante (inbound_messages.status_concept_id) ---
    INBOUND_RECEIVED: {
      code: 'INTEG_INBOUND_RECEIVED',
      display: 'Inbound received',
    },
    INBOUND_PROCESSED: {
      code: 'INTEG_INBOUND_PROCESSED',
      display: 'Inbound processed',
    },

    // --- Estado de suscripción de webhook (webhook_subscriptions.state_concept_id) ---
    WEBHOOK_ACTIVE: {
      code: 'INTEG_WEBHOOK_ACTIVE',
      display: 'Webhook subscription active',
    },
    WEBHOOK_DISABLED: {
      code: 'INTEG_WEBHOOK_DISABLED',
      display: 'Webhook subscription disabled',
    },
  });

/** Código de tipo de proveedor aceptado por el DTO de registro. */
export type ProviderTypeCode = 'LAB' | 'INSURER' | 'GOV' | 'GENERIC';
/** Código de tipo de autenticación del proveedor. */
export type AuthTypeCode = 'OAUTH2' | 'API_KEY' | 'HMAC';
/** Código de entorno de una conexión. */
export type EnvironmentCode = 'SANDBOX' | 'PRODUCTION';
/** Código de tipo de secreto de una credencial. */
export type SecretTypeCode = 'API_KEY' | 'OAUTH_TOKEN' | 'HMAC';
/** Código de método HTTP de un endpoint. */
export type HttpMethodCode = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
/** Código de dirección de un mapeo de campos. */
export type DirectionCode = 'INBOUND' | 'OUTBOUND';

/** Mapea el código de tipo de proveedor (DTO) a su concept id. */
export const PROVIDER_TYPE_CONCEPT_BY_CODE: Record<ProviderTypeCode, string> = {
  LAB: INTEG.PROVIDER_TYPE_LAB,
  INSURER: INTEG.PROVIDER_TYPE_INSURER,
  GOV: INTEG.PROVIDER_TYPE_GOV,
  GENERIC: INTEG.PROVIDER_TYPE_GENERIC,
};

/** Mapea el código de tipo de autenticación (DTO) a su concept id. */
export const AUTH_TYPE_CONCEPT_BY_CODE: Record<AuthTypeCode, string> = {
  OAUTH2: INTEG.AUTH_OAUTH2,
  API_KEY: INTEG.AUTH_API_KEY,
  HMAC: INTEG.AUTH_HMAC,
};

/** Mapea el código de entorno (DTO) a su concept id. */
export const ENVIRONMENT_CONCEPT_BY_CODE: Record<EnvironmentCode, string> = {
  SANDBOX: INTEG.ENV_SANDBOX,
  PRODUCTION: INTEG.ENV_PRODUCTION,
};

/** Mapea el código de tipo de secreto (DTO) a su concept id. */
export const SECRET_TYPE_CONCEPT_BY_CODE: Record<SecretTypeCode, string> = {
  API_KEY: INTEG.SECRET_API_KEY,
  OAUTH_TOKEN: INTEG.SECRET_OAUTH_TOKEN,
  HMAC: INTEG.SECRET_HMAC,
};

/** Mapea el código de método HTTP (DTO) a su concept id. */
export const HTTP_METHOD_CONCEPT_BY_CODE: Record<HttpMethodCode, string> = {
  GET: INTEG.HTTP_GET,
  POST: INTEG.HTTP_POST,
  PUT: INTEG.HTTP_PUT,
  PATCH: INTEG.HTTP_PATCH,
  DELETE: INTEG.HTTP_DELETE,
};

/** Mapea el código de dirección de mapeo (DTO) a su concept id. */
export const DIRECTION_CONCEPT_BY_CODE: Record<DirectionCode, string> = {
  INBOUND: INTEG.DIRECTION_INBOUND,
  OUTBOUND: INTEG.DIRECTION_OUTBOUND,
};
