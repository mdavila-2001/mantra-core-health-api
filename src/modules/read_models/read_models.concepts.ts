import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo read_models (prefijo `read_models:`).
 *
 * Cubre el ciclo de vida de un contrato de read model (DRAFT/ACTIVE/DEPRECATED/
 * RETIRED), el tipo de objeto físico (VIEW/MATERIALIZED_VIEW), los tipos y
 * resultados de las corridas de refresh, los tipos de portal/vista/acción/estado
 * del contrato de frontend y las opciones de orden/densidad. Los estados
 * genéricos "activo" de portal_surfaces/frontend_routes/frontend_page_views y sus
 * hijos reutilizan `CONCEPTS.STATE_ACTIVE` transversal, ya sembrado.
 *
 * `READ_MODELS_CONCEPT_SEEDS` lo consume el agregador central del seed; `RM` es el
 * mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: READ_MODELS_CONCEPT_SEEDS, ids: RM } =
  defineModuleConcepts('read_models', {
    // --- Tipo de objeto físico (read_model_definitions.object_type_concept_id) ---
    OBJECT_TYPE_VIEW: { code: 'RM_OBJ_VIEW', display: 'SQL view' },
    OBJECT_TYPE_MATERIALIZED_VIEW: {
      code: 'RM_OBJ_MVIEW',
      display: 'Materialized view',
    },

    // --- Modo de refresh de la definición (refresh_mode_concept_id) ---
    REFRESH_MODE_CONCURRENT: {
      code: 'RM_REFRESH_MODE_CONCURRENT',
      display: 'Concurrent refresh',
    },
    REFRESH_MODE_SCHEDULED: {
      code: 'RM_REFRESH_MODE_SCHEDULED',
      display: 'Scheduled refresh',
    },

    // --- Ciclo de vida de la definición (read_model_definitions.status_concept_id) ---
    DEF_DRAFT: { code: 'RM_DEF_DRAFT', display: 'Read model definition draft' },
    DEF_ACTIVE: {
      code: 'RM_DEF_ACTIVE',
      display: 'Read model definition active',
    },
    DEF_DEPRECATED: {
      code: 'RM_DEF_DEPRECATED',
      display: 'Read model definition deprecated',
    },
    DEF_RETIRED: {
      code: 'RM_DEF_RETIRED',
      display: 'Read model definition retired',
    },

    // --- Tipo de dependencia upstream (read_model_dependencies.dependency_type_concept_id) ---
    DEP_TYPE_TABLE: {
      code: 'RM_DEP_TABLE',
      display: 'Source table dependency',
    },
    DEP_TYPE_VIEW: { code: 'RM_DEP_VIEW', display: 'Source view dependency' },

    // --- Tipo de corrida de refresh (read_model_refresh_runs.refresh_type_concept_id) ---
    REFRESH_TYPE_CONCURRENT: {
      code: 'RM_RUN_CONCURRENT',
      display: 'Concurrent refresh run',
    },
    REFRESH_TYPE_INCREMENTAL: {
      code: 'RM_RUN_INCREMENTAL',
      display: 'Incremental refresh run',
    },
    REFRESH_TYPE_FULL_BACKFILL: {
      code: 'RM_RUN_FULL_BACKFILL',
      display: 'Full backfill run',
    },
    REFRESH_TYPE_RECONCILE: {
      code: 'RM_RUN_RECONCILE',
      display: 'Reconcile run',
    },

    // --- Resultado de la corrida (read_model_refresh_runs.result_concept_id) ---
    RESULT_SUCCESS: { code: 'RM_RESULT_SUCCESS', display: 'Refresh succeeded' },
    RESULT_FAILED: { code: 'RM_RESULT_FAILED', display: 'Refresh failed' },
    RESULT_DIVERGENCE_FOUND: {
      code: 'RM_RESULT_DIVERGENCE',
      display: 'Divergence found',
    },
    RESULT_REPAIRED: {
      code: 'RM_RESULT_REPAIRED',
      display: 'Divergence repaired',
    },

    // --- Tipo de portal (portal_surfaces.portal_type_concept_id) ---
    PORTAL_TYPE_INTERNAL: {
      code: 'RM_PORTAL_INTERNAL',
      display: 'Internal portal',
    },
    PORTAL_TYPE_PUBLIC: { code: 'RM_PORTAL_PUBLIC', display: 'Public portal' },

    // --- Tipo de vista (frontend_page_views.view_type_concept_id) ---
    VIEW_TYPE_TABLE: { code: 'RM_VIEW_TABLE', display: 'Table view' },
    VIEW_TYPE_DASHBOARD: {
      code: 'RM_VIEW_DASHBOARD',
      display: 'Dashboard view',
    },
    VIEW_TYPE_DETAIL: { code: 'RM_VIEW_DETAIL', display: 'Detail view' },

    // --- Dirección de orden (frontend_view_sort_options.direction_concept_id) ---
    SORT_ASC: { code: 'RM_SORT_ASC', display: 'Ascending' },
    SORT_DESC: { code: 'RM_SORT_DESC', display: 'Descending' },

    // --- Posición de nulos (frontend_view_sort_options.nulls_position_concept_id) ---
    NULLS_FIRST: { code: 'RM_NULLS_FIRST', display: 'Nulls first' },
    NULLS_LAST: { code: 'RM_NULLS_LAST', display: 'Nulls last' },

    // --- Tipo de input de filtro (frontend_view_filters.input_type_concept_id) ---
    INPUT_TYPE_TEXT: { code: 'RM_INPUT_TEXT', display: 'Text input' },
    INPUT_TYPE_SELECT: { code: 'RM_INPUT_SELECT', display: 'Select input' },

    // --- Tipo de acción (frontend_view_actions.action_type_concept_id) ---
    ACTION_TYPE_NAVIGATE: {
      code: 'RM_ACTION_NAVIGATE',
      display: 'Navigate action',
    },
    ACTION_TYPE_MUTATION: {
      code: 'RM_ACTION_MUTATION',
      display: 'Mutation action',
    },

    // --- Tipo de estado de vista (frontend_view_states.state_type_concept_id) ---
    STATE_TYPE_LOADING: { code: 'RM_STATE_LOADING', display: 'Loading state' },
    STATE_TYPE_EMPTY: { code: 'RM_STATE_EMPTY', display: 'Empty state' },
    STATE_TYPE_STALE: { code: 'RM_STATE_STALE', display: 'Stale state' },
    STATE_TYPE_ERROR: { code: 'RM_STATE_ERROR', display: 'Error state' },
    STATE_TYPE_FORBIDDEN: {
      code: 'RM_STATE_FORBIDDEN',
      display: 'Forbidden state',
    },

    // --- Densidad de la vista del usuario (user_view_preferences.density_concept_id) ---
    DENSITY_COMPACT: { code: 'RM_DENSITY_COMPACT', display: 'Compact density' },
    DENSITY_COMFORTABLE: {
      code: 'RM_DENSITY_COMFORTABLE',
      display: 'Comfortable density',
    },
  });

