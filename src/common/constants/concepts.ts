import { createHash } from 'node:crypto';

/**
 * Catálogo de conceptos de dominio bien conocidos.
 *
 * El esquema es "concept-driven": estados, métodos, roles y tipos de evento no
 * son enums de columna sino filas de `terminology.catalog_concepts` referenciadas
 * por FK (`*_concept_id`). Para que el código pueda referirse a "usuario ACTIVO"
 * sin arrastrar un lookup por texto en cada operación, se derivan identificadores
 * UUID **deterministas** a partir de una clave legible mediante UUIDv5.
 *
 * La ventaja de UUIDv5 sobre una lista de UUID escritos a mano es doble: el mismo
 * par (namespace, clave) produce siempre el mismo UUID -de modo que el seed y el
 * runtime coinciden sin coordinación- y añadir un concepto nuevo es escribir una
 * clave, no inventar y verificar la unicidad de otro literal.
 *
 * El seed (`TerminologySeedService`) materializa exactamente estas filas; ningún
 * otro punto del sistema debe inventar valores de estado fuera de este catálogo.
 */

/**
 * Namespace fijo para la derivación UUIDv5. Es un UUID arbitrario pero estable:
 * cambiarlo reescribiría todos los identificadores derivados y rompería las FK
 * ya persistidas, así que se trata como una constante inmutable del proyecto.
 */
export const SALUD_UUID_NAMESPACE = '3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60';

/**
 * Implementación local de UUID versión 5 (nombre + namespace, SHA-1). Se prefiere
 * a la dependencia `uuid` porque esta es ESM-only y rompe el runner de Jest
 * (CommonJS); el algoritmo es estándar (RFC 4122 §4.3) y de una sola función, así
 * que no justifica arrastrar un paquete y su cadena de transpilación en pruebas.
 */
