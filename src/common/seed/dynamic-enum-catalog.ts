import { CONCEPTS, CONCEPT_DEFS, deterministicId } from '../constants/concepts';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { DIR } from '../../modules/directory/directory.concepts';
import { CLIN } from '../../modules/clinical/clinical.concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';

/**
 * Catálogo declarativo de las enumeraciones bien conocidas de la plataforma.
 *
 * ## Qué problema resuelve
 *
 * La regla del modelo es que todo campo `*_concept_id` se llena desde un selector
 * poblado por terminología, nunca a mano. Para poblarlo hace falta saber **qué
 * conjunto de valores** gobierna ese campo, y hasta ahora eso no estaba en ningún
 * sitio que un cliente pudiera leer: el único `GET` de conjuntos exigía su uuid,
 * y los uuid no eran constantes publicadas. Un formulario no tenía forma de
 * ofrecer sus campos de catálogo sin hardcodear identificadores que el siguiente
 * `load_seeds` invalidaba.
 *
 * El modelo ya tenía la respuesta y estaba vacía: `system_context.dynamic_enum_bindings`
 * ata `esquema.tabla.columna` a una `dynamic_enum_definitions`, y ésta a un
 * `terminology.value_sets`. Este archivo declara ese amarre; `DynamicEnumSeedService`
 * lo materializa y `SystemContextController` lo publica en lectura.
 *
 * ## Por qué los identificadores son deterministas
 *
 * Todo lo que el seed materializa deriva su uuid por UUIDv5 de una clave estable
 * (`valueSetId('administrative-gender')`, etc.), igual que los conceptos. Así el
 * mismo código produce el mismo identificador en local, en CI y en producción, y
 * un cliente puede memoizar por `code` sin que un re-seed le cambie el suelo.
 *
 * ## Cómo se añade una enumeración
 *
 * Una entrada más en `DYNAMIC_ENUM_CATALOG`: código estable, nombre, los
 * conceptos que la componen (en el orden en que se ofrecen) y los campos que
 * gobierna. El `code` y el `display` de cada opción **no** se escriben aquí: se
 * resuelven del catálogo de conceptos ya sembrado, de modo que no puedan
 * divergir de él.
 */

/** Una enumeración bien conocida: su conjunto de valores y los campos que gobierna. */
export interface DynamicEnumCatalogEntry {
  /**
   * Código estable de la enumeración. Es también el `internal_code` del conjunto
   * de valores y la clave con la que el cliente la pide.
   */
  readonly code: string;
  /** Nombre legible, para la vitrina de catálogos y los selectores. */
  readonly name: string;
  /** Qué gobierna y por qué, en una línea. */
  readonly description: string;
  /**
   * Conceptos que componen la enumeración, en el orden en que se ofrecen. El
   * primero es el valor por defecto sugerido salvo que `defaultConceptId` diga otra cosa.
   */
  readonly concepts: readonly string[];
  /** Concepto preseleccionado; por defecto ninguno. */
  readonly defaultConceptId?: string;
  /**
   * Campos `esquema.tabla.columna` gobernados por esta enumeración. Un campo no
   * puede estar en dos enumeraciones a la vez (lo impone `createBinding`).
   */
  readonly targets: readonly string[];
}

/** Identificador determinista del conjunto de valores de una enumeración. */
export function valueSetId(code: string): string {
  return deterministicId(`seed:value-set:${code}`);
}

/** Identificador determinista de la versión 1 del conjunto de valores. */
export function valueSetVersionId(code: string): string {
  return deterministicId(`seed:value-set-version:${code}:1`);
}

/** Identificador determinista de un miembro de la expansión. */
export function valueSetMemberId(code: string, conceptId: string): string {
  return deterministicId(`seed:value-set-member:${code}:${conceptId}`);
}

/** Identificador determinista de la definición de enumeración. */
export function enumDefinitionId(code: string): string {
  return deterministicId(`seed:dynamic-enum:${code}`);
}

/** Identificador determinista de la versión 1 de la definición. */
export function enumVersionId(code: string): string {
  return deterministicId(`seed:dynamic-enum-version:${code}:1`);
}

