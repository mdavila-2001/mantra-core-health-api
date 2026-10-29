/**
 * Catálogo de sub-códigos de negocio estables del módulo `profiles`.
 *
 * Cada miembro nombra una situación de negocio concreta y distinta —no un
 * sitio de código—: dos `throw` que informan el mismo hecho de negocio
 * comparten el mismo `reason`, aunque estén en servicios distintos (por
 * ejemplo, "el perfil de paciente no existe" se repite en varias lecturas y
 * escrituras, y es siempre `PATIENT_PROFILE_NOT_FOUND`).
 *
 * `code` (en `DomainException`) ya dice el tipo HTTP (404, 409, 422...); este
 * catálogo dice **cuál** error de ese tipo fue, para que un cliente pueda
 * ramificar sin parsear `message`.
 */
export enum ProfilesErrorReason {
  // --- Pacientes (profiles-patients.service.ts) ---------------------------
  /** El `patient_code` declarado ya pertenece a otro paciente. */
  PATIENT_CODE_ALREADY_IN_USE = 'PATIENT_CODE_ALREADY_IN_USE',
  /** La cuenta de la sesión no tiene una persona vinculada (`person_account_links`). */
  ACCOUNT_WITHOUT_LINKED_PERSON = 'ACCOUNT_WITHOUT_LINKED_PERSON',
  /** No existe el perfil de paciente pedido (o la persona vinculada no lo tiene). */
  PATIENT_PROFILE_NOT_FOUND = 'PATIENT_PROFILE_NOT_FOUND',
  /** La dirección pedida no existe, no está vigente o no es de quien la pide. */
  PATIENT_ADDRESS_NOT_FOUND = 'PATIENT_ADDRESS_NOT_FOUND',
  /** El domicilio no se borra desde la libreta: el alta lo exige y la ficha lo usa. */
  PATIENT_HOME_ADDRESS_REQUIRED = 'PATIENT_HOME_ADDRESS_REQUIRED',
  /** Se llegó al tope de direcciones guardadas. */
  PATIENT_ADDRESS_BOOK_FULL = 'PATIENT_ADDRESS_BOOK_FULL',
  /** El paciente se eligió a sí mismo como médico de cabecera. */
  PRIMARY_PRACTITIONER_SELF = 'PRIMARY_PRACTITIONER_SELF',
  /** El profesional declaró que no acepta pacientes nuevos. */
  PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS = 'PRIMARY_PRACTITIONER_NOT_ACCEPTING_PATIENTS',
  /** El padrón no se puede listar sin nombre, código o documento. */
  PATIENT_SEARCH_CRITERIA_REQUIRED = 'PATIENT_SEARCH_CRITERIA_REQUIRED',
  /** No existe la persona (`profiles.persons`) referenciada. */
  PERSON_NOT_FOUND = 'PERSON_NOT_FOUND',
  /** La persona existe pero no está activa. */
  PERSON_NOT_ACTIVE = 'PERSON_NOT_ACTIVE',
  /** Se pidió fusionar un paciente consigo mismo. */
  MERGE_SAME_PATIENT = 'MERGE_SAME_PATIENT',
  /** El paciente sobreviviente de la fusión no existe. */
  MERGE_SURVIVING_PATIENT_NOT_FOUND = 'MERGE_SURVIVING_PATIENT_NOT_FOUND',
  /** El paciente a fusionar (perdedor) no existe. */
  MERGE_TARGET_PATIENT_NOT_FOUND = 'MERGE_TARGET_PATIENT_NOT_FOUND',
  /** El paciente a fusionar ya fue fusionado antes. */
  PATIENT_ALREADY_MERGED = 'PATIENT_ALREADY_MERGED',
  /** El evento de fusión indicado no existe. */
  MERGE_EVENT_NOT_FOUND = 'MERGE_EVENT_NOT_FOUND',
  /** Sólo se puede revertir una fusión que esté aprobada. */
  MERGE_NOT_APPROVED = 'MERGE_NOT_APPROVED',
  /** La fusión ya tiene un evento de reversión. */
  MERGE_ALREADY_REVERSED = 'MERGE_ALREADY_REVERSED',
  /** El paciente ya tiene un tutor legal activo. */
  PATIENT_ALREADY_HAS_LEGAL_GUARDIAN = 'PATIENT_ALREADY_HAS_LEGAL_GUARDIAN',
  /** La persona relacionada indicada no existe. */
  RELATED_PERSON_NOT_FOUND = 'RELATED_PERSON_NOT_FOUND',
  /** La persona relacionada existe pero no pertenece a este paciente. */
  RELATED_PERSON_MISMATCH = 'RELATED_PERSON_MISMATCH',
  /** La persona ya está registrada como fallecida. */
  PERSON_ALREADY_DECEASED = 'PERSON_ALREADY_DECEASED',

