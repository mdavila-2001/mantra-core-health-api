/**
 * Catálogo de sub-códigos de negocio estables del módulo `forms`. Se usan como
 * `reason` de `DomainException` y sus subclases, encima del `code` genérico que
 * ya fija el status HTTP.
 */
export enum FormsErrorReason {
  /**
   * La instancia (o el encuentro que la ancla) no existe, es de otro tenant o el
   * actor no puede leer la historia del paciente. Las tres causas responden
   * igual: distinguirlas confirmaría que el UUID existe.
   */
  FORM_INSTANCE_OUT_OF_SCOPE = 'FORM_INSTANCE_OUT_OF_SCOPE',

  /**
   * The session has no practitioner profile (`hpid` claim): question scripts
   * and FAQ entries are owned by a practitioner profile.
   */
  PRACTITIONER_PROFILE_REQUIRED = 'PRACTITIONER_PROFILE_REQUIRED',
  /**
   * The question script does not exist, is archived or belongs to another
   * practitioner. All three answer the same 404.
   */
  QUESTION_SCRIPT_OUT_OF_SCOPE = 'QUESTION_SCRIPT_OUT_OF_SCOPE',
  /** The `version` sent with the PATCH is not the stored one. */
  QUESTION_SCRIPT_VERSION_MISMATCH = 'QUESTION_SCRIPT_VERSION_MISMATCH',
  /** The FAQ entry does not exist or belongs to another practitioner. */
  FAQ_ENTRY_OUT_OF_SCOPE = 'FAQ_ENTRY_OUT_OF_SCOPE',
  /** The reorder list is not exactly the practitioner's entries. */
  FAQ_ORDER_MISMATCH = 'FAQ_ORDER_MISMATCH',
  /** The public slug is not a visible practitioner profile. */
  PUBLIC_PRACTITIONER_PROFILE_NOT_FOUND = 'PUBLIC_PRACTITIONER_PROFILE_NOT_FOUND',
}
