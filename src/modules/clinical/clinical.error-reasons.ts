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
}

/**
 * Motivos del 422 `PRECONDITION_FAILED` de la orden de estudios con detalle
 * (v4.2.80: muestra, componentes, modalidad, región, lateralidad, contraste).
 *
 * **Convención para lo nuevo (H2.S3.M2): el motivo viaja en `details.reason`**
 * —nunca como tercer argumento de la excepción— junto con `details.field` (la
 * propiedad del cuerpo que falla) y, en `POST /clinical/requisitions`,
 * `details.itemIndex` (posición del renglón dentro de `items`, base 0). Así el
 * cliente ramifica siempre en el mismo sitio. Los motivos anteriores del
 * módulo (`ClinicalErrorReason`, tercer argumento) NO se migran: es una ruptura
 * de contrato y la convención de `details.reason` ya la usan la antiduplicación
 * (`DUPLICATE_STUDY_*`) y `diagnostics/specimen-catalogs.ts`.
 */
export const StudyDetailReason = {
  /** V1: el estudio no pertenece a `service-request-code`. */
  STUDY_NOT_IN_CATALOG: 'STUDY_NOT_IN_CATALOG',
  /** V2: la categoría no es la familia que el catálogo da al estudio. */
  SERVICE_REQUEST_CATEGORY_STUDY_MISMATCH:
    'SERVICE_REQUEST_CATEGORY_STUDY_MISMATCH',
  /** V3: muestra en una orden que no es de laboratorio/patología. */
  SPECIMEN_NOT_ALLOWED_FOR_CATEGORY: 'SPECIMEN_NOT_ALLOWED_FOR_CATEGORY',
  /** V3: la muestra no es de `specimen-type`. */
  SPECIMEN_TYPE_NOT_IN_CATALOG: 'SPECIMEN_TYPE_NOT_IN_CATALOG',
  /** V4: el estudio no es un panel desplegable y la orden trae componentes. */
  COMPONENTS_NOT_SELECTABLE: 'COMPONENTS_NOT_SELECTABLE',
  /** V4: un componente no pertenece al panel pedido. */
  COMPONENT_NOT_IN_PANEL: 'COMPONENT_NOT_IN_PANEL',
  /** V4 / D3: panel desplegable sin ningún componente marcado. */
  COMPONENTS_EMPTY: 'COMPONENTS_EMPTY',
  /** V5: campos de imagen en una orden que no es de imagen. */
  IMAGING_FIELDS_NOT_ALLOWED: 'IMAGING_FIELDS_NOT_ALLOWED',
  /** V5: imagen sin modalidad. */
  MODALITY_REQUIRED: 'MODALITY_REQUIRED',
  /** V6: la modalidad no es de `service-request-imaging-modality`. */
  MODALITY_NOT_IN_CATALOG: 'MODALITY_NOT_IN_CATALOG',
  /** V6: la modalidad no es la que el catálogo da al estudio. */
  MODALITY_STUDY_MISMATCH: 'MODALITY_STUDY_MISMATCH',
  /** V7: imagen sin región. */
  BODY_SITE_REQUIRED: 'BODY_SITE_REQUIRED',
  /** V7: la región no es de `imaging-body-structure`. */
  BODY_SITE_NOT_IN_CATALOG: 'BODY_SITE_NOT_IN_CATALOG',
  /** V8: la lateralidad no es de `condition-laterality`. */
  LATERALITY_NOT_IN_CATALOG: 'LATERALITY_NOT_IN_CATALOG',
  /** V8: lateralidad sin región. */
  LATERALITY_REQUIRES_BODY_SITE: 'LATERALITY_REQUIRES_BODY_SITE',
  /** V8: la región no admite lateralidad (estructura impar). */
  LATERALITY_NOT_APPLICABLE: 'LATERALITY_NOT_APPLICABLE',
  /** V9: el contraste no es de `imaging-contrast`. */
  CONTRAST_NOT_IN_CATALOG: 'CONTRAST_NOT_IN_CATALOG',
  /** V9: contraste sin modalidad. */
  CONTRAST_REQUIRES_MODALITY: 'CONTRAST_REQUIRES_MODALITY',
  /** V10: antiduplicación (se reutilizan los de `service-requests.service`). */
  DUPLICATE_STUDY_DETECTED: 'DUPLICATE_STUDY_DETECTED',
  /** Requisición: la misma `Idempotency-Key` con un cuerpo distinto. */
  REQUISITION_IDEMPOTENCY_KEY_CONFLICT: 'REQUISITION_IDEMPOTENCY_KEY_CONFLICT',
} as const;

/** Uno de los motivos de {@link StudyDetailReason}. */
export type StudyDetailReasonCode =
  (typeof StudyDetailReason)[keyof typeof StudyDetailReason];