  // --- Catálogo de departamentos (administrative-area-catalog.service.ts) -
  /** El concepto indicado no pertenece al catálogo de departamentos de Bolivia. */
  NOT_ADMINISTRATIVE_AREA = 'NOT_ADMINISTRATIVE_AREA',
  /** El catálogo de departamentos no está disponible (value set ausente). */
  ADMINISTRATIVE_AREA_CATALOG_UNAVAILABLE = 'ADMINISTRATIVE_AREA_CATALOG_UNAVAILABLE',

  // --- Profesionales (profiles-practitioners.service.ts) ------------------
  /** La cuenta de la sesión no tiene perfil profesional. */
  ACCOUNT_WITHOUT_PRACTITIONER_PROFILE = 'ACCOUNT_WITHOUT_PRACTITIONER_PROFILE',
  /** No existe el perfil profesional pedido. */
  PRACTITIONER_PROFILE_NOT_FOUND = 'PRACTITIONER_PROFILE_NOT_FOUND',
  /**
   * El número del documento no se corrige desde el perfil porque la identidad
   * de la persona ya está verificada contra él (P28).
   */
  NATIONAL_ID_LOCKED_BY_VERIFIED_IDENTITY = 'NATIONAL_ID_LOCKED_BY_VERIFIED_IDENTITY',
  /** El `practitioner_code` declarado ya pertenece a otro profesional. */
  PRACTITIONER_CODE_ALREADY_IN_USE = 'PRACTITIONER_CODE_ALREADY_IN_USE',
  /** Verificar una credencial exige declarar la fuente consultada. */
  CREDENTIAL_VERIFICATION_REQUIRES_SOURCE = 'CREDENTIAL_VERIFICATION_REQUIRES_SOURCE',
  /** La credencial indicada no existe. */
  CREDENTIAL_NOT_FOUND = 'CREDENTIAL_NOT_FOUND',
  /** La credencial no está en estado pendiente de verificación. */
  CREDENTIAL_NOT_PENDING = 'CREDENTIAL_NOT_PENDING',
  /** Se superó el tope de especialidades activas por profesional. */
  SPECIALTY_LIMIT_EXCEEDED = 'SPECIALTY_LIMIT_EXCEEDED',
  /** La credencial de soporte indicada no pertenece a este profesional. */
  SUPPORTING_CREDENTIAL_MISMATCH = 'SUPPORTING_CREDENTIAL_MISMATCH',
  /** La credencial de soporte indicada todavía no está verificada. */
  SUPPORTING_CREDENTIAL_NOT_VERIFIED = 'SUPPORTING_CREDENTIAL_NOT_VERIFIED',
  /** No se indicó qué especialidad declarar. */
  SPECIALTY_REQUIRED = 'SPECIALTY_REQUIRED',
  /** El profesional ya tiene esa especialidad activa. */
  SPECIALTY_ALREADY_ACTIVE = 'SPECIALTY_ALREADY_ACTIVE',
  /** La fecha de fin del vínculo laboral es anterior a la de inicio. */
  AFFILIATION_END_BEFORE_START = 'AFFILIATION_END_BEFORE_START',
  /** Ya existe en el historial laboral un vínculo igual (institución, cargo e inicio). */
  AFFILIATION_ALREADY_IN_HISTORY = 'AFFILIATION_ALREADY_IN_HISTORY',
  /** El profesional ya tiene una solicitud para esa misma sede. */
  AFFILIATION_SITE_ALREADY_REQUESTED = 'AFFILIATION_SITE_ALREADY_REQUESTED',
  /** El concepto indicado no es un tipo de credencial profesional válido. */
  CREDENTIAL_TYPE_INVALID = 'CREDENTIAL_TYPE_INVALID',