/** Mapea el código de tipo de objeto (DTO) a su concept id. */
export const OBJECT_TYPE_CONCEPT_BY_CODE: Record<
  'VIEW' | 'MATERIALIZED_VIEW',
  string
> = {
  VIEW: RM.OBJECT_TYPE_VIEW,
  MATERIALIZED_VIEW: RM.OBJECT_TYPE_MATERIALIZED_VIEW,
};

/** Mapea el código de tipo de dependencia (DTO) a su concept id. */
export const DEPENDENCY_TYPE_CONCEPT_BY_CODE: Record<'TABLE' | 'VIEW', string> =
  {
    TABLE: RM.DEP_TYPE_TABLE,
    VIEW: RM.DEP_TYPE_VIEW,
  };

/** Mapea el código de tipo de portal (DTO) a su concept id. */
export const PORTAL_TYPE_CONCEPT_BY_CODE: Record<
  'INTERNAL' | 'PUBLIC',
  string
> = {
  INTERNAL: RM.PORTAL_TYPE_INTERNAL,
  PUBLIC: RM.PORTAL_TYPE_PUBLIC,
};

/** Mapea el código de tipo de vista (DTO) a su concept id. */
export const VIEW_TYPE_CONCEPT_BY_CODE: Record<
  'TABLE' | 'DASHBOARD' | 'DETAIL',
  string
> = {
  TABLE: RM.VIEW_TYPE_TABLE,
  DASHBOARD: RM.VIEW_TYPE_DASHBOARD,
  DETAIL: RM.VIEW_TYPE_DETAIL,
};

/** Mapea el código de dirección de orden (DTO) a su concept id. */
export const SORT_DIRECTION_CONCEPT_BY_CODE: Record<'ASC' | 'DESC', string> = {
  ASC: RM.SORT_ASC,
  DESC: RM.SORT_DESC,
};

/** Mapea el código de posición de nulos (DTO) a su concept id. */
export const NULLS_POSITION_CONCEPT_BY_CODE: Record<'FIRST' | 'LAST', string> =
  {
    FIRST: RM.NULLS_FIRST,
    LAST: RM.NULLS_LAST,
  };

/** Mapea el código de tipo de acción (DTO) a su concept id. */
export const ACTION_TYPE_CONCEPT_BY_CODE: Record<
  'NAVIGATE' | 'MUTATION',
  string
> = {
  NAVIGATE: RM.ACTION_TYPE_NAVIGATE,
  MUTATION: RM.ACTION_TYPE_MUTATION,
};

/** Mapea el código de tipo de estado de vista (DTO) a su concept id. */
export const STATE_TYPE_CONCEPT_BY_CODE: Record<
  'LOADING' | 'EMPTY' | 'STALE' | 'ERROR' | 'FORBIDDEN',
  string
> = {
  LOADING: RM.STATE_TYPE_LOADING,
  EMPTY: RM.STATE_TYPE_EMPTY,
  STALE: RM.STATE_TYPE_STALE,
  ERROR: RM.STATE_TYPE_ERROR,
  FORBIDDEN: RM.STATE_TYPE_FORBIDDEN,
};

/** Mapea el código de densidad (DTO) a su concept id. */
export const DENSITY_CONCEPT_BY_CODE: Record<
  'COMPACT' | 'COMFORTABLE',
  string
> = {
  COMPACT: RM.DENSITY_COMPACT,
  COMFORTABLE: RM.DENSITY_COMFORTABLE,
};
