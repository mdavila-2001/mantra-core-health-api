import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del registro de herramientas de `platform_ops`
 * (prefijo `platform_ops:`).
 *
 * El módulo ya usa `CONCEPTS.*` para estados de corrida de health check
 * (`HC_RUN_*`) y el estado genérico `STATE_ACTIVE`; aquí solo viven los
 * conceptos que el registro de herramientas necesita y que NO existían:
 * tipo de herramienta, estado de catálogo, tipo de componente, criticidad,
 * tipo de chequeo, tipo de objetivo y uso del componente.
 *
 * `PLATFORM_OPS_CONCEPT_SEEDS` lo consume el agregador `module-concepts.ts`;
 * `PLATFORM_OPS` es el mapa `nombre -> UUID` determinista de servicios y seed.
 */
export const { seeds: PLATFORM_OPS_CONCEPT_SEEDS, ids: PLATFORM_OPS } =
  defineModuleConcepts('platform_ops', {
    // --- Tipo de herramienta (tool_registry.tool_type_concept_id) ---
    TOOL_KIND_DATABASE: { code: 'OPS_TOOL_DATABASE', display: 'Database' },
    TOOL_KIND_CACHE: { code: 'OPS_TOOL_CACHE', display: 'Cache' },
    TOOL_KIND_SEARCH: { code: 'OPS_TOOL_SEARCH', display: 'Search engine' },
    TOOL_KIND_STORAGE: { code: 'OPS_TOOL_STORAGE', display: 'File storage' },
    TOOL_KIND_MESSAGING: { code: 'OPS_TOOL_MESSAGING', display: 'Messaging' },
    TOOL_KIND_PAYMENTS: { code: 'OPS_TOOL_PAYMENTS', display: 'Payments' },
    TOOL_KIND_AI: { code: 'OPS_TOOL_AI', display: 'AI service' },
    TOOL_KIND_MAPS: { code: 'OPS_TOOL_MAPS', display: 'Maps and geocoding' },
    TOOL_KIND_ANALYTICS: { code: 'OPS_TOOL_ANALYTICS', display: 'Analytics' },
    TOOL_KIND_SECURITY: { code: 'OPS_TOOL_SECURITY', display: 'Security' },
    TOOL_KIND_OBSERVABILITY: {
      code: 'OPS_TOOL_OBSERVABILITY',
      display: 'Observability',
    },
    TOOL_KIND_OTHER: { code: 'OPS_TOOL_OTHER', display: 'Other tool' },

    // --- Estado de catálogo (tool_registry.state_concept_id) ---
    TOOL_STATE_ACTIVE: { code: 'OPS_TOOL_ACTIVE', display: 'Tool active' },
    TOOL_STATE_PLANNED: { code: 'OPS_TOOL_PLANNED', display: 'Tool planned' },
    TOOL_STATE_DEPRECATED: {
      code: 'OPS_TOOL_DEPRECATED',
      display: 'Tool deprecated',
    },
    TOOL_STATE_DISABLED: {
      code: 'OPS_TOOL_DISABLED',
      display: 'Tool disabled',
    },

    // --- Tipo de componente (service_components.component_type_concept_id) ---
    COMPONENT_EXTERNAL_DEPENDENCY: {
      code: 'OPS_COMP_EXTERNAL_DEPENDENCY',
      display: 'External dependency',
    },

    // --- Criticidad (service_components.criticality_concept_id) ---
    CRITICALITY_CRITICAL: {
      code: 'OPS_CRIT_CRITICAL',
      display: 'Critical component',
    },
    CRITICALITY_NON_CRITICAL: {
      code: 'OPS_CRIT_NON_CRITICAL',
      display: 'Non-critical component',
    },

    // --- Tipo de chequeo (health_checks.check_type_concept_id) ---
    CHECK_LIVE: { code: 'OPS_CHECK_LIVE', display: 'Live probe' },
    CHECK_CONFIGURATION: {
      code: 'OPS_CHECK_CONFIGURATION',
      display: 'Configuration check',
    },
    CHECK_NOT_APPLICABLE: {
      code: 'OPS_CHECK_NOT_APPLICABLE',
      display: 'No check applicable',
    },

    // --- Objetivo del chequeo (health_checks.target_kind_concept_id) ---
    TARGET_READINESS_PROBE: {
      code: 'OPS_TARGET_READINESS_PROBE',
      display: 'Readiness probe',
    },
    TARGET_ENV_VARS: {
      code: 'OPS_TARGET_ENV_VARS',
      display: 'Environment variables',
    },
    TARGET_NONE: { code: 'OPS_TARGET_NONE', display: 'No target' },

    // --- Uso del componente (component_tools.usage_concept_id) ---
    USAGE_RUNTIME_DEPENDENCY: {
      code: 'OPS_USAGE_RUNTIME_DEPENDENCY',
      display: 'Runtime dependency',
    },
  });
