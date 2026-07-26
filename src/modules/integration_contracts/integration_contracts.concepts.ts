import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo 31 — Governed Backend-to-Backend Contracts.
 *
 * Declara todos los `*_concept_id` que los endpoints necesitan como valores por
 * defecto o transiciones de estado: ciclo de vida del contrato y de sus versiones,
 * tipos de perfil de autenticación, estados de suscripción de webhook, dirección y
 * resultado de los intercambios, decisiones de reintento y evidencia de entrega.
 *
 * Se declaran aquí (no en `src/common`) para no tocar archivos compartidos; el
 * orquestador agrega `INTEGRATION_CONTRACTS_CONCEPT_SEEDS` en el seed central.
 */
export const { seeds: INTEGRATION_CONTRACTS_CONCEPT_SEEDS, ids: ICON } =
  defineModuleConcepts('integration_contracts', {
    // Ciclo de vida del contrato
    CONTRACT_DRAFT: { code: 'DRAFT', display: 'Contract draft' },
    CONTRACT_ACTIVE: { code: 'ACTIVE', display: 'Contract active' },
    CONTRACT_RETIRED: { code: 'RETIRED', display: 'Contract retired' },

    // Ciclo de vida de la versión de contrato
    VERSION_DRAFT: { code: 'VERSION_DRAFT', display: 'Contract version draft' },
    VERSION_ACTIVE: { code: 'VERSION_ACTIVE', display: 'Contract version active' },
    VERSION_SUPERSEDED: { code: 'VERSION_SUPERSEDED', display: 'Contract version superseded' },

    // Capacidad / clasificación por defecto del contrato
    CAPABILITY_GENERIC: { code: 'CAPABILITY_GENERIC', display: 'Generic data exchange capability' },

    // Perfil de autenticación
    AUTH_OAUTH2_CONFIDENTIAL: { code: 'OAUTH2_CONFIDENTIAL', display: 'OAuth2 confidential client' },
    AUTH_PROFILE_ACTIVE: { code: 'AUTH_ACTIVE', display: 'Auth profile active' },
    AUTH_PROFILE_ROTATED: { code: 'AUTH_ROTATED', display: 'Auth profile rotated' },
    AUTH_PROFILE_REVOKED: { code: 'AUTH_REVOKED', display: 'Auth profile revoked' },
    TOKEN_BINDING_DPOP: { code: 'DPOP', display: 'DPoP token binding' },
    TOKEN_BINDING_MTLS: { code: 'MTLS', display: 'mTLS token binding' },

    // Suscripción de webhook
    WEBHOOK_EVENT_GENERIC: { code: 'WEBHOOK_EVENT_GENERIC', display: 'Generic webhook event type' },
    SUBSCRIPTION_ACTIVE: { code: 'SUBSCRIPTION_ACTIVE', display: 'Webhook subscription active' },
    SUBSCRIPTION_SUSPENDED: { code: 'SUBSCRIPTION_SUSPENDED', display: 'Webhook subscription suspended' },

    // Dirección / tipo de mensaje del intercambio
    DIRECTION_INBOUND: { code: 'INBOUND', display: 'Inbound exchange' },
    DIRECTION_OUTBOUND: { code: 'OUTBOUND', display: 'Outbound exchange' },
    MESSAGE_GENERIC: { code: 'MESSAGE_GENERIC', display: 'Generic message' },
    MESSAGE_WEBHOOK: { code: 'MESSAGE_WEBHOOK', display: 'Webhook message' },

    // Resultado del registro de intercambio
    OUTCOME_PENDING: { code: 'PENDING', display: 'Exchange pending' },
    OUTCOME_SUCCESS: { code: 'SUCCESS', display: 'Exchange success' },
    OUTCOME_FAILED: { code: 'FAILED', display: 'Exchange failed' },
    OUTCOME_DEAD_LETTER: { code: 'DEAD_LETTER', display: 'Exchange dead-lettered' },

    // Resultado del intento de intercambio
    ATTEMPT_IN_PROGRESS: { code: 'IN_PROGRESS', display: 'Attempt in progress' },
    ATTEMPT_SUCCESS: { code: 'ATTEMPT_SUCCESS', display: 'Attempt success' },
    ATTEMPT_FAILED: { code: 'ATTEMPT_FAILED', display: 'Attempt failed' },

    // Decisión de reintento
    RETRY_RETRYABLE: { code: 'RETRYABLE', display: 'Retryable failure' },
    RETRY_PERMANENT: { code: 'PERMANENT', display: 'Permanent failure' },

    // Idempotencia
    OPERATION_EXCHANGE: { code: 'OPERATION_EXCHANGE', display: 'Idempotent exchange operation' },
    IDEMPOTENCY_PENDING: { code: 'IDEMPOTENCY_PENDING', display: 'Idempotency pending' },
    IDEMPOTENCY_COMPLETED: { code: 'IDEMPOTENCY_COMPLETED', display: 'Idempotency completed' },

    // Sincronización
    CURSOR_ACTIVE: { code: 'CURSOR_ACTIVE', display: 'Sync cursor active' },

    // Entrega de webhook firmado
    SIGNATURE_VERIFIED: { code: 'SIGNATURE_VERIFIED', display: 'Signature verified' },
    SIGNATURE_FAILED: { code: 'SIGNATURE_FAILED', display: 'Signature verification failed' },
    DELIVERY_DELIVERED: { code: 'DELIVERED', display: 'Webhook delivered' },
    DELIVERY_FAILED: { code: 'DELIVERY_FAILED', display: 'Webhook delivery failed' },
  });
