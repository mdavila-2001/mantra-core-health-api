/**
 * Catálogo de sub-códigos de negocio estables del módulo `delegated_access`. Se
 * usan como tercer argumento (`reason`) de las excepciones de dominio, para que
 * un cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum DelegatedAccessErrorReason {
  /** El tenant del cuerpo no coincide con el tenant activo del actor. */
  DELEGATED_TENANT_SCOPE_REQUIRED = 'DELEGATED_TENANT_SCOPE_REQUIRED',
  /** El set de permisos no existe o no pertenece al tenant activo. */
  DELEGATED_PERMISSION_SET_NOT_FOUND = 'DELEGATED_PERMISSION_SET_NOT_FOUND',
  /** La delegación no existe o no pertenece al tenant activo. */
  DELEGATED_DELEGATION_NOT_FOUND = 'DELEGATED_DELEGATION_NOT_FOUND',
  /** La asignación de usuario de organización no existe o es de otro tenant. */
  DELEGATED_ORG_ASSIGNMENT_NOT_FOUND = 'DELEGATED_ORG_ASSIGNMENT_NOT_FOUND',
  /** La membresía (o la persona) no existe o es de otro tenant. */
  DELEGATED_MEMBERSHIP_NOT_FOUND = 'DELEGATED_MEMBERSHIP_NOT_FOUND',
  /** El nodo de alcance (práctica, sede, unidad, espacio, diagnóstico, farmacia) no existe o es de otro tenant. */
  DELEGATED_SCOPE_NODE_NOT_FOUND = 'DELEGATED_SCOPE_NODE_NOT_FOUND',
  /** La asignación de rol del profesional no existe o es de otro tenant. */
  DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND = 'DELEGATED_ROLE_ASSIGNMENT_NOT_FOUND',
  /** El encuentro no existe, es de otro tenant o no es del paciente indicado. */
  DELEGATED_ENCOUNTER_NOT_FOUND = 'DELEGATED_ENCOUNTER_NOT_FOUND',
  /** El paciente indicado no existe. */
  DELEGATED_PATIENT_NOT_FOUND = 'DELEGATED_PATIENT_NOT_FOUND',
  /** El usuario evaluado no es el titular de la asignación del delegado (resultado de evaluación). */
  DELEGATED_SUBJECT_MISMATCH = 'DELEGATED_SUBJECT_MISMATCH',
  /** La plantilla de rol no existe o no es visible para la organización. */
  SUPPORT_TEMPLATE_NOT_FOUND = 'SUPPORT_TEMPLATE_NOT_FOUND',
  /** La plantilla de plataforma no se edita desde una organización. */
  SUPPORT_TEMPLATE_READ_ONLY = 'SUPPORT_TEMPLATE_READ_ONLY',
  /** El vínculo de apoyo no existe o no es de la organización o de la persona. */
  SUPPORT_ENGAGEMENT_NOT_FOUND = 'SUPPORT_ENGAGEMENT_NOT_FOUND',
  /** El vínculo no está activo, así que no admite la operación. */
  SUPPORT_ENGAGEMENT_NOT_ACTIVE = 'SUPPORT_ENGAGEMENT_NOT_ACTIVE',
  /** La solicitud no existe o no es de la organización. */
  SUPPORT_REQUEST_NOT_FOUND = 'SUPPORT_REQUEST_NOT_FOUND',
  /** La solicitud ya no está pendiente (decidida, vencida o cancelada). */
  SUPPORT_REQUEST_NOT_PENDING = 'SUPPORT_REQUEST_NOT_PENDING',
  /** La solicitud venció a los 15 días sin decisión. */
  SUPPORT_REQUEST_EXPIRED = 'SUPPORT_REQUEST_EXPIRED',
  /** La decisión no cubre todos los ítems pendientes. */
  SUPPORT_DECISION_INCOMPLETE = 'SUPPORT_DECISION_INCOMPLETE',
  /** Rechazar o ajustar exige un motivo. */
  SUPPORT_DECISION_REASON_REQUIRED = 'SUPPORT_DECISION_REASON_REQUIRED',
  /** Las referencias del objetivo no son coherentes con su tipo. */
  SUPPORT_TARGET_INVALID = 'SUPPORT_TARGET_INVALID',
  /** Doctor, servicio, espacio o sede inexistentes o de otra organización. */
  SUPPORT_TARGET_NOT_FOUND = 'SUPPORT_TARGET_NOT_FOUND',
  /** El permiso de apoyo no existe en el vínculo indicado. */
  SUPPORT_GRANT_NOT_FOUND = 'SUPPORT_GRANT_NOT_FOUND',
  /** La delegación no existe o no es del doctor que la usa. */
  SUPPORT_DELEGATE_NOT_FOUND = 'SUPPORT_DELEGATE_NOT_FOUND',
  /** La invitación es inválida, vencida, agotada o no es para esta persona. */
  SUPPORT_INVITATION_INVALID = 'SUPPORT_INVITATION_INVALID',
  /** Afiliarse como médico exige una cuenta con perfil profesional. */
  SUPPORT_PRACTITIONER_PROFILE_REQUIRED = 'SUPPORT_PRACTITIONER_PROFILE_REQUIRED',
  /** La organización no tiene una práctica activa que reciba la solicitud del médico. */
  SUPPORT_AFFILIATION_PRACTICE_MISSING = 'SUPPORT_AFFILIATION_PRACTICE_MISSING',
  /** La búsqueda de pacientes del personal de apoyo debe ser exacta. */
  SUPPORT_PATIENT_SEARCH_INEXACT = 'SUPPORT_PATIENT_SEARCH_INEXACT',
  /** La persona de apoyo no puede buscar pacientes en esa organización. */
  SUPPORT_PATIENT_SEARCH_DENIED = 'SUPPORT_PATIENT_SEARCH_DENIED',
  SUPPORT_PATIENT_SEARCH_THROTTLED = 'SUPPORT_PATIENT_SEARCH_THROTTLED',
  /** La persona de apoyo no puede registrar pacientes en esa organización. */
  SUPPORT_PATIENT_REGISTER_DENIED = 'SUPPORT_PATIENT_REGISTER_DENIED',
  /** Un menor de edad se registra con su representante legal o familiar autorizado. */
  SUPPORT_PATIENT_GUARDIAN_REQUIRED = 'SUPPORT_PATIENT_GUARDIAN_REQUIRED',
  /** El documento ya está registrado: se retoma a la persona, no se duplica. */
  SUPPORT_PATIENT_DOCUMENT_REGISTERED = 'SUPPORT_PATIENT_DOCUMENT_REGISTERED',
  /** `org` y `tenantId` (o `document` y `nationalId`) llegaron con valores distintos. */
  SUPPORT_PATIENT_INPUT_CONFLICT = 'SUPPORT_PATIENT_INPUT_CONFLICT',
  SUPPORT_REQUEST_LIMIT_REACHED = 'SUPPORT_REQUEST_LIMIT_REACHED',
  SUPPORT_DECISION_SELF = 'SUPPORT_DECISION_SELF',
  /** El código de plantilla de una organización ya existe. */
  SUPPORT_TEMPLATE_CODE_TAKEN = 'SUPPORT_TEMPLATE_CODE_TAKEN',
  /**
   * 13.º código de condiciones (422): un valor o una forma de `condition_json`
   * que no es válida (tipo equivocado, fuera de rango, JSON roto). Los otros
   * doce los fija CONTRATO-GOBIERNO §8.4; este lo agrega `validateCondition`.
   */
  CONDITION_VALUE_INVALID = 'CONDITION_VALUE_INVALID',

  // --- Condiciones (422), CONTRATO-GOBIERNO §8.4 ---
  /** La versión del esquema de la condición no la entiende este servidor. (422) */
  CONDITION_SCHEMA_VERSION_UNSUPPORTED = 'CONDITION_SCHEMA_VERSION_UNSUPPORTED',
  /** La condición trae una clave que el esquema no define. (422) */
  CONDITION_UNKNOWN_KEY = 'CONDITION_UNKNOWN_KEY',
  /** La condición supera el tamaño o la profundidad permitidos. (422) */
  CONDITION_TOO_LARGE = 'CONDITION_TOO_LARGE',
  /** Una ventana horaria vacía (`from` igual a `to`) o sin días. (422) */
  CONDITION_TIME_EMPTY_WINDOW = 'CONDITION_TIME_EMPTY_WINDOW',
  /** La zona horaria no existe. (422) */
  CONDITION_TIME_ZONE_INVALID = 'CONDITION_TIME_ZONE_INVALID',
  /** Un tope (`limits`) con valores fuera de rango. (422) */
  CONDITION_LIMIT_INVALID = 'CONDITION_LIMIT_INVALID',
  /** La clave de la condición no aplica a ese átomo. (422) */
  CONDITION_NOT_APPLICABLE_TO_ATOM = 'CONDITION_NOT_APPLICABLE_TO_ATOM',
  /** Una denegación explícita no lleva condiciones que la aflojen. (422) */
  CONDITION_NOT_ALLOWED_ON_DENY = 'CONDITION_NOT_ALLOWED_ON_DENY',
  /** La condición de campo nombra un campo que la concesión no incluye. (422) */
  CONDITION_FIELD_NOT_GRANTED = 'CONDITION_FIELD_NOT_GRANTED',
  /** La condición de red exige reglas de la organización y no hay ninguna. (422) */
  CONDITION_NETWORK_NO_RULES = 'CONDITION_NETWORK_NO_RULES',
  /** Una obligación que afloja lo que el catálogo exige para el átomo. (422) */
  CONDITION_OBLIGATION_LOOSENS_CATALOG = 'CONDITION_OBLIGATION_LOOSENS_CATALOG',
  /** El techo de delegación nombra un átomo que un delegado nunca otorga. (422) */
  CONDITION_CEILING_FORBIDDEN_ATOM = 'CONDITION_CEILING_FORBIDDEN_ATOM',
  // --- Barandillas (L0/L1), §4.2 ---
  /** GP-1: el átomo no es asignable al personal de apoyo. (422) */
  GUARDRAIL_NOT_DELEGABLE = 'GUARDRAIL_NOT_DELEGABLE',
  /** GP-2: la concesión excede el techo de la plantilla (o una regla `CEILING`). (422) */
  GUARDRAIL_CEILING_EXCEEDED = 'GUARDRAIL_CEILING_EXCEEDED',
  /** GP-5: un administrador delegado no otorga ese átomo. (422) */
  GUARDRAIL_DELEGATED_FORBIDDEN_ATOM = 'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
  /** GP-7: un átomo CRÍTICA exige `valid_to` y 90 días como máximo. (422) */
  GUARDRAIL_CRITICAL_REQUIRES_EXPIRY = 'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
  /** GP-8: nadie se supervisa a sí mismo. (422) */
  GUARDRAIL_SELF_SUPERVISION = 'GUARDRAIL_SELF_SUPERVISION',
  /** Una regla de la organización no puede aflojar la plataforma. (422) */
  GUARDRAIL_RULE_LOOSENS_PLATFORM = 'GUARDRAIL_RULE_LOOSENS_PLATFORM',
  /** GP-6: nadie otorga, aprueba, certifica ni revoca permisos propios. (403) */
  GUARDRAIL_SELF_ADMIN = 'GUARDRAIL_SELF_ADMIN',
  /** GP-6: un delegado no gestiona a otro delegado ni a un administrador. (403) */
  GUARDRAIL_PEER_ADMIN = 'GUARDRAIL_PEER_ADMIN',
  // --- Administración delegada, §6.4 ---
  /** Lo que se otorga excede el techo del administrador delegado. (403) */
  ADMIN_CEILING_EXCEEDED = 'ADMIN_CEILING_EXCEEDED',
  /** El objetivo o la persona están fuera del alcance del administrador delegado. (403) */
  ADMIN_SCOPE_EXCEEDED = 'ADMIN_SCOPE_EXCEEDED',
  // --- Segregación de funciones (SoD), §6.3 ---
  /** El otorgamiento crea un conflicto de funciones que se bloquea. (422) */
  SOD_CONFLICT_BLOCKED = 'SOD_CONFLICT_BLOCKED',
  /** La regla no admite excepción (`is_hard`). (422) */
  SOD_RULE_HARD = 'SOD_RULE_HARD',
  /** Una regla de la organización no puede aflojar la de plataforma. (422) */
  SOD_RULE_LOOSENS_BASE = 'SOD_RULE_LOOSENS_BASE',
  /** Las reglas de plataforma no se editan desde una organización. (422) */
  SOD_RULE_PLATFORM_READ_ONLY = 'SOD_RULE_PLATFORM_READ_ONLY',
  /** El conflicto exige una excepción aprobada (cuatro ojos). (409) */
  SOD_EXCEPTION_REQUIRED = 'SOD_EXCEPTION_REQUIRED',
  /** La excepción no existe o es de otra organización. (404) */
  SOD_EXCEPTION_NOT_FOUND = 'SOD_EXCEPTION_NOT_FOUND',
  /** La regla solo advierte: no hace falta excepción (interno del dominio). (422) */
  SOD_EXCEPTION_NOT_NEEDED = 'SOD_EXCEPTION_NOT_NEEDED',
  /** La justificación de la excepción tiene menos de 30 caracteres (interno). (422) */
  JUSTIFICATION_TOO_SHORT = 'JUSTIFICATION_TOO_SHORT',
  /** La excepción exige fecha de fin (interno). (422) */
  VALID_TO_REQUIRED = 'VALID_TO_REQUIRED',
  /** La fecha de fin ya pasó (interno). (422) */
  VALID_TO_NOT_IN_FUTURE = 'VALID_TO_NOT_IN_FUTURE',
  /** La fecha de fin supera el tope de días aplicable (interno). (422) */
  VALID_TO_EXCEEDS_LIMIT = 'VALID_TO_EXCEEDS_LIMIT',
  // --- Cuatro ojos, §6.5 ---
  /** Nadie aprueba lo propio. (403) */
  FOUR_EYES_SELF_APPROVAL = 'FOUR_EYES_SELF_APPROVAL',
  /** La persona no es un aprobador elegible de esta solicitud. (403) */
  FOUR_EYES_NOT_ELIGIBLE = 'FOUR_EYES_NOT_ELIGIBLE',
  /** La solicitud ya no está pendiente. (409) */
  FOUR_EYES_NOT_PENDING = 'FOUR_EYES_NOT_PENDING',
  /** La solicitud o su aprobación vencieron. (409) */
  FOUR_EYES_EXPIRED = 'FOUR_EYES_EXPIRED',
  /** El cuerpo que se ejecuta no es el que se aprobó (el hash no coincide). (409) */
  FOUR_EYES_PAYLOAD_CHANGED = 'FOUR_EYES_PAYLOAD_CHANGED',
  /** Lo aprobado ya no es válido al ejecutarlo (guardarraíles, SoD, techo o versión). (409) */
  FOUR_EYES_PAYLOAD_INVALID = 'FOUR_EYES_PAYLOAD_INVALID',
  /** La aprobación de acción ya se usó. (409) */
  FOUR_EYES_ALREADY_CONSUMED = 'FOUR_EYES_ALREADY_CONSUMED',
  /** Ya hay una solicitud pendiente idéntica. (409) */
  FOUR_EYES_DUPLICATE_PENDING = 'FOUR_EYES_DUPLICATE_PENDING',
  /** La solicitud no existe o es de otra organización. (404) */
  FOUR_EYES_NOT_FOUND = 'FOUR_EYES_NOT_FOUND',
  /** Rechazar exige un comentario (interno del dominio). (422) */
  COMMENT_REQUIRED = 'COMMENT_REQUIRED',
  // --- Campañas de certificación, §6.2 ---
  /** El alcance de la campaña no trae ninguna concesión. (422) */
  REVIEW_SCOPE_EMPTY = 'REVIEW_SCOPE_EMPTY',
  /** La decisión exige un comentario de al menos 10 caracteres. (422) */
  REVIEW_COMMENT_REQUIRED = 'REVIEW_COMMENT_REQUIRED',
  /** Un ajuste de revisión solo puede reducir. (422) */
  REVIEW_ADJUST_CANNOT_BROADEN = 'REVIEW_ADJUST_CANNOT_BROADEN',
  /** El ajuste no aplica a este ítem (interno del dominio). (422) */
  REVIEW_ADJUST_NOT_APPLICABLE = 'REVIEW_ADJUST_NOT_APPLICABLE',
  /** La decisión masiva solo admite certificar ítems de riesgo bajo y con uso reciente. (422) */
  REVIEW_BULK_NOT_ALLOWED = 'REVIEW_BULK_NOT_ALLOWED',
  /** La persona no es revisora de este ítem. (403) */
  REVIEW_NOT_REVIEWER = 'REVIEW_NOT_REVIEWER',
  /** El ítem ya tiene decisión. (409) */
  REVIEW_ALREADY_DECIDED = 'REVIEW_ALREADY_DECIDED',
  /** La campaña no está abierta. (409) */
  REVIEW_CAMPAIGN_NOT_OPEN = 'REVIEW_CAMPAIGN_NOT_OPEN',
  /** La campaña ya no es un borrador. (409) */
  REVIEW_CAMPAIGN_NOT_DRAFT = 'REVIEW_CAMPAIGN_NOT_DRAFT',
  /** Ya hay una campaña igual abierta. (409) */
  REVIEW_CAMPAIGN_DUPLICATE = 'REVIEW_CAMPAIGN_DUPLICATE',
  /** El ítem no existe o no es de la organización. (404) */
  REVIEW_ITEM_NOT_FOUND = 'REVIEW_ITEM_NOT_FOUND',
  /** La campaña no existe o no es de la organización. (404) */
  REVIEW_CAMPAIGN_NOT_FOUND = 'REVIEW_CAMPAIGN_NOT_FOUND',
  /** Un administrador delegado no cierra a mano una campaña antes de su fecha y gracia. (409) */
  REVIEW_CAMPAIGN_NOT_DUE = 'REVIEW_CAMPAIGN_NOT_DUE',
  /** El plazo de la campaña es menor que el mínimo para un administrador delegado. (422) */
  REVIEW_SCHEDULE_TOO_SHORT = 'REVIEW_SCHEDULE_TOO_SHORT',
  // --- Ciclo de vida y traspaso, §6.1 ---
  /** El destinatario del traspaso no es elegible. (422) */
  HANDOVER_TARGET_INELIGIBLE = 'HANDOVER_TARGET_INELIGIBLE',
  /** La baja de un dueño de cuentas exige nuevo dueño para sus supervisadas. (422) */
  HANDOVER_SUPERVISOR_REQUIRED = 'HANDOVER_SUPERVISOR_REQUIRED',
  /** La persona propuesta no puede ser dueña de la cuenta. (422) */
  OWNER_NOT_ELIGIBLE = 'OWNER_NOT_ELIGIBLE',
  /** El vínculo ya está suspendido. (409) */
  ENGAGEMENT_ALREADY_SUSPENDED = 'ENGAGEMENT_ALREADY_SUSPENDED',
  /** El vínculo no está suspendido. (409) */
  ENGAGEMENT_NOT_SUSPENDED = 'ENGAGEMENT_NOT_SUSPENDED',
  /** El ítem de la lista de verificación se completa solo. (409) */
  LIFECYCLE_ITEM_AUTOMATIC = 'LIFECYCLE_ITEM_AUTOMATIC',
  /** El ítem no existe en la lista de verificación (interno del dominio). (404) */
  LIFECYCLE_ITEM_UNKNOWN = 'LIFECYCLE_ITEM_UNKNOWN',
  /** El caso de ciclo de vida no existe o es de otra organización. (404) */
  LIFECYCLE_CASE_NOT_FOUND = 'LIFECYCLE_CASE_NOT_FOUND',
  // --- Simulación, ajustes e informes, §5, §8.3 ---
  /** La simulación supera los 400 escenarios. (422) */
  SIMULATION_TOO_LARGE = 'SIMULATION_TOO_LARGE',
  /** Falta el vínculo o la persona sobre la que se simula. (422) */
  SIMULATION_NO_TARGET = 'SIMULATION_NO_TARGET',
  /** Lo que se guarda no es lo que se simuló. (409) */
  SIMULATION_STALE = 'SIMULATION_STALE',
  /** Los ajustes de gobierno no son válidos. (422) */
  GOVERNANCE_SETTINGS_INVALID = 'GOVERNANCE_SETTINGS_INVALID',
  /** Ya existe una regla activa igual. (409) */
  GOVERNANCE_RULE_DUPLICATE = 'GOVERNANCE_RULE_DUPLICATE',
  /** La regla no existe o es de otra organización. (404) */
  GOVERNANCE_RULE_NOT_FOUND = 'GOVERNANCE_RULE_NOT_FOUND',
  /** Exportar exige un motivo. (422) */
  EXPORT_REASON_REQUIRED = 'EXPORT_REASON_REQUIRED',
  /** El tipo de exportación no existe. (422) */
  EXPORT_KIND_INVALID = 'EXPORT_KIND_INVALID',
  /** La dimensión de la matriz no es válida. (422) */
  MATRIX_DIMENSION_INVALID = 'MATRIX_DIMENSION_INVALID',
  /** Normalizar estrecha permisos y no se reconoció el estrechamiento. (422) */
  NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED = 'NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED',
  /** El lote de normalización no existe. (404) */
  NORMALIZE_BATCH_NOT_FOUND = 'NORMALIZE_BATCH_NOT_FOUND',
  /** El lote de normalización ya se revirtió. (409) */
  NORMALIZE_BATCH_ALREADY_REVERTED = 'NORMALIZE_BATCH_ALREADY_REVERTED',
  /** La bandera de restricción del paciente no es válida. (422) */
  RESTRICTION_FLAG_INVALID = 'RESTRICTION_FLAG_INVALID',
  /** Retirar o aflojar una bandera de restricción es del doctor titular o de la administración de seguridad (B-B9). */
  RESTRICTION_FLAG_REMOVAL_FORBIDDEN = 'RESTRICTION_FLAG_REMOVAL_FORBIDDEN',
  // --- Paso extra y emergencia (iam, authz) ---
  /** La persona no tiene segundo factor registrado. (422) */
  MFA_NOT_ENROLLED = 'MFA_NOT_ENROLLED',
  /** El código del segundo factor no es válido. (422) */
  MFA_CODE_INVALID = 'MFA_CODE_INVALID',
  /** GP-4: no hay acceso de emergencia para el personal de apoyo. (403) */
  BREAK_GLASS_NOT_FOR_SUPPORT = 'BREAK_GLASS_NOT_FOR_SUPPORT',
  // --- Reglas, aprobaciones y escritura (B4a, adicionales al contrato) ---
  /** La regla de gobierno no es válida (patrón, plantilla o forma del cuerpo) (422) */
  GOVERNANCE_RULE_INVALID = 'GOVERNANCE_RULE_INVALID',
  /** Alguien cambió la fila antes que usted: vuelva a leerla (409) */
  ROW_VERSION_CONFLICT = 'ROW_VERSION_CONFLICT',
  /** La solicitud de cuatro ojos pedida no es válida para ese tipo (422) */
  FOUR_EYES_REQUEST_INVALID = 'FOUR_EYES_REQUEST_INVALID',
  /** El tipo de solicitud de cuatro ojos no tiene quién la ejecute en este servidor (422) */
  FOUR_EYES_KIND_UNSUPPORTED = 'FOUR_EYES_KIND_UNSUPPORTED',
  /** La persona ya tiene demasiadas solicitudes de aprobación pendientes (409) */
  FOUR_EYES_TOO_MANY_PENDING = 'FOUR_EYES_TOO_MANY_PENDING',
  /** La organización no tiene a quién pedir la segunda aprobación de un permiso crítico (422) */
  FOUR_EYES_NO_APPROVER = 'FOUR_EYES_NO_APPROVER',
  /** La regla de segregación de funciones no existe o es de otra organización (404) */
  SOD_RULE_NOT_FOUND = 'SOD_RULE_NOT_FOUND',
  /** La excepción de segregación de funciones ya no está vigente (409) */
  SOD_EXCEPTION_NOT_ACTIVE = 'SOD_EXCEPTION_NOT_ACTIVE',
  // --- Anomalías de actividad (B4b), §6.6 ---
  /** La anomalía no existe o es de otra organización. (404) */
  ANOMALY_NOT_FOUND = 'ANOMALY_NOT_FOUND',
  /** Descartar una anomalía exige un comentario de al menos 10 caracteres. (422) */
  ANOMALY_COMMENT_REQUIRED = 'ANOMALY_COMMENT_REQUIRED',
  /** La anomalía ya se reconoció, descartó o escaló. (409) */
  ANOMALY_ALREADY_RESOLVED = 'ANOMALY_ALREADY_RESOLVED',
}

