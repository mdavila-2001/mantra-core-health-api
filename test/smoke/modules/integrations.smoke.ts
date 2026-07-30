import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo integrations (12): registro de proveedor, conexión, endpoint,
 * suscripción a webhook, y el ciclo de un mensaje saliente (encolar → despachar →
 * reintentar → dead-letter → correlacionar) más webhook entrante y rotación/pausa.
 * Las rutas usan el estilo `recurso:accion` (colon literal escapado en el controller).
 */
export const INTEGRATIONS_SMOKE: SmokeCase[] = [
  // UC-12-07 registrar proveedor
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers',
    name: 'happy: registra proveedor',
    method: 'post',
    path: () => '/integrations/providers',
    body: (c) => ({
      code: `prov-${c.u}`,
      name: 'Test Provider',
      providerType: 'GENERIC',
      baseUrl: 'https://api.example.com',
      authType: 'API_KEY',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.integProviderId = String(b.id);
    },
  },
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers',
    name: 'límite: sin autenticación',
    method: 'post',
    path: () => '/integrations/providers',
    auth: false,
    body: () => ({ code: 'x', name: 'x', providerType: 'GENERIC' }),
    expectedStatus: 401,
  },
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers',
    name: 'límite: providerType inválido',
    method: 'post',
    path: () => '/integrations/providers',
    body: (c) => ({ code: `bad-${c.u}`, name: 'x', providerType: 'WIZARD' }),
    expectedStatus: 400,
  },
  // UC-12-08 aprovisionar conexión
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers/:id/connections',
    name: 'happy: aprovisiona conexión',
    method: 'post',
    path: (c) =>
      `/integrations/providers/${c.vars.integProviderId}/connections`,
    body: (c) => ({
      tenantId: c.tenantId,
      environment: 'SANDBOX',
      secretType: 'API_KEY',
      secretRef: `ref-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.integConnectionId = String(b.id);
    },
  },
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers/:id/connections',
    name: 'límite: proveedor inexistente',
    method: 'post',
    path: (c) => `/integrations/providers/${UUID_ABSENT}/connections`,
    body: (c) => ({
      tenantId: c.tenantId,
      secretType: 'API_KEY',
      secretRef: 'r',
    }),
    expectedStatus: 404,
  },
  // UC-12-09 publicar endpoint
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers/:id/endpoints',
    name: 'happy: publica endpoint',
    method: 'post',
    path: (c) => `/integrations/providers/${c.vars.integProviderId}/endpoints`,
    body: (c) => ({
      code: `ep-${c.u}`,
      operation: 'push-result',
      path: '/v1/results',
      httpMethod: 'POST',
      direction: 'OUTBOUND',
      sourcePath: '$.value',
      targetField: 'value',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.integEndpointId = String(b.id);
    },
  },
  // UC-12-10 suscripción a webhook
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/providers/:id/webhook-subscriptions',
    name: 'happy: suscribe webhook',
    method: 'post',
    path: (c) =>
      `/integrations/providers/${c.vars.integProviderId}/webhook-subscriptions`,
    body: (c) => ({
      tenantId: c.tenantId,
      eventType: 'lab.result.ready',
      callbackUrl: 'https://example.com/cb',
      secretRef: `whs-${c.u}`,
    }),
    expectedStatus: 201,
  },
  // UC-12-01 encolar mensaje saliente
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/messages:outbound',
    name: 'happy: encola saliente',
    method: 'post',
    path: () => '/integrations/messages:outbound',
    body: (c) => ({
      connectionId: c.vars.integConnectionId,
      endpointId: c.vars.integEndpointId,
      idempotencyKey: `idem-${c.u}`,
      requestPayloadJson: { ping: true },
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.integMessageId = String(b.id);
    },
  },
  // UC-12-02 despachar
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/messages/:id:dispatch',
    name: 'happy: despacha',
    method: 'post',
    path: (c) => `/integrations/messages/${c.vars.integMessageId}:dispatch`,
    body: () => ({ httpStatus: 200 }),
    expectedStatus: 200,
  },
  // UC-12-03 reintentar (tras simular fallo se reintenta; aquí solo ejercemos la ruta)
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/messages/:id:retry',
    name: 'happy: reintenta',
    method: 'post',
    path: (c) => `/integrations/messages/${c.vars.integMessageId}:retry`,
    body: () => ({}),
    expectedStatus: 200,
  },
  // UC-12-04 dead-letter
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/messages/:id:dead-letter',
    name: 'happy: dead-letter',
    method: 'post',
    path: (c) => `/integrations/messages/${c.vars.integMessageId}:dead-letter`,
    body: () => ({}),
    expectedStatus: 200,
  },
  // UC-12-05 correlacionar
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/messages/:id:correlate',
    name: 'happy: correlaciona',
    method: 'post',
    path: (c) => `/integrations/messages/${c.vars.integMessageId}:correlate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  // UC-12-06 webhook entrante
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/webhooks/inbound',
    name: 'happy: webhook entrante',
    method: 'post',
    path: () => '/integrations/webhooks/inbound',
    body: (c) => ({
      connectionId: c.vars.integConnectionId,
      endpointId: c.vars.integEndpointId,
      payloadJson: { event: 'x' },
    }),
    expectedStatus: 201,
  },
  // UC-12-11 rotar credencial
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/connections/:id/credentials:rotate',
    name: 'happy: rota credencial',
    method: 'post',
    path: (c) =>
      `/integrations/connections/${c.vars.integConnectionId}/credentials:rotate`,
    body: (c) => ({ secretRef: `new-ref-${c.u}`, secretType: 'API_KEY' }),
    expectedStatus: 200,
  },
  // UC-12-12 pausar conexión
  {
    module: 'Integrations',
    endpoint: 'POST /integrations/connections/:id:pause',
    name: 'happy: pausa conexión',
    method: 'post',
    path: (c) => `/integrations/connections/${c.vars.integConnectionId}:pause`,
    body: () => ({}),
    expectedStatus: 200,
  },
];
