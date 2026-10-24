/**
 * Catálogo de sub-códigos de negocio estables para el módulo `iam`.
 *
 * `code` (en `DomainException`) dice el tipo HTTP del error; `reason` dice
 * **cuál** error de ese tipo fue, dentro de este módulo. Un cliente puede
 * ramificar sobre `reason` sin parsear `message`.
 */
export enum IamErrorReason {
  /** No se presentó ningún refresh token (ni DTO ni cookie). */
  REFRESH_TOKEN_MISSING = 'REFRESH_TOKEN_MISSING',
  /** El refresh token presentado no existe. */
  REFRESH_TOKEN_INVALID = 'REFRESH_TOKEN_INVALID',
  /** El refresh token presentado ya fue revocado/reusado (posible robo). */
  REFRESH_TOKEN_REUSE_DETECTED = 'REFRESH_TOKEN_REUSE_DETECTED',
  /** El refresh token presentado está vencido. */
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  /** La sesión asociada al refresh token ya no está activa. */
  SESSION_NOT_ACTIVE = 'SESSION_NOT_ACTIVE',

  /** El código de organización ya existe (alta por auto-registro). */
  ORGANIZATION_CODE_IN_USE = 'ORGANIZATION_CODE_IN_USE',
  /** Ya existe una cuenta activa con ese correo. */
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  /** Ya existe una cuenta con ese identificador; se sugiere invitar en vez de crear. */
  IDENTIFIER_ALREADY_REGISTERED_PREFER_INVITATION = 'IDENTIFIER_ALREADY_REGISTERED_PREFER_INVITATION',
  /** Ya existe una cuenta con ese documento de identidad (alta de paciente). */
  NATIONAL_ID_ALREADY_REGISTERED = 'NATIONAL_ID_ALREADY_REGISTERED',
  /** El practitioner_code generado ya está en uso. */
  PRACTITIONER_CODE_IN_USE = 'PRACTITIONER_CODE_IN_USE',
  /** El email ya tiene una credencial de contraseña activa (alta de usuario). */
  EMAIL_HAS_ACTIVE_PASSWORD_CREDENTIAL = 'EMAIL_HAS_ACTIVE_PASSWORD_CREDENTIAL',
  /** La credencial federada (proveedor + subject externo) ya existe para el usuario. */
  FEDERATED_CREDENTIAL_ALREADY_EXISTS = 'FEDERATED_CREDENTIAL_ALREADY_EXISTS',
  /** El rol indicado ya está concedido al usuario. */
  ROLE_ALREADY_GRANTED = 'ROLE_ALREADY_GRANTED',

  /** El token de activación de cuenta no existe. */
  ACTIVATION_TOKEN_INVALID = 'ACTIVATION_TOKEN_INVALID',
  /** El token de activación ya fue utilizado (un solo uso consumido). */
  ACTIVATION_TOKEN_ALREADY_USED = 'ACTIVATION_TOKEN_ALREADY_USED',
  /** El token de activación venció. */
  ACTIVATION_TOKEN_EXPIRED = 'ACTIVATION_TOKEN_EXPIRED',

  /** El token de restablecimiento de contraseña no existe. */
  PASSWORD_RESET_TOKEN_INVALID = 'PASSWORD_RESET_TOKEN_INVALID',
  /** El token de restablecimiento ya fue utilizado. */
  PASSWORD_RESET_TOKEN_ALREADY_USED = 'PASSWORD_RESET_TOKEN_ALREADY_USED',
  /** El token de restablecimiento venció. */
  PASSWORD_RESET_TOKEN_EXPIRED = 'PASSWORD_RESET_TOKEN_EXPIRED',
  /** La credencial asociada al token de restablecimiento ya no existe o no corresponde al titular. */
  PASSWORD_RESET_CREDENTIAL_MISSING = 'PASSWORD_RESET_CREDENTIAL_MISSING',

  /** El token de verificación de email no existe. */
  EMAIL_VERIFICATION_TOKEN_INVALID = 'EMAIL_VERIFICATION_TOKEN_INVALID',
  /** El token de verificación ya fue utilizado. */
  EMAIL_VERIFICATION_TOKEN_ALREADY_USED = 'EMAIL_VERIFICATION_TOKEN_ALREADY_USED',
  /** El token de verificación venció. */
  EMAIL_VERIFICATION_TOKEN_EXPIRED = 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
  /** El usuario referido por el token de verificación ya no existe. */
  EMAIL_VERIFICATION_USER_MISSING = 'EMAIL_VERIFICATION_USER_MISSING',

  /** Falta el subject (email/nationalId) en el intento de login. */
  LOGIN_SUBJECT_MISSING = 'LOGIN_SUBJECT_MISSING',
  /** No existe una credencial de contraseña activa para el subject presentado. */
  LOGIN_CREDENTIAL_NOT_FOUND = 'LOGIN_CREDENTIAL_NOT_FOUND',
  /** El usuario existe pero no está activo (bloqueado, anonimizado, etc.). */
  LOGIN_USER_NOT_ACTIVE = 'LOGIN_USER_NOT_ACTIVE',
  /** La contraseña presentada no coincide con la credencial. */
  LOGIN_PASSWORD_MISMATCH = 'LOGIN_PASSWORD_MISMATCH',

  /** El usuario referido no existe. */
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  /** El usuario no tiene ese rol activo concedido (al intentar revocarlo). */
  ROLE_NOT_GRANTED = 'ROLE_NOT_GRANTED',

  /** Alguno de los roles solicitados en el alta no existe o no es asignable. */
  ROLE_NOT_ASSIGNABLE = 'ROLE_NOT_ASSIGNABLE',

  /** El factor MFA referido no existe para el usuario. */
  MFA_FACTOR_NOT_FOUND = 'MFA_FACTOR_NOT_FOUND',
  /** Falta `factorId`, requerido para verificar un factor MFA existente. */
  MFA_FACTOR_ID_REQUIRED_TO_VERIFY = 'MFA_FACTOR_ID_REQUIRED_TO_VERIFY',
  /** Falta `code`, requerido para verificar un factor MFA. */
  MFA_CODE_REQUIRED_TO_VERIFY = 'MFA_CODE_REQUIRED_TO_VERIFY',
  /** El factor MFA no tiene un secreto TOTP asociado (enrolamiento incompleto). */
  MFA_FACTOR_MISSING_SECRET = 'MFA_FACTOR_MISSING_SECRET',
  /** El código MFA presentado no es válido contra el secreto TOTP. */
  MFA_CODE_INVALID = 'MFA_CODE_INVALID',
  /** Falta `factorType`, requerido para enrolar un factor MFA nuevo. */
  MFA_FACTOR_TYPE_REQUIRED_TO_ENROLL = 'MFA_FACTOR_TYPE_REQUIRED_TO_ENROLL',

  /** La credencial referida no existe para el usuario. */
  CREDENTIAL_NOT_FOUND = 'CREDENTIAL_NOT_FOUND',
}
