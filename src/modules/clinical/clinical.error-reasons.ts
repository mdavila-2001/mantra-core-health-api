/**
 * Catálogo de sub-códigos de negocio estables del módulo `clinical`. Se usan
 * como tercer argumento (`reason`) de las excepciones de dominio, para que un
 * cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum ClinicalErrorReason {
  /** La orden de servicio referenciada no existe. */
  SERVICE_REQUEST_NOT_FOUND = 'SERVICE_REQUEST_NOT_FOUND',
  /** El reporte diagnóstico referenciado no existe. */
  DIAGNOSTIC_REPORT_NOT_FOUND = 'DIAGNOSTIC_REPORT_NOT_FOUND',
  /** El reporte diagnóstico no está en un estado liberable (preliminary/partial). */
  DIAGNOSTIC_REPORT_NOT_RELEASABLE = 'DIAGNOSTIC_REPORT_NOT_RELEASABLE',
  /** La versión (`rowVersion`) del reporte diagnóstico está desactualizada. */
  DIAGNOSTIC_REPORT_VERSION_MISMATCH = 'DIAGNOSTIC_REPORT_VERSION_MISMATCH',
  /** La ruta de liberación quedó obsoleta (D-E); usar el endpoint canónico. */
  DIAGNOSTIC_REPORT_RELEASE_PATH_DEPRECATED = 'DIAGNOSTIC_REPORT_RELEASE_PATH_DEPRECATED',
  /** El paciente ya tiene un episodio de cuidado activo. */
  CARE_EPISODE_ALREADY_ACTIVE = 'CARE_EPISODE_ALREADY_ACTIVE',
  /** La política de firma de recetas referenciada no existe. */
  SIGNATURE_POLICY_NOT_FOUND = 'SIGNATURE_POLICY_NOT_FOUND',
  /** El encuentro referenciado no existe. */
  ENCOUNTER_NOT_FOUND = 'ENCOUNTER_NOT_FOUND',
  /** El procedimiento padre referenciado no existe. */
  PARENT_PROCEDURE_NOT_FOUND = 'PARENT_PROCEDURE_NOT_FOUND',
  /** El paciente ya tiene una alergia activa a esa sustancia. */
  ALLERGY_ALREADY_ACTIVE = 'ALLERGY_ALREADY_ACTIVE',
  /** La observación no tiene ningún valor resuelto (cantidad, decimal, texto, booleano, concepto). */
  OBSERVATION_VALUE_MISSING = 'OBSERVATION_VALUE_MISSING',
  /** La observación referenciada no existe. */
  OBSERVATION_NOT_FOUND = 'OBSERVATION_NOT_FOUND',
  /** La observación no admite enmienda en su estado actual. */
  OBSERVATION_NOT_AMENDABLE = 'OBSERVATION_NOT_AMENDABLE',
  /** La versión (`rowVersion`) de la observación está desactualizada. */
  OBSERVATION_VERSION_MISMATCH = 'OBSERVATION_VERSION_MISMATCH',
  /** El paciente ya tiene esa condición activa. */
  CONDITION_ALREADY_ACTIVE = 'CONDITION_ALREADY_ACTIVE',
  /** La transición de estado clínico solicitada no es válida desde el estado actual. */
  CONDITION_STATUS_TRANSITION_INVALID = 'CONDITION_STATUS_TRANSITION_INVALID',
  /** Una condición de curso crónico no puede pasar a resuelta. */
  CONDITION_CHRONIC_CANNOT_RESOLVE = 'CONDITION_CHRONIC_CANNOT_RESOLVE',
  /** La condición referenciada no existe. */
  CONDITION_NOT_FOUND = 'CONDITION_NOT_FOUND',
  /** El episodio de cuidado referenciado no existe. */
  CARE_EPISODE_NOT_FOUND = 'CARE_EPISODE_NOT_FOUND',
  /** El encuentro no está en curso (IN_PROGRESS) y no puede cerrarse. */
  ENCOUNTER_NOT_IN_PROGRESS = 'ENCOUNTER_NOT_IN_PROGRESS',
  /** La versión (`rowVersion`) del encuentro está desactualizada. */
  ENCOUNTER_VERSION_MISMATCH = 'ENCOUNTER_VERSION_MISMATCH',
  /** Esa dosis de esa vacuna ya fue registrada para el paciente. */
  IMMUNIZATION_DOSE_ALREADY_RECORDED = 'IMMUNIZATION_DOSE_ALREADY_RECORDED',
  /** La condición indicada no existe o no pertenece al paciente de la receta. */
  MEDICATION_INDICATION_INVALID = 'MEDICATION_INDICATION_INVALID',
  /** La receta referenciada no existe. */
  MEDICATION_REQUEST_NOT_FOUND = 'MEDICATION_REQUEST_NOT_FOUND',
  /** Solo un borrador (DRAFT) admite edición; la receta emitida es inmutable. */
  MEDICATION_REQUEST_NOT_EDITABLE = 'MEDICATION_REQUEST_NOT_EDITABLE',
  /** Solo un borrador (DRAFT) puede firmarse antes de emitirse. */
  MEDICATION_REQUEST_NOT_SIGNABLE = 'MEDICATION_REQUEST_NOT_SIGNABLE',
  /** Solo un borrador (DRAFT) puede emitirse. */
  MEDICATION_REQUEST_NOT_ISSUABLE = 'MEDICATION_REQUEST_NOT_ISSUABLE',
  /** La clave de idempotencia de emisión ya fue usada para emitir otra receta. */
  MEDICATION_ISSUE_IDEMPOTENCY_KEY_CONFLICT = 'MEDICATION_ISSUE_IDEMPOTENCY_KEY_CONFLICT',
  /** La política vigente exige firmar la receta antes de emitirla y aún no está firmada. */
  MEDICATION_SIGNATURE_REQUIRED = 'MEDICATION_SIGNATURE_REQUIRED',
  /** Solo una receta emitida (ISSUED) puede invalidarse. */
  MEDICATION_REQUEST_NOT_INVALIDATABLE = 'MEDICATION_REQUEST_NOT_INVALIDATABLE',
  /** Solo una receta emitida (ISSUED) puede reemplazarse. */
  MEDICATION_REQUEST_NOT_REPLACEABLE = 'MEDICATION_REQUEST_NOT_REPLACEABLE',
  /** Solo una receta emitida o completada puede renovarse. */
  MEDICATION_REQUEST_NOT_RENEWABLE = 'MEDICATION_REQUEST_NOT_RENEWABLE',
  /** La prescripción referenciada para la administración no existe. */
  MEDICATION_REQUEST_FOR_ADMINISTRATION_NOT_FOUND = 'MEDICATION_REQUEST_FOR_ADMINISTRATION_NOT_FOUND',
  /** La prescripción no está emitida (ISSUED) y no puede dispensarse/administrarse. */
  MEDICATION_REQUEST_NOT_ISSUED = 'MEDICATION_REQUEST_NOT_ISSUED',
  /** El modo de ejecutor indicado no es uno de los tres del conjunto. */
  PERFORMER_SELECTION_INVALID = 'PERFORMER_SELECTION_INVALID',
  /** El modo de ejecutor exige un dato que la orden no trae. */
  PERFORMER_FIELD_REQUIRED = 'PERFORMER_FIELD_REQUIRED',
  /** El modo de ejecutor prohíbe un dato que la orden trae. */
  PERFORMER_FIELD_NOT_ALLOWED = 'PERFORMER_FIELD_NOT_ALLOWED',
  /** «Lo hago yo» pide un médico ejecutor distinto del que pide la orden. */
  PERFORMER_NOT_REQUESTER = 'PERFORMER_NOT_REQUESTER',
  /** La sede sugerida no ofrece el procedimiento con precio publicado. */
  SUGGESTED_SITE_DOES_NOT_OFFER_PROCEDURE = 'SUGGESTED_SITE_DOES_NOT_OFFER_PROCEDURE',
  /** El médico no tiene una afiliación activa para ese procedimiento en la sede sugerida. */
  PRACTITIONER_NOT_AFFILIATED_AT_SITE = 'PRACTITIONER_NOT_AFFILIATED_AT_SITE',
  /** P40: una nota citada en `basedOnNoteIds` no existe o es de otro paciente (indistinguibles a propósito). */
  BASED_ON_NOTE_NOT_FOUND = 'BASED_ON_NOTE_NOT_FOUND',
  /** P40: una nota citada en `basedOnNoteIds` es de otro encuentro que la orden. */
  BASED_ON_NOTE_ENCOUNTER_MISMATCH = 'BASED_ON_NOTE_ENCOUNTER_MISMATCH',
  /** P40: `category` y `categoryConceptId` viajan juntos y no dicen lo mismo. */
  SERVICE_REQUEST_CATEGORY_MISMATCH = 'SERVICE_REQUEST_CATEGORY_MISMATCH',

  // --- internación / ADT (CONTRATO-F2-F5, F3.3) -----------------------------
  /** El recurso (encuentro, cama, ubicación, censo, incidente) no existe o es de otro tenant: 404 uniforme. */
  ADT_RESOURCE_OUT_OF_SCOPE = 'ADT_RESOURCE_OUT_OF_SCOPE',
  /** El actor no tiene el rol operativo que exige la acción sobre ese alcance (403). */
  INFRA_ACTION_NOT_ALLOWED = 'INFRA_ACTION_NOT_ALLOWED',
  /** La operación de camas (puerto de F2) no está disponible: falla cerrado (503). */
  CARE_SPACE_OPS_UNAVAILABLE = 'CARE_SPACE_OPS_UNAVAILABLE',
  /** Las camas sólo se ocupan por ADT: el check-in no acepta una cama (422). */
  BED_ASSIGNMENT_REQUIRES_ADT = 'BED_ASSIGNMENT_REQUIRES_ADT',
  /** El paciente ya tiene otra internación en curso (409). */
  PATIENT_ALREADY_ADMITTED = 'PATIENT_ALREADY_ADMITTED',
  /** La cama no es asignable: ciclo, disponibilidad, ocupación, higiene o aislamiento aéreo (409). */
  BED_NOT_ASSIGNABLE = 'BED_NOT_ASSIGNABLE',
  /** Dos pacientes en la misma cama: lo detuvo la restricción EXCLUDE de la base (409). */
  BED_DOUBLE_OCCUPANCY = 'BED_DOUBLE_OCCUPANCY',
  /** Hay incompatibilidades forzables y no vino `override` (422). */
  BED_COMPATIBILITY_OVERRIDE_REQUIRED = 'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
  /** La justificación de un forzado tiene menos de 20 caracteres (422). */
  OVERRIDE_JUSTIFICATION_TOO_SHORT = 'OVERRIDE_JUSTIFICATION_TOO_SHORT',
  /** El forzado incluye una regla bloqueante o ajena a la cama (422). */
  OVERRIDE_RULE_NOT_OVERRIDABLE = 'OVERRIDE_RULE_NOT_OVERRIDABLE',
  /** El espacio indicado no es una cama (422). */
  SPACE_NOT_A_BED = 'SPACE_NOT_A_BED',
  /** La cama es de otro establecimiento que el de la internación (422). */
  BED_SITE_MISMATCH = 'BED_SITE_MISMATCH',
  /** El encuentro no es de internación (`ENC_IMP`): no admite camas (422). */
  ENCOUNTER_NOT_INPATIENT = 'ENCOUNTER_NOT_INPATIENT',
  /** El encuentro ya tiene cama: se mueve con un traslado (409). */
  ENCOUNTER_ALREADY_HAS_BED = 'ENCOUNTER_ALREADY_HAS_BED',
  /** El encuentro no tiene cama activa que trasladar (409). */
  ENCOUNTER_HAS_NO_BED = 'ENCOUNTER_HAS_NO_BED',
  /** El destino del traslado es la cama actual (422). */
  TRANSFER_TO_SAME_BED = 'TRANSFER_TO_SAME_BED',
  /** `occurredAt` está en el futuro (422). */
  OCCURRED_AT_IN_FUTURE = 'OCCURRED_AT_IN_FUTURE',
  /** `occurredAt` es anterior al inicio de la ubicación vigente (422). */
  OCCURRED_AT_BEFORE_CURRENT_START = 'OCCURRED_AT_BEFORE_CURRENT_START',
  /** El intercambio exige dos encuentros con cama activa (409). */
  SWAP_REQUIRES_TWO_OCCUPIED_BEDS = 'SWAP_REQUIRES_TWO_OCCUPIED_BEDS',
  /** El intercambio se pidió entre un encuentro y él mismo (409). */
  SWAP_SAME_ENCOUNTER = 'SWAP_SAME_ENCOUNTER',
  /** El egreso exige la disposición (422). */
  DISCHARGE_DISPOSITION_REQUIRED = 'DISCHARGE_DISPOSITION_REQUIRED',
  /** La cama previa ya no está disponible para reabrir el traslado cancelado (409). */
  PREVIOUS_BED_NO_LONGER_AVAILABLE = 'PREVIOUS_BED_NO_LONGER_AVAILABLE',
  /** Pasó la ventana para cancelar el traslado (409). */
  ADT_CANCEL_WINDOW_EXPIRED = 'ADT_CANCEL_WINDOW_EXPIRED',
  /** La ubicación no es una reserva ni un traslado cancelable (409). */
  LOCATION_NOT_CANCELLABLE = 'LOCATION_NOT_CANCELLABLE',
  /** El incidente ya no admite esa transición de revisión (409). */
  PLACEMENT_INCIDENT_INVALID_TRANSITION = 'PLACEMENT_INCIDENT_INVALID_TRANSITION',
  /** Un código de catálogo (nivel de cuidado, procedencia, disposición…) no es válido (422). */
  ADT_CODE_INVALID = 'ADT_CODE_INVALID',
  /** El censo del día ya está cerrado (409). */
  CENSUS_ALREADY_CLOSED = 'CENSUS_ALREADY_CLOSED',
  /** El día todavía no terminó (más la gracia): no se cierra su censo (422). */
  CENSUS_DATE_NOT_ENDED = 'CENSUS_DATE_NOT_ENDED',
  /** Un día abierto no se ajusta (409). */
  CENSUS_NOT_CLOSED = 'CENSUS_NOT_CLOSED',
  /** El ajuste exige motivo (422). */
  ADJUSTMENT_REASON_REQUIRED = 'ADJUSTMENT_REASON_REQUIRED',
  /** El campo ajustado no es una de las columnas numéricas del censo (422). */
  ADJUSTMENT_FIELD_INVALID = 'ADJUSTMENT_FIELD_INVALID',
  /** La entrada citada por el ajuste no pertenece al censo del día (422). */
  ADJUSTMENT_ENTRY_NOT_IN_DAY = 'ADJUSTMENT_ENTRY_NOT_IN_DAY',
  /** El rango de indicadores supera 366 días (422). */
  INDICATOR_RANGE_TOO_LONG = 'INDICATOR_RANGE_TOO_LONG',
  /** El rango de indicadores es inválido (422). */
  INDICATOR_RANGE_INVALID = 'INDICATOR_RANGE_INVALID',
}
