import { CONCEPTS, CONCEPT_DEFS, deterministicId } from '../constants/concepts';
import { PROF } from '../../modules/profiles/profiles.concepts';
import { DIR } from '../../modules/directory/directory.concepts';
import { CHART } from '../../modules/chart/chart.concepts';
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
  // `profiles.practitioner_specialties.specialty_concept_id` no tiene enumeración
  // dinámica a propósito: la gobierna `VS_MEDICAL_SPECIALTY` —las 36 especialidades
  // que siembra el paquete del modelo—, y el front y `MedicalSpecialtyCatalogService`
  // la resuelven por terminología. Acá hubo un duplicado (`practitioner-specialty`,
  // un solo miembro en inglés) que era el único atado a la columna: por eso pedir el
  // catálogo por campo destino devolvía una sola opción y un médico no podía decir
  // que es cardiólogo (F-19). Re-declararlo lo resucitaría sólo en bases nuevas.
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
    code: 'legal-entity-type',
    name: 'Forma societaria',
    description:
      'Figura jurídica con la que la organización está constituida, según el derecho comercial boliviano.',
    concepts: [
      CONCEPTS.LEGAL_ENTITY_SOLE_PROPRIETORSHIP,
      CONCEPTS.LEGAL_ENTITY_SRL,
      CONCEPTS.LEGAL_ENTITY_LTDA,
      CONCEPTS.LEGAL_ENTITY_SA,
      CONCEPTS.LEGAL_ENTITY_GENERAL_PARTNERSHIP,
      CONCEPTS.LEGAL_ENTITY_LIMITED_PARTNERSHIP,
      CONCEPTS.LEGAL_ENTITY_PARTNERSHIP_BY_SHARES,
      CONCEPTS.LEGAL_ENTITY_FOREIGN_BRANCH,
    ],
    // Sin preseleccionado: la forma societaria es un hecho registral, y el que
    // viniera puesto por omisión sería el que más filas tendría al final sin que
    // nadie lo hubiera declarado. Justamente el dato que el registro de procesos
    // quiere contar («cuantos proveedores tenemos con SRL, UNIPERSONAL y S.A.»).
    targets: ['directory.tenants.legal_entity_type_concept_id'],
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
      'Vademécum esencial para prescribir (LINAME / lista modelo OMS, códigos ATC). ' +
      'Se amplía publicando una versión nueva del conjunto, sin tocar el amarre.',
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
      CLIN.MEDICATION_ACIDO_ACETILSALICILICO,
      CLIN.MEDICATION_DICLOFENACO,
      CLIN.MEDICATION_NAPROXENO,
      CLIN.MEDICATION_TRAMADOL,
      CLIN.MEDICATION_MORFINA,
      CLIN.MEDICATION_AMOXICILINA_CLAVULANICO,
      CLIN.MEDICATION_BENCILPENICILINA,
      CLIN.MEDICATION_CEFTRIAXONA,
      CLIN.MEDICATION_CLARITROMICINA,
      CLIN.MEDICATION_CIPROFLOXACINO,
      CLIN.MEDICATION_COTRIMOXAZOL,
      CLIN.MEDICATION_DOXICICLINA,
      CLIN.MEDICATION_GENTAMICINA,
      CLIN.MEDICATION_METRONIDAZOL,
      CLIN.MEDICATION_NITROFURANTOINA,
      CLIN.MEDICATION_FLUCONAZOL,
      CLIN.MEDICATION_ALBENDAZOL,
      CLIN.MEDICATION_MEBENDAZOL,
      CLIN.MEDICATION_AMLODIPINO,
      CLIN.MEDICATION_ATENOLOL,
      CLIN.MEDICATION_BISOPROLOL,
      CLIN.MEDICATION_FUROSEMIDA,
      CLIN.MEDICATION_HIDROCLOROTIAZIDA,
      CLIN.MEDICATION_ESPIRONOLACTONA,
      CLIN.MEDICATION_SIMVASTATINA,
      CLIN.MEDICATION_DIGOXINA,
      CLIN.MEDICATION_WARFARINA,
      CLIN.MEDICATION_INSULINA_NPH,
      CLIN.MEDICATION_INSULINA_RAPIDA,
      CLIN.MEDICATION_GLIBENCLAMIDA,
      CLIN.MEDICATION_LEVOTIROXINA,
      CLIN.MEDICATION_PREDNISONA,
      CLIN.MEDICATION_DEXAMETASONA,
      CLIN.MEDICATION_METOCLOPRAMIDA,
      CLIN.MEDICATION_SALES_REHIDRATACION,
      CLIN.MEDICATION_CETIRIZINA,
      CLIN.MEDICATION_BUDESONIDA,
      CLIN.MEDICATION_IPRATROPIO,
      CLIN.MEDICATION_DIAZEPAM,
      CLIN.MEDICATION_CLONAZEPAM,
      CLIN.MEDICATION_CARBAMAZEPINA,
      CLIN.MEDICATION_ACIDO_VALPROICO,
      CLIN.MEDICATION_FENITOINA,
      CLIN.MEDICATION_FLUOXETINA,
      CLIN.MEDICATION_SERTRALINA,
      CLIN.MEDICATION_AMITRIPTILINA,
      CLIN.MEDICATION_HALOPERIDOL,
      CLIN.MEDICATION_SULFATO_FERROSO,
      CLIN.MEDICATION_ACIDO_FOLICO,
      CLIN.MEDICATION_ALOPURINOL,
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

  /* --- clinical: el diagnóstico ----------------------------------------------
     Las enumeraciones de `clinical.conditions`, por la misma razón que las de la
     receta: sin amarre declarado, el selector del formulario de diagnóstico
     (V08-08) queda deshabilitado por diseño y el médico no puede registrar.

     `condition-code` es un catálogo INICIAL, no una nosología; ver la nota en
     `clinical.concepts.ts`. Las otras tres sí son enumeraciones cerradas. */
  {
    code: 'condition-code',
    name: 'Diagnóstico',
    description:
      'Nosología inicial para registrar diagnósticos (CIE-10). Se reemplaza publicando una versión nueva del conjunto, sin tocar el amarre.',
    concepts: [
      CLIN.CONDITION_HIPERTENSION,
      CLIN.CONDITION_DIABETES_TIPO_2,
      CLIN.CONDITION_IRA_ALTA,
      CLIN.CONDITION_LUMBALGIA,
      CLIN.CONDITION_MIGRANA,
      CLIN.CONDITION_GASTRITIS,
      CLIN.CONDITION_ASMA,
      CLIN.CONDITION_ANEMIA_FERROPENICA,
      CLIN.CONDITION_INFECCION_URINARIA,
      CLIN.CONDITION_DERMATITIS_ATOPICA,
      CLIN.CONDITION_HIPOTIROIDISMO,
      CLIN.CONDITION_ANSIEDAD_GENERALIZADA,
      // --- CIE-10 ambulatorio ampliado (v4.1.5) --------------------------------
      // El desplegable tenía doce entradas: un médico no encontraba lo suyo y
      // terminaba eligiendo lo más parecido, que ensucia la historia más que no
      // registrar nada. Éstos cubren la consulta ambulatoria y de urgencias por
      // aparato, más los síntomas (R) para lo que se anota antes de tener
      // diagnóstico y los motivos de contacto sin enfermedad (Z).
      CLIN.CONDITION_DIARREA_INFECCIOSA,
      CLIN.CONDITION_FIEBRE_TIFOIDEA,
      CLIN.CONDITION_AMEBIASIS,
      CLIN.CONDITION_TUBERCULOSIS_PULMONAR,
      CLIN.CONDITION_CHAGAS_CRONICA,
      CLIN.CONDITION_DENGUE,
      CLIN.CONDITION_VARICELA,
      CLIN.CONDITION_HERPES_ZOSTER,
      CLIN.CONDITION_CANDIDIASIS,
      CLIN.CONDITION_MICOSIS_SUPERFICIAL,
      CLIN.CONDITION_PARASITOSIS_INTESTINAL,
      CLIN.CONDITION_VIH,
      CLIN.CONDITION_ANEMIA_NO_ESPECIFICADA,
      CLIN.CONDITION_TROMBOCITOPENIA,
      CLIN.CONDITION_DIABETES_TIPO_1,
      CLIN.CONDITION_DIABETES_GESTACIONAL,
      CLIN.CONDITION_HIPERTIROIDISMO,
      CLIN.CONDITION_BOCIO,
      CLIN.CONDITION_OBESIDAD,
      CLIN.CONDITION_SOBREPESO,
      CLIN.CONDITION_DISLIPIDEMIA,
      CLIN.CONDITION_HIPERCOLESTEROLEMIA,
      CLIN.CONDITION_DESNUTRICION,
      CLIN.CONDITION_DEFICIENCIA_VITAMINA_D,
      CLIN.CONDITION_HIPERURICEMIA,
      CLIN.CONDITION_SINDROME_METABOLICO,
      CLIN.CONDITION_DEPRESION,
      CLIN.CONDITION_TRASTORNO_SUENO,
      CLIN.CONDITION_TRASTORNO_PANICO,
      CLIN.CONDITION_DEMENCIA,
      CLIN.CONDITION_TDAH,
      CLIN.CONDITION_DEPENDENCIA_ALCOHOL,
      CLIN.CONDITION_DEPENDENCIA_TABACO,
      CLIN.CONDITION_CEFALEA_TENSIONAL,
      CLIN.CONDITION_EPILEPSIA,
      CLIN.CONDITION_NEUROPATIA_DIABETICA,
      CLIN.CONDITION_PARKINSON,
      CLIN.CONDITION_VERTIGO,
      CLIN.CONDITION_SINDROME_TUNEL_CARPIANO,
      CLIN.CONDITION_CIATICA,
      CLIN.CONDITION_CONJUNTIVITIS,
      CLIN.CONDITION_CATARATA,
      CLIN.CONDITION_GLAUCOMA,
      CLIN.CONDITION_MIOPIA,
      CLIN.CONDITION_OTITIS_MEDIA,
      CLIN.CONDITION_HIPOACUSIA,
      CLIN.CONDITION_INSUFICIENCIA_CARDIACA,
      CLIN.CONDITION_FIBRILACION_AURICULAR,
      CLIN.CONDITION_CARDIOPATIA_ISQUEMICA,
      CLIN.CONDITION_INFARTO_AGUDO_MIOCARDIO,
      CLIN.CONDITION_ANGINA,
      CLIN.CONDITION_ACV,
      CLIN.CONDITION_VARICES,
      CLIN.CONDITION_TROMBOSIS_VENOSA,
      CLIN.CONDITION_HIPOTENSION,
      CLIN.CONDITION_FARINGITIS,
      CLIN.CONDITION_AMIGDALITIS,
      CLIN.CONDITION_SINUSITIS,
      CLIN.CONDITION_BRONQUITIS_AGUDA,
      CLIN.CONDITION_NEUMONIA,
      CLIN.CONDITION_EPOC,
      CLIN.CONDITION_RINITIS_ALERGICA,
      CLIN.CONDITION_INFLUENZA,
      CLIN.CONDITION_COVID19,
      CLIN.CONDITION_ERGE,
      CLIN.CONDITION_ULCERA_PEPTICA,
      CLIN.CONDITION_SINDROME_INTESTINO_IRRITABLE,
      CLIN.CONDITION_ESTRENIMIENTO,
      CLIN.CONDITION_HEMORROIDES,
      CLIN.CONDITION_COLELITIASIS,
      CLIN.CONDITION_APENDICITIS,
      CLIN.CONDITION_HERNIA_INGUINAL,
      CLIN.CONDITION_HIGADO_GRASO,
      CLIN.CONDITION_PANCREATITIS,
      CLIN.CONDITION_CARIES,
      CLIN.CONDITION_GINGIVITIS,
      CLIN.CONDITION_PERIODONTITIS,
      CLIN.CONDITION_ACNE,
      CLIN.CONDITION_PSORIASIS,
      CLIN.CONDITION_URTICARIA,
      CLIN.CONDITION_CELULITIS,
      CLIN.CONDITION_DERMATITIS_CONTACTO,
      CLIN.CONDITION_ALOPECIA,
      CLIN.CONDITION_ARTROSIS_RODILLA,
      CLIN.CONDITION_ARTROSIS_CADERA,
      CLIN.CONDITION_ARTRITIS_REUMATOIDE,
      CLIN.CONDITION_GOTA,
      CLIN.CONDITION_OSTEOPOROSIS,
      CLIN.CONDITION_CERVICALGIA,
      CLIN.CONDITION_TENDINITIS_HOMBRO,
      CLIN.CONDITION_ESGUINCE_TOBILLO,
      CLIN.CONDITION_FIBROMIALGIA,
      CLIN.CONDITION_ESCOLIOSIS,
      CLIN.CONDITION_ENFERMEDAD_RENAL_CRONICA,
      CLIN.CONDITION_LITIASIS_RENAL,
      CLIN.CONDITION_HIPERPLASIA_PROSTATICA,
      CLIN.CONDITION_VAGINITIS,
      CLIN.CONDITION_MIOMA_UTERINO,
      CLIN.CONDITION_DISMENORREA,
      CLIN.CONDITION_MENOPAUSIA,
      CLIN.CONDITION_INFERTILIDAD,
      CLIN.CONDITION_EMBARAZO_NORMAL,
      CLIN.CONDITION_PREECLAMPSIA,
      CLIN.CONDITION_AMENAZA_ABORTO,
      CLIN.CONDITION_ANEMIA_EMBARAZO,
      CLIN.CONDITION_ICTERICIA_NEONATAL,
      CLIN.CONDITION_BAJO_PESO_NACER,
      CLIN.CONDITION_BRONQUIOLITIS,
      CLIN.CONDITION_OTITIS_EXTERNA,
      CLIN.CONDITION_FIEBRE,
      CLIN.CONDITION_DOLOR_ABDOMINAL,
      CLIN.CONDITION_DOLOR_TORACICO,
      CLIN.CONDITION_DISNEA,
      CLIN.CONDITION_TOS,
      CLIN.CONDITION_MAREO,
      CLIN.CONDITION_ASTENIA,
      CLIN.CONDITION_EDEMA,
      CLIN.CONDITION_PERDIDA_PESO,
      CLIN.CONDITION_SINCOPE,
      CLIN.CONDITION_PALPITACIONES,
      CLIN.CONDITION_FRACTURA_ANTEBRAZO,
      CLIN.CONDITION_HERIDA_CORTANTE,
      CLIN.CONDITION_QUEMADURA,
      CLIN.CONDITION_CONTUSION,
      CLIN.CONDITION_TRAUMATISMO_CRANEAL,
      CLIN.CONDITION_CONTROL_SALUD,
      CLIN.CONDITION_VACUNACION,
      CLIN.CONDITION_ANTICONCEPCION,
      CLIN.CONDITION_CERTIFICADO_MEDICO,
      CLIN.CONDITION_CONTROL_NINO_SANO,
    ],
    // Sin preseleccionado a propósito, como el medicamento: un diagnóstico por
    // omisión es la clase de ayuda que termina en la historia sin que nadie lo
    // haya decidido.
    targets: ['clinical.conditions.code_concept_id'],
  },
  {
    code: 'condition-category',
    name: 'Categoría del diagnóstico',
    description:
      'Si el registro es un diagnóstico del encuentro o un problema de la lista (HL7 condition-category).',
    concepts: [
      CLIN.CONDITION_CATEGORY_DIAGNOSIS,
      CLIN.CONDITION_CATEGORY_PROBLEM,
    ],
    targets: ['clinical.conditions.category_concept_id'],
  },
  {
    code: 'condition-severity',
    name: 'Severidad',
    description:
      'Gravedad subjetiva de la condición según quien la registra (HL7 condition-severity).',
    concepts: [
      CLIN.CONDITION_SEVERITY_MILD,
      CLIN.CONDITION_SEVERITY_MODERATE,
      CLIN.CONDITION_SEVERITY_SEVERE,
    ],
    targets: ['clinical.conditions.severity_concept_id'],
  },
  {
    code: 'condition-laterality',
    name: 'Lateralidad',
    description: 'Lado del cuerpo afectado, cuando aplica.',
    concepts: [
      CLIN.CONDITION_LATERALITY_LEFT,
      CLIN.CONDITION_LATERALITY_RIGHT,
      CLIN.CONDITION_LATERALITY_BILATERAL,
    ],
    targets: ['clinical.conditions.laterality_concept_id'],
  },
  /* Patch v4.0.8 — estado clínico y cronicidad. `condition-clinical-status`
     gobierna la transición que ofrece `POST /clinical/conditions/:id/change-status`
     (no el alta: el alta sigue fijando `CONDITION_ACTIVE` sin preguntar). Antes de
     este patch el catálogo sólo traía `CONDITION_ACTIVE`, así que una condición no
     tenía a dónde ir. */
  {
    code: 'condition-clinical-status',
    name: 'Estado clínico del diagnóstico',
    description:
      'Ciclo de vida clínico de una condición (HL7 condition-clinical). Gobierna tanto el alta como la transición.',
    concepts: [
      CLIN.CONDITION_ACTIVE,
      CLIN.CONDITION_RECURRENCE,
      CLIN.CONDITION_RELAPSE,
      CLIN.CONDITION_INACTIVE,
      CLIN.CONDITION_REMISSION,
      CLIN.CONDITION_RESOLVED,
    ],
    defaultConceptId: CLIN.CONDITION_ACTIVE,
    targets: ['clinical.conditions.clinical_status_concept_id'],
  },
  {
    code: 'condition-clinical-course',
    name: 'Curso clínico del diagnóstico',
    description:
      'Si la condición es aguda (con resolución esperada) o crónica (seguimiento continuo, sin resolución). Eje distinto del estado clínico.',
    concepts: [
      CLIN.CONDITION_COURSE_ACUTE,
      CLIN.CONDITION_COURSE_CHRONIC,
      CLIN.CONDITION_COURSE_SUBACUTE,
      CLIN.CONDITION_COURSE_RECURRENT,
      CLIN.CONDITION_COURSE_UNKNOWN,
    ],
    // Sin preseleccionado a propósito, como el diagnóstico: no declarar el curso
    // clínico es un dato legítimo (`CONDITION_COURSE_UNKNOWN` está para eso), no
    // un olvido que convenga rellenar con un valor por omisión.
    targets: ['clinical.conditions.clinical_course_concept_id'],
  },

  /* --- clinical.service_requests --------------------------------------------
     Las cinco columnas de catálogo de la orden de estudios. Ninguna estaba
     amarrada: la pantalla de órdenes respondía «El catálogo de estudios no está
     publicado» y `code_concept_id` es NOT NULL, así que pedir un laboratorio o
     una radiografía era imposible de punta a punta. Es el mismo hueco que tenían
     la receta y el diagnóstico antes de su vademécum. */
  {
    code: 'service-request-code',
    name: 'Estudio solicitado',
    description:
      'Qué estudio pide la orden: laboratorio, imagen, estudio cardiológico, anatomía patológica o procedimiento diagnóstico.',
    concepts: [
      // Laboratorio · hematología y coagulación
      CLIN.STUDY_HEMOGRAMA,
      CLIN.STUDY_VSG,
      CLIN.STUDY_GRUPO_SANGUINEO,
      CLIN.STUDY_RETICULOCITOS,
      CLIN.STUDY_FERRITINA,
      CLIN.STUDY_TIEMPO_PROTROMBINA,
      CLIN.STUDY_TIEMPO_TROMBOPLASTINA,
      CLIN.STUDY_FIBRINOGENO,
      CLIN.STUDY_DIMERO_D,
      // Laboratorio · química y metabolismo
      CLIN.STUDY_GLICEMIA,
      CLIN.STUDY_CURVA_TOLERANCIA_GLUCOSA,
      CLIN.STUDY_HEMOGLOBINA_GLICOSILADA,
      CLIN.STUDY_PERFIL_LIPIDICO,
      CLIN.STUDY_CREATININA,
      CLIN.STUDY_UREA,
      CLIN.STUDY_ACIDO_URICO,
      CLIN.STUDY_PERFIL_HEPATICO,
      CLIN.STUDY_BILIRRUBINAS,
      CLIN.STUDY_AMILASA,
      CLIN.STUDY_LIPASA,
      CLIN.STUDY_ELECTROLITOS,
      CLIN.STUDY_CALCIO,
      CLIN.STUDY_PROTEINAS_TOTALES,
      CLIN.STUDY_VITAMINA_D,
      CLIN.STUDY_VITAMINA_B12,
      // Laboratorio · hormonas
      CLIN.STUDY_PERFIL_TIROIDEO,
      CLIN.STUDY_TSH,
      CLIN.STUDY_PSA,
      CLIN.STUDY_BETA_HCG,
      CLIN.STUDY_TESTOSTERONA,
      CLIN.STUDY_CORTISOL,
      // Laboratorio · inflamación e inmunología
      CLIN.STUDY_PCR,
      CLIN.STUDY_FACTOR_REUMATOIDEO,
      CLIN.STUDY_ANTIESTREPTOLISINA,
      // Laboratorio · microbiología y serología
      CLIN.STUDY_ORINA_COMPLETA,
      CLIN.STUDY_UROCULTIVO,
      CLIN.STUDY_COPROPARASITOLOGICO,
      CLIN.STUDY_COPROCULTIVO,
      CLIN.STUDY_HEMOCULTIVO,
      CLIN.STUDY_VIH,
      CLIN.STUDY_VDRL,
      CLIN.STUDY_HEPATITIS_B,
      CLIN.STUDY_HEPATITIS_C,
      CLIN.STUDY_CHAGAS,
      CLIN.STUDY_DENGUE,
      CLIN.STUDY_GOTA_GRUESA,
      CLIN.STUDY_BACILOSCOPIA,
      // Imagen · radiología simple
      CLIN.STUDY_RX_TORAX,
      CLIN.STUDY_RX_CRANEO,
      CLIN.STUDY_RX_SENOS_PARANASALES,
      CLIN.STUDY_RX_COLUMNA_CERVICAL,
      CLIN.STUDY_RX_COLUMNA_DORSAL,
      CLIN.STUDY_RX_COLUMNA_LUMBAR,
      CLIN.STUDY_RX_ABDOMEN,
      CLIN.STUDY_RX_PELVIS,
      CLIN.STUDY_RX_MIEMBRO_SUPERIOR,
      CLIN.STUDY_RX_MIEMBRO_INFERIOR,
      // Imagen · ecografía
      CLIN.STUDY_ECO_ABDOMINAL,
      CLIN.STUDY_ECO_RENAL,
      CLIN.STUDY_ECO_PELVICA,
      CLIN.STUDY_ECO_OBSTETRICA,
      CLIN.STUDY_ECO_TIROIDES,
      CLIN.STUDY_ECO_MAMARIA,
      CLIN.STUDY_ECO_PARTES_BLANDAS,
      CLIN.STUDY_ECO_DOPPLER,
      // Imagen · tomografía, resonancia y densitometría
      CLIN.STUDY_TC_CRANEO,
      CLIN.STUDY_TC_TORAX,
      CLIN.STUDY_TC_ABDOMEN,
      CLIN.STUDY_TC_COLUMNA,
      CLIN.STUDY_RM_CEREBRAL,
      CLIN.STUDY_RM_COLUMNA,
      CLIN.STUDY_RM_ARTICULAR,
      CLIN.STUDY_MAMOGRAFIA,
      CLIN.STUDY_DENSITOMETRIA,
      // Estudios cardiológicos
      CLIN.STUDY_ELECTROCARDIOGRAMA,
      CLIN.STUDY_ECOCARDIOGRAMA,
      CLIN.STUDY_HOLTER,
      CLIN.STUDY_ERGOMETRIA,
      CLIN.STUDY_MAPA_PRESION,
      // Anatomía patológica
      CLIN.STUDY_BIOPSIA,
      CLIN.STUDY_CITOLOGIA,
      CLIN.STUDY_PAPANICOLAOU,
      // Procedimientos diagnósticos
      CLIN.STUDY_ENDOSCOPIA_ALTA,
      CLIN.STUDY_COLONOSCOPIA,
      CLIN.STUDY_ESPIROMETRIA,
      CLIN.STUDY_AUDIOMETRIA,
      CLIN.STUDY_ELECTROENCEFALOGRAMA,
      CLIN.STUDY_ELECTROMIOGRAFIA,
    ],
    // Sin preseleccionado, por lo mismo que el medicamento y el diagnóstico: un
    // estudio por omisión termina pedido —y cobrado— sin que nadie lo eligiera.
    targets: ['clinical.service_requests.code_concept_id'],
  },
  {
    code: 'service-request-category',
    name: 'Categoría del estudio',
    description:
      'A qué prestador va la orden: laboratorio de análisis, centro de imagen, anatomía patológica o procedimiento.',
    concepts: [
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
      CLIN.SERVICE_REQUEST_CATEGORY_CARDIO,
      CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
      CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
    ],
    targets: ['clinical.service_requests.category_concept_id'],
  },
  {
    code: 'service-request-intent',
    name: 'Intención de la orden',
    description:
      'Si la orden se emite para ejecutarse, se planifica para más adelante o se propone a otro profesional (HL7 FHIR request-intent).',
    concepts: [
      CLIN.SERVICE_REQUEST_INTENT_ORDER,
      CLIN.SERVICE_REQUEST_INTENT_PLAN,
      CLIN.SERVICE_REQUEST_INTENT_PROPOSAL,
    ],
    defaultConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
    targets: ['clinical.service_requests.intent_concept_id'],
  },
  {
    code: 'service-request-priority',
    name: 'Prioridad de la orden',
    description:
      'Con qué urgencia se espera el estudio (HL7 FHIR request-priority).',
    concepts: [
      CLIN.SERVICE_REQUEST_PRIORITY_ROUTINE,
      CLIN.SERVICE_REQUEST_PRIORITY_URGENT,
      CLIN.SERVICE_REQUEST_PRIORITY_ASAP,
      CLIN.SERVICE_REQUEST_PRIORITY_STAT,
    ],
    // Rutina es lo que corresponde por omisión: marcar urgente sin decidirlo
    // desordena la cola del prestador y le quita sentido a la palabra.
    defaultConceptId: CLIN.SERVICE_REQUEST_PRIORITY_ROUTINE,
    targets: ['clinical.service_requests.priority_concept_id'],
  },
  {
    code: 'service-request-status',
    name: 'Estado de la orden',
    description:
      'Ciclo de vida de la orden: borrador, activa, en espera, revocada o completada.',
    concepts: [
      CLIN.SERVICE_REQUEST_DRAFT,
      CLIN.SERVICE_REQUEST_ACTIVE,
      CLIN.SERVICE_REQUEST_ON_HOLD,
      CLIN.SERVICE_REQUEST_REVOKED,
      CLIN.SERVICE_REQUEST_COMPLETED,
    ],
    defaultConceptId: CLIN.SERVICE_REQUEST_DRAFT,
    targets: ['clinical.service_requests.status_concept_id'],
  },

  /* --- chart.clinical_note_* ------------------------------------------------
     La nota narrativa. Sus tres ejes de catálogo no estaban publicados, así que
     la pestaña «Notas» del expediente mostraba «Progress note type» y «Clinical
     note draft» tal como los nombra el code system interno —en inglés, porque es
     un catálogo—, justo donde el médico va a buscar lo que acaba de escribir. */
  {
    code: 'clinical-note-type',
    name: 'Tipo de nota',
    description: 'Qué clase de registro narrativo es la nota.',
    concepts: [CHART.NOTE_TYPE_PROGRESS],
    defaultConceptId: CHART.NOTE_TYPE_PROGRESS,
    targets: ['chart.clinical_note_headers.note_type_concept_id'],
  },
  {
    code: 'clinical-note-lifecycle',
    name: 'Estado de la nota',
    description:
      'Borrador mientras se escribe, firmada cuando su autor la sella, enmendada si se corrigió después de firmarla.',
    concepts: [
      CHART.NOTE_LIFECYCLE_DRAFT,
      CHART.NOTE_LIFECYCLE_SIGNED,
      CHART.NOTE_LIFECYCLE_AMENDED,
    ],
    defaultConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
    targets: ['chart.clinical_note_headers.lifecycle_status_concept_id'],
  },
  {
    code: 'clinical-note-patient-release',
    name: 'Visibilidad para el paciente',
    description:
      'Si la persona atendida puede leer la nota. Una nota a medio escribir no debería aparecerle mientras dura la consulta.',
    concepts: [
      CHART.RELEASE_NOT_RELEASED,
      CHART.RELEASE_RELEASED,
      CHART.RELEASE_WITHHELD,
    ],
    defaultConceptId: CHART.RELEASE_NOT_RELEASED,
    targets: ['chart.clinical_note_headers.patient_release_status_concept_id'],
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