/**
 * Estado HTTP de cada razón NUEVA del gobierno de accesos (v4.2.72; las
 * anteriores se deciden donde se lanzan). Lo usan las rutas y las pruebas para
 * que un código tenga el mismo estado en todas partes. Los códigos «internos»
 * del dominio (`JUSTIFICATION_TOO_SHORT`, `VALID_TO_*`, …) los traduce el
 * servicio al lanzar; aquí figura el estado con el que salen.
 */
export const DELEGATED_ACCESS_GOVERNANCE_STATUS: Readonly<
  Partial<Record<DelegatedAccessErrorReason, 403 | 404 | 409 | 422>>
> = {
  // --- Condiciones (422), CONTRATO-GOBIERNO §8.4 ---
  CONDITION_SCHEMA_VERSION_UNSUPPORTED: 422,
  CONDITION_UNKNOWN_KEY: 422,
  CONDITION_TOO_LARGE: 422,
  CONDITION_TIME_EMPTY_WINDOW: 422,
  CONDITION_TIME_ZONE_INVALID: 422,
  CONDITION_LIMIT_INVALID: 422,
  CONDITION_NOT_APPLICABLE_TO_ATOM: 422,
  CONDITION_NOT_ALLOWED_ON_DENY: 422,
  CONDITION_FIELD_NOT_GRANTED: 422,
  CONDITION_NETWORK_NO_RULES: 422,
  CONDITION_OBLIGATION_LOOSENS_CATALOG: 422,
  CONDITION_CEILING_FORBIDDEN_ATOM: 422,
  // --- Barandillas (L0/L1), §4.2 ---
  GUARDRAIL_NOT_DELEGABLE: 422,
  GUARDRAIL_CEILING_EXCEEDED: 422,
  GUARDRAIL_DELEGATED_FORBIDDEN_ATOM: 422,
  GUARDRAIL_CRITICAL_REQUIRES_EXPIRY: 422,
  GUARDRAIL_SELF_SUPERVISION: 422,
  GUARDRAIL_RULE_LOOSENS_PLATFORM: 422,
  GUARDRAIL_SELF_ADMIN: 403,
  GUARDRAIL_PEER_ADMIN: 403,
  // --- Administración delegada, §6.4 ---
  ADMIN_CEILING_EXCEEDED: 403,
  ADMIN_SCOPE_EXCEEDED: 403,
  // --- Segregación de funciones (SoD), §6.3 ---
  SOD_CONFLICT_BLOCKED: 422,
  SOD_RULE_HARD: 422,
  SOD_RULE_LOOSENS_BASE: 422,
  SOD_RULE_PLATFORM_READ_ONLY: 422,
  SOD_EXCEPTION_REQUIRED: 409,
  SOD_EXCEPTION_NOT_FOUND: 404,
  SOD_EXCEPTION_NOT_NEEDED: 422,
  JUSTIFICATION_TOO_SHORT: 422,
  VALID_TO_REQUIRED: 422,
  VALID_TO_NOT_IN_FUTURE: 422,
  VALID_TO_EXCEEDS_LIMIT: 422,
  // --- Cuatro ojos, §6.5 ---
  FOUR_EYES_SELF_APPROVAL: 403,
  FOUR_EYES_NOT_ELIGIBLE: 403,
  FOUR_EYES_NOT_PENDING: 409,
  FOUR_EYES_EXPIRED: 409,
  FOUR_EYES_PAYLOAD_CHANGED: 409,
  FOUR_EYES_PAYLOAD_INVALID: 409,
  FOUR_EYES_ALREADY_CONSUMED: 409,
  FOUR_EYES_DUPLICATE_PENDING: 409,
  FOUR_EYES_NOT_FOUND: 404,
  COMMENT_REQUIRED: 422,
  // --- Campañas de certificación, §6.2 ---
  REVIEW_SCOPE_EMPTY: 422,
  REVIEW_COMMENT_REQUIRED: 422,
  REVIEW_ADJUST_CANNOT_BROADEN: 422,
  REVIEW_ADJUST_NOT_APPLICABLE: 422,
  REVIEW_BULK_NOT_ALLOWED: 422,
  REVIEW_NOT_REVIEWER: 403,
  REVIEW_ALREADY_DECIDED: 409,
  REVIEW_CAMPAIGN_NOT_OPEN: 409,
  REVIEW_CAMPAIGN_NOT_DRAFT: 409,
  REVIEW_CAMPAIGN_DUPLICATE: 409,
  REVIEW_ITEM_NOT_FOUND: 404,
  REVIEW_CAMPAIGN_NOT_FOUND: 404,
  REVIEW_CAMPAIGN_NOT_DUE: 409,
  REVIEW_SCHEDULE_TOO_SHORT: 422,
  // --- Ciclo de vida y traspaso, §6.1 ---
  HANDOVER_TARGET_INELIGIBLE: 422,
  HANDOVER_SUPERVISOR_REQUIRED: 422,
  OWNER_NOT_ELIGIBLE: 422,
  ENGAGEMENT_ALREADY_SUSPENDED: 409,
  ENGAGEMENT_NOT_SUSPENDED: 409,
  LIFECYCLE_ITEM_AUTOMATIC: 409,
  LIFECYCLE_ITEM_UNKNOWN: 404,
  LIFECYCLE_CASE_NOT_FOUND: 404,
  // --- Simulación, ajustes e informes, §5, §8.3 ---
  SIMULATION_TOO_LARGE: 422,
  SIMULATION_NO_TARGET: 422,
  SIMULATION_STALE: 409,
  GOVERNANCE_SETTINGS_INVALID: 422,
  GOVERNANCE_RULE_DUPLICATE: 409,
  GOVERNANCE_RULE_NOT_FOUND: 404,
  EXPORT_REASON_REQUIRED: 422,
  EXPORT_KIND_INVALID: 422,
  MATRIX_DIMENSION_INVALID: 422,
  NORMALIZE_TIGHTENING_NOT_ACKNOWLEDGED: 422,
  NORMALIZE_BATCH_NOT_FOUND: 404,
  NORMALIZE_BATCH_ALREADY_REVERTED: 409,
  RESTRICTION_FLAG_INVALID: 422,
  RESTRICTION_FLAG_REMOVAL_FORBIDDEN: 403,
  // --- Paso extra y emergencia (iam, authz) ---
  MFA_NOT_ENROLLED: 422,
  MFA_CODE_INVALID: 422,
  BREAK_GLASS_NOT_FOR_SUPPORT: 403,
  // --- B4a ---
  GOVERNANCE_RULE_INVALID: 422,
  ROW_VERSION_CONFLICT: 409,
  FOUR_EYES_REQUEST_INVALID: 422,
  FOUR_EYES_KIND_UNSUPPORTED: 422,
  FOUR_EYES_TOO_MANY_PENDING: 409,
  FOUR_EYES_NO_APPROVER: 422,
  SOD_RULE_NOT_FOUND: 404,
  SOD_EXCEPTION_NOT_ACTIVE: 409,
  // Razones anteriores que el gobierno también lanza.
  SUPPORT_ENGAGEMENT_NOT_FOUND: 404,
  SUPPORT_GRANT_NOT_FOUND: 404,
  SUPPORT_ENGAGEMENT_NOT_ACTIVE: 422,
  // --- Anomalías de actividad (B4b) ---
  ANOMALY_NOT_FOUND: 404,
  ANOMALY_COMMENT_REQUIRED: 422,
  ANOMALY_ALREADY_RESOLVED: 409,
};