/** Identificador determinista de una opción de la versión. */
export function enumOptionId(code: string, conceptId: string): string {
  return deterministicId(`seed:dynamic-enum-option:${code}:${conceptId}`);
}

/** Identificador determinista del amarre de la enumeración a un campo. */
export function enumBindingId(code: string, target: string): string {
  return deterministicId(`seed:dynamic-enum-binding:${code}:${target}`);
}

/** URL canónica del conjunto de valores, en el espacio de nombres del proyecto. */
export function valueSetCanonicalUrl(code: string): string {
  return `https://mantracore.health/fhir/ValueSet/${code}`;
}

/**
 * Índice `conceptId -> { code, display }` sobre todo el catálogo sembrado (base
 * transversal + conceptos de cada módulo).
 *
 * Existe para que una entrada del catálogo sólo tenga que nombrar sus conceptos:
 * el código y el rótulo de cada opción se leen de la única fuente que los define,
 * así que no pueden quedar desincronizados de la fila que el seed materializó.
 */
export const CONCEPT_INDEX_BY_ID: ReadonlyMap<
  string,
  {
    /** Código FHIR del concepto. */
    code: string;
    /** Rótulo legible del concepto. */
    display: string;
  }
> = new Map([
  ...Object.values(CONCEPT_DEFS).map(
    (definition) =>
      [
        deterministicId(definition.key),
        { code: definition.code, display: definition.display },
      ] as const,
  ),
  ...MODULE_CONCEPT_SEEDS.map(
    (seed) =>
      [
        deterministicId(seed.key),
        { code: seed.code, display: seed.display },
      ] as const,
  ),
]);

/**
 * Las enumeraciones que la plataforma publica.
 *
 * Es un catálogo inicial, no exhaustivo: cubre los campos de catálogo de los
 * formularios de `iam`, `common`, `directory` y `profiles`, que son los que hoy
 * no se podían pintar. Ampliarlo es añadir una entrada.
 */
