import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo forms (09) — prefijo `forms:`.
 *
 * Solo se declaran los estados / tipos / resultados que los endpoints de este
 * módulo escriben en columnas `*_concept_id`. Los estados transversales
 * ("activo", "normal", etc.) se reutilizan desde `CONCEPTS.*` cuando aplica para
 * no duplicar códigos en el mismo code-system durante el seed.
 *
 * `FORMS_CONCEPT_SEEDS` lo consume el agregador central del seed; `FORMS` es el
 * mapa `nombre -> UUID` determinista que consumen servicios y repositorios.
 */
export const { seeds: FORMS_CONCEPT_SEEDS, ids: FORMS } = defineModuleConcepts(
  'forms',
  {
    // --- Ciclo de vida del set de definiciones (field_definition_sets.status) ---
    SET_STATUS_DRAFT: {
      code: 'FORMS_SET_DRAFT',
      display: 'Definition set draft',
    },
    SET_STATUS_ACTIVE: {
      code: 'FORMS_SET_ACTIVE',
      display: 'Definition set active',
    },

    // --- Publicación de versión (field_definition_set_versions.publication_status) ---
    PUB_DRAFT: {
      code: 'FORMS_PUB_DRAFT',
      display: 'Version publication draft',
    },
    PUB_PUBLISHED: {
      code: 'FORMS_PUB_PUBLISHED',
      display: 'Version published',
    },
    COMPAT_BACKWARD: {
      code: 'FORMS_COMPAT_BACKWARD',
      display: 'Backward compatible',
    },

    // --- Dominio destino por defecto (field_definition_sets.target_domain) ---
    TARGET_DOMAIN_GENERIC: {
      code: 'FORMS_TARGET_DOMAIN_GENERIC',
      display: 'Generic target domain',
    },

    // --- Estado de definición de campo / asignación (state_concept_id) ---
    FIELD_ACTIVE: {
      code: 'FORMS_FIELD_ACTIVE',
      display: 'Field definition active',
    },
    ASSIGNMENT_ACTIVE: {
      code: 'FORMS_ASSIGNMENT_ACTIVE',
      display: 'Field assignment active',
    },

    // --- Reglas de validación (field_validation_rules) ---
    RULE_TYPE_REQUIRED: {
      code: 'FORMS_RULE_REQUIRED',
      display: 'Required rule',
    },
    RULE_TYPE_RANGE: { code: 'FORMS_RULE_RANGE', display: 'Range rule' },
    RULE_TYPE_REGEX: { code: 'FORMS_RULE_REGEX', display: 'Regex rule' },
    SEVERITY_ERROR: { code: 'FORMS_SEVERITY_ERROR', display: 'Error severity' },
    SEVERITY_WARNING: {
      code: 'FORMS_SEVERITY_WARNING',
      display: 'Warning severity',
    },

    // --- Operadores y comportamientos de dependencia (field_dependencies) ---
    OP_EQUALS: { code: 'FORMS_OP_EQUALS', display: 'Equals operator' },
    OP_NOT_EQUALS: {
      code: 'FORMS_OP_NOT_EQUALS',
      display: 'Not-equals operator',
    },
    OP_GREATER_THAN: { code: 'FORMS_OP_GT', display: 'Greater-than operator' },
    OP_LESS_THAN: { code: 'FORMS_OP_LT', display: 'Less-than operator' },
    BEHAVIOR_SHOW: { code: 'FORMS_BEHAVIOR_SHOW', display: 'Show behavior' },
    BEHAVIOR_HIDE: { code: 'FORMS_BEHAVIOR_HIDE', display: 'Hide behavior' },
    BEHAVIOR_REQUIRE: {
      code: 'FORMS_BEHAVIOR_REQUIRE',
      display: 'Require behavior',
    },

    // --- Ciclo de vida de la instancia de formulario (form_instances.state) ---
    INSTANCE_OPEN: {
      code: 'FORMS_INSTANCE_OPEN',
      display: 'Form instance open',
    },
    INSTANCE_CLOSED: {
      code: 'FORMS_INSTANCE_CLOSED',
      display: 'Form instance closed',
    },

    // --- Origen y estado de los valores capturados (field_values) ---
    SOURCE_INTERNAL: {
      code: 'FORMS_SOURCE_INTERNAL',
      display: 'Internally captured value',
    },
    SOURCE_EXTERNAL: {
      code: 'FORMS_SOURCE_EXTERNAL',
      display: 'Externally imported value',
    },
    VALUE_FINAL: { code: 'FORMS_VALUE_FINAL', display: 'Final value' },
    VALUE_PRELIMINARY: {
      code: 'FORMS_VALUE_PRELIMINARY',
      display: 'Preliminary value',
    },
    VALUE_CORRECTED: {
      code: 'FORMS_VALUE_CORRECTED',
      display: 'Corrected value',
    },
    VALUE_SUPERSEDED: {
      code: 'FORMS_VALUE_SUPERSEDED',
      display: 'Superseded value',
    },

    // --- Acciones del log de auditoría de valores (field_value_audit.action) ---
    AUDIT_CREATE: { code: 'FORMS_AUDIT_CREATE', display: 'Value created' },
    AUDIT_CORRECT: { code: 'FORMS_AUDIT_CORRECT', display: 'Value corrected' },
    AUDIT_IMPORT: { code: 'FORMS_AUDIT_IMPORT', display: 'Value imported' },
    AUDIT_MIGRATE: { code: 'FORMS_AUDIT_MIGRATE', display: 'Value migrated' },
    REASON_CORRECTION: {
      code: 'FORMS_REASON_CORRECTION',
      display: 'Data entry correction',
    },

    // --- Tipo de recurso destino por defecto (form_instances / field_values) ---
    RESOURCE_TYPE_PATIENT: {
      code: 'FORMS_RESOURCE_PATIENT',
      display: 'Patient resource',
    },

    /**
     * El recurso es un encuentro, no el paciente.
     *
     * Las fichas por especialidad se abren SOBRE la consulta: `resourceId` es
     * el `encounters.id` y así lo lee la cara de lectura, que resuelve la
     * propiedad cargando el encuentro. Hasta ahora viajaban tipadas como
     * paciente porque era el único tipo declarado y el default silencioso de
     * `openInstance` — el dato quedaba diciendo algo que no era.
     */
    RESOURCE_TYPE_ENCOUNTER: {
      code: 'FORMS_RESOURCE_ENCOUNTER',
      display: 'Encounter resource',
    },

    // --- Enmascarado y estado de reglas de acceso (field_value_access_rules) ---
    ACCESS_RULE_ACTIVE: {
      code: 'FORMS_ACCESS_RULE_ACTIVE',
      display: 'Access rule active',
    },
    MASK_NONE: { code: 'FORMS_MASK_NONE', display: 'No masking' },
    MASK_REDACT: { code: 'FORMS_MASK_REDACT', display: 'Redact masking' },
    MASK_HASH: { code: 'FORMS_MASK_HASH', display: 'Hash masking' },

    // --- Migración de esquema (field_schema_migrations.status / type) ---
    MIGRATION_PENDING: {
      code: 'FORMS_MIGRATION_PENDING',
      display: 'Migration pending',
    },
    MIGRATION_RUNNING: {
      code: 'FORMS_MIGRATION_RUNNING',
      display: 'Migration running',
    },
    MIGRATION_COMPLETED: {
      code: 'FORMS_MIGRATION_COMPLETED',
      display: 'Migration completed',
    },
    MIGRATION_TYPE_TRANSFORM: {
      code: 'FORMS_MIGRATION_TRANSFORM',
      display: 'Transformation migration',
    },

    // --- Verificación de procedencia importada (field_value_provenance) ---
    VERIF_UNVERIFIED: {
      code: 'FORMS_VERIF_UNVERIFIED',
      display: 'Provenance unverified',
    },
    VERIF_VERIFIED: {
      code: 'FORMS_VERIF_VERIFIED',
      display: 'Provenance verified',
    },
  },
);