export function deterministicId(key: string): string {
  const namespaceBytes = Buffer.from(
    SALUD_UUID_NAMESPACE.replace(/-/g, ''),
    'hex',
  );
  const hash = createHash('sha1')
    .update(namespaceBytes)
    .update(Buffer.from(key, 'utf8'))
    .digest();
  const bytes = hash.subarray(0, 16);
  // Fija la versión (5) en el nibble alto del byte 6 y la variante RFC en el byte 8.
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Sistema de códigos "raíz" que hospeda los conceptos internos de la plataforma.
 * No modela una terminología externa (SNOMED, LOINC): agrupa los estados y tipos
 * operativos que el propio backend necesita para arrancar. Se materializa una vez
 * y sus filas tienen `state_concept_id` nulo para cortar la recursión del seed.
 */
export const SEED = {
  sourceId: deterministicId('seed:source:mantra-core'),
  codeSystemId: deterministicId('seed:code-system:mantra-core'),
  codeSystemVersionId: deterministicId(
    'seed:code-system-version:mantra-core:1.0.0',
  ),
  sourceCode: 'MANTRA_CORE',
  codeSystemInternalCode: 'mantra-core-internal',
  canonicalUrl: 'https://mantracore.health/fhir/CodeSystem/internal',
  version: '1.0.0',
  /**
   * Tenant por defecto. Existe porque `common.files.tenant_id` es una FK NOT NULL
   * a `directory.tenants`: sin al menos un tenant no se puede subir un archivo. El
   * resto de owner_id polimórficos (identifiers, contact_points, addresses,
   * file_links) no tienen FK, así que aceptan cualquier uuid.
   */
  tenantId: deterministicId('seed:tenant:default'),
  tenantCode: 'DEFAULT',
  /**
   * Propósito de procesamiento por defecto. Existe porque varias tablas de consent
   * (`consents`, `hipaa_authorizations`, `patient_objections`, ...) tienen una FK
   * NOT NULL a `consent.processing_purposes` y el módulo consent no incluye un caso
   * de uso para crear propósitos: sin al menos uno sembrado no se puede capturar
   * un consentimiento.
   */
  processingPurposeId: deterministicId('seed:processing-purpose:default'),
  processingPurposeCode: 'GENERAL_CARE',
  /**
   * Cuenta de servicio de los 17 procesos worker (`src/worker-<dominio>.ts`,
   * `src/worker/bootstrap.ts`). No tiene
   * credencial de login: el worker firma su propio access token con
   * `TokenService` (rol `SYSTEM`, que por diseño no es asignable vía
   * `iam.user_global_roles` — ver `RoleCode`). Existe como fila real en
   * `iam.users` únicamente porque `recorded_by_user_id`/`actor_user_id` de las
   * tablas que el worker muta son FK NOT NULL a `iam.users.id`.
   */
  systemWorkerUserId: deterministicId('seed:user:system-worker'),
  systemWorkerDisplayName: 'System Worker',
  /**
   * `SupportAdmin`: la cuenta con la que la empresa escribe en el chat de
   * agenda (TAREA-15, P-15-1). Mismo patrón que `systemWorkerUserId` — fila
   * real en `iam.users` porque es quien firma (`created_by_user_id`) la
   * conversación y el mensaje —, y sin credencial de login: nadie inicia
   * sesión como la empresa.
   */
  supportAdminUserId: deterministicId('seed:user:support-admin'),
  supportAdminDisplayName: 'AloVida · Soporte',
  supportAdminProfileSlug: 'soporte-alovida',
};

/**
 * Definición declarativa de cada concepto: clave estable, código FHIR y display.
 * El seed itera sobre este mapa; el resto del código referencia `CONCEPTS.<X>`.
 */
interface ConceptDef {
  /**
   * Valor de key mantenido por la instancia.
   */
  readonly key: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  readonly code: string;
  /**
   * Valor de display mantenido por la instancia.
   */
  readonly display: string;
}

/**
 * Ejecuta la operación def.
 *
 * @param key - Valor de key requerido por la operación.
 * @param code - Valor de code requerido por la operación.
 * @param display - Valor de display requerido por la operación.
 * @returns Resultado de def conforme al contrato `ConceptDef`.
 */
function def(key: string, code: string, display: string): ConceptDef {
  return { key, code, display };
}

/** Registro completo de conceptos internos, agrupado por dominio funcional. */
export const CONCEPT_DEFS: Readonly<Record<string, ConceptDef>> = {
  // --- Estados genéricos reutilizables (credenciales, sesiones, tokens) ---
  STATE_ACTIVE: def('state:active', 'ACTIVE', 'Active'),
  STATE_REVOKED: def('state:revoked', 'REVOKED', 'Revoked'),
  STATE_EXPIRED: def('state:expired', 'EXPIRED', 'Expired'),
  STATE_PENDING: def('state:pending', 'PENDING', 'Pending'),
  STATE_VERIFIED: def('state:verified', 'VERIFIED', 'Verified'),
  STATE_ROTATED: def('state:rotated', 'ROTATED', 'Rotated'),

  // --- Estados de usuario (iam.users.status_concept_id) ---
  USER_ACTIVE: def('iam:user-status:active', 'USER_ACTIVE', 'User active'),
  USER_LOCKED: def('iam:user-status:locked', 'USER_LOCKED', 'User locked'),
  USER_ANONYMIZED: def(
    'iam:user-status:anonymized',
    'USER_ANONYMIZED',
    'User anonymized',
  ),

  // --- Estado MFA del usuario (iam.users.mfa_status_concept_id) ---
  MFA_DISABLED: def('iam:mfa-status:disabled', 'MFA_DISABLED', 'MFA disabled'),
  MFA_ENABLED: def('iam:mfa-status:enabled', 'MFA_ENABLED', 'MFA enabled'),

  // --- Métodos de credencial (iam.authentication_credentials.method_concept_id) ---
  CRED_PASSWORD: def(
    'iam:cred-method:password',
    'PASSWORD',
    'Password credential',
  ),
  CRED_FEDERATED: def(
    'iam:cred-method:federated',
    'FEDERATED',
    'Federated credential',
  ),
  HASH_ARGON2ID: def('iam:hash-algo:argon2id', 'ARGON2ID', 'Argon2id'),

  // --- Tipos de factor MFA (iam.mfa_factors.factor_type_concept_id) ---
  MFA_TOTP: def('iam:mfa-factor:totp', 'TOTP', 'TOTP factor'),
  MFA_WEBAUTHN: def('iam:mfa-factor:webauthn', 'WEBAUTHN', 'WebAuthn factor'),

  // --- Plataformas de dispositivo (iam.devices.platform_concept_id) ---
  PLATFORM_IOS: def('iam:platform:ios', 'IOS', 'iOS'),
  PLATFORM_ANDROID: def('iam:platform:android', 'ANDROID', 'Android'),
  PLATFORM_WEB: def('iam:platform:web', 'WEB', 'Web'),

  // --- Roles globales (iam.user_global_roles.role_concept_id) ---
  ROLE_SUPERADMIN: def(
    'iam:role:superadmin',
    'SUPERADMIN',
    'Super administrator',
  ),
  ROLE_SECURITY_ADMIN: def(
    'iam:role:security-admin',
    'SECURITY_ADMIN',
    'Security administrator',
  ),
  ROLE_USER: def('iam:role:user', 'USER', 'Standard user'),
  ROLE_PATIENT: def('iam:role:patient', 'PATIENT', 'Patient'),
  /**
   * Los dos roles del personal de salud.
   *
   * Faltaban, y no era un detalle: **57 declaraciones `@Roles(...)` los exigen**
   * —32 `CLINICIAN` y 25 `PRACTITIONER`— así que esos endpoints sólo eran
   * alcanzables por `SUPERADMIN`, que el guard trata como comodín. Un médico
   * real recibía 403 en su agenda y en el expediente de sus pacientes.
   *
   * Es el mismo agujero que tenía `PATIENT` antes de sembrarse: sin el concepto,
   * `conceptIdsToRoleCodes` descarta lo desconocido y el claim `roles` no puede
   * contenerlo jamás.
   *
   * **Se separan a propósito.** `PRACTITIONER` es quién sos —agenda, recursos,
   * tu propio perfil—; `CLINICIAN` es qué podés leer y escribir de un paciente,
   * que es PHI. Registrarse otorga el primero; el segundo lo concede un
   * administrador, porque la matrícula nace `PENDING` y declarar una matrícula
   * no es probarla.
   */
  ROLE_PRACTITIONER: def(
    'iam:role:practitioner',
    'PRACTITIONER',
    'Health practitioner',
  ),
  ROLE_CLINICIAN: def('iam:role:clinician', 'CLINICIAN', 'Clinician'),

  // --- Bloqueo de cuenta (iam.account_lockouts.*) ---
  LOCK_REASON_FAILED_ATTEMPTS: def(
    'iam:lock-reason:failed-attempts',
    'FAILED_ATTEMPTS',
    'Too many failed attempts',
  ),
  LOCK_REASON_MANUAL: def(
    'iam:lock-reason:manual',
    'MANUAL_LOCK',
    'Manual administrative lock',
  ),
  LOCKOUT_ACTIVE: def(
    'iam:lockout-status:active',
    'LOCKOUT_ACTIVE',
    'Lockout active',
  ),
  LOCKOUT_RELEASED: def(
    'iam:lockout-status:released',
    'LOCKOUT_RELEASED',
    'Lockout released',
  ),

  // --- Tipos de evento de seguridad (iam.security_events.event_type_concept_id) ---
  SEC_LOGIN: def('iam:sec-event:login', 'LOGIN', 'Login'),
  SEC_LOGIN_FAILED: def(
    'iam:sec-event:login-failed',
    'LOGIN_FAILED',
    'Login failed',
  ),
  SEC_TOKEN_REFRESH: def(
    'iam:sec-event:token-refresh',
    'TOKEN_REFRESH',
    'Token refresh',
  ),
  SEC_TOKEN_REUSE: def(
    'iam:sec-event:token-reuse',
    'TOKEN_REUSE',
    'Refresh token reuse detected',
  ),
  SEC_LOGOUT_ALL: def(
    'iam:sec-event:logout-all',
    'LOGOUT_ALL',
    'Global logout',
  ),
  SEC_ACCOUNT_LOCK: def(
    'iam:sec-event:account-lock',
    'ACCOUNT_LOCK',
    'Account locked',
  ),
  SEC_CRED_REVOKE: def(
    'iam:sec-event:cred-revoke',
    'CRED_REVOKE',
    'Credential revoked',
  ),
  SEC_ANONYMIZE: def(
    'iam:sec-event:anonymize',
    'ANONYMIZE',
    'Account anonymized',
  ),
  SEC_ROLE_GRANT: def(
    'iam:sec-event:role-grant',
    'ROLE_GRANT',
    'Global role granted',
  ),
  SEC_ROLE_REVOKE: def(
    'iam:sec-event:role-revoke',
    'ROLE_REVOKE',
    'Global role revoked',
  ),
  SEC_MFA_ENROLL: def(
    'iam:sec-event:mfa-enroll',
    'MFA_ENROLL',
    'MFA factor enrolled',
  ),
  SEC_DEVICE_TRUST: def(
    'iam:sec-event:device-trust',
    'DEVICE_TRUST',
    'Device trusted',
  ),
  SEC_CRED_FEDERATED_LINK: def(
    'iam:sec-event:federated-link',
    'FEDERATED_LINK',
    'Federated credential linked',
  ),
  SEC_SESSION_PURGE: def(
    'iam:sec-event:session-purge',
    'SESSION_PURGE',
    'Sessions purged',
  ),

  // --- Resultado de evento de seguridad (iam.security_events.outcome_concept_id) ---
  OUTCOME_SUCCESS: def('iam:outcome:success', 'SUCCESS', 'Success'),
  OUTCOME_FAILURE: def('iam:outcome:failure', 'FAILURE', 'Failure'),

  // --- Common: sistemas de identificador y tipos de contacto ---
  CONTACT_EMAIL: def('common:contact-system:email', 'EMAIL', 'Email'),
  CONTACT_PHONE: def('common:contact-system:phone', 'PHONE', 'Phone'),
  // El fijo y el celular son dos cosas distintas para quien atiende: el registro
  // del médico pide «celular de trabajo» y «fijo de trabajo» por separado, y con
  // un único PHONE no había forma de distinguirlos. `CONTACT_PHONE` queda como
  // el fijo (es lo que significa en HL7 `phone`) y éste marca el móvil.
  CONTACT_MOBILE: def('common:contact-system:mobile', 'MOBILE', 'Mobile phone'),
  CONTACT_UNVERIFIED: def(
    'common:contact-state:unverified',
    'CP_UNVERIFIED',
    'Contact unverified',
  ),
  CONTACT_VERIFIED: def(
    'common:contact-state:verified',
    'CP_VERIFIED',
    'Contact verified',
  ),

  // --- Common: estados de archivo/versión ---
  FILE_ACTIVE: def('common:file-state:active', 'FILE_ACTIVE', 'File active'),
  FILE_DELETED: def(
    'common:file-state:deleted',
    'FILE_DELETED',
    'File soft-deleted',
  ),
  FILE_VERSION_PENDING_SCAN: def(
    'common:file-version-state:pending-scan',
    'FV_PENDING_SCAN',
    'Version pending scan',
  ),
  FILE_VERSION_CLEAN: def(
    'common:file-version-state:clean',
    'FV_CLEAN',
    'Version clean',
  ),
  FILE_VERSION_QUARANTINED: def(
    'common:file-version-state:quarantined',
    'FV_QUARANTINED',
    'Version quarantined',
  ),

  // --- Common: tipos de propietario polimórfico (owner_type_concept_id) ---
  OWNER_USER: def('common:owner-type:user', 'OWNER_USER', 'User'),
  OWNER_PATIENT: def('common:owner-type:patient', 'OWNER_PATIENT', 'Patient'),
  OWNER_TENANT: def('common:owner-type:tenant', 'OWNER_TENANT', 'Tenant'),
  // Una persona sin perfil de paciente: el tutor o la persona autorizada que el
  // paciente declara en su alta. Reutilizar OWNER_PATIENT para ella envenenaría
  // toda consulta futura que asuma "OWNER_PATIENT ⇒ titular con perfil".
  OWNER_PERSON: def('common:owner-type:person', 'OWNER_PERSON', 'Person'),
  // Un archivo ligado a UN diagnóstico puntual (`clinical.conditions`), no al
  // paciente en general: reemplaza al «Adjuntos» genérico del expediente
  // (ALV-032), que no decía a qué diagnóstico correspondía cada archivo.
  OWNER_CONDITION: def(
    'common:owner-type:condition',
    'OWNER_CONDITION',
    'Condition',
  ),
  // Un archivo ligado a UN procedimiento puntual (`clinical.procedures`) —
  // incluye lo odontológico, que es un procedimiento con categoría dental
  // (ver `PeriopDentalService`). Mismo criterio que OWNER_CONDITION.
  OWNER_PROCEDURE: def(
    'common:owner-type:procedure',
    'OWNER_PROCEDURE',
    'Procedure',
  ),

  // --- Common: identificadores oficiales ---
  ID_TYPE_NATIONAL: def(
    'common:id-type:national',
    'NATIONAL_ID',
    'National ID',
  ),
  ID_TYPE_MRN: def('common:id-type:mrn', 'MRN', 'Medical record number'),
  ID_TYPE_PASSPORT: def('common:id-type:passport', 'PASSPORT', 'Passport'),
  // Registro tributario de una organización (el NIT boliviano). Lo referencia el
  // paquete de seeds para el NIT de las aseguradoras (v4.1.4); acá debe existir
  // con la misma clave o el id determinista no coincidiría entre ambos lados.
  ID_TYPE_TAX: def('common:id-type:tax', 'TAX_ID', 'Tax identification number'),
  USE_OFFICIAL: def('common:use:official', 'OFFICIAL', 'Official'),
  USE_SECONDARY: def('common:use:secondary', 'SECONDARY', 'Secondary'),

  // --- Common: uso de contacto y dirección ---
  CONTACT_USE_HOME: def('common:contact-use:home', 'HOME', 'Home'),
  CONTACT_USE_WORK: def('common:contact-use:work', 'WORK', 'Work'),
  ADDR_USE_HOME: def('common:addr-use:home', 'ADDR_HOME', 'Home address'),
  // El domicilio laboral que pide el registro de paciente. El modelo ya preveía
  // varias direcciones por persona vía `use_concept_id`; lo que faltaba era el
  // concepto, no la columna.
  ADDR_USE_WORK: def('common:addr-use:work', 'ADDR_WORK', 'Work address'),
  ADDR_TYPE_POSTAL: def('common:addr-type:postal', 'POSTAL', 'Postal'),
  COUNTRY_PE: def('common:country:pe', 'PE', 'Peru'),
  // ALoVida es una plataforma boliviana (SEGIP, catálogo de municipios del
  // INE): `addresses.service.ts` usaba PE como único país sembrado, lo que
  // dejaba cada dirección creada apuntando al país equivocado.
  COUNTRY_BO: def('common:country:bo', 'BO', 'Bolivia'),

  // Países de las formas societarias extranjeras (subtarea 1.1). Sin
  // jurisdicción propia sembrada todavía: alcanza con el país para derivar
  // `countryConceptId` en el autoalta cuando el cliente no lo declara.
  COUNTRY_BR: def('common:country:br', 'BR', 'Brazil'),
  COUNTRY_US: def('common:country:us', 'US', 'United States'),
  COUNTRY_AR: def('common:country:ar', 'AR', 'Argentina'),
  COUNTRY_MX: def('common:country:mx', 'MX', 'Mexico'),

  // --- Common: archivos ---
  FILE_CATEGORY_DOCUMENT: def(
    'common:file-category:document',
    'DOCUMENT',
    'Document',
  ),
  FILE_CATEGORY_IMAGE: def('common:file-category:image', 'IMAGE', 'Image'),
  SENSITIVITY_NORMAL: def(
    'common:sensitivity:normal',
    'NORMAL',
    'Normal sensitivity',
  ),
  SENSITIVITY_PHI: def(
    'common:sensitivity:phi',
    'PHI',
    'Protected health information',
  ),
  RETENTION_STANDARD: def(
    'common:retention:standard',
    'RETENTION_STD',
    'Standard retention',
  ),

  // --- Common: versiones de archivo (storage, hashing, cifrado, escaneo) ---
  STORAGE_PROVIDER_S3: def(
    'common:storage-provider:s3',
    'S3',
    'S3-compatible object storage',
  ),
  STORAGE_REGION_DEFAULT: def(
    'common:storage-region:default',
    'REGION_DEFAULT',
    'Default region',
  ),
  CHECKSUM_SHA256: def('common:checksum:sha256', 'SHA256', 'SHA-256'),
  ENCRYPTION_AT_REST: def(
    'common:encryption:at-rest',
    'AT_REST',
    'Encrypted at rest',
  ),
  ENCRYPTION_NONE: def('common:encryption:none', 'ENC_NONE', 'Not encrypted'),
  SCAN_PENDING: def('common:scan:pending', 'SCAN_PENDING', 'Scan pending'),
  SCAN_CLEAN: def('common:scan:clean', 'SCAN_CLEAN', 'Scan clean'),
  SCAN_INFECTED: def('common:scan:infected', 'SCAN_INFECTED', 'Scan infected'),
  INTEGRITY_VERIFIED: def(
    'common:integrity:verified',
    'INTEGRITY_OK',
    'Integrity verified',
  ),

  // --- Common: derivados y vínculos ---
  DERIVATIVE_THUMBNAIL: def(
    'common:derivative:thumbnail',
    'THUMBNAIL',
    'Thumbnail',
  ),
  DERIVATIVE_OCR: def('common:derivative:ocr', 'OCR', 'OCR text'),
  LINK_ROLE_ATTACHMENT: def(
    'common:link-role:attachment',
    'ATTACHMENT',
    'Attachment',
  ),
  VISIBILITY_INTERNAL: def(
    'common:visibility:internal',
    'INTERNAL',
    'Internal',
  ),

  // --- Consent: categoría de propósito de procesamiento (para el seed) ---
  PURPOSE_CATEGORY_CARE: def(
    'consent:purpose-category:care',
    'CARE',
    'Direct care',
  ),

  // --- Directory: tipo de organización (tenants.tenant_type_concept_id) ---
  // Los tres perfiles que el sistema distingue de verdad: quien presta la
  // atención, quien la financia y quien la intermedia. No son etiquetas
  // decorativas — `insurance` ya modela `insurance_carriers` e
  // `insurance_brokers` colgando de un tenant, así que sin estos tipos una
  // aseguradora y un prestador quedaban indistinguibles en `directory`.
  TENANT_TYPE_PROVIDER: def(
    'directory:tenant-type:provider',
    'PROVIDER',
    'Healthcare provider',
  ),
  TENANT_TYPE_PAYER: def(
    'directory:tenant-type:payer',
    'PAYER',
    'Insurance payer / carrier',
  ),
  TENANT_TYPE_BROKER: def(
    'directory:tenant-type:broker',
    'BROKER',
    'Insurance broker',
  ),
  // Los seis que faltaban. `PROVIDER` era demasiado grueso: una universidad que
  // forma clínicos, una farmacia que dispensa y un hospital que interna no se
  // regulan igual ni aparecen igual en el directorio público, y hasta ahora se
  // daban de alta los tres como el mismo tipo. Van planos, sin subtipo: el tipo
  // ya es `tenant_type_concept_id`, y meter una columna de subtipo para cuatro
  // valores obligaba a una migración que no compra nada que el concepto no dé.
  // `PROVIDER` se mantiene: hay tenants que ya lo referencian.
  TENANT_TYPE_UNIVERSITY: def(
    'directory:tenant-type:university',
    'UNIVERSITY',
    'University',
  ),
  TENANT_TYPE_PHARMACY: def(
    'directory:tenant-type:pharmacy',
    'PHARMACY',
    'Pharmacy',
  ),
  TENANT_TYPE_HOSPITAL: def(
    'directory:tenant-type:hospital',
    'HOSPITAL',
    'Hospital',
  ),
  TENANT_TYPE_MEDICAL_OFFICE: def(
    'directory:tenant-type:medical-office',
    'MEDICAL_OFFICE',
    'Medical office',
  ),
  TENANT_TYPE_NURSING: def(
    'directory:tenant-type:nursing',
    'NURSING',
    'Nursing facility',
  ),
  TENANT_TYPE_HEALTH_OTHER: def(
    'directory:tenant-type:health-other',
    'HEALTH_OTHER',
    'Other health institution',
  ),
  // Negocio de salud: la organización que vende productos o servicios de salud
  // sin ser institución asistencial ni farmacia —ópticas, ortopedias,
  // laboratorios de prótesis, distribuidoras de insumos—. No se regula como un
  // prestador porque no presta atención clínica, pero tampoco es `HEALTH_OTHER`,
  // que es el cajón de las instituciones asistenciales que no encajan arriba.
  TENANT_TYPE_HEALTH_BUSINESS: def(
    'directory:tenant-type:health-business',
    'HEALTH_BUSINESS',
    'Health business',
  ),
  // Centro de diagnóstico por imágenes o laboratorio clínico (subtarea 1.5,
  // PR #404 del front). No cabe en `HEALTH_OTHER` —el cajón de las
  // instituciones asistenciales que no encajan arriba— porque, a diferencia
  // de esas, un DIAGNOSTIC_CENTER SÍ tiene fila propia: materializa una
  // `diagnostic_units.diagnostic_units` en el alta, igual que `PAYER`
  // materializa su `insurance_carriers`.
  TENANT_TYPE_DIAGNOSTIC_CENTER: def(
    'directory:tenant-type:diagnostic-center',
    'DIAGNOSTIC_CENTER',
    'Diagnostic center',
  ),
  LEGAL_ENTITY_COMPANY: def(
    'directory:legal-entity:company',
    'COMPANY',
    'Company',
  ),
  /* Las formas societarias que reconoce el derecho comercial boliviano. El
     registro de procesos las pide, con esta misma lista, en los cinco módulos
     que dan de alta una organización —médico, farmacia, laboratorio, imagen y
     aseguradora—: «Aquí nuestra APP tiene que tener este detalle en la base de
     datos para que puedan SOLO SELECCIONAR AL REGISTRAR, UNIPERSONAL, SRL,
     LTDA, S.A., SOCIEDAD COLECTIVA, SOCIEDAD EN COMANDITA SIMPLE, SOCIEDAD EN
     COMANDITA POR ACCIONES, SUCURSAL DE SOCIEDAD EXTRANJERA».

     El motivo que da es de negocio y no de forma: «Esto con la finalidad de
     poder tener DATA de cuantos proveedores tenemos con SRL, UNIPERSONAL y
     S.A.». Escrito a mano, ese dato no se puede contar.

     `LEGAL_ENTITY_COMPANY` se conserva: es lo que llevan las filas que ya
     existen, y retirarlo obligaría a decidir por ellas qué forma societaria
     tienen. */
  LEGAL_ENTITY_SOLE_PROPRIETORSHIP: def(
    'directory:legal-entity:sole-proprietorship',
    'UNIPERSONAL',
    'Sole proprietorship',
  ),
  LEGAL_ENTITY_SRL: def(
    'directory:legal-entity:srl',
    'SRL',
    'Limited liability company (S.R.L.)',
  ),
  LEGAL_ENTITY_LTDA: def(
    'directory:legal-entity:ltda',
    'LTDA',
    'Limited company (Ltda.)',
  ),
  LEGAL_ENTITY_SA: def('directory:legal-entity:sa', 'SA', 'Corporation (S.A.)'),
  LEGAL_ENTITY_GENERAL_PARTNERSHIP: def(
    'directory:legal-entity:general-partnership',
    'SOCIEDAD_COLECTIVA',
    'General partnership',
  ),
  LEGAL_ENTITY_LIMITED_PARTNERSHIP: def(
    'directory:legal-entity:limited-partnership',
    'COMANDITA_SIMPLE',
    'Limited partnership',
  ),
  LEGAL_ENTITY_PARTNERSHIP_BY_SHARES: def(
    'directory:legal-entity:partnership-by-shares',
    'COMANDITA_ACCIONES',
    'Partnership limited by shares',
  ),
  LEGAL_ENTITY_FOREIGN_BRANCH: def(
    'directory:legal-entity:foreign-branch',
    'SUCURSAL_EXTRANJERA',
    'Branch of a foreign company',
  ),

  /* Formas societarias de otras jurisdicciones (subtarea 1.1, prompt del
     diccionario internacional). Los 8 conceptos de arriba son de Bolivia y NO
     se renombran: son los que ya persisten filas reales. Cada figura nueva
     lleva su código de país como propiedad (`legal-entity-country`) y su
     categoría canónica (`legal-entity-canonical-category`), sembradas por
     `LegalEntityTypesSeedService` — ver `legal-entity-types.ts`. Fuentes:
     Código Civil brasileño (Lei 10.406/2002) + Lei das S.A. (6.404/1976) para
     BR; derecho societario estatal de EE. UU. (LLC/Corporation genéricas,
     sin estado específico) para US; Ley 27.349 de Sociedades por Acciones
     Simplificadas para AR; Ley General de Sociedades Mercantiles para MX. */
  LEGAL_ENTITY_BR_LTDA: def(
    'directory:legal-entity:br-ltda',
    'BR_LTDA',
    'Sociedade Limitada (Brazil)',
  ),
  LEGAL_ENTITY_BR_SA: def(
    'directory:legal-entity:br-sa',
    'BR_SA',
    'Sociedade Anônima (Brazil)',
  ),
  LEGAL_ENTITY_BR_MEI: def(
    'directory:legal-entity:br-mei',
    'BR_MEI',
    'Microempreendedor Individual (Brazil)',
  ),
  LEGAL_ENTITY_BR_EI: def(
    'directory:legal-entity:br-ei',
    'BR_EI',
    'Empresário Individual (Brazil)',
  ),
  LEGAL_ENTITY_BR_SLU: def(
    'directory:legal-entity:br-slu',
    'BR_SLU',
    'Sociedade Limitada Unipessoal (Brazil)',
  ),
  LEGAL_ENTITY_BR_FILIAL_EST: def(
    'directory:legal-entity:br-filial-est',
    'BR_FILIAL_EST',
    'Foreign company branch (Brazil)',
  ),
  LEGAL_ENTITY_US_LLC: def(
    'directory:legal-entity:us-llc',
    'US_LLC',
    'Limited Liability Company (US)',
  ),
  LEGAL_ENTITY_US_CORP: def(
    'directory:legal-entity:us-corp',
    'US_CORP',
    'Corporation (US)',
  ),
  LEGAL_ENTITY_US_SOLE_PROP: def(
    'directory:legal-entity:us-sole-prop',
    'US_SOLE_PROP',
    'Sole Proprietorship (US)',
  ),
  LEGAL_ENTITY_US_LLP: def(
    'directory:legal-entity:us-llp',
    'US_LLP',
    'Limited Liability Partnership (US)',
  ),
  LEGAL_ENTITY_US_BRANCH: def(
    'directory:legal-entity:us-branch',
    'US_BRANCH',
    'Foreign company branch (US)',
  ),
  LEGAL_ENTITY_AR_SAS: def(
    'directory:legal-entity:ar-sas',
    'AR_SAS',
    'Sociedad por Acciones Simplificada (Argentina)',
  ),
  LEGAL_ENTITY_MX_S_RL: def(
    'directory:legal-entity:mx-s-rl',
    'MX_S_RL',
    'Sociedad de Responsabilidad Limitada (Mexico)',
  ),
  TENANT_ACTIVE: def(
    'directory:tenant-status:active',
    'TENANT_ACTIVE',
    'Tenant active',
  ),
  TENANT_VERIFIED: def(
    'directory:tenant-verification:verified',
    'TENANT_VERIFIED',
    'Tenant verified',
  ),

  // --- Terminology: estados del ciclo de vida de catálogos ---
  TERM_DRAFT: def('terminology:state:draft', 'TERM_DRAFT', 'Draft'),
  TERM_ACTIVE: def('terminology:state:active', 'TERM_ACTIVE', 'Active'),
  TERM_RETIRED: def('terminology:state:retired', 'TERM_RETIRED', 'Retired'),
  TERM_DEPRECATED: def(
    'terminology:state:deprecated',
    'TERM_DEPRECATED',
    'Deprecated',
  ),

  // --- Terminology: metadatos de catálogo (24-30) ---
  SRC_TYPE_EXTERNAL: def(
    'terminology:source-type:external',
    'SRC_EXTERNAL',
    'External source',
  ),
  CS_CONTENT_COMPLETE: def(
    'terminology:content-type:complete',
    'COMPLETE',
    'Complete',
  ),
  LANG_ES: def('terminology:language:es', 'ES', 'Spanish'),
  LANG_EN: def('terminology:language:en', 'EN', 'English'),
  DESIG_PREFERRED: def(
    'terminology:designation-type:preferred',
    'DESIG_PREFERRED',
    'Preferred designation',
  ),
  DESIG_SYNONYM: def(
    'terminology:designation-type:synonym',
    'DESIG_SYNONYM',
    'Synonym',
  ),
  REL_IS_A: def('terminology:relationship:is-a', 'IS_A', 'Is a'),
  REL_PART_OF: def('terminology:relationship:part-of', 'PART_OF', 'Part of'),
  // --- Terminology: relaciones tipadas del glosario médico (Carril 03) ------
  // Aditivas a `REL_IS_A`/`REL_PART_OF`: la jerarquía genérica del catálogo no
  // alcanza para expresar «este síntoma se asocia a esta enfermedad» o «este
  // término se diagnostica con esta prueba». Semántica de cada una (documentada
  // también en el encabezado del seed del glosario):
  //  - RELATED_TERM: «ver también» genérico, sin direccionalidad implícita.
  //  - DISEASE: el origen se asocia clínicamente a / es manifestación de / está
  //    indicado para la enfermedad destino.
  //  - PROCEDURE: el origen se asocia al procedimiento clínico destino.
  //  - TREATMENT: el origen se trata mediante / involucra el tratamiento destino.
  //  - ANATOMY: el origen se relaciona con la estructura anatómica destino.
  //  - DIAGNOSTIC_TEST: el origen se diagnostica/monitorea mediante la prueba
  //    diagnóstica destino.
  REL_RELATED_TERM: def(
    'terminology:relationship:related-term',
    'RELATED_TERM',
    'Related term',
  ),
  REL_DISEASE: def(
    'terminology:relationship:disease',
    'REL_DISEASE',
    'Associated disease',
  ),
  // El código NO es `REL_PROCEDURE` aunque el símbolo sí: ese código ya lo ocupa
  // `RELATEDNESS_PROCEDURE` (`periop:relatedness:procedure`), y
  // `catalog_concepts` tiene UNIQUE(code_system_version_id, code). Los dos son
  // conceptos distintos —acá «el término se asocia a un procedimiento», allá «el
  // evento adverso se relaciona con el procedimiento»— así que no se unifican.
  // Se movió éste y no el de periop porque el de periop ya está materializado en
  // las bases existentes: cambiarlo dejaría el código de la fila viva divergido
  // para siempre del catálogo, ya que el seed inserta pero nunca actualiza.
  REL_PROCEDURE: def(
    'terminology:relationship:procedure',
    'REL_ASSOC_PROCEDURE',
    'Associated procedure',
  ),
  REL_TREATMENT: def(
    'terminology:relationship:treatment',
    'REL_TREATMENT',
    'Associated treatment',
  ),
  REL_ANATOMY: def(
    'terminology:relationship:anatomy',
    'REL_ANATOMY',
    'Associated anatomy',
  ),
  REL_DIAGNOSTIC_TEST: def(
    'terminology:relationship:diagnostic-test',
    'REL_DIAGNOSTIC_TEST',
    'Associated diagnostic test',
  ),
  VS_OP_IN: def('terminology:vs-operator:in', 'IN', 'In'),
  VS_OP_IS_A: def(
    'terminology:vs-operator:is-a',
    'VS_IS_A',
    'Is-a (transitive)',
  ),
  /** Filtra por el valor de una propiedad del concepto (UC-03-08). */
  VS_OP_PROP: def('terminology:vs-operator:prop', 'VS_PROP', 'Property equals'),

  /**
   * Equivalencias de `ConceptMap` (UC-03-09), del value set de FHIR. `wider` y
   * `narrower` no son intercambiables: dicen en qué dirección se pierde
   * información al traducir, y confundirlos convierte un mapeo seguro en uno que
   * afirma de más.
   */
  EQUIV_EQUIVALENT: def(
    'terminology:equivalence:equivalent',
    'EQ_EQUIVALENT',
    'Equivalent',
  ),
  EQUIV_WIDER: def('terminology:equivalence:wider', 'EQ_WIDER', 'Wider'),
  EQUIV_NARROWER: def(
    'terminology:equivalence:narrower',
    'EQ_NARROWER',
    'Narrower',
  ),
  EQUIV_INEXACT: def(
    'terminology:equivalence:inexact',
    'EQ_INEXACT',
    'Inexact',
  ),
  EQUIV_UNMATCHED: def(
    'terminology:equivalence:unmatched',
    'EQ_UNMATCHED',
    'Unmatched',
  ),

  /**
   * Modo del catálogo efectivo de un tenant (UC-03-12). `inherit` toma el value
   * set global tal cual; `subset` lo recorta; `extend` admite conceptos locales.
   */
  TENANT_CATALOG_INHERIT: def(
    'terminology:catalog-mode:inherit',
    'TC_INHERIT',
    'Inherit catalog',
  ),
  TENANT_CATALOG_SUBSET: def(
    'terminology:catalog-mode:subset',
    'TC_SUBSET',
    'Subset of catalog',
  ),
  TENANT_CATALOG_EXTEND: def(
    'terminology:catalog-mode:extend',
    'TC_EXTEND',
    'Extended catalog',
  ),

  // --- Monedas (ISO 4217) usadas por payments/billing (42) ---
  CURRENCY_BOB: def('currency:bob', 'BOB', 'Boliviano'),
  CURRENCY_USD: def('currency:usd', 'USD', 'US Dollar'),

  // --- Payments: estados del payment_intent (payment_intent_machine, mod. 32) ---
  PI_PENDING: def(
    'payments:intent-status:pending',
    'PI_PENDING',
    'Intent pending',
  ),
  PI_PROCESSING: def(
    'payments:intent-status:processing',
    'PI_PROCESSING',
    'Intent processing',
  ),
  PI_SUCCEEDED: def(
    'payments:intent-status:succeeded',
    'PI_SUCCEEDED',
    'Intent succeeded',
  ),
  PI_FAILED: def('payments:intent-status:failed', 'PI_FAILED', 'Intent failed'),
  PI_CANCELED: def(
    'payments:intent-status:canceled',
    'PI_CANCELED',
    'Intent canceled',
  ),

  // --- Payments: propósito del cobro (payment_intents.purpose_concept_id) ---
  PAY_PURPOSE_INVOICE: def(
    'payments:purpose:invoice',
    'PAY_INVOICE',
    'Invoice settlement',
  ),
  PAY_PURPOSE_DEBT: def('payments:purpose:debt', 'PAY_DEBT', 'Debt settlement'),
  PAY_PURPOSE_OTHER: def(
    'payments:purpose:other',
    'PAY_OTHER',
    'Other purpose',
  ),

  // --- Payments: sesión de checkout y deuda ---
  CHECKOUT_OPEN: def(
    'payments:checkout-status:open',
    'CHECKOUT_OPEN',
    'Checkout open',
  ),
  CHECKOUT_COMPLETED: def(
    'payments:checkout-status:completed',
    'CHECKOUT_DONE',
    'Checkout completed',
  ),
  CHECKOUT_EXPIRED: def(
    'payments:checkout-status:expired',
    'CHECKOUT_EXPIRED',
    'Checkout expired',
  ),
  DEBT_PENDING: def(
    'payments:debt-status:pending',
    'DEBT_PENDING',
    'Debt pending',
  ),
  DEBT_IN_CHECKOUT: def(
    'payments:debt-status:in-checkout',
    'DEBT_IN_CHECKOUT',
    'Debt in checkout',
  ),
  DEBT_SETTLED: def(
    'payments:debt-status:settled',
    'DEBT_SETTLED',
    'Debt settled',
  ),

  // --- Payments: bloqueo de tipo de cambio (fx_rate_locks) ---
  FX_ACTIVE: def('payments:fx-status:active', 'FX_ACTIVE', 'FX lock active'),
  FX_CONSUMED: def(
    'payments:fx-status:consumed',
    'FX_CONSUMED',
    'FX lock consumed',
  ),
  FX_EXPIRED: def(
    'payments:fx-status:expired',
    'FX_EXPIRED',
    'FX lock expired',
  ),

  // --- Payments: riesgo y 3-D Secure (risk_assessments) ---
  RISK_LOW: def('payments:risk-level:low', 'RISK_LOW', 'Low risk'),
  RISK_MEDIUM: def('payments:risk-level:medium', 'RISK_MEDIUM', 'Medium risk'),
  RISK_HIGH: def('payments:risk-level:high', 'RISK_HIGH', 'High risk'),
  RISK_APPROVE: def(
    'payments:risk-decision:approve',
    'RISK_APPROVE',
    'Approve',
  ),
  RISK_REVIEW: def(
    'payments:risk-decision:review',
    'RISK_REVIEW',
    'Manual review',
  ),
  RISK_DECLINE: def(
    'payments:risk-decision:decline',
    'RISK_DECLINE',
    'Decline',
  ),
  THREEDS_AUTHENTICATED: def(
    'payments:3ds:authenticated',
    'THREEDS_OK',
    '3-D Secure authenticated',
  ),
  THREEDS_NOT_ENROLLED: def(
    'payments:3ds:not-enrolled',
    'THREEDS_NA',
    '3-D Secure not enrolled',
  ),

  // --- Payments: transacciones de gateway (payment_transactions) ---
  TXN_PROCESSING: def(
    'payments:txn-status:processing',
    'TXN_PROCESSING',
    'Transaction processing',
  ),
  TXN_AUTHORIZED: def(
    'payments:txn-status:authorized',
    'TXN_AUTHORIZED',
    'Transaction authorized',
  ),
  TXN_CAPTURED: def(
    'payments:txn-status:captured',
    'TXN_CAPTURED',
    'Transaction captured',
  ),
  TXN_SETTLED: def(
    'payments:txn-status:settled',
    'TXN_SETTLED',
    'Transaction settled',
  ),
  TXN_FAILED: def(
    'payments:txn-status:failed',
    'TXN_FAILED',
    'Transaction failed',
  ),
  TXN_VOIDED: def(
    'payments:txn-status:voided',
    'TXN_VOIDED',
    'Transaction voided',
  ),
  TXN_OP_AUTHORIZE: def(
    'payments:txn-type:authorize',
    'TXN_AUTHORIZE',
    'Authorize',
  ),
  TXN_OP_CAPTURE: def('payments:txn-type:capture', 'TXN_CAPTURE', 'Capture'),
  TXN_OP_SALE: def('payments:txn-type:sale', 'TXN_SALE', 'Sale (auth+capture)'),

  // --- Payments: reembolsos y cancelaciones ---
  REFUND_PENDING: def(
    'payments:refund-status:pending',
    'REFUND_PENDING',
    'Refund pending',
  ),
  REFUND_COMPLETED: def(
    'payments:refund-status:completed',
    'REFUND_DONE',
    'Refund completed',
  ),
  REFUND_FAILED: def(
    'payments:refund-status:failed',
    'REFUND_FAILED',
    'Refund failed',
  ),
  REFUND_REASON_REQUESTED: def(
    'payments:refund-reason:requested',
    'REFUND_REQUESTED',
    'Customer requested',
  ),
  CANCEL_REQUESTED: def(
    'payments:cancel-status:requested',
    'CANCEL_REQUESTED',
    'Cancellation requested',
  ),
  CANCEL_COMPLETED: def(
    'payments:cancel-status:completed',
    'CANCEL_DONE',
    'Cancellation completed',
  ),
  CANCEL_REJECTED: def(
    'payments:cancel-status:rejected',
    'CANCEL_REJECTED',
    'Cancellation rejected',
  ),
  CANCEL_REASON_REQUESTED: def(
    'payments:cancel-reason:requested',
    'CANCEL_BY_PAYER',
    'Requested by payer',
  ),

  // --- Payments: fees, splits, settlement, payout y conciliación ---
  FEE_TYPE_GATEWAY: def(
    'payments:fee-type:gateway',
    'FEE_GATEWAY',
    'Gateway fee',
  ),
  FEE_TYPE_PLATFORM: def(
    'payments:fee-type:platform',
    'FEE_PLATFORM',
    'Platform fee',
  ),
  FEE_METHOD_PERCENTAGE: def(
    'payments:fee-method:percentage',
    'FEE_PERCENTAGE',
    'Percentage',
  ),
  FEE_METHOD_FIXED: def(
    'payments:fee-method:fixed',
    'FEE_FIXED',
    'Fixed amount',
  ),
  FEE_BEARER_MERCHANT: def(
    'payments:fee-bearer:merchant',
    'FEE_MERCHANT',
    'Borne by merchant',
  ),
  FEE_SUPERSEDED: def(
    'payments:fee-state:superseded',
    'FEE_SUPERSEDED',
    'Superseded schedule',
  ),
  SPLIT_TYPE_AMOUNT: def(
    'payments:split-type:amount',
    'SPLIT_AMOUNT',
    'Fixed amount split',
  ),
  SPLIT_TYPE_PERCENTAGE: def(
    'payments:split-type:percentage',
    'SPLIT_PERCENTAGE',
    'Percentage split',
  ),
  SPLIT_PENDING: def(
    'payments:split-status:pending',
    'SPLIT_PENDING',
    'Split pending',
  ),
  SPLIT_SETTLED: def(
    'payments:split-status:settled',
    'SPLIT_SETTLED',
    'Split settled',
  ),
  SETTLEMENT_SETTLED: def(
    'payments:settlement-status:settled',
    'SETTLEMENT_SETTLED',
    'Settled',
  ),
  PAYOUT_SCHEDULED: def(
    'payments:payout-status:scheduled',
    'PAYOUT_SCHEDULED',
    'Payout scheduled',
  ),
  PAYOUT_PROCESSING: def(
    'payments:payout-status:processing',
    'PAYOUT_PROCESSING',
    'Payout processing',
  ),
  PAYOUT_PAID: def('payments:payout-status:paid', 'PAYOUT_PAID', 'Payout paid'),
  PAYOUT_PAYEE_ACCOUNT: def(
    'payments:payee-type:connected-account',
    'PAYEE_ACCOUNT',
    'Connected account',
  ),
  PAYOUT_SOURCE_TRANSACTION: def(
    'payments:payout-source:transaction',
    'PAYOUT_SRC_TXN',
    'Payment transaction',
  ),
  RECON_RUNNING: def(
    'payments:recon-status:running',
    'RECON_RUNNING',
    'Reconciliation running',
  ),
  RECON_COMPLETED: def(
    'payments:recon-status:completed',
    'RECON_COMPLETED',
    'Reconciliation completed',
  ),
  RECON_MATCHED: def(
    'payments:recon-match:matched',
    'RECON_MATCHED',
    'Matched',
  ),
  RECON_UNMATCHED: def(
    'payments:recon-match:unmatched',
    'RECON_UNMATCHED',
    'Unmatched',
  ),
  RECON_EXC_MISSING_LEDGER: def(
    'payments:recon-exception:missing-in-ledger',
    'RECON_MISSING',
    'Missing in ledger',
  ),
  RECON_EXC_AMOUNT_MISMATCH: def(
    'payments:recon-exception:amount-mismatch',
    'RECON_AMOUNT_DIFF',
    'Amount mismatch',
  ),
  RECON_EXC_OPEN: def(
    'payments:recon-exception-status:open',
    'RECON_EXC_OPEN',
    'Open exception',
  ),

  // --- Scheduling: recursos agendables (41) ---
  RESOURCE_PRACTITIONER: def(
    'scheduling:resource-type:practitioner',
    'RES_PRACTITIONER',
    'Practitioner',
  ),
  RESOURCE_ROOM: def('scheduling:resource-type:room', 'RES_ROOM', 'Room'),
  RESOURCE_EQUIPMENT: def(
    'scheduling:resource-type:equipment',
    'RES_EQUIPMENT',
    'Equipment',
  ),

  // --- Scheduling: estado de la plantilla de agenda ---
  TEMPLATE_DRAFT: def(
    'scheduling:template-status:draft',
    'TPL_DRAFT',
    'Template draft',
  ),
  TEMPLATE_PUBLISHED: def(
    'scheduling:template-status:published',
    'TPL_PUBLISHED',
    'Template published',
  ),
  // Un horario que dejó de publicarse. NO es un borrado: la plantilla, sus
  // franjas y sus cupos con historia siguen ahí. Existe porque el borrado duro
  // es imposible — `audit.schedule_templates_history` referencia toda plantilla
  // publicada, así que ninguna se puede borrar nunca (P-10-2).
  TEMPLATE_RETIRED: def(
    'scheduling:template-status:retired',
    'TPL_RETIRED',
    'Template retired',
  ),

  // --- Scheduling: estado del slot (bookable_slots) ---
  SLOT_OPEN: def('scheduling:slot-status:open', 'SLOT_OPEN', 'Slot open'),
  SLOT_HELD: def('scheduling:slot-status:held', 'SLOT_HELD', 'Slot held'),
  SLOT_BOOKED: def(
    'scheduling:slot-status:booked',
    'SLOT_BOOKED',
    'Slot booked',
  ),
  SLOT_BLOCKED: def(
    'scheduling:slot-status:blocked',
    'SLOT_BLOCKED',
    'Slot blocked',
  ),

  // --- Scheduling: reserva temporal del slot (slot_holds) ---
  HOLD_ACTIVE: def(
    'scheduling:hold-status:active',
    'HOLD_ACTIVE',
    'Hold active',
  ),
  HOLD_CONSUMED: def(
    'scheduling:hold-status:consumed',
    'HOLD_CONSUMED',
    'Hold consumed',
  ),
  HOLD_EXPIRED: def(
    'scheduling:hold-status:expired',
    'HOLD_EXPIRED',
    'Hold expired',
  ),

  // --- Scheduling: estado de la cita (appointment_bookings) ---
  BOOKING_CONFIRMED: def(
    'scheduling:booking-status:confirmed',
    'BOOKING_CONFIRMED',
    'Booking confirmed',
  ),
  BOOKING_CHECKED_IN: def(
    'scheduling:booking-status:checked-in',
    'BOOKING_CHECKED_IN',
    'Patient checked in',
  ),
  BOOKING_CANCELLED: def(
    'scheduling:booking-status:cancelled',
    'BOOKING_CANCELLED',
    'Booking cancelled',
  ),
  BOOKING_RESCHEDULED: def(
    'scheduling:booking-status:rescheduled',
    'BOOKING_RESCHEDULED',
    'Booking rescheduled',
  ),

  // --- Scheduling: canal por el que se reservó ---
  CHANNEL_PORTAL: def(
    'scheduling:channel:portal',
    'CH_PORTAL',
    'Patient portal',
  ),
  CHANNEL_DESK: def('scheduling:channel:desk', 'CH_DESK', 'Front desk'),
  CHANNEL_PHONE: def('scheduling:channel:phone', 'CH_PHONE', 'Phone'),

  // --- Scheduling: motivos de cancelación ---
  CANCEL_BY_PATIENT: def(
    'scheduling:cancel-reason:patient',
    'CANCEL_PATIENT',
    'Cancelled by patient',
  ),
  CANCEL_BY_PROVIDER: def(
    'scheduling:cancel-reason:provider',
    'CANCEL_PROVIDER',
    'Cancelled by provider',
  ),
  CANCEL_NO_SHOW: def(
    'scheduling:cancel-reason:no-show',
    'CANCEL_NO_SHOW',
    'No show',
  ),

  // --- Scheduling: excepciones de disponibilidad ---
  EXCEPTION_ABSENCE: def(
    'scheduling:exception-type:absence',
    'EXC_ABSENCE',
    'Absence',
  ),
  EXCEPTION_HOLIDAY: def(
    'scheduling:exception-type:holiday',
    'EXC_HOLIDAY',
    'Holiday',
  ),
  EXCEPTION_EXTRA: def(
    'scheduling:exception-type:extra',
    'EXC_EXTRA',
    'Extra availability',
  ),
  // Los tres de arriba nacieron con el módulo y describen la MECÁNICA (falta,
  // feriado, disponibilidad extra). Los cuatro de acá describen el MOTIVO que
  // el profesional elige, que es lo que el propietario pidió catalogar.
  EXCEPTION_VACATION: def(
    'scheduling:exception-type:vacation',
    'EXC_VACATION',
    'Vacation',
  ),
  EXCEPTION_CONFERENCE: def(
    'scheduling:exception-type:conference',
    'EXC_CONFERENCE',
    'Conference or training',
  ),
  EXCEPTION_ERRAND: def(
    'scheduling:exception-type:errand',
    'EXC_ERRAND',
    'Personal errand',
  ),
  // «Otro» existe para que la lista pueda quedarse corta sin bloquear a nadie.
  // Exige el texto libre: un motivo «Otro» sin explicación no dice nada, y lo
  // que la gente escriba ahí es la mejor fuente para la lista definitiva.
  EXCEPTION_OTHER: def(
    'scheduling:exception-type:other',
    'EXC_OTHER',
    'Other reason',
  ),

  // --- Scheduling: lista de espera ---
  WAITLIST_ACTIVE: def(
    'scheduling:waitlist-status:active',
    'WL_ACTIVE',
    'Waiting',
  ),
  WAITLIST_FULFILLED: def(
    'scheduling:waitlist-status:fulfilled',
    'WL_FULFILLED',
    'Waitlist fulfilled',
  ),
  WAITLIST_CANCELLED: def(
    'scheduling:waitlist-status:cancelled',
    'WL_CANCELLED',
    'Waitlist cancelled',
  ),

  // --- Scheduling: recordatorios de cita ---
  REMINDER_SCHEDULED: def(
    'scheduling:reminder-status:scheduled',
    'REM_SCHEDULED',
    'Reminder scheduled',
  ),
  REMINDER_SENT: def(
    'scheduling:reminder-status:sent',
    'REM_SENT',
    'Reminder sent',
  ),
  REMINDER_CH_SMS: def(
    'scheduling:reminder-channel:sms',
    'REM_SMS',
    'SMS reminder',
  ),
  REMINDER_CH_EMAIL: def(
    'scheduling:reminder-channel:email',
    'REM_EMAIL',
    'Email reminder',
  ),

  // --- CRM: cuentas y equipo (49) ---
  ACCOUNT_CUSTOMER: def(
    'crm:account-type:customer',
    'ACC_CUSTOMER',
    'Customer account',
  ),
  ACCOUNT_PROSPECT: def(
    'crm:account-type:prospect',
    'ACC_PROSPECT',
    'Prospect account',
  ),
  ACCOUNT_PARTNER: def(
    'crm:account-type:partner',
    'ACC_PARTNER',
    'Partner account',
  ),
  TEAM_ROLE_OWNER: def('crm:team-role:owner', 'TEAM_OWNER', 'Account owner'),
  TEAM_ROLE_MEMBER: def('crm:team-role:member', 'TEAM_MEMBER', 'Team member'),
  ACCESS_READ: def('crm:access-level:read', 'ACCESS_READ', 'Read access'),
  ACCESS_WRITE: def('crm:access-level:write', 'ACCESS_WRITE', 'Write access'),

  // --- CRM: contactos y canales ---
  CONTACT_PERSON: def(
    'crm:contact-type:person',
    'CONTACT_PERSON',
    'Person contact',
  ),
  ENDPOINT_EMAIL: def(
    'crm:endpoint-type:email',
    'ENDPOINT_EMAIL',
    'Email endpoint',
  ),
  ENDPOINT_PHONE: def(
    'crm:endpoint-type:phone',
    'ENDPOINT_PHONE',
    'Phone endpoint',
  ),
  DELIVERABILITY_UNKNOWN: def(
    'crm:deliverability:unknown',
    'DELIV_UNKNOWN',
    'Deliverability unknown',
  ),

  // --- CRM: leads ---
  LEAD_SOURCE_WEB: def('crm:lead-source:web', 'LEAD_WEB', 'Web form'),
  LEAD_SOURCE_REFERRAL: def(
    'crm:lead-source:referral',
    'LEAD_REFERRAL',
    'Referral',
  ),
  LEAD_SOURCE_CAMPAIGN: def(
    'crm:lead-source:campaign',
    'LEAD_CAMPAIGN',
    'Campaign',
  ),
  LEAD_NEW: def('crm:lead-status:new', 'LEAD_NEW', 'New lead'),
  LEAD_QUALIFIED: def(
    'crm:lead-status:qualified',
    'LEAD_QUALIFIED',
    'Qualified lead',
  ),
  LEAD_DISQUALIFIED: def(
    'crm:lead-status:disqualified',
    'LEAD_DISQUALIFIED',
    'Disqualified lead',
  ),
  LEAD_CONVERTED: def(
    'crm:lead-status:converted',
    'LEAD_CONVERTED',
    'Converted lead',
  ),

  // --- CRM: oportunidades ---
  OPPORTUNITY_OPEN: def(
    'crm:opportunity-status:open',
    'OPP_OPEN',
    'Open opportunity',
  ),
  OPPORTUNITY_WON: def(
    'crm:opportunity-status:won',
    'OPP_WON',
    'Won opportunity',
  ),
  OPPORTUNITY_LOST: def(
    'crm:opportunity-status:lost',
    'OPP_LOST',
    'Lost opportunity',
  ),
  LOST_REASON_PRICE: def(
    'crm:lost-reason:price',
    'LOST_PRICE',
    'Lost on price',
  ),
  LOST_REASON_COMPETITOR: def(
    'crm:lost-reason:competitor',
    'LOST_COMPETITOR',
    'Lost to competitor',
  ),
  LOST_REASON_NO_BUDGET: def(
    'crm:lost-reason:no-budget',
    'LOST_NO_BUDGET',
    'No budget',
  ),

  // --- CRM: actividades ---
  ACTIVITY_TASK: def('crm:activity-type:task', 'ACT_TASK', 'Task'),
  ACTIVITY_EVENT: def('crm:activity-type:event', 'ACT_EVENT', 'Event'),
  ACTIVITY_EMAIL: def('crm:activity-type:email', 'ACT_EMAIL', 'Email'),
  ACTIVITY_CALL: def('crm:activity-type:call', 'ACT_CALL', 'Call'),
  ACTIVITY_NOTE: def('crm:activity-type:note', 'ACT_NOTE', 'Note'),
  ACTIVITY_OPEN: def('crm:activity-status:open', 'ACT_OPEN', 'Activity open'),
  ACTIVITY_COMPLETED: def(
    'crm:activity-status:completed',
    'ACT_COMPLETED',
    'Activity completed',
  ),
  DIRECTION_INBOUND: def('crm:direction:inbound', 'DIR_INBOUND', 'Inbound'),
  DIRECTION_OUTBOUND: def('crm:direction:outbound', 'DIR_OUTBOUND', 'Outbound'),
  SUBJECT_ACCOUNT: def(
    'crm:subject-type:account',
    'SUBJ_ACCOUNT',
    'Account subject',
  ),
  SUBJECT_OPPORTUNITY: def(
    'crm:subject-type:opportunity',
    'SUBJ_OPPORTUNITY',
    'Opportunity subject',
  ),
  SUBJECT_CASE: def('crm:subject-type:case', 'SUBJ_CASE', 'Case subject'),

  // --- CRM: partnerships ---
  PARTNERSHIP_REFERRAL: def(
    'crm:partnership-type:referral',
    'PARTNER_REFERRAL',
    'Referral partnership',
  ),
  PARTNERSHIP_RESELLER: def(
    'crm:partnership-type:reseller',
    'PARTNER_RESELLER',
    'Reseller partnership',
  ),
  AGREEMENT_FRAMEWORK: def(
    'crm:agreement-type:framework',
    'AGREEMENT_FRAMEWORK',
    'Framework agreement',
  ),

  // --- CRM: casos y SLA ---
  CASE_OPEN: def('crm:case-status:open', 'CASE_OPEN', 'Case open'),
  CASE_IN_PROGRESS: def(
    'crm:case-status:in-progress',
    'CASE_IN_PROGRESS',
    'Case in progress',
  ),
  CASE_RESOLVED: def(
    'crm:case-status:resolved',
    'CASE_RESOLVED',
    'Case resolved',
  ),
  CASE_CLOSED: def('crm:case-status:closed', 'CASE_CLOSED', 'Case closed'),
  PRIORITY_LOW: def('crm:priority:low', 'PRIO_LOW', 'Low priority'),
  PRIORITY_MEDIUM: def('crm:priority:medium', 'PRIO_MEDIUM', 'Medium priority'),
  PRIORITY_HIGH: def('crm:priority:high', 'PRIO_HIGH', 'High priority'),
  ORIGIN_PORTAL: def('crm:case-origin:portal', 'ORIGIN_PORTAL', 'Portal'),
  ORIGIN_PHONE: def('crm:case-origin:phone', 'ORIGIN_PHONE', 'Phone'),
  ORIGIN_EMAIL: def('crm:case-origin:email', 'ORIGIN_EMAIL', 'Email'),

  // --- ERP: socios de negocio (38) ---
  PARTNER_SUPPLIER: def(
    'erp:partner-category:supplier',
    'BP_SUPPLIER',
    'Supplier',
  ),
  PARTNER_CUSTOMER: def(
    'erp:partner-category:customer',
    'BP_CUSTOMER',
    'Customer',
  ),
  PARTNER_BOTH: def(
    'erp:partner-category:both',
    'BP_BOTH',
    'Supplier and customer',
  ),
  BANK_UNVERIFIED: def(
    'erp:bank-verification:unverified',
    'BANK_UNVERIFIED',
    'Unverified account',
  ),
  BANK_VERIFIED: def(
    'erp:bank-verification:verified',
    'BANK_VERIFIED',
    'Verified account',
  ),

  // --- ERP: contratos ---
  CONTRACT_DRAFT: def(
    'erp:contract-status:draft',
    'CONTRACT_DRAFT',
    'Contract draft',
  ),
  CONTRACT_ACTIVE: def(
    'erp:contract-status:active',
    'CONTRACT_ACTIVE',
    'Contract active',
  ),
  CONTRACT_TERMINATED: def(
    'erp:contract-status:terminated',
    'CONTRACT_TERMINATED',
    'Contract terminated',
  ),
  CONTRACT_EXPIRED: def(
    'erp:contract-status:expired',
    'CONTRACT_EXPIRED',
    'Contract expired',
  ),
  APPROVAL_PENDING: def(
    'erp:approval-status:pending',
    'APPROVAL_PENDING',
    'Approval pending',
  ),
  APPROVAL_APPROVED: def(
    'erp:approval-status:approved',
    'APPROVAL_APPROVED',
    'Approved',
  ),
  APPROVAL_REJECTED: def(
    'erp:approval-status:rejected',
    'APPROVAL_REJECTED',
    'Rejected',
  ),
  CONTRACT_TYPE_SERVICE: def(
    'erp:contract-type:service',
    'CONTRACT_SERVICE',
    'Service contract',
  ),
  CONTRACT_TYPE_SUPPLY: def(
    'erp:contract-type:supply',
    'CONTRACT_SUPPLY',
    'Supply contract',
  ),
  CONTRACT_TYPE_LEASE: def(
    'erp:contract-type:lease',
    'CONTRACT_LEASE',
    'Lease contract',
  ),
  COUNTERPARTY_PARTNER: def(
    'erp:counterparty-type:business-partner',
    'CP_PARTNER',
    'Business partner',
  ),
  AMENDMENT_SCOPE: def(
    'erp:amendment-type:scope',
    'AMEND_SCOPE',
    'Scope amendment',
  ),
  AMENDMENT_PRICE: def(
    'erp:amendment-type:price',
    'AMEND_PRICE',
    'Price amendment',
  ),
  RENEWAL_AUTOMATIC: def(
    'erp:renewal-type:automatic',
    'RENEWAL_AUTO',
    'Automatic renewal',
  ),
  RENEWAL_NEGOTIATED: def(
    'erp:renewal-type:negotiated',
    'RENEWAL_NEGOTIATED',
    'Negotiated renewal',
  ),
  TERMINATION_CAUSE: def(
    'erp:termination-type:cause',
    'TERM_CAUSE',
    'Termination for cause',
  ),
  TERMINATION_CONVENIENCE: def(
    'erp:termination-type:convenience',
    'TERM_CONVENIENCE',
    'Termination for convenience',
  ),
  SCHEDULE_PENDING: def(
    'erp:schedule-status:pending',
    'SCHED_PENDING',
    'Installment pending',
  ),
  PAYMENT_DIRECTION_OUT: def(
    'erp:payment-direction:outbound',
    'PAY_OUT',
    'Payable',
  ),
  PAYMENT_DIRECTION_IN: def(
    'erp:payment-direction:inbound',
    'PAY_IN',
    'Receivable',
  ),

  // --- ERP: recursos humanos ---
  EMPLOYEE_ACTIVE: def(
    'erp:employee-status:active',
    'EMP_ACTIVE',
    'Employee active',
  ),
  LEAVE_VACATION: def('erp:leave-type:vacation', 'LEAVE_VACATION', 'Vacation'),
  LEAVE_SICK: def('erp:leave-type:sick', 'LEAVE_SICK', 'Sick leave'),
  TIMEOFF_REQUESTED: def(
    'erp:timeoff-status:requested',
    'TIMEOFF_REQUESTED',
    'Time off requested',
  ),
  TIMEOFF_APPROVED: def(
    'erp:timeoff-status:approved',
    'TIMEOFF_APPROVED',
    'Time off approved',
  ),
  TIMEOFF_REJECTED: def(
    'erp:timeoff-status:rejected',
    'TIMEOFF_REJECTED',
    'Time off rejected',
  ),

  // --- ERP: compras y recepción ---
  PO_OPEN: def('erp:po-status:open', 'PO_OPEN', 'Purchase order open'),
  PO_RECEIVED: def(
    'erp:po-status:received',
    'PO_RECEIVED',
    'Purchase order received',
  ),
  PO_CLOSED: def('erp:po-status:closed', 'PO_CLOSED', 'Purchase order closed'),
  ITEM_TYPE_MATERIAL: def(
    'erp:po-item-type:material',
    'ITEM_MATERIAL',
    'Material line',
  ),
  ITEM_TYPE_SERVICE: def(
    'erp:po-item-type:service',
    'ITEM_SERVICE',
    'Service line',
  ),
  RECEIPT_POSTED: def(
    'erp:receipt-status:posted',
    'RECEIPT_POSTED',
    'Receipt posted',
  ),
  QUALITY_ACCEPTED: def(
    'erp:quality-status:accepted',
    'QUALITY_ACCEPTED',
    'Accepted',
  ),
  QUALITY_REJECTED: def(
    'erp:quality-status:rejected',
    'QUALITY_REJECTED',
    'Rejected',
  ),
  SHEET_SUBMITTED: def(
    'erp:sheet-status:submitted',
    'SHEET_SUBMITTED',
    'Service sheet submitted',
  ),

  // --- ERP: conciliación de facturas (three-way match) ---
  MATCH_THREE_WAY: def(
    'erp:match-type:three-way',
    'MATCH_3WAY',
    'Three-way match',
  ),
  MATCH_TWO_WAY: def('erp:match-type:two-way', 'MATCH_2WAY', 'Two-way match'),
  MATCH_RESULT_OK: def('erp:match-result:matched', 'MATCH_OK', 'Matched'),
  MATCH_RESULT_VARIANCE: def(
    'erp:match-result:variance',
    'MATCH_VARIANCE',
    'Variance detected',
  ),

  // --- ERP: ventas y arrendamientos ---
  SALES_ORDER_OPEN: def(
    'erp:sales-order-status:open',
    'SO_OPEN',
    'Sales order open',
  ),
  ACCOUNTING_IFRS16: def(
    'erp:accounting-principle:ifrs16',
    'IFRS16',
    'IFRS 16',
  ),
  VALUATION_POSTED: def(
    'erp:valuation-status:posted',
    'VALUATION_POSTED',
    'Valuation posted',
  ),

  // --- Marketing: segmentos (50) ---
  SEGMENT_DYNAMIC: def(
    'marketing:segment-type:dynamic',
    'SEG_DYNAMIC',
    'Dynamic segment',
  ),
  SEGMENT_STATIC: def(
    'marketing:segment-type:static',
    'SEG_STATIC',
    'Static segment',
  ),
  MEMBER_CONTACT: def(
    'marketing:member-type:contact',
    'MEMBER_CONTACT',
    'Contact member',
  ),
  MEMBER_PATIENT: def(
    'marketing:member-type:patient',
    'MEMBER_PATIENT',
    'Patient member',
  ),

  SEGMENT_MEMBER_ACTIVE: def(
    'marketing:segment-member-status:active',
    'SM_ACTIVE',
    'Segment member active',
  ),
  SEGMENT_MEMBER_REMOVED: def(
    'marketing:segment-member-status:removed',
    'SM_REMOVED',
    'Segment member removed',
  ),

  // --- Marketing: campañas ---
  // UC-50-03 crea la campaña en `scheduled`; UC-50-04 la pasa a `running` al
  // materializar la audiencia. `finished` la cierra al vencer `end_at`.
  CAMPAIGN_SCHEDULED: def(
    'marketing:campaign-status:scheduled',
    'CAMPAIGN_SCHEDULED',
    'Campaign scheduled',
  ),
  CAMPAIGN_RUNNING: def(
    'marketing:campaign-status:running',
    'CAMPAIGN_RUNNING',
    'Campaign running',
  ),
  CAMPAIGN_FINISHED: def(
    'marketing:campaign-status:finished',
    'CAMPAIGN_FINISHED',
    'Campaign finished',
  ),
  CAMPAIGN_TYPE_ONE_SHOT: def(
    'marketing:campaign-type:one-shot',
    'CAMPAIGN_ONE_SHOT',
    'One-shot campaign',
  ),
  CAMPAIGN_TYPE_RECURRING: def(
    'marketing:campaign-type:recurring',
    'CAMPAIGN_RECURRING',
    'Recurring campaign',
  ),
  OBJECTIVE_AWARENESS: def(
    'marketing:objective:awareness',
    'OBJ_AWARENESS',
    'Awareness',
  ),
  OBJECTIVE_CONVERSION: def(
    'marketing:objective:conversion',
    'OBJ_CONVERSION',
    'Conversion',
  ),
  OBJECTIVE_RETENTION: def(
    'marketing:objective:retention',
    'OBJ_RETENTION',
    'Retention',
  ),
  CH_EMAIL: def('marketing:channel:email', 'MKT_EMAIL', 'Email channel'),
  CH_SMS: def('marketing:channel:sms', 'MKT_SMS', 'SMS channel'),
  CH_PUSH: def('marketing:channel:push', 'MKT_PUSH', 'Push channel'),
  CAMPAIGN_MEMBER_TARGETED: def(
    'marketing:member-status:targeted',
    'CM_TARGETED',
    'Member targeted',
  ),
  CAMPAIGN_MEMBER_DELIVERED: def(
    'marketing:member-status:delivered',
    'CM_DELIVERED',
    'Member delivered',
  ),
  CAMPAIGN_MEMBER_OPENED: def(
    'marketing:member-status:opened',
    'CM_OPENED',
    'Member opened',
  ),
  CAMPAIGN_MEMBER_CLICKED: def(
    'marketing:member-status:clicked',
    'CM_CLICKED',
    'Member clicked',
  ),
  CAMPAIGN_MEMBER_CONVERTED: def(
    'marketing:member-status:converted',
    'CM_CONVERTED',
    'Member converted',
  ),
  CAMPAIGN_MEMBER_UNSUBSCRIBED: def(
    'marketing:member-status:unsubscribed',
    'CM_UNSUBSCRIBED',
    'Member unsubscribed',
  ),
  CAMPAIGN_MEMBER_BOUNCED: def(
    'marketing:member-status:bounced',
    'CM_BOUNCED',
    'Member bounced',
  ),

  // --- Marketing: contenido ---
  // Nombre propio para no chocar con TEMPLATE_PUBLISHED de scheduling (334).
  CONTENT_TEMPLATE_PUBLISHED: def(
    'marketing:content-template-status:published',
    'CONTENT_TPL_PUBLISHED',
    'Content template published',
  ),
  CONTENT_TEMPLATE_ARCHIVED: def(
    'marketing:content-template-status:archived',
    'CONTENT_TPL_ARCHIVED',
    'Content template archived',
  ),

  // --- Marketing: journeys ---
  JOURNEY_DRAFT: def(
    'marketing:journey-state:draft',
    'JOURNEY_DRAFT',
    'Journey draft',
  ),
  JOURNEY_ACTIVE: def(
    'marketing:journey-state:active',
    'JOURNEY_ACTIVE',
    'Journey active',
  ),
  JOURNEY_TRIGGER_SEGMENT: def(
    'marketing:journey-trigger:segment',
    'TRIGGER_SEGMENT',
    'Segment entry',
  ),
  JOURNEY_TRIGGER_EVENT: def(
    'marketing:journey-trigger:event',
    'TRIGGER_EVENT',
    'Event entry',
  ),
  STEP_SEND: def('marketing:step-type:send', 'STEP_SEND', 'Send step'),
  STEP_WAIT: def('marketing:step-type:wait', 'STEP_WAIT', 'Wait step'),
  STEP_BRANCH: def('marketing:step-type:branch', 'STEP_BRANCH', 'Branch step'),
  STEP_GOAL: def('marketing:step-type:goal', 'STEP_GOAL', 'Goal step'),
  STEP_UPDATE: def('marketing:step-type:update', 'STEP_UPDATE', 'Update step'),
  STEP_EXIT: def('marketing:step-type:exit', 'STEP_EXIT', 'Exit step'),
  STEP_WEBHOOK: def(
    'marketing:step-type:webhook',
    'STEP_WEBHOOK',
    'Webhook step',
  ),
  ENROLLMENT_ACTIVE: def(
    'marketing:enrollment-status:active',
    'ENROLL_ACTIVE',
    'Enrollment active',
  ),
  ENROLLMENT_COMPLETED: def(
    'marketing:enrollment-status:completed',
    'ENROLL_COMPLETED',
    'Enrollment completed',
  ),
  ENROLLMENT_EXITED: def(
    'marketing:enrollment-status:exited',
    'ENROLL_EXITED',
    'Enrollment exited',
  ),
  EXIT_REASON_GOAL: def(
    'marketing:exit-reason:goal',
    'EXIT_GOAL',
    'Goal reached',
  ),
  EXIT_REASON_UNSUBSCRIBE: def(
    'marketing:exit-reason:unsubscribe',
    'EXIT_UNSUBSCRIBE',
    'Unsubscribed',
  ),
  EXIT_REASON_BOUNCE: def(
    'marketing:exit-reason:bounce',
    'EXIT_BOUNCE',
    'Bounced',
  ),

  // --- Marketing: tracking y atribución ---
  TOUCH_IMPRESSION: def(
    'marketing:touch-type:impression',
    'TOUCH_IMPRESSION',
    'Impression',
  ),
  TOUCH_OPEN: def('marketing:touch-type:open', 'TOUCH_OPEN', 'Open'),
  TOUCH_CLICK: def('marketing:touch-type:click', 'TOUCH_CLICK', 'Click'),
  TOUCH_VISIT: def('marketing:touch-type:visit', 'TOUCH_VISIT', 'Visit'),
  TOUCH_CONVERSION: def(
    'marketing:touch-type:conversion',
    'TOUCH_CONVERSION',
    'Conversion',
  ),
  TOUCH_REPLY: def('marketing:touch-type:reply', 'TOUCH_REPLY', 'Reply'),
  ATTR_MODEL_LAST_TOUCH: def(
    'marketing:attribution-model:last-touch',
    'ATTR_LAST',
    'Last touch',
  ),
  ATTR_MODEL_FIRST_TOUCH: def(
    'marketing:attribution-model:first-touch',
    'ATTR_FIRST',
    'First touch',
  ),
  ATTR_MODEL_LINEAR: def(
    'marketing:attribution-model:linear',
    'ATTR_LINEAR',
    'Linear',
  ),
  ATTR_POSITION_FIRST: def(
    'marketing:attribution-position:first',
    'POS_FIRST',
    'First position',
  ),
  ATTR_POSITION_MIDDLE: def(
    'marketing:attribution-position:middle',
    'POS_MIDDLE',
    'Middle position',
  ),
  ATTR_POSITION_LAST: def(
    'marketing:attribution-position:last',
    'POS_LAST',
    'Last position',
  ),

  // --- Promociones: programas de lealtad (51) ---
  LOYALTY_TYPE_POINTS: def(
    'promotions:loyalty-type:points',
    'LOYALTY_POINTS',
    'Points program',
  ),
  LOYALTY_TYPE_TIERED: def(
    'promotions:loyalty-type:tiered',
    'LOYALTY_TIERED',
    'Tiered program',
  ),
  LOYALTY_DRAFT: def(
    'promotions:loyalty-state:draft',
    'LOYALTY_DRAFT',
    'Loyalty program draft',
  ),
  LOYALTY_ACTIVE: def(
    'promotions:loyalty-state:active',
    'LOYALTY_ACTIVE',
    'Loyalty program active',
  ),
  EXPIRY_NEVER: def(
    'promotions:expiry-policy:never',
    'EXPIRY_NEVER',
    'Points never expire',
  ),
  EXPIRY_ROLLING: def(
    'promotions:expiry-policy:rolling',
    'EXPIRY_ROLLING',
    'Rolling expiry window',
  ),
  REWARD_MEMBER_USER: def(
    'promotions:reward-member:user',
    'REWARD_USER',
    'User member',
  ),
  REWARD_MEMBER_PATIENT: def(
    'promotions:reward-member:patient',
    'REWARD_PATIENT',
    'Patient member',
  ),
  MEMBERSHIP_ACTIVE: def(
    'promotions:membership-status:active',
    'MEMBERSHIP_ACTIVE',
    'Membership active',
  ),

  // --- Promociones: ledger de puntos ---
  POINTS_EARN: def(
    'promotions:points-direction:earn',
    'POINTS_EARN',
    'Points earned',
  ),
  POINTS_REDEEM: def(
    'promotions:points-direction:redeem',
    'POINTS_REDEEM',
    'Points redeemed',
  ),
  POINTS_EXPIRE: def(
    'promotions:points-direction:expire',
    'POINTS_EXPIRE',
    'Points expired',
  ),
  POINTS_ADJUST: def(
    'promotions:points-direction:adjust',
    'POINTS_ADJUST',
    'Points adjusted',
  ),
  REASON_SIGNUP: def(
    'promotions:points-reason:signup',
    'REASON_SIGNUP',
    'Signup bonus',
  ),
  REASON_EVENT: def(
    'promotions:points-reason:event',
    'REASON_EVENT',
    'App event',
  ),
  REASON_REDEMPTION: def(
    'promotions:points-reason:redemption',
    'REASON_REDEMPTION',
    'Redemption',
  ),
  REASON_EXPIRY: def(
    'promotions:points-reason:expiry',
    'REASON_EXPIRY',
    'Expiry sweep',
  ),
  REASON_REFERRAL: def(
    'promotions:points-reason:referral',
    'REASON_REFERRAL',
    'Referral reward',
  ),
  REASON_MANUAL: def(
    'promotions:points-reason:manual',
    'REASON_MANUAL',
    'Manual adjustment',
  ),
  AWARD_POINTS: def(
    'promotions:award-type:points',
    'AWARD_POINTS',
    'Points award',
  ),
  AWARD_WALLET_CREDIT: def(
    'promotions:award-type:wallet-credit',
    'AWARD_CREDIT',
    'Wallet credit award',
  ),
  APP_EVENT_BOOKING_COMPLETED: def(
    'promotions:app-event:booking-completed',
    'EV_BOOKING_DONE',
    'Booking completed',
  ),
  APP_EVENT_COURSE_COMPLETED: def(
    'promotions:app-event:course-completed',
    'EV_COURSE_DONE',
    'Course completed',
  ),
  APP_EVENT_REVIEW_POSTED: def(
    'promotions:app-event:review-posted',
    'EV_REVIEW',
    'Review posted',
  ),
  APP_EVENT_STREAK: def(
    'promotions:app-event:streak',
    'EV_STREAK',
    'Streak reached',
  ),
  CAP_PERIOD_DAY: def('promotions:cap-period:day', 'CAP_DAY', 'Per day'),
  CAP_PERIOD_WEEK: def('promotions:cap-period:week', 'CAP_WEEK', 'Per week'),
  CAP_PERIOD_MONTH: def(
    'promotions:cap-period:month',
    'CAP_MONTH',
    'Per month',
  ),

  // --- Promociones: descuentos y cupones ---
  PROMOTION_TYPE_AUTOMATIC: def(
    'promotions:promotion-type:automatic',
    'PROMO_AUTO',
    'Automatic promotion',
  ),
  PROMOTION_TYPE_COUPON: def(
    'promotions:promotion-type:coupon',
    'PROMO_COUPON',
    'Coupon promotion',
  ),
  PROMOTION_DRAFT: def(
    'promotions:promotion-status:draft',
    'PROMO_DRAFT',
    'Promotion draft',
  ),
  PROMOTION_ACTIVE: def(
    'promotions:promotion-status:active',
    'PROMO_ACTIVE',
    'Promotion active',
  ),
  DISCOUNT_PERCENTAGE: def(
    'promotions:discount-type:percentage',
    'DISC_PERCENT',
    'Percentage discount',
  ),
  DISCOUNT_FIXED: def(
    'promotions:discount-type:fixed',
    'DISC_FIXED',
    'Fixed amount discount',
  ),
  DISCOUNT_BOGO: def(
    'promotions:discount-type:bogo',
    'DISC_BOGO',
    'Buy one get one',
  ),
  DISCOUNT_TARGET_ORDER: def(
    'promotions:discount-target:order',
    'TARGET_ORDER',
    'Whole order',
  ),
  DISCOUNT_TARGET_ITEM: def(
    'promotions:discount-target:item',
    'TARGET_ITEM',
    'Specific item',
  ),
  DISCOUNT_TARGET_CATEGORY: def(
    'promotions:discount-target:category',
    'TARGET_CATEGORY',
    'Category',
  ),
  COUPON_PUBLIC: def(
    'promotions:coupon-type:public',
    'COUPON_PUBLIC',
    'Public coupon',
  ),
  COUPON_SINGLE_USE: def(
    'promotions:coupon-type:single-use',
    'COUPON_SINGLE',
    'Single-use coupon',
  ),
  COUPON_PERSONAL: def(
    'promotions:coupon-type:personal',
    'COUPON_PERSONAL',
    'Personal coupon',
  ),
  COUPON_BATCH: def(
    'promotions:coupon-type:batch',
    'COUPON_BATCH',
    'Batch coupon',
  ),
  COUPON_ACTIVE: def(
    'promotions:coupon-status:active',
    'COUPON_ACTIVE',
    'Coupon active',
  ),
  COUPON_EXHAUSTED: def(
    'promotions:coupon-status:exhausted',
    'COUPON_EXHAUSTED',
    'Coupon exhausted',
  ),
  REDEMPTION_APPLIED: def(
    'promotions:redemption-status:applied',
    'REDEEM_APPLIED',
    'Redemption applied',
  ),
  REDEMPTION_REVERSED: def(
    'promotions:redemption-status:reversed',
    'REDEEM_REVERSED',
    'Redemption reversed',
  ),

  // --- Promociones: referidos ---
  REFERRAL_PENDING: def(
    'promotions:referral-status:pending',
    'REFERRAL_PENDING',
    'Referral pending',
  ),
  REFERRAL_QUALIFIED: def(
    'promotions:referral-status:qualified',
    'REFERRAL_QUALIFIED',
    'Referral qualified',
  ),
  QUALIFY_SIGNUP: def(
    'promotions:qualifying-event:signup',
    'QUALIFY_SIGNUP',
    'Signup',
  ),
  QUALIFY_FIRST_BOOKING: def(
    'promotions:qualifying-event:first-booking',
    'QUALIFY_BOOKING',
    'First booking',
  ),
  QUALIFY_FIRST_PAYMENT: def(
    'promotions:qualifying-event:first-payment',
    'QUALIFY_PAYMENT',
    'First payment',
  ),

  // --- Ads: cuentas, socios y conexiones (43) ---
  AD_ACCOUNT_ACTIVE: def(
    'ads:account-status:active',
    'AD_ACC_ACTIVE',
    'Ad account active',
  ),
  AD_ACCOUNT_DISABLED: def(
    'ads:account-status:disabled',
    'AD_ACC_DISABLED',
    'Ad account disabled',
  ),
  AD_ROLE_ADMIN: def(
    'ads:account-role:admin',
    'AD_ROLE_ADMIN',
    'Ad account admin',
  ),
  AD_ROLE_ADVERTISER: def(
    'ads:account-role:advertiser',
    'AD_ROLE_ADV',
    'Advertiser',
  ),
  AD_ROLE_ANALYST: def(
    'ads:account-role:analyst',
    'AD_ROLE_ANALYST',
    'Analyst',
  ),
  PARTNER_TYPE_AGENCY: def(
    'ads:partner-type:agency',
    'PARTNER_AGENCY',
    'Agency partner',
  ),
  PARTNER_TYPE_VENDOR: def(
    'ads:partner-type:vendor',
    'PARTNER_VENDOR',
    'Vendor partner',
  ),
  PARTNER_REL_MANAGE: def(
    'ads:partner-relationship:manage',
    'PARTNER_MANAGE',
    'Managed by partner',
  ),
  PARTNER_REL_SHARE: def(
    'ads:partner-relationship:share',
    'PARTNER_SHARE',
    'Asset share',
  ),
  AD_PLATFORM_META: def('ads:platform:meta', 'PLATFORM_META', 'Meta'),
  AD_PLATFORM_GOOGLE: def('ads:platform:google', 'PLATFORM_GOOGLE', 'Google'),
  AD_PLATFORM_TIKTOK: def('ads:platform:tiktok', 'PLATFORM_TIKTOK', 'TikTok'),
  CONNECTION_CONNECTED: def(
    'ads:connection-status:connected',
    'CONN_CONNECTED',
    'Connected',
  ),
  CONNECTION_REVOKED: def(
    'ads:connection-status:revoked',
    'CONN_REVOKED',
    'Connection revoked',
  ),
  IDENTITY_PAGE: def(
    'ads:identity-type:page',
    'IDENTITY_PAGE',
    'Page identity',
  ),
  IDENTITY_INSTAGRAM: def(
    'ads:identity-type:instagram',
    'IDENTITY_IG',
    'Instagram identity',
  ),
  SYNC_DIRECTION_IMPORT: def(
    'ads:sync-direction:import',
    'SYNC_IMPORT',
    'Import',
  ),
  SYNC_DIRECTION_EXPORT: def(
    'ads:sync-direction:export',
    'SYNC_EXPORT',
    'Export',
  ),
  SYNC_SUCCEEDED: def('ads:sync-status:succeeded', 'SYNC_OK', 'Sync succeeded'),
  SYNC_FAILED: def('ads:sync-status:failed', 'SYNC_FAILED', 'Sync failed'),
  AD_OBJECT_IDENTITY: def(
    'ads:object-type:identity',
    'OBJ_IDENTITY',
    'Identity object',
  ),
  AD_OBJECT_CAMPAIGN: def(
    'ads:object-type:campaign',
    'OBJ_CAMPAIGN',
    'Campaign object',
  ),
  AD_OBJECT_ADSET: def('ads:object-type:ad-set', 'OBJ_ADSET', 'Ad set object'),
  AD_OBJECT_AD: def('ads:object-type:ad', 'OBJ_AD', 'Ad object'),
  AD_OBJECT_INSIGHT: def(
    'ads:object-type:insight',
    'OBJ_INSIGHT',
    'Insight object',
  ),

  // --- Ads: jerarquía de campaña ---
  AD_OBJECTIVE_AWARENESS: def(
    'ads:objective:awareness',
    'ADS_AWARENESS',
    'Awareness',
  ),
  AD_OBJECTIVE_TRAFFIC: def('ads:objective:traffic', 'ADS_TRAFFIC', 'Traffic'),
  AD_OBJECTIVE_CONVERSIONS: def(
    'ads:objective:conversions',
    'ADS_CONVERSIONS',
    'Conversions',
  ),
  AD_OBJECTIVE_LEADS: def(
    'ads:objective:leads',
    'ADS_LEADS',
    'Lead generation',
  ),
  BUYING_AUCTION: def('ads:buying-type:auction', 'BUY_AUCTION', 'Auction'),
  BUYING_RESERVED: def('ads:buying-type:reserved', 'BUY_RESERVED', 'Reserved'),
  BID_LOWEST_COST: def(
    'ads:bid-strategy:lowest-cost',
    'BID_LOWEST',
    'Lowest cost',
  ),
  BID_COST_CAP: def('ads:bid-strategy:cost-cap', 'BID_COST_CAP', 'Cost cap'),
  BID_BID_CAP: def('ads:bid-strategy:bid-cap', 'BID_BID_CAP', 'Bid cap'),
  AD_STATUS_PAUSED: def('ads:status:paused', 'ADS_PAUSED', 'Paused'),
  AD_STATUS_ACTIVE: def('ads:status:active', 'ADS_ACTIVE', 'Active'),
  AD_STATUS_ARCHIVED: def('ads:status:archived', 'ADS_ARCHIVED', 'Archived'),
  AD_EFFECTIVE_PENDING_REVIEW: def(
    'ads:effective-status:pending-review',
    'EFF_PENDING',
    'Pending review',
  ),
  AD_EFFECTIVE_ACTIVE: def(
    'ads:effective-status:active',
    'EFF_ACTIVE',
    'Effectively active',
  ),
  AD_EFFECTIVE_DISAPPROVED: def(
    'ads:effective-status:disapproved',
    'EFF_DISAPPROVED',
    'Disapproved',
  ),
  OPT_GOAL_LINK_CLICKS: def(
    'ads:optimization-goal:link-clicks',
    'OPT_CLICKS',
    'Link clicks',
  ),
  OPT_GOAL_IMPRESSIONS: def(
    'ads:optimization-goal:impressions',
    'OPT_IMPRESSIONS',
    'Impressions',
  ),
  OPT_GOAL_CONVERSIONS: def(
    'ads:optimization-goal:conversions',
    'OPT_CONVERSIONS',
    'Conversions',
  ),
  BILLING_EVENT_IMPRESSIONS: def(
    'ads:billing-event:impressions',
    'BILL_IMPRESSIONS',
    'Billed per impression',
  ),
  BILLING_EVENT_CLICKS: def(
    'ads:billing-event:clicks',
    'BILL_CLICKS',
    'Billed per click',
  ),
  PLACEMENT_FEED: def('ads:placement-position:feed', 'POS_FEED', 'Feed'),
  PLACEMENT_STORY: def('ads:placement-position:story', 'POS_STORY', 'Story'),
  PLACEMENT_REELS: def('ads:placement-position:reels', 'POS_REELS', 'Reels'),
  CREATIVE_SINGLE_IMAGE: def(
    'ads:creative-format:single-image',
    'CR_IMAGE',
    'Single image',
  ),
  CREATIVE_VIDEO: def('ads:creative-format:video', 'CR_VIDEO', 'Video'),
  CREATIVE_CAROUSEL: def(
    'ads:creative-format:carousel',
    'CR_CAROUSEL',
    'Carousel',
  ),
  ASSET_TYPE_IMAGE: def('ads:asset-type:image', 'ASSET_IMAGE', 'Image asset'),
  ASSET_TYPE_VIDEO: def('ads:asset-type:video', 'ASSET_VIDEO', 'Video asset'),

  // --- Ads: audiencias e identidad ---
  AUDIENCE_CUSTOM: def(
    'ads:audience-type:custom',
    'AUD_CUSTOM',
    'Custom audience',
  ),
  AUDIENCE_LOOKALIKE: def(
    'ads:audience-type:lookalike',
    'AUD_LOOKALIKE',
    'Lookalike audience',
  ),
  AUDIENCE_SOURCE_PIXEL: def(
    'ads:audience-source:pixel',
    'AUD_SRC_PIXEL',
    'From pixel',
  ),
  AUDIENCE_SOURCE_LIST: def(
    'ads:audience-source:customer-list',
    'AUD_SRC_LIST',
    'From hashed list',
  ),
  AUDIENCE_SOURCE_ENGAGEMENT: def(
    'ads:audience-source:engagement',
    'AUD_SRC_ENGAGE',
    'From engagement',
  ),
  AUDIENCE_POPULATING: def(
    'ads:audience-status:populating',
    'AUD_POPULATING',
    'Audience populating',
  ),
  AUDIENCE_READY: def(
    'ads:audience-status:ready',
    'AUD_READY',
    'Audience ready',
  ),
  ASSIGNABLE_AD_SET: def(
    'ads:assignable-type:ad-set',
    'ASSIGN_ADSET',
    'Assigned to ad set',
  ),
  ASSIGNMENT_ROLE_PRIMARY: def(
    'ads:assignment-role:primary',
    'ASSIGN_PRIMARY',
    'Primary identity',
  ),
  ASSIGNMENT_ROLE_SECONDARY: def(
    'ads:assignment-role:secondary',
    'ASSIGN_SECONDARY',
    'Secondary identity',
  ),

  // --- Ads: política de datos de evento ---
  JURISDICTION_BO: def('ads:jurisdiction:bo', 'JUR_BO', 'Bolivia'),
  JURISDICTION_EU: def('ads:jurisdiction:eu', 'JUR_EU', 'European Union'),
  JURISDICTION_US: def('ads:jurisdiction:us', 'JUR_US', 'United States'),
  AD_PURPOSE_MARKETING: def(
    'ads:purpose-of-use:marketing',
    'PURPOSE_MARKETING',
    'Marketing',
  ),
  AD_PURPOSE_ANALYTICS: def(
    'ads:purpose-of-use:analytics',
    'PURPOSE_ANALYTICS',
    'Analytics',
  ),
  FIELD_ACTION_ALLOW: def(
    'ads:field-action:allow',
    'FIELD_ALLOW',
    'Allow field',
  ),
  FIELD_ACTION_BLOCK: def(
    'ads:field-action:block',
    'FIELD_BLOCK',
    'Block event',
  ),
  FIELD_ACTION_HASH: def('ads:field-action:hash', 'FIELD_HASH', 'Hash field'),
  FIELD_ACTION_DROP: def('ads:field-action:drop', 'FIELD_DROP', 'Drop field'),
  TRANSFORM_SHA256: def(
    'ads:transformation:sha256',
    'TRANSFORM_SHA256',
    'SHA-256',
  ),
  TRANSFORM_TRUNCATE: def(
    'ads:transformation:truncate',
    'TRANSFORM_TRUNC',
    'Truncate',
  ),

  // --- Ads: entrega, insights y facturación ---
  AD_ENTITY_ACCOUNT: def(
    'ads:entity-type:account',
    'ENT_ACCOUNT',
    'Ad account',
  ),
  AD_ENTITY_CAMPAIGN: def(
    'ads:entity-type:campaign',
    'ENT_CAMPAIGN',
    'Campaign',
  ),
  AD_ENTITY_ADSET: def('ads:entity-type:ad-set', 'ENT_ADSET', 'Ad set'),
  AD_ENTITY_AD: def('ads:entity-type:ad', 'ENT_AD', 'Ad'),
  INSIGHT_RUN_RUNNING: def(
    'ads:insight-run-status:running',
    'RUN_RUNNING',
    'Insight run running',
  ),
  INSIGHT_RUN_COMPLETED: def(
    'ads:insight-run-status:completed',
    'RUN_COMPLETED',
    'Insight run completed',
  ),
  INSIGHT_RUN_FAILED: def(
    'ads:insight-run-status:failed',
    'RUN_FAILED',
    'Insight run failed',
  ),
  INSIGHT_SOURCE_PLATFORM: def(
    'ads:insight-source:platform-api',
    'SRC_PLATFORM',
    'Platform API',
  ),
  AD_BILLING_CHARGE: def(
    'ads:billing-event-type:charge',
    'BILL_CHARGE',
    'Charge',
  ),
  AD_BILLING_CREDIT: def(
    'ads:billing-event-type:credit',
    'BILL_CREDIT',
    'Credit',
  ),
  LEARNING_LEARNING: def(
    'ads:learning-status:learning',
    'LEARN_LEARNING',
    'Learning phase',
  ),
  LEARNING_ACTIVE: def(
    'ads:learning-status:active',
    'LEARN_ACTIVE',
    'Learning complete',
  ),
  LEARNING_LIMITED: def(
    'ads:learning-status:limited',
    'LEARN_LIMITED',
    'Learning limited',
  ),

  // --- Ads: conversiones ---
  DATASET_ACTIVE: def(
    'ads:dataset-status:active',
    'DATASET_ACTIVE',
    'Dataset active',
  ),
  ACTION_SOURCE_WEBSITE: def(
    'ads:action-source:website',
    'SRC_WEBSITE',
    'Website',
  ),
  ACTION_SOURCE_APP: def('ads:action-source:app', 'SRC_APP', 'App'),
  ACTION_SOURCE_SERVER: def('ads:action-source:server', 'SRC_SERVER', 'Server'),
  ACTION_SOURCE_OFFLINE: def(
    'ads:action-source:offline',
    'SRC_OFFLINE',
    'Offline',
  ),
  EVENT_ACCEPTED: def(
    'ads:event-status:accepted',
    'EVENT_ACCEPTED',
    'Event accepted',
  ),
  EVENT_BLOCKED: def(
    'ads:event-status:blocked',
    'EVENT_BLOCKED',
    'Event blocked',
  ),
  BLOCKED_BY_POLICY: def(
    'ads:blocked-reason:policy',
    'BLOCKED_POLICY',
    'Blocked by data policy',
  ),
  DEDUP_UNIQUE: def(
    'ads:dedup-resolution:unique',
    'DEDUP_UNIQUE',
    'Unique event',
  ),
  DEDUP_DUPLICATE: def(
    'ads:dedup-resolution:duplicate',
    'DEDUP_DUPLICATE',
    'Duplicate event',
  ),
  DELIVERY_QUEUED: def(
    'ads:delivery-result:queued',
    'DELIVERY_QUEUED',
    'Delivery queued',
  ),
  DELIVERY_SUCCEEDED: def(
    'ads:delivery-result:succeeded',
    'DELIVERY_OK',
    'Delivery succeeded',
  ),
  DELIVERY_RETRYABLE: def(
    'ads:delivery-result:retryable',
    'DELIVERY_RETRY',
    'Retryable failure',
  ),
  UPLOAD_SOURCE_FILE: def(
    'ads:upload-source:file',
    'UPLOAD_FILE',
    'File upload',
  ),
  UPLOAD_SOURCE_API: def('ads:upload-source:api', 'UPLOAD_API', 'API upload'),
  OFFLINE_SET_PROCESSING: def(
    'ads:offline-set-status:processing',
    'OFFSET_PROCESSING',
    'Processing',
  ),
  OFFLINE_SET_COMPLETED: def(
    'ads:offline-set-status:completed',
    'OFFSET_COMPLETED',
    'Completed',
  ),

  // --- Ads: experimentos y reglas ---
  EXPERIMENT_AB_SPLIT: def(
    'ads:experiment-type:ab-split',
    'EXP_AB',
    'A/B split',
  ),
  EXPERIMENT_CBO: def(
    'ads:experiment-type:cbo',
    'EXP_CBO',
    'Campaign budget optimization',
  ),
  METRIC_CPA: def(
    'ads:objective-metric:cpa',
    'METRIC_CPA',
    'Cost per acquisition',
  ),
  METRIC_ROAS: def(
    'ads:objective-metric:roas',
    'METRIC_ROAS',
    'Return on ad spend',
  ),
  METRIC_CTR: def(
    'ads:objective-metric:ctr',
    'METRIC_CTR',
    'Click-through rate',
  ),
  EXPERIMENT_SCHEDULED: def(
    'ads:experiment-status:scheduled',
    'EXP_SCHEDULED',
    'Experiment scheduled',
  ),
  EXPERIMENT_RUNNING: def(
    'ads:experiment-status:running',
    'EXP_RUNNING',
    'Experiment running',
  ),
  EXPERIMENT_COMPLETED: def(
    'ads:experiment-status:completed',
    'EXP_COMPLETED',
    'Experiment completed',
  ),
  RULE_SCOPE_CAMPAIGN: def(
    'ads:rule-scope:campaign',
    'RULE_SCOPE_CAMPAIGN',
    'Campaign scope',
  ),
  RULE_SCOPE_ADSET: def(
    'ads:rule-scope:ad-set',
    'RULE_SCOPE_ADSET',
    'Ad set scope',
  ),
  RULE_SCOPE_AD: def('ads:rule-scope:ad', 'RULE_SCOPE_AD', 'Ad scope'),
  RULE_ACTION_PAUSE: def('ads:rule-action:pause', 'RULE_PAUSE', 'Pause entity'),
  RULE_ACTION_ACTIVATE: def(
    'ads:rule-action:activate',
    'RULE_ACTIVATE',
    'Activate entity',
  ),
  RULE_ACTION_ADJUST_BUDGET: def(
    'ads:rule-action:adjust-budget',
    'RULE_BUDGET',
    'Adjust budget',
  ),
  RULE_ACTION_ADJUST_BID: def(
    'ads:rule-action:adjust-bid',
    'RULE_BID',
    'Adjust bid',
  ),
  RULE_SCHEDULE_CONTINUOUS: def(
    'ads:rule-schedule:continuous',
    'RULE_CONTINUOUS',
    'Continuous',
  ),
  RULE_SCHEDULE_DAILY: def('ads:rule-schedule:daily', 'RULE_DAILY', 'Daily'),
  RULE_RUN_SUCCEEDED: def(
    'ads:rule-run-status:succeeded',
    'RULE_RUN_OK',
    'Rule run succeeded',
  ),
  RULE_RUN_FAILED: def(
    'ads:rule-run-status:failed',
    'RULE_RUN_FAILED',
    'Rule run failed',
  ),
  BUDGET_TYPE_DAILY: def(
    'ads:budget-type:daily',
    'BUDGET_DAILY',
    'Daily budget',
  ),
  BUDGET_TYPE_LIFETIME: def(
    'ads:budget-type:lifetime',
    'BUDGET_LIFETIME',
    'Lifetime budget',
  ),
  BUDGET_SCHEDULE_ACTIVE: def(
    'ads:budget-schedule-status:active',
    'BUDGET_SCH_ACTIVE',
    'Schedule active',
  ),

  // --- Ads: moderación ---
  REVIEW_EVENT_INITIAL: def(
    'ads:review-event:initial',
    'REVIEW_INITIAL',
    'Initial review',
  ),
  REVIEW_EVENT_RE_REVIEW: def(
    'ads:review-event:re-review',
    'REVIEW_RE',
    'Re-review',
  ),
  REVIEW_EVENT_APPEAL_DECISION: def(
    'ads:review-event:appeal-decision',
    'REVIEW_APPEAL',
    'Appeal decision',
  ),
  REVIEW_PENDING: def(
    'ads:review-status:pending',
    'REVIEW_PENDING',
    'Review pending',
  ),
  REVIEW_APPROVED: def(
    'ads:review-status:approved',
    'REVIEW_APPROVED',
    'Approved',
  ),
  REVIEW_DISAPPROVED: def(
    'ads:review-status:disapproved',
    'REVIEW_DISAPPROVED',
    'Disapproved',
  ),
  POLICY_CATEGORY_HEALTH: def(
    'ads:policy-category:health',
    'POLICY_HEALTH',
    'Health policy',
  ),
  POLICY_CATEGORY_MISLEADING: def(
    'ads:policy-category:misleading',
    'POLICY_MISLEADING',
    'Misleading claims',
  ),
  POLICY_CATEGORY_PROHIBITED: def(
    'ads:policy-category:prohibited',
    'POLICY_PROHIBITED',
    'Prohibited content',
  ),
  SEVERITY_LOW: def('ads:severity:low', 'SEV_LOW', 'Low severity'),
  SEVERITY_MEDIUM: def('ads:severity:medium', 'SEV_MEDIUM', 'Medium severity'),
  SEVERITY_HIGH: def('ads:severity:high', 'SEV_HIGH', 'High severity'),
  VIOLATION_OPEN: def(
    'ads:violation-status:open',
    'VIOLATION_OPEN',
    'Violation open',
  ),
  VIOLATION_RESOLVED: def(
    'ads:violation-status:resolved',
    'VIOLATION_RESOLVED',
    'Violation resolved',
  ),
  APPEAL_SUBMITTED: def(
    'ads:appeal-status:submitted',
    'APPEAL_SUBMITTED',
    'Appeal submitted',
  ),
  APPEAL_APPROVED: def(
    'ads:appeal-status:approved',
    'APPEAL_APPROVED',
    'Appeal approved',
  ),
  APPEAL_REJECTED: def(
    'ads:appeal-status:rejected',
    'APPEAL_REJECTED',
    'Appeal rejected',
  ),

  // --- Ads: catálogo de productos ---
  CATALOG_VERTICAL_COMMERCE: def(
    'ads:catalog-vertical:commerce',
    'VERTICAL_COMMERCE',
    'Commerce',
  ),
  CATALOG_VERTICAL_HEALTHCARE: def(
    'ads:catalog-vertical:healthcare',
    'VERTICAL_HEALTH',
    'Healthcare',
  ),
  FEED_SOURCE_URL: def('ads:feed-source:url', 'FEED_URL', 'Feed URL'),
  FEED_SOURCE_FILE: def('ads:feed-source:file', 'FEED_FILE', 'Feed file'),
  FEED_RUN_SUCCEEDED: def(
    'ads:feed-run-status:succeeded',
    'FEED_OK',
    'Feed run succeeded',
  ),
  FEED_RUN_FAILED: def(
    'ads:feed-run-status:failed',
    'FEED_FAILED',
    'Feed run failed',
  ),
  PRODUCT_IN_STOCK: def(
    'ads:availability:in-stock',
    'PROD_IN_STOCK',
    'In stock',
  ),
  PRODUCT_OUT_OF_STOCK: def(
    'ads:availability:out-of-stock',
    'PROD_OUT_STOCK',
    'Out of stock',
  ),
  PRODUCT_CONDITION_NEW: def('ads:condition:new', 'PROD_NEW', 'New'),
  PRODUCT_CONDITION_REFURBISHED: def(
    'ads:condition:refurbished',
    'PROD_REFURB',
    'Refurbished',
  ),
  PRODUCT_ACTIVE: def(
    'ads:product-status:active',
    'PROD_ACTIVE',
    'Product active',
  ),
  PRODUCT_ARCHIVED: def(
    'ads:product-status:archived',
    'PROD_ARCHIVED',
    'Product archived',
  ),

  // --- Ads: facturación y leads ---
  AD_INVOICE_ISSUED: def(
    'ads:invoice-status:issued',
    'INVOICE_ISSUED',
    'Invoice issued',
  ),
  AD_INVOICE_PAID: def(
    'ads:invoice-status:paid',
    'INVOICE_PAID',
    'Invoice paid',
  ),
  LEAD_FORM_MORE_VOLUME: def(
    'ads:lead-form-type:more-volume',
    'FORM_VOLUME',
    'More volume',
  ),
  LEAD_FORM_HIGHER_INTENT: def(
    'ads:lead-form-type:higher-intent',
    'FORM_INTENT',
    'Higher intent',
  ),
  QUESTION_SHORT_TEXT: def(
    'ads:question-type:short-text',
    'Q_TEXT',
    'Short text',
  ),
  QUESTION_EMAIL: def('ads:question-type:email', 'Q_EMAIL', 'Email'),
  QUESTION_PHONE: def('ads:question-type:phone', 'Q_PHONE', 'Phone'),
  QUESTION_MULTIPLE_CHOICE: def(
    'ads:question-type:multiple-choice',
    'Q_CHOICE',
    'Multiple choice',
  ),
  LEAD_RECEIVED: def(
    'ads:lead-status:received',
    'LEAD_RECEIVED',
    'Lead received',
  ),
  LEAD_DELIVERED: def(
    'ads:lead-status:delivered',
    'LEAD_DELIVERED',
    'Lead delivered',
  ),
  LEAD_FAILED: def(
    'ads:lead-status:failed',
    'LEAD_FAILED',
    'Lead delivery failed',
  ),
  LEAD_DESTINATION_CRM: def('ads:lead-destination:crm', 'LEAD_DEST_CRM', 'CRM'),

  // --- Educación: cursos y contenido (47) ---
  COURSE_TYPE_SELF_PACED: def(
    'education:course-type:self-paced',
    'COURSE_SELF',
    'Self-paced course',
  ),
  COURSE_TYPE_INSTRUCTOR_LED: def(
    'education:course-type:instructor-led',
    'COURSE_LED',
    'Instructor-led course',
  ),
  COURSE_LEVEL_BASIC: def(
    'education:course-level:basic',
    'LEVEL_BASIC',
    'Basic level',
  ),
  COURSE_LEVEL_INTERMEDIATE: def(
    'education:course-level:intermediate',
    'LEVEL_INTERMEDIATE',
    'Intermediate level',
  ),
  COURSE_LEVEL_ADVANCED: def(
    'education:course-level:advanced',
    'LEVEL_ADVANCED',
    'Advanced level',
  ),
  COURSE_DRAFT: def(
    'education:course-status:draft',
    'COURSE_DRAFT',
    'Course draft',
  ),
  COURSE_PUBLISHED: def(
    'education:course-status:published',
    'COURSE_PUBLISHED',
    'Course published',
  ),
  COURSE_ARCHIVED: def(
    'education:course-status:archived',
    'COURSE_ARCHIVED',
    'Course archived',
  ),
  LESSON_VIDEO: def(
    'education:content-type:video',
    'LESSON_VIDEO',
    'Video lesson',
  ),
  LESSON_ARTICLE: def(
    'education:content-type:article',
    'LESSON_ARTICLE',
    'Article lesson',
  ),
  LESSON_PDF: def('education:content-type:pdf', 'LESSON_PDF', 'PDF lesson'),
  LESSON_SCORM: def(
    'education:content-type:scorm',
    'LESSON_SCORM',
    'SCORM lesson',
  ),
  LESSON_QUIZ: def('education:content-type:quiz', 'LESSON_QUIZ', 'Quiz lesson'),
  LESSON_LIVE_SESSION: def(
    'education:content-type:live-session',
    'LESSON_LIVE',
    'Live session',
  ),

  // --- Educación: instructores y cohortes ---
  INSTRUCTOR_LEAD: def(
    'education:instructor-role:lead',
    'INSTRUCTOR_LEAD',
    'Lead instructor',
  ),
  INSTRUCTOR_CO: def(
    'education:instructor-role:co',
    'INSTRUCTOR_CO',
    'Co-instructor',
  ),
  INSTRUCTOR_GUEST: def(
    'education:instructor-role:guest',
    'INSTRUCTOR_GUEST',
    'Guest instructor',
  ),
  INSTRUCTOR_ASSISTANT: def(
    'education:instructor-role:assistant',
    'INSTRUCTOR_ASSISTANT',
    'Assistant',
  ),
  DELIVERY_ONLINE: def(
    'education:delivery-mode:online',
    'DELIVERY_ONLINE',
    'Online delivery',
  ),
  DELIVERY_IN_PERSON: def(
    'education:delivery-mode:in-person',
    'DELIVERY_PRESENCIAL',
    'In-person delivery',
  ),
  DELIVERY_HYBRID: def(
    'education:delivery-mode:hybrid',
    'DELIVERY_HYBRID',
    'Hybrid delivery',
  ),
  COHORT_OPEN: def(
    'education:cohort-status:open',
    'COHORT_OPEN',
    'Cohort open',
  ),
  COHORT_CLOSED: def(
    'education:cohort-status:closed',
    'COHORT_CLOSED',
    'Cohort closed',
  ),

  // --- Educación: inscripción y progreso ---
  LEARNER_PRACTITIONER: def(
    'education:learner-type:practitioner',
    'LEARNER_PRACTITIONER',
    'Practitioner learner',
  ),
  LEARNER_STAFF: def(
    'education:learner-type:staff',
    'LEARNER_STAFF',
    'Staff learner',
  ),
  LEARNER_PATIENT: def(
    'education:learner-type:patient',
    'LEARNER_PATIENT',
    'Patient learner',
  ),
  LEARNER_USER: def(
    'education:learner-type:user',
    'LEARNER_USER',
    'User learner',
  ),
  ENROLL_SOURCE_SELF: def(
    'education:enrollment-source:self',
    'ENROLL_SELF',
    'Self enrollment',
  ),
  ENROLL_SOURCE_ASSIGNED: def(
    'education:enrollment-source:assigned',
    'ENROLL_ASSIGNED',
    'Assigned enrollment',
  ),
  ENROLL_SOURCE_PURCHASED: def(
    'education:enrollment-source:purchased',
    'ENROLL_PURCHASED',
    'Purchased enrollment',
  ),
  ENROLL_SOURCE_PARTNER: def(
    'education:enrollment-source:partner',
    'ENROLL_PARTNER',
    'Partner enrollment',
  ),
  ENROLLMENT_STATE_ACTIVE: def(
    'education:enrollment-status:active',
    'ENROLLMENT_ACTIVE_EDU',
    'Enrollment active',
  ),
  ENROLLMENT_STATE_COMPLETED: def(
    'education:enrollment-status:completed',
    'ENROLLMENT_DONE_EDU',
    'Enrollment completed',
  ),
  ENROLLMENT_STATE_CANCELLED: def(
    'education:enrollment-status:cancelled',
    'ENROLLMENT_CANCELLED_EDU',
    'Enrollment cancelled',
  ),
  LESSON_NOT_STARTED: def(
    'education:lesson-progress:not-started',
    'LESSON_PENDING',
    'Lesson not started',
  ),
  LESSON_IN_PROGRESS: def(
    'education:lesson-progress:in-progress',
    'LESSON_IN_PROGRESS',
    'Lesson in progress',
  ),
  LESSON_COMPLETED: def(
    'education:lesson-progress:completed',
    'LESSON_COMPLETED',
    'Lesson completed',
  ),

  // --- Educación: evaluaciones ---
  ASSESSMENT_QUIZ: def('education:assessment-type:quiz', 'ASSESS_QUIZ', 'Quiz'),
  ASSESSMENT_EXAM: def('education:assessment-type:exam', 'ASSESS_EXAM', 'Exam'),
  ASSESSMENT_SURVEY: def(
    'education:assessment-type:survey',
    'ASSESS_SURVEY',
    'Survey',
  ),
  QUESTION_SINGLE_CHOICE: def(
    'education:question-type:single-choice',
    'Q_SINGLE',
    'Single choice',
  ),
  QUESTION_MULTI_CHOICE: def(
    'education:question-type:multiple-choice',
    'Q_MULTI',
    'Multiple choice',
  ),
  QUESTION_TRUE_FALSE: def(
    'education:question-type:true-false',
    'Q_TRUE_FALSE',
    'True/false',
  ),
  QUESTION_SHORT_ANSWER: def(
    'education:question-type:short-answer',
    'Q_SHORT',
    'Short answer',
  ),
  QUESTION_MATCHING: def(
    'education:question-type:matching',
    'Q_MATCHING',
    'Matching',
  ),
  ATTEMPT_IN_PROGRESS: def(
    'education:attempt-status:in-progress',
    'ATTEMPT_OPEN',
    'Attempt in progress',
  ),
  ATTEMPT_GRADED: def(
    'education:attempt-status:graded',
    'ATTEMPT_GRADED',
    'Attempt graded',
  ),

  // --- Educación: certificados, CME y reseñas ---
  CERTIFICATE_ISSUED: def(
    'education:certificate-status:issued',
    'CERT_ISSUED',
    'Certificate issued',
  ),
  CERTIFICATE_REVOKED: def(
    'education:certificate-status:revoked',
    'CERT_REVOKED',
    'Certificate revoked',
  ),
  CME_AWARDED: def(
    'education:cme-status:awarded',
    'CME_AWARDED',
    'CME awarded',
  ),
  CME_REVERSED: def(
    'education:cme-status:reversed',
    'CME_REVERSED',
    'CME reversed',
  ),
  REVIEW_PUBLISHED: def(
    'education:review-status:published',
    'REVIEW_PUBLISHED',
    'Review published',
  ),

  // --- Reportes: fuentes y definiciones (39) ---
  SOURCE_READ_MODEL: def(
    'reporting:source-type:read-model',
    'SRC_READ_MODEL',
    'Read model source',
  ),
  SOURCE_VIEW: def(
    'reporting:source-type:view',
    'SRC_VIEW',
    'Database view source',
  ),
  REPORT_DRAFT: def(
    'reporting:definition-state:draft',
    'REPORT_DRAFT',
    'Report draft',
  ),
  REPORT_STATE_ACTIVE: def(
    'reporting:definition-state:active',
    'REPORT_ACTIVE',
    'Report active',
  ),
  REPORT_DEPRECATED: def(
    'reporting:definition-state:deprecated',
    'REPORT_DEPRECATED',
    'Report deprecated',
  ),
  REPORT_CATEGORY_CLINICAL: def(
    'reporting:category:clinical',
    'CAT_CLINICAL',
    'Clinical report',
  ),
  REPORT_CATEGORY_FINANCIAL: def(
    'reporting:category:financial',
    'CAT_FINANCIAL',
    'Financial report',
  ),
  REPORT_CATEGORY_OPERATIONAL: def(
    'reporting:category:operational',
    'CAT_OPERATIONAL',
    'Operational report',
  ),
  REPORT_VERSION_PUBLISHED: def(
    'reporting:version-status:published',
    'VERSION_PUBLISHED',
    'Version published',
  ),
  AGGREGATION_SUM: def('reporting:aggregation:sum', 'AGG_SUM', 'Sum'),
  AGGREGATION_AVG: def('reporting:aggregation:avg', 'AGG_AVG', 'Average'),
  AGGREGATION_COUNT: def('reporting:aggregation:count', 'AGG_COUNT', 'Count'),
  AGGREGATION_MIN: def('reporting:aggregation:min', 'AGG_MIN', 'Minimum'),
  AGGREGATION_MAX: def('reporting:aggregation:max', 'AGG_MAX', 'Maximum'),

  // --- Reportes: ejecución y salida ---
  OUTPUT_CSV: def('reporting:output-format:csv', 'OUT_CSV', 'CSV output'),
  OUTPUT_XLSX: def('reporting:output-format:xlsx', 'OUT_XLSX', 'XLSX output'),
  OUTPUT_PDF: def('reporting:output-format:pdf', 'OUT_PDF', 'PDF output'),
  OUTPUT_JSON: def('reporting:output-format:json', 'OUT_JSON', 'JSON output'),
  TRIGGER_ON_DEMAND: def(
    'reporting:trigger:on-demand',
    'TRIGGER_MANUAL',
    'On-demand run',
  ),
  TRIGGER_SCHEDULED: def(
    'reporting:trigger:scheduled',
    'TRIGGER_SCHEDULED',
    'Scheduled run',
  ),
  TRIGGER_RETRY: def('reporting:trigger:retry', 'TRIGGER_RETRY', 'Retry run'),
  EXECUTION_QUEUED: def(
    'reporting:execution-status:queued',
    'EXEC_QUEUED',
    'Execution queued',
  ),
  EXECUTION_RUNNING: def(
    'reporting:execution-status:running',
    'EXEC_RUNNING',
    'Execution running',
  ),
  EXECUTION_SUCCEEDED: def(
    'reporting:execution-status:succeeded',
    'EXEC_SUCCEEDED',
    'Execution succeeded',
  ),
  EXECUTION_FAILED: def(
    'reporting:execution-status:failed',
    'EXEC_FAILED',
    'Execution failed',
  ),

  // --- Reportes: distribución y tablero ---
  SCHEDULE_STATE_ACTIVE: def(
    'reporting:schedule-state:active',
    'SCHEDULE_ACTIVE',
    'Schedule active',
  ),
  SCHEDULE_SUSPENDED: def(
    'reporting:schedule-state:suspended',
    'SCHEDULE_SUSPENDED',
    'Schedule suspended',
  ),
  RECIPIENT_USER: def(
    'reporting:recipient-type:user',
    'RECIPIENT_USER',
    'User recipient',
  ),
  RECIPIENT_ADDRESS: def(
    'reporting:recipient-type:address',
    'RECIPIENT_ADDRESS',
    'External address',
  ),
  DISTRIBUTION_PENDING: def(
    'reporting:distribution-status:pending',
    'DIST_PENDING',
    'Distribution pending',
  ),
  DISTRIBUTION_SENT: def(
    'reporting:distribution-status:sent',
    'DIST_SENT',
    'Distribution sent',
  ),
  WIDGET_CHART: def(
    'reporting:widget-type:chart',
    'WIDGET_CHART',
    'Chart widget',
  ),
  WIDGET_TABLE: def(
    'reporting:widget-type:table',
    'WIDGET_TABLE',
    'Table widget',
  ),
  WIDGET_METRIC: def(
    'reporting:widget-type:metric',
    'WIDGET_METRIC',
    'Metric widget',
  ),
  VISUALIZATION_BAR: def('reporting:visualization:bar', 'VIS_BAR', 'Bar chart'),
  VISUALIZATION_LINE: def(
    'reporting:visualization:line',
    'VIS_LINE',
    'Line chart',
  ),
  VISUALIZATION_PIE: def('reporting:visualization:pie', 'VIS_PIE', 'Pie chart'),

  // --- QA: entornos, suites y casos (36) ---
  QA_ENV_DEV: def('qa:environment:dev', 'ENV_DEV', 'Development environment'),
  QA_ENV_STAGING: def(
    'qa:environment:staging',
    'ENV_STAGING',
    'Staging environment',
  ),
  QA_ENV_PRODUCTION: def(
    'qa:environment:production',
    'ENV_PRODUCTION',
    'Production environment',
  ),
  SUITE_TYPE_SMOKE: def('qa:suite-type:smoke', 'SUITE_SMOKE', 'Smoke suite'),
  SUITE_TYPE_REGRESSION: def(
    'qa:suite-type:regression',
    'SUITE_REGRESSION',
    'Regression suite',
  ),
  SUITE_TYPE_CONTRACT: def(
    'qa:suite-type:contract',
    'SUITE_CONTRACT',
    'Contract suite',
  ),
  SUITE_DRAFT: def('qa:suite-state:draft', 'SUITE_DRAFT', 'Suite draft'),
  SUITE_ACTIVE: def('qa:suite-state:active', 'SUITE_ACTIVE', 'Suite active'),
  CASE_TYPE_HAPPY_PATH: def(
    'qa:case-type:happy-path',
    'CASE_HAPPY',
    'Happy path case',
  ),
  CASE_TYPE_EDGE: def('qa:case-type:edge', 'CASE_EDGE', 'Edge case'),
  CASE_TYPE_NEGATIVE: def(
    'qa:case-type:negative',
    'CASE_NEGATIVE',
    'Negative case',
  ),
  CASE_DRAFT: def('qa:case-state:draft', 'CASE_DRAFT', 'Case draft'),
  CASE_ACTIVE: def('qa:case-state:active', 'CASE_ACTIVE', 'Case active'),
  HTTP_GET: def('qa:http-method:get', 'HTTP_GET', 'GET'),
  HTTP_POST: def('qa:http-method:post', 'HTTP_POST', 'POST'),
  HTTP_PUT: def('qa:http-method:put', 'HTTP_PUT', 'PUT'),
  HTTP_PATCH: def('qa:http-method:patch', 'HTTP_PATCH', 'PATCH'),
  HTTP_DELETE: def('qa:http-method:delete', 'HTTP_DELETE', 'DELETE'),

  // --- QA: aserciones ---
  ASSERTION_STATUS_CODE: def(
    'qa:assertion-type:status-code',
    'ASSERT_STATUS',
    'Status code',
  ),
  ASSERTION_JSON_PATH: def(
    'qa:assertion-type:json-path',
    'ASSERT_JSON',
    'JSON path',
  ),
  ASSERTION_HEADER: def('qa:assertion-type:header', 'ASSERT_HEADER', 'Header'),
  ASSERTION_LATENCY: def(
    'qa:assertion-type:latency',
    'ASSERT_LATENCY',
    'Latency',
  ),
  OPERATOR_EQUALS: def('qa:operator:equals', 'OP_EQ', 'Equals'),
  OPERATOR_NOT_EQUALS: def('qa:operator:not-equals', 'OP_NEQ', 'Not equals'),
  OPERATOR_CONTAINS: def('qa:operator:contains', 'OP_CONTAINS', 'Contains'),
  OPERATOR_EXISTS: def('qa:operator:exists', 'OP_EXISTS', 'Exists'),
  OPERATOR_LESS_THAN: def('qa:operator:less-than', 'OP_LT', 'Less than'),
  OPERATOR_GREATER_THAN: def(
    'qa:operator:greater-than',
    'OP_GT',
    'Greater than',
  ),

  // --- QA: corridas y resultados ---
  QA_TRIGGER_MANUAL: def('qa:trigger:manual', 'QA_MANUAL', 'Manual trigger'),
  QA_TRIGGER_SCHEDULED: def(
    'qa:trigger:scheduled',
    'QA_SCHEDULED',
    'Scheduled trigger',
  ),
  QA_TRIGGER_CI_PUSH: def(
    'qa:trigger:ci-push',
    'QA_CI_PUSH',
    'CI push trigger',
  ),
  QA_TRIGGER_CI_PR: def(
    'qa:trigger:ci-pr',
    'QA_CI_PR',
    'CI pull request trigger',
  ),
  QA_TRIGGER_WEBHOOK: def(
    'qa:trigger:webhook',
    'QA_WEBHOOK',
    'Webhook trigger',
  ),
  RUN_QUEUED: def('qa:run-status:queued', 'RUN_QUEUED', 'Run queued'),
  RUN_STATUS_RUNNING: def(
    'qa:run-status:running',
    'RUN_IN_PROGRESS',
    'Run running',
  ),
  RUN_PASSED: def('qa:run-status:passed', 'RUN_PASSED', 'Run passed'),
  RUN_FAILED_STATUS: def(
    'qa:run-status:failed',
    'RUN_FAILED_STATUS',
    'Run failed',
  ),
  CASE_RESULT_PASSED: def(
    'qa:case-result:passed',
    'RESULT_PASSED',
    'Case passed',
  ),
  CASE_RESULT_FAILED: def(
    'qa:case-result:failed',
    'RESULT_FAILED',
    'Case failed',
  ),
  CASE_RESULT_SKIPPED: def(
    'qa:case-result:skipped',
    'RESULT_SKIPPED',
    'Case skipped',
  ),
  ERROR_ASSERTION: def(
    'qa:error-type:assertion',
    'ERR_ASSERTION',
    'Assertion failure',
  ),
  ERROR_TIMEOUT: def('qa:error-type:timeout', 'ERR_TIMEOUT', 'Timeout'),
  ERROR_TRANSPORT: def(
    'qa:error-type:transport',
    'ERR_TRANSPORT',
    'Transport error',
  ),
  PAYLOAD_REQUEST: def(
    'qa:payload-direction:request',
    'PAYLOAD_REQ',
    'Request payload',
  ),
  PAYLOAD_RESPONSE: def(
    'qa:payload-direction:response',
    'PAYLOAD_RES',
    'Response payload',
  ),

  // --- QA: artefactos, defectos y programación ---
  ARTIFACT_LOG: def('qa:artifact-type:log', 'ART_LOG', 'Log artifact'),
  ARTIFACT_HAR: def('qa:artifact-type:har', 'ART_HAR', 'HAR artifact'),
  ARTIFACT_SCREENSHOT: def(
    'qa:artifact-type:screenshot',
    'ART_SCREENSHOT',
    'Screenshot',
  ),
  ARTIFACT_JUNIT: def('qa:artifact-type:junit', 'ART_JUNIT', 'JUnit report'),
  DEFECT_TYPE_BUG: def('qa:defect-type:bug', 'DEFECT_BUG', 'Bug'),
  DEFECT_TYPE_REGRESSION: def(
    'qa:defect-type:regression',
    'DEFECT_REGRESSION',
    'Regression',
  ),
  DEFECT_TYPE_FLAKY: def('qa:defect-type:flaky', 'DEFECT_FLAKY', 'Flaky test'),
  DEFECT_SEVERITY_LOW: def(
    'qa:defect-severity:low',
    'DEF_SEV_LOW',
    'Low severity defect',
  ),
  DEFECT_SEVERITY_MEDIUM: def(
    'qa:defect-severity:medium',
    'DEF_SEV_MEDIUM',
    'Medium severity defect',
  ),
  DEFECT_SEVERITY_HIGH: def(
    'qa:defect-severity:high',
    'DEF_SEV_HIGH',
    'High severity defect',
  ),
  DEFECT_SEVERITY_CRITICAL: def(
    'qa:defect-severity:critical',
    'DEF_SEV_CRITICAL',
    'Critical defect',
  ),
  DEFECT_OPEN: def('qa:defect-status:open', 'DEFECT_OPEN', 'Defect open'),
  DEFECT_TRIAGED: def(
    'qa:defect-status:triaged',
    'DEFECT_TRIAGED',
    'Defect triaged',
  ),
  DEFECT_IN_PROGRESS: def(
    'qa:defect-status:in-progress',
    'DEFECT_IN_PROGRESS',
    'Defect in progress',
  ),
  DEFECT_RESOLVED: def(
    'qa:defect-status:resolved',
    'DEFECT_RESOLVED',
    'Defect resolved',
  ),
  DEFECT_CLOSED: def(
    'qa:defect-status:closed',
    'DEFECT_CLOSED',
    'Defect closed',
  ),
  DEFECT_REJECTED: def(
    'qa:defect-status:rejected',
    'DEFECT_REJECTED',
    'Defect rejected',
  ),
  CONCURRENCY_ALLOW: def(
    'qa:concurrency-policy:allow',
    'CONC_ALLOW',
    'Allow concurrent runs',
  ),
  CONCURRENCY_FORBID: def(
    'qa:concurrency-policy:forbid',
    'CONC_FORBID',
    'Forbid concurrent runs',
  ),
  CONCURRENCY_QUEUE: def(
    'qa:concurrency-policy:queue',
    'CONC_QUEUE',
    'Queue concurrent runs',
  ),

  // --- Perioperatorio: caso quirúrgico (53) ---
  CASE_TYPE_ELECTIVE: def(
    'periop:case-type:elective',
    'CASE_ELECTIVE',
    'Elective case',
  ),
  CASE_TYPE_URGENT: def(
    'periop:case-type:urgent',
    'CASE_URGENT',
    'Urgent case',
  ),
  CASE_TYPE_EMERGENCY: def(
    'periop:case-type:emergency',
    'CASE_EMERGENCY',
    'Emergency case',
  ),
  CASE_PRIORITY_ROUTINE: def(
    'periop:priority:routine',
    'PRIORITY_ROUTINE',
    'Routine priority',
  ),
  CASE_PRIORITY_URGENT: def(
    'periop:priority:urgent',
    'PRIORITY_URGENT',
    'Urgent priority',
  ),
  CASE_PRIORITY_STAT: def(
    'periop:priority:stat',
    'PRIORITY_STAT',
    'Immediate priority',
  ),
  CASE_SCHEDULED: def(
    'periop:case-status:scheduled',
    'CASE_SCHEDULED',
    'Case scheduled',
  ),
  CASE_READY_FOR_SURGERY: def(
    'periop:case-status:ready',
    'CASE_READY',
    'Ready for surgery',
  ),
  // Nombre propio: CASE_IN_PROGRESS ya lo usa el caso de CRM (432).
  SURGICAL_CASE_IN_PROGRESS: def(
    'periop:case-status:in-progress',
    'SURG_CASE_IN_PROGRESS',
    'Surgical case in progress',
  ),
  CASE_COMPLETED: def(
    'periop:case-status:completed',
    'CASE_COMPLETED',
    'Case completed',
  ),
  CASE_CANCELLED: def(
    'periop:case-status:cancelled',
    'CASE_CANCELLED',
    'Case cancelled',
  ),

  // --- Perioperatorio: hitos y quirófano ---
  MILESTONE_SCHEDULED: def(
    'periop:milestone:scheduled',
    'MS_SCHEDULED',
    'Scheduled milestone',
  ),
  MILESTONE_PREOP_CLEARED: def(
    'periop:milestone:preop-cleared',
    'MS_PREOP_CLEARED',
    'Preop cleared',
  ),
  MILESTONE_TIME_OUT: def(
    'periop:milestone:time-out',
    'MS_TIME_OUT',
    'Time-out completed',
  ),
  MILESTONE_ANESTHESIA_START: def(
    'periop:milestone:anesthesia-start',
    'MS_ANESTHESIA_START',
    'Anesthesia start',
  ),
  MILESTONE_EMERGENCE: def(
    'periop:milestone:emergence',
    'MS_EMERGENCE',
    'Emergence',
  ),
  MILESTONE_CASE_END: def(
    'periop:milestone:case-end',
    'MS_CASE_END',
    'Case end',
  ),
  MILESTONE_PLANNED: def(
    'periop:milestone-status:planned',
    'MS_PLANNED',
    'Milestone planned',
  ),
  MILESTONE_READY: def(
    'periop:milestone-status:ready',
    'MS_READY',
    'Milestone ready',
  ),
  MILESTONE_REACHED: def(
    'periop:milestone-status:reached',
    'MS_REACHED',
    'Milestone reached',
  ),
  OR_EVENT_RESERVED: def(
    'periop:or-event:reserved',
    'OR_RESERVED',
    'Operating room reserved',
  ),
  OR_EVENT_CASE_START: def(
    'periop:or-event:case-start',
    'OR_CASE_START',
    'Case start',
  ),
  OR_EVENT_CASE_END: def('periop:or-event:case-end', 'OR_CASE_END', 'Case end'),
  OR_EVENT_TURNOVER: def('periop:or-event:turnover', 'OR_TURNOVER', 'Turnover'),
  OR_EVENT_SLOT_RELEASED: def(
    'periop:or-event:slot-released',
    'OR_SLOT_RELEASED',
    'Slot released',
  ),
  OR_EVENT_CASE_CANCELLED: def(
    'periop:or-event:case-cancelled',
    'OR_CASE_CANCELLED',
    'Case cancelled',
  ),

  // --- Perioperatorio: diagnósticos y equipo ---
  DIAGNOSIS_ROLE_PRIMARY: def(
    'periop:diagnosis-role:primary',
    'DX_PRIMARY',
    'Primary diagnosis',
  ),
  DIAGNOSIS_ROLE_SECONDARY: def(
    'periop:diagnosis-role:secondary',
    'DX_SECONDARY',
    'Secondary diagnosis',
  ),
  DIAGNOSIS_ROLE_POSTOP: def(
    'periop:diagnosis-role:postoperative',
    'DX_POSTOP',
    'Postoperative diagnosis',
  ),
  TEAM_ROLE_SURGEON: def('periop:team-role:surgeon', 'TEAM_SURGEON', 'Surgeon'),
  TEAM_ROLE_ASSISTANT: def(
    'periop:team-role:assistant',
    'TEAM_ASSISTANT',
    'Assistant surgeon',
  ),
  TEAM_ROLE_ANESTHESIOLOGIST: def(
    'periop:team-role:anesthesiologist',
    'TEAM_ANESTHESIOLOGIST',
    'Anesthesiologist',
  ),
  TEAM_ROLE_SCRUB_NURSE: def(
    'periop:team-role:scrub-nurse',
    'TEAM_SCRUB',
    'Scrub nurse',
  ),
  TEAM_ROLE_CIRCULATING_NURSE: def(
    'periop:team-role:circulating-nurse',
    'TEAM_CIRCULATING',
    'Circulating nurse',
  ),
  TEAM_ASSIGNED: def(
    'periop:team-status:assigned',
    'TEAM_ASSIGNED',
    'Team member assigned',
  ),
  TEAM_ACCEPTED: def(
    'periop:team-status:accepted',
    'TEAM_ACCEPTED',
    'Team member accepted',
  ),

  // --- Perioperatorio: valoración preoperatoria ---
  PREOP_ASSESSMENT_ANESTHESIA: def(
    'periop:assessment-type:anesthesia',
    'PREOP_ANESTHESIA',
    'Anesthesia assessment',
  ),
  PREOP_ASSESSMENT_SURGICAL: def(
    'periop:assessment-type:surgical',
    'PREOP_SURGICAL',
    'Surgical assessment',
  ),
  FITNESS_FIT: def('periop:fitness:fit', 'FITNESS_FIT', 'Fit for surgery'),
  FITNESS_FIT_WITH_CAUTION: def(
    'periop:fitness:fit-with-caution',
    'FITNESS_CAUTION',
    'Fit with caution',
  ),
  FITNESS_UNFIT: def(
    'periop:fitness:unfit',
    'FITNESS_UNFIT',
    'Unfit for surgery',
  ),
  ASA_I: def('periop:asa-class:i', 'ASA_I', 'ASA I'),
  ASA_II: def('periop:asa-class:ii', 'ASA_II', 'ASA II'),
  ASA_III: def('periop:asa-class:iii', 'ASA_III', 'ASA III'),
  ASA_IV: def('periop:asa-class:iv', 'ASA_IV', 'ASA IV'),
  ASA_V: def('periop:asa-class:v', 'ASA_V', 'ASA V'),
  MALLAMPATI_I: def('periop:mallampati:i', 'MALLAMPATI_I', 'Mallampati I'),
  MALLAMPATI_II: def('periop:mallampati:ii', 'MALLAMPATI_II', 'Mallampati II'),
  MALLAMPATI_III: def(
    'periop:mallampati:iii',
    'MALLAMPATI_III',
    'Mallampati III',
  ),
  MALLAMPATI_IV: def('periop:mallampati:iv', 'MALLAMPATI_IV', 'Mallampati IV'),
  RISK_MODEL_ASA: def('periop:risk-model:asa', 'RISK_ASA', 'ASA risk model'),
  RISK_MODEL_RCRI: def(
    'periop:risk-model:rcri',
    'RISK_RCRI',
    'Revised cardiac risk index',
  ),
  RISK_MODEL_APFEL: def(
    'periop:risk-model:apfel',
    'RISK_APFEL',
    'Apfel PONV score',
  ),
  RISK_CATEGORY_LOW: def(
    'periop:risk-category:low',
    'PERIOP_RISK_LOW',
    'Low risk',
  ),
  RISK_CATEGORY_MODERATE: def(
    'periop:risk-category:moderate',
    'RISK_MODERATE',
    'Moderate risk',
  ),
  RISK_CATEGORY_HIGH: def(
    'periop:risk-category:high',
    'PERIOP_RISK_HIGH',
    'High risk',
  ),
  ASSESSMENT_COMPLETED: def(
    'periop:assessment-status:completed',
    'ASSESSMENT_COMPLETED',
    'Assessment completed',
  ),

  // --- Perioperatorio: órdenes y checklist ---
  ORDER_ROLE_LAB: def('periop:order-role:lab', 'ORDER_LAB', 'Laboratory order'),
  ORDER_ROLE_IMAGING: def(
    'periop:order-role:imaging',
    'ORDER_IMAGING',
    'Imaging order',
  ),
  ORDER_ROLE_CONSULT: def(
    'periop:order-role:consult',
    'ORDER_CONSULT',
    'Consultation order',
  ),
  ORDER_ROLE_MEDICATION: def(
    'periop:order-role:medication',
    'ORDER_MEDICATION',
    'Medication order',
  ),
  ORDER_PENDING: def(
    'periop:order-status:pending',
    'ORDER_PENDING',
    'Order pending',
  ),
  ORDER_VERIFIED: def(
    'periop:order-status:verified',
    'ORDER_VERIFIED',
    'Order verified',
  ),
  ORDER_WAIVED: def(
    'periop:order-status:waived',
    'ORDER_WAIVED',
    'Order waived',
  ),
  CHECKLIST_WHO: def(
    'periop:checklist-type:who',
    'CHECKLIST_WHO',
    'WHO surgical safety checklist',
  ),
  PHASE_SIGN_IN: def(
    'periop:checklist-phase:sign-in',
    'PHASE_SIGN_IN',
    'Sign-in phase',
  ),
  PHASE_TIME_OUT: def(
    'periop:checklist-phase:time-out',
    'PHASE_TIME_OUT',
    'Time-out phase',
  ),
  PHASE_SIGN_OUT: def(
    'periop:checklist-phase:sign-out',
    'PHASE_SIGN_OUT',
    'Sign-out phase',
  ),
  CHECKLIST_IN_PROGRESS: def(
    'periop:checklist-status:in-progress',
    'CHECKLIST_IN_PROGRESS',
    'Checklist in progress',
  ),
  CHECKLIST_COMPLETED: def(
    'periop:checklist-status:completed',
    'CHECKLIST_COMPLETED',
    'Checklist completed',
  ),
  RESPONSE_CONFIRMED: def(
    'periop:response-status:confirmed',
    'RESPONSE_CONFIRMED',
    'Item confirmed',
  ),
  RESPONSE_NOT_APPLICABLE: def(
    'periop:response-status:not-applicable',
    'RESPONSE_NA',
    'Not applicable',
  ),
  RESPONSE_EXCEPTION: def(
    'periop:response-status:exception',
    'RESPONSE_EXCEPTION',
    'Answered with exception',
  ),

  // --- Perioperatorio: anestesia ---
  ANESTHESIA_GENERAL: def(
    'periop:anesthesia-type:general',
    'ANES_GENERAL',
    'General anesthesia',
  ),
  ANESTHESIA_REGIONAL: def(
    'periop:anesthesia-type:regional',
    'ANES_REGIONAL',
    'Regional anesthesia',
  ),
  ANESTHESIA_LOCAL: def(
    'periop:anesthesia-type:local',
    'ANES_LOCAL',
    'Local anesthesia',
  ),
  ANESTHESIA_SEDATION: def(
    'periop:anesthesia-type:sedation',
    'ANES_SEDATION',
    'Sedation',
  ),
  AIRWAY_PLAN_ETT: def(
    'periop:airway-plan:endotracheal',
    'AIRWAY_ETT',
    'Endotracheal tube',
  ),
  AIRWAY_PLAN_LMA: def(
    'periop:airway-plan:laryngeal-mask',
    'AIRWAY_LMA',
    'Laryngeal mask',
  ),
  AIRWAY_PLAN_MASK: def('periop:airway-plan:mask', 'AIRWAY_MASK', 'Face mask'),
  PLAN_DRAFT: def('periop:plan-status:draft', 'PLAN_DRAFT', 'Plan draft'),
  PLAN_APPROVED: def(
    'periop:plan-status:approved',
    'PLAN_APPROVED',
    'Plan approved',
  ),
  ANES_EVENT_INDUCTION: def(
    'periop:anesthesia-event:induction',
    'ANES_INDUCTION',
    'Induction',
  ),
  ANES_EVENT_INTUBATION: def(
    'periop:anesthesia-event:intubation',
    'ANES_INTUBATION',
    'Intubation',
  ),
  ANES_EVENT_MEDICATION: def(
    'periop:anesthesia-event:medication',
    'ANES_MEDICATION',
    'Medication given',
  ),
  ANES_EVENT_VITALS: def(
    'periop:anesthesia-event:vitals',
    'ANES_VITALS',
    'Vitals recorded',
  ),
  ANES_EVENT_EMERGENCE: def(
    'periop:anesthesia-event:emergence',
    'ANES_EMERGENCE',
    'Emergence',
  ),
  ANES_EVENT_COMPLICATION: def(
    'periop:anesthesia-event:complication',
    'ANES_COMPLICATION',
    'Anesthesia complication',
  ),
  SEVERITY_ROUTINE: def('periop:severity:routine', 'SEV_ROUTINE', 'Routine'),
  SEVERITY_MINOR: def('periop:severity:minor', 'SEV_MINOR', 'Minor'),
  SEVERITY_MAJOR: def('periop:severity:major', 'SEV_MAJOR', 'Major'),
  SEVERITY_CRITICAL: def(
    'periop:severity:critical',
    'SEV_CRITICAL',
    'Critical',
  ),

  // --- Perioperatorio: intervención ---
  STEP_PLANNED: def(
    'periop:step-status:planned',
    'STEP_PLANNED',
    'Step planned',
  ),
  STEP_IN_PROGRESS: def(
    'periop:step-status:in-progress',
    'STEP_IN_PROGRESS',
    'Step in progress',
  ),
  STEP_COMPLETED: def(
    'periop:step-status:completed',
    'STEP_COMPLETED',
    'Step completed',
  ),
  LATERALITY_LEFT: def('periop:laterality:left', 'LAT_LEFT', 'Left'),
  LATERALITY_RIGHT: def('periop:laterality:right', 'LAT_RIGHT', 'Right'),
  LATERALITY_BILATERAL: def(
    'periop:laterality:bilateral',
    'LAT_BILATERAL',
    'Bilateral',
  ),
  BODY_SITE_ROLE_PRIMARY: def(
    'periop:body-site-role:primary',
    'SITE_PRIMARY',
    'Primary site',
  ),
  BODY_SITE_ROLE_SECONDARY: def(
    'periop:body-site-role:secondary',
    'SITE_SECONDARY',
    'Secondary site',
  ),
  IMPLANT_ROLE_PRIMARY: def(
    'periop:implant-role:primary',
    'IMPLANT_PRIMARY',
    'Primary implant',
  ),
  IMPLANT_ROLE_ADJUNCT: def(
    'periop:implant-role:adjunct',
    'IMPLANT_ADJUNCT',
    'Adjunct implant',
  ),
  IMPLANT_IMPLANTED: def(
    'periop:implant-status:implanted',
    'IMPLANT_IMPLANTED',
    'Implanted',
  ),
  IMPLANT_EXPLANTED: def(
    'periop:implant-status:explanted',
    'IMPLANT_EXPLANTED',
    'Explanted',
  ),
  IDENTIFIER_UDI_DI: def(
    'periop:identifier-type:udi-di',
    'ID_UDI_DI',
    'UDI device identifier',
  ),
  IDENTIFIER_UDI_PI: def(
    'periop:identifier-type:udi-pi',
    'ID_UDI_PI',
    'UDI production identifier',
  ),
  IDENTIFIER_SERIAL: def(
    'periop:identifier-type:serial',
    'ID_SERIAL',
    'Serial number',
  ),
  DEVICE_USE_IMPLANT: def(
    'periop:device-use:implant',
    'DEVICE_IMPLANT',
    'Implanted device',
  ),
  DEVICE_USE_INSTRUMENT: def(
    'periop:device-use:instrument',
    'DEVICE_INSTRUMENT',
    'Instrument',
  ),
  MED_USE_ANESTHESIA: def(
    'periop:medication-use:anesthesia',
    'MED_ANESTHESIA',
    'Anesthetic',
  ),
  MED_USE_ANTIBIOTIC: def(
    'periop:medication-use:antibiotic',
    'MED_ANTIBIOTIC',
    'Antibiotic prophylaxis',
  ),
  MED_USE_ANALGESIA: def(
    'periop:medication-use:analgesia',
    'MED_ANALGESIA',
    'Analgesia',
  ),
  SPECIMEN_ROLE_BIOPSY: def(
    'periop:specimen-role:biopsy',
    'SPEC_BIOPSY',
    'Biopsy specimen',
  ),
  SPECIMEN_ROLE_RESECTION: def(
    'periop:specimen-role:resection',
    'SPEC_RESECTION',
    'Resection specimen',
  ),
  SPECIMEN_ROLE_CULTURE: def(
    'periop:specimen-role:culture',
    'SPEC_CULTURE',
    'Culture specimen',
  ),

  // --- Perioperatorio: reporte, PACU y cierre ---
  // Nombre propio: REPORT_DRAFT ya lo usa la definición de reportes (897).
  OPERATIVE_REPORT_DRAFT: def(
    'periop:report-status:draft',
    'OP_REPORT_DRAFT',
    'Operative report draft',
  ),
  OPERATIVE_REPORT_SIGNED: def(
    'periop:report-status:signed',
    'OP_REPORT_SIGNED',
    'Operative report signed',
  ),
  DISPOSITION_PACU: def('periop:disposition:pacu', 'DISP_PACU', 'To PACU'),
  DISPOSITION_ICU: def('periop:disposition:icu', 'DISP_ICU', 'To ICU'),
  DISPOSITION_WARD: def('periop:disposition:ward', 'DISP_WARD', 'To ward'),
  DISPOSITION_HOME: def('periop:disposition:home', 'DISP_HOME', 'Home'),
  RELATEDNESS_PROCEDURE: def(
    'periop:relatedness:procedure',
    'REL_PROCEDURE',
    'Related to procedure',
  ),
  RELATEDNESS_ANESTHESIA: def(
    'periop:relatedness:anesthesia',
    'REL_ANESTHESIA',
    'Related to anesthesia',
  ),
  RELATEDNESS_UNRELATED: def(
    'periop:relatedness:unrelated',
    'REL_UNRELATED',
    'Unrelated',
  ),
  PACU_IN_RECOVERY: def(
    'periop:pacu-status:in-recovery',
    'PACU_IN_RECOVERY',
    'In recovery',
  ),
  PACU_DISCHARGED: def(
    'periop:pacu-status:discharged',
    'PACU_DISCHARGED',
    'Discharged from PACU',
  ),
  AIRWAY_STATUS_PATENT: def(
    'periop:airway-status:patent',
    'AIRWAY_PATENT',
    'Patent airway',
  ),
  AIRWAY_STATUS_SUPPORTED: def(
    'periop:airway-status:supported',
    'AIRWAY_SUPPORTED',
    'Supported airway',
  ),
  LOCATION_ROLE_OR: def(
    'periop:location-role:operating-room',
    'LOC_OR',
    'Operating room',
  ),
  LOCATION_ROLE_PACU: def('periop:location-role:pacu', 'LOC_PACU', 'PACU'),
  FOLLOWUP_WOUND_CHECK: def(
    'periop:followup-type:wound-check',
    'FU_WOUND',
    'Wound check',
  ),
  FOLLOWUP_VISIT: def(
    'periop:followup-type:visit',
    'FU_VISIT',
    'Follow-up visit',
  ),
  FOLLOWUP_SCHEDULED: def(
    'periop:followup-status:scheduled',
    'FU_SCHEDULED',
    'Follow-up scheduled',
  ),
  CANCEL_CATEGORY_PATIENT: def(
    'periop:cancel-category:patient',
    'PERIOP_CANCEL_PATIENT',
    'Patient-related cancellation',
  ),
  CANCEL_CATEGORY_FACILITY: def(
    'periop:cancel-category:facility',
    'CANCEL_FACILITY',
    'Facility-related cancellation',
  ),
  CANCEL_CATEGORY_CLINICAL: def(
    'periop:cancel-category:clinical',
    'CANCEL_CLINICAL',
    'Clinical cancellation',
  ),
  PREVENTABLE_YES: def(
    'periop:preventable:yes',
    'PREVENTABLE_YES',
    'Preventable',
  ),
  PREVENTABLE_NO: def(
    'periop:preventable:no',
    'PREVENTABLE_NO',
    'Not preventable',
  ),
  CHARGE_TYPE_PROCEDURE: def(
    'periop:charge-type:procedure',
    'CHARGE_PROCEDURE',
    'Procedure charge',
  ),
  CHARGE_TYPE_IMPLANT: def(
    'periop:charge-type:implant',
    'CHARGE_IMPLANT',
    'Implant charge',
  ),
  CHARGE_TYPE_SUPPLY: def(
    'periop:charge-type:supply',
    'CHARGE_SUPPLY',
    'Supply charge',
  ),
  CHARGE_TYPE_OR_TIME: def(
    'periop:charge-type:or-time',
    'CHARGE_OR_TIME',
    'Operating room time',
  ),
  CHARGE_DRAFT: def(
    'periop:charge-status:draft',
    'CHARGE_DRAFT',
    'Charge draft',
  ),
  CHARGE_POSTED: def(
    'periop:charge-status:posted',
    'CHARGE_POSTED',
    'Charge posted',
  ),

  // --- Tracking: sujeto y envío (37) ---
  SUBJECT_TYPE_SPECIMEN: def(
    'tracking:subject-type:specimen',
    'SUBJ_SPECIMEN',
    'Specimen subject',
  ),
  SUBJECT_TYPE_ORDER: def(
    'tracking:subject-type:order',
    'SUBJ_ORDER',
    'Order subject',
  ),
  SUBJECT_TYPE_DEVICE: def(
    'tracking:subject-type:device',
    'SUBJ_DEVICE',
    'Device subject',
  ),
  SUBJECT_OPEN: def('tracking:subject-state:open', 'SUBJ_OPEN', 'Subject open'),
  SUBJECT_CLOSED: def(
    'tracking:subject-state:closed',
    'SUBJ_CLOSED',
    'Subject closed',
  ),
  TRACK_CREATED: def('tracking:status:created', 'TRACK_CREATED', 'Created'),
  TRACK_PREPARING: def(
    'tracking:status:preparing',
    'TRACK_PREPARING',
    'Preparing',
  ),
  TRACK_IN_TRANSIT: def(
    'tracking:status:in-transit',
    'TRACK_IN_TRANSIT',
    'In transit',
  ),
  TRACK_HANDOFF: def('tracking:status:handoff', 'TRACK_HANDOFF', 'Handoff'),
  TRACK_DELIVERED: def(
    'tracking:status:delivered',
    'TRACK_DELIVERED',
    'Delivered',
  ),
  TRACK_EXCEPTION: def(
    'tracking:status:exception',
    'TRACK_EXCEPTION',
    'Exception',
  ),
  TRACK_RETRY_SCHEDULED: def(
    'tracking:status:retry-scheduled',
    'TRACK_RETRY',
    'Retry scheduled',
  ),
  TRACK_CANCELLED: def(
    'tracking:status:cancelled',
    'TRACK_CANCELLED',
    'Cancelled',
  ),
  TRACK_SLA_BREACH: def(
    'tracking:status:sla-breach',
    'TRACK_SLA_BREACH',
    'SLA breach',
  ),
  TRACK_PRIORITY_NORMAL: def(
    'tracking:priority:normal',
    'TRACK_PRI_NORMAL',
    'Normal priority',
  ),
  TRACK_PRIORITY_HIGH: def(
    'tracking:priority:high',
    'TRACK_PRI_HIGH',
    'High priority',
  ),
  TRACK_PRIORITY_CRITICAL: def(
    'tracking:priority:critical',
    'TRACK_PRI_CRITICAL',
    'Critical priority',
  ),

  // --- Tracking: eventos, handoff y ETA ---
  TRACK_SOURCE_OPERATOR: def(
    'tracking:event-source:operator',
    'SRC_OPERATOR',
    'Operator',
  ),
  TRACK_SOURCE_CARRIER_WEBHOOK: def(
    'tracking:event-source:carrier-webhook',
    'SRC_WEBHOOK',
    'Carrier webhook',
  ),
  TRACK_SOURCE_COURIER_APP: def(
    'tracking:event-source:courier-app',
    'SRC_COURIER_APP',
    'Courier app',
  ),
  TRACK_SOURCE_SYSTEM: def(
    'tracking:event-source:system',
    'SRC_SYSTEM',
    'System',
  ),
  HANDOFF_PICKUP: def(
    'tracking:handoff-type:pickup',
    'HANDOFF_PICKUP',
    'Pickup',
  ),
  HANDOFF_TRANSFER: def(
    'tracking:handoff-type:transfer',
    'HANDOFF_TRANSFER',
    'Carrier transfer',
  ),
  HANDOFF_DROPOFF: def(
    'tracking:handoff-type:dropoff',
    'HANDOFF_DROPOFF',
    'Drop-off',
  ),
  ETA_METHOD_CARRIER: def(
    'tracking:eta-method:carrier',
    'ETA_CARRIER',
    'Carrier estimate',
  ),
  ETA_METHOD_DISTANCE: def(
    'tracking:eta-method:distance',
    'ETA_DISTANCE',
    'Distance-based estimate',
  ),
  ETA_METHOD_MANUAL: def(
    'tracking:eta-method:manual',
    'ETA_MANUAL',
    'Manual estimate',
  ),

  // --- Tracking: prueba de entrega ---
  PROOF_SIGNATURE: def(
    'tracking:proof-type:signature',
    'PROOF_SIGNATURE',
    'Signature proof',
  ),
  PROOF_PHOTO: def('tracking:proof-type:photo', 'PROOF_PHOTO', 'Photo proof'),
  PROOF_FAILED_ATTEMPT: def(
    'tracking:proof-type:failed-attempt',
    'PROOF_FAILED',
    'Failed delivery attempt',
  ),
  PROOF_VERIFIED: def(
    'tracking:proof-status:verified',
    'PROOF_VERIFIED',
    'Proof verified',
  ),
  PROOF_REJECTED: def(
    'tracking:proof-status:rejected',
    'PROOF_REJECTED',
    'Proof rejected',
  ),

  // --- Identidad federada: proveedor (40) ---
  IDP_PROTOCOL_OIDC: def(
    'auth-providers:protocol:oidc',
    'IDP_OIDC',
    'OpenID Connect',
  ),
  IDP_PROTOCOL_SAML: def(
    'auth-providers:protocol:saml',
    'IDP_SAML',
    'SAML 2.0',
  ),
  IDP_PROTOCOL_OAUTH2: def(
    'auth-providers:protocol:oauth2',
    'IDP_OAUTH2',
    'OAuth 2.0',
  ),
  IDP_CATEGORY_ENTERPRISE: def(
    'auth-providers:category:enterprise',
    'IDP_ENTERPRISE',
    'Enterprise IdP',
  ),
  IDP_CATEGORY_SOCIAL: def(
    'auth-providers:category:social',
    'IDP_SOCIAL',
    'Social IdP',
  ),
  IDP_CATEGORY_GOVERNMENT: def(
    'auth-providers:category:government',
    'IDP_GOVERNMENT',
    'Government IdP',
  ),
  IDP_DRAFT: def(
    'auth-providers:provider-state:draft',
    'IDP_DRAFT',
    'Provider draft',
  ),
  IDP_ACTIVE: def(
    'auth-providers:provider-state:active',
    'IDP_ACTIVE',
    'Provider active',
  ),
  IDP_DISABLED: def(
    'auth-providers:provider-state:disabled',
    'IDP_DISABLED',
    'Provider disabled',
  ),
  IDP_ENV_DEVELOPMENT: def(
    'auth-providers:environment:development',
    'IDP_ENV_DEV',
    'Development',
  ),
  IDP_ENV_STAGING: def(
    'auth-providers:environment:staging',
    'IDP_ENV_STG',
    'Staging',
  ),
  IDP_ENV_PRODUCTION: def(
    'auth-providers:environment:production',
    'IDP_ENV_PRD',
    'Production',
  ),
  TOKEN_AUTH_CLIENT_SECRET_POST: def(
    'auth-providers:token-auth:client-secret-post',
    'TOKEN_AUTH_POST',
    'Client secret POST',
  ),
  TOKEN_AUTH_CLIENT_SECRET_BASIC: def(
    'auth-providers:token-auth:client-secret-basic',
    'TOKEN_AUTH_BASIC',
    'Client secret basic',
  ),
  TOKEN_AUTH_PRIVATE_KEY_JWT: def(
    'auth-providers:token-auth:private-key-jwt',
    'TOKEN_AUTH_JWT',
    'Private key JWT',
  ),

  // --- Identidad federada: claves y estados ---
  KEY_USE_SIGNING: def(
    'auth-providers:key-use:signing',
    'KEY_SIG',
    'Signing key',
  ),
  KEY_USE_ENCRYPTION: def(
    'auth-providers:key-use:encryption',
    'KEY_ENC',
    'Encryption key',
  ),
  KEY_ACTIVE: def(
    'auth-providers:key-state:active',
    'KEY_ACTIVE',
    'Key active',
  ),
  KEY_RETIRING: def(
    'auth-providers:key-state:retiring',
    'KEY_RETIRING',
    'Key retiring',
  ),
  KEY_RETIRED: def(
    'auth-providers:key-state:retired',
    'KEY_RETIRED',
    'Key retired',
  ),

  // --- Identidad federada: provisioning y login ---
  PROVISION_EFFECT_ALLOW: def(
    'auth-providers:effect:allow',
    'EFFECT_ALLOW',
    'Allow',
  ),
  PROVISION_EFFECT_DENY: def(
    'auth-providers:effect:deny',
    'EFFECT_DENY',
    'Deny',
  ),
  LOGIN_INITIATED: def(
    'auth-providers:login-outcome:initiated',
    'LOGIN_INITIATED',
    'Login initiated',
  ),
  LOGIN_SUCCESS: def(
    'auth-providers:login-outcome:success',
    'LOGIN_SUCCESS',
    'Login succeeded',
  ),
  LOGIN_FAILURE: def(
    'auth-providers:login-outcome:failure',
    'LOGIN_FAILURE',
    'Login failed',
  ),
  LOGIN_UNLINKED: def(
    'auth-providers:login-outcome:unlinked',
    'LOGIN_UNLINKED',
    'Identity unlinked',
  ),
  LOGIN_FAIL_PROVIDER_DISABLED: def(
    'auth-providers:failure-reason:provider-disabled',
    'FAIL_PROVIDER_DISABLED',
    'Provider disabled',
  ),
  LOGIN_FAIL_DOMAIN_NOT_ALLOWED: def(
    'auth-providers:failure-reason:domain-not-allowed',
    'FAIL_DOMAIN',
    'Email domain not allowed',
  ),
  LOGIN_FAIL_NO_PROVISION: def(
    'auth-providers:failure-reason:no-provisioning',
    'FAIL_NO_PROVISION',
    'Provisioning not permitted',
  ),
  LOGIN_FAIL_MISSING_CLAIM: def(
    'auth-providers:failure-reason:missing-claim',
    'FAIL_MISSING_CLAIM',
    'Required claim missing',
  ),
  LOGIN_FAIL_IDENTITY_REVOKED: def(
    'auth-providers:failure-reason:identity-revoked',
    'FAIL_IDENTITY_REVOKED',
    'Federated identity revoked',
  ),
  FEDERATED_IDENTITY_ACTIVE: def(
    'auth-providers:identity-state:active',
    'FED_ID_ACTIVE',
    'Identity active',
  ),
  FEDERATED_IDENTITY_REVOKED: def(
    'auth-providers:identity-state:revoked',
    'FED_ID_REVOKED',
    'Identity revoked',
  ),
  LINK_REQUEST_PENDING: def(
    'auth-providers:link-status:pending',
    'LINK_PENDING',
    'Link request pending',
  ),
  LINK_REQUEST_COMPLETED: def(
    'auth-providers:link-status:completed',
    'LINK_COMPLETED',
    'Link request completed',
  ),
  LINK_REQUEST_EXPIRED: def(
    'auth-providers:link-status:expired',
    'LINK_EXPIRED',
    'Link request expired',
  ),

  // --- Operaciones de plataforma: solicitud de cambio (46) ---
  CHANGE_TYPE_STANDARD: def(
    'platform-ops:change-type:standard',
    'CHG_STANDARD',
    'Standard change',
  ),
  CHANGE_TYPE_NORMAL: def(
    'platform-ops:change-type:normal',
    'CHG_NORMAL',
    'Normal change',
  ),
  CHANGE_TYPE_EMERGENCY: def(
    'platform-ops:change-type:emergency',
    'CHG_EMERGENCY',
    'Emergency change',
  ),
  // `RISK_LOW`/`RISK_MEDIUM`/`RISK_HIGH` ya existen (línea 205, riesgo clínico);
  // el riesgo de cambio lleva su propio prefijo para no colisionar.
  CHANGE_RISK_LOW: def(
    'platform-ops:change-risk:low',
    'CHG_RISK_LOW',
    'Low change risk',
  ),
  CHANGE_RISK_MEDIUM: def(
    'platform-ops:change-risk:medium',
    'CHG_RISK_MEDIUM',
    'Medium change risk',
  ),
  CHANGE_RISK_HIGH: def(
    'platform-ops:change-risk:high',
    'CHG_RISK_HIGH',
    'High change risk',
  ),
  CHANGE_RISK_CRITICAL: def(
    'platform-ops:change-risk:critical',
    'CHG_RISK_CRITICAL',
    'Critical change risk',
  ),
  CHANGE_DRAFT: def(
    'platform-ops:change-status:draft',
    'CHG_DRAFT',
    'Change draft',
  ),
  CHANGE_REQUESTED: def(
    'platform-ops:change-status:requested',
    'CHG_REQUESTED',
    'Change requested',
  ),
  CHANGE_IN_REVIEW: def(
    'platform-ops:change-status:in-review',
    'CHG_IN_REVIEW',
    'Change in review',
  ),
  CHANGE_APPROVED: def(
    'platform-ops:change-status:approved',
    'CHG_APPROVED',
    'Change approved',
  ),
  CHANGE_REJECTED: def(
    'platform-ops:change-status:rejected',
    'CHG_REJECTED',
    'Change rejected',
  ),
  CHANGE_IMPLEMENTED: def(
    'platform-ops:change-status:implemented',
    'CHG_IMPLEMENTED',
    'Change implemented',
  ),
  CHANGE_CLOSED: def(
    'platform-ops:change-status:closed',
    'CHG_CLOSED',
    'Change closed',
  ),
  // `APPROVAL_APPROVED`/`APPROVAL_REJECTED` ya existen (línea 316, aprobación de
  // presupuesto); la decisión del CAB lleva su propio prefijo.
  CHANGE_DECISION_APPROVED: def(
    'platform-ops:change-decision:approved',
    'CHG_DEC_APPROVED',
    'Approved by CAB',
  ),
  CHANGE_DECISION_REJECTED: def(
    'platform-ops:change-decision:rejected',
    'CHG_DEC_REJECTED',
    'Rejected by CAB',
  ),
  MAINTENANCE_WINDOW_PLANNED: def(
    'platform-ops:window-status:planned',
    'WINDOW_PLANNED',
    'Maintenance window planned',
  ),
  MAINTENANCE_WINDOW_ACTIVE: def(
    'platform-ops:window-status:active',
    'WINDOW_ACTIVE',
    'Maintenance window active',
  ),
  MAINTENANCE_WINDOW_CLOSED: def(
    'platform-ops:window-status:closed',
    'WINDOW_CLOSED',
    'Maintenance window closed',
  ),

  // --- Operaciones de plataforma: artefactos y despliegues ---
  // `ARTIFACT_LOG`/`ARTIFACT_HAR`… ya existen (línea 964, artefactos de prueba);
  // los artefactos de release llevan prefijo `OPS_`.
  OPS_ARTIFACT_CONTAINER_IMAGE: def(
    'platform-ops:artifact-type:container-image',
    'ART_IMAGE',
    'Container image',
  ),
  OPS_ARTIFACT_PACKAGE: def(
    'platform-ops:artifact-type:package',
    'ART_PACKAGE',
    'Package',
  ),
  OPS_ARTIFACT_BINARY: def(
    'platform-ops:artifact-type:binary',
    'ART_BINARY',
    'Binary',
  ),
  OPS_ARTIFACT_HELM_CHART: def(
    'platform-ops:artifact-type:helm-chart',
    'ART_HELM',
    'Helm chart',
  ),
  OPS_ARTIFACT_CONFIG_BUNDLE: def(
    'platform-ops:artifact-type:config-bundle',
    'ART_CONFIG',
    'Configuration bundle',
  ),
  // `IDP_ENV_*` ya existe (módulo 40) para el entorno del proveedor de identidad;
  // el entorno de despliegue es otro eje y lleva su propio prefijo.
  OPS_ENV_DEVELOPMENT: def(
    'platform-ops:environment:development',
    'OPS_ENV_DEV',
    'Development environment',
  ),
  OPS_ENV_STAGING: def(
    'platform-ops:environment:staging',
    'OPS_ENV_STG',
    'Staging environment',
  ),
  OPS_ENV_PRODUCTION: def(
    'platform-ops:environment:production',
    'OPS_ENV_PRD',
    'Production environment',
  ),
  DEPLOY_STRATEGY_ROLLING: def(
    'platform-ops:deploy-strategy:rolling',
    'DEP_ROLLING',
    'Rolling deployment',
  ),
  DEPLOY_STRATEGY_BLUE_GREEN: def(
    'platform-ops:deploy-strategy:blue-green',
    'DEP_BLUE_GREEN',
    'Blue/green deployment',
  ),
  DEPLOY_STRATEGY_CANARY: def(
    'platform-ops:deploy-strategy:canary',
    'DEP_CANARY',
    'Canary deployment',
  ),
  DEPLOY_STRATEGY_RECREATE: def(
    'platform-ops:deploy-strategy:recreate',
    'DEP_RECREATE',
    'Recreate deployment',
  ),
  DEPLOY_PENDING: def(
    'platform-ops:deploy-status:pending',
    'DEP_PENDING',
    'Deployment pending',
  ),
  DEPLOY_IN_PROGRESS: def(
    'platform-ops:deploy-status:in-progress',
    'DEP_IN_PROGRESS',
    'Deployment in progress',
  ),
  DEPLOY_SUCCEEDED: def(
    'platform-ops:deploy-status:succeeded',
    'DEP_SUCCEEDED',
    'Deployment succeeded',
  ),
  DEPLOY_FAILED: def(
    'platform-ops:deploy-status:failed',
    'DEP_FAILED',
    'Deployment failed',
  ),
  DEPLOY_ROLLED_BACK: def(
    'platform-ops:deploy-status:rolled-back',
    'DEP_ROLLED_BACK',
    'Deployment rolled back',
  ),

  // --- Operaciones de plataforma: health checks e incidentes ---
  HC_RUN_PASS: def(
    'platform-ops:health-run:pass',
    'HC_PASS',
    'Health check passed',
  ),
  HC_RUN_WARN: def(
    'platform-ops:health-run:warn',
    'HC_WARN',
    'Health check warning',
  ),
  HC_RUN_FAIL: def(
    'platform-ops:health-run:fail',
    'HC_FAIL',
    'Health check failed',
  ),
  HC_RUN_TIMEOUT: def(
    'platform-ops:health-run:timeout',
    'HC_TIMEOUT',
    'Health check timed out',
  ),
  HC_RUN_ERROR: def(
    'platform-ops:health-run:error',
    'HC_ERROR',
    'Health check errored',
  ),
  HC_SOURCE_SCHEDULER: def(
    'platform-ops:health-source:scheduler',
    'HC_SCHEDULER',
    'Scheduler run',
  ),
  HC_SOURCE_PROBE: def(
    'platform-ops:health-source:probe',
    'HC_PROBE',
    'Probe run',
  ),
  HC_SOURCE_MANUAL: def(
    'platform-ops:health-source:manual',
    'HC_MANUAL',
    'Manual run',
  ),
  // `SEVERITY_*` ya existe en dos vocabularios distintos (líneas 861 y 1080);
  // la severidad de incidente lleva su propio prefijo.
  INCIDENT_SEV_CRITICAL: def(
    'platform-ops:incident-severity:critical',
    'INC_SEV1',
    'Critical incident',
  ),
  INCIDENT_SEV_HIGH: def(
    'platform-ops:incident-severity:high',
    'INC_SEV2',
    'High incident',
  ),
  INCIDENT_SEV_MEDIUM: def(
    'platform-ops:incident-severity:medium',
    'INC_SEV3',
    'Medium incident',
  ),
  INCIDENT_SEV_LOW: def(
    'platform-ops:incident-severity:low',
    'INC_SEV4',
    'Low incident',
  ),
  INCIDENT_OPEN: def(
    'platform-ops:incident-status:open',
    'INC_OPEN',
    'Incident open',
  ),
  INCIDENT_ACKNOWLEDGED: def(
    'platform-ops:incident-status:acknowledged',
    'INC_ACK',
    'Incident acknowledged',
  ),
  INCIDENT_MITIGATED: def(
    'platform-ops:incident-status:mitigated',
    'INC_MITIGATED',
    'Incident mitigated',
  ),
  INCIDENT_RESOLVED: def(
    'platform-ops:incident-status:resolved',
    'INC_RESOLVED',
    'Incident resolved',
  ),
  RESPONDER_COMMANDER: def(
    'platform-ops:responder-role:commander',
    'RESP_COMMANDER',
    'Incident commander',
  ),
  RESPONDER_OPERATIONS: def(
    'platform-ops:responder-role:operations',
    'RESP_OPERATIONS',
    'Operations lead',
  ),
  RESPONDER_COMMUNICATIONS: def(
    'platform-ops:responder-role:communications',
    'RESP_COMMS',
    'Communications lead',
  ),
  RESPONDER_SCRIBE: def(
    'platform-ops:responder-role:scribe',
    'RESP_SCRIBE',
    'Scribe',
  ),
  TIMELINE_DETECTED: def(
    'platform-ops:timeline-event:detected',
    'TL_DETECTED',
    'Incident detected',
  ),
  TIMELINE_ACKNOWLEDGED: def(
    'platform-ops:timeline-event:acknowledged',
    'TL_ACK',
    'Incident acknowledged',
  ),
  TIMELINE_MITIGATED: def(
    'platform-ops:timeline-event:mitigated',
    'TL_MITIGATED',
    'Incident mitigated',
  ),
  TIMELINE_RESOLVED: def(
    'platform-ops:timeline-event:resolved',
    'TL_RESOLVED',
    'Incident resolved',
  ),
  TIMELINE_RESPONDER_JOINED: def(
    'platform-ops:timeline-event:responder-joined',
    'TL_RESPONDER',
    'Responder joined',
  ),
  TIMELINE_COMMUNICATION: def(
    'platform-ops:timeline-event:communication',
    'TL_COMMS',
    'Communication published',
  ),
  TIMELINE_RUNBOOK_EXECUTED: def(
    'platform-ops:timeline-event:runbook-executed',
    'TL_RUNBOOK',
    'Runbook executed',
  ),
  TIMELINE_NOTE: def('platform-ops:timeline-event:note', 'TL_NOTE', 'Note'),
  COMM_TYPE_STATUS_UPDATE: def(
    'platform-ops:comm-type:status-update',
    'COMM_STATUS',
    'Status update',
  ),
  COMM_TYPE_ESCALATION: def(
    'platform-ops:comm-type:escalation',
    'COMM_ESCALATION',
    'Escalation notice',
  ),
  COMM_TYPE_RESOLUTION: def(
    'platform-ops:comm-type:resolution',
    'COMM_RESOLUTION',
    'Resolution notice',
  ),
  COMM_AUDIENCE_INTERNAL: def(
    'platform-ops:comm-audience:internal',
    'COMM_INTERNAL',
    'Internal audience',
  ),
  COMM_AUDIENCE_CUSTOMERS: def(
    'platform-ops:comm-audience:customers',
    'COMM_CUSTOMERS',
    'Customer audience',
  ),
  COMM_AUDIENCE_REGULATORS: def(
    'platform-ops:comm-audience:regulators',
    'COMM_REGULATORS',
    'Regulator audience',
  ),

  // --- Operaciones de plataforma: postmortem y mejoras ---
  POSTMORTEM_DRAFT: def(
    'platform-ops:postmortem-status:draft',
    'PM_DRAFT',
    'Postmortem draft',
  ),
  POSTMORTEM_IN_REVIEW: def(
    'platform-ops:postmortem-status:in-review',
    'PM_IN_REVIEW',
    'Postmortem in review',
  ),
  POSTMORTEM_PUBLISHED: def(
    'platform-ops:postmortem-status:published',
    'PM_PUBLISHED',
    'Postmortem published',
  ),
  ACTION_TYPE_PREVENTIVE: def(
    'platform-ops:action-type:preventive',
    'AI_PREVENTIVE',
    'Preventive action',
  ),
  ACTION_TYPE_CORRECTIVE: def(
    'platform-ops:action-type:corrective',
    'AI_CORRECTIVE',
    'Corrective action',
  ),
  ACTION_TYPE_DETECTIVE: def(
    'platform-ops:action-type:detective',
    'AI_DETECTIVE',
    'Detective action',
  ),
  ACTION_TYPE_PROCESS: def(
    'platform-ops:action-type:process',
    'AI_PROCESS',
    'Process action',
  ),
  ACTION_ITEM_OPEN: def(
    'platform-ops:action-status:open',
    'AI_OPEN',
    'Action item open',
  ),
  ACTION_ITEM_IN_PROGRESS: def(
    'platform-ops:action-status:in-progress',
    'AI_IN_PROGRESS',
    'Action item in progress',
  ),
  ACTION_ITEM_COMPLETED: def(
    'platform-ops:action-status:completed',
    'AI_COMPLETED',
    'Action item completed',
  ),
  ACTION_ITEM_CANCELLED: def(
    'platform-ops:action-status:cancelled',
    'AI_CANCELLED',
    'Action item cancelled',
  ),
  IMPROVEMENT_SOURCE_POSTMORTEM: def(
    'platform-ops:improvement-source:postmortem',
    'IMP_POSTMORTEM',
    'From postmortem',
  ),
  IMPROVEMENT_SOURCE_READINESS: def(
    'platform-ops:improvement-source:readiness-review',
    'IMP_READINESS',
    'From readiness review',
  ),
  IMPROVEMENT_SOURCE_RESILIENCE: def(
    'platform-ops:improvement-source:resilience',
    'IMP_RESILIENCE',
    'From resilience exercise',
  ),
  IMPROVEMENT_OPEN: def(
    'platform-ops:improvement-status:open',
    'IMP_OPEN',
    'Improvement open',
  ),
  IMPROVEMENT_IN_PROGRESS: def(
    'platform-ops:improvement-status:in-progress',
    'IMP_IN_PROGRESS',
    'Improvement in progress',
  ),
  IMPROVEMENT_COMPLETED: def(
    'platform-ops:improvement-status:completed',
    'IMP_COMPLETED',
    'Improvement completed',
  ),
  IMPROVEMENT_PRIORITY_LOW: def(
    'platform-ops:improvement-priority:low',
    'IMP_PRIO_LOW',
    'Low priority',
  ),
  IMPROVEMENT_PRIORITY_MEDIUM: def(
    'platform-ops:improvement-priority:medium',
    'IMP_PRIO_MEDIUM',
    'Medium priority',
  ),
  IMPROVEMENT_PRIORITY_HIGH: def(
    'platform-ops:improvement-priority:high',
    'IMP_PRIO_HIGH',
    'High priority',
  ),

  // --- Operaciones de plataforma: SLO, error budget y capacidad ---
  SLO_PASS: def('platform-ops:slo-status:pass', 'SLO_PASS', 'SLO attained'),
  SLO_WARN: def(
    'platform-ops:slo-status:warn',
    'SLO_WARN',
    'SLO at warning threshold',
  ),
  SLO_FAIL: def('platform-ops:slo-status:fail', 'SLO_FAIL', 'SLO breached'),
  BURN_SEV_WARNING: def(
    'platform-ops:burn-severity:warning',
    'BURN_WARNING',
    'Warning burn rate',
  ),
  BURN_SEV_CRITICAL: def(
    'platform-ops:burn-severity:critical',
    'BURN_CRITICAL',
    'Critical burn rate',
  ),
  BURN_SEV_EXHAUSTED: def(
    'platform-ops:burn-severity:exhausted',
    'BURN_EXHAUSTED',
    'Error budget exhausted',
  ),
  CAPACITY_METRIC_CPU: def(
    'platform-ops:capacity-metric:cpu',
    'CAP_CPU',
    'CPU utilisation',
  ),
  CAPACITY_METRIC_MEMORY: def(
    'platform-ops:capacity-metric:memory',
    'CAP_MEMORY',
    'Memory utilisation',
  ),
  CAPACITY_METRIC_STORAGE: def(
    'platform-ops:capacity-metric:storage',
    'CAP_STORAGE',
    'Storage utilisation',
  ),
  CAPACITY_METRIC_THROUGHPUT: def(
    'platform-ops:capacity-metric:throughput',
    'CAP_THROUGHPUT',
    'Throughput',
  ),
  CAPACITY_METRIC_CONNECTIONS: def(
    'platform-ops:capacity-metric:connections',
    'CAP_CONNECTIONS',
    'Connections',
  ),
  CAPACITY_PLAN_DRAFT: def(
    'platform-ops:capacity-status:draft',
    'CAP_DRAFT',
    'Capacity plan draft',
  ),
  CAPACITY_PLAN_ACTIVE: def(
    'platform-ops:capacity-status:active',
    'CAP_ACTIVE',
    'Capacity plan active',
  ),
  CAPACITY_PLAN_CLOSED: def(
    'platform-ops:capacity-status:closed',
    'CAP_CLOSED',
    'Capacity plan closed',
  ),

  // --- Operaciones de plataforma: readiness, runbooks y resiliencia ---
  ORR_PLANNED: def(
    'platform-ops:orr-status:planned',
    'ORR_PLANNED',
    'Readiness review planned',
  ),
  ORR_IN_PROGRESS: def(
    'platform-ops:orr-status:in-progress',
    'ORR_IN_PROGRESS',
    'Readiness review in progress',
  ),
  ORR_COMPLETED: def(
    'platform-ops:orr-status:completed',
    'ORR_COMPLETED',
    'Readiness review completed',
  ),
  ORR_DECISION_GO: def('platform-ops:orr-decision:go', 'ORR_GO', 'Go'),
  ORR_DECISION_NO_GO: def(
    'platform-ops:orr-decision:no-go',
    'ORR_NO_GO',
    'No go',
  ),
  FINDING_SEV_LOW: def(
    'platform-ops:finding-severity:low',
    'FND_LOW',
    'Low finding',
  ),
  FINDING_SEV_MEDIUM: def(
    'platform-ops:finding-severity:medium',
    'FND_MEDIUM',
    'Medium finding',
  ),
  FINDING_SEV_HIGH: def(
    'platform-ops:finding-severity:high',
    'FND_HIGH',
    'High finding',
  ),
  FINDING_SEV_CRITICAL: def(
    'platform-ops:finding-severity:critical',
    'FND_CRITICAL',
    'Critical finding',
  ),
  FINDING_OPEN: def(
    'platform-ops:finding-status:open',
    'FND_OPEN',
    'Finding open',
  ),
  FINDING_RESOLVED: def(
    'platform-ops:finding-status:resolved',
    'FND_RESOLVED',
    'Finding resolved',
  ),
  FINDING_WAIVED: def(
    'platform-ops:finding-status:waived',
    'FND_WAIVED',
    'Finding waived',
  ),
  RUNBOOK_EXEC_MANUAL: def(
    'platform-ops:runbook-mode:manual',
    'RB_MANUAL',
    'Manual execution',
  ),
  RUNBOOK_EXEC_ASSISTED: def(
    'platform-ops:runbook-mode:assisted',
    'RB_ASSISTED',
    'Assisted execution',
  ),
  RUNBOOK_EXEC_AUTOMATED: def(
    'platform-ops:runbook-mode:automated',
    'RB_AUTOMATED',
    'Automated execution',
  ),
  RUNBOOK_RESULT_SUCCESS: def(
    'platform-ops:runbook-result:success',
    'RB_SUCCESS',
    'Runbook succeeded',
  ),
  RUNBOOK_RESULT_PARTIAL: def(
    'platform-ops:runbook-result:partial',
    'RB_PARTIAL',
    'Runbook partially succeeded',
  ),
  RUNBOOK_RESULT_FAILED: def(
    'platform-ops:runbook-result:failed',
    'RB_FAILED',
    'Runbook failed',
  ),
  RUNBOOK_RESULT_ABORTED: def(
    'platform-ops:runbook-result:aborted',
    'RB_ABORTED',
    'Runbook aborted',
  ),
  RESILIENCE_TYPE_DR_DRILL: def(
    'platform-ops:exercise-type:dr-drill',
    'RES_DR',
    'Disaster recovery drill',
  ),
  RESILIENCE_TYPE_CHAOS: def(
    'platform-ops:exercise-type:chaos',
    'RES_CHAOS',
    'Chaos experiment',
  ),
  RESILIENCE_TYPE_FAILOVER: def(
    'platform-ops:exercise-type:failover',
    'RES_FAILOVER',
    'Failover test',
  ),
  RESILIENCE_TYPE_BACKUP_RESTORE: def(
    'platform-ops:exercise-type:backup-restore',
    'RES_RESTORE',
    'Backup restore test',
  ),
  RESILIENCE_PASS: def(
    'platform-ops:exercise-result:pass',
    'RES_PASS',
    'Exercise passed',
  ),
  RESILIENCE_FAIL: def(
    'platform-ops:exercise-result:fail',
    'RES_FAIL',
    'Exercise failed',
  ),

  // --- Contexto de sistema: enumeraciones dinámicas (45) ---
  //
  // Sólo se definen aquí los vocabularios de **ciclo de vida** que el caso de
  // uso enumera. Los catálogos abiertos —tipo de contexto, ámbito, modo de
  // selección, política de refresco, locale, país, tipo de consumidor— no se
  // inventan: el cliente entrega su `*ConceptId` y el módulo lo persiste tal
  // cual.
  ENUM_DEF_DRAFT: def(
    'system-context:enum-def-status:draft',
    'ENUM_DEF_DRAFT',
    'Enum definition draft',
  ),
  ENUM_DEF_ACTIVE: def(
    'system-context:enum-def-status:active',
    'ENUM_DEF_ACTIVE',
    'Enum definition active',
  ),
  ENUM_DEF_RETIRED: def(
    'system-context:enum-def-status:retired',
    'ENUM_DEF_RETIRED',
    'Enum definition retired',
  ),
  ENUM_VERSION_DRAFT: def(
    'system-context:enum-version-status:draft',
    'ENUM_VER_DRAFT',
    'Enum version draft',
  ),
  ENUM_VERSION_PUBLISHED: def(
    'system-context:enum-version-status:published',
    'ENUM_VER_PUBLISHED',
    'Enum version published',
  ),
  ENUM_VERSION_SUPERSEDED: def(
    'system-context:enum-version-status:superseded',
    'ENUM_VER_SUPERSEDED',
    'Enum version superseded',
  ),
  ENUM_BINDING_ACTIVE: def(
    'system-context:enum-binding-status:active',
    'ENUM_BIND_ACTIVE',
    'Enum binding active',
  ),
  ENUM_BINDING_DISABLED: def(
    'system-context:enum-binding-status:disabled',
    'ENUM_BIND_DISABLED',
    'Enum binding disabled',
  ),
  VALIDATION_MODE_STRICT: def(
    'system-context:validation-mode:strict',
    'VALID_STRICT',
    'Strict validation',
  ),
  VALIDATION_MODE_LENIENT: def(
    'system-context:validation-mode:lenient',
    'VALID_LENIENT',
    'Lenient validation',
  ),

  // Ámbito y modo de selección de una enumeración. El comentario de arriba dice
  // que estos catálogos son abiertos y que el cliente entrega su `*ConceptId`:
  // sigue siendo cierto. Lo que se define aquí son los dos valores que usa la
  // **propia plataforma** al sembrar sus enumeraciones bien conocidas
  // (`DynamicEnumSeedService`), porque `scope_type_concept_id` y
  // `selection_mode_concept_id` son NOT NULL y el seed no puede inventarlos ni
  // pedírselos a nadie. No restringen lo que el cliente puede mandar.
  ENUM_SCOPE_GLOBAL: def(
    'system-context:enum-scope:global',
    'ENUM_SCOPE_GLOBAL',
    'Enum scope global',
  ),
  ENUM_SCOPE_TENANT: def(
    'system-context:enum-scope:tenant',
    'ENUM_SCOPE_TENANT',
    'Enum scope tenant',
  ),
  ENUM_SELECTION_SINGLE: def(
    'system-context:enum-selection-mode:single',
    'ENUM_SEL_SINGLE',
    'Single selection',
  ),
  ENUM_SELECTION_MULTIPLE: def(
    'system-context:enum-selection-mode:multiple',
    'ENUM_SEL_MULTIPLE',
    'Multiple selection',
  ),

  // --- Contexto de sistema: contextos y versiones ---
  SYSCTX_ACTIVE: def(
    'system-context:context-status:active',
    'SYSCTX_ACTIVE',
    'System context active',
  ),
  SYSCTX_RETIRED: def(
    'system-context:context-status:retired',
    'SYSCTX_RETIRED',
    'System context retired',
  ),
  SYSCTX_VERSION_DRAFT: def(
    'system-context:version-status:draft',
    'SYSCTX_VER_DRAFT',
    'Context version draft',
  ),
  SYSCTX_VERSION_ACTIVE: def(
    'system-context:version-status:active',
    'SYSCTX_VER_ACTIVE',
    'Context version active',
  ),
  SYSCTX_VERSION_SUPERSEDED: def(
    'system-context:version-status:superseded',
    'SYSCTX_VER_SUPERSEDED',
    'Context version superseded',
  ),
  SYSCTX_BINDING_ACTIVE: def(
    'system-context:binding-status:active',
    'SYSCTX_BIND_ACTIVE',
    'Context binding active',
  ),
  SYSCTX_BINDING_DISABLED: def(
    'system-context:binding-status:disabled',
    'SYSCTX_BIND_DISABLED',
    'Context binding disabled',
  ),
  REFRESH_RUN_RUNNING: def(
    'system-context:refresh-status:running',
    'REFRESH_RUNNING',
    'Refresh running',
  ),
  REFRESH_RUN_SUCCEEDED: def(
    'system-context:refresh-status:succeeded',
    'REFRESH_SUCCEEDED',
    'Refresh succeeded',
  ),
  REFRESH_RUN_FAILED: def(
    'system-context:refresh-status:failed',
    'REFRESH_FAILED',
    'Refresh failed',
  ),
  /** El contenido regenerado coincide con el vigente: no se promueve nada. */
  REFRESH_RUN_UNCHANGED: def(
    'system-context:refresh-status:unchanged',
    'REFRESH_UNCHANGED',
    'Refresh unchanged',
  ),
  REFRESH_TRIGGER_SCHEDULED: def(
    'system-context:refresh-trigger:scheduled',
    'REFRESH_SCHEDULED',
    'Scheduled refresh',
  ),
  REFRESH_TRIGGER_MANUAL: def(
    'system-context:refresh-trigger:manual',
    'REFRESH_MANUAL',
    'Manual refresh',
  ),
  REFRESH_TRIGGER_EVENT: def(
    'system-context:refresh-trigger:event',
    'REFRESH_EVENT',
    'Event-driven refresh',
  ),

  // --- Contexto de salud por país (44) ---
  //
  // Igual que en el módulo 45: sólo se definen los vocabularios de ciclo de
  // vida que el caso de uso enumera. Dominio del contexto, tipo de agente,
  // tipo de fuente, nivel de confianza, tipo de revisión, país, zona horaria,
  // métrica y unidad son catálogos abiertos y llegan como `*ConceptId`.
  HCTX_CONTEXT_DRAFT: def(
    'health-context:context-status:draft',
    'HCTX_DRAFT',
    'Country context draft',
  ),
  HCTX_CONTEXT_ACTIVE: def(
    'health-context:context-status:active',
    'HCTX_ACTIVE',
    'Country context active',
  ),
  /** Se quedó sin versión vigente: lo publicado caducó y no hay reemplazo. */
  HCTX_CONTEXT_STALE: def(
    'health-context:context-status:stale',
    'HCTX_STALE',
    'Country context stale',
  ),
  HCTX_VERSION_DRAFT: def(
    'health-context:version-status:draft',
    'HCTX_VER_DRAFT',
    'Context version draft',
  ),
  HCTX_VERSION_APPROVED: def(
    'health-context:version-status:approved',
    'HCTX_VER_APPROVED',
    'Context version approved',
  ),
  HCTX_VERSION_REJECTED: def(
    'health-context:version-status:rejected',
    'HCTX_VER_REJECTED',
    'Context version rejected',
  ),
  HCTX_VERSION_PUBLISHED: def(
    'health-context:version-status:published',
    'HCTX_VER_PUBLISHED',
    'Context version published',
  ),
  HCTX_VERSION_SUPERSEDED: def(
    'health-context:version-status:superseded',
    'HCTX_VER_SUPERSEDED',
    'Context version superseded',
  ),
  HCTX_VERSION_EXPIRED: def(
    'health-context:version-status:expired',
    'HCTX_VER_EXPIRED',
    'Context version expired',
  ),
  HCTX_RUN_RUNNING: def(
    'health-context:run-status:running',
    'HCTX_RUN_RUNNING',
    'Collection run running',
  ),
  HCTX_RUN_SUCCEEDED: def(
    'health-context:run-status:succeeded',
    'HCTX_RUN_SUCCEEDED',
    'Collection run succeeded',
  ),
  /** Terminó, pero alguna fuente quedó fuera o rechazada. */
  HCTX_RUN_PARTIAL: def(
    'health-context:run-status:partial',
    'HCTX_RUN_PARTIAL',
    'Collection run partial',
  ),
  HCTX_RUN_FAILED: def(
    'health-context:run-status:failed',
    'HCTX_RUN_FAILED',
    'Collection run failed',
  ),
  HCTX_TRIGGER_SCHEDULED: def(
    'health-context:run-trigger:scheduled',
    'HCTX_SCHEDULED',
    'Scheduled collection',
  ),
  HCTX_TRIGGER_MANUAL: def(
    'health-context:run-trigger:manual',
    'HCTX_MANUAL',
    'Manual collection',
  ),
  HCTX_OBS_ACCEPTED: def(
    'health-context:observation-status:accepted',
    'HCTX_OBS_ACCEPTED',
    'Observation accepted',
  ),
  HCTX_OBS_REJECTED: def(
    'health-context:observation-status:rejected',
    'HCTX_OBS_REJECTED',
    'Observation rejected',
  ),
  HCTX_REVIEW_APPROVED: def(
    'health-context:review-outcome:approved',
    'HCTX_REV_APPROVED',
    'Review approved',
  ),
  HCTX_REVIEW_REJECTED: def(
    'health-context:review-outcome:rejected',
    'HCTX_REV_REJECTED',
    'Review rejected',
  ),

  // --- Plataforma de datos de salud: ingesta (52) ---
  //
  // Como en 44 y 45: sólo los ciclos de vida que el caso de uso enumera. Tipo
  // de recurso, modo de ingesta, entidad de dominio, rol de binding, tipo de
  // relación, propósito de uso, tipo de exportación y visibilidad son catálogos
  // abiertos y llegan como `*ConceptId`.
  BATCH_RECEIVING: def(
    'health-data:batch-status:receiving',
    'BATCH_RECEIVING',
    'Batch receiving',
  ),
  BATCH_COMPLETED: def(
    'health-data:batch-status:completed',
    'BATCH_COMPLETED',
    'Batch completed',
  ),
  RECORD_VALIDATION_PENDING: def(
    'health-data:record-validation:pending',
    'REC_VAL_PENDING',
    'Record validation pending',
  ),
  RECORD_QUEUED: def(
    'health-data:record-processing:queued',
    'REC_QUEUED',
    'Record queued',
  ),
  RECORD_PROJECTED: def(
    'health-data:record-processing:projected',
    'REC_PROJECTED',
    'Record projected',
  ),

  // --- Plataforma de datos de salud: recurso canónico ---
  RESOURCE_ACTIVE: def(
    'health-data:resource-lifecycle:active',
    'RES_ACTIVE',
    'Canonical resource active',
  ),
  /** La validación FHIR falló con error: el recurso deja de servirse hasta corregirlo. */
  RESOURCE_QUARANTINED: def(
    'health-data:resource-lifecycle:quarantined',
    'RES_QUARANTINED',
    'Canonical resource quarantined',
  ),
  RESOURCE_RETIRED: def(
    'health-data:resource-lifecycle:retired',
    'RES_RETIRED',
    'Canonical resource retired',
  ),
  RESOURCE_CHANGE_CREATE: def(
    'health-data:change-type:create',
    'CHG_CREATE',
    'First version of the resource',
  ),
  RESOURCE_CHANGE_UPDATE: def(
    'health-data:change-type:update',
    'CHG_UPDATE',
    'Update of an existing resource',
  ),
  BINDING_BOUND: def(
    'health-data:binding-status:bound',
    'BIND_BOUND',
    'Bound to domain entity',
  ),

  // --- Plataforma de datos de salud: procedencia y linaje ---
  PROV_INGEST: def(
    'health-data:provenance-activity:ingest',
    'PROV_INGEST',
    'Ingestion activity',
  ),
  PROV_DEIDENTIFY: def(
    'health-data:provenance-activity:deidentify',
    'PROV_DEID',
    'De-identification activity',
  ),
  PROV_EXPORT: def(
    'health-data:provenance-activity:export',
    'PROV_EXPORT',
    'Export activity',
  ),
  PROV_RETIRE: def(
    'health-data:provenance-activity:retire',
    'PROV_RETIRE',
    'Retirement activity',
  ),
  // Las referencias de procedencia y linaje son polimórficas: la fila guarda
  // el par (tipo de entidad, id). Sin un vocabulario de tipos, el `target_id`
  // no diría a qué tabla apunta.
  /**
   * Papel por defecto de un objetivo de procedencia: el recurso **resultante**
   * de la actividad.
   *
   * `health_provenance_targets.role_concept_id` es NOT NULL en el esquema y su
   * contrato lo declaraba opcional; ningún llamador lo pasaba, así que toda
   * escritura de procedencia fallaba con 500 —y con ella la proyección de un
   * recurso canónico, que es la puerta de entrada del módulo—.
   */
  /**
   * Formato por defecto del contenido de una versión canónica: JSON FHIR.
   *
   * `canonical_health_resource_versions.payload_format_concept_id` es NOT NULL
   * y su contrato lo declaraba opcional; ningún llamador lo pasaba, así que
   * proyectar un recurso canónico —la puerta de entrada del módulo— fallaba
   * siempre con 500. Todo lo que el módulo normaliza hoy es JSON FHIR R5, así
   * que es el valor honesto por defecto.
   */
  HD_PAYLOAD_FORMAT_FHIR_JSON: def(
    'health-data:payload-format:fhir-json',
    'HD_FMT_FHIR_JSON',
    'FHIR R5 JSON payload',
  ),

  HD_TARGET_ROLE_OUTPUT: def(
    'health-data:target-role:output',
    'HD_TARGET_OUTPUT',
    'Provenance target: resulting resource',
  ),

  HD_ENTITY_INGESTION_RECORD: def(
    'health-data:entity-type:ingestion-record',
    'HD_ENT_RECORD',
    'Ingestion record',
  ),
  HD_ENTITY_CANONICAL_RESOURCE: def(
    'health-data:entity-type:canonical-resource',
    'HD_ENT_RESOURCE',
    'Canonical resource',
  ),
  HD_ENTITY_RESOURCE_VERSION: def(
    'health-data:entity-type:resource-version',
    'HD_ENT_VERSION',
    'Canonical resource version',
  ),
  HD_ENTITY_DOMAIN_ENTITY: def(
    'health-data:entity-type:domain-entity',
    'HD_ENT_DOMAIN',
    'Domain entity',
  ),
  HD_ENTITY_MANIFEST: def(
    'health-data:entity-type:manifest',
    'HD_ENT_MANIFEST',
    'Output manifest',
  ),
  LINEAGE_NORMALIZE: def(
    'health-data:transformation:normalize',
    'LIN_NORMALIZE',
    'Normalisation',
  ),
  LINEAGE_BIND: def(
    'health-data:transformation:bind',
    'LIN_BIND',
    'Domain binding',
  ),
  LINEAGE_DEIDENTIFY: def(
    'health-data:transformation:deidentify',
    'LIN_DEID',
    'De-identification',
  ),

  // --- Plataforma de datos de salud: validación FHIR y calidad ---
  VALIDATION_RESULT_PASS: def(
    'health-data:validation-result:pass',
    'VAL_PASS',
    'Validation passed',
  ),
  VALIDATION_RESULT_WARNING: def(
    'health-data:validation-result:warning',
    'VAL_WARNING',
    'Validation with warnings',
  ),
  VALIDATION_RESULT_ERROR: def(
    'health-data:validation-result:error',
    'VAL_ERROR',
    'Validation failed',
  ),
  ISSUE_SEV_FATAL: def(
    'health-data:issue-severity:fatal',
    'ISSUE_FATAL',
    'Fatal issue',
  ),
  ISSUE_SEV_ERROR: def(
    'health-data:issue-severity:error',
    'ISSUE_ERROR',
    'Error issue',
  ),
  ISSUE_SEV_WARNING: def(
    'health-data:issue-severity:warning',
    'ISSUE_WARNING',
    'Warning issue',
  ),
  ISSUE_SEV_INFORMATION: def(
    'health-data:issue-severity:information',
    'ISSUE_INFO',
    'Informational issue',
  ),
  QUALITY_RESULT_PASS: def(
    'health-data:quality-result:pass',
    'QUAL_PASS',
    'Quality run passed',
  ),
  QUALITY_RESULT_WARNING: def(
    'health-data:quality-result:warning',
    'QUAL_WARNING',
    'Quality run with warnings',
  ),
  QUALITY_RESULT_FAIL: def(
    'health-data:quality-result:fail',
    'QUAL_FAIL',
    'Quality run failed',
  ),
  QUALITY_ISSUE_OPEN: def(
    'health-data:quality-issue:open',
    'QUAL_ISSUE_OPEN',
    'Quality issue open',
  ),

  // --- Plataforma de datos de salud: identidad longitudinal (MPI) ---
  MATCH_PENDING: def(
    'health-data:match-status:pending',
    'MATCH_PENDING',
    'Match candidate pending',
  ),
  MATCH_RESOLVED: def(
    'health-data:match-status:resolved',
    'MATCH_RESOLVED',
    'Match candidate resolved',
  ),
  MATCH_DECISION_MATCH: def(
    'health-data:match-decision:match',
    'MATCH_YES',
    'Same patient',
  ),
  MATCH_DECISION_NO_MATCH: def(
    'health-data:match-decision:no-match',
    'MATCH_NO',
    'Different patients',
  ),

  // --- Plataforma de datos de salud: de-identificación y exportación ---
  DEID_RUNNING: def(
    'health-data:deid-status:running',
    'DEID_RUNNING',
    'De-identification running',
  ),
  DEID_COMPLETED: def(
    'health-data:deid-status:completed',
    'DEID_COMPLETED',
    'De-identification completed',
  ),
  DEID_FAILED: def(
    'health-data:deid-status:failed',
    'DEID_FAILED',
    'De-identification failed',
  ),
  EXPORT_RUNNING: def(
    'health-data:export-status:running',
    'EXPORT_RUNNING',
    'Export running',
  ),
  EXPORT_COMPLETED: def(
    'health-data:export-status:completed',
    'EXPORT_COMPLETED',
    'Export completed',
  ),
  EXPORT_FAILED: def(
    'health-data:export-status:failed',
    'EXPORT_FAILED',
    'Export failed',
  ),

  // --- Mensajería: outbox y eventos de dominio (35) ---
  //
  // Sólo los ciclos de vida que el caso de uso enumera. Tipo de canal, tipo de
  // proveedor, categoría, idioma y moneda son catálogos abiertos.
  OUTBOX_PENDING: def(
    'messaging:outbox-status:pending',
    'OUTBOX_PENDING',
    'Outbox message pending',
  ),
  OUTBOX_PUBLISHED: def(
    'messaging:outbox-status:published',
    'OUTBOX_PUBLISHED',
    'Outbox message published',
  ),
  /**
   * Agotó `max_attempts`. El caso de uso no lo nombra, pero la columna existe y
   * sin estado terminal el relay reintentaría para siempre.
   */
  OUTBOX_FAILED: def(
    'messaging:outbox-status:failed',
    'OUTBOX_FAILED',
    'Outbox message exhausted',
  ),
  // `DELIVERY_*` ya existe en dos vocabularios (líneas 268 y 1013); la entrega
  // de eventos lleva prefijo `EVENT_DELIVERY_`.
  EVENT_DELIVERY_DISPATCHED: def(
    'messaging:event-delivery:dispatched',
    'EVT_DISPATCHED',
    'Event dispatched to subscriber',
  ),
  EVENT_DELIVERY_RETRYING: def(
    'messaging:event-delivery:retrying',
    'EVT_RETRYING',
    'Event delivery retrying',
  ),
  EVENT_DELIVERY_HANDLED: def(
    'messaging:event-delivery:handled',
    'EVT_HANDLED',
    'Event handled by subscriber',
  ),
  EVENT_DELIVERY_FAILED: def(
    'messaging:event-delivery:failed',
    'EVT_FAILED',
    'Event delivery failed',
  ),
  /** Único modo de entrega que el caso de uso nombra (UC-35-03). */
  MSG_DELIVERY_MODE_QUEUE: def(
    'messaging:delivery-mode:queue',
    'MODE_QUEUE',
    'Deliver through a queue',
  ),

  // --- Mensajería: colas de trabajo ---
  JOB_READY: def('messaging:job-status:ready', 'JOB_READY', 'Job ready'),
  JOB_RUNNING: def(
    'messaging:job-status:running',
    'JOB_RUNNING',
    'Job running',
  ),
  JOB_SUCCEEDED: def(
    'messaging:job-status:succeeded',
    'JOB_SUCCEEDED',
    'Job succeeded',
  ),
  JOB_DEAD_LETTER: def(
    'messaging:job-status:dead-letter',
    'JOB_DEAD_LETTER',
    'Job in dead letter',
  ),

  // --- Mensajería: notificaciones ---
  NOTIF_PENDING: def(
    'messaging:notification-status:pending',
    'NOTIF_PENDING',
    'Notification pending',
  ),
  NOTIF_SENDING: def(
    'messaging:notification-status:sending',
    'NOTIF_SENDING',
    'Notification sending',
  ),
  NOTIF_SENT: def(
    'messaging:notification-status:sent',
    'NOTIF_SENT',
    'Notification sent',
  ),
  NOTIF_DELIVERED: def(
    'messaging:notification-status:delivered',
    'NOTIF_DELIVERED',
    'Notification delivered',
  ),
  NOTIF_FAILED: def(
    'messaging:notification-status:failed',
    'NOTIF_FAILED',
    'Notification failed',
  ),
  /** Sin consentimiento o sin opt-in: se registra pero no se entrega. */
  NOTIF_SUPPRESSED: def(
    'messaging:notification-status:suppressed',
    'NOTIF_SUPPRESSED',
    'Notification suppressed',
  ),
  NOTIF_DELIVERY_SENT: def(
    'messaging:delivery-status:sent',
    'ND_SENT',
    'Provider accepted the message',
  ),
  NOTIF_DELIVERY_DELIVERED: def(
    'messaging:delivery-status:delivered',
    'ND_DELIVERED',
    'Provider delivered',
  ),
  NOTIF_DELIVERY_BOUNCED: def(
    'messaging:delivery-status:bounced',
    'ND_BOUNCED',
    'Provider bounced',
  ),
  NOTIF_DELIVERY_FAILED: def(
    'messaging:delivery-status:failed',
    'ND_FAILED',
    'Provider failed',
  ),
  // `RECEIPT_POSTED` ya existe (línea 447, recibo de pago); el acuse del
  // proveedor lleva prefijo `MSG_RECEIPT_`.
  MSG_RECEIPT_DELIVERED: def(
    'messaging:receipt-type:delivered',
    'RCPT_DELIVERED',
    'Delivered receipt',
  ),
  MSG_RECEIPT_BOUNCED: def(
    'messaging:receipt-type:bounced',
    'RCPT_BOUNCED',
    'Bounced receipt',
  ),
  MSG_RECEIPT_READ: def(
    'messaging:receipt-type:read',
    'RCPT_READ',
    'Read receipt',
  ),
  INAPP_UNREAD: def(
    'messaging:in-app-status:unread',
    'INAPP_UNREAD',
    'In-app notification unread',
  ),
  INAPP_READ: def(
    'messaging:in-app-status:read',
    'INAPP_READ',
    'In-app notification read',
  ),
  /** Canal que se entrega dentro del producto y no sale a ningún proveedor. */
  CHANNEL_TYPE_IN_APP: def(
    'messaging:channel-type:in-app',
    'CHANNEL_IN_APP',
    'In-app channel',
  ),
  /** Canal de correo electrónico (lo entrega un proveedor externo). */
  CHANNEL_TYPE_EMAIL: def(
    'messaging:channel-type:email',
    'CHANNEL_EMAIL',
    'Email channel',
  ),
  /**
   * Naturaleza del destinatario (`notification_requests.recipient_type_concept_id`).
   * Hoy toda notificación va dirigida a una cuenta interna; existen como concepto
   * propio —y no reutilizando `OWNER_USER`— porque la tabla admitirá destinatarios
   * que no son usuarios (un contacto de CRM, un endpoint de organización).
   */
  NOTIF_RECIPIENT_USER: def(
    'messaging:recipient-type:user',
    'NOTIF_RCPT_USER',
    'Notification recipient is a user account',
  ),
  /** Origen de la solicitud: la generó el propio backend, no una persona. */
  NOTIF_SOURCE_SYSTEM: def(
    'messaging:notification-source:system',
    'NOTIF_SRC_SYSTEM',
    'Notification originated by the system',
  ),
  /** El proveedor no reporta estado: se da por entregado al aceptarlo. */
  MSG_TRACKING_MODE_NONE: def(
    'messaging:tracking-mode:none',
    'MSG_TRACK_NONE',
    'No delivery tracking',
  ),
  /** Tipo de proveedor de mensajería que entrega correo. */
  MSG_PROVIDER_TYPE_EMAIL: def(
    'messaging:provider-type:email',
    'MSG_PROV_EMAIL',
    'Email messaging provider',
  ),
  /**
   * Tipo de proveedor del canal in-app. No hay nadie externo del otro lado: la
   * «entrega» es escribir en `in_app_notifications`. Existe porque
   * `provider_channel_configs` exige un proveedor y fingir que el in-app lo
   * entrega el proveedor de correo mezclaría dos entregabilidades distintas en
   * la misma métrica.
   */
  MSG_PROVIDER_TYPE_IN_APP: def(
    'messaging:provider-type:in-app',
    'MSG_PROV_IN_APP',
    'In-app messaging provider',
  ),

  /* --- Categorías de notificación (carril P1) -----------------------------
     La categoría es la unidad de preferencia: `recipient_preferences` guarda
     un opt-in por (usuario, canal, categoría), así que silenciar es silenciar
     una de estas cuatro. Son cuatro y no una por disparador porque quien
     configura razona en estos términos —«no me avises de lo social»— y una
     categoría por evento produciría una pantalla de preferencias que nadie
     termina de leer. Ver `messaging/notifications.contract.ts`. */
  /** Receta emitida, encuentro cerrado, resultado disponible. */
  NOTIF_CATEGORY_CLINICAL: def(
    'messaging:notification-category:clinical',
    'NOTIF_CAT_CLINICAL',
    'Clinical notifications',
  ),
  /** Cupo liberado, demora del profesional, recordatorio, cambio de cita. */
  NOTIF_CATEGORY_SCHEDULING: def(
    'messaging:notification-category:scheduling',
    'NOTIF_CAT_SCHEDULING',
    'Appointment notifications',
  ),
  /** Mensajería directa entre personas. */
  NOTIF_CATEGORY_MESSAGES: def(
    'messaging:notification-category:messages',
    'NOTIF_CAT_MESSAGES',
    'Direct message notifications',
  ),
  /** Muro, reacciones, comentarios, grupos. */
  NOTIF_CATEGORY_SOCIAL: def(
    'messaging:notification-category:social',
    'NOTIF_CAT_SOCIAL',
    'Social notifications',
  ),

  /**
   * Categorías de notificación de comunidad que consume la misma campana (P7).
   *
   * Se suman al mismo `category_concept_id` que las clínicas, y no a un canal
   * aparte, porque el destinatario tiene una sola bandeja: separar el aviso de
   * un grupo del de una receta obligaría a mirar dos lugares. Lo que sí las
   * separa es la categoría, que es justamente lo que `recipient_preferences`
   * necesita para que alguien silencie los grupos sin silenciar su receta.
   */
  NOTIF_CAT_GROUP_JOIN_APPROVED: def(
    'messaging:notification-category:group-join-approved',
    'NOTIF_CAT_GRP_JOINED',
    'Group membership approved',
  ),
  NOTIF_CAT_GROUP_NEW_POST: def(
    'messaging:notification-category:group-new-post',
    'NOTIF_CAT_GRP_POST',
    'New post in a group',
  ),

  // ==========================================================================
  // Módulo 32 · workflow — máquinas de estado y flujos entre dominios
  // ==========================================================================

  // --- Ciclo de vida de la definición ---
  // `TERM_DRAFT`/`TERM_ACTIVE`/`TERM_RETIRED` (líneas 225-227) son del ciclo de
  // vida terminológico; la definición de máquina lleva su propio prefijo `WF_DEF_`
  // porque publicar una versión de máquina y publicar un value set son decisiones
  // distintas, con auditoría distinta.
  WF_DEF_DRAFT: def(
    'workflow:definition-status:draft',
    'WFDEF_DRAFT',
    'State machine draft',
  ),
  WF_DEF_ACTIVE: def(
    'workflow:definition-status:active',
    'WFDEF_ACTIVE',
    'State machine active',
  ),
  WF_DEF_RETIRED: def(
    'workflow:definition-status:retired',
    'WFDEF_RETIRED',
    'State machine retired',
  ),
  /** Estado de las filas hijas (estados, transiciones, guardas, efectos). */
  WF_ELEMENT_ACTIVE: def(
    'workflow:element-status:active',
    'WFEL_ACTIVE',
    'Definition element active',
  ),

  // --- Guardas ---
  WF_GUARD_EXPRESSION: def(
    'workflow:guard-type:expression',
    'WFG_EXPRESSION',
    'Expression guard',
  ),
  WF_GUARD_PERMISSION: def(
    'workflow:guard-type:permission',
    'WFG_PERMISSION',
    'Permission guard',
  ),
  WF_GUARD_STATE: def(
    'workflow:guard-type:state',
    'WFG_STATE',
    'State precondition guard',
  ),

  // --- Efectos laterales ---
  WF_EFFECT_OUTBOX: def(
    'workflow:side-effect-type:outbox',
    'WFSE_OUTBOX',
    'Outbox event effect',
  ),
  WF_EFFECT_TASK: def(
    'workflow:side-effect-type:task',
    'WFSE_TASK',
    'Task creation effect',
  ),
  WF_EFFECT_NOTIFICATION: def(
    'workflow:side-effect-type:notification',
    'WFSE_NOTIFY',
    'Notification effect',
  ),
  /**
   * Modo de ejecución del efecto. Síncrono se ejecuta dentro de la transacción de
   * la transición; asíncrono se relega al relay post-commit. La llamada externa
   * nunca es síncrona: dejaría la transacción abierta esperando a un tercero.
   */
  WF_EXEC_SYNCHRONOUS: def(
    'workflow:execution-mode:synchronous',
    'WFEX_SYNC',
    'Synchronous execution',
  ),
  WF_EXEC_ASYNCHRONOUS: def(
    'workflow:execution-mode:asynchronous',
    'WFEX_ASYNC',
    'Asynchronous execution',
  ),

  // --- Instancias de workflow ---
  WF_INSTANCE_ACTIVE: def(
    'workflow:instance-status:active',
    'WFI_ACTIVE',
    'Workflow instance active',
  ),
  WF_INSTANCE_RUNNING: def(
    'workflow:instance-status:running',
    'WFI_RUNNING',
    'Workflow instance running',
  ),
  // `TRACK_RETRY_SCHEDULED` (línea 1184) es del seguimiento de envíos; el
  // reintento de workflow es un estado de la instancia, no del envío.
  WF_INSTANCE_RETRY_SCHEDULED: def(
    'workflow:instance-status:retry-scheduled',
    'WFI_RETRY',
    'Workflow instance retry scheduled',
  ),
  WF_INSTANCE_ESCALATED: def(
    'workflow:instance-status:escalated',
    'WFI_ESCALATED',
    'Workflow instance escalated',
  ),
  WF_INSTANCE_EXPIRED: def(
    'workflow:instance-status:expired',
    'WFI_EXPIRED',
    'Workflow instance expired',
  ),
  WF_INSTANCE_COMPLETED: def(
    'workflow:instance-status:completed',
    'WFI_COMPLETED',
    'Workflow instance completed',
  ),

  // --- Tareas ---
  WF_TASK_OPEN: def(
    'workflow:task-status:open',
    'WFT_OPEN',
    'Workflow task open',
  ),
  WF_TASK_IN_PROGRESS: def(
    'workflow:task-status:in-progress',
    'WFT_IN_PROGRESS',
    'Workflow task in progress',
  ),
  WF_TASK_COMPLETED: def(
    'workflow:task-status:completed',
    'WFT_COMPLETED',
    'Workflow task completed',
  ),
  WF_TASK_ESCALATED: def(
    'workflow:task-status:escalated',
    'WFT_ESCALATED',
    'Workflow task escalated',
  ),
  WF_TASK_TYPE_APPROVAL: def(
    'workflow:task-type:approval',
    'WFTT_APPROVAL',
    'Approval task',
  ),
  WF_TASK_TYPE_REVIEW: def(
    'workflow:task-type:review',
    'WFTT_REVIEW',
    'Review task',
  ),
  WF_TASK_TYPE_ACTION: def(
    'workflow:task-type:action',
    'WFTT_ACTION',
    'Action task',
  ),

  // --- Motivos de transición ---
  // `ERROR_TIMEOUT` (línea 983) clasifica un error de ejecución de pruebas; el
  // vencimiento de un plazo de workflow es un motivo de transición legítimo, no
  // un error, y por eso no se reutiliza.
  WF_REASON_TIMEOUT: def('workflow:reason:timeout', 'WFR_TIMEOUT', 'Timed out'),
  WF_REASON_COMPENSATION: def(
    'workflow:reason:compensation',
    'WFR_COMPENSATION',
    'Saga compensation',
  ),
  WF_REASON_RETRY: def(
    'workflow:reason:retry',
    'WFR_RETRY',
    'Retry of a failed transition',
  ),
  WF_REASON_TASK_COMPLETED: def(
    'workflow:reason:task-completed',
    'WFR_TASK_DONE',
    'Triggered by task completion',
  ),
  WF_REASON_MANUAL: def(
    'workflow:reason:manual',
    'WFR_MANUAL',
    'Manual command',
  ),

  // --- Tipos de sujeto de la instancia ---
  WF_SUBJECT_ENCOUNTER: def(
    'workflow:subject-type:encounter',
    'WFS_ENCOUNTER',
    'Encounter subject',
  ),
  WF_SUBJECT_ORDER: def(
    'workflow:subject-type:order',
    'WFS_ORDER',
    'Order subject',
  ),
  WF_SUBJECT_CLAIM: def(
    'workflow:subject-type:claim',
    'WFS_CLAIM',
    'Claim subject',
  ),
  WF_SUBJECT_APPOINTMENT: def(
    'workflow:subject-type:appointment',
    'WFS_APPOINTMENT',
    'Appointment subject',
  ),

  // ==========================================================================
  // Módulo 48 · automation — agentes y orquestación multiagente
  // ==========================================================================
  //
  // Todo el bloque lleva prefijo `AUTO_` porque casi cada nombre natural ya está
  // tomado por otro dominio: `APPROVAL_PENDING` (línea 454, ERP), `STEP_*`
  // (líneas 550 y 1116, marketing y periop), `TRIGGER_*` (línea 915, reporting) y
  // `RUN_QUEUED` (línea 975, QA). Reutilizarlos mezclaría en la misma fila de
  // catálogo dos cosas que se auditan por separado.

  // --- Agentes y versiones ---
  AUTO_AGENT_DRAFT: def(
    'automation:agent-state:draft',
    'AUTO_AGENT_DRAFT',
    'Agent draft',
  ),
  AUTO_AGENT_ACTIVE: def(
    'automation:agent-state:active',
    'AUTO_AGENT_ACTIVE',
    'Agent active',
  ),
  AUTO_AGENT_RETIRED: def(
    'automation:agent-state:retired',
    'AUTO_AGENT_RETIRED',
    'Agent retired',
  ),
  AUTO_VERSION_DRAFT: def(
    'automation:version-status:draft',
    'AUTO_VER_DRAFT',
    'Agent version draft',
  ),
  AUTO_VERSION_PUBLISHED: def(
    'automation:version-status:published',
    'AUTO_VER_PUBLISHED',
    'Agent version published',
  ),
  AUTO_VERSION_DEPRECATED: def(
    'automation:version-status:deprecated',
    'AUTO_VER_DEPRECATED',
    'Agent version deprecated',
  ),
  AUTO_AGENT_TYPE_ASSISTANT: def(
    'automation:agent-type:assistant',
    'AUTO_AT_ASSISTANT',
    'Assistant agent',
  ),
  AUTO_AGENT_TYPE_ORCHESTRATOR: def(
    'automation:agent-type:orchestrator',
    'AUTO_AT_ORCHESTRATOR',
    'Orchestrator agent',
  ),
  AUTO_AGENT_TYPE_EXTRACTOR: def(
    'automation:agent-type:extractor',
    'AUTO_AT_EXTRACTOR',
    'Extractor agent',
  ),
  AUTO_AGENT_TYPE_CLASSIFIER: def(
    'automation:agent-type:classifier',
    'AUTO_AT_CLASSIFIER',
    'Classifier agent',
  ),
  /**
   * Nivel de autonomía (`vs_autonomy`). Es la escala que decide si el agente
   * propone, actúa con aprobación previa o actúa solo.
   */
  AUTO_AUTONOMY_SUGGEST_ONLY: def(
    'automation:autonomy:suggest-only',
    'AUTO_AUT_SUGGEST',
    'Suggests only',
  ),
  AUTO_AUTONOMY_ACT_WITH_APPROVAL: def(
    'automation:autonomy:act-with-approval',
    'AUTO_AUT_APPROVAL',
    'Acts with approval',
  ),
  AUTO_AUTONOMY_AUTONOMOUS: def(
    'automation:autonomy:autonomous',
    'AUTO_AUT_AUTONOMOUS',
    'Fully autonomous',
  ),

  // --- Herramientas y enlaces ---
  AUTO_TOOL_ACTIVE: def(
    'automation:tool-state:active',
    'AUTO_TOOL_ACTIVE',
    'Agent tool active',
  ),
  AUTO_TOOL_DISABLED: def(
    'automation:tool-state:disabled',
    'AUTO_TOOL_DISABLED',
    'Agent tool disabled',
  ),
  AUTO_TOOL_TYPE_HTTP_CALL: def(
    'automation:tool-type:http-call',
    'AUTO_TT_HTTP',
    'HTTP call tool',
  ),
  AUTO_TOOL_TYPE_DB_QUERY: def(
    'automation:tool-type:db-query',
    'AUTO_TT_DB',
    'Database query tool',
  ),
  AUTO_TOOL_TYPE_RECORD_WRITE: def(
    'automation:tool-type:record-write',
    'AUTO_TT_WRITE',
    'Record write tool',
  ),
  AUTO_TOOL_TYPE_SEARCH: def(
    'automation:tool-type:search',
    'AUTO_TT_SEARCH',
    'Search tool',
  ),
  AUTO_TOOL_TYPE_COMPUTATION: def(
    'automation:tool-type:computation',
    'AUTO_TT_COMPUTE',
    'Computation tool',
  ),
  AUTO_PERMISSION_ALLOW: def(
    'automation:permission-effect:allow',
    'AUTO_PERM_ALLOW',
    'Binding allows the tool',
  ),
  AUTO_PERMISSION_DENY: def(
    'automation:permission-effect:deny',
    'AUTO_PERM_DENY',
    'Binding denies the tool',
  ),

  // --- Guardrails ---
  AUTO_GUARDRAIL_CONTENT: def(
    'automation:guardrail-type:content',
    'AUTO_GR_CONTENT',
    'Content guardrail',
  ),
  AUTO_GUARDRAIL_COST: def(
    'automation:guardrail-type:cost',
    'AUTO_GR_COST',
    'Cost guardrail',
  ),
  AUTO_GUARDRAIL_PHI: def(
    'automation:guardrail-type:phi',
    'AUTO_GR_PHI',
    'PHI guardrail',
  ),
  AUTO_GUARDRAIL_RATE_LIMIT: def(
    'automation:guardrail-type:rate-limit',
    'AUTO_GR_RATE',
    'Rate limit guardrail',
  ),
  AUTO_GUARDRAIL_TOOL_RESTRICTION: def(
    'automation:guardrail-type:tool-restriction',
    'AUTO_GR_TOOL',
    'Tool restriction guardrail',
  ),
  AUTO_PHI_BLOCK: def(
    'automation:phi-handling:block',
    'AUTO_PHI_BLOCK',
    'Block PHI',
  ),
  AUTO_PHI_REDACT: def(
    'automation:phi-handling:redact',
    'AUTO_PHI_REDACT',
    'Redact PHI',
  ),
  AUTO_PHI_ALLOW: def(
    'automation:phi-handling:allow',
    'AUTO_PHI_ALLOW',
    'Allow PHI',
  ),
  /**
   * Grado de aplicación del guardrail. `block` detiene el paso; `warn` lo deja
   * pasar dejando constancia; `log` sólo registra.
   */
  AUTO_ENFORCEMENT_BLOCK: def(
    'automation:enforcement:block',
    'AUTO_ENF_BLOCK',
    'Blocking enforcement',
  ),
  AUTO_ENFORCEMENT_WARN: def(
    'automation:enforcement:warn',
    'AUTO_ENF_WARN',
    'Warning enforcement',
  ),
  AUTO_ENFORCEMENT_LOG: def(
    'automation:enforcement:log',
    'AUTO_ENF_LOG',
    'Log-only enforcement',
  ),

  // --- Workflows y pasos ---
  AUTO_WORKFLOW_DRAFT: def(
    'automation:workflow-state:draft',
    'AUTO_WF_DRAFT',
    'Automation workflow draft',
  ),
  AUTO_WORKFLOW_ACTIVE: def(
    'automation:workflow-state:active',
    'AUTO_WF_ACTIVE',
    'Automation workflow active',
  ),
  AUTO_WORKFLOW_ARCHIVED: def(
    'automation:workflow-state:archived',
    'AUTO_WF_ARCHIVED',
    'Automation workflow archived',
  ),
  AUTO_ORCHESTRATION_SEQUENTIAL: def(
    'automation:orchestration:sequential',
    'AUTO_ORCH_SEQ',
    'Sequential orchestration',
  ),
  AUTO_ORCHESTRATION_PARALLEL: def(
    'automation:orchestration:parallel',
    'AUTO_ORCH_PAR',
    'Parallel orchestration',
  ),
  AUTO_ORCHESTRATION_DAG: def(
    'automation:orchestration:dag',
    'AUTO_ORCH_DAG',
    'DAG orchestration',
  ),
  AUTO_ORCHESTRATION_SINGLE_AGENT: def(
    'automation:orchestration:single-agent',
    'AUTO_ORCH_SINGLE',
    'Single-agent orchestration',
  ),
  AUTO_STEP_AGENT_CALL: def(
    'automation:step-kind:agent-call',
    'AUTO_SK_AGENT',
    'Agent call step',
  ),
  AUTO_STEP_TOOL_CALL: def(
    'automation:step-kind:tool-call',
    'AUTO_SK_TOOL',
    'Tool call step',
  ),
  AUTO_STEP_THOUGHT: def(
    'automation:step-kind:thought',
    'AUTO_SK_THOUGHT',
    'Thought step',
  ),
  AUTO_STEP_DECISION: def(
    'automation:step-kind:decision',
    'AUTO_SK_DECISION',
    'Decision step',
  ),
  AUTO_STEP_HUMAN_APPROVAL: def(
    'automation:step-kind:human-approval',
    'AUTO_SK_APPROVAL',
    'Human approval step',
  ),
  AUTO_STEP_WAIT: def('automation:step-kind:wait', 'AUTO_SK_WAIT', 'Wait step'),

  // --- Disparadores ---
  AUTO_TRIGGER_ACTIVE: def(
    'automation:trigger-state:active',
    'AUTO_TRG_ACTIVE',
    'Trigger active',
  ),
  AUTO_TRIGGER_DISABLED: def(
    'automation:trigger-state:disabled',
    'AUTO_TRG_DISABLED',
    'Trigger disabled',
  ),
  AUTO_TRIGGER_TYPE_EVENT: def(
    'automation:trigger-type:event',
    'AUTO_TT_EVENT',
    'Event trigger',
  ),
  AUTO_TRIGGER_TYPE_SCHEDULE: def(
    'automation:trigger-type:schedule',
    'AUTO_TT_SCHEDULE',
    'Schedule trigger',
  ),
  AUTO_TRIGGER_TYPE_MANUAL: def(
    'automation:trigger-type:manual',
    'AUTO_TT_MANUAL',
    'Manual trigger',
  ),
  AUTO_TRIGGER_TYPE_WEBHOOK: def(
    'automation:trigger-type:webhook',
    'AUTO_TT_WEBHOOK',
    'Webhook trigger',
  ),
  /** De dónde sale el calendario: del propio disparador o de una campaña. */
  AUTO_SCHEDULE_SOURCE_INTERNAL: def(
    'automation:schedule-source:internal',
    'AUTO_SS_INTERNAL',
    'Internal schedule',
  ),
  AUTO_SCHEDULE_SOURCE_CAMPAIGN: def(
    'automation:schedule-source:campaign',
    'AUTO_SS_CAMPAIGN',
    'Campaign schedule',
  ),

  // --- Ejecuciones ---
  AUTO_RUN_QUEUED: def(
    'automation:run-status:queued',
    'AUTO_RUN_QUEUED',
    'Workflow run queued',
  ),
  AUTO_RUN_RUNNING: def(
    'automation:run-status:running',
    'AUTO_RUN_RUNNING',
    'Workflow run running',
  ),
  /** El run está detenido esperando una decisión humana, no un recurso. */
  AUTO_RUN_WAITING: def(
    'automation:run-status:waiting',
    'AUTO_RUN_WAITING',
    'Workflow run waiting',
  ),
  AUTO_RUN_COMPLETED: def(
    'automation:run-status:completed',
    'AUTO_RUN_COMPLETED',
    'Workflow run completed',
  ),
  AUTO_RUN_FAILED: def(
    'automation:run-status:failed',
    'AUTO_RUN_FAILED',
    'Workflow run failed',
  ),
  AUTO_RUN_CANCELLED: def(
    'automation:run-status:cancelled',
    'AUTO_RUN_CANCELLED',
    'Workflow run cancelled',
  ),
  AUTO_SOURCE_EVENT: def(
    'automation:trigger-source:event',
    'AUTO_SRC_EVENT',
    'Started by event',
  ),
  AUTO_SOURCE_SCHEDULE: def(
    'automation:trigger-source:schedule',
    'AUTO_SRC_SCHEDULE',
    'Started by schedule',
  ),
  AUTO_SOURCE_MANUAL: def(
    'automation:trigger-source:manual',
    'AUTO_SRC_MANUAL',
    'Started manually',
  ),

  AUTO_AGENT_RUN_RUNNING: def(
    'automation:agent-run-status:running',
    'AUTO_AR_RUNNING',
    'Agent run running',
  ),
  AUTO_AGENT_RUN_PAUSED: def(
    'automation:agent-run-status:paused',
    'AUTO_AR_PAUSED',
    'Agent run paused',
  ),
  AUTO_AGENT_RUN_SUCCEEDED: def(
    'automation:agent-run-status:succeeded',
    'AUTO_AR_SUCCEEDED',
    'Agent run succeeded',
  ),
  AUTO_AGENT_RUN_FAILED: def(
    'automation:agent-run-status:failed',
    'AUTO_AR_FAILED',
    'Agent run failed',
  ),
  AUTO_AGENT_RUN_CANCELLED: def(
    'automation:agent-run-status:cancelled',
    'AUTO_AR_CANCELLED',
    'Agent run cancelled',
  ),

  AUTO_STEP_SUCCEEDED: def(
    'automation:step-status:succeeded',
    'AUTO_SS_SUCCEEDED',
    'Agent step succeeded',
  ),
  AUTO_STEP_FAILED: def(
    'automation:step-status:failed',
    'AUTO_SS_FAILED',
    'Agent step failed',
  ),
  /** El paso quedó detenido porque necesita una aprobación que aún no llega. */
  AUTO_STEP_AWAITING_APPROVAL: def(
    'automation:step-status:awaiting-approval',
    'AUTO_SS_AWAITING',
    'Agent step awaiting approval',
  ),
  AUTO_STEP_BLOCKED: def(
    'automation:step-status:blocked',
    'AUTO_SS_BLOCKED',
    'Agent step blocked by guardrail',
  ),

  // --- Aprobaciones ---
  AUTO_APPROVAL_PENDING: def(
    'automation:approval-status:pending',
    'AUTO_APR_PENDING',
    'Automation approval pending',
  ),
  AUTO_APPROVAL_APPROVED: def(
    'automation:approval-status:approved',
    'AUTO_APR_APPROVED',
    'Automation approval approved',
  ),
  AUTO_APPROVAL_REJECTED: def(
    'automation:approval-status:rejected',
    'AUTO_APR_REJECTED',
    'Automation approval rejected',
  ),
  AUTO_APPROVAL_TYPE_TOOL_WRITE: def(
    'automation:approval-type:tool-write',
    'AUTO_APT_WRITE',
    'Write tool approval',
  ),
  AUTO_APPROVAL_TYPE_PHI_ACCESS: def(
    'automation:approval-type:phi-access',
    'AUTO_APT_PHI',
    'PHI access approval',
  ),
  AUTO_APPROVAL_TYPE_COST: def(
    'automation:approval-type:cost-exceeded',
    'AUTO_APT_COST',
    'Cost threshold approval',
  ),

  // --- Memoria ---
  AUTO_MEMORY_ACTIVE: def(
    'automation:memory-status:active',
    'AUTO_MEM_ACTIVE',
    'Memory active',
  ),
  AUTO_MEMORY_EXPIRED: def(
    'automation:memory-status:expired',
    'AUTO_MEM_EXPIRED',
    'Memory expired',
  ),
  AUTO_MEMORY_SCOPE_GLOBAL: def(
    'automation:memory-scope:global',
    'AUTO_MS_GLOBAL',
    'Global memory scope',
  ),
  AUTO_MEMORY_SCOPE_WORKFLOW: def(
    'automation:memory-scope:workflow',
    'AUTO_MS_WORKFLOW',
    'Workflow memory scope',
  ),
  AUTO_MEMORY_SCOPE_ENTITY: def(
    'automation:memory-scope:entity',
    'AUTO_MS_ENTITY',
    'Entity memory scope',
  ),
  AUTO_MEMORY_SCOPE_RUN: def(
    'automation:memory-scope:run',
    'AUTO_MS_RUN',
    'Run memory scope',
  ),
  AUTO_MEMORY_TYPE_FACT: def(
    'automation:memory-type:fact',
    'AUTO_MT_FACT',
    'Fact memory',
  ),
  AUTO_MEMORY_TYPE_PREFERENCE: def(
    'automation:memory-type:preference',
    'AUTO_MT_PREFERENCE',
    'Preference memory',
  ),
  AUTO_MEMORY_TYPE_SUMMARY: def(
    'automation:memory-type:summary',
    'AUTO_MT_SUMMARY',
    'Summary memory',
  ),
  AUTO_MEMORY_TYPE_EPISODIC: def(
    'automation:memory-type:episodic',
    'AUTO_MT_EPISODIC',
    'Episodic memory',
  ),

  // --- Escritura de registros ---
  /**
   * `draft` deja el registro pendiente de revisión humana; `direct` escribe; `upsert`
   * escribe o actualiza según la clave de deduplicación.
   */
  AUTO_WRITE_MODE_DRAFT: def(
    'automation:write-mode:draft',
    'AUTO_WM_DRAFT',
    'Write as draft',
  ),
  AUTO_WRITE_MODE_DIRECT: def(
    'automation:write-mode:direct',
    'AUTO_WM_DIRECT',
    'Write directly',
  ),
  AUTO_WRITE_MODE_UPSERT: def(
    'automation:write-mode:upsert',
    'AUTO_WM_UPSERT',
    'Write as upsert',
  ),
  AUTO_ACTION_CREATE: def(
    'automation:action:create',
    'AUTO_ACT_CREATE',
    'Create record',
  ),
  AUTO_ACTION_UPDATE: def(
    'automation:action:update',
    'AUTO_ACT_UPDATE',
    'Update record',
  ),
  AUTO_ACTION_UPSERT: def(
    'automation:action:upsert',
    'AUTO_ACT_UPSERT',
    'Upsert record',
  ),
  AUTO_RECORD_AUTOMATION_ACTIVE: def(
    'automation:record-automation-state:active',
    'AUTO_RA_ACTIVE',
    'Record automation active',
  ),
} as const;

/**
 * Define el tipo de dominio concept name.
 */
export type ConceptName = keyof typeof CONCEPT_DEFS;

/**
 * Mapa `nombre -> UUID` resuelto en tiempo de carga del módulo. Es lo que
 * consumen servicios y repositorios: `CONCEPTS.USER_ACTIVE` es un UUID estable.
 */
export const CONCEPTS: Readonly<Record<ConceptName, string>> = Object.freeze(
  Object.fromEntries(
    Object.keys(CONCEPT_DEFS).map((name) => [
      name,
      deterministicId(CONCEPT_DEFS[name].key),
    ]),
  ) as Record<ConceptName, string>,
);