export const DYNAMIC_ENUM_CATALOG: readonly DynamicEnumCatalogEntry[] = [
  // --- profiles: persona y paciente ---
  {
    code: 'administrative-gender',
    name: 'Género administrativo',
    description:
      'Género con el que la persona consta a efectos administrativos (HL7 FHIR AdministrativeGender).',
    concepts: [
      PROF.GENDER_MALE,
      PROF.GENDER_FEMALE,
      PROF.GENDER_OTHER,
      PROF.GENDER_UNKNOWN,
    ],
    targets: ['profiles.persons.administrative_gender_concept_id'],
  },
  {
    code: 'sex-at-birth',
    name: 'Sexo al nacer',
    description:
      'Sexo asignado al nacer. Es un dato clínico distinto del género: condiciona rangos de referencia y tamizajes.',
    concepts: [
      PROF.BIRTH_SEX_MALE,
      PROF.BIRTH_SEX_FEMALE,
      PROF.BIRTH_SEX_INTERSEX,
      PROF.BIRTH_SEX_UNKNOWN,
    ],
    targets: ['profiles.persons.sex_at_birth_concept_id'],
  },
  {
    code: 'person-status',
    name: 'Estado de la persona',
    description: 'Ciclo de vida del registro de persona.',
    concepts: [PROF.PERSON_ACTIVE, PROF.PERSON_INACTIVE, PROF.PERSON_MERGED],
    defaultConceptId: PROF.PERSON_ACTIVE,
    targets: ['profiles.persons.person_status_concept_id'],
  },
  {
    code: 'vital-status',
    name: 'Estado vital',
    description: 'Si la persona consta viva o fallecida.',
    concepts: [PROF.VITAL_ALIVE, PROF.VITAL_DECEASED],
    defaultConceptId: PROF.VITAL_ALIVE,
    targets: ['profiles.persons.vital_status_concept_id'],
  },
  {
    code: 'patient-record-linkage-status',
    name: 'Estado de vinculación del paciente',
    description:
      'Estado del registro frente al índice maestro de pacientes (MPI).',
    concepts: [PROF.LINKAGE_UNLINKED, PROF.LINKAGE_LINKED, PROF.LINKAGE_MERGED],
    defaultConceptId: PROF.LINKAGE_UNLINKED,
    targets: ['profiles.patient_profiles.record_linkage_status_concept_id'],
  },
  {
    code: 'identity-link-type',
    name: 'Tipo de vínculo de identidad',
    description: 'Naturaleza del vínculo con una identidad externa.',
    concepts: [PROF.IDENTITY_LINK_MPI],
    targets: ['profiles.patient_identity_links.link_type_concept_id'],
  },
  {
    code: 'identity-link-verification-status',
    name: 'Verificación del vínculo de identidad',
    description: 'Si el vínculo de identidad externa fue verificado.',
    concepts: [PROF.IDENTITY_UNVERIFIED, PROF.IDENTITY_VERIFIED],
    defaultConceptId: PROF.IDENTITY_UNVERIFIED,
    targets: ['profiles.patient_identity_links.verification_status_concept_id'],
  },
  {
    code: 'patient-merge-reason',
    name: 'Motivo de fusión de pacientes',
    description: 'Por qué se fusionan dos registros de paciente.',
    concepts: [PROF.MERGE_REASON_DUPLICATE],
    defaultConceptId: PROF.MERGE_REASON_DUPLICATE,
    targets: ['profiles.patient_merge_events.reason_concept_id'],
  },
  {
    code: 'patient-merge-decision-status',
    name: 'Decisión sobre la fusión',
    description: 'Si la fusión sigue en pie o fue revertida.',
    concepts: [PROF.MERGE_APPROVED, PROF.MERGE_REVERSED],
    defaultConceptId: PROF.MERGE_APPROVED,
    targets: ['profiles.patient_merge_events.decision_status_concept_id'],
  },
  {
    code: 'related-person-relationship',
    name: 'Parentesco de la persona relacionada',
    description: 'Relación de la persona de contacto con el paciente.',
    concepts: [PROF.RELATIONSHIP_GUARDIAN],
    targets: ['profiles.related_persons.relationship_concept_id'],
  },
  {
    code: 'related-person-status',
    name: 'Estado de la persona relacionada',
    description: 'Si el vínculo con la persona de contacto sigue vigente.',
    concepts: [PROF.RELATED_ACTIVE],
    defaultConceptId: PROF.RELATED_ACTIVE,
    targets: ['profiles.related_persons.status_concept_id'],
  },
  {
    code: 'portal-proxy-status',
    name: 'Estado del apoderado de portal',
    description: 'Si la representación en el portal sigue vigente.',
    concepts: [PROF.PROXY_ACTIVE, PROF.PROXY_REVOKED],
    defaultConceptId: PROF.PROXY_ACTIVE,
    targets: ['profiles.patient_portal_proxies.status_concept_id'],
  },
  {
    code: 'account-link-type',
    name: 'Tipo de vínculo de cuenta',
    description: 'A qué título la cuenta de portal representa a la persona.',
    concepts: [PROF.ACCOUNT_LINK_SELF],
    defaultConceptId: PROF.ACCOUNT_LINK_SELF,
    targets: ['profiles.person_account_links.link_type_concept_id'],
  },
  {
    code: 'account-link-status',
    name: 'Estado del vínculo de cuenta',
    description: 'Estado del vínculo entre una persona y su cuenta de portal.',
    concepts: [
      PROF.ACCOUNT_LINK_ACTIVE,
      PROF.ACCOUNT_LINK_SUPERSEDED,
      PROF.ACCOUNT_LINK_REVOKED,
    ],
    defaultConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    targets: ['profiles.person_account_links.status_concept_id'],
  },

  // --- profiles: fuerza laboral de salud ---
  {
    code: 'practitioner-category',
    name: 'Categoría del profesional',
    description: 'Categoría profesional con la que ejerce.',
    concepts: [PROF.PRACT_CATEGORY_GENERAL],
    defaultConceptId: PROF.PRACT_CATEGORY_GENERAL,
    targets: [
      'profiles.health_practitioner_profiles.practitioner_category_concept_id',
    ],
  },
  {
    code: 'practitioner-verification-status',
    name: 'Verificación del profesional',
    description: 'Si el profesional de salud fue verificado.',
    concepts: [PROF.PRACT_VERIF_PENDING, PROF.PRACT_VERIF_VERIFIED],
    defaultConceptId: PROF.PRACT_VERIF_PENDING,
    targets: [
      'profiles.health_practitioner_profiles.verification_status_concept_id',
    ],
  },
  {
    code: 'practitioner-practice-status',
    name: 'Estado de ejercicio del profesional',
    description: 'Si el profesional ya ejerce o sigue en incorporación.',
    concepts: [PROF.PRACTICE_ONBOARDING, PROF.PRACTICE_ACTIVE],
    defaultConceptId: PROF.PRACTICE_ONBOARDING,
    targets: [
      'profiles.health_practitioner_profiles.practice_status_concept_id',
    ],
  },
  {
    code: 'professional-credential-type',
    name: 'Tipo de credencial profesional',
    description: 'Qué acredita el documento presentado.',
    concepts: [PROF.CREDENTIAL_TYPE_DEGREE],
    defaultConceptId: PROF.CREDENTIAL_TYPE_DEGREE,
    targets: ['profiles.professional_credentials.credential_type_concept_id'],
  },
  {
    code: 'professional-credential-status',
    name: 'Estado de la credencial profesional',
    description: 'Situación de verificación de una credencial académica.',
    concepts: [PROF.CRED_PENDING, PROF.CRED_VERIFIED, PROF.CRED_REJECTED],
    defaultConceptId: PROF.CRED_PENDING,
    targets: ['profiles.professional_credentials.state_concept_id'],
  },
  {
    code: 'jurisdiction',
    name: 'Jurisdicción',
    description: 'Ámbito territorial de la licencia para ejercer.',
    concepts: [PROF.JURISDICTION_NATIONAL],
    defaultConceptId: PROF.JURISDICTION_NATIONAL,
    targets: ['profiles.jurisdiction_authorizations.jurisdiction_concept_id'],
  },
  {
    code: 'jurisdiction-authorization-status',
    name: 'Estado de la autorización jurisdiccional',
    description: 'Situación de la licencia para ejercer en una jurisdicción.',
    concepts: [PROF.AUTH_PENDING, PROF.AUTH_ACTIVE, PROF.AUTH_EXPIRED],
    defaultConceptId: PROF.AUTH_PENDING,
    targets: ['profiles.jurisdiction_authorizations.state_concept_id'],
  },
  {
    code: 'practitioner-specialty',
    name: 'Especialidad',
    description: 'Especialidad clínica declarada por el profesional.',
    concepts: [PROF.SPECIALTY_GENERAL],
    defaultConceptId: PROF.SPECIALTY_GENERAL,
    targets: ['profiles.practitioner_specialties.specialty_concept_id'],
  },
  {
    code: 'practitioner-specialty-role',
    name: 'Rol de la especialidad',
    description: 'Si la especialidad es la principal o una secundaria.',
    concepts: [PROF.SPECIALTY_ROLE_PRIMARY],
    defaultConceptId: PROF.SPECIALTY_ROLE_PRIMARY,
    targets: ['profiles.practitioner_specialties.specialty_role_concept_id'],
  },
  {
    code: 'practitioner-specialty-verification-status',
    name: 'Verificación de la especialidad',
    description: 'Si la especialidad declarada fue verificada.',
    concepts: [PROF.SPEC_VERIF_PENDING, PROF.SPEC_VERIF_VERIFIED],
    defaultConceptId: PROF.SPEC_VERIF_PENDING,
    targets: [
      'profiles.practitioner_specialties.verification_status_concept_id',
    ],
  },

  // --- directory: organizaciones, membresías y sucursales ---
  {
    code: 'tenant-type',
    name: 'Tipo de organización',
    description:
      'Naturaleza de la organización. Decide qué perfil de tenant se aplica al alta.',
    concepts: [
      CONCEPTS.TENANT_TYPE_PROVIDER,
      CONCEPTS.TENANT_TYPE_HOSPITAL,
      CONCEPTS.TENANT_TYPE_MEDICAL_OFFICE,
      CONCEPTS.TENANT_TYPE_NURSING,
      CONCEPTS.TENANT_TYPE_PHARMACY,
      CONCEPTS.TENANT_TYPE_UNIVERSITY,
      CONCEPTS.TENANT_TYPE_PAYER,
      CONCEPTS.TENANT_TYPE_BROKER,
      CONCEPTS.TENANT_TYPE_HEALTH_BUSINESS,
      CONCEPTS.TENANT_TYPE_HEALTH_OTHER,
    ],
    targets: ['directory.tenants.tenant_type_concept_id'],
  },
  {
    code: 'tenant-status',
    name: 'Estado de la organización',
    description: 'Ciclo de vida de la organización dentro de la plataforma.',
    concepts: [
      DIR.TENANT_PENDING,
      CONCEPTS.TENANT_ACTIVE,
      DIR.TENANT_SUSPENDED,
    ],
    defaultConceptId: DIR.TENANT_PENDING,
    targets: ['directory.tenants.status_concept_id'],
  },
  {
    code: 'tenant-verification-status',
    name: 'Verificación de la organización',
    description: 'Si la documentación de la organización fue comprobada.',
    concepts: [DIR.TENANT_UNVERIFIED, CONCEPTS.TENANT_VERIFIED],
    defaultConceptId: DIR.TENANT_UNVERIFIED,
    targets: ['directory.tenants.verification_status_concept_id'],
  },
  {
    code: 'membership-status',
    name: 'Estado de la membresía',
    description: 'Situación de una persona dentro de la organización.',
    concepts: [
      DIR.MEMBERSHIP_INVITED,
      DIR.MEMBERSHIP_ACTIVE,
      DIR.MEMBERSHIP_SUSPENDED,
      DIR.MEMBERSHIP_ENDED,
    ],
    defaultConceptId: DIR.MEMBERSHIP_INVITED,
    targets: ['directory.tenant_memberships.status_concept_id'],
  },
  {
    code: 'tenant-role',
    name: 'Rol en la organización',
    description:
      'Rol de negocio con el que la persona actúa en la organización. No es un rol global de plataforma.',
    concepts: [DIR.ROLE_OWNER, DIR.ROLE_ADMIN, DIR.ROLE_STAFF],
    defaultConceptId: DIR.ROLE_STAFF,
    targets: ['directory.tenant_memberships.tenant_role_concept_id'],
  },
  {
    code: 'membership-access-scope',
    name: 'Alcance de acceso de la membresía',
    description:
      'Si la persona alcanza toda la organización o sólo las sucursales asignadas.',
    concepts: [DIR.SCOPE_ALL_TENANT, DIR.SCOPE_BRANCH],
    defaultConceptId: DIR.SCOPE_ALL_TENANT,
    targets: ['directory.tenant_memberships.access_scope_concept_id'],
  },
  {
    code: 'branch-type',
    name: 'Tipo de sucursal',
    description: 'Naturaleza del punto de atención.',
    concepts: [DIR.BRANCH_TYPE_CLINIC, DIR.BRANCH_TYPE_OFFICE],
    targets: ['directory.branches.branch_type_concept_id'],
  },
  {
    code: 'branch-status',
    name: 'Estado de la sucursal',
    description: 'Si la sucursal opera o está suspendida.',
    concepts: [DIR.BRANCH_ACTIVE, DIR.BRANCH_SUSPENDED],
    defaultConceptId: DIR.BRANCH_ACTIVE,
    targets: ['directory.branches.status_concept_id'],
  },
  {
    code: 'branch-membership-status',
    name: 'Estado de la asignación de sucursal',
    description: 'Si la asignación a la sucursal sigue vigente.',
    concepts: [DIR.BRANCH_MEMBERSHIP_ACTIVE, DIR.BRANCH_MEMBERSHIP_ENDED],
    defaultConceptId: DIR.BRANCH_MEMBERSHIP_ACTIVE,
    targets: ['directory.branch_memberships.status_concept_id'],
  },
  {
    code: 'branch-local-role',
    name: 'Rol local en la sucursal',
    description: 'Rol con el que la persona actúa en esa sucursal concreta.',
    concepts: [DIR.LOCAL_ROLE_STAFF],
    defaultConceptId: DIR.LOCAL_ROLE_STAFF,
    targets: ['directory.branch_memberships.local_role_concept_id'],
  },

  // --- iam: cuenta y seguridad ---
  {
    code: 'user-status',
    name: 'Estado del usuario',
    description: 'Situación de la cuenta de acceso.',
    concepts: [
      CONCEPTS.USER_ACTIVE,
      CONCEPTS.USER_LOCKED,
      CONCEPTS.USER_ANONYMIZED,
    ],
    defaultConceptId: CONCEPTS.USER_ACTIVE,
    targets: ['iam.users.status_concept_id'],
  },
  {
    code: 'mfa-status',
    name: 'Estado del segundo factor',
    description: 'Si la cuenta exige segundo factor.',
    concepts: [CONCEPTS.MFA_DISABLED, CONCEPTS.MFA_ENABLED],
    defaultConceptId: CONCEPTS.MFA_DISABLED,
    targets: ['iam.users.mfa_status_concept_id'],
  },
  {
    code: 'mfa-factor-type',
    name: 'Tipo de factor de MFA',
    description: 'Mecanismo del segundo factor que se da de alta.',
    concepts: [CONCEPTS.MFA_TOTP, CONCEPTS.MFA_WEBAUTHN],
    targets: ['iam.mfa_factors.factor_type_concept_id'],
  },
  {
    code: 'mfa-factor-state',
    name: 'Estado del factor de MFA',
    description: 'Si el factor ya fue verificado o quedó revocado.',
    concepts: [
      CONCEPTS.STATE_PENDING,
      CONCEPTS.STATE_VERIFIED,
      CONCEPTS.STATE_REVOKED,
    ],
    defaultConceptId: CONCEPTS.STATE_PENDING,
    targets: ['iam.mfa_factors.state_concept_id'],
  },

  // --- common: contacto, dirección y archivos ---
  {
    code: 'contact-point-system',
    name: 'Canal del punto de contacto',
    description: 'Por qué medio se alcanza a la persona u organización.',
    concepts: [CONCEPTS.CONTACT_EMAIL, CONCEPTS.CONTACT_PHONE],
    targets: ['common.contact_points.system_concept_id'],
  },
  {
    code: 'contact-point-use',
    name: 'Uso del punto de contacto',
    description: 'En qué ámbito se usa ese medio de contacto.',
    concepts: [CONCEPTS.CONTACT_USE_HOME, CONCEPTS.CONTACT_USE_WORK],
    targets: ['common.contact_points.use_concept_id'],
  },
  {
    code: 'address-use',
    name: 'Uso de la dirección',
    description: 'En qué ámbito se usa la dirección.',
    concepts: [CONCEPTS.ADDR_USE_HOME],
    defaultConceptId: CONCEPTS.ADDR_USE_HOME,
    targets: ['common.addresses.use_concept_id'],
  },
  {
    code: 'address-type',
    name: 'Tipo de dirección',
    description: 'Naturaleza de la dirección registrada.',
    concepts: [CONCEPTS.ADDR_TYPE_POSTAL],
    defaultConceptId: CONCEPTS.ADDR_TYPE_POSTAL,
    targets: ['common.addresses.type_concept_id'],
  },
  {
    code: 'file-category',
    name: 'Categoría del archivo',
    description: 'Qué clase de contenido se está subiendo.',
    concepts: [CONCEPTS.FILE_CATEGORY_DOCUMENT, CONCEPTS.FILE_CATEGORY_IMAGE],
    targets: ['common.files.category_concept_id'],
  },
  {
    code: 'file-lifecycle-status',
    name: 'Estado del archivo',
    description: 'Si el archivo está vigente o dado de baja.',
    concepts: [CONCEPTS.FILE_ACTIVE, CONCEPTS.FILE_DELETED],
    defaultConceptId: CONCEPTS.FILE_ACTIVE,
    targets: ['common.files.lifecycle_status_concept_id'],
  },
  {
    code: 'malware-scan-status',
    name: 'Resultado del análisis antivirus',
    description: 'Situación del análisis de la versión subida.',
    concepts: [
      CONCEPTS.SCAN_PENDING,
      CONCEPTS.SCAN_CLEAN,
      CONCEPTS.SCAN_INFECTED,
    ],
    defaultConceptId: CONCEPTS.SCAN_PENDING,
    targets: ['common.file_versions.malware_scan_status_concept_id'],
  },

  /* --- clinical: la receta ---------------------------------------------------
     Las tres primeras enumeraciones clínicas del catálogo. Existen porque sin
     ellas la ficha del paciente **no puede prescribir**: el selector resuelve
     sus opciones por binding de columna y, sin amarre declarado, queda
     deshabilitado por diseño —no cae a texto libre, que en un `*_concept_id`
     sería un dato inválido o, peor, uno válido de otro conjunto—.

     `medication` es un catálogo INICIAL, no un vademécum; ver la nota en
     `clinical.concepts.ts`. Las otras dos sí son enumeraciones cerradas. */
  {
    code: 'medication',
    name: 'Medicamento',
    description:
      'Vademécum inicial para prescribir (ATC). Se reemplaza publicando una versión nueva del conjunto, sin tocar el amarre.',
    concepts: [
      CLIN.MEDICATION_PARACETAMOL,
      CLIN.MEDICATION_IBUPROFENO,
      CLIN.MEDICATION_AMOXICILINA,
      CLIN.MEDICATION_AZITROMICINA,
      CLIN.MEDICATION_CEFALEXINA,
      CLIN.MEDICATION_OMEPRAZOL,
      CLIN.MEDICATION_METFORMINA,
      CLIN.MEDICATION_LOSARTAN,
      CLIN.MEDICATION_ENALAPRIL,
      CLIN.MEDICATION_ATORVASTATINA,
      CLIN.MEDICATION_SALBUTAMOL,
      CLIN.MEDICATION_LORATADINA,
    ],
    // Sin preseleccionado a propósito: un medicamento por omisión es la clase de
    // ayuda que termina prescrita sin que nadie la haya elegido.
    targets: ['clinical.medication_requests.medication_concept_id'],
  },
  {
    code: 'medication-route',
    name: 'Vía de administración',
    description: 'Por dónde se administra el medicamento prescrito.',
    concepts: [
      CLIN.MEDICATION_ROUTE_ORAL,
      CLIN.MEDICATION_ROUTE_INTRAVENOUS,
      CLIN.MEDICATION_ROUTE_INTRAMUSCULAR,
      CLIN.MEDICATION_ROUTE_SUBCUTANEOUS,
      CLIN.MEDICATION_ROUTE_TOPICAL,
      CLIN.MEDICATION_ROUTE_INHALATION,
    ],
    targets: ['clinical.medication_requests.route_concept_id'],
  },
  {
    code: 'medication-unit',
    name: 'Unidad de la cantidad',
    description: 'Unidad UCUM de la cantidad prescrita.',
    concepts: [
      CLIN.MEDICATION_UNIT_MILLIGRAM,
      CLIN.MEDICATION_UNIT_GRAM,
      CLIN.MEDICATION_UNIT_MILLILITRE,
      CLIN.MEDICATION_UNIT_TABLET,
      CLIN.MEDICATION_UNIT_CAPSULE,
      CLIN.MEDICATION_UNIT_DROP,
    ],
    targets: ['clinical.medication_requests.unit_concept_id'],
  },
];

/**
 * Partes de un campo destino `esquema.tabla.columna`.
 *
 * Se valida en vez de confiar: un destino mal escrito crearía un amarre que
 * ningún formulario resolvería jamás, y el fallo aparecería mucho después, en la
 * pantalla, sin rastro de dónde vino.
 */
export function splitTarget(target: string): {
  /** Esquema de la tabla destino. */
  schemaName: string;
  /** Tabla destino. */
  entityName: string;
  /** Columna destino. */
  fieldName: string;
} {
  const parts = target.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new Error(
      `Destino de enumeración mal formado: "${target}". Se espera "esquema.tabla.columna".`,
    );
  }
  return {
    schemaName: parts[0],
    entityName: parts[1],
    fieldName: parts[2],
  };
}
