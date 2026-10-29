/**
 * Sub-códigos de negocio estables del módulo `practice`.
 *
 * Van en el 3er argumento (`reason`) de `DomainException` y sus subclases.
 * Un cliente puede ramificar sobre `reason` sin parsear `message`.
 */
export enum PracticeErrorReason {
  /**
   * La práctica, sede, vinculación, acreditación o insumo pedido por uuid no
   * existe o es de otro tenant. Los dos casos responden igual: distinguirlos
   * confirmaría que el uuid existe en otra organización.
   */
  PRACTICE_RESOURCE_OUT_OF_SCOPE = 'PRACTICE_RESOURCE_OUT_OF_SCOPE',
  /** El concepto del servicio no es un procedimiento del nomenclador. */
  SERVICE_CONCEPT_NOT_A_PROCEDURE = 'SERVICE_CONCEPT_NOT_A_PROCEDURE',
  /** El ítem de catálogo no es de la práctica, está inactivo o es de otro procedimiento. */
  CATALOG_ITEM_NOT_ELIGIBLE = 'CATALOG_ITEM_NOT_ELIGIBLE',
  /** La sede ya ofrece ese procedimiento. */
  SERVICE_ALREADY_OFFERED_AT_SITE = 'SERVICE_ALREADY_OFFERED_AT_SITE',

  // --- Infraestructura hospitalaria F1 (CONTRATO-F0-F1 §3) -------------------
  /** El código del espacio ya existe en la sede (también el de uno clausurado: no se reutiliza). */
  SPACE_CODE_TAKEN = 'SPACE_CODE_TAKEN',
  /** La forma del espacio no puede colgar de la forma del padre (o no puede ser raíz). */
  SPACE_PARENT_RULE = 'SPACE_PARENT_RULE',
  /** La función no admite la forma elegida (perfil de función). */
  SPACE_FUNCTION_FORM_MISMATCH = 'SPACE_FUNCTION_FORM_MISMATCH',
  /** La tipología del establecimiento no admite esa función. */
  TYPOLOGY_NOT_ALLOWED = 'TYPOLOGY_NOT_ALLOWED',
  /** El código o la forma de un espacio activo no se cambian. */
  SPACE_IMMUTABLE_FIELD = 'SPACE_IMMUTABLE_FIELD',
  /** Mover bajo sí mismo o bajo un descendiente. */
  SPACE_CYCLE = 'SPACE_CYCLE',
  /** Un hijo no puede quedar más activo que su padre. */
  PARENT_NOT_ACTIVE = 'PARENT_NOT_ACTIVE',
  /** La clausura tiene bloqueos pendientes (el cuerpo trae `blockers`). */
  SPACE_RETIRE_BLOCKED = 'SPACE_RETIRE_BLOCKED',
  /** La unidad tiene hijos, espacios o personal activos. */
  UNIT_RETIRE_BLOCKED = 'UNIT_RETIRE_BLOCKED',
  /** La acción de ciclo de vida no aplica desde el estado actual. */
  LIFECYCLE_TRANSITION_INVALID = 'LIFECYCLE_TRANSITION_INVALID',
  /** `suspend` y `retire` exigen un motivo no vacío. */
  LIFECYCLE_REASON_REQUIRED = 'LIFECYCLE_REASON_REQUIRED',
  /** Faltan datos que el perfil de la función exige para activar. */
  SPACE_PROFILE_INCOMPLETE = 'SPACE_PROFILE_INCOMPLETE',
  /** El patrón de alta masiva no se puede expandir. */
  SPACE_BULK_PATTERN_INVALID = 'SPACE_BULK_PATTERN_INVALID',
  /** El alta masiva supera el máximo de filas. */
  SPACE_BULK_LIMIT = 'SPACE_BULK_LIMIT',
  /** Alguna fila del lote o del CSV es inválida; nada se creó. */
  SPACE_BATCH_INVALID = 'SPACE_BATCH_INVALID',
  /** La unidad clínica no es de la misma sede que el espacio. */
  UNIT_SITE_MISMATCH = 'UNIT_SITE_MISMATCH',
  /** El espacio ya tiene un vínculo OWNER vigente. */
  SPACE_UNIT_OWNER_TAKEN = 'SPACE_UNIT_OWNER_TAKEN',
  /** El par espacio-unidad ya tiene un vínculo vigente. */
  SPACE_UNIT_ASSIGNMENT_EXISTS = 'SPACE_UNIT_ASSIGNMENT_EXISTS',
  /** El vínculo ya está cerrado. */
  SPACE_UNIT_ASSIGNMENT_CLOSED = 'SPACE_UNIT_ASSIGNMENT_CLOSED',
  /** Cambiar la tipología deja espacios existentes que la incumplen (el cuerpo trae la lista). */
  TYPOLOGY_CONFLICT = 'TYPOLOGY_CONFLICT',
  /** El código SNIS no está disponible (mensaje genérico a propósito: no revela de quién es). */
  SNIS_CODE_UNAVAILABLE = 'SNIS_CODE_UNAVAILABLE',
  /** La sede no tiene código SNIS que verificar. */
  SNIS_CODE_MISSING = 'SNIS_CODE_MISSING',
  /** El espacio padre es de otra sede del tenant. */
  PARENT_SITE_MISMATCH = 'PARENT_SITE_MISMATCH',
  /** La unidad clínica está clausurada y no admite vínculos nuevos. */
  UNIT_NOT_AVAILABLE = 'UNIT_NOT_AVAILABLE',
  /** El número de habilitación ya existe para ese tipo en la organización. */
  LICENSE_NUMBER_TAKEN = 'LICENSE_NUMBER_TAKEN',
  /** La vigencia de la habilitación o de la capacidad es incoherente. */
  VALIDITY_RANGE_INVALID = 'VALIDITY_RANGE_INVALID',
  /** El `If-Match` no coincide con la `rowVersion` vigente (412). */
  ROW_VERSION_MISMATCH = 'ROW_VERSION_MISMATCH',
  /** Falta la cabecera `If-Match` en una modificación (428). */
  IF_MATCH_REQUIRED = 'IF_MATCH_REQUIRED',
  /** Un código de concepto no pertenece al catálogo esperado. */
  CATALOG_CODE_INVALID = 'CATALOG_CODE_INVALID',
}
