import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo 30 Read Models. Encadena el ciclo de vida de un contrato:
 *  - publica una definición (materialized view) y captura su id + schema/object;
 *  - publica el contrato de vista de página (portal + route + view + hijos);
 *  - sirve datos, deriva acciones y guarda preferencias del usuario;
 *  - ejercita refresh/backfill/invalidate/reconcile, versionado, salud y
 *    deprecación/retiro (con guarda de FK) y las proyecciones públicas.
 *
 * `ctx.adminUserId` es un usuario real (FK válida para created_by/user_id) y
 * `ctx.tenantId` un tenant sembrado (FK válida para user_view_preferences.tenant_id).
 */
export const READ_MODELS_SMOKE: SmokeCase[] = [
  // --- UC-30-01: publicar contrato de read model versionado ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions',
    name: 'happy: publica definición (materialized view)',
    method: 'post',
    path: () => '/read-models/definitions',
    body: (c) => ({
      schemaName: 'read_models',
      objectName: `rm_smoke_${c.u}_v`,
      objectType: 'MATERIALIZED_VIEW',
      owningModule: 'read_models',
      refreshMode: 'CONCURRENT',
      maximumStalenessSeconds: 300,
      containsPhi: false,
      dependencies: [
        { sourceSchemaName: 'billing', sourceObjectName: 'bills', dependencyType: 'TABLE' },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.rmDefId = String(b.id);
      c.vars.rmSchema = String(b.schemaName);
      c.vars.rmObject = String(b.objectName);
    },
  },
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/read-models/definitions',
    auth: false,
    body: (c) => ({
      schemaName: 'read_models',
      objectName: `rm_x_${c.u}_v`,
      objectType: 'VIEW',
      dependencies: [{ sourceSchemaName: 'a', sourceObjectName: 'b', dependencyType: 'TABLE' }],
    }),
    expectedStatus: 401,
  },
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions',
    name: 'límite: sin dependencias -> 400',
    method: 'post',
    path: () => '/read-models/definitions',
    body: (c) => ({
      schemaName: 'read_models',
      objectName: `rm_y_${c.u}_v`,
      objectType: 'VIEW',
      dependencies: [],
    }),
    expectedStatus: 400,
  },
  // Segunda definición sin vistas: se usa luego para el retiro feliz (UC-30-13b).
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions',
    name: 'happy: publica definición retirable',
    method: 'post',
    path: () => '/read-models/definitions',
    body: (c) => ({
      schemaName: 'read_models',
      objectName: `rm_retire_${c.u}_v`,
      objectType: 'MATERIALIZED_VIEW',
      dependencies: [{ sourceSchemaName: 'crm', sourceObjectName: 'accounts', dependencyType: 'TABLE' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.rmDefRetireId = String(b.id);
    },
  },

  // --- UC-30-02: publicar contrato de vista de página ---
  {
    module: 'ReadModels',
    endpoint: 'POST /portals/{portalCode}/routes/{routeCode}/views',
    name: 'happy: publica contrato de vista',
    method: 'post',
    path: (c) => `/portals/rm-portal-${c.u}/routes/rm-route-${c.u}/views`,
    body: (c) => ({
      portalName: 'Panel interno',
      portalType: 'INTERNAL',
      routePattern: '/crm/accounts',
      pageTitle: 'Cuentas',
      readModelDefinitionId: c.vars.rmDefId,
      viewCode: 'account_list',
      viewType: 'TABLE',
      supportsCursorPagination: true,
      fields: [
        { fieldCode: 'display_name', sourceColumn: 'display_name', label: 'Nombre', dataType: 'string', ordinal: 1 },
        { fieldCode: 'ssn', sourceColumn: 'ssn', label: 'SSN', dataType: 'string', sensitive: true, ordinal: 2 },
      ],
      sortOptions: [
        { sortCode: 'name_asc', label: 'Nombre', sortExpression: 'display_name', direction: 'ASC', nulls: 'LAST', ordinal: 1 },
      ],
      actions: [
        { actionCode: 'open', label: 'Abrir', actionType: 'NAVIGATE', ordinal: 1 },
      ],
      kpis: [
        { kpiCode: 'total', label: 'Total', valueColumn: 'total', comparisonColumn: 'prev_total', ordinal: 1 },
      ],
      states: [
        { stateType: 'EMPTY', title: 'Sin datos', message: 'No hay cuentas' },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.rmViewId = String(b.id);
    },
  },
  {
    module: 'ReadModels',
    endpoint: 'POST /portals/{portalCode}/routes/{routeCode}/views',
    name: 'límite: definición inexistente -> 404',
    method: 'post',
    path: (c) => `/portals/rm-portal-${c.u}/routes/rm-route2-${c.u}/views`,
    body: () => ({
      portalName: 'X',
      portalType: 'INTERNAL',
      routePattern: '/x',
      pageTitle: 'X',
      readModelDefinitionId: UUID_ABSENT,
      viewCode: 'x',
      viewType: 'TABLE',
      fields: [{ fieldCode: 'a', sourceColumn: 'a', label: 'A', dataType: 'string', ordinal: 1 }],
    }),
    expectedStatus: 404,
  },

  // --- UC-30-05: servir el read model ---
  {
    module: 'ReadModels',
    endpoint: 'GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data',
    name: 'happy: sirve datos con masking + staleness',
    method: 'get',
    path: (c) => `/portals/rm-portal-${c.u}/routes/rm-route-${c.u}/views/account_list/data`,
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data',
    name: 'límite: vista inexistente -> 404',
    method: 'get',
    path: (c) => `/portals/rm-portal-${c.u}/routes/rm-route-${c.u}/views/ghost/data`,
    expectedStatus: 404,
  },

  // --- UC-30-11: derivar available_actions_json ---
  {
    module: 'ReadModels',
    endpoint: 'GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions',
    name: 'happy: deriva acciones para un estado',
    method: 'get',
    path: (c) => `/portals/rm-portal-${c.u}/routes/rm-route-${c.u}/views/account_list/actions?state=OPEN`,
    expectedStatus: 200,
  },

  // --- UC-30-09: preferencias de vista del usuario ---
  {
    module: 'ReadModels',
    endpoint: 'PUT /views/{frontendPageViewId}/preferences',
    name: 'happy: guarda preferencias',
    method: 'put',
    path: (c) => `/views/${c.vars.rmViewId}/preferences`,
    body: (c) => ({
      visibleFields: ['display_name'],
      fieldOrder: ['display_name', 'ssn'],
      sortCode: 'name_asc',
      density: 'COMPACT',
      pageSize: 25,
      tenantId: c.tenantId,
    }),
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'PUT /views/{frontendPageViewId}/preferences',
    name: 'límite: campo fuera del contrato -> 422',
    method: 'put',
    path: (c) => `/views/${c.vars.rmViewId}/preferences`,
    body: () => ({ visibleFields: ['no_existe'] }),
    expectedStatus: 422,
  },
  {
    module: 'ReadModels',
    endpoint: 'PUT /views/{frontendPageViewId}/preferences',
    name: 'límite: vista inexistente -> 404',
    method: 'put',
    path: () => `/views/${UUID_ABSENT}/preferences`,
    body: () => ({ sortCode: 'name_asc' }),
    expectedStatus: 404,
  },

  // --- UC-30-03: refresh manual (materialized view) ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/{definitionId}/refresh',
    name: 'happy: refresca la MV',
    method: 'post',
    path: (c) => `/read-models/${c.vars.rmDefId}/refresh`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/{definitionId}/refresh',
    name: 'límite: definición inexistente -> 404',
    method: 'post',
    path: () => `/read-models/${UUID_ABSENT}/refresh`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // --- UC-30-04: backfill ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/{definitionId}/backfill',
    name: 'happy: backfill inicial',
    method: 'post',
    path: (c) => `/read-models/${c.vars.rmDefId}/backfill`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // --- UC-30-06: invalidar y recomputar ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/{definitionId}/invalidate',
    name: 'happy: invalida y recomputa',
    method: 'post',
    path: (c) => `/read-models/${c.vars.rmDefId}/invalidate`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // --- UC-30-07: reconciliar ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/{definitionId}/reconcile',
    name: 'happy: reconcilia contra la fuente',
    method: 'post',
    path: (c) => `/read-models/${c.vars.rmDefId}/reconcile`,
    body: () => ({}),
    expectedStatus: 200,
  },

  // --- UC-30-08: versionar ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions/{schema}/{object}/versions',
    name: 'happy: crea versión N+1',
    method: 'post',
    path: (c) => `/read-models/definitions/${c.vars.rmSchema}/${c.vars.rmObject}/versions`,
    body: () => ({
      objectType: 'MATERIALIZED_VIEW',
      refreshMode: 'CONCURRENT',
      dependencies: [
        { sourceSchemaName: 'billing', sourceObjectName: 'bills', dependencyType: 'TABLE' },
      ],
    }),
    expectedStatus: 201,
  },
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions/{schema}/{object}/versions',
    name: 'límite: sin versión previa -> 404',
    method: 'post',
    path: () => `/read-models/definitions/read_models/rm_ghost_v/versions`,
    body: () => ({
      objectType: 'VIEW',
      dependencies: [{ sourceSchemaName: 'a', sourceObjectName: 'b', dependencyType: 'TABLE' }],
    }),
    expectedStatus: 404,
  },

  // --- UC-30-12: salud / staleness ---
  {
    module: 'ReadModels',
    endpoint: 'GET /read-models/health',
    name: 'happy: reporte de staleness',
    method: 'get',
    path: () => '/read-models/health',
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'GET /read-models/health',
    name: 'límite: sin auth -> 401',
    method: 'get',
    path: () => '/read-models/health',
    auth: false,
    expectedStatus: 401,
  },

  // --- UC-30-13: deprecar y retirar ---
  {
    module: 'ReadModels',
    endpoint: 'POST /read-models/definitions/{id}/deprecate',
    name: 'happy: deprecación de la versión',
    method: 'post',
    path: (c) => `/read-models/definitions/${c.vars.rmDefId}/deprecate`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'DELETE /read-models/definitions/{id}',
    name: 'límite: retiro con vistas apuntando -> 422',
    method: 'delete',
    path: (c) => `/read-models/definitions/${c.vars.rmDefId}`,
    expectedStatus: 422,
  },
  {
    module: 'ReadModels',
    endpoint: 'DELETE /read-models/definitions/{id}',
    name: 'happy: retiro de versión sin vistas',
    method: 'delete',
    path: (c) => `/read-models/definitions/${c.vars.rmDefRetireId}`,
    expectedStatus: 200,
  },

  // --- UC-30-10: proyecciones públicas (sin sesión) ---
  {
    module: 'ReadModels',
    endpoint: 'GET /public/directory',
    name: 'happy: directorio público (sin auth)',
    method: 'get',
    path: () => '/public/directory?city=Lima&specialty=cardiology',
    auth: false,
    expectedStatus: 200,
  },
  {
    module: 'ReadModels',
    endpoint: 'GET /public/{slug}',
    name: 'happy: detalle público por slug (sin auth)',
    method: 'get',
    path: () => '/public/dr-ada-lovelace',
    auth: false,
    expectedStatus: 200,
  },
];
