/**
 * Catálogo de sub-códigos de negocio estables del módulo `clinical_ext`. Se usan
 * como tercer argumento (`reason`) de las excepciones de dominio, para que un
 * cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum ClinicalExtErrorReason {
  /** El equipo de cuidado no existe, o no es del tenant ni del paciente del actor. */
  CARE_TEAM_NOT_FOUND = 'CARE_TEAM_NOT_FOUND',
  /** La referencia no existe, o el actor no es su destinatario ni atiende al paciente. */
  REFERRAL_NOT_FOUND = 'REFERRAL_NOT_FOUND',
  /** La alerta clínica no existe, o el actor no atiende al paciente de la alerta. */
  CLINICAL_ALERT_NOT_FOUND = 'CLINICAL_ALERT_NOT_FOUND',
  /** La brecha de cuidado no existe, o el actor no atiende a su paciente. */
  CARE_GAP_NOT_FOUND = 'CARE_GAP_NOT_FOUND',
  /** La plantilla de órdenes no existe o pertenece a otro tenant. */
  ORDER_SET_NOT_FOUND = 'ORDER_SET_NOT_FOUND',
  /** El encuentro no existe, no es del paciente indicado o es de otro tenant. */
  ENCOUNTER_NOT_FOUND = 'ENCOUNTER_NOT_FOUND',
  /** El tenant del cuerpo no coincide con el tenant activo del actor. */
  CLINICAL_EXT_TENANT_SCOPE_REQUIRED = 'CLINICAL_EXT_TENANT_SCOPE_REQUIRED',
  /** El perfil del paciente no tiene una fecha de nacimiento válida para proyectar. */
  CARE_GAP_BIRTH_DATE_UNAVAILABLE = 'CARE_GAP_BIRTH_DATE_UNAVAILABLE',
  /** La fecha de nacimiento enviada no coincide con la del perfil del paciente. */
  CARE_GAP_BIRTH_DATE_MISMATCH = 'CARE_GAP_BIRTH_DATE_MISMATCH',
  /** Ya existe una brecha abierta equivalente (carrera de creación concurrente). */
  CARE_GAP_ALREADY_OPEN = 'CARE_GAP_ALREADY_OPEN',
  /** Ya existe una referencia equivalente. */
  REFERRAL_ALREADY_EXISTS = 'REFERRAL_ALREADY_EXISTS',
  /** El encuentro ya tiene una sesión virtual. */
  VIRTUAL_ENCOUNTER_ALREADY_EXISTS = 'VIRTUAL_ENCOUNTER_ALREADY_EXISTS',

  // --- Derivación a servicios específicos (v4266) ---
  /**
   * La derivación necesita al menos un destino. Responde 400 en una derivación
   * tipada sin destino y 422 en `POST /referrals` y en
   * `GET /referrals/target-services` sin destino.
   */
  REFERRAL_TARGET_REQUIRED = 'REFERRAL_TARGET_REQUIRED',
  /**
   * 404: el profesional destino (`targetProfileId`) no existe en el padrón, o
   * el destino de `GET /referrals/target-services` no es listable.
   */
  REFERRAL_TARGET_NOT_FOUND = 'REFERRAL_TARGET_NOT_FOUND',
  /** 404: el servicio destino (`targetServiceCatalogId`) no existe. */
  REFERRAL_SERVICE_NOT_FOUND = 'REFERRAL_SERVICE_NOT_FOUND',
  /**
   * 404: el encuentro de origen no existe, es de otro paciente o de una
   * organización ajena al actor. Los tres casos responden igual a propósito.
   */
  REFERRAL_ENCOUNTER_NOT_FOUND = 'REFERRAL_ENCOUNTER_NOT_FOUND',
  /** 422: el servicio destino está inactivo en el catálogo. */
  REFERRAL_SERVICE_INACTIVE = 'REFERRAL_SERVICE_INACTIVE',
  /**
   * 422: el servicio no es de la organización destino, o el profesional
   * destino no lo ofrece con una oferta activa.
   */
  REFERRAL_SERVICE_TARGET_MISMATCH = 'REFERRAL_SERVICE_TARGET_MISMATCH',
  /** 422: la búsqueda de destinos necesita al menos dos caracteres. */
  REFERRAL_TARGET_QUERY_TOO_SHORT = 'REFERRAL_TARGET_QUERY_TOO_SHORT',
  /** Una derivación tipada necesita resumen clínico y servicio pedido. */
  REFERRAL_SERVICE_INFORMATION_INCOMPLETE = 'REFERRAL_SERVICE_INFORMATION_INCOMPLETE',
  /** La sede destino no existe. */
  REFERRAL_TARGET_BRANCH_NOT_FOUND = 'REFERRAL_TARGET_BRANCH_NOT_FOUND',
  /** La derivación no está pendiente de respuesta. */
  REFERRAL_NOT_PENDING = 'REFERRAL_NOT_PENDING',
  /** Rechazar exige motivo. */
  REFERRAL_REJECT_REASON_REQUIRED = 'REFERRAL_REJECT_REASON_REQUIRED',
  /** La derivación no está en un estado que admita contrarreferencia. */
  REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED = 'REFERRAL_COUNTER_REFERRAL_NOT_ALLOWED',
  /** La derivación ya está cerrada (rechazada, completada o anulada). */
  REFERRAL_ALREADY_CLOSED = 'REFERRAL_ALREADY_CLOSED',
  /**
   * `informedConsentId` no se acepta al crear: el vínculo lo escribe el
   * consentimiento registrado con `targetType='REFERRAL'` sobre la derivación.
   */
  REFERRAL_CONSENT_LINK_NOT_ALLOWED = 'REFERRAL_CONSENT_LINK_NOT_ALLOWED',

  // --- Datos de traslado (v4274) ---
  /** Con `required=true` hacen falta `transportMode` y `departureCondition`. */
  TRANSFER_INCOMPLETE = 'TRANSFER_INCOMPLETE',
  /**
   * Paciente inestable o crítico sin ambulancia (básica, avanzada o aérea) o
   * sin personal de salud que acompañe.
   */
  TRANSFER_UNSAFE_TRANSPORT = 'TRANSFER_UNSAFE_TRANSPORT',
  /**
   * Paciente inestable o crítico sin aviso previo al receptor
   * (`receiverContacted=true` y `receiverContactName`).
   */
  TRANSFER_RECEIVER_NOT_CONTACTED = 'TRANSFER_RECEIVER_NOT_CONTACTED',
  /** Signo vital fuera de rango, o diastólica no menor que la sistólica. */
  TRANSFER_VITALS_OUT_OF_RANGE = 'TRANSFER_VITALS_OUT_OF_RANGE',
  /** `transportMode=OTHER` sin `transportDetail`. */
  TRANSFER_DETAIL_REQUIRED = 'TRANSFER_DETAIL_REQUIRED',
  /** La llegada es anterior a la salida registrada. */
  TRANSFER_ARRIVAL_BEFORE_DEPARTURE = 'TRANSFER_ARRIVAL_BEFORE_DEPARTURE',
  /** La llegada ya está registrada: el traslado no se corrige ni se repite. */
  REFERRAL_ARRIVAL_ALREADY_RECORDED = 'REFERRAL_ARRIVAL_ALREADY_RECORDED',
}