  // --- Afiliaciones (profiles-affiliations.service.ts) --------------------
  /** La sede (`practice_sites`) indicada no existe. */
  PRACTICE_SITE_NOT_FOUND = 'PRACTICE_SITE_NOT_FOUND',
  /** La solicitud de afiliación indicada no existe (o no pertenece a esta organización). */
  AFFILIATION_REQUEST_NOT_FOUND = 'AFFILIATION_REQUEST_NOT_FOUND',
  /** La solicitud ya fue decidida antes (ya no está pendiente). */
  AFFILIATION_REQUEST_ALREADY_DECIDED = 'AFFILIATION_REQUEST_ALREADY_DECIDED',
  /** Sólo se puede revocar un vínculo que esté actualmente aprobado. */
  AFFILIATION_NOT_APPROVED = 'AFFILIATION_NOT_APPROVED',

  // --- Admisiones de profesionales (practitioner-admissions.service.ts) ----
  /** La admisión pedida no existe (o no es del sujeto que la pide). */
  ADMISSION_NOT_FOUND = 'ADMISSION_NOT_FOUND',
  /** La acción no es válida desde el estado actual de la admisión. */
  ADMISSION_INVALID_TRANSITION = 'ADMISSION_INVALID_TRANSITION',
  /** Otra persona modificó la admisión (o el ítem): `row_version` distinto. */
  ADMISSION_STALE = 'ADMISSION_STALE',
  /** La acción exige un motivo y no vino. */
  ADMISSION_REASON_REQUIRED = 'ADMISSION_REASON_REQUIRED',
  /** Verificar un ítem exige declarar la fuente consultada. */
  ADMISSION_ITEM_REQUIRES_SOURCE = 'ADMISSION_ITEM_REQUIRES_SOURCE',
  /** El checklist tiene requisitos obligatorios sin verificar o rechazados. */
  ADMISSION_CHECKLIST_INCOMPLETE = 'ADMISSION_CHECKLIST_INCOMPLETE',
  /** Cuatro ojos: quien resuelve no puede ser quien revisó la admisión. */
  ADMISSION_FOUR_EYES_REQUIRED = 'ADMISSION_FOUR_EYES_REQUIRED',
  /** Quien consulta es el propio profesional: el personal no ve ni actúa sobre su propia admisión. */
  ADMISSION_SELF_ACCESS = 'ADMISSION_SELF_ACCESS',
  /** Verificar un ítem de una admisión abierta sólo se hace por la revisión de la admisión. */
  ADMISSION_VERIFY_VIA_REVIEW = 'ADMISSION_VERIFY_VIA_REVIEW',
  /** El documento o dato cambió desde que el revisor lo miró: debe volver a revisarlo. */
  ADMISSION_EVIDENCE_CHANGED = 'ADMISSION_EVIDENCE_CHANGED',
  /** Sólo quien tomó la revisión puede actuar sobre sus ítems. */
  ADMISSION_NOT_ASSIGNED_TO_ACTOR = 'ADMISSION_NOT_ASSIGNED_TO_ACTOR',
  /** El ítem pedido no existe en esta admisión. */
  ADMISSION_ITEM_NOT_FOUND = 'ADMISSION_ITEM_NOT_FOUND',
  /** La resolución no recibe ítems: el servidor los deriva de las revisiones. */
  ADMISSION_DECISION_ITEMS_NOT_ACCEPTED = 'ADMISSION_DECISION_ITEMS_NOT_ACCEPTED',
  /** El solicitante llegó al tope de reenvíos. */
  ADMISSION_RESUBMISSION_LIMIT = 'ADMISSION_RESUBMISSION_LIMIT',
  /** La verificación ya venció: no se repone, se renueva. */
  ADMISSION_VALIDITY_LAPSED = 'ADMISSION_VALIDITY_LAPSED',
  /** El rol del actor no alcanza para esta acción de admisiones. */
  ADMISSION_ROLE_REQUIRED = 'ADMISSION_ROLE_REQUIRED',
  /** El documento no pertenece a esta admisión (o no existe). */
  ADMISSION_DOCUMENT_NOT_FOUND = 'ADMISSION_DOCUMENT_NOT_FOUND',
  /** La URL firmada del documento no es válida para este actor o admisión. */
  ADMISSION_DOCUMENT_URL_INVALID = 'ADMISSION_DOCUMENT_URL_INVALID',
  /** El revisor al que se reasigna no existe o es el propio solicitante. */
  ADMISSION_ASSIGNEE_INVALID = 'ADMISSION_ASSIGNEE_INVALID',
  /** La cuenta no tiene perfil profesional: no hay admisión que consultar. */
  ADMISSION_WITHOUT_PRACTITIONER = 'ADMISSION_WITHOUT_PRACTITIONER',
}
