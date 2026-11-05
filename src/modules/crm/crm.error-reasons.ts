/**
 * Catálogo de sub-códigos de negocio estables del módulo `crm`. Se usan como
 * tercer argumento (`reason`) de las excepciones de dominio, para que un
 * cliente pueda ramificar sobre el caso exacto sin parsear el `message`.
 */
export enum CrmErrorReason {
  /** El tenant del cuerpo no coincide con el tenant activo del actor. */
  CRM_TENANT_SCOPE_REQUIRED = 'CRM_TENANT_SCOPE_REQUIRED',
  /** La cuenta no existe o no pertenece al tenant activo. */
  CRM_ACCOUNT_NOT_FOUND = 'CRM_ACCOUNT_NOT_FOUND',
  /** El contacto no existe o no pertenece al tenant activo. */
  CRM_CONTACT_NOT_FOUND = 'CRM_CONTACT_NOT_FOUND',
  /** El canal de contacto no existe o no pertenece al tenant activo. */
  CRM_CONTACT_CHANNEL_NOT_FOUND = 'CRM_CONTACT_CHANNEL_NOT_FOUND',
  /** El lead no existe o no pertenece al tenant activo. */
  CRM_LEAD_NOT_FOUND = 'CRM_LEAD_NOT_FOUND',
  /** La oportunidad no existe o no pertenece al tenant activo. */
  CRM_OPPORTUNITY_NOT_FOUND = 'CRM_OPPORTUNITY_NOT_FOUND',
  /** El pipeline no existe o no pertenece al tenant activo. */
  CRM_PIPELINE_NOT_FOUND = 'CRM_PIPELINE_NOT_FOUND',
  /** La etapa no existe o su pipeline no pertenece al tenant activo. */
  CRM_STAGE_NOT_FOUND = 'CRM_STAGE_NOT_FOUND',
  /** El caso no existe o no pertenece al tenant activo. */
  CRM_CASE_NOT_FOUND = 'CRM_CASE_NOT_FOUND',
  /** El sujeto de la actividad no existe o no pertenece al tenant activo. */
  CRM_ACTIVITY_SUBJECT_NOT_FOUND = 'CRM_ACTIVITY_SUBJECT_NOT_FOUND',
  /** La etapa pertenece a un pipeline distinto del de la oportunidad. */
  CRM_STAGE_PIPELINE_MISMATCH = 'CRM_STAGE_PIPELINE_MISMATCH',
  /** El canal pertenece a otro contacto del mismo tenant. */
  CRM_CHANNEL_CONTACT_MISMATCH = 'CRM_CHANNEL_CONTACT_MISMATCH',
}
