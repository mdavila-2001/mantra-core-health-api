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
}
