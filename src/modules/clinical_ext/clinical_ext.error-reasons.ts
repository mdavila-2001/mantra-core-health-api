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
}