/** Comportamientos de dependencia expuestos por el DTO → concept id. */
export const DEPENDENCY_BEHAVIOR_BY_CODE: Record<
  'SHOW' | 'HIDE' | 'REQUIRE',
  string
> = {
  SHOW: FORMS.BEHAVIOR_SHOW,
  HIDE: FORMS.BEHAVIOR_HIDE,
  REQUIRE: FORMS.BEHAVIOR_REQUIRE,
};

/** Operadores expuestos por el DTO (dependencias / reglas) → concept id. */
export const OPERATOR_BY_CODE: Record<'EQ' | 'NEQ' | 'GT' | 'LT', string> = {
  EQ: FORMS.OP_EQUALS,
  NEQ: FORMS.OP_NOT_EQUALS,
  GT: FORMS.OP_GREATER_THAN,
  LT: FORMS.OP_LESS_THAN,
};

/** Tipos de regla de validación expuestos por el DTO → concept id. */
export const RULE_TYPE_BY_CODE: Record<'REQUIRED' | 'RANGE' | 'REGEX', string> =
  {
    REQUIRED: FORMS.RULE_TYPE_REQUIRED,
    RANGE: FORMS.RULE_TYPE_RANGE,
    REGEX: FORMS.RULE_TYPE_REGEX,
  };

/** Estrategias de enmascarado expuestas por el DTO → concept id. */
export const MASK_STRATEGY_BY_CODE: Record<'NONE' | 'REDACT' | 'HASH', string> =
  {
    NONE: FORMS.MASK_NONE,
    REDACT: FORMS.MASK_REDACT,
    HASH: FORMS.MASK_HASH,
  };
