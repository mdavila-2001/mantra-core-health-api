import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Geo (13). Encadena el ciclo completo de tracking sobre
 * `ctx.vars`:
 *  - da de alta un sujeto rastreado (usando `ctx.adminUserId` como subject_id, un
 *    uuid real) y abre una sesión de tracking;
 *  - ingiere pings, define un geofence circular y registra un cruce;
 *  - inicia y cierra un viaje, consulta la última posición, cierra la sesión y
 *    finalmente revoca el consentimiento (suspende el sujeto).
 *
 * El sujeto queda SUSPENDED al final, de modo que corridas repetidas no colisionan
 * en el alta (la unicidad lógica solo aplica a sujetos ACTIVE).
 */
export const GEO_SMOKE: SmokeCase[] = [
  // --- UC-13-01: alta de sujeto rastreado ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects',
    name: 'happy: da de alta sujeto rastreado',
    method: 'post',
    path: () => '/geo/tracked-subjects',
    body: (c) => ({
      subjectId: c.adminUserId,
      subjectType: 'PERSON',
      tenantId: c.tenantId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.geoSubjectId = String(b.id);
    },
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/geo/tracked-subjects',
    auth: false,
    body: (c) => ({ subjectId: c.adminUserId }),
    expectedStatus: 401,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects',
    name: 'límite: alta duplicada del mismo sujeto activo -> 409',
    method: 'post',
    path: () => '/geo/tracked-subjects',
    body: (c) => ({
      subjectId: c.adminUserId,
      subjectType: 'PERSON',
      tenantId: c.tenantId,
    }),
    expectedStatus: 409,
  },

  // --- UC-13-02: iniciar sesión de tracking ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracking-sessions',
    name: 'happy: abre sesión de tracking',
    method: 'post',
    path: () => '/geo/tracking-sessions',
    body: (c) => ({
      trackedSubjectId: c.vars.geoSubjectId,
      relatedResourceType: 'dispatch',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.geoSessionId = String(b.id);
    },
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracking-sessions',
    name: 'límite: sesión ya abierta -> 409',
    method: 'post',
    path: () => '/geo/tracking-sessions',
    body: (c) => ({ trackedSubjectId: c.vars.geoSubjectId }),
    expectedStatus: 409,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracking-sessions',
    name: 'límite: sujeto inexistente -> 404',
    method: 'post',
    path: () => '/geo/tracking-sessions',
    body: () => ({ trackedSubjectId: UUID_ABSENT }),
    expectedStatus: 404,
  },

  // --- UC-13-03: ingesta de pings ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects/{id}/pings',
    name: 'happy: ingiere batch de pings',
    method: 'post',
    path: (c) => `/geo/tracked-subjects/${c.vars.geoSubjectId}/pings`,
    body: () => ({
      pings: [
        {
          latitude: -12.0464,
          longitude: -77.0428,
          accuracyM: 5,
          speedMps: 8,
          batteryPct: 90,
          network: 'CELLULAR',
        },
        { latitude: -12.05, longitude: -77.05, accuracyM: 4 },
      ],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects/{id}/pings',
    name: 'límite: batch vacío -> 400',
    method: 'post',
    path: (c) => `/geo/tracked-subjects/${c.vars.geoSubjectId}/pings`,
    body: () => ({ pings: [] }),
    expectedStatus: 400,
  },

  // --- UC-13-04: definir geofence ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/geofences',
    name: 'happy: define geofence circular',
    method: 'post',
    path: () => '/geo/geofences',
    body: (c) => ({
      tenantId: c.tenantId,
      name: `GEO-FENCE-${c.u}`,
      shapeType: 'CIRCLE',
      radiusM: 500,
      centerLat: -12.0464,
      centerLng: -77.0428,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.geoFenceId = String(b.id);
    },
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/geofences',
    name: 'límite: círculo sin centro/radio -> 422',
    method: 'post',
    path: (c) => '/geo/geofences',
    body: (c) => ({
      tenantId: c.tenantId,
      name: `GEO-BAD-${c.u}`,
      shapeType: 'CIRCLE',
    }),
    expectedStatus: 422,
  },

  // --- UC-13-06: iniciar viaje ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/trips',
    name: 'happy: inicia viaje sobre la sesión',
    method: 'post',
    path: () => '/geo/trips',
    body: (c) => ({ trackingSessionId: c.vars.geoSessionId }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.geoTripId = String(b.id);
    },
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/trips',
    name: 'límite: viaje en progreso duplicado -> 409',
    method: 'post',
    path: () => '/geo/trips',
    body: (c) => ({ trackingSessionId: c.vars.geoSessionId }),
    expectedStatus: 409,
  },

  // --- UC-13-07: cerrar viaje ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/trips/{id}/close',
    name: 'happy: cierra viaje con distancia',
    method: 'post',
    path: (c) => `/geo/trips/${c.vars.geoTripId}/close`,
    body: () => ({ distanceM: 1200, durationS: 300 }),
    expectedStatus: 200,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/trips/{id}/close',
    name: 'límite: cerrar un viaje ya cerrado -> 422',
    method: 'post',
    path: (c) => `/geo/trips/${c.vars.geoTripId}/close`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- UC-13-05: evento de geofence ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/geofence-events',
    name: 'happy: registra cruce ENTER',
    method: 'post',
    path: () => '/geo/geofence-events',
    body: (c) => ({
      geofenceId: c.vars.geoFenceId,
      trackedSubjectId: c.vars.geoSubjectId,
      eventType: 'ENTER',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/geofence-events',
    name: 'límite: transición ENTER repetida -> 409',
    method: 'post',
    path: (c) => `/geo/geofence-events`,
    body: (c) => ({
      geofenceId: c.vars.geoFenceId,
      trackedSubjectId: c.vars.geoSubjectId,
      eventType: 'ENTER',
    }),
    expectedStatus: 409,
  },

  // --- UC-13-09: última posición conocida ---
  {
    module: 'Geo',
    endpoint: 'GET /geo/tracked-subjects/{id}/last-position',
    name: 'happy: consulta última posición',
    method: 'get',
    path: (c) => `/geo/tracked-subjects/${c.vars.geoSubjectId}/last-position`,
    expectedStatus: 200,
  },
  {
    module: 'Geo',
    endpoint: 'GET /geo/tracked-subjects/{id}/last-position',
    name: 'límite: sujeto inexistente -> 404',
    method: 'get',
    path: () => `/geo/tracked-subjects/${UUID_ABSENT}/last-position`,
    expectedStatus: 404,
  },

  // --- UC-13-08: cerrar sesión de tracking ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracking-sessions/{id}/close',
    name: 'happy: cierra la sesión (sin viajes en progreso)',
    method: 'post',
    path: (c) => `/geo/tracking-sessions/${c.vars.geoSessionId}/close`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracking-sessions/{id}/close',
    name: 'límite: cerrar sesión ya cerrada -> 422',
    method: 'post',
    path: (c) => `/geo/tracking-sessions/${c.vars.geoSessionId}/close`,
    body: () => ({}),
    expectedStatus: 422,
  },

  // --- UC-13-10: revocar consentimiento y pausar rastreo ---
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects/{id}/revoke-consent',
    name: 'happy: revoca consentimiento y suspende',
    method: 'post',
    path: (c) => `/geo/tracked-subjects/${c.vars.geoSubjectId}/revoke-consent`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Geo',
    endpoint: 'POST /geo/tracked-subjects/{id}/revoke-consent',
    name: 'límite: revocar de nuevo (ya suspendido) -> 422',
    method: 'post',
    path: (c) => `/geo/tracked-subjects/${c.vars.geoSubjectId}/revoke-consent`,
    body: () => ({}),
    expectedStatus: 422,
  },
];
