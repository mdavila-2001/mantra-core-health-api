import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo 31 (integration_contracts): define un contrato, publica y activa
 * una versión, configura perfil de autenticación y webhook, ejecuta un intercambio
 * idempotente (con replay), registra intento/reintento, avanza un cursor, entrega un
 * webhook firmado, rota credenciales y retira el contrato. Encadena recursos vía
 * `ctx.vars`. La clave de idempotencia viaja en el cuerpo (el smoke-kit no fija
 * headers); el endpoint también la acepta por header `idempotency-key`.
 */
export const INTEGRATION_CONTRACTS_SMOKE: SmokeCase[] = [
  // UC-31-01 definir contrato
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts', name: 'happy: define contrato',
    method: 'post', path: () => '/integration/contracts',
    body: (c) => ({ externalProviderId: c.vars.integProviderId, contractCode: `IC-${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icContractId = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts', name: 'límite: sin autenticación',
    method: 'post', path: () => '/integration/contracts', auth: false,
    body: (c) => ({ externalProviderId: c.vars.integProviderId, contractCode: `x-${c.u}` }), expectedStatus: 401,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts', name: 'límite: falta externalProviderId',
    method: 'post', path: () => '/integration/contracts',
    body: (c) => ({ contractCode: `bad-${c.u}` }), expectedStatus: 400,
  },

  // UC-31-02 publicar versión
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/versions', name: 'happy: publica versión',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/versions`,
    body: () => ({ contractHash: 'sha256:abc' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icVersionId = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/versions', name: 'límite: contrato inexistente',
    method: 'post', path: () => `/integration/contracts/${UUID_ABSENT}/versions`,
    body: () => ({}), expectedStatus: 404,
  },

  // UC-31-10 activar versión (transiciona el contrato a ACTIVE)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/versions/:versionId/activate', name: 'happy: activa versión',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/versions/${c.vars.icVersionId}/activate`,
    body: () => ({}), expectedStatus: 200,
  },

  // UC-31-03 configurar perfil de autenticación
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/auth-profiles', name: 'happy: configura perfil auth',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/auth-profiles`,
    body: (c) => ({ clientIdentifier: `client-${c.u}`, credentialSecretReference: `secret://ref-${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icAuthProfileId = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/auth-profiles', name: 'límite: contrato inexistente',
    method: 'post', path: () => `/integration/contracts/${UUID_ABSENT}/auth-profiles`,
    body: () => ({ clientIdentifier: 'x' }), expectedStatus: 404,
  },

  // UC-31-04 suscribir webhook (contrato ACTIVE)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/webhook-subscriptions', name: 'happy: suscribe webhook',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/webhook-subscriptions`,
    body: (c) => ({ callbackUri: 'https://example.com/cb', signingKeyReference: `sign://${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icSubscriptionId = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/webhook-subscriptions', name: 'límite: sin autenticación',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/webhook-subscriptions`, auth: false,
    body: () => ({ callbackUri: 'https://example.com/cb' }), expectedStatus: 401,
  },

  // UC-31-05 ejecutar intercambio idempotente (inbound)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges', name: 'happy: intercambio idempotente',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges`,
    body: (c) => ({ idempotencyKey: `idem-a-${c.u}`, requestHash: 'rh-1', businessIdentifier: `biz-${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icRecordId = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges', name: 'happy: replay misma clave',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges`,
    body: (c) => ({ idempotencyKey: `idem-a-${c.u}`, requestHash: 'rh-1' }), expectedStatus: 201,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges', name: 'límite: falta idempotency-key (422)',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges`,
    body: () => ({ businessIdentifier: 'no-key' }), expectedStatus: 422,
  },

  // UC-31-06 registrar intento outbound (cierra el intercambio en SUCCESS)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges/:recordId/attempts', name: 'happy: intento SUCCESS',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges/${c.vars.icRecordId}/attempts`,
    body: () => ({ outcome: 'SUCCESS', httpStatus: 200, responseHash: 'resp-1' }), expectedStatus: 201,
  },

  // Segundo intercambio para ejercitar el reintento (intento FAILED → retry)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges', name: 'setup: intercambio para retry',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges`,
    body: (c) => ({ idempotencyKey: `idem-b-${c.u}` }),
    expectedStatus: 201, capture: (b, c) => { c.vars.icRecordId2 = String(b.id); },
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/exchanges/:recordId/attempts', name: 'setup: intento FAILED retryable',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/exchanges/${c.vars.icRecordId2}/attempts`,
    body: () => ({ outcome: 'FAILED', httpStatus: 503, retryDecision: 'RETRYABLE' }), expectedStatus: 201,
  },

  // UC-31-07 reintentar intercambio fallido
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/exchanges/:recordId/retry', name: 'happy: reintenta (éxito)',
    method: 'post', path: (c) => `/integration/exchanges/${c.vars.icRecordId2}/retry`,
    body: () => ({ outcome: 'SUCCESS', httpStatus: 200 }), expectedStatus: 201,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/exchanges/:recordId/retry', name: 'límite: último intento no FAILED (422)',
    method: 'post', path: (c) => `/integration/exchanges/${c.vars.icRecordId}/retry`,
    body: () => ({}), expectedStatus: 422,
  },

  // UC-31-08 avanzar cursor de sincronización (crea el cursor si no existe)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/sync-cursors/:scope/advance', name: 'happy: crea/avanza cursor',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/sync-cursors/orders/advance`,
    body: () => ({ cursorValue: '000100' }), expectedStatus: 200,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/sync-cursors/:scope/advance', name: 'límite: cursor regresivo (422)',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/sync-cursors/orders/advance`,
    body: () => ({ cursorValue: '000050' }), expectedStatus: 422,
  },

  // UC-31-09 entregar webhook firmado
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/webhooks/:subscriptionId/deliveries', name: 'happy: entrega webhook',
    method: 'post', path: (c) => `/integration/webhooks/${c.vars.icSubscriptionId}/deliveries`,
    body: () => ({ outcome: 'DELIVERED', signatureAlgorithm: 'HMAC-SHA256', signatureVerified: true, acknowledged: true }),
    expectedStatus: 201,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/webhooks/:subscriptionId/deliveries', name: 'límite: suscripción inexistente',
    method: 'post', path: () => `/integration/webhooks/${UUID_ABSENT}/deliveries`,
    body: () => ({ outcome: 'DELIVERED' }), expectedStatus: 404,
  },

  // UC-31-11 rotar credenciales
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/auth-profiles/:apId/rotate', name: 'happy: rota credencial',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/auth-profiles/${c.vars.icAuthProfileId}/rotate`,
    body: (c) => ({ credentialSecretReference: `secret://new-${c.u}` }), expectedStatus: 200,
  },

  // UC-31-11 retirar contrato (al final: supersede versiones activas)
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/retire', name: 'happy: retira contrato',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/retire`,
    body: () => ({ reason: 'end-of-life' }), expectedStatus: 200,
  },
  {
    module: 'IntegrationContracts', endpoint: 'POST /integration/contracts/:id/retire', name: 'límite: ya retirado (422)',
    method: 'post', path: (c) => `/integration/contracts/${c.vars.icContractId}/retire`,
    body: () => ({}), expectedStatus: 422,
  },
];
