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
  const namespaceBytes = Buffer.from(SALUD_UUID_NAMESPACE.replace(/-/g, ''), 'hex');
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
  codeSystemVersionId: deterministicId('seed:code-system-version:mantra-core:1.0.0'),
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
};

/**
 * Definición declarativa de cada concepto: clave estable, código FHIR y display.
 * El seed itera sobre este mapa; el resto del código referencia `CONCEPTS.<X>`.
 */
interface ConceptDef {
  readonly key: string;
  readonly code: string;
  readonly display: string;
}

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
  USER_ANONYMIZED: def('iam:user-status:anonymized', 'USER_ANONYMIZED', 'User anonymized'),

  // --- Estado MFA del usuario (iam.users.mfa_status_concept_id) ---
  MFA_DISABLED: def('iam:mfa-status:disabled', 'MFA_DISABLED', 'MFA disabled'),
  MFA_ENABLED: def('iam:mfa-status:enabled', 'MFA_ENABLED', 'MFA enabled'),

  // --- Métodos de credencial (iam.authentication_credentials.method_concept_id) ---
  CRED_PASSWORD: def('iam:cred-method:password', 'PASSWORD', 'Password credential'),
  CRED_FEDERATED: def('iam:cred-method:federated', 'FEDERATED', 'Federated credential'),
  HASH_ARGON2ID: def('iam:hash-algo:argon2id', 'ARGON2ID', 'Argon2id'),

  // --- Tipos de factor MFA (iam.mfa_factors.factor_type_concept_id) ---
  MFA_TOTP: def('iam:mfa-factor:totp', 'TOTP', 'TOTP factor'),
  MFA_WEBAUTHN: def('iam:mfa-factor:webauthn', 'WEBAUTHN', 'WebAuthn factor'),

  // --- Plataformas de dispositivo (iam.devices.platform_concept_id) ---
  PLATFORM_IOS: def('iam:platform:ios', 'IOS', 'iOS'),
  PLATFORM_ANDROID: def('iam:platform:android', 'ANDROID', 'Android'),
  PLATFORM_WEB: def('iam:platform:web', 'WEB', 'Web'),

  // --- Roles globales (iam.user_global_roles.role_concept_id) ---
  ROLE_SUPERADMIN: def('iam:role:superadmin', 'SUPERADMIN', 'Super administrator'),
  ROLE_SECURITY_ADMIN: def('iam:role:security-admin', 'SECURITY_ADMIN', 'Security administrator'),
  ROLE_USER: def('iam:role:user', 'USER', 'Standard user'),

  // --- Bloqueo de cuenta (iam.account_lockouts.*) ---
  LOCK_REASON_FAILED_ATTEMPTS: def('iam:lock-reason:failed-attempts', 'FAILED_ATTEMPTS', 'Too many failed attempts'),
  LOCK_REASON_MANUAL: def('iam:lock-reason:manual', 'MANUAL_LOCK', 'Manual administrative lock'),
  LOCKOUT_ACTIVE: def('iam:lockout-status:active', 'LOCKOUT_ACTIVE', 'Lockout active'),
  LOCKOUT_RELEASED: def('iam:lockout-status:released', 'LOCKOUT_RELEASED', 'Lockout released'),

  // --- Tipos de evento de seguridad (iam.security_events.event_type_concept_id) ---
  SEC_LOGIN: def('iam:sec-event:login', 'LOGIN', 'Login'),
  SEC_LOGIN_FAILED: def('iam:sec-event:login-failed', 'LOGIN_FAILED', 'Login failed'),
  SEC_TOKEN_REFRESH: def('iam:sec-event:token-refresh', 'TOKEN_REFRESH', 'Token refresh'),
  SEC_TOKEN_REUSE: def('iam:sec-event:token-reuse', 'TOKEN_REUSE', 'Refresh token reuse detected'),
  SEC_LOGOUT_ALL: def('iam:sec-event:logout-all', 'LOGOUT_ALL', 'Global logout'),
  SEC_ACCOUNT_LOCK: def('iam:sec-event:account-lock', 'ACCOUNT_LOCK', 'Account locked'),
  SEC_CRED_REVOKE: def('iam:sec-event:cred-revoke', 'CRED_REVOKE', 'Credential revoked'),
  SEC_ANONYMIZE: def('iam:sec-event:anonymize', 'ANONYMIZE', 'Account anonymized'),
  SEC_ROLE_GRANT: def('iam:sec-event:role-grant', 'ROLE_GRANT', 'Global role granted'),
  SEC_ROLE_REVOKE: def('iam:sec-event:role-revoke', 'ROLE_REVOKE', 'Global role revoked'),
  SEC_MFA_ENROLL: def('iam:sec-event:mfa-enroll', 'MFA_ENROLL', 'MFA factor enrolled'),
  SEC_DEVICE_TRUST: def('iam:sec-event:device-trust', 'DEVICE_TRUST', 'Device trusted'),
  SEC_CRED_FEDERATED_LINK: def('iam:sec-event:federated-link', 'FEDERATED_LINK', 'Federated credential linked'),
  SEC_SESSION_PURGE: def('iam:sec-event:session-purge', 'SESSION_PURGE', 'Sessions purged'),

  // --- Resultado de evento de seguridad (iam.security_events.outcome_concept_id) ---
  OUTCOME_SUCCESS: def('iam:outcome:success', 'SUCCESS', 'Success'),
  OUTCOME_FAILURE: def('iam:outcome:failure', 'FAILURE', 'Failure'),

  // --- Common: sistemas de identificador y tipos de contacto ---
  CONTACT_EMAIL: def('common:contact-system:email', 'EMAIL', 'Email'),
  CONTACT_PHONE: def('common:contact-system:phone', 'PHONE', 'Phone'),
  CONTACT_UNVERIFIED: def('common:contact-state:unverified', 'CP_UNVERIFIED', 'Contact unverified'),
  CONTACT_VERIFIED: def('common:contact-state:verified', 'CP_VERIFIED', 'Contact verified'),

  // --- Common: estados de archivo/versión ---
  FILE_ACTIVE: def('common:file-state:active', 'FILE_ACTIVE', 'File active'),
  FILE_DELETED: def('common:file-state:deleted', 'FILE_DELETED', 'File soft-deleted'),
  FILE_VERSION_PENDING_SCAN: def('common:file-version-state:pending-scan', 'FV_PENDING_SCAN', 'Version pending scan'),
  FILE_VERSION_CLEAN: def('common:file-version-state:clean', 'FV_CLEAN', 'Version clean'),
  FILE_VERSION_QUARANTINED: def('common:file-version-state:quarantined', 'FV_QUARANTINED', 'Version quarantined'),

  // --- Common: tipos de propietario polimórfico (owner_type_concept_id) ---
  OWNER_USER: def('common:owner-type:user', 'OWNER_USER', 'User'),
  OWNER_PATIENT: def('common:owner-type:patient', 'OWNER_PATIENT', 'Patient'),
  OWNER_TENANT: def('common:owner-type:tenant', 'OWNER_TENANT', 'Tenant'),

  // --- Common: identificadores oficiales ---
  ID_TYPE_NATIONAL: def('common:id-type:national', 'NATIONAL_ID', 'National ID'),
  ID_TYPE_MRN: def('common:id-type:mrn', 'MRN', 'Medical record number'),
  ID_TYPE_PASSPORT: def('common:id-type:passport', 'PASSPORT', 'Passport'),
  USE_OFFICIAL: def('common:use:official', 'OFFICIAL', 'Official'),
  USE_SECONDARY: def('common:use:secondary', 'SECONDARY', 'Secondary'),

  // --- Common: uso de contacto y dirección ---
  CONTACT_USE_HOME: def('common:contact-use:home', 'HOME', 'Home'),
  CONTACT_USE_WORK: def('common:contact-use:work', 'WORK', 'Work'),
  ADDR_USE_HOME: def('common:addr-use:home', 'ADDR_HOME', 'Home address'),
  ADDR_TYPE_POSTAL: def('common:addr-type:postal', 'POSTAL', 'Postal'),
  COUNTRY_PE: def('common:country:pe', 'PE', 'Peru'),

  // --- Common: archivos ---
  FILE_CATEGORY_DOCUMENT: def('common:file-category:document', 'DOCUMENT', 'Document'),
  FILE_CATEGORY_IMAGE: def('common:file-category:image', 'IMAGE', 'Image'),
  SENSITIVITY_NORMAL: def('common:sensitivity:normal', 'NORMAL', 'Normal sensitivity'),
  SENSITIVITY_PHI: def('common:sensitivity:phi', 'PHI', 'Protected health information'),
  RETENTION_STANDARD: def('common:retention:standard', 'RETENTION_STD', 'Standard retention'),

  // --- Common: versiones de archivo (storage, hashing, cifrado, escaneo) ---
  STORAGE_PROVIDER_S3: def('common:storage-provider:s3', 'S3', 'S3-compatible object storage'),
  STORAGE_REGION_DEFAULT: def('common:storage-region:default', 'REGION_DEFAULT', 'Default region'),
  CHECKSUM_SHA256: def('common:checksum:sha256', 'SHA256', 'SHA-256'),
  ENCRYPTION_AT_REST: def('common:encryption:at-rest', 'AT_REST', 'Encrypted at rest'),
  ENCRYPTION_NONE: def('common:encryption:none', 'ENC_NONE', 'Not encrypted'),
  SCAN_PENDING: def('common:scan:pending', 'SCAN_PENDING', 'Scan pending'),
  SCAN_CLEAN: def('common:scan:clean', 'SCAN_CLEAN', 'Scan clean'),
  SCAN_INFECTED: def('common:scan:infected', 'SCAN_INFECTED', 'Scan infected'),
  INTEGRITY_VERIFIED: def('common:integrity:verified', 'INTEGRITY_OK', 'Integrity verified'),

  // --- Common: derivados y vínculos ---
  DERIVATIVE_THUMBNAIL: def('common:derivative:thumbnail', 'THUMBNAIL', 'Thumbnail'),
  DERIVATIVE_OCR: def('common:derivative:ocr', 'OCR', 'OCR text'),
  LINK_ROLE_ATTACHMENT: def('common:link-role:attachment', 'ATTACHMENT', 'Attachment'),
  VISIBILITY_INTERNAL: def('common:visibility:internal', 'INTERNAL', 'Internal'),

  // --- Consent: categoría de propósito de procesamiento (para el seed) ---
  PURPOSE_CATEGORY_CARE: def('consent:purpose-category:care', 'CARE', 'Direct care'),

  // --- Directory: tenant por defecto ---
  TENANT_TYPE_PROVIDER: def('directory:tenant-type:provider', 'PROVIDER', 'Healthcare provider'),
  LEGAL_ENTITY_COMPANY: def('directory:legal-entity:company', 'COMPANY', 'Company'),
  TENANT_ACTIVE: def('directory:tenant-status:active', 'TENANT_ACTIVE', 'Tenant active'),
  TENANT_VERIFIED: def('directory:tenant-verification:verified', 'TENANT_VERIFIED', 'Tenant verified'),

  // --- Terminology: estados del ciclo de vida de catálogos ---
  TERM_DRAFT: def('terminology:state:draft', 'TERM_DRAFT', 'Draft'),
  TERM_ACTIVE: def('terminology:state:active', 'TERM_ACTIVE', 'Active'),
  TERM_RETIRED: def('terminology:state:retired', 'TERM_RETIRED', 'Retired'),
  TERM_DEPRECATED: def('terminology:state:deprecated', 'TERM_DEPRECATED', 'Deprecated'),

  // --- Terminology: metadatos de catálogo (24-30) ---
  SRC_TYPE_EXTERNAL: def('terminology:source-type:external', 'SRC_EXTERNAL', 'External source'),
  CS_CONTENT_COMPLETE: def('terminology:content-type:complete', 'COMPLETE', 'Complete'),
  LANG_ES: def('terminology:language:es', 'ES', 'Spanish'),
  LANG_EN: def('terminology:language:en', 'EN', 'English'),
  DESIG_PREFERRED: def('terminology:designation-type:preferred', 'DESIG_PREFERRED', 'Preferred designation'),
  DESIG_SYNONYM: def('terminology:designation-type:synonym', 'DESIG_SYNONYM', 'Synonym'),
  REL_IS_A: def('terminology:relationship:is-a', 'IS_A', 'Is a'),
  REL_PART_OF: def('terminology:relationship:part-of', 'PART_OF', 'Part of'),
  VS_OP_IN: def('terminology:vs-operator:in', 'IN', 'In'),
  VS_OP_IS_A: def('terminology:vs-operator:is-a', 'VS_IS_A', 'Is-a (transitive)'),
} as const;

export type ConceptName = keyof typeof CONCEPT_DEFS;

/**
 * Mapa `nombre -> UUID` resuelto en tiempo de carga del módulo. Es lo que
 * consumen servicios y repositorios: `CONCEPTS.USER_ACTIVE` es un UUID estable.
 */
export const CONCEPTS: Readonly<Record<ConceptName, string>> = Object.freeze(
  Object.fromEntries(
    (Object.keys(CONCEPT_DEFS) as ConceptName[]).map((name) => [
      name,
      deterministicId(CONCEPT_DEFS[name].key),
    ]),
  ) as Record<ConceptName, string>,
);
